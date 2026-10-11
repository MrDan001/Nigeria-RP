import assert from "node:assert/strict";
import { stage15Cities } from "./stage15";
import { findStage16Environment, stage16Environments, validateStage16EnvironmentCatalogue } from "./stage16";

const result = validateStage16EnvironmentCatalogue();
assert.equal(result.ok, true, result.issues.join("; "));
assert.equal(stage16Environments().length, stage15Cities().length);
for (const city of stage15Cities()) {
  const environment = findStage16Environment(city.id);
  assert.ok(environment, "Every Stage 15 city needs a Stage 16 environment profile: " + city.id);
  assert.ok(environment.landmarks.length >= 2);
  assert.ok(environment.atmosphere.length >= 10);
}
assert.equal(findStage16Environment("not-a-city"), undefined);
console.log("Stage 16 city environment catalogue passed: " + stage16Environments().length + " differentiated city profiles.");
