import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createHash, randomBytes, randomUUID, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { WebSocketServer, WebSocket } from "ws";
import { Pool } from "pg";
import {
  GameClock,
  HOUSES,
  HOUSE_CLASSES,
  MAX_PREPAID_DAYS,
  BOSS_RANK,
  MAX_STAFF_RANK,
  FACTIONS,
  WORKPLACES,
  WORK_TASK_COOLDOWN_MS,
  WORK_TASK_DURATION_MS,
  CARPARK_EXIT_GATE,
  CARPARK_POSITION,
  CARPARK_VEHICLE_SPAWN,
  validateCarparkExit,
  checkRankChange,
  checkWorkplaceApplication,
  checkWorkplaceDuty,
  checkWorkTaskEligibility,
  bossWorkplaceOf,
  findHouse,
  findWorkplace,
  houseRent,
  newLife,
  newWorld,
  normalizeLife,
  normalizeWorld,
  payForTask,
  workplaceRankTitle,
  workplaceTasks,
  settleLife,
  type CarparkVehicleTrack,
  type Life,
  type Workplace,
  type WorldState,
} from "./world";

const scrypt = promisify(scryptCb);

type JobState = { n: string; x: number; z: number; pay: number } | null;
type Inventory = Record<string, number>;
type FuelMap = Record<string, number>;

type Account = {
  id: string;
  username: string;
  usernameLower: string;
  email: string;
  emailLower: string;
  passwordSalt: string;
  passwordHash: string;
  cash: number;
  bank: number;
  x: number;
  z: number;
  yaw: number;
  hp: number;
  hunger: number;
  level: number;
  xp: number;
  job: JobState;
  inventory: Inventory;
  fuel: FuelMap;
  life: Life;
  createdAt: number;
  updatedAt: number;
};

type PlayerState = {
  id: string;
  name: string;
  x: number;
  z: number;
  yaw: number;
  hp: number;
  hunger: number;
  level: number;
  xp: number;
  cash: number;
  bank: number;
  job: JobState;
  inventory: Inventory;
  fuel: FuelMap;
  life: Life;
  lastSequence: number;
};

type Session = {
  socket: WebSocket;
  account: Account;
  player: PlayerState;
  input: { sequence: number; forward: number; strafe: number };
  lastMessageAt: number;
  lastInputAt: number;
  lastSyncAt: number;
  rejectedSyncs: number;
  inHome: boolean;
  inCarpark: boolean;
  homeReturn: { x: number; z: number } | null;
  /** House currently being visited; visitors may enter unlocked or vacant homes. */
  currentHomeId?: string | null;
  carparkVehicle: CarparkVehicleTrack | null;
  workTask: { workplaceId: string; taskId: string; startedAt: number } | null;
};

type FileStore = {
  accounts: Record<string, Account>;
  sessions: Record<string, { accountId: string; expiresAt: number }>;
  world?: WorldState;
};

const PORT = Number(process.env.PORT ?? 8080);
const TICK_RATE = 20;
const SNAPSHOT_RATE = 10;
const MOVE_SPEED = 4.5; // matches the client's normal walk top speed; posSync corrects sprint/crouch
const WORLD_LIMIT = 500;
const SESSION_DAYS = 30;
const INPUT_TIMEOUT_MS = 400;
const FUEL_TANK = 40; // litres, must match the client
// Naira per litre, by station brand. NNPC is cheapest, then Restopark, then DBase, Hydropet is dearest.
// Keep in sync with FBR in the web client.
const FUEL_PRICES: Record<string, number> = { NNPC: 1250, Restopark: 1350, DBase: 1450, Hydropet: 1550 };
const FUEL_START = 20; // litres a car holds before its first save
const SYNC_MAX_SPEED = 50; // m/s, a bit above top car speed
const SYNC_SLACK = 3; // metres of tolerance
const SYNC_MAX_ELAPSED = 5; // seconds counted per sync, stops idle-then-teleport
const PROTOCOL_VERSION = 1;
const DATA_FILE = process.env.NRS_DATA_FILE ?? path.join(process.env.NRS_DATA_DIR ?? "/data", "accounts.json");
const DATABASE_URL = process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? "";

// Debug clock: lets a test skip days without waiting. Off unless NRS_DEBUG_CLOCK=1.
const DEBUG_CLOCK = process.env.NRS_DEBUG_CLOCK === "1";
// Comma-separated account usernames authorised to appoint faction/workplace bosses.
// Empty by default: leadership can never be claimed by an ordinary client.
const normaliseAdminName = (value: unknown) => String(value ?? "").trim().toLowerCase();
const FACTION_ADMIN_USERNAMES = new Set((process.env.NRS_FACTION_ADMINS ?? "").split(",").map(normaliseAdminName).filter(Boolean));
const SUPER_ADMIN_USERNAMES = new Set((process.env.NRS_SUPER_ADMINS ?? "").split(",").map(normaliseAdminName).filter(Boolean));
const clock = new GameClock();
let world: WorldState = newWorld(clock.dayKey());

const players = new Map<string, Session>();
const activeAccounts = new Map<string, WebSocket>();

let pool: Pool | null = null;
let fileStore: FileStore = { accounts: {}, sessions: {} };

const JOBS: Array<Exclude<JobState, null>> = [
  { n: "Parcel to Mile 1 Market", x: -6.5, z: 95, pay: 6000 },
  { n: "Parcel to Rumuola", x: 110, z: 70, pay: 9000 },
  { n: "Parcel to Waterlines", x: 90, z: 150, pay: 12000 },
];

function send(socket: WebSocket, message: unknown) {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
}

function broadcast(message: unknown) {
  for (const session of players.values()) send(session.socket, message);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function sanitizeEmail(value: unknown) {
  return String(value ?? "").trim().slice(0, 160);
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitizeUsername(value: unknown) {
  return String(value ?? "").trim().slice(0, 31);
}

function normalizeInventory(value: unknown): Inventory {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Inventory = {};
  for (const [name, raw] of Object.entries(value as Record<string, unknown>)) {
    const count = Math.floor(Number(raw));
    if (Number.isFinite(count) && count > 0) out[name.slice(0, 60)] = Math.min(9999, count);
  }
  return out;
}

function normalizeFuel(value: unknown): FuelMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: FuelMap = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>).slice(0, 40)) {
    if (!/^c\d{1,3}$/.test(key)) continue;
    const litres = Number(raw);
    if (Number.isFinite(litres)) out[key] = Math.round(Math.max(0, Math.min(FUEL_TANK, litres)) * 100) / 100;
  }
  return out;
}

function normalizeJob(value: unknown): JobState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  let n = typeof v.n === "string" ? v.n.slice(0, 100) : "";
  if (n === "Parcel to the Waterfront") n = "Parcel to Waterlines"; // renamed; keeps old saved jobs payable
  const x = Number(v.x);
  const z = Number(v.z);
  const pay = Number(v.pay);
  if (!n || !Number.isFinite(x) || !Number.isFinite(z) || !Number.isFinite(pay)) return null;
  return { n, x, z, pay };
}

function normalizeAccount(account: Account): Account {
  return {
    ...account,
    email: typeof account.email === "string" ? account.email : "",
    emailLower: typeof account.emailLower === "string" ? account.emailLower : "",
    cash: Math.max(0, Math.floor(Number(account.cash) || 0)),
    bank: Math.max(0, Math.floor(Number(account.bank) || 0)),
    x: Number.isFinite(Number(account.x)) ? Number(account.x) : 0,
    z: Number.isFinite(Number(account.z)) ? Number(account.z) : 24,
    yaw: Number.isFinite(Number(account.yaw)) ? Number(account.yaw) : Math.PI,
    hp: Math.max(1, Math.min(100, Number(account.hp) || 100)),
    hunger: Math.max(0, Math.min(100, Number(account.hunger) || 82)),
    level: Math.max(1, Math.floor(Number(account.level) || 1)),
    xp: Math.max(0, Math.floor(Number(account.xp) || 0)),
    job: normalizeJob(account.job),
    inventory: normalizeInventory(account.inventory),
    fuel: normalizeFuel(account.fuel),
    life: normalizeLife(account.life, clock.dayKey()),
  };
}

function publicPlayer(player: PlayerState) {
  return {
    id: player.id,
    name: player.name,
    x: Number(player.x.toFixed(3)),
    z: Number(player.z.toFixed(3)),
    yaw: Number(player.yaw.toFixed(3)),
    level: player.level,
  };
}

function accountPayload(player: PlayerState) {
  return {
    id: player.id,
    name: player.name,
    x: player.x,
    z: player.z,
    yaw: player.yaw,
    hp: player.hp,
    hunger: player.hunger,
    level: player.level,
    xp: player.xp,
    cash: player.cash,
    bank: player.bank,
    job: player.job,
    inventory: player.inventory,
    fuel: player.fuel,
    life: player.life,
    today: clock.dayKey(),
  };
}

function snapshot() {
  // Private home interiors are not visible to other players in the shared street world.
  return [...players.values()].filter((session) => !session.inHome).map((session) => publicPlayer(session.player));
}

function isValidKnownJob(value: JobState) {
  return value === null || JOBS.some(
    (job) => job.n === value?.n && job.x === value.x && job.z === value.z && job.pay === value.pay,
  );
}

async function hashPassword(password: string, saltHex?: string) {
  const salt = saltHex ?? randomBytes(16).toString("hex");
  const result = await scrypt(password, Buffer.from(salt, "hex"), 64) as Buffer;
  return { salt, hash: result.toString("hex") };
}

async function verifyPassword(password: string, saltHex: string, expectedHash: string) {
  const result = await scrypt(password, Buffer.from(saltHex, "hex"), 64) as Buffer;
  const expected = Buffer.from(expectedHash, "hex");
  return expected.length === result.length && timingSafeEqual(expected, result);
}

function writeFileStore() {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  const tempPath = DATA_FILE + ".tmp";
  fs.writeFileSync(tempPath, JSON.stringify(fileStore), "utf8");
  fs.renameSync(tempPath, DATA_FILE);
}

async function saveWorld() {
  if (pool) {
    await pool.query(
      "INSERT INTO nrs_world(key,value,updated_at) VALUES ('world',$1::jsonb,$2) " +
      "ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=EXCLUDED.updated_at",
      [JSON.stringify(world), Date.now()],
    );
    return;
  }
  fileStore.world = world;
  writeFileStore();
}

function housingSnapshot(session: Session) {
  return HOUSES.map((house) => {
    const cls = HOUSE_CLASSES.find((item) => item.id === house.cls)!;
    const tenant = world.houseTenants[house.id] ?? null;
    return {
      id: house.id, cls: house.cls, name: cls.name, rentPerDay: cls.rentPerDay,
      zone: house.zone, x: house.x, z: house.z, placed: house.placed,
      vacant: tenant === null, occupiedByMe: tenant === session.player.id,
      // Unrented properties are intentionally always visitable, regardless of a stale save.
      locked: tenant !== null && world.houseLocks[house.id] === true,
    };
  });
}

function isSuperAdmin(session: Session) {
  return SUPER_ADMIN_USERNAMES.has(normaliseAdminName(session.player.name));
}

function isSuperAdminName(username: unknown) {
  return SUPER_ADMIN_USERNAMES.has(normaliseAdminName(username));
}

function isFactionAdmin(session: Session) {
  if (isSuperAdmin(session)) return true;
  const accountId = session.player.id;
  if (Object.prototype.hasOwnProperty.call(world.factionAdminOverrides, accountId)) {
    return world.factionAdminOverrides[accountId] === true;
  }
  return FACTION_ADMIN_USERNAMES.has(normaliseAdminName(session.player.name));
}

function workplaceSnapshot(session: Session) {
  const employment = session.player.life.employment ?? null;
  const bossWorkplaceId = bossWorkplaceOf(world, session.player.id);
  const admin = isFactionAdmin(session);
  const superAdmin = isSuperAdmin(session);
  const onlinePlayers = [...players.values()].map((member) => ({
    id: member.player.id,
    name: member.player.name,
    workplaceId: member.player.life.employment?.workplaceId ?? null,
    rank: member.player.life.employment?.rank ?? null,
    onDuty: member.player.life.employment?.onDuty === true,
    isFactionAdmin: isFactionAdmin(member),
    isSuperAdmin: isSuperAdmin(member),
  }));
  const workplaces = WORKPLACES.map((workplace) => {
    const faction = FACTIONS.find((candidate) => candidate.id === workplace.factionId) ?? null;
    const members = onlinePlayers.filter((member) => member.workplaceId === workplace.id).map((member) => ({
      ...member,
      rankTitle: workplaceRankTitle(workplace.id, Number(member.rank)),
      boss: world.bosses[workplace.id] === member.id,
    }));
    const applicationTimes = world.workplaceApplications[workplace.id] ?? {};
    const canManage = world.bosses[workplace.id] === session.player.id;
    const applicants = (canManage || admin)
      ? Object.entries(applicationTimes).map(([accountId, appliedAt]) => {
          const applicant = players.get(accountId);
          return applicant ? { id: accountId, name: applicant.player.name, appliedAt } : { id: accountId, name: "Offline applicant", appliedAt };
        })
      : [];
    const isMember = employment?.workplaceId === workplace.id;
    return {
      ...workplace,
      faction,
      rankTitle: isMember ? workplaceRankTitle(workplace.id, employment?.rank ?? 1) : "",
      employed: isMember,
      onDuty: isMember && employment?.onDuty === true,
      canManage,
      bossName: members.find((member) => member.id === world.bosses[workplace.id])?.name ?? null,
      memberCount: members.length,
      staff: members,
      applications: applicants,
      hasApplied: Object.prototype.hasOwnProperty.call(applicationTimes, session.player.id),
      requiresApproval: faction?.requiresApproval === true,
      tasks: workplaceTasks(workplace.id).map((task) => ({
        ...task,
        pay: payForTask(task.basePay, isMember ? (employment?.rank ?? 1) : 1),
        durationMs: WORK_TASK_DURATION_MS,
        cooldownMs: WORK_TASK_COOLDOWN_MS,
      })),
    };
  });
  return {
    workplaces,
    factions: FACTIONS,
    employment,
    bossWorkplaceId,
    isFactionAdmin: admin,
    isSuperAdmin: superAdmin,
    onlinePlayers,
    activeTask: session.workTask
      ? { ...session.workTask, elapsedMs: Math.max(0, Date.now() - session.workTask.startedAt), durationMs: WORK_TASK_DURATION_MS }
      : null,
    taskReadyAt: Math.max(0, Number(employment?.lastTaskAt) + WORK_TASK_COOLDOWN_MS || 0),
    cash: session.player.cash,
    today: clock.dayKey(),
  };
}

function sendWorkplaceState(session: Session) {
  send(session.socket, { type: "workplaceState", ...workplaceSnapshot(session) });
}

function sendWorkplaceResult(session: Session, action: string, ok: boolean, message: string, extra: Record<string, unknown> = {}) {
  send(session.socket, { type: "workplaceResult", action, ok, message, ...extra, ...workplaceSnapshot(session) });
}

function broadcastWorkplaceStates() {
  for (const session of players.values()) sendWorkplaceState(session);
}

function workplaceDistance(session: Session, workplace: Workplace) {
  return Math.hypot(session.player.x - workplace.x, session.player.z - workplace.z);
}

function hasWorkplaceBossPermission(session: Session, workplaceId: string) {
  return world.bosses[workplaceId] === session.player.id;
}

async function setAccountEmployment(accountId: string, workplaceId: string | null, rank = 1) {
  const active = players.get(accountId);
  if (active) {
    active.player.life = {
      ...active.player.life,
      employment: workplaceId ? { workplaceId, rank, onDuty: false, lastTaskAt: 0 } : null,
    };
    active.workTask = null;
    await persistSession(active);
    return active.player.name;
  }
  const account = await findAccountById(accountId);
  if (!account) return null;
  account.life = {
    ...account.life,
    employment: workplaceId ? { workplaceId, rank, onDuty: false, lastTaskAt: 0 } : null,
  };
  await saveAccount(account);
  return account.username;
}

function homeInteriorPosition(homeId: string) {
  const found = HOUSES.findIndex((house) => house.id === homeId);
  const index = Math.max(0, found);
  // Six columns by five rows, each room separated and kept inside WORLD_LIMIT.
  return { x: 280 + (index % 6) * 28, z: 280 + Math.floor(index / 6) * 27 };
}

function houseExteriorDepth(cls: string): number {
  switch (cls) {
    case "hut": return 6;
    case "faceme": return 8;
    case "flat": return 10;
    case "estate": return 11;
    case "mansion": return 13;
    case "palace": return 16;
    default: return 10;
  }
}

// All exits use the front approach, so players emerge beside the home they rent
// instead of reappearing at whatever point on the map they entered from.
function homeStreetPosition(homeId: string) {
  const home = findHouse(homeId);
  if (!home) return null;
  return {
    x: Math.max(-WORLD_LIMIT + 8, Math.min(WORLD_LIMIT - 8, home.x)),
    z: Math.max(-WORLD_LIMIT + 8, Math.min(WORLD_LIMIT - 8, home.z + houseExteriorDepth(home.cls) / 2 + 8)),
  };
}

const CARPARK_PLAYER_POSITION = { x: CARPARK_POSITION.x, z: CARPARK_POSITION.z - 12 };

function sendHousingState(session: Session) {
  send(session.socket, {
    type: "housingState", houses: housingSnapshot(session),
    life: session.player.life, cash: session.player.cash, today: clock.dayKey(),
  });
}

const HOME_FURNITURE: Record<string, string[]> = {
  hut: ["Foam mattress", "Plastic chair", "Small table", "Standing fan", "Curtains"],
  faceme: ["Bed", "Wardrobe", "Two chairs", "Shared kitchen", "Curtains"],
  flat: ["Sofa set", "Bed and wardrobe", "Dining table", "Kitchen counter", "Television"],
  estate: ["Large sofa set", "Bedroom suite", "Dining set", "Kitchen cabinets", "Television", "Generator"],
  mansion: ["Luxury sofa set", "Master bedroom suite", "Dining room", "Fitted kitchen", "Television", "Air conditioning"],
  palace: ["Luxury lounge", "Premium bedroom suite", "Formal dining set", "Fitted kitchen", "Multiple televisions", "Air conditioning", "Decorative lighting"],
};

// Settle one online player's life up to today's Nigeria-time day (rent days used, home lost).
// Returns null when no midnight has passed since the last settle.
function settleSession(session: Session) {
  const result = settleLife(session.player.life, clock.dayKey());
  if (result.midnights === 0) return null;
  session.player.life = result.life;
  if (result.homeLost && world.houseTenants[result.homeLost] === session.player.id) {
    world.houseTenants[result.homeLost] = null;
    world.houseLocks[result.homeLost] = false;
    void saveWorld().catch((error) => console.error("save-world", error));
  }
  return result;
}

async function runMidnight() {
  const today = clock.dayKey();
  if (today === world.lastDay) return;
  world.lastDay = today;
  await saveWorld();

  for (const session of players.values()) {
    const result = settleSession(session);
    if (!result) continue;
    await persistSession(session);
    send(session.socket, {
      type: "lifeUpdate",
      life: session.player.life,
      today,
      rentUsed: result.rentUsed,
      homeLost: result.homeLost,
    });
    sendHousingState(session);
  }
  await saveWorld();
}

async function initStore() {
  if (DATABASE_URL) {
    pool = new Pool({ connectionString: DATABASE_URL, max: 10 });
    await pool.query(
      "CREATE TABLE IF NOT EXISTS nrs_accounts (" +
      "id TEXT PRIMARY KEY," +
      "username TEXT NOT NULL," +
      "username_lower TEXT NOT NULL UNIQUE," +
      "email TEXT," +
      "email_lower TEXT," +
      "password_salt TEXT NOT NULL," +
      "password_hash TEXT NOT NULL," +
      "cash BIGINT NOT NULL DEFAULT 5000," +
      "bank BIGINT NOT NULL DEFAULT 0," +
      "x DOUBLE PRECISION NOT NULL DEFAULT 0," +
      "z DOUBLE PRECISION NOT NULL DEFAULT 24," +
      "yaw DOUBLE PRECISION NOT NULL DEFAULT 3.14159265359," +
      "hp DOUBLE PRECISION NOT NULL DEFAULT 100," +
      "hunger DOUBLE PRECISION NOT NULL DEFAULT 82," +
      "level INTEGER NOT NULL DEFAULT 1," +
      "xp INTEGER NOT NULL DEFAULT 0," +
      "job JSONB," +
      "inventory JSONB NOT NULL DEFAULT '{}'::jsonb," +
      "created_at BIGINT NOT NULL," +
      "updated_at BIGINT NOT NULL" +
      ");" +
      "CREATE TABLE IF NOT EXISTS nrs_sessions (" +
      "token_hash TEXT PRIMARY KEY," +
      "account_id TEXT NOT NULL REFERENCES nrs_accounts(id) ON DELETE CASCADE," +
      "expires_at BIGINT NOT NULL," +
      "created_at BIGINT NOT NULL" +
      ");" +
      "CREATE INDEX IF NOT EXISTS nrs_sessions_account_idx ON nrs_sessions(account_id);",
    );
    await pool.query("ALTER TABLE nrs_accounts ADD COLUMN IF NOT EXISTS fuel JSONB NOT NULL DEFAULT '{}'::jsonb");
    await pool.query("ALTER TABLE nrs_accounts ADD COLUMN IF NOT EXISTS life JSONB NOT NULL DEFAULT '{}'::jsonb");
    await pool.query(
      "CREATE TABLE IF NOT EXISTS nrs_world (key TEXT PRIMARY KEY, value JSONB NOT NULL, updated_at BIGINT NOT NULL)",
    );
    const worldRow = await pool.query("SELECT value FROM nrs_world WHERE key='world' LIMIT 1");
    world = normalizeWorld(worldRow.rows[0]?.value, clock.dayKey());
    await saveWorld();
    await pool.query("ALTER TABLE nrs_accounts ADD COLUMN IF NOT EXISTS email TEXT");
    await pool.query("ALTER TABLE nrs_accounts ADD COLUMN IF NOT EXISTS email_lower TEXT");
    await pool.query("UPDATE nrs_accounts SET email=username || '@legacy.invalid' WHERE email IS NULL OR email=''");
    await pool.query("UPDATE nrs_accounts SET email_lower=LOWER(email) WHERE email_lower IS NULL OR email_lower=''");
    await pool.query("ALTER TABLE nrs_accounts ALTER COLUMN email SET NOT NULL");
    await pool.query("ALTER TABLE nrs_accounts ALTER COLUMN email_lower SET NOT NULL");
    await pool.query("CREATE UNIQUE INDEX IF NOT EXISTS nrs_accounts_email_lower_idx ON nrs_accounts(email_lower)");
    console.log("NRS durable storage: PostgreSQL");
    return;
  }

  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  try {
    fileStore = JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) as FileStore;
  } catch {
    fileStore = { accounts: {}, sessions: {} };
    writeFileStore();
  }
  world = normalizeWorld(fileStore.world, clock.dayKey());
  await saveWorld();
  console.warn("NRS durable storage: file fallback at " + DATA_FILE + ". Use DATABASE_URL or a Railway volume for production persistence.");
}

function accountFromRow(row: any): Account {
  return normalizeAccount({
    id: String(row.id),
    username: String(row.username),
    usernameLower: String(row.username_lower),
    email: String(row.email ?? ""),
    emailLower: String(row.email_lower ?? ""),
    passwordSalt: String(row.password_salt),
    passwordHash: String(row.password_hash),
    cash: Number(row.cash),
    bank: Number(row.bank),
    x: Number(row.x),
    z: Number(row.z),
    yaw: Number(row.yaw),
    hp: Number(row.hp),
    hunger: Number(row.hunger),
    level: Number(row.level),
    xp: Number(row.xp),
    job: row.job ?? null,
    inventory: row.inventory ?? {},
    fuel: row.fuel ?? {},
    life: row.life ?? {},
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  });
}

async function findAccountByEmail(emailLower: string) {
  if (pool) {
    const result = await pool.query("SELECT * FROM nrs_accounts WHERE email_lower=$1 LIMIT 1", [emailLower]);
    return result.rows[0] ? accountFromRow(result.rows[0]) : null;
  }
  const found = Object.values(fileStore.accounts).find((item) => String(item.emailLower ?? "").toLowerCase() === emailLower);
  return found ? normalizeAccount(found) : null;
}

async function findAccountByUsername(usernameLower: string) {
  if (pool) {
    const result = await pool.query("SELECT * FROM nrs_accounts WHERE username_lower=$1 LIMIT 1", [usernameLower]);
    return result.rows[0] ? accountFromRow(result.rows[0]) : null;
  }
  return fileStore.accounts[usernameLower] ? normalizeAccount(fileStore.accounts[usernameLower]) : null;
}

async function findAccountById(accountId: string) {
  if (pool) {
    const result = await pool.query("SELECT * FROM nrs_accounts WHERE id=$1 LIMIT 1", [accountId]);
    return result.rows[0] ? accountFromRow(result.rows[0]) : null;
  }
  const account = Object.values(fileStore.accounts).find((item) => item.id === accountId);
  return account ? normalizeAccount(account) : null;
}

async function insertAccount(account: Account) {
  if (pool) {
    await pool.query(
      "INSERT INTO nrs_accounts (" +
      "id,username,username_lower,email,email_lower,password_salt,password_hash,cash,bank,x,z,yaw,hp,hunger,level,xp,job,inventory,created_at,updated_at" +
      ") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17::jsonb,$18::jsonb,$19,$20)",
      [
        account.id,
        account.username,
        account.usernameLower,
        account.email,
        account.emailLower,
        account.passwordSalt,
        account.passwordHash,
        account.cash,
        account.bank,
        account.x,
        account.z,
        account.yaw,
        account.hp,
        account.hunger,
        account.level,
        account.xp,
        JSON.stringify(account.job),
        JSON.stringify(account.inventory),
        account.createdAt,
        account.updatedAt,
      ],
    );
    return;
  }

  fileStore.accounts[account.usernameLower] = account;
  writeFileStore();
}

async function saveAccount(account: Account) {
  account.updatedAt = Date.now();

  if (pool) {
    await pool.query(
      "UPDATE nrs_accounts SET " +
      "username=$2,cash=$3,bank=$4,x=$5,z=$6,yaw=$7,hp=$8,hunger=$9,level=$10,xp=$11," +
      "job=$12::jsonb,inventory=$13::jsonb,updated_at=$14,fuel=$15::jsonb,life=$16::jsonb WHERE id=$1",
      [
        account.id,
        account.username,
        account.cash,
        account.bank,
        account.x,
        account.z,
        account.yaw,
        account.hp,
        account.hunger,
        account.level,
        account.xp,
        JSON.stringify(account.job),
        JSON.stringify(account.inventory),
        account.updatedAt,
        JSON.stringify(account.fuel),
        JSON.stringify(account.life),
      ],
    );
    return;
  }

  fileStore.accounts[account.usernameLower] = account;
  writeFileStore();
}

async function createAccount(email: string, username: string, password: string) {
  email = sanitizeEmail(email);
  const emailLower = email.toLowerCase();
  if (!isValidEmail(email)) throw new Error("EMAIL_INVALID");
  if (username.length < 3) throw new Error("USERNAME_TOO_SHORT");
  if (!/^[A-Za-z]+_[A-Za-z]+$/.test(username)) throw new Error("USERNAME_INVALID");
  if (password.length < 6) throw new Error("PASSWORD_TOO_SHORT");

  const usernameLower = username.toLowerCase();
  if (await findAccountByUsername(usernameLower)) throw new Error("USERNAME_TAKEN");
  if (await findAccountByEmail(emailLower)) throw new Error("EMAIL_TAKEN");

  const { salt, hash } = await hashPassword(password);
  const now = Date.now();
  const account: Account = {
    id: randomUUID(),
    username,
    usernameLower,
    email,
    emailLower,
    passwordSalt: salt,
    passwordHash: hash,
    cash: 5000,
    bank: 0,
    x: 0,
    z: 24,
    yaw: Math.PI,
    hp: 100,
    hunger: 82,
    level: 1,
    xp: 0,
    job: null,
    inventory: {},
    fuel: {},
    life: newLife(clock.dayKey()),
    createdAt: now,
    updatedAt: now,
  };

  try {
    await insertAccount(account);
  } catch (error: any) {
    if (error?.code === "23505") {
      if (await findAccountByEmail(emailLower)) throw new Error("EMAIL_TAKEN");
      if (await findAccountByUsername(usernameLower)) throw new Error("USERNAME_TAKEN");
    }
    throw error;
  }

  return account;
}

async function createSession(accountId: string) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;

  if (pool) {
    await pool.query("DELETE FROM nrs_sessions WHERE account_id=$1", [accountId]);
    await pool.query(
      "INSERT INTO nrs_sessions(token_hash,account_id,expires_at,created_at) VALUES ($1,$2,$3,$4)",
      [tokenHash, accountId, expiresAt, Date.now()],
    );
  } else {
    for (const [key, value] of Object.entries(fileStore.sessions)) {
      if (value.accountId === accountId) delete fileStore.sessions[key];
    }
    fileStore.sessions[tokenHash] = { accountId, expiresAt };
    writeFileStore();
  }

  return token;
}

async function resolveSession(token: string) {
  const tokenHash = hashToken(token);
  let session: { accountId: string; expiresAt: number } | null = null;

  if (pool) {
    const result = await pool.query(
      "SELECT account_id,expires_at FROM nrs_sessions WHERE token_hash=$1 LIMIT 1",
      [tokenHash],
    );
    if (result.rows[0]) {
      session = {
        accountId: String(result.rows[0].account_id),
        expiresAt: Number(result.rows[0].expires_at),
      };
    }
  } else {
    session = fileStore.sessions[tokenHash] ?? null;
  }
  

  if (!session || session.expiresAt < Date.now()) return null;
  return findAccountById(session.accountId);
}

function makePlayer(account: Account): PlayerState {
  return {
    id: account.id,
    name: account.username,
    x: account.x,
    z: account.z,
    yaw: account.yaw,
    hp: account.hp,
    hunger: account.hunger,
    level: account.level,
    xp: account.xp,
    cash: account.cash,
    bank: account.bank,
    job: account.job,
    inventory: normalizeInventory(account.inventory),
    fuel: normalizeFuel(account.fuel),
    life: account.life,
    lastSequence: -1,
  };
}

async function persistSession(session: Session) {
  const account = session.account;
  account.username = session.player.name;
  account.usernameLower = account.username.toLowerCase();
  // If a player disconnects or the server restarts indoors, resume outside the room.
  account.x = session.inHome && session.homeReturn ? session.homeReturn.x : session.player.x;
  account.z = session.inHome && session.homeReturn ? session.homeReturn.z : session.player.z;
  account.yaw = session.player.yaw;
  account.hp = session.player.hp;
  account.hunger = session.player.hunger;
  account.level = session.player.level;
  account.xp = session.player.xp;
  account.cash = session.player.cash;
  account.bank = session.player.bank;
  account.job = normalizeJob(session.player.job);
  account.inventory = normalizeInventory(session.player.inventory);
  account.fuel = normalizeFuel(session.player.fuel);
  account.life = session.player.life;
  await saveAccount(account);
}

const webDirCandidates = [
  path.resolve(__dirname, "../../web-client/dist"),
  path.resolve(process.cwd(), "services/web-client/dist"),
  path.resolve(process.cwd(), "../web-client/dist"),
];

const WEB_DIR = webDirCandidates.find((candidate) => fs.existsSync(candidate)) ?? webDirCandidates[0];

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

const httpServer = http.createServer((request, response) => {
  const url = new URL(request.url ?? "/", "http://" + (request.headers.host ?? "localhost"));

  if (url.pathname === "/health") {
    response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({
      ok: true,
      service: "nigeria-rp-game-server",
      players: players.size,
      storage: pool ? "postgres" : "file-fallback",
      day: clock.dayKey(),
      debugClock: DEBUG_CLOCK,
    }));
    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { allow: "GET, HEAD" });
    response.end();
    return;
  }

  let pathname: string;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    response.writeHead(400);
    response.end("Bad request");
    return;
  }

  const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const requested = path.resolve(WEB_DIR, relative);

  if (requested !== WEB_DIR && !requested.startsWith(WEB_DIR + path.sep)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  let finalPath = requested;

  if (!fs.existsSync(finalPath) || !fs.statSync(finalPath).isFile()) {
    if (!path.extname(relative)) {
      finalPath = path.join(WEB_DIR, "index.html");
    } else {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
  }

  try {
    const stat = fs.statSync(finalPath);
    response.writeHead(200, {
      "content-type": MIME[path.extname(finalPath).toLowerCase()] ?? "application/octet-stream",
      "content-length": stat.size,
      "cache-control": path.basename(finalPath) === "index.html" || path.basename(finalPath) === "nrs-online.js"
        ? "no-cache"
        : "public, max-age=31536000, immutable",
    });

    if (request.method === "HEAD") {
      response.end();
      return;
    }

    fs.createReadStream(finalPath).pipe(response);
  } catch {
    response.writeHead(500);
    response.end("Static file error");
  }
});

const wss = new WebSocketServer({ server: httpServer, maxPayload: 16 * 1024 });

wss.on("connection", (socket) => {
  let authenticated = false;
  let accountId: string | null = null;

  const authTimer = setTimeout(() => {
    if (!authenticated) {
      send(socket, {
        type: "authError",
        code: "AUTH_REQUIRED",
        message: "Please log in or create an account.",
      });
      socket.close(4002, "Authentication required");
    }
  }, 12000);

  const finishAuthentication = async (account: Account, token: string) => {
    const previousSocket = activeAccounts.get(account.id);

    if (previousSocket && previousSocket !== socket) {
      send(previousSocket, {
        type: "authError",
        code: "ACCOUNT_OPENED_ELSEWHERE",
        message: "This account was opened on another device.",
      });
      previousSocket.close(4001, "Account opened elsewhere");
    }

    authenticated = true;
    accountId = account.id;
    clearTimeout(authTimer);

    const session: Session = {
      socket,
      account,
      player: makePlayer(account),
      input: { sequence: -1, forward: 0, strafe: 0 },
      lastMessageAt: Date.now(),
      lastInputAt: 0,
      lastSyncAt: Date.now(),
      rejectedSyncs: 0,
      inHome: false,
      inCarpark: false,
      homeReturn: null,
      carparkVehicle: null,
      workTask: null,
    };

    // A disconnect never leaves a player clocked in or with an unfinished task.
    const resumedOnDuty = session.player.life.employment?.onDuty === true;
    if (resumedOnDuty && session.player.life.employment) {
      session.player.life = {
        ...session.player.life,
        employment: { ...session.player.life.employment, onDuty: false },
      };
    }

    // Offline players are settled here: any midnights that passed while they were away.
    const settled = settleSession(session);
    if (settled || resumedOnDuty) {
      await persistSession(session);
      if (settled?.homeLost) await saveWorld();
    }

    players.set(account.id, session);
    activeAccounts.set(account.id, socket);

    send(socket, {
      type: "authOk",
      protocolVersion: PROTOCOL_VERSION,
      token,
      player: accountPayload(session.player),
      players: snapshot(),
      onlineCount: players.size,
      houses: housingSnapshot(session),
      ...workplaceSnapshot(session),
    });
    if (settled?.homeLost) {
      send(socket, {
        type: "lifeUpdate", life: session.player.life, today: clock.dayKey(),
        rentUsed: settled.rentUsed, homeLost: settled.homeLost,
      });
    }

    broadcast({
      type: "playerJoined",
      player: publicPlayer(session.player),
      onlineCount: players.size,
    });
  };

  socket.on("message", (raw) => {
    void (async () => {
      let message: any;

      try {
        message = JSON.parse(raw.toString());
      } catch {
        send(socket, { type: "error", code: "INVALID_JSON" });
        return;
      }

      if (!authenticated) {
        try {
          if (message.type === "authRegister") {
            const email = sanitizeEmail(message.email);
            const username = sanitizeUsername(message.username);
            const password = String(message.password ?? "");
            const account = await createAccount(email, username, password);
            const token = await createSession(account.id);
            await finishAuthentication(account, token);
            return;
          }

          if (message.type === "authLogin") {
            const email = sanitizeEmail(message.email);
            const account = await findAccountByEmail(email.toLowerCase());

            if (!account || !(await verifyPassword(
              String(message.password ?? ""),
              account.passwordSalt,
              account.passwordHash,
            ))) {
              throw new Error("INVALID_CREDENTIALS");
            }

            const token = await createSession(account.id);
            await finishAuthentication(account, token);
            return;
          }

          if (message.type === "authResume") {
            const token = String(message.token ?? "").trim();
            const account = token ? await resolveSession(token) : null;

            if (!account) throw new Error("INVALID_SESSION");

            await finishAuthentication(account, token);
            return;
          }

          send(socket, {
            type: "authError",
            code: "AUTH_REQUIRED",
            message: "Please log in or create an account.",
          });
        } catch (error) {
          const code = error instanceof Error ? error.message : "AUTH_FAILED";
          const messages: Record<string, string> = {
            EMAIL_INVALID: "Enter a valid email address.",
            EMAIL_TAKEN: "An account already exists with that email.",
            PASSWORD_TOO_SHORT: "Password must be at least 6 characters.",
            USERNAME_TOO_SHORT: "Username must be at least 3 characters.",
            USERNAME_INVALID: "Username must be exactly Firstname_lastname, using letters only.",
            USERNAME_TAKEN: "That username is already taken.",
            INVALID_CREDENTIALS: "Incorrect email or password.",
            INVALID_SESSION: "Your session has expired. Please log in again.",
            AUTH_REQUIRED: "Please log in or create an account.",
          };

          send(socket, {
            type: "authError",
            code,
            message: messages[code] ?? "Could not complete the account request.",
          });
        }

        return;
      }

      const session = accountId ? players.get(accountId) : null;
      if (!session) return;

      session.lastMessageAt = Date.now();

      if (message.type === "input") {
        const input = message.input;

        if (
          !input ||
          !Number.isInteger(input.sequence) ||
          input.sequence <= session.player.lastSequence ||
          !Number.isFinite(input.forward) ||
          !Number.isFinite(input.strafe) ||
          Math.abs(input.forward) > 2 ||
          Math.abs(input.strafe) > 2
        ) {
          send(socket, { type: "error", code: "INVALID_INPUT" });
          return;
        }

        session.player.lastSequence = input.sequence;
        session.lastInputAt = Date.now();
        session.input = {
          sequence: input.sequence,
          forward: Math.max(-1, Math.min(1, Number(input.forward))),
          strafe: Math.max(-1, Math.min(1, Number(input.strafe))),
        };
        return;
      }

      if (message.type === "posSync") {
        if (session.inHome) return;
        const x = Number(message.x);
        const z = Number(message.z);
        const yaw = Number(message.yaw);

        if (!Number.isFinite(x) || !Number.isFinite(z) || Math.abs(x) > WORLD_LIMIT || Math.abs(z) > WORLD_LIMIT) return;

        const now = Date.now();
        const elapsed = Math.min(SYNC_MAX_ELAPSED, Math.max(0, (now - session.lastSyncAt) / 1000));
        const allowed = SYNC_SLACK + SYNC_MAX_SPEED * elapsed;
        const moved = Math.hypot(x - session.player.x, z - session.player.z);

        if (moved <= allowed) {
          session.player.x = x;
          session.player.z = z;
          if (Number.isFinite(yaw)) session.player.yaw = yaw;
          session.lastSyncAt = now;
          session.rejectedSyncs = 0;
        } else {
          session.rejectedSyncs += 1;
          session.lastSyncAt = now;

          // Client keeps disagreeing: snap it back to the server's position.
          if (session.rejectedSyncs >= 3) {
            session.rejectedSyncs = 0;
            send(socket, { type: "posCorrect", x: session.player.x, z: session.player.z });
          }
        }
        return;
      }

      if (message.type === "buyFuel") {
        const carId = String(message.carId ?? "");
        const price = FUEL_PRICES[String(message.brand ?? "")];
        const litres = Math.floor(Number(message.litres));
        const fail = (text: string) => send(socket, { type: "fuelResult", ok: false, message: text });

        if (!price || !/^c\d{1,3}$/.test(carId) || !Number.isFinite(litres) || litres < 1 || litres > FUEL_TANK) {
          fail("Invalid fuel request.");
          return;
        }

        const current = session.player.fuel[carId] ?? FUEL_START;

        if (litres > Math.floor(FUEL_TANK - current + 1e-6)) {
          fail("The tank can't hold that much.");
          return;
        }

        const cost = litres * price;

        if (session.player.cash < cost) {
          fail("Not enough cash.");
          return;
        }

        session.player.cash -= cost;
        session.player.fuel[carId] = Math.round((current + litres) * 100) / 100;
        await persistSession(session);

        send(socket, {
          type: "fuelResult",
          ok: true,
          carId,
          fuel: session.player.fuel[carId],
          cash: session.player.cash,
        });
        return;
      }

      if (message.type === "acceptJob") {
        const jobName = String(message.name ?? "");
        const known = JOBS.find((job) => job.n === jobName);

        if (!known) {
          send(socket, { type: "jobResult", ok: false, message: "Unknown job." });
          return;
        }

        if (session.player.job) {
          send(socket, { type: "jobResult", ok: false, message: "You already have an active job." });
          return;
        }

        session.player.job = { ...known };
        await persistSession(session);
        send(socket, { type: "jobResult", ok: true, job: session.player.job });
        return;
      }

      if (message.type === "getWorkplaces") {
        sendWorkplaceState(session);
        return;
      }

      if (message.type === "applyWorkplace") {
        const workplaceId = String(message.workplaceId ?? "");
        const workplace = findWorkplace(workplaceId);
        const check = checkWorkplaceApplication(session.player.life.employment ?? null, workplaceId);
        if (!workplace) {
          sendWorkplaceResult(session, "apply", false, "Unknown workplace or faction.");
          return;
        }
        if (!check.ok) {
          sendWorkplaceResult(session, "apply", false, check.reason);
          return;
        }
        const faction = FACTIONS.find((candidate) => candidate.id === workplace.factionId);
        if (faction?.requiresApproval) {
          const applications = world.workplaceApplications[workplaceId] ?? (world.workplaceApplications[workplaceId] = {});
          if (applications[session.player.id]) {
            sendWorkplaceResult(session, "apply", false, "Your application is already waiting for review.");
            return;
          }
          applications[session.player.id] = Date.now();
          await saveWorld();
          sendWorkplaceResult(session, "apply", true, "Application submitted. A faction boss must review it before you can join.");
          broadcastWorkplaceStates();
          return;
        }
        session.player.life = {
          ...session.player.life,
          employment: { workplaceId, rank: 1, onDuty: false, lastTaskAt: 0 },
        };
        delete world.workplaceApplications[workplaceId]?.[session.player.id];
        await persistSession(session);
        await saveWorld();
        sendWorkplaceResult(session, "apply", true, "You have been hired as " + workplaceRankTitle(workplaceId, 1) + ". Report to the workplace to clock in.");
        broadcastWorkplaceStates();
        return;
      }

      if (message.type === "leaveWorkplace") {
        const employment = session.player.life.employment ?? null;
        if (!employment) {
          sendWorkplaceResult(session, "leave", false, "You do not currently have a workplace.");
          return;
        }
        if (employment.onDuty) {
          sendWorkplaceResult(session, "leave", false, "Clock out before leaving your job.");
          return;
        }
        if (world.bosses[employment.workplaceId] === session.player.id) {
          sendWorkplaceResult(session, "leave", false, "You are the boss of this workplace. An authorised admin must appoint your replacement first.");
          return;
        }
        session.player.life = { ...session.player.life, employment: null };
        session.workTask = null;
        await persistSession(session);
        sendWorkplaceResult(session, "leave", true, "You have left your workplace.");
        broadcastWorkplaceStates();
        return;
      }

      if (message.type === "setWorkplaceDuty") {
        const workplaceId = String(message.workplaceId ?? "");
        const workplace = findWorkplace(workplaceId);
        const requested = message.onDuty;
        if (!workplace) {
          sendWorkplaceResult(session, "duty", false, "Unknown workplace.");
          return;
        }
        const employment = session.player.life.employment ?? null;
        const check = checkWorkplaceDuty(
          employment,
          workplaceId,
          requested,
          workplaceDistance(session, workplace),
        );
        if (!check.ok) {
          sendWorkplaceResult(session, "duty", false, check.reason);
          return;
        }
        session.player.life = {
          ...session.player.life,
          employment: { ...employment!, onDuty: requested as boolean },
        };
        // Clocking out safely abandons any unfinished, unpaid task.
        if (!requested) session.workTask = null;
        await persistSession(session);
        sendWorkplaceResult(session, "duty", true, requested ? "Clocked in. You are now on duty." : "Clocked out. You are now off duty.");
        broadcastWorkplaceStates();
        return;
      }

      if (message.type === "startWorkTask") {
        const employment = session.player.life.employment ?? null;
        const workplaceId = String(employment?.workplaceId ?? "");
        const taskId = String(message.taskId ?? "");
        const workplace = findWorkplace(workplaceId);
        if (!workplace || !employment) {
          sendWorkplaceResult(session, "taskStart", false, "Join a workplace before starting a work task.");
          return;
        }
        const check = checkWorkTaskEligibility({
          employment,
          workplaceId,
          taskId,
          distance: workplaceDistance(session, workplace),
          now: Date.now(),
          startedAt: 0,
          onDuty: employment.onDuty === true,
          activeTaskId: session.workTask?.taskId ?? null,
        });
        if (!check.ok) {
          sendWorkplaceResult(session, "taskStart", false, check.reason);
          return;
        }
        session.workTask = { workplaceId, taskId, startedAt: Date.now() };
        const task = workplaceTasks(workplaceId).find((candidate) => candidate.id === taskId)!;
        sendWorkplaceResult(session, "taskStart", true, "Task started: " + task.title + ". Stay at the workplace and finish after 10 seconds.", {
          activeTask: { ...session.workTask, durationMs: WORK_TASK_DURATION_MS },
        });
        return;
      }

      if (message.type === "completeWorkTask") {
        const employment = session.player.life.employment ?? null;
        const activeTask = session.workTask;
        if (!employment || !activeTask) {
          sendWorkplaceResult(session, "taskComplete", false, "Start a workplace task before trying to complete one.");
          return;
        }
        const workplace = findWorkplace(activeTask.workplaceId);
        const check = checkWorkTaskEligibility({
          employment,
          workplaceId: activeTask.workplaceId,
          taskId: activeTask.taskId,
          distance: workplace ? workplaceDistance(session, workplace) : Number.POSITIVE_INFINITY,
          now: Date.now(),
          startedAt: activeTask.startedAt,
          onDuty: employment.onDuty === true,
          activeTaskId: activeTask.taskId,
        });
        if (!check.ok) {
          sendWorkplaceResult(session, "taskComplete", false, check.reason);
          return;
        }
        const task = workplaceTasks(activeTask.workplaceId).find((candidate) => candidate.id === activeTask.taskId);
        if (!task) {
          session.workTask = null;
          sendWorkplaceResult(session, "taskComplete", false, "That task is no longer available.");
          return;
        }
        const reward = payForTask(task.basePay, employment.rank);
        const now = Date.now();
        session.player.cash += reward;
        session.player.life = {
          ...session.player.life,
          employment: { ...employment, onDuty: true, lastTaskAt: now },
        };
        session.workTask = null;
        await persistSession(session);
        sendWorkplaceResult(session, "taskComplete", true, "Task completed: " + task.title + ". You earned ₦" + reward.toLocaleString("en-NG") + ".", { reward, cash: session.player.cash });
        broadcastWorkplaceStates();
        return;
      }

      if (message.type === "approveWorkplaceApplication") {
        const workplaceId = String(message.workplaceId ?? "");
        const targetId = String(message.targetId ?? "");
        const approve = message.approve === true;
        const workplace = findWorkplace(workplaceId);
        if (!workplace || (!isFactionAdmin(session) && !hasWorkplaceBossPermission(session, workplaceId))) {
          sendWorkplaceResult(session, "applicationReview", false, "Only this workplace's boss or a faction administrator can review applications.");
          return;
        }
        const applications = world.workplaceApplications[workplaceId] ?? {};
        if (!applications[targetId]) {
          sendWorkplaceResult(session, "applicationReview", false, "That application is no longer pending.");
          return;
        }
        if (approve) {
          const active = players.get(targetId);
          const account = active?.account ?? await findAccountById(targetId);
          if (!account) {
            delete applications[targetId];
            await saveWorld();
            sendWorkplaceResult(session, "applicationReview", false, "The applicant account could not be found.");
            return;
          }
          const currentLife = active?.player.life ?? account.life;
          const check = checkWorkplaceApplication(currentLife.employment ?? null, workplaceId);
          if (!check.ok) {
            sendWorkplaceResult(session, "applicationReview", false, check.reason);
            return;
          }
          await setAccountEmployment(targetId, workplaceId, 1);
        }
        delete applications[targetId];
        await saveWorld();
        sendWorkplaceResult(session, "applicationReview", true, approve ? "Applicant hired at Rank 1." : "Application declined.");
        broadcastWorkplaceStates();
        return;
      }

      if (message.type === "hireWorkplaceStaff") {
        const workplaceId = String(message.workplaceId ?? "");
        const targetId = String(message.targetId ?? "");
        const workplace = findWorkplace(workplaceId);
        const target = players.get(targetId);
        if (!workplace || (!isFactionAdmin(session) && !hasWorkplaceBossPermission(session, workplaceId))) {
          sendWorkplaceResult(session, "hire", false, "Only this workplace's boss or a faction administrator can hire staff.");
          return;
        }
        if (!target || targetId === session.player.id) {
          sendWorkplaceResult(session, "hire", false, "Choose an online player to hire.");
          return;
        }
        const check = checkWorkplaceApplication(target.player.life.employment ?? null, workplaceId);
        if (!check.ok) {
          sendWorkplaceResult(session, "hire", false, check.reason);
          return;
        }
        target.player.life = { ...target.player.life, employment: { workplaceId, rank: 1, onDuty: false, lastTaskAt: 0 } };
        delete world.workplaceApplications[workplaceId]?.[targetId];
        await persistSession(target);
        await saveWorld();
        sendWorkplaceResult(session, "hire", true, target.player.name + " hired at Rank 1.");
        sendWorkplaceResult(target, "hired", true, "You have been hired at " + workplace.name + ".");
        broadcastWorkplaceStates();
        return;
      }

      if (message.type === "dismissWorkplaceStaff") {
        const workplaceId = String(message.workplaceId ?? "");
        const targetId = String(message.targetId ?? "");
        const workplace = findWorkplace(workplaceId);
        const admin = isFactionAdmin(session);
        if (!workplace || (!admin && !hasWorkplaceBossPermission(session, workplaceId))) {
          sendWorkplaceResult(session, "dismiss", false, "Only this workplace's boss or a faction administrator can dismiss staff.");
          return;
        }
        if (!targetId || targetId === session.player.id || (!admin && world.bosses[workplaceId] === targetId)) {
          sendWorkplaceResult(session, "dismiss", false, "Choose a staff member; only a faction administrator can remove the workplace boss.");
          return;
        }
        const target = players.get(targetId);
        const account = target?.account ?? await findAccountById(targetId);
        const targetLife = target?.player.life ?? account?.life;
        if (!targetLife?.employment || targetLife.employment.workplaceId !== workplaceId) {
          sendWorkplaceResult(session, "dismiss", false, "That player is not a member of this workplace.");
          return;
        }
        if (world.bosses[workplaceId] === targetId) {
          world.bosses[workplaceId] = null;
          await saveWorld();
        }
        await setAccountEmployment(targetId, null);
        sendWorkplaceResult(session, "dismiss", true, (target?.player.name ?? account?.username ?? "Staff member") + " has been removed from " + workplace.name + ".");
        if (target) sendWorkplaceResult(target, "dismissed", true, "You have been removed from " + workplace.name + ".");
        broadcastWorkplaceStates();
        return;
      }

      if (message.type === "setStaffRank") {
        const workplaceId = String(message.workplaceId ?? "");
        const targetId = String(message.targetId ?? "");
        const requestedRank = Number(message.newRank);
        const newRank = Math.floor(requestedRank);
        const workplace = findWorkplace(workplaceId);
        const admin = isFactionAdmin(session);
        if (!workplace || (!admin && !hasWorkplaceBossPermission(session, workplaceId))) {
          sendWorkplaceResult(session, "rank", false, "Only this workplace's boss or a faction administrator can change ranks.");
          return;
        }
        if (!Number.isInteger(requestedRank) || newRank < 1 || newRank > (admin ? BOSS_RANK : MAX_STAFF_RANK)) {
          sendWorkplaceResult(session, "rank", false, admin
            ? "Administrator ranks must be between 1 and " + BOSS_RANK + "."
            : "Workplace bosses can assign staff ranks 1 through " + MAX_STAFF_RANK + ".");
          return;
        }
        const target = players.get(targetId);
        const account = target?.account ?? await findAccountById(targetId);
        const targetLife = target?.player.life ?? account?.life;
        if (!targetLife) {
          sendWorkplaceResult(session, "rank", false, "That player account could not be found.");
          return;
        }

        if (!admin) {
          const check = checkRankChange({
            workplaceId,
            actorId: session.player.id,
            actorBossOf: bossWorkplaceOf(world, session.player.id),
            targetId,
            targetEmployment: targetLife.employment ?? null,
            newRank,
          });
          if (!check.ok) {
            sendWorkplaceResult(session, "rank", false, check.reason);
            return;
          }
        } else {
          // An administrator can assign any player to any listed workplace at any rank.
          const previousWorkplaceId = targetLife.employment?.workplaceId ?? null;
          if (previousWorkplaceId && previousWorkplaceId !== workplaceId && world.bosses[previousWorkplaceId] === targetId) {
            world.bosses[previousWorkplaceId] = null;
          }
          if (newRank === BOSS_RANK) {
            const formerBossId = world.bosses[workplaceId] ?? null;
            if (formerBossId && formerBossId !== targetId) {
              await setAccountEmployment(formerBossId, workplaceId, MAX_STAFF_RANK);
            }
            world.bosses[workplaceId] = targetId;
          } else if (world.bosses[workplaceId] === targetId) {
            world.bosses[workplaceId] = null;
          }
        }

        const existingEmployment = targetLife.employment;
        const employment = {
          workplaceId,
          rank: newRank,
          onDuty: false,
          lastTaskAt: existingEmployment?.workplaceId === workplaceId ? Number(existingEmployment.lastTaskAt) || 0 : 0,
        };
        if (target) {
          target.player.life = { ...target.player.life, employment };
          target.workTask = null;
          await persistSession(target);
        } else if (account) {
          account.life = { ...account.life, employment };
          await saveAccount(account);
        }
        if (admin) await saveWorld();
        const rankTitle = workplaceRankTitle(workplaceId, newRank);
        sendWorkplaceResult(session, "rank", true, (target?.player.name ?? account?.username ?? "Staff member") + " assigned to " + rankTitle + " at " + workplace.name + ".");
        if (target && target.player.id !== session.player.id) {
          sendWorkplaceResult(target, "rank", true, "Your role is now " + rankTitle + " at " + workplace.name + ".");
        }
        broadcastWorkplaceStates();
        return;
      }

      if (message.type === "setFactionAdmin") {
        if (!isSuperAdmin(session)) {
          sendWorkplaceResult(session, "adminRole", false, "Only the superior administrator can grant or revoke administrator access.");
          return;
        }
        const targetId = String(message.targetId ?? "");
        const enabled = message.enabled === true;
        if (!targetId || targetId === session.player.id) {
          sendWorkplaceResult(session, "adminRole", false, "Choose another account. Your superior-administrator role is managed by server configuration.");
          return;
        }
        const target = players.get(targetId);
        const account = target?.account ?? await findAccountById(targetId);
        const username = target?.player.name ?? account?.username ?? "";
        if (!account || !username) {
          sendWorkplaceResult(session, "adminRole", false, "That player account could not be found.");
          return;
        }
        if (isSuperAdminName(username)) {
          sendWorkplaceResult(session, "adminRole", false, "A superior-administrator account cannot be changed from this screen.");
          return;
        }
        world.factionAdminOverrides[targetId] = enabled;
        await saveWorld();
        const resultMessage = enabled
          ? username + " is now a faction administrator and can manage ranks and bosses across workplaces."
          : username + "'s administrator access has been revoked.";
        sendWorkplaceResult(session, "adminRole", true, resultMessage);
        if (target) sendWorkplaceResult(target, "adminRole", true, enabled
          ? "You have been appointed a faction administrator."
          : "Your faction-administrator access has been revoked.");
        broadcastWorkplaceStates();
        return;
      }

      if (message.type === "appointWorkplaceBoss") {
        const workplaceId = String(message.workplaceId ?? "");
        const targetId = String(message.targetId ?? "");
        const workplace = findWorkplace(workplaceId);
        if (!workplace || !isFactionAdmin(session)) {
          sendWorkplaceResult(session, "appointBoss", false, "Only a server-authorised faction admin can appoint workplace bosses.");
          return;
        }
        if (!targetId) {
          sendWorkplaceResult(session, "appointBoss", false, "Choose an account to appoint.");
          return;
        }
        const activeTarget = players.get(targetId);
        const targetAccount = activeTarget?.account ?? await findAccountById(targetId);
        const targetLife = activeTarget?.player.life ?? targetAccount?.life;
        if (!targetAccount || !targetLife) {
          sendWorkplaceResult(session, "appointBoss", false, "That account could not be found.");
          return;
        }
        if (targetLife.employment && targetLife.employment.workplaceId !== workplaceId) {
          sendWorkplaceResult(session, "appointBoss", false, "That player already belongs to another workplace.");
          return;
        }
        const oldBossId = world.bosses[workplaceId] ?? null;
        if (oldBossId && oldBossId !== targetId) await setAccountEmployment(oldBossId, workplaceId, MAX_STAFF_RANK);
        await setAccountEmployment(targetId, workplaceId, BOSS_RANK);
        world.bosses[workplaceId] = targetId;
        await saveWorld();
        sendWorkplaceResult(session, "appointBoss", true, targetAccount.username + " appointed as " + workplaceRankTitle(workplaceId, BOSS_RANK) + ".");
        broadcastWorkplaceStates();
        return;
      }

      if (message.type === "walletChange") {
        const requestId = String(message.requestId ?? "");
        const cashDelta = Math.trunc(Number(message.cashDelta ?? 0));
        const bankDelta = Math.trunc(Number(message.bankDelta ?? 0));
        const reason = String(message.reason ?? "");

        if (
          !requestId ||
          !Number.isFinite(cashDelta) ||
          !Number.isFinite(bankDelta) ||
          Math.abs(cashDelta) > 50_000_000 ||
          Math.abs(bankDelta) > 50_000_000
        ) {
          send(socket, { type: "walletResult", requestId, ok: false, message: "Invalid wallet request." });
          return;
        }

        if (cashDelta > 0) {
          const activeJob = session.player.job;

          if (
            reason !== "job" ||
            !activeJob ||
            !isValidKnownJob(activeJob) ||
            Math.hypot(session.player.x - activeJob.x, session.player.z - activeJob.z) > 7 ||
            cashDelta !== Math.trunc(activeJob.pay)
          ) {
            send(socket, {
              type: "walletResult",
              requestId,
              ok: false,
              message: "Job reward is not valid here.",
            });
            return;
          }

          session.player.job = null;
        }

        const nextCash = session.player.cash + cashDelta;
        const nextBank = session.player.bank + bankDelta;

        if (nextCash < 0 || nextBank < 0) {
          send(socket, {
            type: "walletResult",
            requestId,
            ok: false,
            message: "Insufficient funds.",
          });
          return;
        }

        session.player.cash = nextCash;
        session.player.bank = nextBank;
        await persistSession(session);

        send(socket, {
          type: "walletResult",
          requestId,
          ok: true,
          cash: nextCash,
          bank: nextBank,
        });
        return;
      }

      if (message.type === "saveProgress") {
        if (message.hp !== undefined) {
          session.player.hp = Math.max(1, Math.min(100, Number(message.hp) || 1));
        }

        if (message.hunger !== undefined) {
          session.player.hunger = Math.max(0, Math.min(100, Number(message.hunger) || 0));
        }

        // Jobs are server-authoritative (acceptJob / walletChange). A client save must never
        // set or clear them, or a stale save could restore an already-paid job.

        if (message.fuel !== undefined) {
          // Fuel can only go DOWN through a client save (driving burns it). Refuelling must
          // go through a server-checked purchase, so a client can't just report a full tank.
          const reported = normalizeFuel(message.fuel);
          for (const [key, litres] of Object.entries(reported)) {
            const ceiling = session.player.fuel[key] ?? FUEL_START;
            session.player.fuel[key] = Math.min(ceiling, litres);
          }
        }

        if (message.inventory !== undefined) {
          session.player.inventory = normalizeInventory(message.inventory);
        }

        await persistSession(session);
        return;
      }

      if (message.type === "getLife") {
        send(socket, { type: "lifeState", life: session.player.life, today: clock.dayKey() });
        return;
      }

      if (message.type === "getHousing") {
        sendHousingState(session);
        return;
      }

      if (message.type === "setHouseLock") {
        const houseId = String(message.houseId ?? "");
        const tenant = world.houseTenants[houseId] ?? null;
        const requested = message.locked;
        if (!findHouse(houseId) || tenant !== session.player.id || session.player.life.homeId !== houseId) {
          send(socket, { type: "housingResult", ok: false, action: "lock", message: "Only this house’s current owner can change its lock.", houses: housingSnapshot(session), life: session.player.life, cash: session.player.cash, today: clock.dayKey() });
          return;
        }
        if (typeof requested !== "boolean") {
          send(socket, { type: "housingResult", ok: false, action: "lock", message: "Choose whether to lock or unlock the house.", houses: housingSnapshot(session), life: session.player.life, cash: session.player.cash, today: clock.dayKey() });
          return;
        }
        world.houseLocks[houseId] = requested;
        await saveWorld();
        send(socket, { type: "housingResult", ok: true, action: "lock", message: requested ? "🔒 House locked. Visitors can no longer enter." : "🔓 House unlocked. Visitors may enter.", houses: housingSnapshot(session), life: session.player.life, cash: session.player.cash, today: clock.dayKey() });
        for (const other of players.values()) if (other.player.id !== session.player.id) sendHousingState(other);
        return;
      }

      if (message.type === "rentHouse") {
        const houseId = String(message.houseId ?? "");
        const days = Math.floor(Number(message.days));
        const house = findHouse(houseId);
        const fail = (text: string) => send(socket, {
          type: "housingResult", ok: false, action: "rent", message: text,
          houses: housingSnapshot(session), life: session.player.life, cash: session.player.cash, today: clock.dayKey(),
        });
        if (!house || !Number.isInteger(days) || days < 1 || days > MAX_PREPAID_DAYS) {
          fail("Choose a valid home and 1–7 prepaid days.");
          return;
        }
        if (session.player.life.homeId && session.player.life.homeId !== houseId) {
          fail("You already have a home. Extend its rent or wait until you are evicted before renting another.");
          return;
        }
        const tenant = world.houseTenants[houseId] ?? null;
        if (tenant && tenant !== session.player.id) {
          fail("This home is already occupied.");
          return;
        }
        const totalDays = (session.player.life.homeId === houseId ? session.player.life.rentDays : 0) + days;
        if (totalDays > MAX_PREPAID_DAYS) {
          fail("You can keep a maximum of 7 prepaid rent days. Choose fewer days.");
          return;
        }
        const daily = houseRent(houseId);
        const cost = daily * days;
        if (session.player.cash < cost) {
          fail("Not enough cash. You need ₦" + cost.toLocaleString("en-NG") + ".");
          return;
        }
        session.player.cash -= cost;
        session.player.life = {
          ...session.player.life, homeId: houseId, rentDays: totalDays, lastDay: clock.dayKey(),
        };
        world.houseTenants[houseId] = session.player.id;
        // A property starts open when a new tenancy begins; its owner can lock it later.
        if (!tenant) world.houseLocks[houseId] = false;
        await saveWorld();
        await persistSession(session);
        send(socket, {
          type: "housingResult", ok: true, action: "rent",
          message: "Home secured for " + totalDays + " prepaid day(s). Paid ₦" + cost.toLocaleString("en-NG") + ".",
          houses: housingSnapshot(session), life: session.player.life, cash: session.player.cash, today: clock.dayKey(),
        });
        for (const other of players.values()) {
          if (other.player.id !== session.player.id) sendHousingState(other);
        }
        return;
      }

      if (message.type === "enterHome" || message.type === "enterHouse") {
        const requestedId = message.type === "enterHome"
          ? String(session.player.life.homeId ?? "")
          : String(message.houseId ?? "");
        const home = findHouse(requestedId);
        if (session.inHome) {
          send(socket, { type: "homeInterior", ok: false, message: "You are already inside a house." });
          return;
        }
        if (!home) {
          send(socket, { type: "homeInterior", ok: false, message: message.type === "enterHome" ? "You do not currently rent a home." : "That property could not be found." });
          return;
        }
        const tenant = world.houseTenants[home.id] ?? null;
        // Public/visitor entry must be requested from near the physical house. Keep the owner's existing remote home shortcut.
        if (message.type === "enterHouse") {
          const dx = session.player.x - home.x, dz = session.player.z - home.z;
          if (Math.hypot(dx, dz) > 28) {
            send(socket, { type: "homeInterior", ok: false, message: "Walk to the house entrance before entering." });
            return;
          }
        }
        const isOwner = tenant === session.player.id && session.player.life.homeId === home.id;
        const vacant = tenant === null;
        const locked = !vacant && world.houseLocks[home.id] === true;
        if (message.type === "enterHome" && !isOwner) {
          send(socket, { type: "homeInterior", ok: false, message: "You do not currently rent this home." });
          return;
        }
        if (!isOwner && !vacant && locked) {
          send(socket, { type: "homeInterior", ok: false, message: "🔒 This house is locked by its owner. Visitors cannot enter." });
          return;
        }
        const cls = HOUSE_CLASSES.find((item) => item.id === home.cls)!;
        const room = homeInteriorPosition(home.id);
        const returnPosition = homeStreetPosition(home.id) ?? { x: session.player.x, z: session.player.z };
        session.homeReturn = returnPosition;
        session.currentHomeId = home.id;
        session.inHome = true;
        session.inCarpark = false;
        session.carparkVehicle = null;
        session.player.x = room.x;
        session.player.z = room.z + 1.4;
        session.input = { sequence: session.input.sequence, forward: 0, strafe: 0 };
        session.lastInputAt = Date.now();
        session.lastSyncAt = Date.now();
        await persistSession(session);
        send(socket, {
          type: "homeInterior", ok: true,
          home: { id: home.id, cls: home.cls, name: cls.name, zone: home.zone, rentDays: isOwner ? session.player.life.rentDays : 0, isOwner, vacant, locked },
          roomX: room.x, roomZ: room.z, x: room.x, z: room.z + 1.4,
          returnX: returnPosition.x, returnZ: returnPosition.z,
          furniture: HOME_FURNITURE[home.cls] ?? [],
        });
        broadcast({ type: "playerLeft", playerId: session.player.id, onlineCount: players.size });
        return;
      }

      if (message.type === "exitHome") {
        if (!session.inHome || session.inCarpark) {
          send(socket, { type: "homeExitResult", ok: false, message: session.inCarpark ? "Drive to the car-park exit and honk to reach the street." : "You are not inside a home." });
          return;
        }
        const currentHome = session.currentHomeId ? findHouse(session.currentHomeId) : undefined;
        const ownerOfCurrent = !!currentHome && world.houseTenants[currentHome.id] === session.player.id && session.player.life.homeId === currentHome.id;
        const ownedHomeReturn = ownerOfCurrent && currentHome ? homeStreetPosition(currentHome.id) : null;
        // Visitors must return to the house they visited, not to a different house they own.
        const destination = ownedHomeReturn ?? session.homeReturn ?? { x: 0, z: 24 };
        session.player.x = Math.max(-WORLD_LIMIT, Math.min(WORLD_LIMIT, destination.x));
        session.player.z = Math.max(-WORLD_LIMIT, Math.min(WORLD_LIMIT, destination.z));
        session.inHome = false;
        session.inCarpark = false;
        session.homeReturn = null;
        session.currentHomeId = null;
        session.carparkVehicle = null;
        session.input = { sequence: session.input.sequence, forward: 0, strafe: 0 };
        session.lastInputAt = Date.now();
        session.lastSyncAt = Date.now();
        await persistSession(session);
        send(socket, {
          type: "homeExitResult", ok: true,
          x: session.player.x, z: session.player.z,
          message: "You are back outside your home.",
        });
        broadcast({ type: "playerJoined", player: publicPlayer(session.player), onlineCount: players.size });
        return;
      }

      if (message.type === "enterCarpark") {
        const garageHome = session.player.life.homeId ? findHouse(session.player.life.homeId) : undefined;
        if (!session.inHome || session.inCarpark) {
          send(socket, { type: "carparkEnterResult", ok: false, message: "Enter the interior of your rented home before using its private garage." });
          return;
        }
        if (!garageHome || world.houseTenants[garageHome.id] !== session.player.id) {
          send(socket, { type: "carparkEnterResult", ok: false, message: "A rented home is required to use this private garage." });
          return;
        }
        const garageClass = HOUSE_CLASSES.find((item) => item.id === garageHome.cls)!;
        const wasHidden = true;
        session.inHome = true;
        session.inCarpark = true;
        session.carparkVehicle = null;
        session.player.x = CARPARK_PLAYER_POSITION.x;
        session.player.z = CARPARK_PLAYER_POSITION.z;
        session.input = { sequence: session.input.sequence, forward: 0, strafe: 0 };
        session.lastInputAt = Date.now();
        session.lastSyncAt = Date.now();
        session.player.life = {
          ...session.player.life,
          parkedCars: [...session.player.life.ownedCars],
        };
        await persistSession(session);
        send(socket, {
          type: "carparkEnterResult", ok: true,
          x: CARPARK_PLAYER_POSITION.x, z: CARPARK_PLAYER_POSITION.z,
          garageX: CARPARK_POSITION.x, garageZ: CARPARK_POSITION.z,
          home: { id: garageHome.id, cls: garageHome.cls, name: garageClass.name, zone: garageHome.zone, rentDays: session.player.life.rentDays },
          cars: [...session.player.life.ownedCars],
          life: session.player.life, today: clock.dayKey(),
          message: "Private car park entered. Choose a car to spawn; drive to the marked gate, stop, then honk to enter the street.",
        });
        if (!wasHidden) broadcast({ type: "playerLeft", playerId: session.player.id, onlineCount: players.size });
        return;
      }

      if (message.type === "carparkVehicleSpawn") {
        if (!session.inHome || !session.inCarpark) {
          send(socket, { type: "carparkVehicleSpawnResult", ok: false, message: "Enter your private car park first." });
          return;
        }
        const carId = String(message.carId ?? "");
        if (!session.player.life.ownedCars.includes(carId)) {
          send(socket, { type: "carparkVehicleSpawnResult", ok: false, message: "That vehicle is not owned by this account." });
          return;
        }
        session.carparkVehicle = {
          carId,
          x: CARPARK_VEHICLE_SPAWN.x,
          z: CARPARK_VEHICLE_SPAWN.z,
          yaw: 0,
          speed: 0,
          lastSyncAt: Date.now(),
          reachedGate: false,
        };
        send(socket, {
          type: "carparkVehicleSpawnResult", ok: true, carId,
          x: CARPARK_VEHICLE_SPAWN.x, z: CARPARK_VEHICLE_SPAWN.z, yaw: 0,
        });
        return;
      }

      if (message.type === "carparkDriveSync") {
        if (!session.inHome || !session.inCarpark) return;
        const track = session.carparkVehicle;
        const carId = String(message.carId ?? "");
        if (!track || track.carId !== carId || !session.player.life.ownedCars.includes(carId)) return;
        const x = Number(message.x);
        const z = Number(message.z);
        const yaw = Number(message.yaw);
        if (
          !Number.isFinite(x) || !Number.isFinite(z) || !Number.isFinite(yaw) ||
          x < CARPARK_POSITION.x - 21 || x > CARPARK_POSITION.x + 21 ||
          z < CARPARK_POSITION.z - 21 || z > CARPARK_POSITION.z + 34
        ) return;
        const now = Date.now();
        const elapsed = Math.max(0.05, Math.min(1.5, (now - track.lastSyncAt) / 1000));
        const distance = Math.hypot(x - track.x, z - track.z);
        // Reject impossible position jumps. The server derives speed from accepted
        // samples instead of trusting a client-supplied speed value.
        if (distance > 1.5 + 48 * elapsed) return;
        track.x = x;
        track.z = z;
        track.yaw = Math.atan2(Math.sin(yaw), Math.cos(yaw));
        track.speed = distance / elapsed;
        track.lastSyncAt = now;
        if (
          Math.abs(x - CARPARK_EXIT_GATE.x) <= CARPARK_EXIT_GATE.halfWidth &&
          z >= CARPARK_EXIT_GATE.minZ && z <= CARPARK_EXIT_GATE.maxZ
        ) track.reachedGate = true;
        return;
      }

      if (message.type === "exitCarpark") {
        if (!session.inHome || !session.inCarpark) {
          send(socket, { type: "carparkExitResult", ok: false, message: "Enter your private car park first." });
          return;
        }
        const carId = String(message.carId ?? "");
        const gateCheck = validateCarparkExit(
          session.carparkVehicle,
          carId,
          message.hornHeld,
          Date.now(),
          session.player.life.ownedCars,
        );
        if (!gateCheck.ok) {
          send(socket, { type: "carparkExitResult", ok: false, message: gateCheck.reason });
          return;
        }
        const exitYaw = session.carparkVehicle?.yaw ?? 0;
        const rentedHome = session.player.life.homeId && world.houseTenants[session.player.life.homeId] === session.player.id
          ? homeStreetPosition(session.player.life.homeId)
          : null;
        // Preserve the exact exterior/room return route that was saved when the
        // player entered the garage. Only fall back to their rented home's approach
        // if the return point is missing (e.g. a legacy session).
        const destination = session.homeReturn ?? rentedHome ?? { x: 0, z: 24 };
        session.player.x = Math.max(-WORLD_LIMIT, Math.min(WORLD_LIMIT, destination.x));
        session.player.z = Math.max(-WORLD_LIMIT, Math.min(WORLD_LIMIT, destination.z));
        session.player.yaw = exitYaw;
        session.player.life = {
          ...session.player.life,
          parkedCars: session.player.life.ownedCars.filter((id) => id !== carId),
        };
        session.inHome = false;
        session.inCarpark = false;
        session.homeReturn = null;
        session.currentHomeId = null;
        session.carparkVehicle = null;
        session.input = { sequence: session.input.sequence, forward: 0, strafe: 0 };
        session.lastInputAt = Date.now();
        session.lastSyncAt = Date.now();
        await persistSession(session);
        send(socket, {
          type: "carparkExitResult", ok: true, carId,
          x: session.player.x, z: session.player.z, yaw: exitYaw,
          life: session.player.life, today: clock.dayKey(),
          message: "Horn heard. You are on the street—drive safely.",
        });
        broadcast({ type: "playerJoined", player: publicPlayer(session.player), onlineCount: players.size });
        return;
      }

      if (message.type === "carparkFootExit") {
        if (!session.inHome || !session.inCarpark) {
          send(socket, { type: "carparkFootExitResult", ok: false, message: "Walk to the private garage door first." });
          return;
        }
        const home = session.player.life.homeId ? findHouse(session.player.life.homeId) : undefined;
        if (!home || world.houseTenants[home.id] !== session.player.id) {
          send(socket, { type: "carparkFootExitResult", ok: false, message: "You no longer rent the home connected to this garage." });
          return;
        }
        const cls = HOUSE_CLASSES.find((item) => item.id === home.cls)!;
        const route = String(message.route ?? "street") === "home" ? "home" : "street";
        session.carparkVehicle = null;
        session.input = { sequence: session.input.sequence, forward: 0, strafe: 0 };
        session.lastInputAt = Date.now();
        session.lastSyncAt = Date.now();
        if (route === "home") {
          const room = homeInteriorPosition(home.id);
          const returnPosition = homeStreetPosition(home.id) ?? session.homeReturn ?? { x: 0, z: 24 };
          session.inCarpark = false;
          session.inHome = true;
          session.homeReturn = returnPosition;
          session.player.x = room.x;
          session.player.z = room.z + 1.4;
          session.player.yaw = 0;
          await persistSession(session);
          send(socket, {
            type: "carparkFootExitResult", ok: true, route: "home",
            home: { id: home.id, cls: home.cls, name: cls.name, zone: home.zone, rentDays: session.player.life.rentDays },
            roomX: room.x, roomZ: room.z, x: room.x, z: room.z + 1.4,
            returnX: returnPosition.x, returnZ: returnPosition.z,
            furniture: HOME_FURNITURE[home.cls] ?? [],
            life: session.player.life, today: clock.dayKey(),
            message: "You returned through the garage door to your " + (home.cls === "hut" ? "hut" : home.cls === "faceme" ? "room" : home.cls === "flat" ? "apartment" : "house") + ".",
          });
          return;
        }
        const destination = homeStreetPosition(home.id) ?? session.homeReturn ?? { x: 0, z: 24 };
        session.player.x = Math.max(-WORLD_LIMIT, Math.min(WORLD_LIMIT, destination.x));
        session.player.z = Math.max(-WORLD_LIMIT, Math.min(WORLD_LIMIT, destination.z));
        session.inHome = false;
        session.inCarpark = false;
        session.homeReturn = null;
        session.currentHomeId = null;
        session.player.yaw = 0;
        await persistSession(session);
        send(socket, {
          type: "carparkFootExitResult", ok: true, route: "street",
          x: session.player.x, z: session.player.z,
          life: session.player.life, today: clock.dayKey(),
          message: "You walked out of your private garage onto the street.",
        });
        broadcast({ type: "playerJoined", player: publicPlayer(session.player), onlineCount: players.size });
        return;
      }

      if (message.type === "parkCars" || message.type === "retrieveCars") {
        const parked = message.type === "parkCars";
        session.player.life = {
          ...session.player.life, parkedCars: parked ? [...session.player.life.ownedCars] : [],
        };
        await persistSession(session);
        send(socket, {
          type: "parkingResult", ok: true, parked,
          message: parked ? "Your cars are stored safely in the parking lot." : "Your stored cars are ready.",
          life: session.player.life, today: clock.dayKey(),
        });
        return;
      }

      if (message.type === "respawn") {
        const wasHidden = session.inHome;
        const home = session.player.life.homeId ? findHouse(session.player.life.homeId) : undefined;
        const atHome = Boolean(home && world.houseTenants[home.id] === session.player.id);
        const cls = atHome && home ? HOUSE_CLASSES.find((item) => item.id === home.cls)! : undefined;
        const room = atHome && home ? homeInteriorPosition(home.id) : null;
        const returnPosition = atHome && home ? homeStreetPosition(home.id) : null;
        const x = room ? room.x : 0;
        const z = room ? room.z + 1.4 : 0;
        session.inHome = atHome;
        session.inCarpark = false;
        session.homeReturn = atHome ? (returnPosition ?? { x: home!.x, z: home!.z + 12 }) : null;
        session.carparkVehicle = null;
        session.player.x = x;
        session.player.z = z;
        session.player.yaw = 0;
        session.player.hp = 100;
        session.player.hunger = Math.max(session.player.hunger, 70);
        session.input = { sequence: session.input.sequence, forward: 0, strafe: 0 };
        session.lastInputAt = Date.now();
        session.lastSyncAt = Date.now();
        await persistSession(session);
        send(socket, { type: "posCorrect", x, z });
        send(socket, {
          type: "respawnResult", ok: true, atHome,
          ...(atHome && home && cls && room ? {
            home: { id: home.id, cls: home.cls, name: cls.name, zone: home.zone, rentDays: session.player.life.rentDays },
            roomX: room.x, roomZ: room.z,
            returnX: returnPosition?.x ?? home.x, returnZ: returnPosition?.z ?? home.z + 12,
            furniture: HOME_FURNITURE[home.cls] ?? [],
          } : {}),
          message: atHome ? "You respawned inside your home." : "You have no home, so you respawned at the public parking lot.",
          x, z, life: session.player.life, today: clock.dayKey(),
        });
        if (atHome && !wasHidden) {
          broadcast({ type: "playerLeft", playerId: session.player.id, onlineCount: players.size });
        } else if (!atHome && wasHidden) {
          broadcast({ type: "playerJoined", player: publicPlayer(session.player), onlineCount: players.size });
        }
        return;
      }

      // Test-only tools, refused unless the server was started with NRS_DEBUG_CLOCK=1.
      if (message.type === "debugSkipDays" || message.type === "debugGiveHome") {
        if (!DEBUG_CLOCK) {
          send(socket, { type: "error", code: "DEBUG_DISABLED" });
          return;
        }

        if (message.type === "debugSkipDays") {
          const days = Math.floor(Number(message.days));
          if (!Number.isFinite(days) || days < 1 || days > 60) {
            send(socket, { type: "error", code: "INVALID_DAYS" });
            return;
          }
          clock.skipDays(days);
          await runMidnight();
        } else {
          const houseId = String(message.houseId ?? "");
          const rentDays = Math.max(0, Math.min(7, Math.floor(Number(message.rentDays) || 0)));
          if (!HOUSES.some((house) => house.id === houseId)) {
            send(socket, { type: "error", code: "UNKNOWN_HOUSE" });
            return;
          }
          session.player.life = { ...session.player.life, homeId: houseId, rentDays };
          world.houseTenants[houseId] = session.player.id;
          await saveWorld();
          await persistSession(session);
        }

        send(socket, { type: "lifeState", life: session.player.life, today: clock.dayKey() });
        return;
      }

      if (message.type === "interact") {
        send(socket, {
          type: "interactionResult",
          accepted: true,
          targetId: String(message.targetId ?? ""),
        });
      }
    })().catch((error) => {
      console.error("message-handler", error);
      send(socket, { type: "error", code: "SERVER_ERROR" });
    });
  });

  const cleanup = () => {
    clearTimeout(authTimer);

    if (!accountId) return;

    const session = players.get(accountId);
    if (!session || session.socket !== socket) return;

    void persistSession(session).catch((error) => console.error("save-on-close", error));

    players.delete(accountId);

    if (activeAccounts.get(accountId) === socket) {
      activeAccounts.delete(accountId);
    }

    broadcast({
      type: "playerLeft",
      playerId: accountId,
      onlineCount: players.size,
    });
  };

  socket.on("close", cleanup);
  socket.on("error", cleanup);
});

setInterval(() => {
  const dt = 1 / TICK_RATE;
  const now = Date.now();

  for (const session of players.values()) {
    if (session.inHome) continue;
    const input = now - session.lastInputAt > INPUT_TIMEOUT_MS
      ? { forward: 0, strafe: 0 }
      : session.input;

    const length = Math.hypot(input.forward, input.strafe);

    if (length > 0.01) {
      const f = input.forward / Math.max(1, length);
      const s = input.strafe / Math.max(1, length);

      const velocityX = s * MOVE_SPEED;
      const velocityZ = -f * MOVE_SPEED;

      session.player.x = Math.max(
        -WORLD_LIMIT,
        Math.min(WORLD_LIMIT, session.player.x + velocityX * dt),
      );

      session.player.z = Math.max(
        -WORLD_LIMIT,
        Math.min(WORLD_LIMIT, session.player.z + velocityZ * dt),
      );

      const targetYaw = Math.atan2(velocityX, velocityZ);
      let delta = targetYaw - session.player.yaw;

      while (delta > Math.PI) delta -= Math.PI * 2;
      while (delta < -Math.PI) delta += Math.PI * 2;

      session.player.yaw += delta * Math.min(1, 12 * dt);
    }
  }
}, 1000 / TICK_RATE);

setInterval(() => {
  broadcast({
    type: "snapshot",
    serverTime: Date.now(),
    players: snapshot(),
    onlineCount: players.size,
  });
}, 1000 / SNAPSHOT_RATE);

setInterval(() => {
  for (const session of players.values()) {
    void persistSession(session).catch((error) => console.error("periodic-save", error));
  }
}, 5000);

// Checks twice a minute whether Nigeria time has crossed midnight.
setInterval(() => {
  void runMidnight().catch((error) => console.error("midnight", error));
}, 30000);

async function main() {
  await initStore();
  httpServer.listen(PORT, () => {
    console.log("NRS web + multiplayer server listening on :" + PORT);
  });
}

void main().catch((error) => {
  console.error("NRS startup failed", error);
  process.exit(1);
});
