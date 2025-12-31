import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Generate upload URL for Convex file storage
export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

// Get storage URL from storage ID
export const getStorageUrl = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

// Create a single puzzle
export const createPuzzle = mutation({
  args: {
    imageId: v.optional(v.id("_storage")),
    imageUrl: v.string(),
    answer: v.string(),
    alternateAnswers: v.array(v.string()),
    difficulty: v.number(),
    category: v.string(),
    hints: v.array(
      v.object({
        text: v.string(),
        score: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const puzzleId = await ctx.db.insert("puzzles", {
      imageId: args.imageId,
      imageUrl: args.imageUrl,
      answer: args.answer.toLowerCase().trim(),
      alternateAnswers: args.alternateAnswers.map((a) => a.toLowerCase().trim()),
      difficulty: args.difficulty,
      category: args.category,
      hints: args.hints,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    return puzzleId;
  },
});

// Bulk create puzzles
export const createPuzzles = mutation({
  args: {
    puzzles: v.array(
      v.object({
        imageId: v.optional(v.id("_storage")),
        imageUrl: v.string(),
        answer: v.string(),
        alternateAnswers: v.array(v.string()),
        difficulty: v.number(),
        category: v.string(),
        hints: v.array(
          v.object({
            text: v.string(),
            score: v.number(),
          })
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const puzzleIds = [];
    for (const puzzle of args.puzzles) {
      const puzzleId = await ctx.db.insert("puzzles", {
        imageId: puzzle.imageId,
        imageUrl: puzzle.imageUrl,
        answer: puzzle.answer.toLowerCase().trim(),
        alternateAnswers: puzzle.alternateAnswers.map((a) => a.toLowerCase().trim()),
        difficulty: puzzle.difficulty,
        category: puzzle.category,
        hints: puzzle.hints,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      puzzleIds.push(puzzleId);
    }
    return puzzleIds;
  },
});

// Update a puzzle
export const updatePuzzle = mutation({
  args: {
    puzzleId: v.id("puzzles"),
    imageId: v.optional(v.id("_storage")),
    imageUrl: v.optional(v.string()),
    answer: v.optional(v.string()),
    alternateAnswers: v.optional(v.array(v.string())),
    difficulty: v.optional(v.number()),
    category: v.optional(v.string()),
    hints: v.optional(
      v.array(
        v.object({
          text: v.string(),
          score: v.number(),
        })
      )
    ),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { puzzleId, ...updates } = args;
    const puzzle = await ctx.db.get(puzzleId);
    if (!puzzle) {
      throw new Error("Puzzle not found");
    }

    const updateData: Record<string, unknown> = { updatedAt: Date.now() };

    if (updates.imageId !== undefined) updateData.imageId = updates.imageId;
    if (updates.imageUrl !== undefined) updateData.imageUrl = updates.imageUrl;
    if (updates.answer !== undefined) updateData.answer = updates.answer.toLowerCase().trim();
    if (updates.alternateAnswers !== undefined) {
      updateData.alternateAnswers = updates.alternateAnswers.map((a) => a.toLowerCase().trim());
    }
    if (updates.difficulty !== undefined) updateData.difficulty = updates.difficulty;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.hints !== undefined) updateData.hints = updates.hints;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;

    await ctx.db.patch(puzzleId, updateData);
    return puzzleId;
  },
});

// Delete a puzzle
export const deletePuzzle = mutation({
  args: { puzzleId: v.id("puzzles") },
  handler: async (ctx, args) => {
    const puzzle = await ctx.db.get(args.puzzleId);
    if (!puzzle) {
      throw new Error("Puzzle not found");
    }

    // Delete associated storage file if exists
    if (puzzle.imageId) {
      await ctx.storage.delete(puzzle.imageId);
    }

    await ctx.db.delete(args.puzzleId);
    return true;
  },
});

// Toggle puzzle active status
export const togglePuzzleActive = mutation({
  args: { puzzleId: v.id("puzzles") },
  handler: async (ctx, args) => {
    const puzzle = await ctx.db.get(args.puzzleId);
    if (!puzzle) {
      throw new Error("Puzzle not found");
    }

    await ctx.db.patch(args.puzzleId, {
      isActive: !puzzle.isActive,
      updatedAt: Date.now(),
    });
    return !puzzle.isActive;
  },
});

// List all puzzles (with optional filters)
export const listPuzzles = query({
  args: {
    category: v.optional(v.string()),
    difficulty: v.optional(v.number()),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let puzzles;

    if (args.activeOnly) {
      puzzles = await ctx.db
        .query("puzzles")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .collect();
    } else if (args.category) {
      puzzles = await ctx.db
        .query("puzzles")
        .withIndex("by_category", (q) => q.eq("category", args.category))
        .collect();
    } else if (args.difficulty) {
      puzzles = await ctx.db
        .query("puzzles")
        .withIndex("by_difficulty", (q) => q.eq("difficulty", args.difficulty))
        .collect();
    } else {
      puzzles = await ctx.db.query("puzzles").collect();
    }

    return puzzles;
  },
});

// Get a single puzzle by ID
export const getPuzzle = query({
  args: { puzzleId: v.id("puzzles") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.puzzleId);
  },
});

// Get only active puzzles for gameplay
export const getActivePuzzles = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("puzzles")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
  },
});

// Get puzzle count
export const getPuzzleCount = query({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    if (args.activeOnly) {
      const puzzles = await ctx.db
        .query("puzzles")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .collect();
      return puzzles.length;
    }
    const puzzles = await ctx.db.query("puzzles").collect();
    return puzzles.length;
  },
});
