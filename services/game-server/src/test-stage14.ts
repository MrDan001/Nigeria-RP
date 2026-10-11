import assert from "node:assert/strict";
import { runStage14ReleaseValidation, simulateStage14Load } from "./stage14";

const valid = runStage14ReleaseValidation({ accounts: [], ledger: [], cash: 0 }, 1_000);
assert.equal(valid.passed, true);
assert.equal(valid.startedAt, 1_000);
assert.equal(valid.completedAt, 1_000);

const invalid = runStage14ReleaseValidation({ accounts: Array.from({ length: 10_001 }, () => ({})) }, 2_000);
assert.equal(invalid.passed, false);

const load = simulateStage14Load(10_000);
assert.equal(load.ok, true);
assert.equal(simulateStage14Load(0).ok, false);

console.log("Stage 14 release/load/recovery validation passed.");
