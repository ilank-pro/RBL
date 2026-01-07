import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Stripe price IDs - these will be set up in Stripe Dashboard
// For now using placeholders - replace with actual Stripe price IDs
const STRIPE_PRICES = {
  // Subscription tiers (monthly)
  bronze: process.env.STRIPE_PRICE_BRONZE || "price_bronze",
  gold: process.env.STRIPE_PRICE_GOLD || "price_gold",
  platinum: process.env.STRIPE_PRICE_PLATINUM || "price_platinum",
  // Coin packs (one-time)
  coins_small: process.env.STRIPE_PRICE_COINS_SMALL || "price_coins_small",
  coins_medium: process.env.STRIPE_PRICE_COINS_MEDIUM || "price_coins_medium",
  coins_large: process.env.STRIPE_PRICE_COINS_LARGE || "price_coins_large",
  coins_mega: process.env.STRIPE_PRICE_COINS_MEGA || "price_coins_mega",
};

// Coin amounts for each pack
const COIN_PACKS = {
  coins_small: 100,
  coins_medium: 350,
  coins_large: 700,
  coins_mega: 1600,
};

// Initial coins granted when upgrading to a tier
const TIER_INITIAL_COINS = {
  bronze: 50,
  gold: 150,
  platinum: 300,
};

// Create a Stripe checkout session
export const createCheckoutSession = action({
  args: {
    userId: v.id("users"),
    priceType: v.union(
      v.literal("bronze"),
      v.literal("gold"),
      v.literal("platinum"),
      v.literal("coins_small"),
      v.literal("coins_medium"),
      v.literal("coins_large"),
      v.literal("coins_mega")
    ),
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    });

    // Get the user
    const user = await ctx.runQuery(api.rooms.getUser, { userId: args.userId });
    if (!user) {
      throw new Error("User not found");
    }

    // Get or create Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: {
          convexUserId: args.userId,
          firebaseUid: user.firebaseUid || "",
        },
      });
      customerId = customer.id;

      // Save the Stripe customer ID
      await ctx.runMutation(api.payments.updateStripeCustomerId, {
        userId: args.userId,
        stripeCustomerId: customerId,
      });
    }

    const priceId = STRIPE_PRICES[args.priceType];
    const isSubscription = ["bronze", "gold", "platinum"].includes(args.priceType);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: isSubscription ? "subscription" : "payment",
      success_url: args.successUrl,
      cancel_url: args.cancelUrl,
      metadata: {
        convexUserId: args.userId,
        priceType: args.priceType,
      },
    });

    return { url: session.url };
  },
});

// Update user's Stripe customer ID
export const updateStripeCustomerId = mutation({
  args: {
    userId: v.id("users"),
    stripeCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      stripeCustomerId: args.stripeCustomerId,
    });
  },
});

// Handle successful subscription
export const handleSubscriptionSuccess = mutation({
  args: {
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    tier: v.union(v.literal("bronze"), v.literal("gold"), v.literal("platinum")),
  },
  handler: async (ctx, args) => {
    // Find user by Stripe customer ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_stripeCustomerId", (q) => q.eq("stripeCustomerId", args.stripeCustomerId))
      .first();

    if (!user) {
      console.error("User not found for Stripe customer:", args.stripeCustomerId);
      return { success: false };
    }

    // Update user tier and grant initial coins
    const initialCoins = TIER_INITIAL_COINS[args.tier] || 0;
    const currentCoins = user.coins || 0;

    await ctx.db.patch(user._id, {
      tier: args.tier,
      stripeSubscriptionId: args.stripeSubscriptionId,
      subscriptionStatus: "active",
      tierPurchasedAt: Date.now(),
      coins: currentCoins + initialCoins,
      totalCoinsEarned: (user.totalCoinsEarned || 0) + initialCoins,
    });

    // Log the transaction
    await ctx.db.insert("transactions", {
      userId: user._id,
      type: "earn",
      amount: initialCoins,
      reason: `Tier upgrade to ${args.tier} - initial bonus`,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Handle subscription cancellation
export const handleSubscriptionCanceled = mutation({
  args: {
    stripeCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_stripeCustomerId", (q) => q.eq("stripeCustomerId", args.stripeCustomerId))
      .first();

    if (!user) {
      console.error("User not found for Stripe customer:", args.stripeCustomerId);
      return { success: false };
    }

    // Downgrade to free tier
    await ctx.db.patch(user._id, {
      tier: "free",
      subscriptionStatus: "canceled",
    });

    return { success: true };
  },
});

// Handle coin purchase
export const handleCoinPurchase = mutation({
  args: {
    stripeCustomerId: v.string(),
    coinPack: v.union(
      v.literal("coins_small"),
      v.literal("coins_medium"),
      v.literal("coins_large"),
      v.literal("coins_mega")
    ),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_stripeCustomerId", (q) => q.eq("stripeCustomerId", args.stripeCustomerId))
      .first();

    if (!user) {
      console.error("User not found for Stripe customer:", args.stripeCustomerId);
      return { success: false };
    }

    const coinsToAdd = COIN_PACKS[args.coinPack] || 0;
    const currentCoins = user.coins || 0;

    await ctx.db.patch(user._id, {
      coins: currentCoins + coinsToAdd,
      totalCoinsEarned: (user.totalCoinsEarned || 0) + coinsToAdd,
    });

    // Log the transaction
    await ctx.db.insert("transactions", {
      userId: user._id,
      type: "purchase",
      amount: coinsToAdd,
      reason: `Purchased ${args.coinPack} coin pack`,
      createdAt: Date.now(),
    });

    return { success: true, coinsAdded: coinsToAdd };
  },
});

// Get user's subscription status
export const getSubscriptionStatus = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    return {
      tier: user.tier || "free",
      subscriptionStatus: user.subscriptionStatus,
      stripeSubscriptionId: user.stripeSubscriptionId,
    };
  },
});

// Create Stripe billing portal session for subscription management
export const createBillingPortalSession = action({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    });

    // Get the user
    const user = await ctx.runQuery(api.rooms.getUser, { userId: args.userId });
    if (!user) {
      throw new Error("User not found");
    }

    if (!user.stripeCustomerId) {
      throw new Error("No Stripe customer found for this user");
    }

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: process.env.SITE_URL || "https://rbl.quest/",
    });

    return { url: session.url };
  },
});
