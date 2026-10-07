import {
  Application,
  Color,
  Entity,
  FILLMODE_FILL_WINDOW,
  RESOLUTION_AUTO,
  StandardMaterial
} from "playcanvas";
import "./style.css";

const SERVER_URL =
  import.meta.env.VITE_NRS_SERVER_URL ??
  "wss://nigeria-rp-production.up.railway.app";

type NetPlayer = {
  id: string;
  name: string;
  x: number;
  z: number;
  yaw: number;
};

type Snapshot = {
  type: "snapshot";
  players: NetPlayer[];
  serverTime: number;
};

type Connected = {
  type: "connected";
  playerId: string;
  players: NetPlayer[];
};

type Interaction = {
  type: "interaction";
  accepted: boolean;
  message?: string;
};

const canvas = document.querySelector<HTMLCanvasElement>("#game-canvas");
const connection = document.querySelector<HTMLSpanElement>("#connection");
const status = document.querySelector<HTMLDivElement>("#status");
const playerCount = document.querySelector<HTMLSpanElement>("#player-count");
const joystick = document.querySelector<HTMLDivElement>("#joystick");
const stick = document.querySelector<HTMLDivElement>("#stick");
const interact = document.querySelector<HTMLButtonElement>("#interact");
const resetCamera = document.querySelector<HTMLButtonElement>("#reset-camera");
const nameInput = document.querySelector<HTMLInputElement>("#player-name");
const joinButton = document.querySelector<HTMLButtonElement>("#join-button");

if (
  !canvas ||
  !connection ||
  !status ||
  !playerCount ||
  !joystick ||
  !stick ||
  !interact ||
  !resetCamera ||
  !nameInput ||
  !joinButton
) {
  throw new Error("NRS client UI is missing required elements.");
}

const app = new Application(canvas, {
  graphicsDeviceOptions: {
    alpha: true,
    antialias: true
  }
});

app.setCanvasFillMode(FILLMODE_FILL_WINDOW);
app.setCanvasResolution(RESOLUTION_AUTO);

const camera = new Entity("Camera");
camera.addComponent("camera", {
  clearColor: new Color(0.03, 0.05, 0.08, 1),
  fov: 60,
  farClip: 250
});
app.root.addChild(camera);

const sun = new Entity("Sun");
sun.addComponent("light", {
  type: "directional",
  intensity: 2.0,
  castShadows: false
});
sun.setEulerAngles(55, 35, 0);
app.root.addChild(sun);

const ambient = new Entity("Ambient");
ambient.addComponent("light", {
  type: "omni",
  intensity: 1.0,
  range: 120
});
ambient.setPosition(0, 18, 0);
app.root.addChild(ambient);

const ground = new Entity("PortHarcourtTestGround");
ground.addComponent("render", { type: "box" });
ground.setLocalScale(90, 0.25, 90);
ground.setPosition(0, -0.15, 0);

const groundMaterial = new StandardMaterial();
groundMaterial.diffuse.set(0.09, 0.14, 0.11);
groundMaterial.roughness = 0.92;
groundMaterial.update();
ground.render!.material = groundMaterial;
app.root.addChild(ground);

function makeBlock(
  name: string,
  x: number,
  z: number,
  width: number,
  height: number,
  depth: number
) {
  const entity = new Entity(name);
  entity.addComponent("render", { type: "box" });
  entity.setPosition(x, height / 2, z);
  entity.setLocalScale(width, height, depth);

  const material = new StandardMaterial();
  material.diffuse.set(0.18, 0.2, 0.23);
  material.roughness = 0.9;
  material.update();

  entity.render!.material = material;
  app.root.addChild(entity);
}

makeBlock("RoadStripNorth", 0, 0, 90, 0.08, 5);
makeBlock("RoadStripEast", 0, 0, 5, 0.08, 90);
makeBlock("BuildingA", -13, -11, 11, 4, 10);
makeBlock("BuildingB", 14, -11, 12, 6, 11);
makeBlock("BuildingC", -14, 13, 14, 5, 10);
makeBlock("BuildingD", 15, 14, 10, 3.5, 12);

const playerEntities = new Map<string, Entity>();
let localPlayerId = "";
let ws: WebSocket | null = null;
let reconnectTimer: number | null = null;
let inputSequence = 0;
let input = { forward: 0, strafe: 0 };
let lastSend = 0;
let manualCamera = false;

const keyboard = new Set<string>();
window.addEventListener("keydown", (event) => {
  keyboard.add(event.key.toLowerCase());
});
window.addEventListener("keyup", (event) => {
  keyboard.delete(event.key.toLowerCase());
});

function makeMaterial(r: number, g: number, b: number) {
  const material = new StandardMaterial();
  material.diffuse.set(r, g, b);
  material.roughness = 0.86;
  material.update();
  return material;
}

function makePlayer(player: NetPlayer, local: boolean) {
  const entity = new Entity(player.name || "Player");
  entity.addComponent("render", { type: "capsule" });
  entity.setPosition(player.x, 1, player.z);
  entity.setLocalScale(0.8, 1.8, 0.8);

  entity.render!.material = local
    ? makeMaterial(0.12, 0.62, 1.0)
    : makeMaterial(0.95, 0.35, 0.2);

  app.root.addChild(entity);
  playerEntities.set(player.id, entity);
}

function applyPlayers(players: NetPlayer[]) {
  const live = new Set(players.map((player) => player.id));

  for (const [id, entity] of playerEntities) {
    if (!live.has(id)) {
      entity.destroy();
      playerEntities.delete(id);
    }
  }

  for (const player of players) {
    let entity = playerEntities.get(player.id);

    if (!entity) {
      makePlayer(player, player.id === localPlayerId);
      entity = playerEntities.get(player.id)!;
    }

    entity.setPosition(player.x, 1, player.z);
    entity.setEulerAngles(0, (player.yaw * 180) / Math.PI, 0);
  }

  playerCount.textContent = String(players.length);
}

function send(payload: unknown) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function setConnectionState(
  label: string,
  message: string,
  stateClass: string
) {
  connection.textContent = label;
  connection.className = stateClass;
  status.textContent = message;
}

function connect() {
  if (reconnectTimer !== null) {
    window.clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  try {
    ws = new WebSocket(SERVER_URL);
  } catch {
    setConnectionState("ERROR", "Unable to open the game server connection.", "bad");
    reconnect();
    return;
  }

  setConnectionState("CONNECTING", "Connecting to the authoritative NRS server…", "pending");

  ws.onopen = () => {
    setConnectionState("ONLINE", "Connected. Your world state is server-authoritative.", "good");
    const name = nameInput.value.trim().slice(0, 20) || "Player";
    send({ type: "hello", name });
  };

  ws.onmessage = (event) => {
    let message: Connected | Snapshot | Interaction;

    try {
      message = JSON.parse(event.data) as Connected | Snapshot | Interaction;
    } catch {
      return;
    }

    if (message.type === "connected") {
      localPlayerId = message.playerId;
      applyPlayers(message.players);
      manualCamera = false;
      return;
    }

    if (message.type === "snapshot") {
      applyPlayers(message.players);
      return;
    }

    if (message.type === "interaction") {
      status.textContent = message.message ?? "Interaction request processed by the server.";
    }
  };

  ws.onclose = () => {
    setConnectionState("OFFLINE", "Connection lost. Reconnecting automatically…", "bad");
    reconnect();
  };

  ws.onerror = () => {
    setConnectionState("ERROR", "Network error. Retrying the game server connection…", "bad");
  };
}

function reconnect() {
  if (reconnectTimer !== null) return;

  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, 1500);
}

function setStick(clientX: number, clientY: number) {
  const rect = joystick.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = clientX - cx;
  const dy = clientY - cy;
  const max = 38;
  const length = Math.hypot(dx, dy) || 1;
  const scale = Math.min(1, max / length);

  stick.style.transform = `translate(${dx * scale}px, ${dy * scale}px)`;
  input = {
    forward: (-dy / 38) * scale,
    strafe: (dx / 38) * scale
  };
}

function resetStick() {
  stick.style.transform = "translate(0, 0)";
  input = { forward: 0, strafe: 0 };
}

joystick.addEventListener("pointerdown", (event) => {
  joystick.setPointerCapture(event.pointerId);
  setStick(event.clientX, event.clientY);
});

joystick.addEventListener("pointermove", (event) => {
  if (event.buttons) {
    setStick(event.clientX, event.clientY);
  }
});

joystick.addEventListener("pointerup", resetStick);
joystick.addEventListener("pointercancel", resetStick);

interact.addEventListener("click", () => {
  send({ type: "interact" });
});

joinButton.addEventListener("click", () => {
  const nextName = nameInput.value.trim().slice(0, 20) || "Player";
  nameInput.value = nextName;
  send({ type: "hello", name: nextName });
  status.textContent = `Player name set to ${nextName}.`;
});

resetCamera.addEventListener("click", () => {
  manualCamera = false;
});

app.on("update", (dt: number) => {
  let forward = input.forward;
  let strafe = input.strafe;

  if (keyboard.has("w") || keyboard.has("arrowup")) forward += 1;
  if (keyboard.has("s") || keyboard.has("arrowdown")) forward -= 1;
  if (keyboard.has("d") || keyboard.has("arrowright")) strafe += 1;
  if (keyboard.has("a") || keyboard.has("arrowleft")) strafe -= 1;

  const magnitude = Math.hypot(forward, strafe);
  if (magnitude > 1) {
    forward /= magnitude;
    strafe /= magnitude;
  }

  const now = performance.now();
  if (
    now - lastSend >= 50 &&
    ws?.readyState === WebSocket.OPEN &&
    (Math.abs(forward) > 0.01 || Math.abs(strafe) > 0.01)
  ) {
    send({
      type: "input",
      input: {
        sequence: inputSequence++,
        forward,
        strafe
      }
    });
    lastSend = now;
  }

  const local = localPlayerId
    ? playerEntities.get(localPlayerId)
    : undefined;

  if (!manualCamera && local) {
    const p = local.getPosition();
    const desiredX = p.x;
    const desiredY = p.y + 8;
    const desiredZ = p.z + 11;

    const current = camera.getPosition();
    camera.setPosition(
      current.x + (desiredX - current.x) * Math.min(1, dt * 5),
      current.y + (desiredY - current.y) * Math.min(1, dt * 5),
      current.z + (desiredZ - current.z) * Math.min(1, dt * 5)
    );
    camera.lookAt(p.x, p.y, p.z);
  }
});

window.addEventListener("resize", () => app.resizeCanvas());
window.addEventListener("orientationchange", () => app.resizeCanvas());

app.start();
