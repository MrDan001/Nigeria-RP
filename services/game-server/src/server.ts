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

type ClientMessage =
  | { type: "hello"; name?: string }
  | { type: "input"; input: Input }
  | { type: "interact"; targetId?: string };

const PORT = Number(process.env.PORT ?? 8080);
const TICK_RATE = 20;
const SNAPSHOT_RATE = 10;
const MOVE_SPEED = 4.2;

const players = new Map<string, { socket: WebSocket; state: PlayerState }>();

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

const httpServer = http.createServer((_request, response) => {
  response.writeHead(200, { "content-type": "application/json" });
  response.end(JSON.stringify({
    ok: true,
    service: "nigeria-rp-game-server",
    players: players.size,
  }));
});

const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", (socket) => {
  const id = randomUUID();
  const state: PlayerState = {
    id,
    name: "Player",
    x: 0,
    z: 0,
    yaw: 0,
    connectedAt: Date.now(),
    lastInputSequence: 0,
  };

  players.set(id, { socket, state });

  send(socket, {
    type: "connected",
    protocolVersion: 1,
    playerId: id,
    serverTickRate: TICK_RATE,
    players: snapshot(),
  });

  broadcast({ type: "playerJoined", player: state });

  socket.on("message", (raw) => {
    let message: ClientMessage;

    try {
      message = JSON.parse(raw.toString()) as ClientMessage;
    } catch {
      send(socket, { type: "error", code: "INVALID_JSON" });
      return;
    }

    const player = players.get(id);
    if (!player) return;

    if (message.type === "hello") {
      const cleanName = message.name?.trim().slice(0, 20);
      if (cleanName) player.state.name = cleanName;

      send(socket, { type: "identity", player: player.state });
      broadcast({ type: "playerUpdated", player: player.state });
      return;
    }

    if (message.type === "input") {
      const input = message.input;

      if (!Number.isInteger(input.sequence) ||
          !Number.isFinite(input.forward) ||
          !Number.isFinite(input.strafe)) {
        send(socket, { type: "error", code: "INVALID_INPUT" });
        return;
      }

      player.state.lastInputSequence = Math.max(
        player.state.lastInputSequence,
        input.sequence,
      );

      const forward = Math.max(-1, Math.min(1, input.forward));
      const strafe = Math.max(-1, Math.min(1, input.strafe));

      // The server owns movement. The client only sends intent.
      const length = Math.hypot(forward, strafe);
      if (length > 0) {
        const nx = forward / Math.max(1, length);
        const nz = strafe / Math.max(1, length);
        const dt = 1 / TICK_RATE;

        player.state.x += nx * MOVE_SPEED * dt;
        player.state.z += nz * MOVE_SPEED * dt;
      }

      return;
    }

    if (message.type === "interact") {
      send(socket, {
        type: "interactionResult",
        accepted: true,
        targetId: message.targetId ?? null,
        message: "Interaction request received by authoritative server.",
      });
    }
  });

  socket.on("close", () => {
    players.delete(id);
    broadcast({ type: "playerLeft", playerId: id });
  });

  socket.on("error", () => {
    players.delete(id);
  });
});

setInterval(() => {
  broadcast({
    type: "snapshot",
    serverTime: Date.now(),
    players: snapshot(),
  });
}, 1000 / SNAPSHOT_RATE);

setInterval(() => {
  // Keep simulation ticks independent from snapshot frequency.
  // Inputs are currently applied on receipt for this laboratory.
  // Production movement will use a deterministic fixed-tick simulation.
}, 1000 / TICK_RATE);

httpServer.listen(PORT, () => {
  console.log(`NRS game server listening on :${PORT}`);
});
