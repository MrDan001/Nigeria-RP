// Rebuild the original TypeScript entry point from ordered source fragments.
// This is byte-preserving concatenation: it does not alter server runtime code.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const parts = [
  "src/server-source/01-server-foundation.ts.part",
  "src/server-source/02-player-and-world-persistence.ts.part",
  "src/server-source/03-workplace-services-and-actions.ts.part",
  "src/server-source/04-lifecycle-sync-and-runtime.ts.part",
];
const source = parts.map((part) => readFileSync(path.join(root, part), "utf8")).join("");
if (Buffer.byteLength(source, "utf8") < 300000) throw new Error("Server source assembly is unexpectedly short.");
writeFileSync(path.join(root, "src", "server.ts"), source, "utf8");
console.log("Assembled server.ts from " + parts.length + " source fragments (" + Buffer.byteLength(source, "utf8") + " bytes).");
