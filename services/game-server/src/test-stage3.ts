import assert from "node:assert/strict";
import {
  BOSS_RANK,
  FACTIONS,
  GameClock,
  MAX_STAFF_RANK,
  MAX_WORK_HISTORY,
  MAX_WORKPLACE_AUDIT,
  RANK_COUNT,
  RANK_MULTIPLIERS,
  WORKPLACES,
  WORKPLACE_RADIUS,
  WORK_TASK_COOLDOWN_MS,
  WORK_TASK_DURATION_MS,
  bossWorkplaceOf,
  checkRankChange,
  checkWorkplaceApplication,
  checkWorkplaceDuty,
  checkWorkTaskEligibility,
  newLife,
  newWorld,
  normalizeLife,
  normalizeWorld,
  payForTask,
  rankMultiplier,
  workplaceInteriorPosition,
  workplaceRankTitle,
  workplaceTasks,
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

test("all workplaces define six titles and the shared server pay multipliers", () => {
  assert.equal(RANK_COUNT, 6);
  assert.equal(BOSS_RANK, 6);
  assert.equal(MAX_STAFF_RANK, 5);
  assert.deepEqual([...RANK_MULTIPLIERS], [1, 1.25, 1.6, 2, 2.6, 3.5]);
  assert.deepEqual(Array.from({ length: RANK_COUNT }, (_, i) => rankMultiplier(i + 1)), [1, 1.25, 1.6, 2, 2.6, 3.5]);
  for (const workplace of WORKPLACES) {
    assert.equal(workplace.rankTitles.length, RANK_COUNT, workplace.id);
    for (let rank = 1; rank <= RANK_COUNT; rank++) {
      assert.ok(workplaceRankTitle(workplace.id, rank), workplace.id + " rank " + rank);
      assert.equal(payForTask(1000, rank), Math.round(1000 * rankMultiplier(rank)));
    }
    assert.equal(workplaceRankTitle(workplace.id, 0), "");
    assert.equal(workplaceRankTitle(workplace.id, 7), "");
  }
});

test("workplaces, factions and reception interiors are mapped one-to-one and inside world bounds", () => {
  assert.equal(new Set(WORKPLACES.map((workplace) => workplace.id)).size, WORKPLACES.length);
  assert.equal(new Set(FACTIONS.map((faction) => faction.id)).size, FACTIONS.length);
  const mappedWorkplaces = FACTIONS.map((faction) => faction.workplaceId);
  assert.equal(new Set(mappedWorkplaces).size, WORKPLACES.length);
  for (const workplace of WORKPLACES) {
    assert.ok(FACTIONS.some((faction) => faction.workplaceId === workplace.id), workplace.id);
    const point = workplaceInteriorPosition(workplace.id);
    assert.ok(Math.abs(point.x) < 500 && Math.abs(point.z) < 500, workplace.id);
  }
  const positions = WORKPLACES.map((workplace) => workplaceInteriorPosition(workplace.id).x + ":" + workplaceInteriorPosition(workplace.id).z);
  assert.equal(new Set(positions).size, WORKPLACES.length);
});

test("employment applications reject unknown workplaces, duplicate jobs and second jobs", () => {
  assert.deepEqual(checkWorkplaceApplication(null, "bank-main"), { ok: true });
  assert.equal(checkWorkplaceApplication(null, "not-a-workplace").ok, false);
  assert.equal(checkWorkplaceApplication({ workplaceId: "bank-main", rank: 1 }, "bank-main").ok, false);
  assert.equal(checkWorkplaceApplication({ workplaceId: "bank-main", rank: 1 }, "hospital-main").ok, false);
  assert.equal(FACTIONS.find((faction) => faction.workplaceId === "hospital-main")?.requiresApproval, true);
  assert.equal(FACTIONS.find((faction) => faction.workplaceId === "market-mile1")?.requiresApproval, false);
});

test("only the assigned workplace boss can change another employee between staff ranks 1-5", () => {
  const employee = { workplaceId: "bank-main", rank: 1, onDuty: false };
  const valid = {
    workplaceId: "bank-main",
    actorId: "boss-account",
    actorBossOf: "bank-main",
    targetId: "staff-account",
    targetEmployment: employee,
    newRank: 2,
  };
  assert.deepEqual(checkRankChange(valid), { ok: true });
  assert.equal(checkRankChange({ ...valid, actorBossOf: "hospital-main" }).ok, false);
  assert.equal(checkRankChange({ ...valid, actorId: "staff-account", targetId: "staff-account" }).ok, false);
  assert.equal(checkRankChange({ ...valid, targetEmployment: { workplaceId: "hospital-main", rank: 1 } }).ok, false);
  assert.equal(checkRankChange({ ...valid, newRank: 6 }).ok, false);
  assert.equal(checkRankChange({ ...valid, newRank: 0 }).ok, false);
  assert.equal(checkRankChange({ ...valid, newRank: 1 }).ok, false);
  assert.equal(checkRankChange({ ...valid, newRank: 2.5 }).ok, false);
  assert.equal(bossWorkplaceOf(newWorld(new GameClock().dayKey()), "ordinary-account"), null);
});

test("clock-in/out requires the correct job, a nearby workplace and a valid state transition", () => {
  const employment = { workplaceId: "hospital-main", rank: 2, onDuty: false, uniformWorkplaceId: "hospital-main" };
  assert.deepEqual(checkWorkplaceDuty(employment, "hospital-main", true, 3), { ok: true });
  assert.deepEqual(checkWorkplaceDuty({ ...employment, onDuty: true }, "hospital-main", false, 3), { ok: true });
  assert.equal(checkWorkplaceDuty(employment, "bank-main", true, 3).ok, false);
  assert.equal(checkWorkplaceDuty(employment, "hospital-main", true, WORKPLACE_RADIUS + 1).ok, false);
  assert.equal(checkWorkplaceDuty(employment, "hospital-main", true, Number.NaN).ok, false);
  assert.equal(checkWorkplaceDuty(employment, "hospital-main", "yes" as unknown as boolean, 3).ok, false);
  assert.equal(checkWorkplaceDuty({ ...employment, onDuty: true }, "hospital-main", true, 3).ok, false);
});

test("work tasks require valid duty, uniform, task, proximity, duration and cooldown", () => {
  const now = 100_000;
  const employment = {
    workplaceId: "hospital-main", rank: 2, onDuty: true, lastTaskAt: 0, uniformWorkplaceId: "hospital-main",
  };
  const base = {
    employment, workplaceId: "hospital-main", taskId: "ward-rounds", distance: 3,
    now, startedAt: now - WORK_TASK_DURATION_MS, onDuty: true, activeTaskId: "ward-rounds",
  };
  assert.deepEqual(checkWorkTaskEligibility(base), { ok: true });
  assert.equal(checkWorkTaskEligibility({ ...base, employment: { ...employment, uniformWorkplaceId: null } }).ok, false);
  assert.equal(checkWorkTaskEligibility({ ...base, employment: { ...employment, uniformWorkplaceId: "bank-main" } }).ok, false);
  assert.equal(checkWorkTaskEligibility({ ...base, onDuty: false }).ok, false);
  assert.equal(checkWorkTaskEligibility({ ...base, distance: WORKPLACE_RADIUS + 1 }).ok, false);
  assert.equal(checkWorkTaskEligibility({ ...base, taskId: "client-invented-task" }).ok, false);
  assert.equal(checkWorkTaskEligibility({ ...base, activeTaskId: "patient-triage" }).ok, false);
  assert.equal(checkWorkTaskEligibility({ ...base, startedAt: now - WORK_TASK_DURATION_MS + 1 }).ok, false);
  assert.equal(checkWorkTaskEligibility({ ...base, employment: { ...employment, lastTaskAt: now - 5000 } }).ok, false);
  assert.equal(WORK_TASK_DURATION_MS, 10_000);
  assert.equal(WORK_TASK_COOLDOWN_MS, 30_000);
  for (const workplace of WORKPLACES) {
    const tasks = workplaceTasks(workplace.id);
    assert.ok(tasks.length > 0, workplace.id);
    assert.equal(new Set(tasks.map((task) => task.id)).size, tasks.length, workplace.id);
    assert.ok(tasks.every((task) => task.basePay > 0), workplace.id);
  }
});

test("work payout history persists, is account-scoped and accepts legacy life saves", () => {
  const today = new GameClock().dayKey();
  const entry = {
    id: "payout-1",
    workplaceId: "hospital-main",
    taskId: "ward-rounds",
    taskTitle: "Complete ward support",
    rank: 3,
    amount: 2880,
    paidAt: 1_760_000_000_000,
  };
  const life = {
    ...newLife(today),
    employment: { workplaceId: "hospital-main", rank: 3, onDuty: false, lastTaskAt: entry.paidAt, uniformWorkplaceId: null },
    workHistory: [entry],
  };
  assert.deepEqual(normalizeLife(JSON.parse(JSON.stringify(life)), today), life);
  assert.deepEqual(normalizeLife({ employment: life.employment }, today).workHistory, []);

  const invalid = normalizeLife({
    ...life,
    workHistory: [
      entry,
      { ...entry, id: "bad-task", taskId: "client-made-up-task" },
      { ...entry, id: "bad-rank", rank: 99 },
      { ...entry, id: "bad-amount", amount: Number.POSITIVE_INFINITY },
      { ...entry, id: "bad-time", paidAt: -1 },
    ],
  }, today);
  assert.deepEqual(invalid.workHistory, [entry]);

  const many = Array.from({ length: MAX_WORK_HISTORY + 5 }, (_, index) => ({
    ...entry, id: "payout-" + index, paidAt: entry.paidAt + index,
  }));
  const capped = normalizeLife({ ...life, workHistory: many }, today).workHistory;
  assert.equal(capped.length, MAX_WORK_HISTORY);
  assert.equal(capped[0].id, "payout-5");
  assert.equal(capped[capped.length - 1].id, "payout-" + (MAX_WORK_HISTORY + 4));
});

test("saved workplace applications and separate admin/workplace audit trails survive normalization", () => {
  const today = new GameClock().dayKey();
  const world = newWorld(today);
  world.bosses["bank-main"] = "branch-boss";
  world.bossNames["bank-main"] = "Branch_Boss";
  world.workplaceApplications["hospital-main"]["applicant-1"] = 1_760_000_000_000;
  world.adminAudit.push(
    { actorId: "admin", actorUsername: "Dbase_Mccoll", targetId: "member", targetUsername: "Member_User", action: "rank_change", detail: "bank-main -> rank 2", at: 1_760_000_000_001 },
  );
  world.workplaceAudit.push(
    { actorId: "member", actorUsername: "Member_User", targetId: "member", targetUsername: "Member_User", action: "workplace_application", detail: "submitted application for hospital-main", at: 1_760_000_000_002 },
    { actorId: "boss", actorUsername: "Boss_User", targetId: "member", targetUsername: "Member_User", action: "staff_hired", detail: "hired into bank-main", at: 1_760_000_000_003 },
    { actorId: "member", actorUsername: "Member_User", targetId: "member", targetUsername: "Member_User", action: "staff_left", detail: "left bank-main", at: 1_760_000_000_004 },
  );
  const loaded = normalizeWorld(JSON.parse(JSON.stringify(world)), today);
  assert.equal(loaded.bosses["bank-main"], "branch-boss");
  assert.equal(loaded.bossNames["bank-main"], "Branch_Boss");
  assert.equal(loaded.workplaceApplications["hospital-main"]["applicant-1"], 1_760_000_000_000);
  assert.deepEqual(loaded.adminAudit.map((entry) => entry.action), ["rank_change"]);
  assert.deepEqual(loaded.workplaceAudit.map((entry) => entry.action), ["workplace_application", "staff_hired", "staff_left"]);
  assert.deepEqual(normalizeWorld({ v: 1, bosses: {}, houseTenants: {}, houseLocks: {} }, today).workplaceAudit, []);

  const longTrail = Array.from({ length: MAX_WORKPLACE_AUDIT + 3 }, (_, index) => ({
    actorId: "boss", actorUsername: "Boss_User", targetId: "member-" + index, targetUsername: "Member_User",
    action: "staff_hired" as const, detail: "test " + index, at: 1_760_000_000_000 + index,
  }));
  const bounded = normalizeWorld({ ...world, workplaceAudit: longTrail }, today).workplaceAudit;
  assert.equal(bounded.length, MAX_WORKPLACE_AUDIT);
  assert.equal(bounded[0].targetId, "member-3");
  assert.equal(bounded[bounded.length - 1].targetId, "member-" + (MAX_WORKPLACE_AUDIT + 2));
});

console.log("\n" + passed + " Stage 3 checks passed" + (process.exitCode ? " (with failures)" : ""));
