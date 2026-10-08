import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createHash, randomBytes, randomUUID, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { WebSocketServer, WebSocket } from "ws";
import { Pool } from "pg";

const scrypt = promisify(scryptCb);

type JobState = { n: string; x: number; z: number; pay: number } | null;
type Inventory = Record<string, number>;

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
  lastSequence: number;
};

type Session = {
  socket: WebSocket;
  account: Account;
  player: PlayerState;
  input: { sequence: number; forward: number; strafe: number };
  lastMessageAt: number;
  lastInputAt: number;
};

type FileStore = {
  accounts: Record<string, Account>;
  sessions: Record<string, { accountId: string; expiresAt: number }>;
};

const PORT = Number(process.env.PORT ?? 8080);
const TICK_RATE = 20;
const SNAPSHOT_RATE = 10;
const MOVE_SPEED = 4.2;
const WORLD_LIMIT = 500;
const SESSION_DAYS = 30;
const INPUT_TIMEOUT_MS = 400;
const PROTOCOL_VERSION = 1;
const DATA_FILE = process.env.NRS_DATA_FILE ?? path.join(process.env.NRS_DATA_DIR ?? "/data", "accounts.json");
const DATABASE_URL = process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? "";

const players = new Map<string, Session>();
const activeAccounts = new Map<string, WebSocket>();

let pool: Pool | null = null;
let fileStore: FileStore = { accounts: {}, sessions: {} };

const JOBS: Array<Exclude<JobState, null>> = [
  { n: "Parcel to Mile 1 Market", x: -6.5, z: 95, pay: 6000 },
  { n: "Parcel to Rumuola", x: 110, z: 70, pay: 9000 },
  { n: "Parcel to the Waterfront", x: 90, z: 150, pay: 12000 },
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
  return String(value ?? "")
    .trim()
    .replace(/[^A-Za-z0-9 _-]/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 20);
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

function normalizeJob(value: unknown): JobState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  const n = typeof v.n === "string" ? v.n.slice(0, 100) : "";
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
      "job=$12::jsonb,inventory=$13::jsonb,updated_at=$14 WHERE id=$1",
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
    createdAt: now,
    updatedAt: now,
  };

  try {
    await insertAccount(account);
  } catch (error: any) {
    if (error?.code === "23505") throw new Error("USERNAME_TAKEN");
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
      "cache-control": path.basename(finalPath) === "index.html"
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
    };

    players.set(account.id, session);
    activeAccounts.set(account.id, socket);

    send(socket, {
      type: "authOk",
      protocolVersion: PROTOCOL_VERSION,
      token,
      player: accountPayload(session.player),
      players: snapshot(),
    });

    broadcast({
      type: "playerJoined",
      player: publicPlayer(session.player),
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
            PASSWORD_TOO_SHORT: "Password must be at least 6 characters.",
            USERNAME_TOO_SHORT: "Username must be at least 3 characters.",
            USERNAME_INVALID: "Use letters, numbers, spaces, _ or - only.",
            USERNAME_TAKEN: "That username is already taken.",
            INVALID_CREDENTIALS: "Wrong username or password.",
            INVALID_SESSION: "Session expired. Please log in again.",
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

        if (message.job !== undefined) {
          const requestedJob = normalizeJob(message.job);
          if (isValidKnownJob(requestedJob)) session.player.job = requestedJob;
        }

        if (message.inventory !== undefined) {
          session.player.inventory = normalizeInventory(message.inventory);
        }

        await persistSession(session);
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
    });
  };

  socket.on("close", cleanup);
  socket.on("error", cleanup);
});

setInterval(() => {
  const dt = 1 / TICK_RATE;
  const now = Date.now();

  for (const session of players.values()) {
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
  });
}, 1000 / SNAPSHOT_RATE);

setInterval(() => {
  for (const session of players.values()) {
    void persistSession(session).catch((error) => console.error("periodic-save", error));
  }
}, 5000);

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
