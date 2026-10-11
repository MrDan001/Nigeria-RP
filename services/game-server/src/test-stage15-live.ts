import assert from "node:assert/strict";
import { spawn, type ChildProcessByStdio } from "node:child_process";
import type { Readable } from "node:stream";
import { mkdtempSync, rmSync } from "node:fs";
import net, { type AddressInfo } from "node:net";
import os from "node:os";
import path from "node:path";
import WebSocket from "ws";

type ServerMessage = Record<string, any>;

const tempDir = mkdtempSync(path.join(os.tmpdir(), "nrs-stage15-live-"));
const dataFile = path.join(tempDir, "accounts.json");
let child: ChildProcessByStdio<null, Readable, Readable> | null = null;
let output = "";

function reservePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const port = (probe.address() as AddressInfo).port;
      probe.close((error) => error ? reject(error) : resolve(port));
    });
  });
}

async function waitUntil(predicate: () => boolean, label: string, timeoutMs = 15_000): Promise<void> {
  const started = Date.now();
  while (!predicate()) {
    if (child?.exitCode !== null && child?.exitCode !== undefined) {
      throw new Error("Game server stopped before " + label + ". Output:\n" + output);
    }
    if (Date.now() - started > timeoutMs) {
      throw new Error("Timed out waiting for " + label + ". Output:\n" + output);
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

async function startServer(): Promise<{ port: number }> {
  const port = await reservePort();
  output = "";
  const activeChild = spawn(process.execPath, ["--import", "tsx", "src/server.ts"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      NRS_DATA_FILE: dataFile,
      NRS_DATA_DIR: tempDir,
      NRS_DEBUG_CLOCK: "0",
      DATABASE_URL: "",
      POSTGRES_URL: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child = activeChild;
  activeChild.stdout.on("data", (data: Buffer) => { output += data.toString("utf8"); });
  activeChild.stderr.on("data", (data: Buffer) => { output += data.toString("utf8"); });
  await waitUntil(() => output.includes("NRS web + multiplayer server listening on"), "server startup");
  return { port };
}

async function stopServer(): Promise<void> {
  if (!child) return;
  const activeChild = child;
  if (activeChild.exitCode === null && !activeChild.killed) activeChild.kill("SIGTERM");
  await Promise.race([
    new Promise<void>((resolve) => activeChild.once("close", () => resolve())),
    new Promise<void>((resolve) => setTimeout(resolve, 5_000)),
  ]);
  if (activeChild.exitCode === null) activeChild.kill("SIGKILL");
  child = null;
}

function openSocket(port: number): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket("ws://127.0.0.1:" + port);
    socket.on("error", () => {});
    const timer = setTimeout(() => {
      socket.terminate();
      reject(new Error("Timed out opening the local game socket."));
    }, 10_000);
    socket.once("open", () => {
      clearTimeout(timer);
      resolve(socket);
    });
    socket.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

function waitMessage(
  socket: WebSocket,
  predicate: (message: ServerMessage) => boolean,
  label: string,
  timeoutMs = 10_000,
): Promise<ServerMessage> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer);
      socket.off("message", onMessage);
      socket.off("close", onClose);
    };
    const onMessage = (raw: WebSocket.RawData) => {
      let message: ServerMessage;
      try { message = JSON.parse(raw.toString()) as ServerMessage; } catch { return; }
      if (!predicate(message)) return;
      cleanup();
      resolve(message);
    };
    const onClose = () => {
      cleanup();
      reject(new Error("Socket closed waiting for " + label));
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Timed out waiting for " + label));
    }, timeoutMs);
    socket.on("message", onMessage);
    socket.once("close", onClose);
  });
}

async function sendAndWait(
  socket: WebSocket,
  request: Record<string, unknown>,
  type: string,
): Promise<ServerMessage> {
  const response = waitMessage(socket, (message) => message.type === type, type);
  socket.send(JSON.stringify(request));
  return response;
}

async function main(): Promise<void> {
  let socket: WebSocket | null = null;
  let token = "";
  try {
    let active = await startServer();
    socket = await openSocket(active.port);
    const authResponse = await sendAndWait(socket, {
      type: "authRegister",
      email: "stage15-travel-test@example.test",
      username: "Travel_Test",
      password: "Stage15Testing123",
    }, "authOk");
    token = String(authResponse.token || "");
    assert.ok(token.length > 20, "registration should return a resumable session token");
    assert.equal(authResponse.player?.cityId, "port-harcourt");
    assert.equal(authResponse.player?.cash, 5000);

    const initialState = await sendAndWait(socket, { type: "getStage15TravelState" }, "stage15TravelState");
    assert.equal(initialState.cityId, "port-harcourt");
    assert.equal(initialState.cities?.length, 7);
    assert.equal(initialState.routes?.length, 20);
    assert.equal(initialState.environments?.length, 7);
    assert.ok(initialState.routes.some((route: any) => route.id === "ph-aba"));
    assert.ok(initialState.routes.some((route: any) => route.id === "aba-ph"));

    const trip = await sendAndWait(socket, {
      type: "travelCity",
      routeId: "ph-aba",
      passengers: 1,
      requestId: "stage15-live-trip-once",
    }, "stage15TravelResult");
    assert.equal(trip.ok, true, trip.message);
    assert.equal(trip.fromCityId, "port-harcourt");
    assert.equal(trip.cityId, "aba");
    assert.equal(trip.fareNaira, 4500);
    assert.equal(trip.cash, 500);
    assert.equal(trip.environment?.cityId, "aba");

    const insufficient = await sendAndWait(socket, {
      type: "travelCity",
      routeId: "aba-ph",
      passengers: 1,
      requestId: "stage15-insufficient-balance",
    }, "stage15TravelResult");
    assert.equal(insufficient.ok, false, "low balance must block travel");
    assert.equal(insufficient.cityId, "aba");
    assert.equal(insufficient.cash, 500);

    socket.close();
    socket = null;
    await stopServer();

    // Restart from the same durable file: city, wallet and the trip ledger must survive.
    active = await startServer();
    socket = await openSocket(active.port);
    const resumed = await sendAndWait(socket, { type: "authResume", token }, "authOk");
    assert.equal(resumed.player?.cityId, "aba");
    assert.equal(resumed.player?.cash, 500);

    const restored = await sendAndWait(socket, { type: "getStage15TravelState" }, "stage15TravelState");
    assert.equal(restored.cityId, "aba");
    assert.equal(restored.cash, 500);
    assert.equal(restored.recentTrips?.[0]?.requestId, "stage15-live-trip-once");

    const replay = await sendAndWait(socket, {
      type: "travelCity",
      routeId: "aba-ph",
      passengers: 1,
      requestId: "stage15-live-trip-once",
    }, "stage15TravelResult");
    assert.equal(replay.ok, false, "a committed trip request must remain replay-protected after restart");
    assert.equal(replay.cityId, "aba");
    assert.equal(replay.cash, 500);

    console.log("Stage 15 live integration passed: fare transaction, city transition, insufficient-balance rejection, restart persistence and replay protection.");
  } finally {
    socket?.close();
    await stopServer();
    rmSync(tempDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
