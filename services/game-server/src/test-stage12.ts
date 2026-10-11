import assert from "node:assert/strict";
import { checkStage12FacilityAccess, completeStage12Shift, createStage12OfficeTask, createStage12State, maintainStage12Facility, registerStage12Qualification, startStage12Shift, awardStage12EducationTask, type Stage12Actor } from "./stage12";

const now = 1_800_000_000_000;
const state = createStage12State();
const teacher: Stage12Actor = { actorId: "teacher-1", workplaceId: "rivers-school-main", rank: 2, onDuty: true, uniform: true, qualifications: ["teacher-certificate"], x: 18, z: 18 };
assert.deepEqual(checkStage12FacilityAccess(state, teacher, "school-classroom"), { ok: true });
assert.equal(awardStage12EducationTask(state, teacher, "edu-1", 10, now), 15000);
assert.throws(() => awardStage12EducationTask(state, teacher, "edu-1", 10, now + 1), /replayed/);

const office: Stage12Actor = { actorId: "office-1", workplaceId: "office-centre-main", rank: 2, onDuty: true, uniform: true, qualifications: [], x: -12, z: 62 };
assert.equal(createStage12OfficeTask(state, office, "office-1", now).workplaceId, "office-centre-main");

const rig: Stage12Actor = { actorId: "rig-1", workplaceId: "oil-rig-main", rank: 2, onDuty: true, uniform: true, qualifications: ["industrial-safety"], x: 160, z: -80 };
state.inventories[rig.actorId] = { "rig-maintenance-kit": 2 };
const shift = startStage12Shift(state, rig, "rig-start", "oil-platform", "oil-extraction", now);
assert.equal(shift.status, "active");
assert.throws(() => completeStage12Shift(state, rig, "rig-early", shift.id, now + 1000), /not complete/);
const completed = completeStage12Shift(state, rig, "rig-complete", shift.id, now + 15 * 60 * 1000);
assert.equal(completed.outputUnits, 12);
assert.equal(state.inventories[rig.actorId]["crude-oil"], 12);
assert.equal(state.inventories[rig.actorId]["rig-maintenance-kit"], 0);
assert.equal(state.maintenance["oil-platform"], 95);

const noQual: Stage12Actor = { ...rig, actorId: "bad-actor", qualifications: [], x: 160, z: -80 };
assert.throws(() => startStage12Shift(state, noQual, "bad-start", "oil-platform", "oil-extraction", now), /unauthorised/);

registerStage12Qualification(state, "bad-actor", "industrial-safety");
assert.deepEqual(checkStage12FacilityAccess(state, { ...noQual, qualifications: [] }, "oil-platform"), { ok: true });

assert.throws(() => maintainStage12Facility(state, rig, "maint-bad", "oil-platform", 100, now), /invalid maintenance amount|replayed/);
assert.equal(maintainStage12Facility(state, rig, "maint-good", "oil-platform", 5, now + 1), 100);

console.log("Stage 12 regression checks passed");
