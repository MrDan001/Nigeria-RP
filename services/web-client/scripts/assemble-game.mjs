// Generate separate classic-script assets from ordered source fragments.
// Classic scripts load in order and share the same global lexical environment.
// Fragments are never wrapped or rewritten, preserving initialization order.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const files = [
  { source: "game-source/01-world-foundation.js.part", output: "public/nrs-game-01.js" },
  { source: "game-source/02-controls-and-city-architecture.js.part", output: "public/nrs-game-02.js" },
  { source: "game-source/03a-traffic-and-interiors.js.part", output: "public/nrs-game-03.js" },
  { source: "game-source/03b-careers-and-city-services.js.part", output: "public/nrs-game-04.js" },
  { source: "game-source/04a-news-market-and-hospital.js.part", output: "public/nrs-game-05.js" },
  { source: "game-source/04b-government-finance-and-navigation.js.part", output: "public/nrs-game-06.js" },
  { source: "game-source/04c-hud-fuel-and-runtime.js.part", output: "public/nrs-game-07.js" },
];
for (const file of files) {
  const source = readFileSync(path.join(root, file.source), "utf8");
  const bytes = Buffer.byteLength(source, "utf8");
  if (bytes >= 100000) throw new Error(file.source + " exceeds the 100 KB source-file limit (" + bytes + " bytes).");
  writeFileSync(path.join(root, file.output), source, "utf8");
  console.log("Generated " + file.output + " (" + bytes + " bytes).");
}
