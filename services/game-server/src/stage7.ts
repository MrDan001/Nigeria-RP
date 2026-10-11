export const POLICE_WORKPLACE_ID = "police-rivers";
export const ARMY_WORKPLACE_ID = "army-rivers";
export const FRSC_WORKPLACE_ID = "frsc-rivers";
export const FIRE_WORKPLACE_ID = "fire-rivers";

export type Stage7UnitId = typeof POLICE_WORKPLACE_ID | typeof ARMY_WORKPLACE_ID | typeof FRSC_WORKPLACE_ID | typeof FIRE_WORKPLACE_ID;
export type IncidentKind = "crime" | "traffic-accident" | "fire" | "public-safety";
export type IncidentStatus = "open" | "dispatched" | "resolved";
export type Offence = "speeding" | "illegal-parking" | "reckless-driving" | "dangerous-driving" | "unsafe-load" | "obstructing-emergency";
export type ActionKind = "report" | "dispatch" | "investigation" | "arrest" | "fine" | "fire-extinguished" | "traffic-cleared" | "incident-closed" | "checkpoint-activated" | "checkpoint-deactivated" | "appeal-requested" | "appeal-reviewed" | "escape" | "detention-released";

export type Stage7Incident = {
  id: string; requestId: string; kind: IncidentKind; description: string; reporterId: string; reporterName: string;
  x: number; z: number; createdAt: number; status: IncidentStatus; assignedWorkplaceId: Stage7UnitId | null;
  assignedById: string | null; dispatchedAt: number | null; resolvedAt: number | null; resolution: string | null;
};
export type Stage7Action = {
  id: string; requestId: string; type: ActionKind; incidentId?: string; actorId: string; actorName: string;
  workplaceId?: Stage7UnitId; targetId?: string; targetName?: string; at: number; reason?: string; evidence?: string;
  amount?: number; offence?: Offence; details?: string; success: boolean;
};
export type Stage7Checkpoint = {
  id: string; name: string; x: number; z: number; radius: number; active: boolean;
  activatedBy: string | null; activatedAt: number; expiresAt: number; deactivatedBy?: string; deactivatedAt?: number;
};
export type Stage7Detention = {
  accountId: string; accountName: string; incidentId: string; arrestedById: string; arrestedByName: string;
  reason: string; evidence: string; startedAt: number; expiresAt: number; canEscapeAt: number;
  appealRequested: boolean; appealReason: string; appealRequestedAt: number;
  appealReviewedAt?: number; appealDecision?: "released" | "denied"; appealReviewReason?: string;
};
export type Stage7State = { incidents: Stage7Incident[]; actions: Stage7Action[]; checkpoints: Stage7Checkpoint[]; detentions: Record<string, Stage7Detention> };
export type Stage7Result = { ok: boolean; state: Stage7State; message: string; incident?: Stage7Incident; action?: Stage7Action; fine?: { amount: number; offence: Offence; targetId: string; targetName: string } };
export type CheckpointDefinition = { id: string; name: string; x: number; z: number; radius: number };

export const STAGE7_INCIDENT_LIMIT = 120;
export const STAGE7_ACTION_LIMIT = 500;
export const STAGE7_DETENTION_MS = 120_000;
export const STAGE7_ESCAPE_DELAY_MS = 15_000;
export const STAGE7_CHECKPOINT_DURATION_MS = 20 * 60_000;
export const STAGE7_UNITS: Readonly<Record<Stage7UnitId, { label: string; kind: "police" | "army" | "frsc" | "fire" }>> = {
  [POLICE_WORKPLACE_ID]: { label: "Rivers State Police Service", kind: "police" },
  [ARMY_WORKPLACE_ID]: { label: "Nigerian Army", kind: "army" },
  [FRSC_WORKPLACE_ID]: { label: "Federal Road Safety Corps", kind: "frsc" },
  [FIRE_WORKPLACE_ID]: { label: "Rivers State Fire & Rescue", kind: "fire" },
};
export const STAGE7_CHECKPOINTS: readonly CheckpointDefinition[] = [
  { id: "army-main-gate", name: "Port Harcourt Garrison main gate", x: 185, z: -150, radius: 9 },
  { id: "trans-amadi-checkpoint", name: "Trans Amadi industrial checkpoint", x: 210, z: -120, radius: 9 },
  { id: "city-centre-checkpoint", name: "Port Harcourt city-centre checkpoint", x: -30, z: -100, radius: 9 },
];
export const STAGE7_FINE_RULES: Readonly<Record<Offence, { label: string; maximum: number }>> = {
  speeding: { label: "Speeding", maximum: 15_000 },
  "illegal-parking": { label: "Illegal parking", maximum: 10_000 },
  "reckless-driving": { label: "Reckless driving", maximum: 50_000 },
  "dangerous-driving": { label: "Dangerous driving", maximum: 75_000 },
  "unsafe-load": { label: "Unsafe or unsecured load", maximum: 25_000 },
  "obstructing-emergency": { label: "Obstructing an emergency response", maximum: 35_000 },
};
const KINDS: IncidentKind[] = ["crime", "traffic-accident", "fire", "public-safety"];
const STATUSES: IncidentStatus[] = ["open", "dispatched", "resolved"];
const ACTIONS: ActionKind[] = ["report", "dispatch", "investigation", "arrest", "fine", "fire-extinguished", "traffic-cleared", "incident-closed", "checkpoint-activated", "checkpoint-deactivated", "appeal-requested", "appeal-reviewed", "escape", "detention-released"];
const OFFENCES: Offence[] = ["speeding", "illegal-parking", "reckless-driving", "dangerous-driving", "unsafe-load", "obstructing-emergency"];

function isRecord(v: unknown): v is Record<string, unknown> { return !!v && typeof v === "object" && !Array.isArray(v); }
function clean(v: unknown, max = 180): string { return String(v ?? "").replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, max); }
function number(v: unknown): number { const n = Number(v); return Number.isFinite(n) ? n : NaN; }
function whole(v: unknown): number { const n = Number(v); return Number.isSafeInteger(n) ? n : -1; }
function time(v: unknown, fallback = 0): number { const n = Number(v); return Number.isSafeInteger(n) && n >= 0 ? n : fallback; }
function isKind(v: unknown): v is IncidentKind { return KINDS.includes(v as IncidentKind); }
function isUnit(v: unknown): v is Stage7UnitId { return typeof v === "string" && Object.prototype.hasOwnProperty.call(STAGE7_UNITS, v); }
function isOffence(v: unknown): v is Offence { return OFFENCES.includes(v as Offence); }
function distance(a: number, b: number, c: number, d: number): number { return Math.hypot(a - c, b - d); }
function clone(s: Stage7State): Stage7State {
  return { incidents: s.incidents.slice(), actions: s.actions.slice(), checkpoints: s.checkpoints.map(c => ({ ...c })), detentions: { ...s.detentions } };
}
function requestUsed(s: Stage7State, id: string): boolean {
  return s.incidents.some(i => i.requestId === id) || s.actions.some(a => a.requestId === id);
}
function fail(s: Stage7State, message: string): Stage7Result { return { ok: false, state: s, message }; }
function makeAction(a: {
  requestId: string; type: ActionKind; actorId: string; actorName: string; now: number; incidentId?: string;
  workplaceId?: Stage7UnitId; targetId?: string; targetName?: string; reason?: string; evidence?: string;
  amount?: number; offence?: Offence; details?: string;
}): Stage7Action {
  return {
    id: "stage7-action:" + a.requestId, requestId: a.requestId, type: a.type,
    actorId: clean(a.actorId, 120) || "unknown", actorName: clean(a.actorName, 80) || "Unknown citizen",
    at: time(a.now), success: true,
    ...(a.incidentId ? { incidentId: clean(a.incidentId, 160) } : {}),
    ...(a.workplaceId ? { workplaceId: a.workplaceId } : {}),
    ...(a.targetId ? { targetId: clean(a.targetId, 120) } : {}),
    ...(a.targetName ? { targetName: clean(a.targetName, 80) } : {}),
    ...(a.reason ? { reason: clean(a.reason, 500) } : {}),
    ...(a.evidence ? { evidence: clean(a.evidence, 500) } : {}),
    ...(a.amount !== undefined ? { amount: a.amount } : {}),
    ...(a.offence ? { offence: a.offence } : {}),
    ...(a.details ? { details: clean(a.details, 240) } : {}),
  };
}
function appendAction(s: Stage7State, a: Stage7Action): Stage7State {
  return { ...clone(s), actions: [...s.actions, a].slice(-STAGE7_ACTION_LIMIT) };
}
function replaceIncident(s: Stage7State, incident: Stage7Incident): Stage7State {
  return { ...clone(s), incidents: s.incidents.map(i => i.id === incident.id ? incident : i) };
}
function assigned(s: Stage7State, incidentId: unknown, unit: Stage7UnitId): Stage7Incident | null {
  const i = s.incidents.find(v => v.id === clean(incidentId, 160));
  return i && i.status === "dispatched" && i.assignedWorkplaceId === unit ? i : null;
}
function duty(unit: unknown, rank: unknown, onDuty: boolean, uniform: boolean, minimum: number): unit is Stage7UnitId {
  const r = whole(rank);
  return isUnit(unit) && Number.isInteger(r) && r >= minimum && r <= 6 && onDuty && uniform;
}
function activeAction(s: Stage7State, args: {
  requestId: string; type: ActionKind; actorId: string; actorName: string; workplaceId?: Stage7UnitId;
  incidentId?: string; targetId?: string; targetName?: string; reason?: string; evidence?: string; amount?: number;
  offence?: Offence; details?: string; now: number;
}, message: string, incident?: Stage7Incident): Stage7Result {
  return { ok: true, state: appendAction(s, makeAction(args)), message, ...(incident ? { incident } : {}), action: makeAction(args) };
}

export function createStage7State(): Stage7State {
  return { incidents: [], actions: [], checkpoints: STAGE7_CHECKPOINTS.map(c => ({ ...c, active: false, activatedBy: null, activatedAt: 0, expiresAt: 0 })), detentions: {} };
}
export function normalizeStage7State(v: unknown): Stage7State {
  if (!isRecord(v)) return createStage7State();
  const incidents: Stage7Incident[] = Array.isArray(v.incidents) ? v.incidents.filter(isRecord).slice(-STAGE7_INCIDENT_LIMIT).flatMap(i => {
    const x = number(i.x), z = number(i.z), req = clean(i.requestId, 120);
    if (!isKind(i.kind) || !STATUSES.includes(i.status as IncidentStatus) || !req || !Number.isFinite(x) || !Number.isFinite(z) || Math.abs(x) > 500 || Math.abs(z) > 500) return [];
    return [{
      id: clean(i.id, 160) || "incident:" + req, requestId: req, kind: i.kind, description: clean(i.description, 240),
      reporterId: clean(i.reporterId, 120) || "unknown", reporterName: clean(i.reporterName, 80) || "Citizen",
      x, z, createdAt: time(i.createdAt), status: i.status as IncidentStatus,
      assignedWorkplaceId: isUnit(i.assignedWorkplaceId) ? i.assignedWorkplaceId : null,
      assignedById: clean(i.assignedById, 120) || null,
      dispatchedAt: i.dispatchedAt == null ? null : time(i.dispatchedAt),
      resolvedAt: i.resolvedAt == null ? null : time(i.resolvedAt), resolution: clean(i.resolution, 300) || null,
    }];
  }) : [];
  const actions: Stage7Action[] = Array.isArray(v.actions) ? v.actions.filter(isRecord).slice(-STAGE7_ACTION_LIMIT).flatMap(a => {
    const req = clean(a.requestId, 120);
    if (!req || !ACTIONS.includes(a.type as ActionKind)) return [];
    return [{
      id: clean(a.id, 180) || "stage7-action:" + req, requestId: req, type: a.type as ActionKind,
      actorId: clean(a.actorId, 120) || "unknown", actorName: clean(a.actorName, 80) || "Unknown citizen",
      at: time(a.at), success: a.success !== false,
      ...(clean(a.incidentId, 160) ? { incidentId: clean(a.incidentId, 160) } : {}),
      ...(isUnit(a.workplaceId) ? { workplaceId: a.workplaceId } : {}),
      ...(clean(a.targetId, 120) ? { targetId: clean(a.targetId, 120) } : {}),
      ...(clean(a.targetName, 80) ? { targetName: clean(a.targetName, 80) } : {}),
      ...(clean(a.reason, 500) ? { reason: clean(a.reason, 500) } : {}),
      ...(clean(a.evidence, 500) ? { evidence: clean(a.evidence, 500) } : {}),
      ...(Number.isSafeInteger(Number(a.amount)) && Number(a.amount) >= 0 ? { amount: Number(a.amount) } : {}),
      ...(isOffence(a.offence) ? { offence: a.offence } : {}),
      ...(clean(a.details, 240) ? { details: clean(a.details, 240) } : {}),
    }];
  }) : [];
  const checkpoints: Stage7Checkpoint[] = STAGE7_CHECKPOINTS.map(d => {
    const saved = Array.isArray(v.checkpoints) ? v.checkpoints.filter(isRecord).find(c => c.id === d.id) : undefined;
    return { ...d, active: saved?.active === true, activatedBy: clean(saved?.activatedBy, 120) || null,
      activatedAt: time(saved?.activatedAt), expiresAt: time(saved?.expiresAt),
      ...(clean(saved?.deactivatedBy, 120) ? { deactivatedBy: clean(saved?.deactivatedBy, 120) } : {}),
      ...(saved?.deactivatedAt !== undefined ? { deactivatedAt: time(saved.deactivatedAt) } : {}) };
  });
  const detentions: Record<string, Stage7Detention> = {};
  if (isRecord(v.detentions)) for (const [key, raw] of Object.entries(v.detentions).slice(-1000)) {
    if (!isRecord(raw) || !clean(key, 120) || !clean(raw.incidentId, 160)) continue;
    const startedAt = time(raw.startedAt), expiresAt = time(raw.expiresAt);
    if (!startedAt || expiresAt <= startedAt) continue;
    const decision = raw.appealDecision === "released" || raw.appealDecision === "denied" ? raw.appealDecision : undefined;
    detentions[clean(key, 120)] = {
      accountId: clean(raw.accountId, 120) || clean(key, 120), accountName: clean(raw.accountName, 80) || "Citizen",
      incidentId: clean(raw.incidentId, 160), arrestedById: clean(raw.arrestedById, 120) || "unknown",
      arrestedByName: clean(raw.arrestedByName, 80) || "Police officer", reason: clean(raw.reason, 500), evidence: clean(raw.evidence, 500),
      startedAt, expiresAt, canEscapeAt: time(raw.canEscapeAt, startedAt + STAGE7_ESCAPE_DELAY_MS),
      appealRequested: raw.appealRequested === true, appealReason: clean(raw.appealReason, 500),
      appealRequestedAt: time(raw.appealRequestedAt),
      ...(raw.appealReviewedAt !== undefined ? { appealReviewedAt: time(raw.appealReviewedAt) } : {}),
      ...(decision ? { appealDecision: decision } : {}),
      ...(clean(raw.appealReviewReason, 500) ? { appealReviewReason: clean(raw.appealReviewReason, 500) } : {}),
    };
  }
  return { incidents, actions, checkpoints, detentions };
}

export function reportStage7Incident(s: Stage7State, a: { requestId: string; kind: unknown; description: string; reporterId: string; reporterName: string; x: number; z: number; now: number }): Stage7Result {
  const requestId = clean(a.requestId, 120), description = clean(a.description, 240);
  if (!requestId || requestUsed(s, requestId)) return fail(s, "This report reference is missing or already used.");
  if (!isKind(a.kind)) return fail(s, "Choose crime, traffic accident, fire, or public-safety incident.");
  if (description.length < 8) return fail(s, "Describe what happened in at least 8 characters.");
  if (!Number.isFinite(a.x) || !Number.isFinite(a.z) || Math.abs(a.x) > 500 || Math.abs(a.z) > 500) return fail(s, "The report location could not be validated.");
  const incident: Stage7Incident = { id: "incident:" + requestId, requestId, kind: a.kind, description,
    reporterId: clean(a.reporterId, 120) || "unknown", reporterName: clean(a.reporterName, 80) || "Citizen",
    x: Math.round(a.x * 100) / 100, z: Math.round(a.z * 100) / 100, createdAt: time(a.now), status: "open",
    assignedWorkplaceId: null, assignedById: null, dispatchedAt: null, resolvedAt: null, resolution: null };
  const next = { ...clone(s), incidents: [...s.incidents, incident].slice(-STAGE7_INCIDENT_LIMIT) };
  const logged = appendAction(next, makeAction({ requestId: "report:" + requestId, type: "report", actorId: incident.reporterId, actorName: incident.reporterName, incidentId: incident.id, now: a.now, details: "Reported " + incident.kind + " incident." }));
  return { ok: true, state: logged, message: "Incident reported. The relevant response unit can now dispatch to the recorded location.", incident };
}
export function dispatchStage7Incident(s: Stage7State, a: { requestId: string; incidentId: string; workplaceId: unknown; rank: number; onDuty: boolean; uniform: boolean; actorId: string; actorName: string; now: number }): Stage7Result {
  const req = clean(a.requestId, 120);
  if (!req || requestUsed(s, req)) return fail(s, "This dispatch reference is missing or already used.");
  if (!duty(a.workplaceId, a.rank, a.onDuty, a.uniform, 1)) return fail(s, "Dispatch requires an authorised responder who is on duty and wearing the correct uniform.");
  const unit = a.workplaceId as Stage7UnitId, incident = s.incidents.find(i => i.id === clean(a.incidentId, 160));
  if (!incident || incident.status === "resolved") return fail(s, "This incident is missing or already resolved.");
  if (incident.assignedWorkplaceId) return fail(s, "This incident already has a response unit assigned.");
  if (incident.kind === "fire" && unit !== FIRE_WORKPLACE_ID) return fail(s, "Fire incidents must be assigned to Fire Service.");
  if (incident.kind === "crime" && unit !== POLICE_WORKPLACE_ID) return fail(s, "Crime reports must be assigned to Police.");
  if (incident.kind === "traffic-accident" && unit !== FRSC_WORKPLACE_ID && unit !== POLICE_WORKPLACE_ID) return fail(s, "Traffic accidents must be assigned to FRSC or Police.");
  if (unit === ARMY_WORKPLACE_ID && incident.kind !== "public-safety") return fail(s, "Army response is restricted to major public-safety incidents and checkpoints.");
  const updated = { ...incident, status: "dispatched" as const, assignedWorkplaceId: unit, assignedById: clean(a.actorId, 120), dispatchedAt: time(a.now) };
  const next = replaceIncident(s, updated);
  const action = makeAction({ requestId: req, type: "dispatch", actorId: a.actorId, actorName: a.actorName, workplaceId: unit, incidentId: updated.id, now: a.now, details: STAGE7_UNITS[unit].label + " dispatched." });
  return { ok: true, state: appendAction(next, action), message: STAGE7_UNITS[unit].label + " dispatched. Responders must reach the recorded location before completing the task.", incident: updated, action };
}
export function investigateStage7Incident(s: Stage7State, a: { requestId: string; incidentId: string; actorId: string; actorName: string; workplaceId: unknown; rank: number; onDuty: boolean; uniform: boolean; distanceToIncident: number; reason: string; evidence: string; now: number }): Stage7Result {
  const req = clean(a.requestId, 120), reason = clean(a.reason, 500), evidence = clean(a.evidence, 500);
  if (!req || requestUsed(s, req)) return fail(s, "This investigation reference is missing or already used.");
  if (a.workplaceId !== POLICE_WORKPLACE_ID || !duty(a.workplaceId, a.rank, a.onDuty, a.uniform, 2)) return fail(s, "Police investigation requires rank 2 or higher, duty status and uniform.");
  const incident = assigned(s, a.incidentId, POLICE_WORKPLACE_ID);
  if (!incident || (incident.kind !== "crime" && incident.kind !== "public-safety")) return fail(s, "Police are not assigned to an active crime or major public-safety case.");
  if (!Number.isFinite(a.distanceToIncident) || a.distanceToIncident > 12) return fail(s, "Move within 12 metres of the incident to record the investigation.");
  if (reason.length < 8 || evidence.length < 8) return fail(s, "Investigation reason and evidence must each contain at least 8 characters.");
  const action = makeAction({ requestId: req, type: "investigation", actorId: a.actorId, actorName: a.actorName, workplaceId: POLICE_WORKPLACE_ID, incidentId: incident.id, reason, evidence, now: a.now, details: "Investigation note recorded." });
  return { ok: true, state: appendAction(s, action), message: "Investigation note saved to the incident audit trail.", incident, action };
}
export function arrestStage7Suspect(s: Stage7State, a: { requestId: string; incidentId: string; actorId: string; actorName: string; workplaceId: unknown; rank: number; onDuty: boolean; uniform: boolean; targetId: string; targetName: string; distanceToTarget: number; distanceToIncident: number; targetIsPrivate: boolean; reason: string; evidence: string; now: number }): Stage7Result {
  const req = clean(a.requestId, 120), reason = clean(a.reason, 500), evidence = clean(a.evidence, 500);
  if (!req || requestUsed(s, req)) return fail(s, "This arrest reference is missing or already used.");
  if (a.workplaceId !== POLICE_WORKPLACE_ID || !duty(a.workplaceId, a.rank, a.onDuty, a.uniform, 2)) return fail(s, "Only on-duty Police rank 2+ in uniform can arrest a suspect.");
  const incident = assigned(s, a.incidentId, POLICE_WORKPLACE_ID);
  if (!incident || (incident.kind !== "crime" && incident.kind !== "public-safety")) return fail(s, "An arrest must be attached to an assigned Police crime or public-safety incident.");
  if (!clean(a.targetId, 120) || a.targetId === a.actorId) return fail(s, "Choose another citizen as the arrest target.");
  if (a.targetIsPrivate) return fail(s, "Citizens inside private homes, garages, or interiors cannot be arrested from hidden locations.");
  if (!Number.isFinite(a.distanceToTarget) || a.distanceToTarget > 8 || !Number.isFinite(a.distanceToIncident) || a.distanceToIncident > 14) return fail(s, "The officer, suspect and case location must be within the required proximity.");
  if (reason.length < 8 || evidence.length < 8) return fail(s, "An arrest requires a reason and evidence note of at least 8 characters each.");
  if (s.detentions[a.targetId]) return fail(s, "This citizen is already in custody.");
  if (s.actions.some(v => v.type === "arrest" && v.incidentId === incident.id && v.targetId === a.targetId)) return fail(s, "This suspect already has an arrest record for this incident.");
  const now = time(a.now);
  const detention: Stage7Detention = { accountId: clean(a.targetId, 120), accountName: clean(a.targetName, 80) || "Citizen", incidentId: incident.id, arrestedById: clean(a.actorId, 120), arrestedByName: clean(a.actorName, 80), reason, evidence, startedAt: now, expiresAt: now + STAGE7_DETENTION_MS, canEscapeAt: now + STAGE7_ESCAPE_DELAY_MS, appealRequested: false, appealReason: "", appealRequestedAt: 0 };
  const next = appendAction(s, makeAction({ requestId: req, type: "arrest", actorId: a.actorId, actorName: a.actorName, workplaceId: POLICE_WORKPLACE_ID, incidentId: incident.id, targetId: a.targetId, targetName: a.targetName, reason, evidence, now, details: "Citizen placed in temporary custody for review." }));
  next.detentions[a.targetId] = detention;
  return { ok: true, state: next, message: clean(a.targetName, 80) + " was placed in temporary custody. The citizen can appeal or attempt escape; detention expires automatically.", incident, action: next.actions[next.actions.length - 1] };
}
export function issueStage7Fine(s: Stage7State, a: { requestId: string; incidentId: string; actorId: string; actorName: string; workplaceId: unknown; rank: number; onDuty: boolean; uniform: boolean; targetId: string; targetName: string; targetCash: number; distanceToTarget: number; distanceToIncident: number; targetIsPrivate: boolean; offence: unknown; amount: number; reason: string; evidence: string; now: number }): Stage7Result {
  const req = clean(a.requestId, 120), reason = clean(a.reason, 500), evidence = clean(a.evidence, 500), amount = whole(a.amount);
  if (!req || requestUsed(s, req)) return fail(s, "This fine reference is missing or already used.");
  if (a.workplaceId !== POLICE_WORKPLACE_ID && a.workplaceId !== FRSC_WORKPLACE_ID) return fail(s, "Only Police and FRSC can issue public-road fines.");
  const unit = a.workplaceId as Stage7UnitId, minimum = unit === POLICE_WORKPLACE_ID ? 2 : 1;
  if (!duty(unit, a.rank, a.onDuty, a.uniform, minimum)) return fail(s, "Fine issuance requires the correct rank, duty status and uniform.");
  const incident = assigned(s, a.incidentId, unit);
  if (!incident || (incident.kind !== "traffic-accident" && incident.kind !== "public-safety")) return fail(s, "A fine must be attached to an active traffic or public-safety incident assigned to your unit.");
  if (!clean(a.targetId, 120) || a.targetId === a.actorId) return fail(s, "Choose another citizen as the fine recipient.");
  if (a.targetIsPrivate) return fail(s, "A roadside fine cannot be issued against a citizen inside a private home, garage, or interior.");
  if (!Number.isFinite(a.distanceToTarget) || a.distanceToTarget > 8 || !Number.isFinite(a.distanceToIncident) || a.distanceToIncident > 15) return fail(s, "Officer, citizen and incident must be within the required roadside range.");
  if (!isOffence(a.offence)) return fail(s, "Choose a recognised traffic offence.");
  if (whole(a.targetCash) < amount || amount < 1) return fail(s, "The citizen does not have enough available cash to settle this fine.");
  if (reason.length < 8 || evidence.length < 8) return fail(s, "A fine requires a reason and evidence note of at least 8 characters each.");
  const rule = STAGE7_FINE_RULES[a.offence];
  const caps = unit === FRSC_WORKPLACE_ID ? [5_000, 10_000, 15_000, 25_000, 35_000, 50_000] : [0, 10_000, 20_000, 40_000, 70_000, 100_000];
  const max = Math.min(rule.maximum, caps[whole(a.rank) - 1] ?? 0);
  if (amount > max) return fail(s, "This rank may issue at most ₦" + max.toLocaleString("en-NG") + " for " + rule.label + ".");
  const action = makeAction({ requestId: req, type: "fine", actorId: a.actorId, actorName: a.actorName, workplaceId: unit, incidentId: incident.id, targetId: a.targetId, targetName: a.targetName, reason, evidence, amount, offence: a.offence, now: a.now, details: rule.label + " fine settled." });
  return { ok: true, state: appendAction(s, action), message: rule.label + " fine of ₦" + amount.toLocaleString("en-NG") + " settled and recorded. The amount is credited to the state treasury.", incident, action, fine: { amount, offence: a.offence, targetId: clean(a.targetId, 120), targetName: clean(a.targetName, 80) } };
}
export function resolveStage7Fire(s: Stage7State, a: { requestId: string; incidentId: string; actorId: string; actorName: string; workplaceId: unknown; rank: number; onDuty: boolean; uniform: boolean; distanceToIncident: number; outcome: string; now: number }): Stage7Result {
  const req = clean(a.requestId, 120), outcome = clean(a.outcome, 300);
  if (!req || requestUsed(s, req)) return fail(s, "This fire-response reference is missing or already used.");
  if (a.workplaceId !== FIRE_WORKPLACE_ID || !duty(a.workplaceId, a.rank, a.onDuty, a.uniform, 1)) return fail(s, "Only on-duty Fire Service personnel in uniform can report extinguishing outcomes.");
  const incident = assigned(s, a.incidentId, FIRE_WORKPLACE_ID);
  if (!incident || incident.kind !== "fire") return fail(s, "Fire Service is not assigned to this active fire.");
  if (!Number.isFinite(a.distanceToIncident) || a.distanceToIncident > 12) return fail(s, "Reach within 12 metres of the recorded fire location.");
  if (outcome.length < 8) return fail(s, "Record the extinguishing and safety outcome in at least 8 characters.");
  const updated = { ...incident, status: "resolved" as const, resolvedAt: time(a.now), resolution: outcome };
  const next = appendAction(replaceIncident(s, updated), makeAction({ requestId: req, type: "fire-extinguished", actorId: a.actorId, actorName: a.actorName, workplaceId: FIRE_WORKPLACE_ID, incidentId: updated.id, reason: outcome, now: a.now, details: "Fire extinguishing outcome recorded." }));
  return { ok: true, state: next, message: "Fire response outcome recorded and incident closed.", incident: updated, action: next.actions[next.actions.length - 1] };
}
export function resolveStage7TrafficIncident(s: Stage7State, a: { requestId: string; incidentId: string; actorId: string; actorName: string; workplaceId: unknown; rank: number; onDuty: boolean; uniform: boolean; distanceToIncident: number; outcome: string; now: number }): Stage7Result {
  const req = clean(a.requestId, 120), outcome = clean(a.outcome, 300);
  if (!req || requestUsed(s, req)) return fail(s, "This road-clearance reference is missing or already used.");
  if (a.workplaceId !== FRSC_WORKPLACE_ID && a.workplaceId !== POLICE_WORKPLACE_ID) return fail(s, "Only FRSC or Police can resolve road incidents.");
  const unit = a.workplaceId as Stage7UnitId, minimum = unit === FRSC_WORKPLACE_ID ? 2 : 4;
  if (!duty(unit, a.rank, a.onDuty, a.uniform, minimum)) return fail(s, "Road clearance requires FRSC rank 2+ or Police rank 4+ in uniform and on duty.");
  const incident = assigned(s, a.incidentId, unit);
  if (!incident || incident.kind !== "traffic-accident") return fail(s, "Your unit is not assigned to this active traffic accident.");
  if (!Number.isFinite(a.distanceToIncident) || a.distanceToIncident > 12) return fail(s, "Reach within 12 metres of the traffic incident to close it.");
  if (outcome.length < 8) return fail(s, "Record the scene condition, action taken and road-clearance outcome.");
  const updated = { ...incident, status: "resolved" as const, resolvedAt: time(a.now), resolution: outcome };
  const next = appendAction(replaceIncident(s, updated), makeAction({ requestId: req, type: "traffic-cleared", actorId: a.actorId, actorName: a.actorName, workplaceId: unit, incidentId: updated.id, reason: outcome, now: a.now, details: "Traffic response and road clearance recorded." }));
  return { ok: true, state: next, message: "Road-clearance outcome saved and incident closed.", incident: updated, action: next.actions[next.actions.length - 1] };
}
export function closeStage7Incident(s: Stage7State, a: { requestId: string; incidentId: string; actorId: string; actorName: string; rank: number; onDuty: boolean; uniform: boolean; workplaceId: unknown; distanceToIncident: number; reason: string; evidence: string; now: number }): Stage7Result {
  const req = clean(a.requestId, 120), reason = clean(a.reason, 500), evidence = clean(a.evidence, 500);
  if (!req || requestUsed(s, req)) return fail(s, "This case-closure reference is missing or already used.");
  if (a.workplaceId !== POLICE_WORKPLACE_ID || !duty(a.workplaceId, a.rank, a.onDuty, a.uniform, 4)) return fail(s, "Only on-duty Police rank 4+ can close a crime/public-safety case.");
  const incident = s.incidents.find(i => i.id === clean(a.incidentId, 160));
  if (!incident || incident.status !== "dispatched" || incident.assignedWorkplaceId !== POLICE_WORKPLACE_ID || (incident.kind !== "crime" && incident.kind !== "public-safety")) return fail(s, "Your Police unit is not assigned to this active case.");
  if (!Number.isFinite(a.distanceToIncident) || a.distanceToIncident > 14) return fail(s, "Return within 14 metres of the assigned case before closing.");
  if (reason.length < 8 || evidence.length < 8) return fail(s, "Case closure needs a reason and final evidence/outcome note of at least 8 characters each.");
  const updated = { ...incident, status: "resolved" as const, resolvedAt: time(a.now), resolution: reason + " — " + evidence };
  const next = appendAction(replaceIncident(s, updated), makeAction({ requestId: req, type: "incident-closed", actorId: a.actorId, actorName: a.actorName, workplaceId: POLICE_WORKPLACE_ID, incidentId: updated.id, reason, evidence, now: a.now, details: "Police case closed with recorded rationale." }));
  return { ok: true, state: next, message: "Case closed. Rationale and supporting notes are saved in the audit trail.", incident: updated, action: next.actions[next.actions.length - 1] };
}
export function activateStage7Checkpoint(s: Stage7State, a: { requestId: string; checkpointId: string; actorId: string; actorName: string; rank: number; onDuty: boolean; uniform: boolean; workplaceId: unknown; distanceToCheckpoint: number; now: number }): Stage7Result {
  const req = clean(a.requestId, 120);
  if (!req || requestUsed(s, req)) return fail(s, "This checkpoint reference is missing or already used.");
  if (a.workplaceId !== ARMY_WORKPLACE_ID || !duty(a.workplaceId, a.rank, a.onDuty, a.uniform, 2)) return fail(s, "Only on-duty Army rank 2+ in uniform can activate checkpoints.");
  const def = STAGE7_CHECKPOINTS.find(c => c.id === clean(a.checkpointId, 80));
  if (!def) return fail(s, "Choose an authorised checkpoint.");
  if (!Number.isFinite(a.distanceToCheckpoint) || a.distanceToCheckpoint > 18) return fail(s, "Move within 18 metres of the designated checkpoint.");
  if (s.checkpoints.some(c => c.id === def.id && c.active && c.expiresAt > time(a.now))) return fail(s, "This checkpoint is already active.");
  const now = time(a.now), checkpoint = { ...def, active: true, activatedBy: clean(a.actorId, 120), activatedAt: now, expiresAt: now + STAGE7_CHECKPOINT_DURATION_MS };
  const next = { ...clone(s), checkpoints: s.checkpoints.map(c => c.id === def.id ? checkpoint : c) };
  const action = makeAction({ requestId: req, type: "checkpoint-activated", actorId: a.actorId, actorName: a.actorName, workplaceId: ARMY_WORKPLACE_ID, now, details: def.name + " activated for 20 minutes." });
  return { ok: true, state: appendAction(next, action), message: def.name + " is active for 20 minutes. Unauthorised citizens cannot cross its restricted perimeter.", action };
}
export function deactivateStage7Checkpoint(s: Stage7State, a: { requestId: string; checkpointId: string; actorId: string; actorName: string; rank: number; onDuty: boolean; uniform: boolean; workplaceId: unknown; isAdmin: boolean; reason: string; now: number }): Stage7Result {
  const req = clean(a.requestId, 120), reason = clean(a.reason, 240);
  if (!req || requestUsed(s, req)) return fail(s, "This checkpoint closure reference is missing or already used.");
  const canClose = a.workplaceId === ARMY_WORKPLACE_ID && duty(a.workplaceId, a.rank, a.onDuty, a.uniform, 4);
  if (!canClose && !a.isAdmin) return fail(s, "Only on-duty Army rank 4+ or a protected administrator can close a checkpoint.");
  if (!a.isAdmin && reason.length < 8) return fail(s, "Enter a closure reason of at least 8 characters.");
  const cp = s.checkpoints.find(c => c.id === clean(a.checkpointId, 80) && c.active);
  if (!cp) return fail(s, "That checkpoint is not active.");
  const now = time(a.now), next = { ...clone(s), checkpoints: s.checkpoints.map(c => c.id === cp.id ? { ...c, active: false, deactivatedBy: clean(a.actorId, 120), deactivatedAt: now, expiresAt: now } : c) };
  const action = makeAction({ requestId: req, type: "checkpoint-deactivated", actorId: a.actorId, actorName: a.actorName, workplaceId: ARMY_WORKPLACE_ID, reason, now, details: cp.name + " deactivated." });
  return { ok: true, state: appendAction(next, action), message: cp.name + " deactivated; closure logged.", action };
}
export function requestStage7Appeal(s: Stage7State, a: { requestId: string; actorId: string; actorName: string; reason: string; now: number }): Stage7Result {
  const req = clean(a.requestId, 120), id = clean(a.actorId, 120), reason = clean(a.reason, 500), detention = s.detentions[id];
  if (!req || requestUsed(s, req)) return fail(s, "This appeal reference is missing or already used.");
  if (!detention || detention.expiresAt <= time(a.now)) return fail(s, "You are not currently in custody.");
  if (detention.appealRequested) return fail(s, "Your appeal is already waiting for review.");
  if (reason.length < 10) return fail(s, "Explain your appeal in at least 10 characters.");
  const next = clone(s); next.detentions[id] = { ...detention, appealRequested: true, appealReason: reason, appealRequestedAt: time(a.now), appealDecision: undefined, appealReviewReason: undefined, appealReviewedAt: undefined };
  const action = makeAction({ requestId: req, type: "appeal-requested", actorId: id, actorName: a.actorName, incidentId: detention.incidentId, reason, now: a.now, details: "Detention appeal submitted for independent review." });
  return { ok: true, state: appendAction(next, action), message: "Appeal submitted for independent review.", action };
}
export function reviewStage7Appeal(s: Stage7State, a: { requestId: string; actorId: string; actorName: string; workplaceId: unknown; rank: number; onDuty: boolean; uniform: boolean; isAdmin: boolean; targetId: string; decision: "release" | "deny"; reason: string; now: number }): Stage7Result {
  const req = clean(a.requestId, 120), reason = clean(a.reason, 500), target = clean(a.targetId, 120);
  if (!req || requestUsed(s, req)) return fail(s, "This appeal-review reference is missing or already used.");
  const senior = a.workplaceId === POLICE_WORKPLACE_ID && duty(a.workplaceId, a.rank, a.onDuty, a.uniform, 5);
  if (!senior && !a.isAdmin) return fail(s, "Only on-duty senior Police rank 5+ or a protected administrator can review appeals.");
  const detention = s.detentions[target];
  if (!detention || !detention.appealRequested) return fail(s, "There is no pending appeal for this citizen.");
  if (!a.isAdmin && detention.arrestedById === a.actorId) return fail(s, "The arresting officer cannot review their own arrest appeal.");
  if (a.decision !== "release" && a.decision !== "deny") return fail(s, "Choose release or deny.");
  if (reason.length < 8) return fail(s, "Record an independent review rationale of at least 8 characters.");
  const next = clone(s);
  if (a.decision === "release") delete next.detentions[target];
  else next.detentions[target] = { ...detention, appealRequested: false, appealReviewedAt: time(a.now), appealDecision: "denied", appealReviewReason: reason };
  const action = makeAction({ requestId: req, type: "appeal-reviewed", actorId: a.actorId, actorName: a.actorName, workplaceId: a.isAdmin ? undefined : POLICE_WORKPLACE_ID, incidentId: detention.incidentId, targetId: target, targetName: detention.accountName, reason, now: a.now, details: a.decision === "release" ? "Appeal accepted; citizen released." : "Appeal denied with rationale." });
  return { ok: true, state: appendAction(next, action), message: a.decision === "release" ? "Appeal accepted. Citizen released." : "Appeal denied with a recorded rationale.", action };
}
export function attemptStage7Escape(s: Stage7State, a: { requestId: string; actorId: string; actorName: string; nearbyOfficerCount: number; now: number }): Stage7Result {
  const req = clean(a.requestId, 120), id = clean(a.actorId, 120), now = time(a.now), detention = s.detentions[id];
  if (!req || requestUsed(s, req)) return fail(s, "This escape reference is missing or already used.");
  if (!detention || detention.expiresAt <= now) return fail(s, "You are not currently in custody.");
  if (now < detention.canEscapeAt) return fail(s, "The escape window has not opened yet.");
  if (a.nearbyOfficerCount > 0) return fail(s, "Escape blocked while an on-duty uniformed Police officer is nearby.");
  const next = clone(s); delete next.detentions[id];
  const action = makeAction({ requestId: req, type: "escape", actorId: id, actorName: a.actorName, incidentId: detention.incidentId, now, details: "Citizen escaped from temporary custody while no on-duty officer was nearby." });
  return { ok: true, state: appendAction(next, action), message: "Escape succeeded because no on-duty Police officer was nearby. Escape is logged.", action };
}
export function maintainStage7State(s: Stage7State, nowValue: number): { state: Stage7State; releasedIds: string[]; expiredCheckpointIds: string[] } {
  const now = time(nowValue), next = clone(s), releasedIds: string[] = [], expiredCheckpointIds: string[] = [];
  for (const [id, d] of Object.entries(next.detentions)) {
    if (d.expiresAt > now) continue;
    delete next.detentions[id]; releasedIds.push(id);
    next.actions.push(makeAction({ requestId: "auto-release:" + id + ":" + d.expiresAt, type: "detention-released", actorId: "stage7-system", actorName: "Public safety system", incidentId: d.incidentId, targetId: id, targetName: d.accountName, now, details: "Temporary custody expired; citizen released." }));
  }
  for (const c of next.checkpoints) {
    if (!c.active || c.expiresAt > now) continue;
    c.active = false; c.deactivatedAt = now; c.deactivatedBy = "stage7-system"; expiredCheckpointIds.push(c.id);
    next.actions.push(makeAction({ requestId: "auto-checkpoint-close:" + c.id + ":" + c.expiresAt, type: "checkpoint-deactivated", actorId: "stage7-system", actorName: "Public safety system", now, details: c.name + " closed automatically at expiry." }));
  }
  next.actions = next.actions.slice(-STAGE7_ACTION_LIMIT);
  return { state: next, releasedIds, expiredCheckpointIds };
}
export function findBlockingStage7Checkpoint(s: Stage7State, x: number, z: number, nowValue: number): Stage7Checkpoint | null {
  const now = time(nowValue); return s.checkpoints.find(c => c.active && c.expiresAt > now && distance(x, z, c.x, c.z) < c.radius) ?? null;
}
export function isAuthorisedStage7CheckpointPass(unit: unknown, onDuty: boolean, uniform: boolean): boolean { return isUnit(unit) && onDuty && uniform; }
export function isStage7Unit(v: unknown): v is Stage7UnitId { return isUnit(v); }
export function stage7Distance(x1: number, z1: number, x2: number, z2: number): number { return distance(x1, z1, x2, z2); }
