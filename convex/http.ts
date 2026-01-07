import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// Stripe webhook endpoint
http.route({
  path: "/stripe-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    });

    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return new Response("Missing stripe-signature header", { status: 400 });
    }

    const body = await request.text();

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const customerId = session.customer as string;
        const priceType = session.metadata?.priceType;

        if (["bronze", "gold", "platinum"].includes(priceType)) {
          // Subscription purchase
          await ctx.runMutation(api.payments.handleSubscriptionSuccess, {
            stripeCustomerId: customerId,
            stripeSubscriptionId: session.subscription as string,
            tier: priceType as "bronze" | "gold" | "platinum",
          });
        } else if (priceType?.startsWith("coins_")) {
          // Coin pack purchase
          await ctx.runMutation(api.payments.handleCoinPurchase, {
            stripeCustomerId: customerId,
            coinPack: priceType as "coins_small" | "coins_medium" | "coins_large" | "coins_mega",
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as any;
        const customerId = subscription.customer as string;

        if (subscription.status === "active") {
          // Subscription renewed or updated
          console.log("Subscription updated for customer:", customerId);
        } else if (subscription.status === "past_due") {
          // Payment failed
          console.log("Subscription past due for customer:", customerId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;
        const customerId = subscription.customer as string;

        // Subscription canceled
        await ctx.runMutation(api.payments.handleSubscriptionCanceled, {
          stripeCustomerId: customerId,
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        console.log("Payment failed for invoice:", invoice.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
