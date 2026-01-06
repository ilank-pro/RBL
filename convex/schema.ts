import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    avatar: v.string(),
    platform: v.union(
      v.literal("facebook"),
      v.literal("instagram"),
      v.literal("mock"),
      v.literal("google.com"),
      v.literal("facebook.com"),
      v.literal("apple.com"),
      v.literal("guest")
    ),
    metaId: v.optional(v.string()), // Legacy: Meta platform ID
    firebaseUid: v.optional(v.string()), // Firebase Auth UID
    // Monetization fields
    tier: v.optional(v.union(
      v.literal("free"),
      v.literal("bronze"),
      v.literal("gold"),
      v.literal("platinum")
    )),
    tierPurchasedAt: v.optional(v.number()),
    coins: v.optional(v.number()),
    lastCoinBonusAt: v.optional(v.number()),
    totalCoinsEarned: v.optional(v.number()),
    totalCoinsSpent: v.optional(v.number()),
    lastDailyLoginAt: v.optional(v.number()),
    // Stripe fields
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    subscriptionStatus: v.optional(v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("past_due"),
      v.literal("incomplete")
    )),
  })
    .index("by_metaId", ["metaId"])
    .index("by_firebaseUid", ["firebaseUid"])
    .index("by_stripeCustomerId", ["stripeCustomerId"]),

  transactions: defineTable({
    userId: v.id("users"),
    type: v.union(v.literal("purchase"), v.literal("earn"), v.literal("spend")),
    amount: v.number(),
    reason: v.string(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  rooms: defineTable({
    code: v.string(),
    hostId: v.id("users"),
    guestId: v.optional(v.id("users")),
    status: v.union(v.literal("waiting"), v.literal("playing"), v.literal("finished")),
    currentPuzzleIndex: v.number(),
    puzzleOrder: v.array(v.number()), // Shuffled puzzle indices
    hostScore: v.number(),
    guestScore: v.number(),
    roundWinner: v.optional(v.union(v.literal("host"), v.literal("guest"))),
    totalRounds: v.number(),
    createdAt: v.number(),
    // Emoji reaction fields
    lastEmoji: v.optional(v.string()),
    lastEmojiFrom: v.optional(v.union(v.literal("host"), v.literal("guest"))),
    lastEmojiAt: v.optional(v.number()),
    // Give up fields
    hostGaveUp: v.optional(v.boolean()),
    guestGaveUp: v.optional(v.boolean()),
    // Game settings (based on host tier)
    timePerCard: v.optional(v.number()), // seconds (30-300)
    hostSkipsRemaining: v.optional(v.number()),
    guestSkipsRemaining: v.optional(v.number()),
    // Hint tracking per game
    hostHintsUsed: v.optional(v.number()),
    guestHintsUsed: v.optional(v.number()),
  }).index("by_code", ["code"]),

  rounds: defineTable({
    roomId: v.id("rooms"),
    puzzleIndex: v.number(),
    winnerId: v.optional(v.id("users")),
    hostAnswer: v.optional(v.string()),
    guestAnswer: v.optional(v.string()),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
  }).index("by_room", ["roomId"]),

  puzzles: defineTable({
    imageId: v.optional(v.id("_storage")), // Convex file storage ID (optional for URL-based images)
    imageUrl: v.string(), // URL for display (either from storage or external)
    answer: v.string(), // Primary answer
    alternateAnswers: v.array(v.string()), // Other valid answers
    difficulty: v.number(), // 1-5
    category: v.string(), // rebus, symbols, puzzles, sequence, Contextual, Dingbats
    hints: v.array(
      v.object({
        text: v.string(),
        score: v.number(), // 1-5 (1=small hint, 5=big hint)
      })
    ),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    // Pack/batch fields for grouped uploads
    packId: v.optional(v.string()), // UUID linking puzzles from same bulk upload
    packName: v.optional(v.string()), // Display name for the pack
  })
    .index("by_category", ["category"])
    .index("by_difficulty", ["difficulty"])
    .index("by_active", ["isActive"])
    .index("by_pack", ["packId"]),
});
