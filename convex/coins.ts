import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Coin costs for hints based on level
export const HINT_COSTS = {
  1: 5,   // Level 1: 5 coins
  2: 10,  // Level 2: 10 coins
  3: 20,  // Level 3: 20 coins
  4: 35,  // Level 4: 35 coins
  5: 50,  // Level 5: 50 coins
} as const;

// Coin rewards for actions
export const COIN_REWARDS = {
  WIN_GAME: 15,
  LOSE_GAME: 5,
  DAILY_LOGIN: 10,
  WATCH_AD: 20,
  INVITE_FRIEND: 100,
  STREAK_5_GAMES: 50,
} as const;

// Initial coins by tier
export const TIER_INITIAL_COINS = {
  free: 50,
  bronze: 200,
  gold: 500,
  platinum: 1000,
} as const;

// Monthly bonus coins by tier
export const TIER_MONTHLY_BONUS = {
  free: 0,
  bronze: 50,
  gold: 150,
  platinum: 300,
} as const;

// Get user's coin balance
export const getBalance = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user?.coins ?? 0;
  },
});

// Get user's tier
export const getTier = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user?.tier ?? "free";
  },
});

// Get user's monetization info
export const getUserMonetization = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    return {
      tier: user.tier ?? "free",
      coins: user.coins ?? 0,
      tierPurchasedAt: user.tierPurchasedAt,
      lastCoinBonusAt: user.lastCoinBonusAt,
      totalCoinsEarned: user.totalCoinsEarned ?? 0,
      totalCoinsSpent: user.totalCoinsSpent ?? 0,
    };
  },
});

// Earn coins (for wins, daily login, etc.)
export const earnCoins = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const currentCoins = user.coins ?? 0;
    const totalEarned = user.totalCoinsEarned ?? 0;

    // Update user's coins
    await ctx.db.patch(args.userId, {
      coins: currentCoins + args.amount,
      totalCoinsEarned: totalEarned + args.amount,
    });

    // Log transaction
    await ctx.db.insert("transactions", {
      userId: args.userId,
      type: "earn",
      amount: args.amount,
      reason: args.reason,
      createdAt: Date.now(),
    });

    return { newBalance: currentCoins + args.amount };
  },
});

// Spend coins (for hints, etc.)
export const spendCoins = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const currentCoins = user.coins ?? 0;

    if (currentCoins < args.amount) {
      return { success: false, error: "insufficient_coins", balance: currentCoins };
    }

    const totalSpent = user.totalCoinsSpent ?? 0;

    // Update user's coins
    await ctx.db.patch(args.userId, {
      coins: currentCoins - args.amount,
      totalCoinsSpent: totalSpent + args.amount,
    });

    // Log transaction
    await ctx.db.insert("transactions", {
      userId: args.userId,
      type: "spend",
      amount: -args.amount,
      reason: args.reason,
      createdAt: Date.now(),
    });

    return { success: true, newBalance: currentCoins - args.amount };
  },
});

// Check and grant daily login bonus
export const claimDailyBonus = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const now = Date.now();
    const lastLogin = user.lastDailyLoginAt ?? 0;
    const oneDayMs = 24 * 60 * 60 * 1000;

    // Check if 24 hours have passed since last claim
    if (now - lastLogin < oneDayMs) {
      const timeRemaining = oneDayMs - (now - lastLogin);
      return {
        success: false,
        error: "already_claimed",
        timeRemaining,
      };
    }

    const currentCoins = user.coins ?? 0;
    const totalEarned = user.totalCoinsEarned ?? 0;
    const bonus = COIN_REWARDS.DAILY_LOGIN;

    // Update user
    await ctx.db.patch(args.userId, {
      coins: currentCoins + bonus,
      totalCoinsEarned: totalEarned + bonus,
      lastDailyLoginAt: now,
    });

    // Log transaction
    await ctx.db.insert("transactions", {
      userId: args.userId,
      type: "earn",
      amount: bonus,
      reason: "daily_login",
      createdAt: now,
    });

    return { success: true, coinsEarned: bonus, newBalance: currentCoins + bonus };
  },
});

// Check and grant monthly tier bonus
export const claimMonthlyBonus = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const tier = user.tier ?? "free";
    const bonus = TIER_MONTHLY_BONUS[tier];

    if (bonus === 0) {
      return { success: false, error: "free_tier_no_bonus" };
    }

    const now = Date.now();
    const lastBonus = user.lastCoinBonusAt ?? 0;
    const oneMonthMs = 30 * 24 * 60 * 60 * 1000;

    // Check if 30 days have passed
    if (now - lastBonus < oneMonthMs) {
      const timeRemaining = oneMonthMs - (now - lastBonus);
      return {
        success: false,
        error: "not_yet_available",
        timeRemaining,
      };
    }

    const currentCoins = user.coins ?? 0;
    const totalEarned = user.totalCoinsEarned ?? 0;

    // Update user
    await ctx.db.patch(args.userId, {
      coins: currentCoins + bonus,
      totalCoinsEarned: totalEarned + bonus,
      lastCoinBonusAt: now,
    });

    // Log transaction
    await ctx.db.insert("transactions", {
      userId: args.userId,
      type: "earn",
      amount: bonus,
      reason: "monthly_tier_bonus",
      createdAt: now,
    });

    return { success: true, coinsEarned: bonus, newBalance: currentCoins + bonus };
  },
});

// Upgrade user tier (called after successful payment)
export const upgradeTier = mutation({
  args: {
    userId: v.id("users"),
    newTier: v.union(v.literal("bronze"), v.literal("gold"), v.literal("platinum")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const currentCoins = user.coins ?? 0;
    const currentTier = user.tier ?? "free";

    // Calculate bonus coins (difference from current tier)
    const currentTierCoins = TIER_INITIAL_COINS[currentTier];
    const newTierCoins = TIER_INITIAL_COINS[args.newTier];
    const bonusCoins = Math.max(0, newTierCoins - currentTierCoins);

    const now = Date.now();
    const totalEarned = user.totalCoinsEarned ?? 0;

    // Update user
    await ctx.db.patch(args.userId, {
      tier: args.newTier,
      tierPurchasedAt: now,
      coins: currentCoins + bonusCoins,
      totalCoinsEarned: totalEarned + bonusCoins,
      lastCoinBonusAt: now, // Reset monthly bonus timer
    });

    // Log transaction for bonus coins
    if (bonusCoins > 0) {
      await ctx.db.insert("transactions", {
        userId: args.userId,
        type: "purchase",
        amount: bonusCoins,
        reason: `tier_upgrade_${args.newTier}`,
        createdAt: now,
      });
    }

    return {
      success: true,
      newTier: args.newTier,
      bonusCoins,
      newBalance: currentCoins + bonusCoins,
    };
  },
});

// Purchase coins (called after successful payment)
export const purchaseCoins = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    packName: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const currentCoins = user.coins ?? 0;
    const totalEarned = user.totalCoinsEarned ?? 0;

    // Update user
    await ctx.db.patch(args.userId, {
      coins: currentCoins + args.amount,
      totalCoinsEarned: totalEarned + args.amount,
    });

    // Log transaction
    await ctx.db.insert("transactions", {
      userId: args.userId,
      type: "purchase",
      amount: args.amount,
      reason: `coin_pack_${args.packName}`,
      createdAt: Date.now(),
    });

    return { success: true, newBalance: currentCoins + args.amount };
  },
});

// Get transaction history
export const getTransactionHistory = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    return transactions;
  },
});
