import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

// Generate a random 6-character room code
function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed confusing chars
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Shuffle array using Fisher-Yates algorithm
function shuffleArray(array: number[]): number[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Create a new user (mock auth)
export const createUser = mutation({
  args: {
    name: v.string(),
    avatar: v.string(),
    platform: v.union(v.literal("facebook"), v.literal("instagram"), v.literal("mock")),
    metaId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.db.insert("users", {
      name: args.name,
      avatar: args.avatar,
      platform: args.platform,
      metaId: args.metaId,
    });
    return userId;
  },
});

// Get or create user by Meta ID (for Facebook/Instagram OAuth)
export const getOrCreateUser = mutation({
  args: {
    metaId: v.string(),
    name: v.string(),
    avatar: v.string(),
    platform: v.union(v.literal("facebook"), v.literal("instagram")),
  },
  handler: async (ctx, args) => {
    // Check if user with this metaId already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_metaId", (q) => q.eq("metaId", args.metaId))
      .first();

    if (existingUser) {
      // Update user info in case name/avatar changed
      await ctx.db.patch(existingUser._id, {
        name: args.name,
        avatar: args.avatar,
        platform: args.platform,
      });
      return existingUser._id;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      metaId: args.metaId,
      name: args.name,
      avatar: args.avatar,
      platform: args.platform,
    });
    return userId;
  },
});

// Create a new room
export const createRoom = mutation({
  args: {
    hostId: v.id("users"),
    totalRounds: v.number(),
    totalPuzzles: v.number(),
  },
  handler: async (ctx, args) => {
    // Generate unique room code
    let code = generateRoomCode();
    let existing = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();

    while (existing) {
      code = generateRoomCode();
      existing = await ctx.db
        .query("rooms")
        .withIndex("by_code", (q) => q.eq("code", code))
        .first();
    }

    // Create shuffled puzzle order
    const puzzleIndices = Array.from({ length: args.totalPuzzles }, (_, i) => i);
    const puzzleOrder = shuffleArray(puzzleIndices).slice(0, args.totalRounds);

    const roomId = await ctx.db.insert("rooms", {
      code,
      hostId: args.hostId,
      status: "waiting",
      currentPuzzleIndex: 0,
      puzzleOrder,
      hostScore: 0,
      guestScore: 0,
      totalRounds: args.totalRounds,
      createdAt: Date.now(),
    });

    return { roomId, code };
  },
});

// Join a room as guest
export const joinRoom = mutation({
  args: {
    code: v.string(),
    guestId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();

    if (!room) {
      throw new ConvexError("Room not found. Please check the code and try again.");
    }

    if (room.status !== "waiting") {
      throw new ConvexError("This game has already started.");
    }

    if (room.guestId) {
      throw new ConvexError("Room is full. Someone else already joined.");
    }

    await ctx.db.patch(room._id, {
      guestId: args.guestId,
    });

    return room._id;
  },
});

// Start the game
export const startGame = mutation({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");
    if (!room.guestId) throw new Error("Waiting for opponent");
    if (room.status !== "waiting") throw new Error("Game already started");

    await ctx.db.patch(args.roomId, {
      status: "playing",
      currentPuzzleIndex: 0,
    });

    // Create first round
    await ctx.db.insert("rounds", {
      roomId: args.roomId,
      puzzleIndex: room.puzzleOrder[0],
      startedAt: Date.now(),
    });

    return true;
  },
});

// Get room by code
export const getRoomByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();
  },
});

// Get room by ID with user data
export const getRoom = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) return null;

    const host = await ctx.db.get(room.hostId);
    const guest = room.guestId ? await ctx.db.get(room.guestId) : null;

    return {
      ...room,
      host,
      guest,
    };
  },
});

// Get user by ID
export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});
