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

type NetPlayer = { id: string; name: string; x: number; z: number; yaw: number };
type Snapshot = { type: "snapshot"; players: NetPlayer[]; serverTime: number };
type Connected = { type: "connected"; playerId: string; players: NetPlayer[] };
type Interaction = { type: "interactionResult"; accepted: boolean; message?: string };

const canvas = document.querySelector<HTMLCanvasElement>("#game-canvas");
const connection = document.querySelector<HTMLSpanElement>("#connection");
const status = document.querySelector<HTMLElement>("#status");
const playerCount = document.querySelector<HTMLElement>("#player-count");
const joystick = document.querySelector<HTMLDivElement>("#joystick");
const stick = document.querySelector<HTMLDivElement>("#stick");
const interact = document.querySelector<HTMLButtonElement>("#interact");
const resetCamera = document.querySelector<HTMLButtonElement>("#reset-camera");
const nameInput = document.querySelector<HTMLInputElement>("#player-name");
const joinButton = document.querySelector<HTMLButtonElement>("#join-button");
const identityName = document.querySelector<HTMLElement>("#identity-name");
const mapDots = document.querySelector<HTMLDivElement>("#player-map-dots");

if (!canvas || !connection || !status || !playerCount || !joystick || !stick ||
    !interact || !resetCamera || !nameInput || !joinButton || !identityName || !mapDots) {
  throw new Error("NRS client UI is missing required elements.");
}

const app = new Application(canvas, {
  graphicsDeviceOptions: { alpha: false, antialias: true }
});
app.setCanvasFillMode(FILLMODE_FILL_WINDOW);
app.setCanvasResolution(RESOLUTION_AUTO);

const camera = new Entity("Camera");
camera.addComponent("camera", {
  clearColor: new Color(0.55, 0.66, 0.76, 1),
  fov: 68,
  farClip: 320
});
app.root.addChild(camera);

const sun = new Entity("Sun");
sun.addComponent("light", {
  type: "directional",
  intensity: 2.1,
  castShadows: false,
  color: new Color(1.0, 0.86, 0.72)
});
sun.setEulerAngles(48, 28, -6);
app.root.addChild(sun);

const ambient = new Entity("Ambient");
ambient.addComponent("light", {
  type: "omni",
  intensity: 1.25,
  range: 240,
  color: new Color(0.72, 0.82, 1.0)
});
ambient.setPosition(0, 30, 0);
app.root.addChild(ambient);

function material(r: number, g: number, b: number, emissive = 0) {
  const m = new StandardMaterial();
  m.diffuse.set(r, g, b);
  m.roughness = 0.82;
  if (emissive > 0) m.emissive.set(r * emissive, g * emissive, b * emissive);
  m.update();
  return m;
}

function addBox(
  name: string,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  mat: StandardMaterial,
  yaw = 0,
  parent?: Entity
) {
  const entity = new Entity(name);
  entity.addComponent("render", { type: "box" });
  entity.setPosition(x, y, z);
  entity.setLocalScale(w, h, d);
  entity.setEulerAngles(0, yaw, 0);
  entity.render!.material = mat;
  (parent ?? app.root).addChild(entity);
  return entity;
}

function addSphere(
  name: string,
  x: number,
  y: number,
  z: number,
  sx: number,
  sy: number,
  sz: number,
  mat: StandardMaterial,
  parent?: Entity
) {
  const entity = new Entity(name);
  entity.addComponent("render", { type: "sphere" });
  entity.setPosition(x, y, z);
  entity.setLocalScale(sx, sy, sz);
  entity.render!.material = mat;
  (parent ?? app.root).addChild(entity);
  return entity;
}

const asphalt = material(0.055, 0.067, 0.078);
const roadEdge = material(0.50, 0.47, 0.40);
const white = material(0.92, 0.93, 0.92);
const yellow = material(0.95, 0.72, 0.08, 0.08);
const grass = material(0.045, 0.17, 0.085);
const grass2 = material(0.08, 0.22, 0.11);
const concrete = material(0.39, 0.40, 0.42);
const plaster = material(0.62, 0.59, 0.54);
const cream = material(0.77, 0.67, 0.49);
const warm = material(0.48, 0.26, 0.11);
const red = material(0.48, 0.08, 0.055);
const blue = material(0.04, 0.27, 0.48);
const teal = material(0.03, 0.32, 0.31);
const green = material(0.025, 0.36, 0.18);
const darkGreen = material(0.015, 0.20, 0.09);
const glass = material(0.045, 0.17, 0.22, 0.22);
const dark = material(0.02, 0.027, 0.03);

addBox("CityGround", 0, -0.18, 0, 190, 0.35, 190, grass);

function addRoad(x: number, z: number, w: number, d: number, horizontal = false) {
  addBox("Road", x, 0.01, z, w, 0.08, d, asphalt);

  if (horizontal) {
    addBox("RoadEdgeTop", x, 0.07, z - d / 2 - 2.2, w, 0.14, 4.4, roadEdge);
    addBox("RoadEdgeBottom", x, 0.07, z + d / 2 + 2.2, w, 0.14, 4.4, roadEdge);

    for (let px = -w / 2 + 6; px < w / 2 - 6; px += 13) {
      addBox("LaneTop", x + px, 0.075, z - 5.1, 7, 0.018, 0.16, white);
      addBox("LaneBottom", x + px, 0.075, z + 5.1, 7, 0.018, 0.16, white);
    }

    for (let px = -w / 2 + 10; px < w / 2 - 5; px += 14) {
      addBox("CenterDash", x + px, 0.078, z, 6, 0.02, 0.13, yellow);
    }
  } else {
    addBox("RoadEdgeLeft", x - d / 2 - 2.2, 0.07, z, 4.4, 0.14, d, roadEdge);
    addBox("RoadEdgeRight", x + d / 2 + 2.2, 0.07, z, 4.4, 0.14, d, roadEdge);

    for (let pz = -d / 2 + 6; pz < d / 2 - 6; pz += 13) {
      addBox("LaneLeft", x - 5.1, 0.075, z + pz, 0.16, 0.018, 7, white);
      addBox("LaneRight", x + 5.1, 0.075, z + pz, 0.16, 0.018, 7, white);
    }

    for (let pz = -d / 2 + 10; pz < d / 2 - 5; pz += 14) {
      addBox("CenterDash", x, 0.078, z + pz, 0.13, 0.02, 6, yellow);
    }
  }
}

addRoad(0, 0, 170, 22, false);
addRoad(0, -31, 170, 18, true);

function addSidewalkBand(x: number, z: number, w: number, d: number) {
  addBox("Sidewalk", x, 0.12, z, w, 0.18, d, concrete);
}

addSidewalkBand(-14, -23, 5, 150);
addSidewalkBand(14, -23, 5, 150);
addSidewalkBand(-82, -31, 18, 5);
addSidewalkBand(82, -31, 18, 5);

function addWindowRow(x: number, y: number, z: number, count: number, yaw = 0) {
  for (let i = 0; i < count; i++) {
    const offset = (i - (count - 1) / 2) * 2.4;
    const wx = yaw === 0 ? x + offset : x;
    const wz = yaw === 0 ? z : z + offset;
    addBox("Window", wx, y, wz, yaw === 0 ? 1.15 : 0.08, 0.78, yaw === 0 ? 0.08 : 1.15, glass, yaw);
  }
}

function addBuilding(
  x: number,
  z: number,
  w: number,
  h: number,
  d: number,
  facade: StandardMaterial
) {
  addBox("Building", x, h / 2, z, w, h, d, facade);

  const frontZ = z - d / 2 - 0.05;
  for (let row = 0; row < Math.max(2, Math.floor(h / 2.1)); row++) {
    addWindowRow(x, 1.55 + row * 2.0, frontZ, Math.max(2, Math.floor(w / 2.4)));
  }

  addBox("FacadeBand", x, Math.min(h - 0.7, 2.4), frontZ - 0.09, Math.max(2, w - 1.2), 0.14, 0.08, green);
  addBox("RoofTrim", x, h + 0.1, z, Math.max(2, w + 0.3), 0.18, Math.max(2, d + 0.3), roadEdge);

  if (h >= 7) {
    addBox("Canopy", x, 1.2, frontZ - 1.15, Math.max(3, w * 0.55), 0.18, 2.2, cream);
  }
}

addBuilding(-31, -45, 26, 8, 18, cream);
addBuilding(28, -46, 24, 12, 19, plaster);
addBuilding(-31, 11, 28, 7, 17, red);
addBuilding(29, 12, 22, 9, 17, teal);
addBuilding(-58, -8, 16, 5.5, 18, warm);
addBuilding(57, -2, 18, 7, 20, blue);
addBuilding(-63, 41, 20, 10, 18, concrete);
addBuilding(62, 40, 22, 6, 18, cream);
addBuilding(8, -61, 30, 15, 20, concrete);

function addPalm(x: number, z: number, scale = 1) {
  const trunk = addBox("PalmTrunk", x, 2.3 * scale, z, 0.5 * scale, 4.6 * scale, 0.5 * scale, warm);
  trunk.setEulerAngles(0, (x * 3 + z * 2) % 7, (z % 5) * 1.4);

  const leafMat = green;
  addSphere("PalmLeafA", x, 4.75 * scale, z, 2.45 * scale, 0.95 * scale, 1.55 * scale, leafMat);
  addSphere("PalmLeafB", x - 1.0 * scale, 4.45 * scale, z + 0.55 * scale, 1.45 * scale, 0.7 * scale, 1.0 * scale, darkGreen);
  addSphere("PalmLeafC", x + 1.0 * scale, 4.55 * scale, z - 0.25 * scale, 1.35 * scale, 0.72 * scale, 1.05 * scale, leafMat);
}

[
  [-19, -29, 1.0],
  [18, -29, 0.95],
  [-18, -2, 0.95],
  [19, 6, 0.9],
  [-47, -20, 0.82],
  [47, 20, 0.95],
  [-48, 30, 0.8],
  [49, -28, 0.86],
].forEach(([x, z, s]) => addPalm(x, z, s));

function addStreetLight(x: number, z: number, horizontal = false) {
  addBox("LampPole", x, 2.8, z, 0.12, 5.6, 0.12, concrete);
  if (horizontal) {
    addBox("LampArm", x + 0.9, 5.25, z, 1.8, 0.1, 0.1, concrete);
    addSphere("Lamp", x + 1.8, 5.25, z, 0.22, 0.22, 0.22, yellow);
  } else {
    addBox("LampArm", x, 5.25, z + 0.9, 0.1, 0.1, 1.8, concrete);
    addSphere("Lamp", x, 5.25, z + 1.8, 0.22, 0.22, 0.22, yellow);
  }
}

[
  [-10, -12],
  [10, -12],
  [-10, -48],
  [10, -48],
  [-46, -31],
  [46, -31],
].forEach(([x, z]) => addStreetLight(x, z, false));

function addCar(x: number, z: number, body: StandardMaterial, yaw = 0, scale = 1) {
  const root = new Entity("Car");
  root.setPosition(x, 0.58, z);
  root.setEulerAngles(0, yaw, 0);
  root.setLocalScale(scale, scale, scale);
  app.root.addChild(root);

  const base = addBox("CarBody", 0, .38, 0, 4.4, .76, 2.05, body);
  const cabin = addBox("CarCabin", -0.15, .95, 0, 2.4, .72, 1.67, glass);
  const hood = addBox("CarHood", 1.25, .64, 0, 1.45, .28, 1.86, body);
  root.addChild(base);
  root.addChild(cabin);
  root.addChild(hood);

  [[-1.38,-1.0],[1.38,-1.0],[-1.38,1.0],[1.38,1.0]].forEach(([wx,wz]) => {
    const wheel = new Entity("Wheel");
    wheel.addComponent("render", { type: "cylinder" });
    wheel.setPosition(wx, 0, wz);
    wheel.setLocalScale(.5,.2,.5);
    wheel.setEulerAngles(90, 0, 0);
    wheel.render!.material = dark;
    root.addChild(wheel);
  });

  addBox("Tail", x - Math.cos(yaw * Math.PI / 180) * 2.05 * scale, 0.88,
    z - Math.sin(yaw * Math.PI / 180) * 2.05 * scale, 0.28, 0.12, 1.55, red);
}

addCar(0, -20, blue, 0, 0.95);
addCar(-7, -38, red, 90, 0.9);
addCar(11, -52, cream, 90, 0.88);
addCar(-48, -31, teal, 0, 0.82);
addCar(47, -31, blue, 180, 0.82);
addCar(0, -70, warm, 0, 0.78);

function addBillboard(x: number, z: number) {
  addBox("BillboardPoleA", x - 4.5, 2.4, z, .18, 4.8, .18, concrete);
  addBox("BillboardPoleB", x + 4.5, 2.4, z, .18, 4.8, .18, concrete);
  addBox("Billboard", x, 4.75, z, 12, 5.0, .28, dark);
  addBox("BillboardTop", x, 6.1, z - .18, 9.2, .42, .05, green);
  addBox("BillboardLine", x, 4.55, z - .18, 7.8, .18, .05, yellow);
}
addBillboard(34, -12);

function addPortHarcourtSign() {
  addBox("PHSignFrame", 0, 3.25, -61, 20, 6.5, .35, dark);
  addBox("PHSignPanel", 0, 3.25, -60.78, 17.2, 5.5, .14, concrete);
  addBox("PHSignGreen", 0, 1.75, -60.67, 12, .65, .08, green);
  addBox("PHSignGold", 0, 3.98, -60.66, 12.8, .18, .06, yellow);
}
addPortHarcourtSign();

function addCloud(x: number, y: number, z: number, s = 1) {
  const cloud = material(0.82, 0.86, 0.89);
  addSphere("CloudA", x, y, z, 6.5 * s, 2.2 * s, 3.2 * s, cloud);
  addSphere("CloudB", x + 5 * s, y + .6 * s, z + 1.2 * s, 4.2 * s, 1.7 * s, 2.6 * s, cloud);
}
addCloud(-34, 30, -70, 1.0);
addCloud(30, 26, -84, 0.9);
addCloud(72, 33, -52, 0.85);

function addCapsule(
  name: string,
  x: number,
  y: number,
  z: number,
  radius: number,
  height: number,
  mat: StandardMaterial,
  parent: Entity,
) {
  const entity = new Entity(name);
  entity.addComponent("render", { type: "capsule" });
  entity.setLocalPosition(x, y, z);
  entity.setLocalScale(radius * 2, height, radius * 2);
  entity.render!.material = mat;
  parent.addChild(entity);
  return entity;
}

type PlayerVisual = {
  root: Entity;
  leftArm: Entity;
  rightArm: Entity;
  leftLeg: Entity;
  rightLeg: Entity;
  phase: number;
  walkAmount: number;
  targetX: number;
  targetZ: number;
  targetYaw: number;
  initialized: boolean;
};

const playerEntities = new Map<string, PlayerVisual>();

function makePlayer(player: NetPlayer, local: boolean) {
  const root = new Entity("Player_" + player.id);
  root.setPosition(player.x, 0, player.z);
  root.setEulerAngles(0, (player.yaw * 180) / Math.PI, 0);
  app.root.addChild(root);

  // Human proportions: smaller head, shoulders, tapered torso,
  // separate arms/legs and shoes. Nothing is left floating in world space.
  const skin = material(local ? 0.52 : 0.42, local ? 0.28 : 0.22, local ? 0.16 : 0.13);
  const shirt = material(0.035, 0.08, 0.075);
  const shirtAccent = material(0.02, 0.48, 0.31);
  const pants = material(0.025, 0.045, 0.065);
  const shoe = material(0.78, 0.82, 0.85);
  const hair = material(0.025, 0.018, 0.015);

  addBox("Torso", 0, 1.38, 0, 0.92, 1.32, 0.52, shirt, 0, root);
  addBox("Waist", 0, 0.78, 0, 0.70, 0.24, 0.48, pants, 0, root);

  const leftArm = addCapsule("ArmL", -0.63, 1.38, 0, 0.13, 1.05, skin, root);
  const rightArm = addCapsule("ArmR", 0.63, 1.38, 0, 0.13, 1.05, skin, root);

  const leftLeg = addCapsule("LegL", -0.24, 0.37, 0, 0.16, 1.28, pants, root);
  const rightLeg = addCapsule("LegR", 0.24, 0.37, 0, 0.16, 1.28, pants, root);

  addBox("ShoeL", -0.24, -0.04, -0.10, 0.34, 0.18, 0.62, shoe, 0, root);
  addBox("ShoeR", 0.24, -0.04, -0.10, 0.34, 0.18, 0.62, shoe, 0, root);

  addSphere("Head", 0, 2.40, 0, 0.46, 0.50, 0.46, skin, root);
  addBox("Hair", 0, 2.73, 0.02, 0.70, 0.16, 0.70, hair, 0, root);
  addBox("ShirtMark", 0, 1.42, 0.29, 0.42, 0.28, 0.04, shirtAccent, 0, root);

  const visual: PlayerVisual = {
    root,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    phase: 0,
    walkAmount: 0,
    targetX: player.x,
    targetZ: player.z,
    targetYaw: player.yaw,
    initialized: true
  };

  playerEntities.set(player.id, visual);
  return visual;
}

let localPlayerId = "";
let ws: WebSocket | null = null;
let reconnectTimer: number | null = null;
let inputSequence = 0;
let input = { forward: 0, strafe: 0 };
let lastSend = 0;
let manualCamera = false;
const MOVE_VISUAL_DISTANCE = 0.05;

const keyboard = new Set<string>();
window.addEventListener("keydown", (event) => keyboard.add(event.key.toLowerCase()));
window.addEventListener("keyup", (event) => keyboard.delete(event.key.toLowerCase()));

function applyPlayers(players: NetPlayer[]) {
  const live = new Set(players.map((p) => p.id));

  for (const [id, visual] of playerEntities) {
    if (!live.has(id)) {
      visual.root.destroy();
      playerEntities.delete(id);
    }
  }

  mapDots.innerHTML = "";
  const scale = 0.42;

  for (const player of players) {
    let visual = playerEntities.get(player.id);
    if (!visual) visual = makePlayer(player, player.id === localPlayerId);

    // Snap only the network target. The render loop interpolates toward it.
    visual.targetX = player.x;
    visual.targetZ = player.z;
    visual.targetYaw = player.yaw;

    if (player.id !== localPlayerId) {
      const dot = document.createElement("span");
      dot.className = "map-dot";
      dot.style.left = `${50 + Math.max(-45, Math.min(45, player.x * scale))}%`;
      dot.style.top = `${50 + Math.max(-45, Math.min(45, player.z * scale))}%`;
      mapDots.appendChild(dot);
    }
  }

  playerCount.textContent = String(players.length);
}

function setConnectionState(label: string, message: string, stateClass: string) {
  connection.textContent = label;
  connection.className = stateClass;
  status.textContent = message;

  const dot = document.querySelector<HTMLElement>(".pulse-dot");
  if (dot) {
    dot.style.background =
      stateClass === "good"
        ? "#60efa7"
        : stateClass === "bad"
          ? "#ff7b8f"
          : "#ffd166";
  }
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

  setConnectionState(
    "CONNECTING",
    "Connecting to the Port Harcourt authoritative world…",
    "pending"
  );

  ws.onopen = () => {
    setConnectionState("ONLINE", "Live server connection established.", "good");
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
    } else if (message.type === "snapshot") {
      applyPlayers(message.players);
    } else if (message.type === "interactionResult") {
      status.textContent = message.message ?? "Interaction request processed.";
    }
  };

  ws.onclose = () => {
    setConnectionState("OFFLINE", "Connection lost. Reconnecting…", "bad");
    reconnect();
  };

  ws.onerror = () => {
    setConnectionState("ERROR", "Network error. Retrying…", "bad");
  };
}

function reconnect() {
  if (reconnectTimer !== null) return;
  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, 1500);
}

function send(payload: unknown) {
  if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
}

function setStick(clientX: number, clientY: number) {
  const rect = joystick.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = clientX - cx;
  const dy = clientY - cy;
  const max = 45;
  const length = Math.hypot(dx, dy) || 1;
  const scale = Math.min(1, max / length);

  stick.style.transform = `translate(${dx * scale}px,${dy * scale}px)`;
  input = {
    forward: (-dy / 45) * scale,
    strafe: (dx / 45) * scale
  };
}

function resetStick() {
  stick.style.transform = "translate(0,0)";
  input = { forward: 0, strafe: 0 };
}

joystick.addEventListener("pointerdown", (event) => {
  joystick.setPointerCapture(event.pointerId);
  setStick(event.clientX, event.clientY);
});
joystick.addEventListener("pointermove", (event) => {
  if (event.buttons) setStick(event.clientX, event.clientY);
});
joystick.addEventListener("pointerup", resetStick);
joystick.addEventListener("pointercancel", resetStick);

interact.addEventListener("click", () => send({ type: "interact" }));
resetCamera.addEventListener("click", () => {
  manualCamera = false;
});

joinButton.addEventListener("click", () => {
  const nextName = nameInput.value.trim().slice(0, 20) || "Player";
  nameInput.value = nextName;
  identityName.textContent = nextName;
  send({ type: "hello", name: nextName });
  status.textContent = `Identity updated to ${nextName}.`;
});

app.on("update", (dt: number) => {
  // Fresh input pipeline: joystick/keyboard expresses intent only.
  // The server owns acceleration, collision bounds and facing.
  let forward = input.forward;
  let strafe = input.strafe;

  if (keyboard.has("w") || keyboard.has("arrowup")) forward += 1;
  if (keyboard.has("s") || keyboard.has("arrowdown")) forward -= 1;
  if (keyboard.has("d") || keyboard.has("arrowright")) strafe += 1;
  if (keyboard.has("a") || keyboard.has("arrowleft")) strafe -= 1;

  const inputLength = Math.hypot(forward, strafe);
  if (inputLength > 1) {
    forward /= inputLength;
    strafe /= inputLength;
  }

  const now = performance.now();
  if (now - lastSend >= 50 && ws?.readyState === WebSocket.OPEN) {
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

  // Render interpolation is independent from the 20Hz server tick.
  // This removes the old snapshot-jump effect.
  for (const visual of playerEntities.values()) {
    const position = visual.root.getPosition();
    const follow = 1 - Math.exp(-dt * 18);

    visual.root.setPosition(
      position.x + (visual.targetX - position.x) * follow,
      0,
      position.z + (visual.targetZ - position.z) * follow
    );

    let currentYaw = visual.root.getEulerAngles().y * Math.PI / 180;
    let yawDelta = visual.targetYaw - currentYaw;

    while (yawDelta > Math.PI) yawDelta -= Math.PI * 2;
    while (yawDelta < -Math.PI) yawDelta += Math.PI * 2;

    currentYaw += yawDelta * Math.min(1, dt * 14);
    visual.root.setEulerAngles(0, currentYaw * 180 / Math.PI, 0);

    const distance = Math.hypot(
      visual.targetX - position.x,
      visual.targetZ - position.z
    );
    const moving = distance > 0.003;

    visual.walkAmount += ((moving ? 1 : 0) - visual.walkAmount) *
      Math.min(1, dt * 12);

    if (visual.walkAmount > 0.01) {
      visual.phase += dt * 9;
    }

    const stride = Math.sin(visual.phase) * 0.48 * visual.walkAmount;

    visual.leftArm.setLocalEulerAngles(stride * 32, 0, 0);
    visual.rightArm.setLocalEulerAngles(-stride * 32, 0, 0);
    visual.leftLeg.setLocalEulerAngles(-stride * 26, 0, 0);
    visual.rightLeg.setLocalEulerAngles(stride * 26, 0, 0);
  }

  const local = localPlayerId ? playerEntities.get(localPlayerId) : undefined;

  if (!manualCamera && local) {
    const p = local.root.getPosition();
    const yaw = local.root.getEulerAngles().y * Math.PI / 180;

    // Stable third-person camera: behind + above the player,
    // with enough distance to keep the whole body visible.
    const distance = 6.2;
    const height = 3.15;
    const lookAhead = 1.0;

    const desiredX = p.x + Math.sin(yaw) * distance;
    const desiredZ = p.z + Math.cos(yaw) * distance;

    const cameraPosition = camera.getPosition();
    const cameraFollow = 1 - Math.exp(-dt * 8);

    camera.setPosition(
      cameraPosition.x + (desiredX - cameraPosition.x) * cameraFollow,
      cameraPosition.y + (p.y + height - cameraPosition.y) * cameraFollow,
      cameraPosition.z + (desiredZ - cameraPosition.z) * cameraFollow
    );

    camera.lookAt(
      p.x - Math.sin(yaw) * lookAhead,
      p.y + 1.20,
      p.z - Math.cos(yaw) * lookAhead
    );
  }
});

async function requestLandscapeMode() {
  try {
    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (orientation: "landscape") => Promise<void>;
    };

    // Installed/PWA launches can honor the manifest without a gesture.
    if (orientation?.lock) {
      await orientation.lock("landscape").catch(() => {});
    }
  } catch {}
}

async function enterLandscapeGame() {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen?.().catch(() => {});
    }
  } catch {}

  await requestLandscapeMode();
}

undefined

window.addEventListener("resize", () => app.resizeCanvas());
window.addEventListener("orientationchange", () => {
  app.resizeCanvas();
  void requestLandscapeMode();
});


void enterLandscapeGame();

app.start();
connect();
