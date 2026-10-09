import assert from "node:assert/strict";
import {
  CAR_IDS,
  CARPARK_EXIT_GATE,
  validateCarparkExit,
  GameClock,
  HOUSES,
  HOUSE_CLASSES,
  MAX_PREPAID_DAYS,
  newLife,
  normalizeLife,
  settleLife,
  houseRent,
} from "./world";

let passed = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    passed += 1;
    console.log("ok   " + name);
  } catch (error) {
    console.error("FAIL " + name + "\\n     " + (error as Error).message);
    process.exitCode = 1;
  }
}

test("housing catalogue has 30 unique homes in the planned districts", () => {
  assert.equal(HOUSES.length, 30);
  assert.equal(new Set(HOUSES.map((h) => h.id)).size, 30);
  assert.ok(HOUSES.every((h) => h.zone && Number.isFinite(h.x) && Number.isFinite(h.z)));
  for (const zone of ["Mile 1 Market", "Rumuola", "D-Line", "Waterlines", "Trans Amadi", "Old GRA"]) {
    assert.ok(HOUSES.some((h) => h.zone === zone), zone);
  }
});

test("large residential homes sit off the Trans Amadi Road and their plots do not overlap", () => {
  const widths: Record<string, number> = {
    hut: 5.6, faceme: 10.5, flat: 11.5, estate: 14, mansion: 17, palace: 21,
  };
  const estateRow = HOUSES.filter((h) => h.zone === "Trans Amadi");
  assert.equal(estateRow.length, 4);
  assert.ok(estateRow.every((h) => h.z <= -220), "estate homes should sit behind Trans Amadi Road (z=-190)");
  const oldGra = HOUSES.filter((h) => h.zone === "Old GRA").sort((a, b) => a.x - b.x);
  assert.equal(oldGra.length, 5);
  assert.ok(oldGra.every((h) => h.z <= -220), "Old GRA properties must not be built on the road");
  for (let i = 1; i < oldGra.length; i++) {
    const previous = oldGra[i - 1], current = oldGra[i];
    const previousLotHalf = widths[previous.cls] / 2 + 4;
    const currentLotHalf = widths[current.cls] / 2 + 4;
    assert.ok(current.x - previous.x >= previousLotHalf + currentLotHalf, `${previous.id} and ${current.id} plots overlap`);
  }
});

test("all six rent prices match the approved housing plan", () => {
  assert.deepEqual(HOUSE_CLASSES.map((h) => [h.name, h.rentPerDay]), [
    ["Local Hut", 1000],
    ["Face-Me-I-Face-You", 2500],
    ["Flat", 4000],
    ["Estate House", 7500],
    ["Mansion", 10000],
    ["Palace", 20000],
  ]);
  for (const house of HOUSES) assert.ok(houseRent(house.id) > 0, house.id);
  assert.equal(MAX_PREPAID_DAYS, 7);
});

test("private car-park exit requires the owned car, marked gate, a stop, a recent sync and a held horn", () => {
  const now = 100_000;
  const valid = {
    carId: "c0",
    x: CARPARK_EXIT_GATE.x,
    z: CARPARK_EXIT_GATE.minZ + 1,
    yaw: 0,
    speed: 0.1,
    lastSyncAt: now - 100,
    reachedGate: true,
  };
  assert.deepEqual(validateCarparkExit(valid, "c0", true, now, ["c0"]), { ok: true });
  assert.equal(validateCarparkExit(valid, "c1", true, now, ["c0"]).ok, false);
  assert.equal(validateCarparkExit(valid, "c0", false, now, ["c0"]).ok, false);
  assert.equal(validateCarparkExit({ ...valid, speed: 3 }, "c0", true, now, ["c0"]).ok, false);
  assert.equal(validateCarparkExit({ ...valid, z: CARPARK_EXIT_GATE.minZ - 4 }, "c0", true, now, ["c0"]).ok, false);
  assert.equal(validateCarparkExit({ ...valid, z: CARPARK_EXIT_GATE.maxZ + 0.1 }, "c0", true, now, ["c0"]).ok, false);
  assert.equal(validateCarparkExit({ ...valid, lastSyncAt: now - 1200 }, "c0", true, now, ["c0"]).ok, false);
  assert.equal(validateCarparkExit({ ...valid, reachedGate: false }, "c0", true, now, ["c0"]).ok, false);
});

test("parking state persists and only owned car ids survive normalization", () => {
  const today = new GameClock().dayKey();
  const life = { ...newLife(today), parkedCars: ["c0", "c2"] };
  assert.deepEqual(normalizeLife(JSON.parse(JSON.stringify(life)), today), life);
  const repaired = normalizeLife({ ...life, ownedCars: ["c0"], parkedCars: ["c0", "c2", "unknown"] }, today);
  assert.deepEqual(repaired.parkedCars, ["c0"]);
  assert.ok(repaired.parkedCars.every((id) => CAR_IDS.includes(id)));
});

test("prepaid rent counts Nigeria-time midnights and evicts after days are exhausted", () => {
  const clock = new GameClock();
  const homeId = HOUSES[0].id;
  const life = { ...newLife(clock.dayKey()), homeId, rentDays: 2 };
  clock.skipDays(1);
  let result = settleLife(life, clock.dayKey());
  assert.equal(result.life.rentDays, 1);
  assert.equal(result.homeLost, null);
  clock.skipDays(1);
  result = settleLife(result.life, clock.dayKey());
  assert.equal(result.life.rentDays, 0);
  assert.equal(result.homeLost, null);
  clock.skipDays(1);
  result = settleLife(result.life, clock.dayKey());
  assert.equal(result.homeLost, homeId);
  assert.equal(result.life.homeId, null);
  assert.deepEqual(result.life.parkedCars, []);
});

test("rent settlement does not consume rent when the player has no home", () => {
  const clock = new GameClock();
  const life = newLife(clock.dayKey());
  clock.skipDays(12);
  const result = settleLife(life, clock.dayKey());
  assert.equal(result.homeLost, null);
  assert.equal(result.rentUsed, 0);
  assert.equal(result.life.homeId, null);
});

console.log("\\n" + passed + " Stage 2 checks passed" + (process.exitCode ? " (with failures)" : ""));
