// Migration script to import existing puzzles into Convex database
// Run with: node scripts/migrate-puzzles.mjs

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load gameData.json
const gameDataPath = path.join(__dirname, '../src/data/gameData.json');
const gameData = JSON.parse(fs.readFileSync(gameDataPath, 'utf-8'));

// Convex client
const CONVEX_URL = "https://vivid-perch-590.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

async function migrate() {
  console.log(`Found ${gameData.length} puzzles to migrate...`);
  console.log(`Connecting to: ${CONVEX_URL}`);

  // Base URL for images - these will be served from Vercel
  const baseImageUrl = "https://rbl.quest/assets/images/";

  try {
    const result = await client.mutation(api.migration.migrateFromGameData, {
      puzzles: gameData,
      baseImageUrl,
    });

    console.log(`✓ Successfully imported ${result.imported} puzzles!`);
    console.log('\nFirst 5 imported puzzles:');
    result.puzzles.slice(0, 5).forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.answer} (${p.file})`);
    });
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
