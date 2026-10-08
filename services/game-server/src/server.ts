import { WebSocketServer, WebSocket } from "ws";
import { randomUUID } from "node:crypto";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

type Input = {
  sequence: number;
  forward: number;
  strafe: number;
};

type PlayerState = {
  id: string;
  name: string;
  x: number;
  z: number;
  yaw: number;
  connectedAt: number;
  lastInputSequence: number;
};

type Session = {
  socket: WebSocket;
  state: PlayerState;
  latestInput: Input;
  lastMessageAt: number;
  velocityX: number;
  velocityZ: number;
};

type ClientMessage =
  | { type: "hello"; name?: string }
  | { type: "input"; input: Input }
  | { type: "interact"; targetId?: string };

const PORT = Number(process.env.PORT ?? 8080);
const TICK_RATE = 20;
const SNAPSHOT_RATE = 10;
const MOVE_SPEED = 4.2;
const WORLD_LIMIT = 500;
const MAX_NAME_LENGTH = 20;
const INPUT_TIMEOUT_MS = 750;

const players = new Map<string, Session>();

function send(socket: WebSocket, message: unknown) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

function snapshot() {
  return [...players.values()].map(({ state }) => ({
    id: state.id,
    name: state.name,
    x: Number(state.x.toFixed(3)),
    z: Number(state.z.toFixed(3)),
    yaw: Number(state.yaw.toFixed(3)),
  }));
}

function broadcast(message: unknown) {
  for (const { socket } of players.values()) send(socket, message);
}

function cleanName(name: string | undefined) {
  const value = name?.trim().replace(/[^a-zA-Z0-9 _-]/g, "");
  return value ? value.slice(0, MAX_NAME_LENGTH) : "Player";
}

function validInput(input: Input) {
  return Number.isInteger(input.sequence) &&
    input.sequence >= 0 &&
    Number.isFinite(input.forward) &&
    Number.isFinite(input.strafe) &&
    Math.abs(input.forward) <= 2 &&
    Math.abs(input.strafe) <= 2;
}

const WEB_DIST_DIR = [
  path.resolve(__dirname, "../../web-client/dist"),
  path.resolve(process.cwd(), "services/web-client/dist"),
  path.resolve(process.cwd(), "../web-client/dist"),
].find((candidate) => fs.existsSync(candidate)) ??
  path.resolve(__dirname, "../../web-client/dist");

const MIME_TYPES: Record<string, string> = {
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
  ".wasm": "application/wasm",
};

function sendJson(response: http.ServerResponse, status: number, payload: unknown) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function serveWebClient(request: http.IncomingMessage, response: http.ServerResponse) {
  const requestUrl = new URL(
    request.url ?? "/",
    "http://" + (request.headers.host ?? "localhost"),
  );

  if (requestUrl.pathname === "/health") {
    sendJson(response, 200, {
      ok: true,
      service: "nigeria-rp-game-server",
      players: players.size,
      tickRate: TICK_RATE,
      snapshotRate: SNAPSHOT_RATE,
    });
    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { allow: "GET, HEAD" });
    response.end();
    return;
  }

  let pathname: string;

  try {
    pathname = decodeURIComponent(requestUrl.pathname);
  } catch {
    response.writeHead(400);
    response.end("Bad request");
    return;
  }

  const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const filePath = path.resolve(WEB_DIST_DIR, relativePath);

  if (
    filePath !== WEB_DIST_DIR &&
    !filePath.startsWith(WEB_DIST_DIR + path.sep)
  ) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  let finalPath = filePath;

  if (!fs.existsSync(finalPath) || !fs.statSync(finalPath).isFile()) {
    // Allow browser-side routes to fall back to the built entrypoint.
    if (!path.extname(relativePath)) {
      finalPath = path.join(WEB_DIST_DIR, "index.html");
    } else {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
  }

  try {
    const stat = fs.statSync(finalPath);
    response.writeHead(200, {
      "content-type": MIME_TYPES[path.extname(finalPath).toLowerCase()] ??
        "application/octet-stream",
      "content-length": stat.size,
      "cache-control": path.basename(finalPath) === "index.html"
        ? "no-cache"
        : "public, max-age=31536000, immutable",
    });

    if (request.method === "HEAD") {
      response.end();
      return;
    }

    if (path.basename(finalPath) === "index.html") {
      try {
        const html = fs.readFileSync(finalPath, "utf8");
        const injected = html.includes("/multiplayer.js")
          ? html
          : html.replace("</body>", '<script src="/multiplayer.js"></script></body>');
        const body = Buffer.from(injected, "utf8");
        response.setHeader("content-length", body.length);
        response.end(body);
      } catch {
        sendJson(response, 500, { ok: false, error: "INDEX_INJECTION_ERROR" });
      }
      return;
    }

    fs.createReadStream(finalPath).pipe(response);
  } catch {
    sendJson(response, 500, { ok: false, error: "STATIC_FILE_ERROR" });
  }
}

const httpServer = http.createServer((request, response) => {
  serveWebClient(request, response);
});

const wss = new WebSocketServer({
  server: httpServer,
  maxPayload: 16 * 1024,
});

wss.on("connection", (socket) => {
  const id = randomUUID();
  const spawnIndex = players.size % 8;
  const spawns = [
    { x: 0, z: 6 },
    { x: 3, z: 6 },
    { x: -3, z: 6 },
    { x: 0, z: 10 },
    { x: 3, z: 10 },
    { x: -3, z: 10 },
    { x: 6, z: 10 },
    { x: -6, z: 10 },
  ];
  const spawn = spawns[spawnIndex];
  const state: PlayerState = {
    id,
    name: "Player",
    x: spawn.x,
    z: spawn.z,
    yaw: 0,
    connectedAt: Date.now(),
    lastInputSequence: -1,
  };

  const session: Session = {
    socket,
    state,
    latestInput: { sequence: -1, forward: 0, strafe: 0 },
    lastMessageAt: Date.now(),
    velocityX: 0,
    velocityZ: 0,
  };

  players.set(id, session);

  send(socket, {
    type: "connected",
    protocolVersion: 2,
    playerId: id,
    serverTickRate: TICK_RATE,
    players: snapshot(),
  });

  broadcast({ type: "playerJoined", player: state });

  socket.on("message", (raw) => {
    const player = players.get(id);
    if (!player) return;

    player.lastMessageAt = Date.now();

    let message: ClientMessage;
    try {
      message = JSON.parse(raw.toString()) as ClientMessage;
    } catch {
      send(socket, { type: "error", code: "INVALID_JSON" });
      return;
    }

    if (message.type === "hello") {
      player.state.name = cleanName(message.name);
      send(socket, { type: "identity", player: player.state });
      broadcast({ type: "playerUpdated", player: player.state });
      return;
    }

    if (message.type === "input") {
      if (!validInput(message.input)) {
        send(socket, { type: "error", code: "INVALID_INPUT" });
        return;
      }

      if (message.input.sequence <= player.state.lastInputSequence) return;

      player.state.lastInputSequence = message.input.sequence;
      player.latestInput = {
        sequence: message.input.sequence,
        forward: Math.max(-1, Math.min(1, message.input.forward)),
        strafe: Math.max(-1, Math.min(1, message.input.strafe)),
      };
      return;
    }

    if (message.type === "interact") {
      send(socket, {
        type: "interactionResult",
        accepted: true,
        targetId: message.targetId?.trim() || null,
        message: "Interaction request received by authoritative server.",
      });
    }
  });

  socket.on("close", () => {
    if (players.get(id)?.socket === socket) {
      players.delete(id);
      broadcast({ type: "playerLeft", playerId: id });
    }
  });

  socket.on("error", () => {
    if (players.get(id)?.socket === socket) {
      players.delete(id);
      broadcast({ type: "playerLeft", playerId: id });
    }
  });
});

// Fresh movement model:
// - joystick input describes a desired direction
// - the server accelerates/decelerates instead of teleporting between snapshots
// - the character turns toward the direction of travel
// - reversing is a controlled turn, not a sign flip that causes jitter
setInterval(() => {
  const dt = 1 / TICK_RATE;
  const now = Date.now();

  for (const session of players.values()) {
    const input = now - session.lastMessageAt > INPUT_TIMEOUT_MS
      ? { forward: 0, strafe: 0 }
      : session.latestInput;

    const inputLength = Math.hypot(input.forward, input.strafe);
    const hasInput = inputLength > 0.01;

    let desiredX = 0;
    let desiredZ = 0;

    if (hasInput) {
      const f = input.forward / Math.max(1, inputLength);
      const s = input.strafe / Math.max(1, inputLength);

      // World convention: forward = -Z, right = +X.
      desiredX = s * MOVE_SPEED;
      desiredZ = -f * MOVE_SPEED;

      const targetYaw = Math.atan2(desiredX, desiredZ);
      let delta = targetYaw - session.state.yaw;
      while (delta > Math.PI) delta -= Math.PI * 2;
      while (delta < -Math.PI) delta += Math.PI * 2;

      const turnRate = 12;
      session.state.yaw += delta * Math.min(1, turnRate * dt);

      while (session.state.yaw > Math.PI) session.state.yaw -= Math.PI * 2;
      while (session.state.yaw < -Math.PI) session.state.yaw += Math.PI * 2;
    }

    const acceleration = hasInput ? 28 : 34;
    const blend = Math.min(1, acceleration * dt);

    session.velocityX += (desiredX - session.velocityX) * blend;
    session.velocityZ += (desiredZ - session.velocityZ) * blend;

    if (!hasInput) {
      const damping = Math.pow(0.0005, dt);
      session.velocityX *= damping;
      session.velocityZ *= damping;
    }

    session.state.x = Math.max(
      -WORLD_LIMIT,
      Math.min(WORLD_LIMIT, session.state.x + session.velocityX * dt),
    );
    session.state.z = Math.max(
      -WORLD_LIMIT,
      Math.min(WORLD_LIMIT, session.state.z + session.velocityZ * dt),
    );

    if (Math.hypot(session.velocityX, session.velocityZ) < 0.01) {
      session.velocityX = 0;
      session.velocityZ = 0;
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

httpServer.listen(PORT, () => {
  console.log(`NRS web + game server listening on :${PORT}`);
});
