export const STAGE12_VERSION = 1;
export const STAGE12_ACTION_LIMIT = 300;
export const STAGE12_SHIFT_MS = 15 * 60 * 1000;
export const STAGE12_FACILITY_RADIUS = 28;

export type Stage12BusinessKind =
  | "school"
  | "school-bus"
  | "office"
  | "call-centre"
  | "oil-rig"
  | "refinery"
  | "industrial-security"
  | "law-office"
  | "news-office"
  | "events";

export type Stage12Qualification =
  | "teacher-certificate"
  | "commercial-driver"
  | "office-administration"
  | "call-centre-training"
  | "industrial-safety"
  | "refinery-operations"
  | "security-training"
  | "law-practice"
  | "journalism"
  | "event-production";

export type Stage12Business = {
  id: string;
  name: string;
  kind: Stage12BusinessKind;
  x: number;
  z: number;
  rankTitles: readonly string[];
  requiredQualification: Stage12Qualification | null;
  restricted: boolean;
};

export type Stage12Actor = {
  actorId: string;
  workplaceId: string;
  rank: number;
  onDuty: boolean;
  uniform: boolean;
  qualifications: Stage12Qualification[];
  x: number;
  z: number;
};

export type Stage12Facility = {
  id: string;
  businessId: string;
  name: string;
  x: number;
  z: number;
  restricted: boolean;
  requiredQualification: Stage12Qualification | null;
};

export type Stage12Production = {
  id: string;
  facilityId: string;
  name: string;
  inputItem: string;
  inputUnits: number;
  outputItem: string;
  outputUnits: number;
  revenue: number;
  durationMs: number;
  maintenanceRequired: number;
  requiredRank: number;
};

export type Stage12Shift = {
  id: string;
  actorId: string;
  workplaceId: string;
  facilityId: string;
  productionId: string | null;
  startedAt: number;
  completedAt: number | null;
  status: "active" | "completed" | "cancelled";
  inputUnits: number;
  outputUnits: number;
  revenue: number;
};

export type Stage12State = {
  businesses: Record<string, Stage12Business>;
  facilities: Record<string, Stage12Facility>;
  productions: Record<string, Stage12Production>;
  inventories: Record<string, Record<string, number>>;
  maintenance: Record<string, number>;
  shifts: Stage12Shift[];
  qualifications: Record<string, Stage12Qualification[]>;
  completedRequests: Record<string, true>;
  ledger: Array<{ id: string; requestId: string; actorId: string; kind: "shift" | "office" | "education"; amount: number; at: number }>;
};

const ranks = (a: string, b: string, c: string, d: string, e: string, f: string): readonly string[] => [a, b, c, d, e, f];

export const STAGE12_BUSINESSES: readonly Stage12Business[] = [
  { id: "rivers-school-main", name: "Rivers Community School", kind: "school", x: 18, z: 18, rankTitles: ranks("Teaching Assistant", "Teacher", "Senior Teacher", "Head Teacher", "Vice Principal", "Principal"), requiredQualification: "teacher-certificate", restricted: true },
  { id: "school-transport-main", name: "Rivers School Transport", kind: "school-bus", x: 30, z: 12, rankTitles: ranks("Bus Assistant", "School Bus Driver", "Senior Driver", "Route Supervisor", "Transport Supervisor", "Transport Manager"), requiredQualification: "commercial-driver", restricted: true },
  { id: "office-centre-main", name: "Port Harcourt Business Centre", kind: "office", x: -12, z: 62, rankTitles: ranks("Office Assistant", "Receptionist", "Office Clerk", "Executive Assistant", "Office Supervisor", "Office Manager"), requiredQualification: "office-administration", restricted: false },
  { id: "call-centre-main", name: "Rivers Call Centre", kind: "call-centre", x: 55, z: 55, rankTitles: ranks("Call Agent Trainee", "Call Agent", "Senior Agent", "Team Lead", "Quality Supervisor", "Call Centre Manager"), requiredQualification: "call-centre-training", restricted: false },
  { id: "oil-rig-main", name: "Rivers Offshore Oil Platform", kind: "oil-rig", x: 160, z: -80, rankTitles: ranks("Rig Helper", "Rig Operator", "Senior Operator", "Drilling Technician", "Rig Supervisor", "Rig Manager"), requiredQualification: "industrial-safety", restricted: true },
  { id: "refinery-main", name: "Port Harcourt Refinery", kind: "refinery", x: 145, z: -25, rankTitles: ranks("Plant Helper", "Process Operator", "Senior Operator", "Refinery Technician", "Shift Supervisor", "Plant Manager"), requiredQualification: "refinery-operations", restricted: true },
  { id: "industrial-security-main", name: "Industrial Security Unit", kind: "industrial-security", x: 120, z: -5, rankTitles: ranks("Security Trainee", "Security Officer", "Senior Officer", "Security Lead", "Security Supervisor", "Security Manager"), requiredQualification: "security-training", restricted: true },
  { id: "law-office-main", name: "Rivers Legal Chambers", kind: "law-office", x: -65, z: 70, rankTitles: ranks("Legal Clerk", "Paralegal", "Associate", "Senior Associate", "Partner", "Managing Partner"), requiredQualification: "law-practice", restricted: true },
  { id: "news-office-main", name: "Rivers Media Bureau", kind: "news-office", x: -90, z: 42, rankTitles: ranks("News Assistant", "Reporter", "Senior Reporter", "Producer", "Editor", "News Director"), requiredQualification: "journalism", restricted: false },
  { id: "events-main", name: "Port Harcourt Events Company", kind: "events", x: -40, z: -70, rankTitles: ranks("Event Assistant", "DJ", "Senior DJ", "Event Producer", "Production Supervisor", "Events Director"), requiredQualification: "event-production", restricted: false },
];

export const STAGE12_FACILITIES: readonly Stage12Facility[] = [
  { id: "school-classroom", businessId: "rivers-school-main", name: "School classroom", x: 18, z: 18, restricted: true, requiredQualification: "teacher-certificate" },
  { id: "school-depot", businessId: "school-transport-main", name: "School bus depot", x: 30, z: 12, restricted: true, requiredQualification: "commercial-driver" },
  { id: "office-floor", businessId: "office-centre-main", name: "Office floor", x: -12, z: 62, restricted: false, requiredQualification: null },
  { id: "call-floor", businessId: "call-centre-main", name: "Call centre floor", x: 55, z: 55, restricted: false, requiredQualification: "call-centre-training" },
  { id: "oil-platform", businessId: "oil-rig-main", name: "Offshore production deck", x: 160, z: -80, restricted: true, requiredQualification: "industrial-safety" },
  { id: "refinery-plant", businessId: "refinery-main", name: "Refinery process plant", x: 145, z: -25, restricted: true, requiredQualification: "refinery-operations" },
  { id: "industrial-gate", businessId: "industrial-security-main", name: "Industrial security gate", x: 120, z: -5, restricted: true, requiredQualification: "security-training" },
  { id: "legal-floor", businessId: "law-office-main", name: "Legal chambers", x: -65, z: 70, restricted: true, requiredQualification: "law-practice" },
  { id: "news-floor", businessId: "news-office-main", name: "News office", x: -90, z: 42, restricted: false, requiredQualification: "journalism" },
  { id: "event-stage", businessId: "events-main", name: "Event stage", x: -40, z: -70, restricted: false, requiredQualification: "event-production" },
];

export const STAGE12_PRODUCTIONS: readonly Stage12Production[] = [
  { id: "crude-processing", facilityId: "refinery-plant", name: "Process crude batch", inputItem: "crude-oil", inputUnits: 10, outputItem: "refined-fuel", outputUnits: 7, revenue: 120000, durationMs: STAGE12_SHIFT_MS, maintenanceRequired: 4, requiredRank: 2 },
  { id: "oil-extraction", facilityId: "oil-platform", name: "Extract crude batch", inputItem: "rig-maintenance-kit", inputUnits: 2, outputItem: "crude-oil", outputUnits: 12, revenue: 90000, durationMs: STAGE12_SHIFT_MS, maintenanceRequired: 5, requiredRank: 2 },
  { id: "industrial-maintenance", facilityId: "oil-platform", name: "Platform maintenance", inputItem: "maintenance-kit", inputUnits: 1, outputItem: "maintenance-credit", outputUnits: 1, revenue: 30000, durationMs: STAGE12_SHIFT_MS / 2, maintenanceRequired: 8, requiredRank: 1 },
];

const money = (value: unknown): number => Number.isSafeInteger(value) && Number(value) >= 0 ? Number(value) : 0;
const id = (value: unknown, max = 120): string => String(value ?? "").trim().slice(0, max);
const validTime = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) > 0;
const distance = (a: Stage12Actor, f: Stage12Facility): number => Math.hypot(a.x - f.x, a.z - f.z);
const bounded = <T>(items: T[], item: T): void => { items.push(item); if (items.length > STAGE12_ACTION_LIMIT) items.splice(0, items.length - STAGE12_ACTION_LIMIT); };
const consume = (inv: Record<string, number>, item: string, units: number): boolean => {
  const have = money(inv[item]);
  if (have < units) return false;
  inv[item] = have - units;
  return true;
};
const grant = (inv: Record<string, number>, item: string, units: number): void => { inv[item] = money(inv[item]) + units; };
const hasQualification = (state: Stage12State, actor: Stage12Actor, q: Stage12Qualification | null): boolean => !q || actor.qualifications.includes(q) || (state.qualifications[actor.actorId] ?? []).includes(q);
const authorised = (state: Stage12State, actor: Stage12Actor, facility: Stage12Facility): boolean => {
  if (!actor.onDuty || !actor.uniform || distance(actor, facility) > STAGE12_FACILITY_RADIUS) return false;
  if (facility.requiredQualification && !hasQualification(state, actor, facility.requiredQualification)) return false;
  return true;
};
const markRequest = (state: Stage12State, requestId: string): boolean => {
  if (!requestId || state.completedRequests[requestId]) return false;
  state.completedRequests[requestId] = true;
  const keys = Object.keys(state.completedRequests);
  for (const key of keys.slice(0, Math.max(0, keys.length - STAGE12_ACTION_LIMIT))) delete state.completedRequests[key];
  return true;
};

export function createStage12State(): Stage12State {
  return {
    businesses: Object.fromEntries(STAGE12_BUSINESSES.map((b) => [b.id, { ...b }])) as Record<string, Stage12Business>,
    facilities: Object.fromEntries(STAGE12_FACILITIES.map((f) => [f.id, { ...f }])) as Record<string, Stage12Facility>,
    productions: Object.fromEntries(STAGE12_PRODUCTIONS.map((p) => [p.id, { ...p }])) as Record<string, Stage12Production>,
    inventories: {}, maintenance: Object.fromEntries(STAGE12_FACILITIES.map((f) => [f.id, 100])), shifts: [], qualifications: {}, completedRequests: {}, ledger: [],
  };
}

export function normalizeStage12State(raw: unknown): Stage12State {
  const base = createStage12State();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
  const v = raw as Record<string, unknown>;
  if (v.inventories && typeof v.inventories === "object" && !Array.isArray(v.inventories)) {
    for (const [actorId, rawInv] of Object.entries(v.inventories as Record<string, unknown>)) {
      if (!rawInv || typeof rawInv !== "object" || Array.isArray(rawInv)) continue;
      const inv: Record<string, number> = {};
      for (const [item, amount] of Object.entries(rawInv as Record<string, unknown>)) { const n = Number(amount); if (Number.isFinite(n) && n >= 0) inv[id(item)] = Math.min(1000000, Math.floor(n)); }
      base.inventories[id(actorId)] = inv;
    }
  }
  if (v.maintenance && typeof v.maintenance === "object" && !Array.isArray(v.maintenance)) for (const [key, value] of Object.entries(v.maintenance as Record<string, unknown>)) { const n = Number(value); if (base.facilities[key] && Number.isFinite(n)) base.maintenance[key] = Math.max(0, Math.min(100, n)); }
  if (v.qualifications && typeof v.qualifications === "object" && !Array.isArray(v.qualifications)) for (const [actorId, list] of Object.entries(v.qualifications as Record<string, unknown>)) if (Array.isArray(list)) base.qualifications[id(actorId)] = list.filter((q): q is Stage12Qualification => STAGE12_BUSINESSES.some((b) => b.requiredQualification === q) || ["teacher-certificate","commercial-driver","office-administration","call-centre-training","industrial-safety","refinery-operations","security-training","law-practice","journalism","event-production"].includes(String(q))) as Stage12Qualification[];
  if (v.completedRequests && typeof v.completedRequests === "object" && !Array.isArray(v.completedRequests)) for (const [key, flag] of Object.entries(v.completedRequests as Record<string, unknown>).slice(-STAGE12_ACTION_LIMIT)) if (flag === true) base.completedRequests[id(key)] = true;
  return base;
}

export function registerStage12Qualification(state: Stage12State, actorId: string, qualification: Stage12Qualification): void {
  const key = id(actorId); if (!key) throw new Error("actor required");
  const list = state.qualifications[key] ?? (state.qualifications[key] = []);
  if (!list.includes(qualification)) list.push(qualification);
}

export function checkStage12FacilityAccess(state: Stage12State, actor: Stage12Actor, facilityId: string): { ok: true } | { ok: false; reason: string } {
  const facility = state.facilities[id(facilityId)];
  if (!facility) return { ok: false, reason: "facility not found" };
  if (actor.workplaceId !== facility.businessId) return { ok: false, reason: "wrong workplace" };
  if (!authorised(state, actor, facility)) return { ok: false, reason: "qualification, duty, uniform or proximity check failed" };
  return { ok: true };
}

export function startStage12Shift(state: Stage12State, actor: Stage12Actor, requestId: string, facilityId: string, productionId: string | null, now: number): Stage12Shift {
  if (!validTime(now)) throw new Error("invalid timestamp");
  if (!markRequest(state, id(requestId))) throw new Error("request already used");
  const facility = state.facilities[id(facilityId)]; if (!facility) throw new Error("facility not found");
  if (actor.workplaceId !== facility.businessId || !authorised(state, actor, facility)) throw new Error("unauthorised facility access");
  if (state.shifts.some((s) => s.actorId === actor.actorId && s.status === "active")) throw new Error("active shift already exists");
  let production: Stage12Production | null = null;
  if (productionId) { production = state.productions[id(productionId)] ?? null; if (!production || production.facilityId !== facility.id || actor.rank < production.requiredRank) throw new Error("production not authorised"); if ((state.maintenance[facility.id] ?? 0) < production.maintenanceRequired) throw new Error("maintenance too low"); }
  const shift: Stage12Shift = { id: `shift-${id(requestId)}`, actorId: actor.actorId, workplaceId: actor.workplaceId, facilityId: facility.id, productionId: production?.id ?? null, startedAt: now, completedAt: null, status: "active", inputUnits: 0, outputUnits: 0, revenue: 0 };
  bounded(state.shifts, shift); return shift;
}

export function completeStage12Shift(state: Stage12State, actor: Stage12Actor, requestId: string, shiftId: string, now: number): Stage12Shift {
  if (!validTime(now) || !markRequest(state, id(requestId))) throw new Error("invalid or replayed request");
  const shift = state.shifts.find((s) => s.id === id(shiftId)); if (!shift || shift.actorId !== actor.actorId || shift.status !== "active") throw new Error("shift not found");
  const facility = state.facilities[shift.facilityId]; if (!facility || !authorised(state, actor, facility)) throw new Error("unauthorised completion");
  const production = shift.productionId ? state.productions[shift.productionId] : null;
  if (production && now - shift.startedAt < production.durationMs) throw new Error("shift not complete");
  const inv = state.inventories[actor.actorId] ?? (state.inventories[actor.actorId] = {});
  if (production) {
    if (!consume(inv, production.inputItem, production.inputUnits)) throw new Error("missing validated inputs");
    grant(inv, production.outputItem, production.outputUnits);
    state.maintenance[facility.id] = Math.max(0, (state.maintenance[facility.id] ?? 0) - production.maintenanceRequired);
    shift.inputUnits = production.inputUnits; shift.outputUnits = production.outputUnits; shift.revenue = production.revenue;
    bounded(state.ledger, { id: `ledger-${id(requestId)}`, requestId: id(requestId), actorId: actor.actorId, kind: "shift", amount: production.revenue, at: now });
  }
  shift.completedAt = now; shift.status = "completed"; return shift;
}

export function maintainStage12Facility(state: Stage12State, actor: Stage12Actor, requestId: string, facilityId: string, units: number, now: number): number {
  if (!validTime(now) || !markRequest(state, id(requestId))) throw new Error("invalid or replayed request");
  const facility = state.facilities[id(facilityId)]; if (!facility || actor.workplaceId !== facility.businessId || !authorised(state, actor, facility)) throw new Error("unauthorised maintenance");
  const amount = Number.isSafeInteger(units) ? Math.max(1, Math.min(50, units)) : 0; if (!amount) throw new Error("invalid maintenance amount");
  state.maintenance[facility.id] = Math.min(100, (state.maintenance[facility.id] ?? 0) + amount); return state.maintenance[facility.id];
}

export function createStage12OfficeTask(state: Stage12State, actor: Stage12Actor, requestId: string, now: number): { id: string; actorId: string; workplaceId: string; at: number } {
  if (!validTime(now) || !markRequest(state, id(requestId))) throw new Error("invalid or replayed request");
  const business = state.businesses[actor.workplaceId]; if (!business || !actor.onDuty || !actor.uniform) throw new Error("office duty required");
  if (!["office", "call-centre", "news-office", "events"].includes(business.kind)) throw new Error("not an office service");
  const task = { id: `office-${id(requestId)}`, actorId: actor.actorId, workplaceId: actor.workplaceId, at: now };
  bounded(state.ledger, { id: `ledger-${id(requestId)}`, requestId: id(requestId), actorId: actor.actorId, kind: "office", amount: 0, at: now }); return task;
}

export function awardStage12EducationTask(state: Stage12State, actor: Stage12Actor, requestId: string, studentCount: number, now: number): number {
  if (!validTime(now) || !markRequest(state, id(requestId))) throw new Error("invalid or replayed request");
  const school = state.businesses[actor.workplaceId]; if (!school || school.kind !== "school" || !actor.onDuty || !actor.uniform || !hasQualification(state, actor, "teacher-certificate")) throw new Error("qualified teacher required");
  const students = Number.isSafeInteger(studentCount) ? Math.max(1, Math.min(40, studentCount)) : 0; if (!students) throw new Error("invalid class size");
  const reward = students * 1500; bounded(state.ledger, { id: `ledger-${id(requestId)}`, requestId: id(requestId), actorId: actor.actorId, kind: "education", amount: reward, at: now }); return reward;
}
