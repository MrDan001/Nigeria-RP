// Stage 1 checks: Nigeria-time day clock, rank rules, pay, rent over skipped days, save/load shape.
// Run with: npm run test:stage1 --workspace nigeria-rp-game-server
import assert from "node:assert/strict";
import {
  CAR_IDS,
  GameClock,
  HOUSES,
  HOUSE_CLASSES,
  RANK_MULTIPLIERS,
  WORKPLACES,
  bossWorkplaceOf,
  checkRankChange,
  daysBetween,
  houseRent,
  newLife,
  newWorld,
  normalizeLife,
  normalizeWorld,
  payForTask,
  settleLife,
  watDayKey,
} from "./world";

let passed = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    passed += 1;
    console.log("ok   " + name);
  } catch (error) {
    console.error("FAIL " + name + "\n     " + (error as Error).message);
    process.exitCode = 1;
  }
}

test("day ends at midnight Nigeria time (UTC+1)", () => {
  // 22:59 UTC = 23:59 WAT -> still the same day; 23:00 UTC = 00:00 WAT -> next day.
  assert.equal(watDayKey(Date.UTC(2026, 9, 9, 22, 59, 59)), "2026-10-09");
  assert.equal(watDayKey(Date.UTC(2026, 9, 9, 23, 0, 0)), "2026-10-10");
  assert.equal(watDayKey(Date.UTC(2026, 11, 31, 23, 30, 0)), "2027-01-01");
});

test("daysBetween counts midnights, across month and year ends", () => {
  assert.equal(daysBetween("2026-10-09", "2026-10-09"), 0);
  assert.equal(daysBetween("2026-10-09", "2026-10-12"), 3);
  assert.equal(daysBetween("2026-12-30", "2027-01-02"), 3);
  assert.equal(daysBetween("2028-02-28", "2028-03-01"), 2); // leap year
});

test("clock skip moves the day forward without waiting", () => {
  const clock = new GameClock();
  const start = clock.dayKey();
  clock.skipDays(3);
  assert.equal(daysBetween(start, clock.dayKey()), 3);
  assert.equal(clock.offsetDays, 3);
});

test("six ranks, multipliers as agreed, pay scales", () => {
  assert.deepEqual([...RANK_MULTIPLIERS], [1.0, 1.25, 1.6, 2.0, 2.6, 3.5]);
  assert.equal(payForTask(1000, 1), 1000);
  assert.equal(payForTask(1000, 3), 1600);
  assert.equal(payForTask(1000, 6), 3500);
  assert.equal(payForTask(1000, 99), 1000); // bad rank falls back to rank 1
});

test("every workplace has six rank entries and none are empty", () => {
  for (const w of WORKPLACES) {
    assert.equal(w.rankTitles.length, 6, w.id);
    for (const titles of w.rankTitles) assert.ok(titles.length >= 1, w.id);
  }
});

test("house classes and rents match the plan", () => {
  assert.deepEqual(
    HOUSE_CLASSES.map((c) => [c.name, c.rentPerDay]),
    [
      ["Local Hut", 1000],
      ["Face-Me-I-Face-You", 2500],
      ["Flat", 4000],
      ["Estate House", 7500],
      ["Mansion", 10000],
      ["Palace", 20000],
    ],
  );
  assert.equal(houseRent(HOUSES[0].id), 1000);
  assert.equal(new Set(HOUSES.map((h) => h.id)).size, HOUSES.length); // ids unique
});

test("rent: a midnight uses one prepaid day; a midnight with none left loses the home", () => {
  const clock = new GameClock();
  const day0 = clock.dayKey();
  const house = HOUSES[0].id;
  const life = { ...newLife(day0), homeId: house, rentDays: 2 };

  clock.skipDays(1);
  let r = settleLife(life, clock.dayKey());
  assert.equal(r.life.rentDays, 1);
  assert.equal(r.life.homeId, house);
  assert.equal(r.homeLost, null);

  clock.skipDays(1);
  r = settleLife(r.life, clock.dayKey());
  assert.equal(r.life.rentDays, 0);
  assert.equal(r.life.homeId, house); // days used up, third midnight is the one that costs the house
  assert.equal(r.homeLost, null);

  clock.skipDays(1);
  r = settleLife(r.life, clock.dayKey());
  assert.equal(r.homeLost, house);
  assert.equal(r.life.homeId, null);
});

test("rent: skipping many days in one go (offline player) gives the same result", () => {
  const clock = new GameClock();
  const house = HOUSES[1].id;
  const life = { ...newLife(clock.dayKey()), homeId: house, rentDays: 7 };
  clock.skipDays(5);
  let r = settleLife(life, clock.dayKey());
  assert.equal(r.rentUsed, 5);
  assert.equal(r.life.rentDays, 2);
  assert.equal(r.homeLost, null);
  clock.skipDays(10);
  r = settleLife(r.life, clock.dayKey());
  assert.equal(r.homeLost, house);
  assert.equal(r.life.rentDays, 0);
});

test("rent: settling twice on the same day changes nothing", () => {
  const clock = new GameClock();
  const life = { ...newLife(clock.dayKey()), homeId: HOUSES[0].id, rentDays: 3 };
  clock.skipDays(1);
  const once = settleLife(life, clock.dayKey());
  const twice = settleLife(once.life, clock.dayKey());
  assert.equal(twice.midnights, 0);
  assert.deepEqual(twice.life, once.life);
});

test("no home: skipping days costs nothing", () => {
  const clock = new GameClock();
  const life = newLife(clock.dayKey());
  clock.skipDays(30);
  const r = settleLife(life, clock.dayKey());
  assert.equal(r.homeLost, null);
  assert.equal(r.rentUsed, 0);
});

test("rank rules: only the boss, ranks 1-5, never yourself", () => {
  const base = {
    workplaceId: "bank-main",
    actorId: "boss",
    actorBossOf: "bank-main" as string | null,
    targetId: "staff",
    targetEmployment: { workplaceId: "bank-main", rank: 2 } as { workplaceId: string; rank: number } | null,
    newRank: 3,
  };
  assert.equal(checkRankChange(base).ok, true);
  assert.equal(checkRankChange({ ...base, newRank: 1 }).ok, true); // demote
  assert.equal(checkRankChange({ ...base, newRank: 6 }).ok, false); // nobody is made boss this way
  assert.equal(checkRankChange({ ...base, newRank: 0 }).ok, false);
  assert.equal(checkRankChange({ ...base, actorBossOf: null }).ok, false); // not a boss
  assert.equal(checkRankChange({ ...base, actorBossOf: "market-mile1" }).ok, false); // boss of elsewhere
  assert.equal(checkRankChange({ ...base, actorId: "staff" }).ok, false); // self
  assert.equal(checkRankChange({ ...base, targetEmployment: null }).ok, false);
  assert.equal(checkRankChange({ ...base, targetEmployment: { workplaceId: "park-main", rank: 2 } }).ok, false);
});

test("save/load: life survives a JSON round trip; bad data is repaired", () => {
  const clock = new GameClock();
  const today = clock.dayKey();
  const life = {
    ...newLife(today),
    employment: { workplaceId: "market-mile1", rank: 3 },
    homeId: HOUSES[2].id,
    rentDays: 4,
  };
  assert.deepEqual(normalizeLife(JSON.parse(JSON.stringify(life)), today), life);

  const repaired = normalizeLife(
    { employment: { workplaceId: "nope", rank: 9 }, homeId: "ghost", rentDays: 99, lastDay: "tomorrow", ownedCars: ["c1", "zzz"] },
    today,
  );
  assert.equal(repaired.employment, null);
  assert.equal(repaired.homeId, null);
  assert.equal(repaired.rentDays, 0);
  assert.equal(repaired.lastDay, today);
  assert.deepEqual(repaired.ownedCars, ["c1"]);
  assert.deepEqual(normalizeLife(null, today).ownedCars, [...CAR_IDS]);
});

test("world: bosses are set by hand in the data and survive a round trip", () => {
  const today = new GameClock().dayKey();
  const world = newWorld(today);
  assert.equal(world.bosses["bank-main"], null);
  world.bosses["bank-main"] = "acct-123";
  const loaded = normalizeWorld(JSON.parse(JSON.stringify(world)), today);
  assert.equal(bossWorkplaceOf(loaded, "acct-123"), "bank-main");
  assert.equal(bossWorkplaceOf(loaded, "someone-else"), null);
  // A workplace added later is filled in without breaking the old save.
  delete (loaded.bosses as Record<string, unknown>)["park-main"];
  assert.equal(normalizeWorld(loaded, today).bosses["park-main"], null);
});

console.log("\n" + passed + " checks passed" + (process.exitCode ? " (with failures)" : ""));
