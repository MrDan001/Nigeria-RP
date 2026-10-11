export const HOSPITAL_IDS = ["hospital-main", "hospital-princess"] as const;
export const PARK_WORKPLACE_ID = "park-main";
export const HOSPITAL_TREATMENT_FEE = 500;
export const HOSPITAL_HEAL_AMOUNT = 35;
export const AMBULANCE_TREATMENT_FEE = 1_200;
export const AMBULANCE_HEAL_AMOUNT = 50;
export const PARK_TICKET_PRICE = 500;
export const MAX_STAGE5_HISTORY = 100;
export const MAX_HOSPITAL_STOCK = 200;

export const HOSPITAL_MEDICINES = [
  { id: "paracetamol", name: "Paracetamol", inventoryItem: "Paracetamol", unitPrice: 800, startingStock: 30 },
  { id: "bandage-kit", name: "Bandage Kit", inventoryItem: "Bandage Kit", unitPrice: 1_500, startingStock: 30 },
  { id: "vitamin-c", name: "Vitamin C", inventoryItem: "Vitamin C", unitPrice: 700, startingStock: 30 },
] as const;

export const PARK_HELP_CATEGORIES = [
  { id: "visitor-assistance", title: "Visitor assistance" },
  { id: "lost-and-found", title: "Lost item / lost and found" },
  { id: "first-aid", title: "First aid assistance" },
] as const;

export type HospitalId = typeof HOSPITAL_IDS[number];
export type HospitalRequestKind = "care" | "ambulance";
export type HospitalRequestStatus = "open" | "dispatched" | "completed" | "cancelled";
export type ParkHelpKind = typeof PARK_HELP_CATEGORIES[number]["id"];

export type HospitalRequest = {
  id: string;
  idempotencyKey: string;
  hospitalId: HospitalId;
  kind: HospitalRequestKind;
  status: HospitalRequestStatus;
  patientId: string;
  patientX: number;
  patientZ: number;
  createdAt: number;
  triagedBy?: string;
  triagedAt?: number;
  assignedWorkerId?: string;
  completedBy?: string;
  completedAt?: number;
};

export type HospitalServiceRecord = {
  id: string;
  requestId: string;
  hospitalId: HospitalId;
  kind: "triage" | "treatment" | "ambulance-treatment" | "pharmacy-sale";
  patientId: string;
  workerId: string;
  amount: number;
  healthRestored: number;
  detail: string;
  createdAt: number;
};

export type PharmacyReceipt = {
  id: string;
  idempotencyKey: string;
  hospitalId: HospitalId;
  customerId: string;
  workerId: string;
  medicineId: string;
  medicineName: string;
  quantity: number;
  total: number;
  createdAt: number;
};

export type ParkTicket = {
  id: string;
  idempotencyKey: string;
  visitorId: string;
  sellerId: string;
  amount: number;
  dayKey: string;
  createdAt: number;
};

export type ParkHelpRequest = {
  id: string;
  idempotencyKey: string;
  visitorId: string;
  kind: ParkHelpKind;
  status: "open" | "resolved" | "cancelled";
  createdAt: number;
  resolvedBy?: string;
  resolvedAt?: number;
};

export type ParkActivityRecord = {
  id: string;
  requestId: string;
  visitorId: string;
  workerId: string;
  kind: ParkHelpKind;
  createdAt: number;
};

export type Stage5State = {
  hospital: {
    requests: HospitalRequest[];
    history: HospitalServiceRecord[];
    pharmacyStock: Record<string, number>;
    pharmacyTill: Record<HospitalId, number>;
    completedRequestKeys: Record<string, true>;
    completedPharmacyKeys: Record<string, true>;
    pharmacyHistory: PharmacyReceipt[];
  };
  park: {
    ticketsByVisitor: Record<string, ParkTicket>;
    ticketHistory: ParkTicket[];
    completedTicketKeys: Record<string, true>;
    helpRequests: ParkHelpRequest[];
    completedHelpKeys: Record<string, true>;
    history: ParkActivityRecord[];
    till: number;
  };
};

export type MoneyAccount = { cash: number; bank?: number };
export type PatientCondition = { hp: number; cash: number };

export function isHospitalId(value: string): value is HospitalId {
  return (HOSPITAL_IDS as readonly string[]).includes(value);
}

export function hospitalRankCanTriage(rank: number): boolean {
  return Number.isInteger(rank) && rank >= 2 && rank <= 6;
}

export function hospitalRankCanTreat(rank: number): boolean {
  // Orderlies and nursing aides can support intake; a Nurse/Registered Nurse or
  // higher rank is required to change a patient's health.
  return Number.isInteger(rank) && rank >= 3 && rank <= 6;
}

export function hospitalRankCanDispatch(rank: number): boolean {
  // The assigned dispatcher becomes the field responder for this request,
  // so dispatching requires a clinical rank capable of treating the patient.
  return Number.isInteger(rank) && rank >= 3 && rank <= 6;
}

export function parkRankCanSellTickets(rank: number): boolean {
  return Number.isInteger(rank) && rank >= 3 && rank <= 6;
}

export function parkRankCanHelpVisitors(rank: number): boolean {
  return Number.isInteger(rank) && rank >= 2 && rank <= 6;
}

export function createStage5State(): Stage5State {
  const pharmacyStock: Record<string, number> = {};
  for (const hospitalId of HOSPITAL_IDS) {
    for (const medicine of HOSPITAL_MEDICINES) {
      pharmacyStock[hospitalId + ":" + medicine.id] = medicine.startingStock;
    }
  }
  return {
    hospital: {
      requests: [],
      history: [],
      pharmacyStock,
      pharmacyTill: { "hospital-main": 0, "hospital-princess": 0 },
      completedRequestKeys: {},
      completedPharmacyKeys: {},
      pharmacyHistory: [],
    },
    park: {
      ticketsByVisitor: {},
      ticketHistory: [],
      completedTicketKeys: {},
      helpRequests: [],
      completedHelpKeys: {},
      history: [],
      till: 0,
    },
  };
}

function boundedId(value: unknown, max = 128): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function positiveInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) > 0;
}

function safeTimestamp(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
}

function keyRecord(value: unknown): Record<string, true> {
  const result: Record<string, true> = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return result;
  for (const key of Object.keys(value as Record<string, unknown>).slice(-5_000)) {
    const normalized = key.slice(0, 128);
    if (normalized) result[normalized] = true;
  }
  return result;
}

function pushBounded<T>(list: T[], item: T, max = MAX_STAGE5_HISTORY): void {
  list.push(item);
  if (list.length > max) list.splice(0, list.length - max);
}

export function createHospitalRequest(args: {
  state: Stage5State;
  requestId: string;
  idempotencyKey: string;
  hospitalId: string;
  kind: HospitalRequestKind;
  patientId: string;
  patientX: number;
  patientZ: number;
  patientHp: number;
  now: number;
}): { ok: true; request: HospitalRequest } | { ok: false; reason: string } {
  const { state, kind, patientX, patientZ, patientHp, now } = args;
  const requestId = boundedId(args.requestId, 100);
  const idempotencyKey = boundedId(args.idempotencyKey, 128);
  const hospitalId = String(args.hospitalId);
  const patientId = boundedId(args.patientId, 160);
  if (!requestId || !idempotencyKey) return { ok: false, reason: "invalid_request_id" };
  if (state.hospital.completedRequestKeys[idempotencyKey]) return { ok: false, reason: "duplicate_request" };
  if (!isHospitalId(hospitalId)) return { ok: false, reason: "unknown_hospital" };
  if (kind !== "care" && kind !== "ambulance") return { ok: false, reason: "invalid_request_kind" };
  if (!patientId || !Number.isFinite(patientX) || !Number.isFinite(patientZ)) return { ok: false, reason: "invalid_patient" };
  if (!Number.isInteger(patientHp) || patientHp < 0 || patientHp >= 100) return { ok: false, reason: "no_treatment_needed" };
  if (kind === "ambulance" && patientHp > 80) return { ok: false, reason: "ambulance_not_needed" };
  if (!safeTimestamp(now)) return { ok: false, reason: "invalid_timestamp" };
  if (state.hospital.requests.some(r => r.patientId === patientId && r.kind === kind && (r.status === "open" || r.status === "dispatched"))) {
    return { ok: false, reason: "request_already_open" };
  }
  const request: HospitalRequest = {
    id: requestId,
    idempotencyKey,
    hospitalId,
    kind,
    status: "open",
    patientId,
    patientX,
    patientZ,
    createdAt: Math.floor(now),
  };
  state.hospital.completedRequestKeys[idempotencyKey] = true;
  pushBounded(state.hospital.requests, request, 200);
  return { ok: true, request };
}

export function triageHospitalRequest(args: {
  state: Stage5State;
  requestId: string;
  workerId: string;
  workerRank: number;
  hospitalId: string;
  onDuty: boolean;
  uniform: boolean;
  atHospital: boolean;
  patientAtHospital: boolean;
  now: number;
}): { ok: true; request: HospitalRequest } | { ok: false; reason: string } {
  const hospitalId = String(args.hospitalId);
  if (!isHospitalId(hospitalId)) return { ok: false, reason: "unknown_hospital" };
  if (!args.workerId || !hospitalRankCanTriage(args.workerRank) || !args.onDuty || !args.uniform || !args.atHospital) {
    return { ok: false, reason: "unauthorized_clinician" };
  }
  const request = args.state.hospital.requests.find(r => r.id === args.requestId);
  if (!request || request.hospitalId !== hospitalId || request.kind !== "care" || request.status !== "open") {
    return { ok: false, reason: "request_unavailable" };
  }
  if (!args.patientAtHospital) return { ok: false, reason: "patient_not_at_hospital" };
  if (request.triagedAt) return { ok: false, reason: "already_triaged" };
  const now = safeTimestamp(args.now);
  if (!now) return { ok: false, reason: "invalid_timestamp" };
  request.triagedBy = boundedId(args.workerId, 160);
  request.triagedAt = now;
  pushBounded(args.state.hospital.history, {
    id: "triage-" + request.id,
    requestId: request.id,
    hospitalId,
    kind: "triage",
    patientId: request.patientId,
    workerId: request.triagedBy,
    amount: 0,
    healthRestored: 0,
    detail: "Patient intake and triage completed",
    createdAt: now,
  });
  return { ok: true, request };
}

export function dispatchHospitalAmbulance(args: {
  state: Stage5State;
  requestId: string;
  workerId: string;
  workerRank: number;
  hospitalId: string;
  onDuty: boolean;
  uniform: boolean;
  atHospital: boolean;
  now: number;
}): { ok: true; request: HospitalRequest } | { ok: false; reason: string } {
  const hospitalId = String(args.hospitalId);
  if (!isHospitalId(hospitalId)) return { ok: false, reason: "unknown_hospital" };
  if (!args.workerId || !hospitalRankCanDispatch(args.workerRank) || !args.onDuty || !args.uniform || !args.atHospital) {
    return { ok: false, reason: "unauthorized_dispatcher" };
  }
  const request = args.state.hospital.requests.find(r => r.id === args.requestId);
  if (!request || request.hospitalId !== hospitalId || request.kind !== "ambulance" || request.status !== "open") {
    return { ok: false, reason: "request_unavailable" };
  }
  const now = safeTimestamp(args.now);
  if (!now) return { ok: false, reason: "invalid_timestamp" };
  request.status = "dispatched";
  request.assignedWorkerId = boundedId(args.workerId, 160);
  pushBounded(args.state.hospital.history, {
    id: "dispatch-" + request.id,
    requestId: request.id,
    hospitalId,
    kind: "triage",
    patientId: request.patientId,
    workerId: request.assignedWorkerId,
    amount: 0,
    healthRestored: 0,
    detail: "Ambulance dispatched to the patient",
    createdAt: now,
  });
  return { ok: true, request };
}

export function completeHospitalTreatment(args: {
  state: Stage5State;
  requestId: string;
  patientId: string;
  workerId: string;
  workerRank: number;
  hospitalId: string;
  onDuty: boolean;
  uniform: boolean;
  atHospital: boolean;
  patientAtHospital: boolean;
  ambulanceProximityValid: boolean;
  patient: PatientCondition;
  now: number;
}): { ok: true; request: HospitalRequest; amount: number; healthRestored: number; newHp: number; newCash: number } | { ok: false; reason: string } {
  const hospitalId = String(args.hospitalId);
  if (!isHospitalId(hospitalId)) return { ok: false, reason: "unknown_hospital" };
  if (!args.workerId || !hospitalRankCanTreat(args.workerRank) || !args.onDuty || !args.uniform) {
    return { ok: false, reason: "unauthorized_clinician" };
  }
  const request = args.state.hospital.requests.find(r => r.id === args.requestId);
  if (!request || request.hospitalId !== hospitalId || request.patientId !== args.patientId) {
    return { ok: false, reason: "request_unavailable" };
  }
  if (request.status !== (request.kind === "ambulance" ? "dispatched" : "open")) {
    return { ok: false, reason: "request_unavailable" };
  }
  if (request.kind === "care" && !request.triagedAt) {
    return { ok: false, reason: "triage_required" };
  }
  if (request.kind === "care" && (!args.atHospital || !args.patientAtHospital)) {
    return { ok: false, reason: "patient_not_at_hospital" };
  }
  if (request.kind === "ambulance" && (request.assignedWorkerId !== args.workerId || !args.ambulanceProximityValid)) {
    return { ok: false, reason: "ambulance_not_at_patient" };
  }
  const patientHp = Number(args.patient.hp);
  const patientCash = Number(args.patient.cash);
  if (!Number.isInteger(patientHp) || patientHp < 0 || patientHp >= 100) return { ok: false, reason: "no_treatment_needed" };
  const amount = request.kind === "ambulance" ? AMBULANCE_TREATMENT_FEE : HOSPITAL_TREATMENT_FEE;
  const heal = request.kind === "ambulance" ? AMBULANCE_HEAL_AMOUNT : HOSPITAL_HEAL_AMOUNT;
  if (!Number.isSafeInteger(patientCash) || patientCash < amount) return { ok: false, reason: "insufficient_cash" };
  if (!safeTimestamp(args.now)) return { ok: false, reason: "invalid_timestamp" };
  const now = Math.floor(args.now);
  const oldHp = patientHp;
  args.patient.cash = patientCash - amount;
  args.patient.hp = Math.min(100, patientHp + heal);
  request.status = "completed";
  request.completedBy = boundedId(args.workerId, 160);
  request.completedAt = now;
  const restored = args.patient.hp - oldHp;
  pushBounded(args.state.hospital.history, {
    id: (request.kind === "ambulance" ? "ambulance-treatment-" : "treatment-") + request.id,
    requestId: request.id,
    hospitalId,
    kind: request.kind === "ambulance" ? "ambulance-treatment" : "treatment",
    patientId: request.patientId,
    workerId: request.completedBy,
    amount,
    healthRestored: restored,
    detail: request.kind === "ambulance" ? "Emergency field treatment" : "Hospital treatment",
    createdAt: now,
  });
  return { ok: true, request, amount, healthRestored: restored, newHp: args.patient.hp, newCash: args.patient.cash };
}

export function purchaseHospitalMedicine(args: {
  state: Stage5State;
  requestId: string;
  idempotencyKey: string;
  hospitalId: string;
  customerId: string;
  workerId: string;
  workerRank: number;
  onDuty: boolean;
  uniform: boolean;
  medicineId: string;
  quantity: number;
  customerCash: number;
  inventory: Record<string, number>;
  now: number;
}): { ok: true; receipt: PharmacyReceipt; newCash: number; inventory: Record<string, number> } | { ok: false; reason: string } {
  const hospitalId = String(args.hospitalId);
  if (!isHospitalId(hospitalId)) return { ok: false, reason: "unknown_hospital" };
  if (!args.workerId || args.customerId === args.workerId || !hospitalRankCanTriage(args.workerRank) || !args.onDuty || !args.uniform) {
    return { ok: false, reason: "unauthorized_pharmacy_worker" };
  }
  const requestId = boundedId(args.requestId, 100);
  const key = boundedId(args.idempotencyKey, 128);
  if (!requestId || !key) return { ok: false, reason: "invalid_request_id" };
  if (args.state.hospital.completedPharmacyKeys[key]) return { ok: false, reason: "duplicate_order" };
  const medicine = HOSPITAL_MEDICINES.find(p => p.id === args.medicineId);
  if (!medicine) return { ok: false, reason: "unknown_medicine" };
  if (!Number.isSafeInteger(args.quantity) || args.quantity < 1 || args.quantity > 10) return { ok: false, reason: "invalid_quantity" };
  const stockKey = hospitalId + ":" + medicine.id;
  const stock = Number(args.state.hospital.pharmacyStock[stockKey] ?? 0);
  const cash = Number(args.customerCash);
  const currentInventory = Number(args.inventory[medicine.inventoryItem] ?? 0);
  if (!Number.isSafeInteger(stock) || stock < args.quantity) return { ok: false, reason: "insufficient_stock" };
  if (!Number.isSafeInteger(cash) || cash < 0 || !Number.isSafeInteger(currentInventory) || currentInventory < 0) {
    return { ok: false, reason: "invalid_balance" };
  }
  if (currentInventory + args.quantity > 9999) return { ok: false, reason: "inventory_limit" };
  const total = medicine.unitPrice * args.quantity;
  if (!Number.isSafeInteger(total) || cash < total) return { ok: false, reason: "insufficient_cash" };
  const currentTill = Number(args.state.hospital.pharmacyTill[hospitalId] ?? 0);
  if (!Number.isSafeInteger(currentTill) || currentTill < 0 ||
      currentTill > Number.MAX_SAFE_INTEGER - total) return { ok: false, reason: "balance_limit" };
  const now = safeTimestamp(args.now);
  if (!now) return { ok: false, reason: "invalid_timestamp" };
  args.state.hospital.pharmacyStock[stockKey] = stock - args.quantity;
  args.state.hospital.pharmacyTill[hospitalId] = currentTill + total;
  args.state.hospital.completedPharmacyKeys[key] = true;
  args.inventory[medicine.inventoryItem] = currentInventory + args.quantity;
  const receipt: PharmacyReceipt = {
    id: "pharmacy-" + key.slice(0, 20),
    idempotencyKey: key,
    hospitalId,
    customerId: boundedId(args.customerId, 160),
    workerId: boundedId(args.workerId, 160),
    medicineId: medicine.id,
    medicineName: medicine.name,
    quantity: args.quantity,
    total,
    createdAt: now,
  };
  pushBounded(args.state.hospital.pharmacyHistory, receipt);
  return { ok: true, receipt, newCash: cash - total, inventory: args.inventory };
}

export function buyParkTicket(args: {
  state: Stage5State;
  requestId: string;
  idempotencyKey: string;
  visitorId: string;
  sellerId: string;
  sellerRank: number;
  sellerOnDuty: boolean;
  sellerUniform: boolean;
  visitorAtPark: boolean;
  sellerAtPark: boolean;
  visitorCash: number;
  dayKey: string;
  now: number;
}): { ok: true; ticket: ParkTicket; newCash: number; till: number } | { ok: false; reason: string } {
  const requestId = boundedId(args.requestId, 100);
  const key = boundedId(args.idempotencyKey, 128);
  const visitorId = boundedId(args.visitorId, 160);
  const sellerId = boundedId(args.sellerId, 160);
  if (!requestId || !key) return { ok: false, reason: "invalid_request_id" };
  if (args.state.park.completedTicketKeys[key]) return { ok: false, reason: "duplicate_ticket_sale" };
  if (!visitorId || !sellerId || visitorId === sellerId) return { ok: false, reason: "invalid_participants" };
  if (!parkRankCanSellTickets(args.sellerRank) || !args.sellerOnDuty || !args.sellerUniform || !args.sellerAtPark) {
    return { ok: false, reason: "unauthorized_ticket_seller" };
  }
  if (!args.visitorAtPark) return { ok: false, reason: "visitor_not_at_park" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(args.dayKey)) return { ok: false, reason: "invalid_day" };
  if (!safeTimestamp(args.now)) return { ok: false, reason: "invalid_timestamp" };
  const old = args.state.park.ticketsByVisitor[visitorId];
  if (old && old.dayKey === args.dayKey) return { ok: false, reason: "ticket_already_valid" };
  const cash = Number(args.visitorCash);
  const till = Number(args.state.park.till);
  if (!Number.isSafeInteger(cash) || cash < PARK_TICKET_PRICE) return { ok: false, reason: "insufficient_cash" };
  if (!Number.isSafeInteger(till) || till < 0 || till + PARK_TICKET_PRICE > Number.MAX_SAFE_INTEGER) {
    return { ok: false, reason: "balance_limit" };
  }
  const ticket: ParkTicket = {
    id: "park-ticket-" + key.slice(0, 20),
    idempotencyKey: key,
    visitorId,
    sellerId,
    amount: PARK_TICKET_PRICE,
    dayKey: args.dayKey,
    createdAt: Math.floor(args.now),
  };
  args.state.park.completedTicketKeys[key] = true;
  args.state.park.ticketsByVisitor[visitorId] = ticket;
  pushBounded(args.state.park.ticketHistory, ticket);
  args.state.park.till = till + PARK_TICKET_PRICE;
  return { ok: true, ticket, newCash: cash - PARK_TICKET_PRICE, till: args.state.park.till };
}

export function createParkHelpRequest(args: {
  state: Stage5State;
  requestId: string;
  idempotencyKey: string;
  visitorId: string;
  kind: string;
  atPark: boolean;
  now: number;
}): { ok: true; request: ParkHelpRequest } | { ok: false; reason: string } {
  const requestId = boundedId(args.requestId, 100);
  const key = boundedId(args.idempotencyKey, 128);
  const visitorId = boundedId(args.visitorId, 160);
  const kind = PARK_HELP_CATEGORIES.find(p => p.id === args.kind)?.id;
  if (!requestId || !key) return { ok: false, reason: "invalid_request_id" };
  if (args.state.park.completedHelpKeys[key]) return { ok: false, reason: "duplicate_request" };
  if (!visitorId) return { ok: false, reason: "invalid_visitor" };
  if (!kind) return { ok: false, reason: "invalid_help_kind" };
  if (!args.atPark) return { ok: false, reason: "visitor_not_at_park" };
  if (args.state.park.helpRequests.some(r => r.visitorId === visitorId && r.status === "open")) {
    return { ok: false, reason: "request_already_open" };
  }
  const createdAt = safeTimestamp(args.now);
  if (!createdAt) return { ok: false, reason: "invalid_timestamp" };
  const request: ParkHelpRequest = { id: requestId, idempotencyKey: key, visitorId, kind, status: "open", createdAt };
  args.state.park.completedHelpKeys[key] = true;
  pushBounded(args.state.park.helpRequests, request, 200);
  return { ok: true, request };
}

export function resolveParkHelpRequest(args: {
  state: Stage5State;
  requestId: string;
  workerId: string;
  workerRank: number;
  onDuty: boolean;
  uniform: boolean;
  atPark: boolean;
  now: number;
}): { ok: true; request: ParkHelpRequest; record: ParkActivityRecord } | { ok: false; reason: string } {
  const workerId = boundedId(args.workerId, 160);
  if (!workerId || !parkRankCanHelpVisitors(args.workerRank) || !args.onDuty || !args.uniform || !args.atPark) {
    return { ok: false, reason: "unauthorized_park_worker" };
  }
  const request = args.state.park.helpRequests.find(r => r.id === args.requestId);
  if (!request || request.status !== "open") return { ok: false, reason: "request_unavailable" };
  const createdAt = safeTimestamp(args.now);
  if (!createdAt) return { ok: false, reason: "invalid_timestamp" };
  request.status = "resolved";
  request.resolvedBy = workerId;
  request.resolvedAt = createdAt;
  const record: ParkActivityRecord = {
    id: "park-help-" + request.id,
    requestId: request.id,
    visitorId: request.visitorId,
    workerId,
    kind: request.kind,
    createdAt,
  };
  pushBounded(args.state.park.history, record);
  return { ok: true, request, record };
}

export function normalizeStage5State(input: unknown): Stage5State {
  const base = createStage5State();
  const raw = input && typeof input === "object" && !Array.isArray(input) ? input as Record<string, unknown> : {};
  const h = raw.hospital && typeof raw.hospital === "object" && !Array.isArray(raw.hospital) ? raw.hospital as Record<string, unknown> : {};
  const p = raw.park && typeof raw.park === "object" && !Array.isArray(raw.park) ? raw.park as Record<string, unknown> : {};

  for (const hospitalId of HOSPITAL_IDS) {
    const till = Number((h.pharmacyTill as Record<string, unknown> | undefined)?.[hospitalId] ?? 0);
    base.hospital.pharmacyTill[hospitalId] = Number.isSafeInteger(till) ? Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, till)) : 0;
    for (const medicine of HOSPITAL_MEDICINES) {
      const key = hospitalId + ":" + medicine.id;
      const stock = Number((h.pharmacyStock as Record<string, unknown> | undefined)?.[key] ?? medicine.startingStock);
      base.hospital.pharmacyStock[key] = Number.isSafeInteger(stock) ? Math.max(0, Math.min(MAX_HOSPITAL_STOCK, stock)) : medicine.startingStock;
    }
  }

  const completedRequestKeys = keyRecord(h.completedRequestKeys);
  const completedPharmacyKeys = keyRecord(h.completedPharmacyKeys);
  const completedTicketKeys = keyRecord(p.completedTicketKeys);
  const completedHelpKeys = keyRecord(p.completedHelpKeys);

  if (Array.isArray(h.requests)) {
    for (const entry of h.requests) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
      const v = entry as Record<string, unknown>;
      const id = boundedId(v.id, 100);
      const idempotencyKey = boundedId(v.idempotencyKey, 128);
      const hospitalId = String(v.hospitalId);
      const kind = v.kind;
      const status = v.status;
      const createdAt = safeTimestamp(v.createdAt);
      const x = Number(v.patientX);
      const z = Number(v.patientZ);
      if (!id || !idempotencyKey || !isHospitalId(hospitalId) ||
          (kind !== "care" && kind !== "ambulance") ||
          !["open", "dispatched", "completed", "cancelled"].includes(String(status)) ||
          !boundedId(v.patientId, 160) || !createdAt || !Number.isFinite(x) || !Number.isFinite(z)) continue;
      const request: HospitalRequest = {
        id, idempotencyKey, hospitalId, kind, status: status as HospitalRequestStatus,
        patientId: boundedId(v.patientId, 160), patientX: x, patientZ: z, createdAt,
      };
      const triagedAt = safeTimestamp(v.triagedAt);
      const completedAt = safeTimestamp(v.completedAt);
      if (boundedId(v.triagedBy, 160) && triagedAt) { request.triagedBy = boundedId(v.triagedBy, 160); request.triagedAt = triagedAt; }
      if (boundedId(v.assignedWorkerId, 160)) request.assignedWorkerId = boundedId(v.assignedWorkerId, 160);
      if (boundedId(v.completedBy, 160) && completedAt) { request.completedBy = boundedId(v.completedBy, 160); request.completedAt = completedAt; }
      pushBounded(base.hospital.requests, request, 200);
    }
  }

  if (Array.isArray(h.history)) {
    for (const entry of h.history) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
      const v = entry as Record<string, unknown>;
      const hospitalId = String(v.hospitalId);
      const createdAt = safeTimestamp(v.createdAt);
      const kind = v.kind;
      const amount = Number(v.amount);
      const healthRestored = Number(v.healthRestored);
      if (!boundedId(v.id, 140) || !boundedId(v.requestId, 100) || !isHospitalId(hospitalId) ||
          !["triage", "treatment", "ambulance-treatment", "pharmacy-sale"].includes(String(kind)) ||
          !boundedId(v.patientId, 160) || !boundedId(v.workerId, 160) ||
          !Number.isSafeInteger(amount) || amount < 0 || !Number.isSafeInteger(healthRestored) || healthRestored < 0 || !createdAt) continue;
      pushBounded(base.hospital.history, {
        id: boundedId(v.id, 140), requestId: boundedId(v.requestId, 100), hospitalId,
        kind: kind as HospitalServiceRecord["kind"], patientId: boundedId(v.patientId, 160),
        workerId: boundedId(v.workerId, 160), amount, healthRestored,
        detail: boundedId(v.detail, 240), createdAt,
      });
    }
  }

  if (Array.isArray(h.pharmacyHistory)) {
    for (const entry of h.pharmacyHistory) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
      const v = entry as Record<string, unknown>;
      const hospitalId = String(v.hospitalId);
      const medicine = HOSPITAL_MEDICINES.find(m => m.id === String(v.medicineId));
      const quantity = Number(v.quantity);
      const total = Number(v.total);
      const createdAt = safeTimestamp(v.createdAt);
      if (!boundedId(v.id, 140) || !boundedId(v.idempotencyKey, 128) || !isHospitalId(hospitalId) ||
          !boundedId(v.customerId, 160) || !boundedId(v.workerId, 160) || !medicine ||
          !positiveInteger(quantity) || quantity > 10 || total !== medicine.unitPrice * quantity || !createdAt) continue;
      pushBounded(base.hospital.pharmacyHistory, {
        id: boundedId(v.id, 140), idempotencyKey: boundedId(v.idempotencyKey, 128), hospitalId,
        customerId: boundedId(v.customerId, 160), workerId: boundedId(v.workerId, 160),
        medicineId: medicine.id, medicineName: medicine.name, quantity, total, createdAt,
      });
    }
  }

  base.hospital.completedRequestKeys = completedRequestKeys;
  base.hospital.completedPharmacyKeys = completedPharmacyKeys;

  if (Array.isArray(p.ticketHistory)) {
    for (const entry of p.ticketHistory) {
      const ticket = normalizeTicket(entry);
      if (ticket) pushBounded(base.park.ticketHistory, ticket);
    }
  }
  if (p.ticketsByVisitor && typeof p.ticketsByVisitor === "object" && !Array.isArray(p.ticketsByVisitor)) {
    for (const [visitorId, entry] of Object.entries(p.ticketsByVisitor as Record<string, unknown>).slice(-5000)) {
      const ticket = normalizeTicket(entry);
      if (ticket && ticket.visitorId === visitorId) base.park.ticketsByVisitor[visitorId.slice(0, 160)] = ticket;
    }
  }
  if (Array.isArray(p.helpRequests)) {
    for (const entry of p.helpRequests) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
      const v = entry as Record<string, unknown>;
      const kind = PARK_HELP_CATEGORIES.find(item => item.id === v.kind)?.id;
      const status = v.status;
      const createdAt = safeTimestamp(v.createdAt);
      if (!boundedId(v.id, 100) || !boundedId(v.idempotencyKey, 128) || !boundedId(v.visitorId, 160) ||
          !kind || (status !== "open" && status !== "resolved" && status !== "cancelled") || !createdAt) continue;
      const request: ParkHelpRequest = {
        id: boundedId(v.id, 100), idempotencyKey: boundedId(v.idempotencyKey, 128),
        visitorId: boundedId(v.visitorId, 160), kind, status, createdAt,
      };
      const resolvedAt = safeTimestamp(v.resolvedAt);
      if (boundedId(v.resolvedBy, 160) && resolvedAt) { request.resolvedBy = boundedId(v.resolvedBy, 160); request.resolvedAt = resolvedAt; }
      pushBounded(base.park.helpRequests, request, 200);
    }
  }
  if (Array.isArray(p.history)) {
    for (const entry of p.history) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
      const v = entry as Record<string, unknown>;
      const kind = PARK_HELP_CATEGORIES.find(item => item.id === v.kind)?.id;
      const createdAt = safeTimestamp(v.createdAt);
      if (!boundedId(v.id, 140) || !boundedId(v.requestId, 100) || !boundedId(v.visitorId, 160) ||
          !boundedId(v.workerId, 160) || !kind || !createdAt) continue;
      pushBounded(base.park.history, {
        id: boundedId(v.id, 140), requestId: boundedId(v.requestId, 100),
        visitorId: boundedId(v.visitorId, 160), workerId: boundedId(v.workerId, 160), kind, createdAt,
      });
    }
  }
  const till = Number(p.till);
  base.park.till = Number.isSafeInteger(till) ? Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, till)) : 0;
  base.park.completedTicketKeys = completedTicketKeys;
  base.park.completedHelpKeys = completedHelpKeys;
  return base;
}

function normalizeTicket(value: unknown): ParkTicket | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  const id = boundedId(v.id, 140);
  const idempotencyKey = boundedId(v.idempotencyKey, 128);
  const visitorId = boundedId(v.visitorId, 160);
  const sellerId = boundedId(v.sellerId, 160);
  const dayKey = boundedId(v.dayKey, 10);
  const amount = Number(v.amount);
  const createdAt = safeTimestamp(v.createdAt);
  if (!id || !idempotencyKey || !visitorId || !sellerId || !/^\d{4}-\d{2}-\d{2}$/.test(dayKey) ||
      amount !== PARK_TICKET_PRICE || !createdAt) return null;
  return { id, idempotencyKey, visitorId, sellerId, amount, dayKey, createdAt };
}
