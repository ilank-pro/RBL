import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Migration script to import puzzles from static gameData
// This should be run once to populate the database
export const migrateFromGameData = mutation({
  args: {
    puzzles: v.array(v.any()), // Accept any format
    baseImageUrl: v.string(), // e.g., "https://rbl.quest/assets/images/"
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const results = [];

    for (const puzzle of args.puzzles) {
      // Parse answers (comma-separated in the static data)
      const answers = puzzle.answer.split(',').map((a) => a.trim().toLowerCase());
      const primaryAnswer = answers[0];
      const alternateAnswers = answers.slice(1);

      // Construct the image URL from the base URL and filename
      const imageUrl = `${args.baseImageUrl}${encodeURIComponent(puzzle.file)}`;

      // Insert the puzzle with default values
      const puzzleId = await ctx.db.insert("puzzles", {
        imageUrl,
        answer: primaryAnswer,
        alternateAnswers,
        difficulty: 3, // Default medium difficulty
        category: "rebus", // Default category
        hints: [], // No hints initially
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      results.push({
        puzzleId,
        answer: primaryAnswer,
        file: puzzle.file,
      });
    }

    return {
      imported: results.length,
      puzzles: results,
    };
  },
});

// Helper to clear all puzzles (use with caution!)
export const clearAllPuzzles = mutation({
  handler: async (ctx) => {
    const puzzles = await ctx.db.query("puzzles").collect();
    for (const puzzle of puzzles) {
      // Delete storage if exists
      if (puzzle.imageId) {
        try {
          await ctx.storage.delete(puzzle.imageId);
        } catch (e) {
          // Ignore storage deletion errors
        }
      }
      await ctx.db.delete(puzzle._id);
    }
    return { deleted: puzzles.length };
  },
});
