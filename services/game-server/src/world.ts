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

export type WorkplaceKind = "market" | "bank" | "hospital" | "park" | "news" | "government";

export type Workplace = {
  id: string;
  name: string;
  kind: WorkplaceKind;
  zone: string; // district it belongs in; exact x/z are set when the stage that builds it places it
  // Six entries, rank 1 first. Each entry lists the titles that share that rank.
  rankTitles: readonly (readonly string[])[];
};

const ladder = (...titles: string[]): readonly (readonly string[])[] => titles.map((t) => [t]);

// Only workplaces whose six titles are already fixed in the plan are listed.
// Police, army, FRSC, fire, transport, shops and the rest are added in their own stages.
export const WORKPLACES: readonly Workplace[] = [
  {
    id: "market-mile1",
    name: "Mile 1 Market",
    kind: "market",
    zone: "Mile 1 Market",
    rankTitles: ladder("Hawker", "Stall Assistant", "Sales Rep", "Senior Sales", "Market Supervisor", "Market Chairman"),
  },
  {
    id: "bank-main",
    name: "Port Harcourt Bank",
    kind: "bank",
    zone: "Port Harcourt Centre",
    rankTitles: ladder("Trainee", "Teller", "Senior Teller", "Loan Officer", "Operations Manager", "Branch Manager"),
  },
  {
    id: "hospital-main",
    name: "General Hospital",
    kind: "hospital",
    zone: "Port Harcourt Centre",
    rankTitles: ladder("Orderly", "Nurse Aide", "Nurse", "Senior Nurse", "Doctor", "Chief Medical Director"),
  },
  {
    id: "park-main",
    name: "City Park",
    kind: "park",
    zone: "Port Harcourt Centre",
    rankTitles: ladder("Cleaner", "Gate Attendant", "Ticket Seller", "Ranger", "Operations Officer", "Park Director"),
  },
  {
    id: "news-main",
    name: "Rivers News Network",
    kind: "news",
    zone: "Port Harcourt Centre",
    rankTitles: ladder("Intern", "Production Assistant", "Reporter", "Anchor", "Editor", "Editor-in-Chief"),
  },
  {
    id: "gov-rivers",
    name: "Rivers State Government",
    kind: "government",
    zone: "Port Harcourt Centre",
    rankTitles: [
      ["Councillor", "Assistant", "Clerk"],
      ["Vice Chairman", "Special Adviser", "PRO"],
      ["Commissioner", "Senator", "LGA Chairman"],
      ["Secretary to the State Government", "Chief of Staff", "Speaker"],
      ["Deputy Governor"],
      ["Governor"],
    ],
  },
];

export function findWorkplace(id: string): Workplace | undefined {
  return WORKPLACES.find((w) => w.id === id);
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
  { id: "hut", name: "Local Hut", rentPerDay: 1000 },
  { id: "faceme", name: "Face-Me-I-Face-You", rentPerDay: 2500 },
  { id: "flat", name: "Flat", rentPerDay: 4000 },
  { id: "estate", name: "Estate House", rentPerDay: 7500 },
  { id: "mansion", name: "Mansion", rentPerDay: 10000 },
  { id: "palace", name: "Palace", rentPerDay: 20000 },
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

export type Employment = { workplaceId: string; rank: number };

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
      employment = { workplaceId, rank };
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

export type WorldState = {
  v: 1;
  // Boss of each workplace, by account id. Set by hand in the stored data for now.
  bosses: Record<string, string | null>;
  // Who rents each house (account id), or null when vacant. Used from Stage 2.
  houseTenants: Record<string, string | null>;
  // Persistent owner-selected privacy for each rented home; vacant homes are always visitable.
  houseLocks: Record<string, boolean>;
  lastDay: string;
};

export function newWorld(todayKey: string): WorldState {
  const bosses: Record<string, string | null> = {};
  for (const w of WORKPLACES) bosses[w.id] = null;
  const houseTenants: Record<string, string | null> = {};
  const houseLocks: Record<string, boolean> = {};
  for (const h of HOUSES) { houseTenants[h.id] = null; houseLocks[h.id] = false; }
  return { v: 1, bosses, houseTenants, houseLocks, lastDay: todayKey };
}

// Fills in anything missing so adding a workplace or house later never breaks an old save.
export function normalizeWorld(value: unknown, todayKey: string): WorldState {
  const base = newWorld(todayKey);
  if (!value || typeof value !== "object" || Array.isArray(value)) return base;
  const v = value as Record<string, any>;
  for (const id of Object.keys(base.bosses)) {
    const b = v.bosses?.[id];
    if (typeof b === "string" && b) base.bosses[id] = b;
  }
  for (const id of Object.keys(base.houseTenants)) {
    const t = v.houseTenants?.[id];
    if (typeof t === "string" && t) base.houseTenants[id] = t;
    base.houseLocks[id] = v.houseLocks?.[id] === true;
  }
  if (typeof v.lastDay === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v.lastDay)) base.lastDay = v.lastDay;
  return base;
}

export function bossWorkplaceOf(world: WorldState, accountId: string): string | null {
  for (const [workplaceId, bossId] of Object.entries(world.bosses)) {
    if (bossId === accountId) return workplaceId;
  }
  return null;
}
