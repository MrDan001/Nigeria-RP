import assert from "node:assert/strict";
import { spawn, type ChildProcessByStdio } from "node:child_process";
import type { Readable } from "node:stream";
import { mkdtempSync, rmSync } from "node:fs";
import net, { type AddressInfo } from "node:net";
import os from "node:os";
import path from "node:path";
import WebSocket from "ws";

type ServerMessage = Record<string, any>;
const tempDir = mkdtempSync(path.join(os.tmpdir(), "nrs-stage19-live-"));
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

async function waitUntil(predicate: () => boolean, label: string, timeoutMs = 15000): Promise<void> {
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
    new Promise<void>((resolve) => setTimeout(resolve, 5000)),
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
    }, 10000);
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
  timeoutMs = 10000,
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
  let secondCharacterId = "";
  try {
    let active = await startServer();
    socket = await openSocket(active.port);
    const firstList = await sendAndWait(socket, {
      type: "authRegister",
      email: "stage19-characters@example.test",
      username: "First_character",
      password: "Stage19Testing123",
      characterSelection: true,
    }, "authCharacters");
    token = String(firstList.token || "");
    assert.ok(token.length > 20, "the owner should receive a remembered-device token");
    assert.equal(firstList.characters?.length, 1);
    assert.equal(firstList.characters[0]?.name, "First_character");
    assert.equal(firstList.maxCharacters, 3);

    const secondList = await sendAndWait(socket, {
      type: "createCharacter",
      token,
      username: "Second_character",
    }, "authCharacters");
    assert.equal(secondList.characters?.length, 2);
    secondCharacterId = String(secondList.characters.find((item: any) => item.name === "Second_character")?.id || "");
    assert.ok(secondCharacterId, "the second character should have its own ID");

    const duplicate = await sendAndWait(socket, {
      type: "createCharacter",
      token,
      username: "SECOND_CHARACTER",
    }, "authError");
    assert.equal(duplicate.code, "USERNAME_TAKEN", "character names must be unique case-insensitively");

    const thirdList = await sendAndWait(socket, {
      type: "createCharacter",
      token,
      username: "Third_character",
    }, "authCharacters");
    assert.equal(thirdList.characters?.length, 3);
    const thirdCharacterId = String(thirdList.characters.find((item: any) => item.name === "Third_character")?.id || "");
    assert.ok(thirdCharacterId);

    const fourth = await sendAndWait(socket, {
      type: "createCharacter",
      token,
      username: "Fourth_character",
    }, "authError");
    assert.equal(fourth.code, "CHARACTER_LIMIT", "the server must reject a fourth character");

    const entered = await sendAndWait(socket, {
      type: "selectCharacter",
      token,
      characterId: secondCharacterId,
    }, "authOk");
    assert.equal(entered.player?.name, "Second_character", "continuing a character should enter that character, not the owner row");

    socket.close();
    socket = null;
    await stopServer();

    active = await startServer();
    socket = await openSocket(active.port);
    const returned = await sendAndWait(socket, {
      type: "authResume",
      token,
      characterSelection: true,
    }, "authCharacters");
    assert.equal(returned.account?.email, "stage19-characters@example.test");
    assert.equal(returned.characters?.length, 3, "the saved character list should survive a server restart");
    assert.ok(returned.characters.some((item: any) => item.id === secondCharacterId));

    const continued = await sendAndWait(socket, {
      type: "selectCharacter",
      token,
      characterId: thirdCharacterId,
    }, "authOk");
    assert.equal(continued.player?.name, "Third_character", "a saved character can be continued after reopening the game");
    assert.equal(continued.player?.cash, 5000, "each new character starts with its own independent wallet");

    console.log("Stage 19 live integration passed: remembered account, 3-character cap, case-insensitive unique names, continue-character flow and character persistence after restart.");
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
