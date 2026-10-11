import assert from "node:assert/strict";
import {
  STAGE18_BET_CLOSE_HOUR,
  STAGE18_BET_MAX_STAKE,
  STAGE18_BET_MIN_STAKE,
  STAGE18_MAX_SELECTIONS,
  stage18Fixtures,
  stage18NigeriaClock,
  stage18ResultsForDate,
} from "./stage18";

const date = "2026-10-11";
const fixtures = stage18Fixtures(date);
assert.equal(fixtures.length, STAGE18_MAX_SELECTIONS);
assert.equal(STAGE18_BET_MIN_STAKE, 10);
assert.equal(STAGE18_BET_MAX_STAKE, 50_000_000);
assert.equal(STAGE18_BET_CLOSE_HOUR, 22);
assert.equal(new Set(fixtures.map((fixture) => fixture.id)).size, 9);
assert.deepEqual(stage18Fixtures(date), fixtures);
assert.notDeepEqual(stage18Fixtures("2026-10-12"), fixtures);
for (const fixture of fixtures) {
  assert.ok(fixture.id.startsWith(date));
  assert.ok(fixture.odds.home > 1 && fixture.odds.home < 10);
  assert.ok(fixture.odds.draw > 1 && fixture.odds.draw < 10);
  assert.ok(fixture.odds.away > 1 && fixture.odds.away < 10);
}

const results = stage18ResultsForDate(date);
assert.equal(results.length, 9);
assert.notDeepEqual(stage18ResultsForDate(date), results);
for (const result of results) {
  assert.ok(["home", "draw", "away"].includes(result.outcome));
  assert.ok(Number.isInteger(result.homeScore) && result.homeScore >= 0);
  assert.ok(Number.isInteger(result.awayScore) && result.awayScore >= 0);
  assert.equal(result.outcome, result.homeScore > result.awayScore ? "home" : result.homeScore < result.awayScore ? "away" : "draw");
}

const nigeriaMidnight = stage18NigeriaClock(new Date("2026-10-11T23:30:00.000Z"));
assert.equal(nigeriaMidnight.date, "2026-10-12");
assert.equal(nigeriaMidnight.hour, 0);
assert.equal(nigeriaMidnight.minute, 30);
assert.equal(nigeriaMidnight.isClosed, false);
const closeTime = stage18NigeriaClock(new Date("2026-10-11T21:00:00.000Z"));
assert.equal(closeTime.date, "2026-10-11");
assert.equal(closeTime.hour, 22);
assert.equal(closeTime.isClosed, true);
console.log("Stage 18 tests passed: Nigeria-time cutoff, 9 deterministic daily fixtures, odds and consistent settled outcomes.");
