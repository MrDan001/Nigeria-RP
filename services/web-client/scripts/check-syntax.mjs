// Syntax check for the browser client (plain JavaScript, no bundler step).
// Checks ordered source fragments, their generated classic-script assets, online code, and other HTML inline scripts.
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let failed = false;

function check(label, code) {
  try {
    new vm.Script(code, { filename: label });
    console.log("ok   " + label);
  } catch (error) {
    failed = true;
    console.error("FAIL " + label + "\n     " + error.message);
  }
}

check("public/nrs-online.js", readFileSync(path.join(root, "public/nrs-online.js"), "utf8"));
check("public/nrs-tablet.js", readFileSync(path.join(root, "public/nrs-tablet.js"), "utf8"));

const gameSourceParts = [
  "game-source/01-world-foundation.js.part",
  "game-source/02-controls-and-city-architecture.js.part",
  "game-source/03a-traffic-and-interiors.js.part",
  "game-source/03b-careers-and-city-services.js.part",
  "game-source/04a-news-market-and-hospital.js.part",
  "game-source/04b-government-finance-and-navigation.js.part",
  "game-source/04c-hud-fuel-and-runtime.js.part",
];
const assembledGameSource = gameSourceParts.map((part) => readFileSync(path.join(root, part), "utf8")).join("");
check("assembled game source", assembledGameSource);
for (let part = 1; part <= 7; part += 1) {
  const asset = "nrs-game-" + String(part).padStart(2, "0") + ".js";
  check("public/" + asset, readFileSync(path.join(root, "public", asset), "utf8"));
}

for (const page of ["index.html", "index-multiplayer-lab.html"]) {
  const html = readFileSync(path.join(root, page), "utf8");
  const scripts = [...html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
  scripts.forEach((match, i) => check(page + " inline script " + (i + 1), match[1]));
}

if (failed) process.exit(1);
