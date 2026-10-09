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

export type RuleCheck = { ok: true } | { ok: false; reason: string };

export function rankMultiplier(rank: number): number {
  if (!Number.isInteger(rank) || rank < 1 || rank > RANK_COUNT) return RANK_MULTIPLIERS[0];
  return RANK_MULTIPLIERS[rank - 1];
}

export function payForTask(basePay: number, rank: number): number {
  const safeBasePay = Number.isFinite(basePay) ? Math.max(0, Math.floor(basePay)) : 0;
  return Math.round(safeBasePay * rankMultiplier(rank));
}

// Money transfers must not create funds on the client. Cash purchases may reduce cash,
// and a job reward is validated separately against the server's active job. Any positive
// bank change must be matched by an equal cash decrease; any positive cash change must be
// a validated job reward or a matching bank withdrawal.
export function validateWalletDeltas(
  cashDelta: number,
  bankDelta: number,
  reason: string,
): RuleCheck {
  if (!Number.isSafeInteger(cashDelta) || !Number.isSafeInteger(bankDelta)) {
    return { ok: false, reason: "Wallet amounts must be whole numbers." };
  }
  if (reason === "job") {
    if (cashDelta <= 0 || bankDelta !== 0) {
      return { ok: false, reason: "Invalid job reward request." };
    }
    return { ok: true };
  }
  if (cashDelta > 0 && bankDelta !== -cashDelta) {
    return { ok: false, reason: "Cash increases must come from a matching bank withdrawal." };
  }
  if (bankDelta > 0 && cashDelta !== -bankDelta) {
    return { ok: false, reason: "Bank increases must come from a matching cash deposit." };
  }
  return { ok: true };
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
  "Old GRA": [-2