import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Submit an answer
export const submitAnswer = mutation({
  args: {
    roomId: v.id("rooms"),
    oderId: v.id("users"),
    answer: v.string(),
    isHost: v.boolean(),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");
    if (room.status !== "playing") throw new Error("Game not in progress");

    // Get current round
    const rounds = await ctx.db
      .query("rounds")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    const currentRound = rounds.find(
      (r) => r.puzzleIndex === room.puzzleOrder[room.currentPuzzleIndex]
    );

    if (!currentRound) throw new Error("Round not found");
    if (currentRound.winnerId) throw new Error("Round already won");

    // Record the answer
    const updateData = args.isHost
      ? { hostAnswer: args.answer }
      : { guestAnswer: args.answer };

    await ctx.db.patch(currentRound._id, updateData);

    return { recorded: true, wasCorrect: false, wonRound: false };
  },
});

// Check if answer is correct and award point
export const checkAnswer = mutation({
  args: {
    roomId: v.id("rooms"),
    playerId: v.id("users"),
    answer: v.string(),
    isHost: v.boolean(),
    correctAnswers: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");
    if (room.status !== "playing") throw new Error("Game not in progress");

    // Normalize answer for comparison
    const normalizedAnswer = args.answer.toLowerCase().trim().replace(/\s+/g, "");
    const normalizedCorrect = args.correctAnswers.map((a) =>
      a.toLowerCase().trim().replace(/\s+/g, "")
    );

    const isCorrect = normalizedCorrect.includes(normalizedAnswer);

    if (!isCorrect) {
      return { correct: false, wonRound: false };
    }

    // Get current round
    const rounds = await ctx.db
      .query("rounds")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    const currentRound = rounds.find(
      (r) => r.puzzleIndex === room.puzzleOrder[room.currentPuzzleIndex]
    );

    if (!currentRound) throw new Error("Round not found");

    // If round already won, return
    if (currentRound.winnerId) {
      return { correct: true, wonRound: false, alreadyWon: true };
    }

    // Mark round as won
    await ctx.db.patch(currentRound._id, {
      winnerId: args.playerId,
      endedAt: Date.now(),
      ...(args.isHost ? { hostAnswer: args.answer } : { guestAnswer: args.answer }),
    });

    // Update score
    const scoreUpdate = args.isHost
      ? { hostScore: room.hostScore + 1, roundWinner: "host" as const }
      : { guestScore: room.guestScore + 1, roundWinner: "guest" as const };

    await ctx.db.patch(args.roomId, scoreUpdate);

    return { correct: true, wonRound: true };
  },
});

// Move to next round
export const nextRound = mutation({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");

    const nextIndex = room.currentPuzzleIndex + 1;

    // Check if game is over
    if (nextIndex >= room.totalRounds) {
      await ctx.db.patch(args.roomId, {
        status: "finished",
        roundWinner: undefined,
      });
      return { gameOver: true };
    }

    // Move to next puzzle
    await ctx.db.patch(args.roomId, {
      currentPuzzleIndex: nextIndex,
      roundWinner: undefined,
    });

    // Create new round
    await ctx.db.insert("rounds", {
      roomId: args.roomId,
      puzzleIndex: room.puzzleOrder[nextIndex],
      startedAt: Date.now(),
    });

    return { gameOver: false, nextPuzzleIndex: room.puzzleOrder[nextIndex] };
  },
});

// Skip round (time ran out)
export const skipRound = mutation({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");

    // Get current round and mark as ended
    const rounds = await ctx.db
      .query("rounds")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    const currentRound = rounds.find(
      (r) => r.puzzleIndex === room.puzzleOrder[room.currentPuzzleIndex]
    );

    if (currentRound && !currentRound.endedAt) {
      await ctx.db.patch(currentRound._id, {
        endedAt: Date.now(),
      });
    }

    // Move to next round
    const nextIndex = room.currentPuzzleIndex + 1;

    if (nextIndex >= room.totalRounds) {
      await ctx.db.patch(args.roomId, {
        status: "finished",
        roundWinner: undefined,
      });
      return { gameOver: true };
    }

    await ctx.db.patch(args.roomId, {
      currentPuzzleIndex: nextIndex,
      roundWinner: undefined,
    });

    await ctx.db.insert("rounds", {
      roomId: args.roomId,
      puzzleIndex: room.puzzleOrder[nextIndex],
      startedAt: Date.now(),
    });

    return { gameOver: false, nextPuzzleIndex: room.puzzleOrder[nextIndex] };
  },
});

// Get current game state
export const getGameState = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) return null;

    const host = await ctx.db.get(room.hostId);
    const guest = room.guestId ? await ctx.db.get(room.guestId) : null;

    // Get current puzzle index from shuffled order
    const currentPuzzleDataIndex = room.puzzleOrder[room.currentPuzzleIndex];

    return {
      roomId: room._id,
      status: room.status,
      currentRound: room.currentPuzzleIndex + 1,
      totalRounds: room.totalRounds,
      currentPuzzleIndex: currentPuzzleDataIndex,
      hostScore: room.hostScore,
      guestScore: room.guestScore,
      roundWinner: room.roundWinner,
      host: host ? { id: host._id, name: host.name, avatar: host.avatar } : null,
      guest: guest ? { id: guest._id, name: guest.name, avatar: guest.avatar } : null,
    };
  },
});
