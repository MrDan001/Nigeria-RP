// Syntax check for the browser client (plain JavaScript, no bundler step).
// Parses public/nrs-online.js and every inline <script> in the HTML pages so a
// stray brace or typo fails CI instead of silently breaking the game in the browser.
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

for (const page of ["index.html", "index-multiplayer-lab.html"]) {
  const html = readFileSync(path.join(root, page), "utf8");
  const scripts = [...html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
  scripts.forEach((match, i) => check(page + " inline script " + (i + 1), match[1]));
}

if (failed) process.exit(1);
