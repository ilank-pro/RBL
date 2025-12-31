import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    avatar: v.string(),
    platform: v.union(v.literal("facebook"), v.literal("instagram"), v.literal("mock")),
    metaId: v.optional(v.string()),
  }).index("by_metaId", ["metaId"]),

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
