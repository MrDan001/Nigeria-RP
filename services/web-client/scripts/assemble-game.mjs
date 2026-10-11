// Rebuild the single classic-script game bundle from ordered source fragments.
// Do not load the fragments separately: keeping one script preserves the existing
// global lexical scope, declaration hoisting, and initialization order.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const parts = [
  "game-source/01-world-foundation.js.part",
  "game-source/02-controls-and-city-architecture.js.part",
  "game-source/03-traffic-homes-and-careers.js.part",
  "game-source/04-news-menus-navigation-and-runtime.js.part"
];
const source = parts.map((part) => readFileSync(path.join(root, part), "utf8")).join("");
if (!source.length) throw new Error("Game source segments assembled to an empty file.");
const output = path.join(root, "public", "nrs-game.js");
writeFileSync(output, source, "utf8");
console.log("Assembled public/nrs-game.js from " + parts.length + " source segments (" + source.length + " characters).");
