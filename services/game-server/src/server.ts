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
  newLife,
  newWorld,
  normalizeLife,
  normalizeWorld,
  settleLife,
  validateWalletDeltas,
  type Life,
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
  return [...players.values()].map((session) => publicPlayer(session.player));
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

// Settle one online player's life up to today's Nigeria-time day (rent days used, home lost).
// Returns null when no midnight has passed since the last settle. A lost home is freed in
// shared state before the player record is saved, including when this runs during login.
async function settleSession(session: Session) {
  const result = settleLife(session.player.life, clock.dayKey());
  if (result.midnights === 0) return null;
  if (result.homeLost && world.houseTenants[result.homeLost] === session.player.id) {
    world.houseTenants[result.homeLost] = null;
    try {
      await saveWorld();
    } catch (error) {
      world.houseTenants[result.homeLost] = session.player.id;
      throw error;
    }
  }
  session.player.life = result.life;
  return result;
}

async function runMidnight() {
  const today = clock.dayKey();
  for (const session of players.values()) {
    const previousLife = session.player.life;
    const result = await settleSession(session);
    if (!result) continue;
    try {
      await persistSession(session);
    } catch (error) {
      // Keep a failed account save retryable on the next midnight check.
      session.player.life = previousLife;
      throw error;
    }
    send(session.socket, {
      type: "lifeUpdate",
      life: session.player.life,
      today,
      rentUsed: result.rentUsed,
      homeLost: result.homeLost,
    });
  }

  if (today !== world.lastDay) {
    const previousDay = world.lastDay;
    world.lastDay = today;
    try {
      await saveWorld();
    } catch (error) {
      world.lastDay = previousDay;
      throw error;
    }
  }
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
    const parsed: unknown = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    const root = parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {};
    const rawAccounts = root.accounts && typeof root.accounts === "object" && !Array.isArray(root.accounts)
      ? root.accounts as Record<string, unknown>
      : {};
    const rawSessions = root.sessions && typeof root.sessions === "object" && !Array.isArray(root.sessions)
      ? root.sessions as Record<string, unknown>
      : {};
    const accounts: Record<string, Account> = {};
    for (const [key, value] of Object.entries(rawAccounts)) {
      if (!value || typeof value !== "object" || Array.isArray(value)) continue;
      const candidate = value as Record<string, unknown>;
      // Ignore unusable/corrupt entries without discarding other accounts in the save.
      if (
        typeof candidate.id === "string" &&
        typeof candidate.username === "string" &&
        typeof candidate.passwordSalt === "string" &&
        typeof candidate.passwordHash === "string"
      ) accounts[key] = candidate as unknown as Account;
    }
    const sessions: FileStore["sessions"] = {};
    for (const [key, value] of Object.entries(rawSessions)) {
      if (!value || typeof value !== "object" || Array.isArray(value)) continue;
      const candidate = value as Record<string, unknown>;
      if (typeof candidate.accountId === "string" && Number.isFinite(Number(candidate.expiresAt))) {
        sessions[key] = { accountId: candidate.accountId, expiresAt: Number(candidate.expiresAt) };
      }
    }
    fileStore = { accounts, sessions, world: root.world as WorldState | undefined };
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
      "id,username,username_lower,email,email_lower,password_salt,password_hash,cash,bank,x,z,yaw,hp,hunger,level,xp,job,inventory,created_at,updated_at,fuel,life" +
      ") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17::jsonb,$18::jsonb,$19,$20,$21::jsonb,$22::jsonb)",
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
        JSON.stringify(account.fuel),
        JSON.stringify(account.life),
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
  account.x = session.player.x;
  account.z = session.player.z;
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
  const url = new URL(request.url ?? "/", "htt