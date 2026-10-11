import assert from "node:assert/strict";
import {
  ARMY_WORKPLACE_ID, FIRE_WORKPLACE_ID, FRSC_WORKPLACE_ID, POLICE_WORKPLACE_ID, activateStage7Checkpoint,
  arrestStage7Suspect, attemptStage7Escape, closeStage7Incident, createStage7State, dispatchStage7Incident,
  findBlockingStage7Checkpoint, issueStage7Fine, isAuthorisedStage7CheckpointPass, maintainStage7State,
  normalizeStage7State, reportStage7Incident, requestStage7Appeal, resolveStage7Fire, resolveStage7TrafficIncident,
  reviewStage7Appeal, STAGE7_CHECKPOINT_DURATION_MS, STAGE7_DETENTION_MS, investigateStage7Incident
} from "./stage7";
let passed = 0;
function test(name: string, fn: () => void) { fn(); passed++; console.log("✓ " + name); }
const now = 1_791_000_000_000;
function report(kind: "crime" | "traffic-accident" | "fire" | "public-safety" = "crime") {
  const r = reportStage7Incident(createStage7State(), { requestId: "report-" + kind, kind, description: "Verified scenario needs response", reporterId: "citizen-1", reporterName: "Citizen_One", x: 20, z: 30, now });
  assert.equal(r.ok, true); if (!r.ok || !r.incident) throw new Error("test setup failed"); return r;
}
function dispatch(r: ReturnType<typeof report>, unit: string, rank = 2) {
  return dispatchStage7Incident(r.state, { requestId: "dispatch-" + r.incident!.kind, incidentId: r.incident!.id, workplaceId: unit, rank, onDuty: true, uniform: true, actorId: "officer-1", actorName: "Officer_One", now: now + 1000 });
}
test("stable unit IDs, six-rank service roles and expiry settings", () => {
  assert.equal(POLICE_WORKPLACE_ID, "police-rivers"); assert.equal(ARMY_WORKPLACE_ID, "army-rivers"); assert.equal(FRSC_WORKPLACE_ID, "frsc-rivers"); assert.equal(FIRE_WORKPLACE_ID, "fire-rivers"); assert.equal(STAGE7_DETENTION_MS, 120_000); assert.equal(STAGE7_CHECKPOINT_DURATION_MS, 20 * 60_000);
});
test("report validation and replay protection", () => {
  const s = createStage7State(); assert.equal(reportStage7Incident(s, { requestId: "bad", kind: "unknown", description: "Description long enough", reporterId: "c", reporterName: "C", x: 1, z: 2, now }).ok, false);
  assert.equal(reportStage7Incident(s, { requestId: "short", kind: "crime", description: "bad", reporterId: "c", reporterName: "C", x: 1, z: 2, now }).ok, false);
  const r = report(); assert.equal(reportStage7Incident(r.state, { requestId: r.incident!.requestId, kind: "crime", description: "Duplicate valid description", reporterId: "c", reporterName: "C", x: 1, z: 2, now }).ok, false);
});
test("dispatch enforces unit, duty, uniform and one assignment", () => {
  const r = report(); assert.equal(dispatchStage7Incident(r.state, { requestId: "off", incidentId: r.incident!.id, workplaceId: POLICE_WORKPLACE_ID, rank: 2, onDuty: false, uniform: true, actorId: "p", actorName: "P", now }).ok, false);
  assert.equal(dispatch(r, FIRE_WORKPLACE_ID).ok, false); const first = dispatch(r, POLICE_WORKPLACE_ID); assert.equal(first.ok, true);
  if (first.ok) assert.equal(dispatchStage7Incident(first.state, { requestId: "repeat", incidentId: r.incident!.id, workplaceId: POLICE_WORKPLACE_ID, rank: 2, onDuty: true, uniform: true, actorId: "p", actorName: "P", now }).ok, false);
});
test("Army is restricted to major incidents and active local checkpoints", () => {
  assert.equal(dispatch(report("crime"), ARMY_WORKPLACE_ID).ok, false);
  const assigned = dispatch(report("public-safety"), ARMY_WORKPLACE_ID); assert.equal(assigned.ok, true); if (!assigned.ok) return;
  const input = { requestId: "cp", checkpointId: "army-main-gate", actorId: "soldier", actorName: "Soldier", rank: 2, onDuty: true, uniform: true, workplaceId: ARMY_WORKPLACE_ID, distanceToCheckpoint: 2, now: now + 5000 };
  assert.equal(activateStage7Checkpoint(assigned.state, { ...input, rank: 1 }).ok, false);
  const cp = activateStage7Checkpoint(assigned.state, input); assert.equal(cp.ok, true); if (cp.ok) { assert.equal(findBlockingStage7Checkpoint(cp.state, 185, -150, now + 5001)?.id, "army-main-gate"); assert.equal(activateStage7Checkpoint(cp.state, { ...input, requestId: "cp2" }).ok, false); }
  assert.equal(isAuthorisedStage7CheckpointPass(ARMY_WORKPLACE_ID, true, true), true); assert.equal(isAuthorisedStage7CheckpointPass(ARMY_WORKPLACE_ID, false, true), false); assert.equal(isAuthorisedStage7CheckpointPass("citizen", true, true), false);
});
test("Police investigation requires assigned case, proximity, reasons and evidence", () => {
  const r = report(), d = dispatch(r, POLICE_WORKPLACE_ID); assert.equal(d.ok, true); if (!d.ok) return;
  const input = { requestId: "inv", incidentId: r.incident!.id, actorId: "officer-1", actorName: "Officer", workplaceId: POLICE_WORKPLACE_ID, rank: 2, onDuty: true, uniform: true, distanceToIncident: 3, reason: "Investigate reported theft", evidence: "Witness account and scene marks", now: now + 2000 };
  assert.equal(investigateStage7Incident(d.state, { ...input, distanceToIncident: 20 }).ok, false); assert.equal(investigateStage7Incident(d.state, { ...input, evidence: "no" }).ok, false); assert.equal(investigateStage7Incident(d.state, input).ok, true);
});
test("arrests reject self, private locations, missing evidence and replay", () => {
  const r = report(), d = dispatch(r, POLICE_WORKPLACE_ID); assert.equal(d.ok, true); if (!d.ok) return;
  const a = { requestId: "arrest", incidentId: r.incident!.id, actorId: "officer-1", actorName: "Officer", workplaceId: POLICE_WORKPLACE_ID, rank: 2, onDuty: true, uniform: true, targetId: "citizen-2", targetName: "Citizen_Two", distanceToTarget: 2, distanceToIncident: 4, targetIsPrivate: false, reason: "Suspect matched report", evidence: "Two witness statements collected", now: now + 3000 };
  assert.equal(arrestStage7Suspect(d.state, { ...a, targetId: "officer-1" }).ok, false); assert.equal(arrestStage7Suspect(d.state, { ...a, targetIsPrivate: true }).ok, false);
  const result = arrestStage7Suspect(d.state, a); assert.equal(result.ok, true); if (!result.ok) return;
  assert.equal(result.state.detentions["citizen-2"].expiresAt, now + 3000 + STAGE7_DETENTION_MS); assert.equal(arrestStage7Suspect(result.state, { ...a, requestId: "again" }).ok, false);
});
test("roadside fines enforce offence caps, evidence and recipient cash", () => {
  const r = report("traffic-accident"), d = dispatch(r, FRSC_WORKPLACE_ID); assert.equal(d.ok, true); if (!d.ok) return;
  const f = { requestId: "fine", incidentId: r.incident!.id, actorId: "marshal", actorName: "Marshal", workplaceId: FRSC_WORKPLACE_ID, rank: 2, onDuty: true, uniform: true, targetId: "driver", targetName: "Driver_One", targetCash: 20_000, distanceToTarget: 2, distanceToIncident: 4, targetIsPrivate: false, offence: "speeding", amount: 10_000, reason: "Driver exceeded safe road speed", evidence: "Radar reading and officer observation", now: now + 3000 };
  assert.equal(issueStage7Fine(d.state, { ...f, amount: 20_000 }).ok, false); assert.equal(issueStage7Fine(d.state, { ...f, targetCash: 100 }).ok, false); assert.equal(issueStage7Fine(d.state, { ...f, evidence: "no" }).ok, false); assert.equal(issueStage7Fine(d.state, f).ok, true);
});
test("Fire Service outcome requires assigned fire and proximity", () => {
  const r = report("fire"), d = dispatch(r, FIRE_WORKPLACE_ID); assert.equal(d.ok, true); if (!d.ok) return;
  const input = { requestId: "fire-done", incidentId: r.incident!.id, actorId: "firefighter", actorName: "Firefighter", workplaceId: FIRE_WORKPLACE_ID, rank: 1, onDuty: true, uniform: true, distanceToIncident: 1, outcome: "Flames extinguished and structure checked", now: now + 5000 };
  assert.equal(resolveStage7Fire(d.state, { ...input, distanceToIncident: 40 }).ok, false); assert.equal(resolveStage7Fire(d.state, input).incident?.status, "resolved");
});
test("FRSC road clearance validates rank and recorded outcome", () => {
  const r = report("traffic-accident"), d = dispatch(r, FRSC_WORKPLACE_ID); assert.equal(d.ok, true); if (!d.ok) return;
  const input = { requestId: "clear-road", incidentId: r.incident!.id, actorId: "marshal", actorName: "Marshal", workplaceId: FRSC_WORKPLACE_ID, rank: 2, onDuty: true, uniform: true, distanceToIncident: 1, outcome: "Vehicles cleared; road re-opened safely", now: now + 8000 };
  assert.equal(resolveStage7TrafficIncident(d.state, { ...input, rank: 1 }).ok, false); assert.equal(resolveStage7TrafficIncident(d.state, input).incident?.status, "resolved");
});
test("only Police rank 4+ can close active crime/public-safety cases", () => {
  const r = report("public-safety"), d = dispatch(r, POLICE_WORKPLACE_ID); assert.equal(d.ok, true); if (!d.ok) return;
  const input = { requestId: "close", incidentId: r.incident!.id, actorId: "inspector", actorName: "Inspector", workplaceId: POLICE_WORKPLACE_ID, rank: 4, onDuty: true, uniform: true, distanceToIncident: 1, reason: "Threat was assessed and removed", evidence: "Two reports and witness statement", now: now + 9000 };
  assert.equal(closeStage7Incident(d.state, { ...input, rank: 2 }).ok, false); assert.equal(closeStage7Incident(d.state, input).incident?.status, "resolved");
});
test("appeals require independent senior review; arresting officer cannot review", () => {
  const r = report(), d = dispatch(r, POLICE_WORKPLACE_ID); assert.equal(d.ok, true); if (!d.ok) return;
  const arrested = arrestStage7Suspect(d.state, { requestId: "a", incidentId: r.incident!.id, actorId: "officer-1", actorName: "Officer", workplaceId: POLICE_WORKPLACE_ID, rank: 2, onDuty: true, uniform: true, targetId: "citizen-2", targetName: "Citizen", distanceToTarget: 2, distanceToIncident: 2, targetIsPrivate: false, reason: "Evidence links target to report", evidence: "Two witnesses identified the suspect", now: now + 1000 });
  assert.equal(arrested.ok, true); if (!arrested.ok) return;
  const appeal = requestStage7Appeal(arrested.state, { requestId: "appeal", actorId: "citizen-2", actorName: "Citizen", reason: "I was not present at the alleged scene", now: now + 2000 }); assert.equal(appeal.ok, true); if (!appeal.ok) return;
  const review = { requestId: "review", actorId: "senior-2", actorName: "Senior Officer", workplaceId: POLICE_WORKPLACE_ID, rank: 5, onDuty: true, uniform: true, isAdmin: false, targetId: "citizen-2", decision: "release" as const, reason: "Witness evidence contradicts the allegation", now: now + 3000 };
  assert.equal(reviewStage7Appeal(appeal.state, { ...review, actorId: "officer-1" }).ok, false); const released = reviewStage7Appeal(appeal.state, review); assert.equal(released.ok, true); if (released.ok) assert.equal(released.state.detentions["citizen-2"], undefined);
});
test("escape requires delay and no nearby on-duty Police officer", () => {
  const r = report(), d = dispatch(r, POLICE_WORKPLACE_ID); assert.equal(d.ok, true); if (!d.ok) return;
  const arrested = arrestStage7Suspect(d.state, { requestId: "a", incidentId: r.incident!.id, actorId: "officer-1", actorName: "Officer", workplaceId: POLICE_WORKPLACE_ID, rank: 2, onDuty: true, uniform: true, targetId: "citizen-2", targetName: "Citizen", distanceToTarget: 2, distanceToIncident: 2, targetIsPrivate: false, reason: "Evidence links target to report", evidence: "Two witnesses identified suspect", now: now + 1000 });
  assert.equal(arrested.ok, true); if (!arrested.ok) return;
  assert.equal(attemptStage7Escape(arrested.state, { requestId: "early", actorId: "citizen-2", actorName: "Citizen", nearbyOfficerCount: 0, now: now + 2000 }).ok, false);
  assert.equal(attemptStage7Escape(arrested.state, { requestId: "blocked", actorId: "citizen-2", actorName: "Citizen", nearbyOfficerCount: 1, now: now + 20_000 }).ok, false);
  const escape = attemptStage7Escape(arrested.state, { requestId: "escape", actorId: "citizen-2", actorName: "Citizen", nearbyOfficerCount: 0, now: now + 20_000 }); assert.equal(escape.ok, true);
});
test("normalization and timed checkpoint expiry work", () => {
  const d = dispatch(report("public-safety"), ARMY_WORKPLACE_ID); assert.equal(d.ok, true); if (!d.ok) return;
  const cp = activateStage7Checkpoint(d.state, { requestId: "cp", checkpointId: "army-main-gate", actorId: "soldier", actorName: "Soldier", rank: 2, onDuty: true, uniform: true, workplaceId: ARMY_WORKPLACE_ID, distanceToCheckpoint: 2, now: now + 5000 });
  assert.equal(cp.ok, true); if (!cp.ok) return;
  const normalized = normalizeStage7State(JSON.parse(JSON.stringify(cp.state))); assert.equal(normalized.checkpoints.find(c => c.id === "army-main-gate")?.active, true);
  const maintained = maintainStage7State(normalized, now + 5000 + STAGE7_CHECKPOINT_DURATION_MS);
  assert.equal(maintained.expiredCheckpointIds.includes("army-main-gate"), true); assert.equal(findBlockingStage7Checkpoint(maintained.state, 185, -150, now + 5000 + STAGE7_CHECKPOINT_DURATION_MS), null);
});
console.log("Stage 7: " + passed + " tests passed.");
