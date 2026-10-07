import { WebSocketServer, WebSocket } from "ws";
import { randomUUID } from "node:crypto";
import http from "node:http";

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

const httpServer = http.createServer((_request, response) => {
  response.writeHead(200, { "content-type": "application/json" });
  response.end(JSON.stringify({
    ok: true,
    service: "nigeria-rp-game-server",
    players: players.size,
    tickRate: TICK_RATE,
    snapshotRate: SNAPSHOT_RATE,
  }));
});

const wss = new WebSocketServer({
  server: httpServer,
  maxPayload: 16 * 1024,
});

wss.on("connection", (socket) => {
  const id = randomUUID();
  const state: PlayerState = {
    id,
    name: "Player",
    x: 0,
    z: 0,
    yaw: 0,
    connectedAt: Date.now(),
    lastInputSequence: -1,
  };

  const session: Session = {
    socket,
    state,
    latestInput: { sequence: -1, forward: 0, strafe: 0 },
    lastMessageAt: Date.now(),
  };

  players.set(id, session);

  send(socket, {
    type: "connected",
    protocolVersion: 1,
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

      // Reject old or replayed input sequences.
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
      const targetId = message.targetId?.trim() || null;

      // Laboratory interaction is intentionally simple, but the server
      // remains the authority over whether the request is accepted.
      send(socket, {
        type: "interactionResult",
        accepted: true,
        targetId,
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

// Fixed authoritative simulation tick.
setInterval(() => {
  const dt = 1 / TICK_RATE;
  const now = Date.now();

  for (const session of players.values()) {
    const input = now - session.lastMessageAt > INPUT_TIMEOUT_MS
      ? { forward: 0, strafe: 0 }
      : session.latestInput;

    const length = Math.hypot(input.forward, input.strafe);

    if (length > 0) {
      const nx = input.forward / Math.max(1, length);
      const nz = input.strafe / Math.max(1, length);

      session.state.x = Math.max(
        -WORLD_LIMIT,
        Math.min(WORLD_LIMIT, session.state.x + nx * MOVE_SPEED * dt),
      );

      session.state.z = Math.max(
        -WORLD_LIMIT,
        Math.min(WORLD_LIMIT, session.state.z + nz * MOVE_SPEED * dt),
      );
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
  console.log(`NRS game server listening on :${PORT}`);
});
