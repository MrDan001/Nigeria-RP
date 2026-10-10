// Stage 1 foundation: game data (ranks, workplaces, houses, cars), the Nigeria-time day clock,
// per-player "life" state, and the pure rules the later stages build on.
// Nothing in here touches the network or the database, so it can be tested on its own
// (see test-stage1.ts) and every rule is decided on the server.

// ---------------------------------------------------------------- ranks

export const RANK_COUNT = 6;
export const BOSS_RANK = 6; // rank 6 is the boss
export const MAX_STAFF_RANK = 5; // bosses can promote staff up to here, never higher
export const START_RANK = 1;

// Pay = task pay x multiplier. Index 0 is rank 1. Easy to change.
export const RANK_MULTIPLIERS: readonly number[] = [1.0, 1.25, 1.6, 2.0, 2.6, 3.5];

export function rankMultiplier(rank: number): number {
  const r = Math.floor(rank);
  if (!Number.isFinite(r) || r < 1 || r > RANK_COUNT) return RANK_MULTIPLIERS[0];
  return RANK_MULTIPLIERS[r - 1];
}

export function payForTask(basePay: number, rank: number): number {
  return Math.round(Math.max(0, basePay) * rankMultiplier(rank));
}

// ---------------------------------------------------------------- workplaces

export type WorkplaceKind =
  | "market" | "bank" | "hospital" | "park" | "news" | "government"
  | "police" | "frsc" | "fire" | "military" | "transport" | "school";

export type Workplace = {
  id: string;
  name: string;
  kind: WorkplaceKind;
  zone: string;
  x: number; // authorised on-site work interaction point in the shared world
  z: number;
  factionId: string;
  rankTitles: readonly (readonly string[])[];
};

const ladder = (...titles: string[]): readonly (readonly string[])[] => titles.map((t) => [t]);

// One catalogue powers both ordinary careers and roleplay factions. Hospital locations
// are shared with the client scene so duty/task checks happen at their real entrances.
export const WORKPLACES: readonly Workplace[] = [
  {
    id: "market-mile1", name: "Mile 1 Market", kind: "market", zone: "Mile 1 Market",
    x: -48, z: 80, factionId: "market",
    rankTitles: ladder("Hawker", "Stall Assistant", "Sales Rep", "Senior Sales", "Market Supervisor", "Market Chairman"),
  },
  {
    id: "bank-main", name: "Port Harcourt Bank", kind: "bank", zone: "Port Harcourt Centre",
    x: -10, z: -20, factionId: "bank",
    rankTitles: ladder("Trainee", "Teller", "Senior Teller", "Loan Officer", "Operations Manager", "Branch Manager"),
  },
  {
    // Keep the existing ID so saved employment records remain valid.
    id: "hospital-main", name: "Mile One General Hospital", kind: "hospital", zone: "Mile 1 Market",
    x: -79, z: 106, factionId: "hospital-mile1",
    rankTitles: ladder("Orderly", "Nurse Aide", "Nurse", "Senior Nurse", "Doctor", "Chief Medical Director"),
  },
  {
    id: "hospital-princess", name: "Princess Hospital", kind: "hospital", zone: "Trans Amadi",
    x: 155, z: -126, factionId: "hospital-princess",
    rankTitles: ladder("Hospital Assistant", "Nursing Assistant", "Registered Nurse", "Senior Nurse", "Consultant", "Medical Director"),
  },
  {
    id: "school-primary", name: "Rivers State Primary School", kind: "school", zone: "Waterlines",
    x: 180, z: 144, factionId: "school-primary",
    rankTitles: ladder("Classroom Assistant", "Teaching Assistant", "Teacher", "Senior Teacher", "Vice Principal", "Principal"),
  },
  {
    id: "school-secondary", name: "Rivers State Secondary School", kind: "school", zone: "Waterlines",
    x: 215, z: 144, factionId: "school-secondary",
    rankTitles: ladder("Teacher Aide", "Assistant Teacher", "Subject Teacher", "Senior Teacher", "Vice Principal", "Principal"),
  },
  {
    id: "park-main", name: "City Park", kind: "park", zone: "Port Harcourt Centre",
    x: -30, z: 20, factionId: "park",
    rankTitles: ladder("Cleaner", "Gate Attendant", "Ticket Seller", "Ranger", "Operations Officer", "Park Director"),
  },
  {
    id: "news-main", name: "Rivers News Network", kind: "news", zone: "Port Harcourt Centre",
    x: 20, z: -52, factionId: "news",
    rankTitles: ladder("Intern", "Production Assistant", "Reporter", "Anchor", "Editor", "Editor-in-Chief"),
  },
  {
    id: "gov-rivers", name: "Rivers State Government", kind: "government", zone: "Port Harcourt Centre",
    x: 36, z: -8, factionId: "government",
    rankTitles: [
      ["Councillor", "Assistant", "Clerk"],
      ["Vice Chairman", "Special Adviser", "PRO"],
      ["Commissioner", "Senator", "LGA Chairman"],
      ["Secretary to the State Government", "Chief of Staff", "Speaker"],
      ["Deputy Governor"],
      ["Governor"],
    ],
  },
  {
    id: "police-rivers", name: "Rivers State Police Service", kind: "police", zone: "Port Harcourt Centre",
    x: -28, z: -132, factionId: "police",
    rankTitles: ladder("Recruit Constable", "Constable", "Corporal", "Sergeant", "Inspector", "Commissioner of Police"),
  },
  {
    id: "frsc-rivers", name: "FRSC — Rivers Sector Command", kind: "frsc", zone: "Port Harcourt Centre",
    x: 28, z: 48, factionId: "frsc",
    rankTitles: ladder("Road Safety Marshal", "Senior Marshal", "Assistant Route Commander", "Route Commander", "Sector Operations Officer", "Sector Commander"),
  },
  {
    id: "fire-rivers", name: "Rivers State Fire & Rescue", kind: "fire", zone: "Port Harcourt Centre",
    x: -45, z: -132, factionId: "fire",
    rankTitles: ladder("Firefighter Trainee", "Firefighter", "Crew Leader", "Station Officer", "Divisional Officer", "Chief Fire Officer"),
  },
  {
    id: "army-rivers", name: "Nigerian Army — Port Harcourt Garrison", kind: "military", zone: "Trans Amadi",
    x: 185, z: -165, factionId: "army",
    rankTitles: ladder("Recruit", "Private", "Lance Corporal", "Corporal", "Sergeant", "Commanding Officer"),
  },
  {
    id: "transport-union", name: "Port Harcourt Transport Union", kind: "transport", zone: "Port Harcourt Centre",
    x: 5, z: 62, factionId: "transport",
    rankTitles: ladder("Transport Assistant", "Route Assistant", "Driver", "Senior Driver", "Depot Supervisor", "Union Chairman"),
  },
];

export type Faction = {
  id: string;
  name: string;
  workplaceId: string;
  category: "commerce" | "medical" | "public-service" | "law-enforcement" | "emergency" | "military" | "media" | "transport" | "education";
  description: string;
  requiresApproval: boolean;
};

export const FACTIONS: readonly Faction[] = [
  { id: "market", name: "Mile 1 Market Association", workplaceId: "market-mile1", category: "commerce", description: "Market operations, traders and customer service.", requiresApproval: false },
  { id: "bank", name: "Port Harcourt Bank", workplaceId: "bank-main", category: "commerce", description: "Banking services and branch operations.", requiresApproval: false },
  { id: "hospital-mile1", name: "Mile One General Hospital", workplaceId: "hospital-main", category: "medical", description: "Public hospital care, nursing and emergency support in Mile 1.", requiresApproval: true },
  { id: "hospital-princess", name: "Princess Hospital", workplaceId: "hospital-princess", category: "medical", description: "Hospital care and clinical services along Trans Amadi Road.", requiresApproval: true },
  { id: "school-primary", name: "Rivers State Primary School", workplaceId: "school-primary", category: "education", description: "Primary education, classroom teaching and school administration.", requiresApproval: true },
  { id: "school-secondary", name: "Rivers State Secondary School", workplaceId: "school-secondary", category: "education", description: "Secondary education, subject teaching and school administration.", requiresApproval: true },
  { id: "park", name: "City Park Authority", workplaceId: "park-main", category: "public-service", description: "Public spaces, visitor assistance and park operations.", requiresApproval: false },
  { id: "news", name: "Rivers News Network", workplaceId: "news-main", category: "media", description: "Reporting, broadcasting and newsroom operations.", requiresApproval: true },
  { id: "government", name: "Rivers State Government", workplaceId: "gov-rivers", category: "public-service", description: "Civic administration and public service.", requiresApproval: true },
  { id: "police", name: "Rivers State Police Service", workplaceId: "police-rivers", category: "law-enforcement", description: "Law enforcement, incident reporting and community safety.", requiresApproval: true },
  { id: "frsc", name: "Federal Road Safety Corps — Rivers", workplaceId: "frsc-rivers", category: "law-enforcement", description: "Road safety, traffic assistance and crash response.", requiresApproval: true },
  { id: "fire", name: "Rivers State Fire & Rescue Service", workplaceId: "fire-rivers", category: "emergency", description: "Fire prevention, rescue and emergency response.", requiresApproval: true },
  { id: "army", name: "Nigerian Army — Port Harcourt Garrison", workplaceId: "army-rivers", category: "military", description: "Military service, training and base duties.", requiresApproval: true },
  { id: "transport", name: "Port Harcourt Transport Union", workplaceId: "transport-union", category: "transport", description: "Public transport routes, passengers and depot operations.", requiresApproval: false },
];

export type WorkplaceTask = { id: string; title: string; basePay: number };

export const WORK_TASK_DURATION_MS = 10_000;
export const WORK_TASK_COOLDOWN_MS = 30_000;
export const WORKPLACE_RADIUS = 24;

const TASKS_BY_KIND: Record<WorkplaceKind, readonly WorkplaceTask[]> = {
  market: [{ id: "stock-check", title: "Check market stock", basePay: 1000 }, { id: "customer-assist", title: "Assist customers", basePay: 1400 }],
  bank: [{ id: "account-support", title: "Assist a bank customer", basePay: 1500 }, { id: "cash-reconciliation", title: "Reconcile branch records", basePay: 1900 }],
  hospital: [{ id: "ward-rounds", title: "Complete ward support", basePay: 1800 }, { id: "patient-triage", title: "Assist patient intake", basePay: 2200 }],
  school: [{ id: "attendance-records", title: "Complete class attendance", basePay: 1300 }, { id: "class-preparation", title: "Prepare classroom materials", basePay: 1800 }],
  park: [{ id: "groundskeeping", title: "Maintain park grounds", basePay: 1000 }, { id: "visitor-assist", title: "Assist park visitors", basePay: 1300 }],
  news: [{ id: "field-report", title: "Prepare a field report", basePay: 1500 }, { id: "news-edit", title: "Edit a news bulletin", basePay: 1900 }],
  government: [{ id: "public-desk", title: "Handle a public-service request", basePay: 1600 }, { id: "document-review", title: "Review official documents", basePay: 2100 }],
  police: [{ id: "patrol-briefing", title: "Complete a patrol briefing", basePay: 1800 }, { id: "incident-report", title: "File an incident report", basePay: 2200 }],
  frsc: [{ id: "road-safety", title: "Conduct road-safety support", basePay: 1600 }, { id: "traffic-report", title: "Prepare a traffic report", basePay: 2000 }],
  fire: [{ id: "equipment-check", title: "Check rescue equipment", basePay: 1700 }, { id: "safety-inspection", title: "Complete a safety inspection", basePay: 2100 }],
  military: [{ id: "base-duty", title: "Complete base duty", basePay: 1800 }, { id: "training-log", title: "Submit a training log", basePay: 2300 }],
  transport: [{ id: "route-check", title: "Check the route board", basePay: 1200 }, { id: "passenger-assist", title: "Assist passengers", basePay: 1500 }],
};

export function workplaceTasks(workplaceId: string): readonly WorkplaceTask[] {
  const workplace = findWorkplace(workplaceId);
  return workplace ? TASKS_BY_KIND[workplace.kind] : [];
}

export function workplaceRankTitle(workplaceId: string, rank: number): string {
  const workplace = findWorkplace(workplaceId);
  const r = Math.floor(Number(rank));
  if (!workplace || !Number.isFinite(r) || r < 1 || r > RANK_COUNT) return "";
  return workplace.rankTitles[r - 1]?.[0] ?? "";
}

export function findWorkplace(id: string): Workplace | undefined {
  return WORKPLACES.find((w) => w.id === id);
}

// Each workplace has its own private reception interior. Positions stay within world
// bounds and are spaced so the separate interior collision shells cannot overlap.
export function workplaceInteriorPosition(id: string): { x: number; z: number } {
  const found = WORKPLACES.findIndex((workplace) => workplace.id === id);
  const index = Math.max(0, found);
  return { x: -450 + (index % 4) * 24, z: -260 + Math.floor(index / 4) * 25 };
}

export function findFaction(id: string): Faction | undefined {
  return FACTIONS.find((f) => f.id === id);
}

export function checkWorkplaceApplication(current: Employment | null, workplaceId: string): RankCheck {
  if (!findWorkplace(workplaceId)) return { ok: false, reason: "Unknown workplace." };
  if (current?.workplaceId === workplaceId) return { ok: false, reason: "You already work here." };
  if (current) return { ok: false, reason: "You already have a job. Leave it before applying elsewhere." };
  return { ok: true };
}

export function checkWorkplaceDuty(employment: Employment | null, workplaceId: string, onDuty: boolean, distance: number): RankCheck {
  if (!employment || employment.workplaceId !== workplaceId) return { ok: false, reason: "You do not work here." };
  if (!Number.isFinite(distance) || distance > WORKPLACE_RADIUS) return { ok: false, reason: "You must be at your workplace to clock in or out." };
  if (typeof onDuty !== "boolean") return { ok: false, reason: "Choose clock in or clock out." };
  if ((employment.onDuty === true) === onDuty) return { ok: false, reason: onDuty ? "You are already on duty." : "You are already off duty." };
  return { ok: true };
}

export function checkWorkTaskEligibility(args: {
  employment: Employment | null;
  workplaceId: string;
  taskId: string;
  distance: number;
  now: number;
  startedAt: number;
  onDuty: boolean;
  activeTaskId?: string | null;
}): RankCheck {
  const { employment, workplaceId, taskId, distance, now, startedAt, onDuty, activeTaskId } = args;
  if (!employment || employment.workplaceId !== workplaceId) return { ok: false, reason: "You do not work here." };
  if (!onDuty || !employment.onDuty) return { ok: false, reason: "Clock in before doing workplace tasks." };
  if (employment.uniformWorkplaceId !== workplaceId) return { ok: false, reason: "Put on your authorised work uniform in the staff changing room before serving people or completing paid duties." };
  if (!Number.isFinite(distance) || distance > WORKPLACE_RADIUS) return { ok: false, reason: "Return to your workplace to do this task." };
  if (!workplaceTasks(workplaceId).some((task) => task.id === taskId)) return { ok: false, reason: "Unknown task for this workplace." };
  if (!Number.isFinite(now) || now - (Number(employment.lastTaskAt) || 0) < WORK_TASK_COOLDOWN_MS) return { ok: false, reason: "Your next paid task is not ready yet." };
  if (activeTaskId && activeTaskId !== taskId) return { ok: false, reason: "Finish your current task first." };
  if (startedAt > 0 && now - startedAt < WORK_TASK_DURATION_MS) return { ok: false, reason: "Your task is not complete yet." };
  if (startedAt <= 0 && activeTaskId === taskId) return { ok: false, reason: "Start this task first." };
  return { ok: true };
}

// ---------------------------------------------------------------- houses

export type HouseClassId = "hut" | "faceme" | "flat" | "estate" | "mansion" | "palace";

export type HouseClass = {
  id: HouseClassId;
  name: string;
  rentPerDay: number; // naira
};

export const MAX_PREPAID_DAYS = 7;

export const HOUSE_CLASSES: readonly HouseClass[] = [
  { id: "hut", name: "Village Hut", rentPerDay: 1000 },
  { id: "faceme", name: "Compound Rooms", rentPerDay: 2500 },
  { id: "flat", name: "Urban Flat", rentPerDay: 4000 },
  { id: "estate", name: "Estate Duplex", rentPerDay: 7500 },
  { id: "mansion", name: "Grand Villa", rentPerDay: 10000 },
  { id: "palace", name: "Royal Palace", rentPerDay: 20000 },
];

export type HouseDef = {
  id: string;
  cls: HouseClassId;
  zone: string;
  // Provisional spot inside the district. `placed` stays false until Stage 2 checks it
  // against the real map so no house sits on a road or inside a building.
  x: number;
  z: number;
  placed: boolean;
};

// District bounds copied from the client map (x1, x2, z1, z2).
const ZONE_BOUNDS: Record<string, [number, number, number, number]> = {
  "Mile 1 Market": [-85, -12, 78, 112],
  "D-Line": [24, 85, -100, -14],
  "Old GRA": [-240, -100, -240, -120],
  "Trans Amadi": [100, 240, -240, -120],
  Rumuola: [100, 240, -100, 60],
  Waterlines: [-240, 240, 115, 200],
};

// Where each class goes (from the plan) and how many of each.
const HOUSE_PLAN: ReadonlyArray<{ cls: HouseClassId; zone: string; count: number; tag: string }> = [
  { cls: "hut", zone: "Mile 1 Market", count: 4, tag: "m1" },
  { cls: "hut", zone: "Rumuola", count: 4, tag: "rum" },
  { cls: "faceme", zone: "Mile 1 Market", count: 3, tag: "m1" },
  { cls: "faceme", zone: "Rumuola", count: 3, tag: "rum" },
  { cls: "flat", zone: "D-Line", count: 3, tag: "dl" },
  { cls: "flat", zone: "Waterlines", count: 4, tag: "wl" },
  { cls: "estate", zone: "Trans Amadi", count: 4, tag: "ta" },
  { cls: "mansion", zone: "Old GRA", count: 3, tag: "gra" },
  { cls: "palace", zone: "Old GRA", count: 2, tag: "gra" },
];

const HOUSE_LAYOUT_OVERRIDES: Readonly<Record<string, { x: number; z: number }>> = {
  // Trans Amadi's road runs east-west at z=-190. Keep the estate row well behind it.
  "estate-ta-01": { x: 128, z: -228 },
  "estate-ta-02": { x: 156, z: -228 },
  "estate-ta-03": { x: 184, z: -228 },
  "estate-ta-04": { x: 212, z: -228 },
  // Old GRA homes share one deliberate low-density lane rather than sitting on the road.
  "palace-gra-01": { x: -228, z: -228 },
  "mansion-gra-01": { x: -200, z: -228 },
  "palace-gra-02": { x: -172, z: -228 },
  "mansion-gra-02": { x: -144, z: -228 },
  "mansion-gra-03": { x: -117, z: -228 },
  // Separate the Mile 1 hut and face-me rows so their walls/entrances do not overlap.
  "hut-m1-01": { x: -70, z: 87 },
  "hut-m1-02": { x: -56, z: 87 },
  "hut-m1-03": { x: -41, z: 87 },
  "hut-m1-04": { x: -27, z: 87 },
  "faceme-m1-01": { x: -67, z: 101 },
  "faceme-m1-02": { x: -48, z: 101 },
  "faceme-m1-03": { x: -30, z: 101 },
  // Rumuola homes use two clear rows facing connected residential streets.
  "hut-rum-01": { x: 128, z: -60 },
  "hut-rum-02": { x: 156, z: -60 },
  "hut-rum-03": { x: 184, z: -60 },
  "hut-rum-04": { x: 212, z: -60 },
  "faceme-rum-01": { x: 135, z: -34 },
  "faceme-rum-02": { x: 170, z: -34 },
  "faceme-rum-03": { x: 205, z: -34 },
};

function buildHouses(): HouseDef[] {
  const out: HouseDef[] = [];
  const seen: Record<string, number> = {};
  for (const plan of HOUSE_PLAN) {
    const [x1, x2, z1, z2] = ZONE_BOUNDS[plan.zone];
    for (let i = 0; i < plan.count; i++) {
      const key = plan.cls + "-" + plan.tag;
      const n = (seen[key] = (seen[key] ?? 0) + 1);
      // Spread along a diagonal inside the district, deterministic so ids and spots never change.
      const t = (i + 1) / (plan.count + 1);
      const id = key + "-" + String(n).padStart(2, "0");
      const override = HOUSE_LAYOUT_OVERRIDES[id];
      out.push({
        id,
        cls: plan.cls,
        zone: plan.zone,
        x: override?.x ?? Math.round(x1 + (x2 - x1) * t),
        z: override?.z ?? Math.round(z1 + (z2 - z1) * (0.3 + 0.4 * t)),
        placed: false,
      });
    }
  }
  return out;
}

export const HOUSES: readonly HouseDef[] = buildHouses();

export function findHouse(id: string): HouseDef | undefined {
  return HOUSES.find((h) => h.id === id);
}

export function houseRent(houseId: string): number {
  const house = findHouse(houseId);
  const cls = house && HOUSE_CLASSES.find((c) => c.id === house.cls);
  return cls ? cls.rentPerDay : 0;
}

// ---------------------------------------------------------------- cars

// The parked cars in the client map, by their fixed ids.
export const CAR_IDS: readonly string[] = ["c0", "c1", "c2", "c3", "c4"];

/* Private car-park vehicle route contract. The browser reports sampled vehicle
   positions; the server bounds their travel, tracks the last movement-derived
   speed, and validates the gate/horn request. Full server-owned vehicle physics
   remains a separate milestone. */
export const CARPARK_POSITION = { x: 455, z: 455 } as const;
export const CARPARK_VEHICLE_SPAWN = { x: 455, z: 449.6 } as const;
export const CARPARK_EXIT_GATE = { x: 455, halfWidth: 5.8, minZ: 468, maxZ: 469.2 } as const;

export type CarparkVehicleTrack = {
  carId: string;
  x: number;
  z: number;
  yaw: number;
  /** Derived from accepted consecutive position samples, not a client speed claim. */
  speed: number;
  lastSyncAt: number;
  reachedGate: boolean;
};

export function validateCarparkExit(
  track: CarparkVehicleTrack | null,
  requestedCarId: string,
  hornHeld: unknown,
  now: number,
  ownedCars: readonly string[],
): { ok: true } | { ok: false; reason: string } {
  if (!ownedCars.includes(requestedCarId)) {
    return { ok: false, reason: "That vehicle is not owned by this account." };
  }
  if (!track || track.carId !== requestedCarId) {
    return { ok: false, reason: "Spawn an owned vehicle in the car park before driving to the exit." };
  }
  if (!Number.isFinite(now) || now < track.lastSyncAt || now - track.lastSyncAt > 2000) {
    return { ok: false, reason: "Reconnect the vehicle controls, stop at the gate, and honk again." };
  }
  if (
    !track.reachedGate ||
    Math.abs(track.x - CARPARK_EXIT_GATE.x) > CARPARK_EXIT_GATE.halfWidth ||
    track.z < CARPARK_EXIT_GATE.minZ ||
    track.z > CARPARK_EXIT_GATE.maxZ
  ) {
    return { ok: false, reason: "Drive through the marked gate before honking to leave the car park." };
  }
  if (hornHeld !== true) {
    return { ok: false, reason: "Hold the horn while stopped at the gate to enter the street." };
  }
  return { ok: true };
}

// ---------------------------------------------------------------- Nigeria-time day clock

const WAT_OFFSET_MS = 60 * 60 * 1000; // UTC+1 all year, Nigeria has no daylight saving
const DAY_MS = 24 * 60 * 60 * 1000;

// "YYYY-MM-DD" in Nigeria time for a given instant. A day ends at midnight WAT.
export function watDayKey(ms: number): string {
  return new Date(ms + WAT_OFFSET_MS).toISOString().slice(0, 10);
}

export function daysBetween(fromKey: string, toKey: string): number {
  const a = Date.parse(fromKey + "T00:00:00Z");
  const b = Date.parse(toKey + "T00:00:00Z");
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.round((b - a) / DAY_MS);
}

// Server clock. The offset exists only so tests can skip days without waiting;
// it stays 0 unless the server is started in debug-clock mode.
export class GameClock {
  private offsetMs = 0;
  now(): number {
    return Date.now() + this.offsetMs;
  }
  dayKey(): string {
    return watDayKey(this.now());
  }
  skipDays(days: number) {
    this.offsetMs += Math.trunc(days) * DAY_MS;
  }
  get offsetDays(): number {
    return Math.round(this.offsetMs / DAY_MS);
  }
}

// ---------------------------------------------------------------- per-player life state

export type Employment = {
  workplaceId: string;
  rank: number;
  onDuty?: boolean;
  lastTaskAt?: number;
  /** Server-authorised uniform currently worn, constrained to the employee's workplace. */
  uniformWorkplaceId?: string | null;
};

export type Life = {
  v: 1;
  employment: Employment | null; // one main job at a time
  homeId: string | null;
  rentDays: number; // prepaid days left on the home
  lastDay: string; // last WAT day this player's life was settled up to
  ownedCars: string[];
  parkedCars: string[];
};

export function newLife(todayKey: string): Life {
  return { v: 1, employment: null, homeId: null, rentDays: 0, lastDay: todayKey, ownedCars: [...CAR_IDS], parkedCars: [] };
}

// Accepts whatever came out of storage and always returns a valid Life.
export function normalizeLife(value: unknown, todayKey: string): Life {
  const base = newLife(todayKey);
  if (!value || typeof value !== "object" || Array.isArray(value)) return base;
  const v = value as Record<string, unknown>;

  let employment: Employment | null = null;
  const e = v.employment as Record<string, unknown> | null | undefined;
  if (e && typeof e === "object") {
    const workplaceId = String(e.workplaceId ?? "");
    const rank = Math.floor(Number(e.rank));
    if (findWorkplace(workplaceId) && Number.isFinite(rank) && rank >= 1 && rank <= RANK_COUNT) {
      const uniformWorkplaceId = e.uniformWorkplaceId === workplaceId ? workplaceId : null;
      // Older saves have no uniform marker. Keep them safe by requiring a fresh change
      // in the staff room before the next shift can start.
      const onDuty = e.onDuty === true && uniformWorkplaceId === workplaceId;
      const lastTaskAt = Math.max(0, Math.floor(Number(e.lastTaskAt) || 0));
      employment = { workplaceId, rank, onDuty, lastTaskAt, uniformWorkplaceId };
    }
  }

  let homeId: string | null = null;
  if (typeof v.homeId === "string" && findHouse(v.homeId)) homeId = v.homeId;

  const rentRaw = Math.floor(Number(v.rentDays));
  const rentDays = homeId && Number.isFinite(rentRaw) ? Math.max(0, Math.min(MAX_PREPAID_DAYS, rentRaw)) : 0;

  const lastDay = typeof v.lastDay === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v.lastDay) ? v.lastDay : todayKey;

  const ownedCars = Array.isArray(v.ownedCars)
    ? [...new Set(v.ownedCars.map(String).filter((id) => CAR_IDS.includes(id)))]
    : base.ownedCars;
  const parkedCars = Array.isArray(v.parkedCars)
    ? [...new Set(v.parkedCars.map(String).filter((id) => ownedCars.includes(id)))]
    : [];

  return { v: 1, employment, homeId, rentDays, lastDay, ownedCars, parkedCars };
}

// ---------------------------------------------------------------- rent over time

export type RolloverResult = {
  life: Life;
  midnights: number; // how many midnights passed
  rentUsed: number; // prepaid days consumed
  homeLost: string | null; // id of the house lost, if any
};

// Settle a player's life up to `todayKey`. Each midnight uses one prepaid day;
// a midnight with no days left loses the home. Used for online players at midnight
// and for offline players when they next log in.
export function settleLife(life: Life, todayKey: string): RolloverResult {
  const midnights = Math.max(0, daysBetween(life.lastDay, todayKey));
  const next: Life = { ...life, ownedCars: [...life.ownedCars], lastDay: midnights > 0 ? todayKey : life.lastDay };
  let rentUsed = 0;
  let homeLost: string | null = null;

  if (next.homeId) {
    for (let i = 0; i < midnights; i++) {
      if (next.rentDays > 0) {
        next.rentDays -= 1;
        rentUsed += 1;
      } else {
        homeLost = next.homeId;
        next.homeId = null;
        next.rentDays = 0;
        break;
      }
    }
  }

  return { life: next, midnights, rentUsed, homeLost };
}

// ---------------------------------------------------------------- rank rules

export type RankCheck = { ok: true } | { ok: false; reason: string };

// Only the boss of a workplace can promote or demote its staff, only within ranks 1..5,
// and nobody can change their own rank. The boss is set by hand in the world data.
export function checkRankChange(args: {
  workplaceId: string;
  actorId: string;
  actorBossOf: string | null; // the workplace this actor is boss of (from world data), if any
  targetId: string;
  targetEmployment: Employment | null;
  newRank: number;
}): RankCheck {
  const { workplaceId, actorId, actorBossOf, targetId, targetEmployment, newRank } = args;
  if (!findWorkplace(workplaceId)) return { ok: false, reason: "Unknown workplace." };
  if (actorBossOf !== workplaceId) return { ok: false, reason: "Only the boss can change ranks." };
  if (actorId === targetId) return { ok: false, reason: "Nobody can change their own rank." };
  if (!targetEmployment || targetEmployment.workplaceId !== workplaceId) {
    return { ok: false, reason: "That person doesn't work here." };
  }
  if (!Number.isInteger(newRank) || newRank < START_RANK || newRank > MAX_STAFF_RANK) {
    return { ok: false, reason: "Staff ranks go from 1 to " + MAX_STAFF_RANK + "." };
  }
  if (newRank === targetEmployment.rank) return { ok: false, reason: "They already have that rank." };
  return { ok: true };
}

// ---------------------------------------------------------------- world state (shared by everyone)

// The named primary account is fixed in server policy, not selected by a client request.
export const MAIN_ADMIN_USERNAME = "dbase_mccoll";
export type AdminRole = "main_admin" | "admin" | null;
export type AdminAuditAction = "grant_admin" | "revoke_admin" | "appoint_boss" | "rank_change" | "dismiss_staff";
export type AdminAuditEntry = {
  actorId: string;
  actorUsername: string;
  targetId: string;
  targetUsername: string;
  action: AdminAuditAction;
  detail: string;
  at: number;
};

export function resolveAdminRole(
  username: string,
  accountId: string,
  administrators: Record<string, true>,
): AdminRole {
  if (String(username).trim().toLowerCase() === MAIN_ADMIN_USERNAME) return "main_admin";
  return administrators[accountId] === true ? "admin" : null;
}

export function canManageAdminRoles(role: AdminRole): boolean {
  return role === "main_admin";
}

export type WorldState = {
  v: 1;
  // Boss of each workplace, by account id. Set by hand in the stored data for now.
  bosses: Record<string, string | null>;
  // Last assigned display name for each boss, so building signboards remain correct while the boss is offline.
  bossNames: Record<string, string | null>;
  // Who rents each house (account id), or null when vacant. Used from Stage 2.
  houseTenants: Record<string, string | null>;
  // Persistent owner-selected privacy for each rented home; vacant homes are always visitable.
  houseLocks: Record<string, boolean>;
  // Persistent delegated admins are keyed by immutable account ID; the main admin is derived from identity.
  admins: Record<string, true>;
  // Bounded, durable audit trail for privileged account/workplace changes.
  adminAudit: AdminAuditEntry[];
  // Pending faction/workplace applications, keyed by workplace ID then account ID.
  workplaceApplications: Record<string, Record<string, number>>;
  // One-time import marker: prevents legacy environment admins from being re-granted after revocation.
  legacyAdminsMigrated: boolean;
  lastDay: string;
};

export function newWorld(todayKey: string): WorldState {
  const bosses: Record<string, string | null> = {};
  const bossNames: Record<string, string | null> = {};
  for (const w of WORKPLACES) { bosses[w.id] = null; bossNames[w.id] = null; }
  const houseTenants: Record<string, string | null> = {};
  const houseLocks: Record<string, boolean> = {};
  const workplaceApplications: Record<string, Record<string, number>> = {};
  for (const h of HOUSES) { houseTenants[h.id] = null; houseLocks[h.id] = false; }
  for (const workplace of WORKPLACES) workplaceApplications[workplace.id] = {};
  return { v: 1, bosses, bossNames, houseTenants, houseLocks, workplaceApplications, admins: {}, adminAudit: [], legacyAdminsMigrated: false, lastDay: todayKey };
}

// Fills in anything missing so adding a workplace or house later never breaks an old save.
export function normalizeWorld(value: unknown, todayKey: string): WorldState {
  const base = newWorld(todayKey);
  if (!value || typeof value !== "object" || Array.isArray(value)) return base;
  const v = value as Record<string, any>;
  for (const id of Object.keys(base.bosses)) {
    const b = v.bosses?.[id];
    if (typeof b === "string" && b) base.bosses[id] = b;
    const displayName = v.bossNames?.[id];
    if (typeof displayName === "string" && displayName.trim()) base.bossNames[id] = displayName.trim().slice(0, 32);
  }
  for (const workplaceId of Object.keys(base.workplaceApplications)) {
    const saved = v.workplaceApplications?.[workplaceId];
    if (saved && typeof saved === "object" && !Array.isArray(saved)) {
      for (const [accountId, appliedAt] of Object.entries(saved as Record<string, unknown>)) {
        const timestamp = Number(appliedAt);
        if (accountId && Number.isFinite(timestamp) && timestamp > 0) {
          base.workplaceApplications[workplaceId][accountId] = Math.floor(timestamp);
        }
      }
    }
  }
  for (const id of Object.keys(base.houseTenants)) {
    const t = v.houseTenants?.[id];
    if (typeof t === "string" && t) base.houseTenants[id] = t;
    base.houseLocks[id] = v.houseLocks?.[id] === true;
  }
  if (v.admins && typeof v.admins === "object" && !Array.isArray(v.admins)) {
    for (const [accountId, granted] of Object.entries(v.admins as Record<string, unknown>)) {
      if (accountId && accountId.length <= 160 && (granted === true || granted === "admin")) {
        base.admins[accountId] = true;
      }
    }
  }
  const allowedAuditActions = new Set<AdminAuditAction>([
    "grant_admin", "revoke_admin", "appoint_boss", "rank_change", "dismiss_staff",
  ]);
  if (Array.isArray(v.adminAudit)) {
    base.adminAudit = v.adminAudit
      .filter((entry: any) =>
        entry && typeof entry === "object" &&
        typeof entry.actorId === "string" && entry.actorId.length > 0 &&
        typeof entry.actorUsername === "string" &&
        typeof entry.targetId === "string" && entry.targetId.length > 0 &&
        typeof entry.targetUsername === "string" &&
        allowedAuditActions.has(entry.action) &&
        Number.isFinite(Number(entry.at)) && Number(entry.at) > 0
      )
      .slice(-200)
      .map((entry: any) => ({
        actorId: String(entry.actorId).slice(0, 160),
        actorUsername: String(entry.actorUsername).slice(0, 32),
        targetId: String(entry.targetId).slice(0, 160),
        targetUsername: String(entry.targetUsername).slice(0, 32),
        action: entry.action as AdminAuditAction,
        detail: String(entry.detail ?? "").slice(0, 240),
        at: Math.floor(Number(entry.at)),
      }));
  }
  base.legacyAdminsMigrated = v.legacyAdminsMigrated === true;
  if (typeof v.lastDay === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v.lastDay)) base.lastDay = v.lastDay;
  return base;
}

export function bossWorkplaceOf(world: WorldState, accountId: string): string | null {
  for (const [workplaceId, bossId] of Object.entries(world.bosses)) {
    if (bossId === accountId) return workplaceId;
  }
  return null;
}
