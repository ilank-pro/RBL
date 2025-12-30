import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    avatar: v.string(),
    platform: v.union(v.literal("facebook"), v.literal("instagram"), v.literal("mock")),
    metaId: v.optional(v.string()),
  }),

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
});
