import assert from "node:assert/strict";
import {
  AMBULANCE_HEAL_AMOUNT,
  AMBULANCE_TREATMENT_FEE,
  HOSPITAL_HEAL_AMOUNT,
  HOSPITAL_MEDICINES,
  HOSPITAL_TREATMENT_FEE,
  PARK_TICKET_PRICE,
  buyParkTicket,
  completeHospitalTreatment,
  createHospitalRequest,
  createParkHelpRequest,
  createStage5State,
  dispatchHospitalAmbulance,
  hospitalRankCanTreat,
  hospitalRankCanTriage,
  normalizeStage5State,
  parkRankCanSellTickets,
  purchaseHospitalMedicine,
  resolveParkHelpRequest,
  triageHospitalRequest,
} from "./stage5";

let passed = 0;
function test(name: string, run: () => void) {
  try {
    run();
    passed += 1;
    console.log("✓ " + name);
  } catch (error) {
    console.error("✗ " + name);
    throw error;
  }
}
const NOW = 1_760_000_000_000;

function careRequest(state = createStage5State(), overrides: Partial<Parameters<typeof createHospitalRequest>[0]> = {}) {
  return createHospitalRequest({
    state,
    requestId: "care-1",
    idempotencyKey: "patient-1-care-hash",
    hospitalId: "hospital-main",
    kind: "care",
    patientId: "patient-1",
    patientX: -79,
    patientZ: 106,
    patientHp: 50,
    now: NOW,
    ...overrides,
  });
}

test("hospital rank permissions distinguish intake from clinical treatment", () => {
  assert.equal(hospitalRankCanTriage(1), false);
  assert.equal(hospitalRankCanTriage(2), true);
  assert.equal(hospitalRankCanTreat(2), false);
  assert.equal(hospitalRankCanTreat(3), true);
  assert.equal(hospitalRankCanTreat(6), true);
  assert.equal(hospitalRankCanTreat(7), false);
});

test("patient can request on-site care, and replay cannot create duplicate requests", () => {
  const state = createStage5State();
  const created = careRequest(state);
  assert.equal(created.ok, true);
  assert.equal(state.hospital.requests.length, 1);
  assert.equal(careRequest(state).ok, false);
  assert.equal(careRequest(state, { requestId: "care-2", idempotencyKey: "other-hash" }).ok, false);
});

test("hospital care requests reject healthy patients, fake hospitals and ambulance spam", () => {
  const state = createStage5State();
  assert.equal(careRequest(state, { patientHp: 100 }).ok, false);
  assert.equal(careRequest(state, { hospitalId: "not-a-hospital" }).ok, false);
  assert.equal(careRequest(state, { kind: "ambulance", patientHp: 90, idempotencyKey: "ambulance-hash" }).ok, false);
});

test("authorised nursing aide may triage but cannot alter health", () => {
  const state = createStage5State();
  const created = careRequest(state);
  assert.equal(created.ok, true);
  if (!created.ok) return;
  const denied = triageHospitalRequest({
    state, requestId: created.request.id, workerId: "aide", workerRank: 1,
    hospitalId: "hospital-main", onDuty: true, uniform: true, atHospital: true,
    patientAtHospital: true, now: NOW + 1,
  });
  assert.equal(denied.ok, false);
  const triage = triageHospitalRequest({
    state, requestId: created.request.id, workerId: "aide", workerRank: 2,
    hospitalId: "hospital-main", onDuty: true, uniform: true, atHospital: true,
    patientAtHospital: true, now: NOW + 2,
  });
  assert.equal(triage.ok, true);
  assert.equal(state.hospital.requests[0].triagedBy, "aide");
  assert.equal(triageHospitalRequest({
    state, requestId: created.request.id, workerId: "nurse", workerRank: 3,
    hospitalId: "hospital-main", onDuty: true, uniform: true, atHospital: true,
    patientAtHospital: true, now: NOW + 3,
  }).ok, false);
});

test("authorized nurse completes on-site care and patient pays only the fixed fee", () => {
  const state = createStage5State();
  const created = careRequest(state);
  assert.equal(created.ok, true);
  if (!created.ok) return;
  const patient = { hp: 50, cash: 2_000 };
  const result = completeHospitalTreatment({
    state, requestId: created.request.id, patientId: "patient-1", workerId: "nurse-1",
    workerRank: 3, hospitalId: "hospital-main", onDuty: true, uniform: true,
    atHospital: true, patientAtHospital: true, ambulanceProximityValid: false, patient, now: NOW + 4,
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.amount, HOSPITAL_TREATMENT_FEE);
  assert.equal(result.healthRestored, HOSPITAL_HEAL_AMOUNT);
  assert.deepEqual(patient, { hp: 85, cash: 1_500 });
  assert.equal(state.hospital.requests[0].status, "completed");
  assert.equal(state.hospital.history.at(-1)?.kind, "treatment");
});

test("clinical treatment rejects off-site treatment, unauthorised workers and insufficient cash", () => {
  const state = createStage5State();
  const created = careRequest(state);
  assert.equal(created.ok, true);
  if (!created.ok) return;
  const base = {
    state, requestId: created.request.id, patientId: "patient-1", hospitalId: "hospital-main",
    onDuty: true, uniform: true, atHospital: true, patientAtHospital: true,
    ambulanceProximityValid: false, now: NOW + 4,
  };
  const patient = { hp: 50, cash: 2_000 };
  assert.equal(completeHospitalTreatment({ ...base, workerId: "aide", workerRank: 2, patient }).ok, false);
  assert.equal(completeHospitalTreatment({ ...base, workerId: "nurse", workerRank: 3, patient, patientAtHospital: false }).ok, false);
  assert.equal(completeHospitalTreatment({ ...base, workerId: "nurse", workerRank: 3, patient, atHospital: false }).ok, false);
  assert.equal(completeHospitalTreatment({ ...base, workerId: "nurse", workerRank: 3, patient: { hp: 50, cash: 499 } }).ok, false);
  assert.equal(patient.hp, 50);
  assert.equal(patient.cash, 2_000);
});

test("ambulance requests must be severe, are assigned by a real dispatcher and require field proximity", () => {
  const state = createStage5State();
  const created = careRequest(state, {
    requestId: "ambulance-1", idempotencyKey: "patient-1-ambulance", kind: "ambulance", patientHp: 30,
  });
  assert.equal(created.ok, true);
  if (!created.ok) return;
  const dispatch = dispatchHospitalAmbulance({
    state, requestId: created.request.id, workerId: "dispatcher", workerRank: 2,
    hospitalId: "hospital-main", onDuty: true, uniform: true, atHospital: true, now: NOW + 1,
  });
  assert.equal(dispatch.ok, true);
  assert.equal(state.hospital.requests[0].status, "dispatched");
  const patient = { hp: 30, cash: 5_000 };
  const tooFar = completeHospitalTreatment({
    state, requestId: created.request.id, patientId: "patient-1", workerId: "dispatcher",
    workerRank: 3, hospitalId: "hospital-main", onDuty: true, uniform: true,
    atHospital: false, patientAtHospital: false, ambulanceProximityValid: false, patient, now: NOW + 2,
  });
  assert.equal(tooFar.ok, false);
  const treated = completeHospitalTreatment({
    state, requestId: created.request.id, patientId: "patient-1", workerId: "dispatcher",
    workerRank: 3, hospitalId: "hospital-main", onDuty: true, uniform: true,
    atHospital: false, patientAtHospital: false, ambulanceProximityValid: true, patient, now: NOW + 3,
  });
  assert.equal(treated.ok, true);
  if (treated.ok) {
    assert.equal(treated.amount, AMBULANCE_TREATMENT_FEE);
    assert.equal(treated.healthRestored, AMBULANCE_HEAL_AMOUNT);
  }
  assert.deepEqual(patient, { hp: 80, cash: 3_800 });
});

test("hospital pharmacy sells existing usable inventory at fixed prices and records receipts", () => {
  const state = createStage5State();
  const inventory: Record<string, number> = {};
  const medicine = HOSPITAL_MEDICINES.find(m => m.id === "bandage-kit")!;
  const purchase = purchaseHospitalMedicine({
    state, requestId: "pharmacy-1", idempotencyKey: "customer-1-pharmacy-hash",
    hospitalId: "hospital-main", customerId: "customer-1", workerId: "nurse-1",
    workerRank: 3, onDuty: true, uniform: true, medicineId: medicine.id, quantity: 2,
    customerCash: 10_000, inventory, now: NOW,
  });
  assert.equal(purchase.ok, true);
  if (!purchase.ok) return;
  assert.equal(purchase.receipt.total, 3_000);
  assert.equal(purchase.newCash, 7_000);
  assert.equal(purchase.inventory["Bandage Kit"], 2);
  assert.equal(state.hospital.pharmacyStock["hospital-main:bandage-kit"], 28);
  assert.equal(state.hospital.pharmacyTill["hospital-main"], 3_000);
  assert.equal(state.hospital.pharmacyHistory.length, 1);
  const replay = purchaseHospitalMedicine({
    state, requestId: "pharmacy-1", idempotencyKey: "customer-1-pharmacy-hash",
    hospitalId: "hospital-main", customerId: "customer-1", workerId: "nurse-1",
    workerRank: 3, onDuty: true, uniform: true, medicineId: medicine.id, quantity: 2,
    customerCash: purchase.newCash, inventory: purchase.inventory, now: NOW + 1,
  });
  assert.equal(replay.ok, false);
});

test("pharmacy blocks self-service, off-duty workers, invalid fractional quantity and stock/cash overruns", () => {
  const state = createStage5State();
  const base = {
    state, requestId: "pharmacy-a", idempotencyKey: "pharm-hash-a",
    hospitalId: "hospital-main", customerId: "customer", workerId: "worker",
    workerRank: 3, onDuty: true, uniform: true, medicineId: "paracetamol",
    quantity: 1, customerCash: 500, inventory: {}, now: NOW,
  };
  assert.equal(purchaseHospitalMedicine({ ...base, workerId: "customer" }).ok, false);
  assert.equal(purchaseHospitalMedicine({ ...base, onDuty: false, idempotencyKey: "pharm-hash-b" }).ok, false);
  assert.equal(purchaseHospitalMedicine({ ...base, quantity: 1.5, idempotencyKey: "pharm-hash-c" }).ok, false);
  assert.equal(purchaseHospitalMedicine({ ...base, customerCash: 1, idempotencyKey: "pharm-hash-d" }).ok, false);
  state.hospital.pharmacyStock["hospital-main:paracetamol"] = 0;
  assert.equal(purchaseHospitalMedicine({ ...base, idempotencyKey: "pharm-hash-e" }).ok, false);
});

test("park tickets reconcile visitor cash and park till, and replay/daily double sale are rejected", () => {
  const state = createStage5State();
  const base = {
    state, requestId: "ticket-1", idempotencyKey: "visitor-1-ticket-hash",
    visitorId: "visitor-1", sellerId: "seller-1", sellerRank: 3, sellerOnDuty: true,
    sellerUniform: true, visitorAtPark: true, sellerAtPark: true, visitorCash: 1_500,
    dayKey: "2026-10-11", now: NOW,
  };
  const ticket = buyParkTicket(base);
  assert.equal(ticket.ok, true);
  if (!ticket.ok) return;
  assert.equal(ticket.ticket.amount, PARK_TICKET_PRICE);
  assert.equal(ticket.newCash, 1_000);
  assert.equal(ticket.till, PARK_TICKET_PRICE);
  assert.equal(state.park.ticketsByVisitor["visitor-1"].dayKey, "2026-10-11");
  assert.equal(buyParkTicket({ ...base, visitorCash: ticket.newCash }).ok, false);
  assert.equal(buyParkTicket({ ...base, idempotencyKey: "second-key", requestId: "ticket-2", dayKey: "2026-10-12" }).ok, true);
  assert.equal(state.park.ticketHistory.length, 2);
});

test("park ticket sales require a ticket seller, uniform, duty and both players at the park", () => {
  const state = createStage5State();
  const base = {
    state, requestId: "ticket-a", idempotencyKey: "ticket-key-a",
    visitorId: "visitor", sellerId: "seller", sellerRank: 3, sellerOnDuty: true,
    sellerUniform: true, visitorAtPark: true, sellerAtPark: true, visitorCash: 1_000,
    dayKey: "2026-10-11", now: NOW,
  };
  assert.equal(buyParkTicket({ ...base, sellerRank: 2 }).ok, false);
  assert.equal(buyParkTicket({ ...base, sellerUniform: false }).ok, false);
  assert.equal(buyParkTicket({ ...base, visitorAtPark: false }).ok, false);
  assert.equal(buyParkTicket({ ...base, sellerAtPark: false }).ok, false);
  assert.equal(buyParkTicket({ ...base, visitorCash: 499 }).ok, false);
});

test("park visitor help is user-initiated and completed by an on-duty park worker", () => {
  const state = createStage5State();
  const request = createParkHelpRequest({
    state, requestId: "help-1", idempotencyKey: "visitor-help-key",
    visitorId: "visitor-1", kind: "lost-and-found", atPark: true, now: NOW,
  });
  assert.equal(request.ok, true);
  if (!request.ok) return;
  assert.equal(createParkHelpRequest({
    state, requestId: "help-2", idempotencyKey: "visitor-help-key-2",
    visitorId: "visitor-1", kind: "first-aid", atPark: true, now: NOW + 1,
  }).ok, false);
  assert.equal(resolveParkHelpRequest({
    state, requestId: request.request.id, workerId: "worker", workerRank: 2,
    onDuty: false, uniform: true, atPark: true, now: NOW + 2,
  }).ok, false);
  const resolved = resolveParkHelpRequest({
    state, requestId: request.request.id, workerId: "worker", workerRank: 2,
    onDuty: true, uniform: true, atPark: true, now: NOW + 3,
  });
  assert.equal(resolved.ok, true);
  assert.equal(state.park.helpRequests[0].status, "resolved");
  assert.equal(state.park.history.length, 1);
});

test("stored Stage 5 state is bounded and malformed requests are discarded", () => {
  const normalized = normalizeStage5State({
    hospital: {
      pharmacyStock: { "hospital-main:bandage-kit": -40 },
      pharmacyTill: { "hospital-main": -1 },
      requests: [{ id: "bad", idempotencyKey: "bad", hospitalId: "fake", kind: "care", status: "open", patientId: "x", patientX: 0, patientZ: 0, createdAt: NOW }],
    },
    park: { till: -10, ticketHistory: [], helpRequests: [{ id: "bad", idempotencyKey: "bad", visitorId: "x", kind: "admin", status: "open", createdAt: NOW }] },
  });
  assert.equal(normalized.hospital.pharmacyStock["hospital-main:bandage-kit"], 0);
  assert.equal(normalized.hospital.pharmacyTill["hospital-main"], 0);
  assert.equal(normalized.hospital.requests.length, 0);
  assert.equal(normalized.park.till, 0);
  assert.equal(normalized.park.helpRequests.length, 0);
});

console.log("\n" + passed + " Stage 5 checks passed");
