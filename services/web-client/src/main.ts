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
  clearColor: new Color(0.52, 0.67, 0.82, 1),
  fov: 64,
  farClip: 260
});
app.root.addChild(camera);

const sun = new Entity("Sun");
sun.addComponent("light", {
  type: "directional",
  intensity: 2.4,
  castShadows: false
});
sun.setEulerAngles(52, 35, -8);
app.root.addChild(sun);

const ambient = new Entity("Ambient");
ambient.addComponent("light", {
  type: "omni",
  intensity: 1.7,
  range: 180
});
ambient.setPosition(0, 25, 0);
app.root.addChild(ambient);

function material(r: number, g: number, b: number, emissive = 0) {
  const m = new StandardMaterial();
  m.diffuse.set(r, g, b);
  m.roughness = 0.86;
  if (emissive > 0) {
    m.emissive.set(r * emissive, g * emissive, b * emissive);
  }
  m.update();
  return m;
}

function addBox(name: string, x: number, y: number, z: number, w: number, h: number, d: number, mat: StandardMaterial, yaw = 0) {
  const entity = new Entity(name);
  entity.addComponent("render", { type: "box" });
  entity.setPosition(x, y, z);
  entity.setLocalScale(w, h, d);
  entity.setEulerAngles(0, yaw, 0);
  entity.render!.material = mat;
  app.root.addChild(entity);
  return entity;
}

function addSphere(name: string, x: number, y: number, z: number, scale: number, mat: StandardMaterial) {
  const entity = new Entity(name);
  entity.addComponent("render", { type: "sphere" });
  entity.setPosition(x, y, z);
  entity.setLocalScale(scale, scale, scale);
  entity.render!.material = mat;
  app.root.addChild(entity);
  return entity;
}

const asphalt = material(0.075, 0.085, 0.09);
const curb = material(0.58, 0.57, 0.53);
const sand = material(0.34, 0.30, 0.22);
const grass = material(0.065, 0.18, 0.10);
const concrete = material(0.36, 0.37, 0.38);
const white = material(0.88, 0.9, 0.9);
const yellow = material(0.98, 0.77, 0.08, 0.12);
const windowMat = material(0.07, 0.20, 0.27, 0.12);
const green = material(0.04, 0.32, 0.18);
const cream = material(0.68, 0.59, 0.42);
const red = material(0.45, 0.07, 0.05);
const blue = material(0.03, 0.25, 0.44);

addBox("CityGround", 0, -0.15, 0, 150, 0.3, 150, grass);

function addRoad(x: number, z: number, w: number, d: number) {
  addBox("Road", x, 0.02, z, w, 0.08, d, asphalt);
  if (w > d) {
    for (let px = -w / 2 + 8; px < w / 2 - 4; px += 13) {
      addBox("Lane", x + px, 0.075, z, 7, 0.015, 0.16, white);
    }
  } else {
    for (let pz = -d / 2 + 8; pz < d / 2 - 4; pz += 13) {
      addBox("Lane", x, 0.075, z + pz, 0.16, 0.015, 7, white);
    }
  }
}

addRoad(0, 0, 140, 16);
addRoad(0, 0, 16, 140);
addBox("Median", 0, 0.10, 0, 140, 0.18, 1.1, curb);

function addBuilding(x: number, z: number, w: number, h: number, d: number, facade: StandardMaterial) {
  addBox("Building", x, h / 2, z, w, h, d, facade);
  for (let row = 0; row < Math.max(2, Math.floor(h / 2)); row++) {
    for (let col = 0; col < Math.max(2, Math.floor(w / 2.5)); col++) {
      addBox(
        "Window",
        x - w / 2 + 1.2 + col * 2.2,
        1.25 + row * 1.8,
        z - d / 2 - 0.05,
        0.75, 0.55, 0.08,
        windowMat
      );
    }
  }
}

addBuilding(-29, -29, 24, 9, 18, concrete);
addBuilding(27, -30, 20, 6, 16, cream);
addBuilding(-29, 28, 26, 7, 18, red);
addBuilding(28, 28, 18, 11, 18, concrete);
addBuilding(-52, 2, 15, 5, 18, cream);
addBuilding(50, -5, 17, 8, 20, blue);
addBuilding(42, 38, 12, 5, 14, green);

function addPalm(x: number, z: number, scale = 1) {
  const trunk = addBox("PalmTrunk", x, 2.1 * scale, z, 0.55 * scale, 4.2 * scale, 0.55 * scale, cream);
  trunk.setEulerAngles(0, (x * 7) % 8, (z * 3) % 4);
  addSphere("PalmCrown", x, 4.45 * scale, z, 2.3 * scale, green);
  addSphere("PalmCrown2", x + 1.0 * scale, 4.15 * scale, z + .3 * scale, 1.5 * scale, green);
}

[
  [-18, 11, 1.0], [17, 10, .95], [-13, -10, .9], [15, -11, .9],
  [-49, -17, .85], [47, 22, 1.0], [36, -21, .82], [-42, 43, .75]
].forEach(([x,z,s]) => addPalm(x, z, s));

function addStreetLight(x: number, z: number, horizontal = true) {
  addBox("LampPole", x, 2.7, z, 0.12, 5.4, 0.12, concrete);
  if (horizontal) addBox("LampArm", x + 0.9, 5.25, z, 1.8, 0.1, 0.1, concrete);
  else addBox("LampArm", x, 5.25, z + 0.9, 0.1, 0.1, 1.8, concrete);
  addSphere("Lamp", horizontal ? x + .9 : x, 5.25, horizontal ? z : z + .9, .26, yellow);
}

[[-34, -7],[-16, -7],[16, 7],[34, 7]].forEach(([x,z]) => addStreetLight(x,z,true));

function addCar(x: number, z: number, body: StandardMaterial, yaw = 0) {
  const root = new Entity("Car");
  root.setPosition(x, 0.55, z);
  root.setEulerAngles(0, yaw, 0);
  app.root.addChild(root);

  const base = addBox("CarBody", 0, .35, 0, 4.1, .72, 2.0, body);
  const cabin = addBox("CarCabin", 0, .92, 0, 2.25, .72, 1.65, windowMat);
  const front = addBox("CarFront", 1.6, .32, 0, .55, .28, 1.75, white);
  root.addChild(base); root.addChild(cabin); root.addChild(front);

  [[-1.25,-1.0],[1.25,-1.0],[-1.25,1.0],[1.25,1.0]].forEach(([wx,wz]) => {
    const wheel = new Entity("Wheel");
    wheel.addComponent("render", { type: "cylinder" });
    wheel.setPosition(wx, 0, wz);
    wheel.setLocalScale(.52,.22,.52);
    wheel.setEulerAngles(90, 0, 0);
    wheel.render!.material = asphalt;
    root.addChild(wheel);
  });
}
addCar(-9, 3, blue, 90);
addCar(28, -7, red, 90);
addCar(-40, 11, cream, 0);

function addBillboard(x: number, z: number) {
  addBox("BillboardPoleA", x - 4, 2.2, z, .16, 4.4, .16, concrete);
  addBox("BillboardPoleB", x + 4, 2.2, z, .16, 4.4, .16, concrete);
  const board = addBox("Billboard", x, 4.45, z, 11, 4.8, .2, asphalt);
  board.setEulerAngles(0, 0, 0);
  addBox("BillboardAccent", x, 4.48, z - .14, 8.6, .45, .05, green);
}
addBillboard(30, 20);

function addPortHarcourtSign() {
  const base = addBox("PHSign", -1, 3.0, -17, 18, 6, .3, concrete);
  base.setEulerAngles(0, 180, 0);
  addBox("PHSignGreen", -1, 1.65, -16.8, 11, .55, .1, green);
  addBox("PHSignGold", -1, 3.85, -16.8, 12, .16, .08, yellow);
}
addPortHarcourtSign();

function makePlayer(player: NetPlayer, local: boolean) {
  const root = new Entity("Player_" + player.id);
  root.setPosition(player.x, 0, player.z);
  root.setEulerAngles(0, (player.yaw * 180) / Math.PI, 0);
  app.root.addChild(root);

  const skin = material(local ? 0.33 : 0.28, local ? 0.17 : 0.12, local ? 0.09 : 0.07);
  const shirt = material(local ? 0.025 : 0.20, local ? 0.07 : 0.08, local ? 0.055 : 0.12);
  const accent = material(0.02, 0.55, 0.33);
  const pants = material(0.045, 0.065, 0.09);
  const shoe = material(0.88, 0.88, 0.86);

  addBox("Torso", 0, 1.45, 0, .95, 1.55, .55, shirt);
  addSphere("Head", 0, 2.62, 0, .62, skin);
  addBox("ArmL", -.72, 1.45, 0, .28, 1.25, .32, skin);
  addBox("ArmR", .72, 1.45, 0, .28, 1.25, .32, skin);
  addBox("LegL", -.28, .55, 0, .33, 1.35, .4, pants);
  addBox("LegR", .28, .55, 0, .33, 1.35, .4, pants);
  addBox("ShoeL", -.28, -.05, -.12, .42, .18, .78, shoe);
  addBox("ShoeR", .28, -.05, -.12, .42, .18, .78, shoe);
  addBox("BackAccent", 0, 1.48, -.31, .58, .48, .06, accent);

  playerEntities.set(player.id, root);
}

const playerEntities = new Map<string, Entity>();
let localPlayerId = "";
let ws: WebSocket | null = null;
let reconnectTimer: number | null = null;
let inputSequence = 0;
let input = { forward: 0, strafe: 0 };
let lastSend = 0;
let manualCamera = false;

const keyboard = new Set<string>();
window.addEventListener("keydown", (event) => keyboard.add(event.key.toLowerCase()));
window.addEventListener("keyup", (event) => keyboard.delete(event.key.toLowerCase()));

function applyPlayers(players: NetPlayer[]) {
  const live = new Set(players.map((p) => p.id));
  for (const [id, entity] of playerEntities) {
    if (!live.has(id)) { entity.destroy(); playerEntities.delete(id); }
  }

  mapDots.innerHTML = "";
  const scale = 0.42;
  for (const player of players) {
    let entity = playerEntities.get(player.id);
    if (!entity) {
      makePlayer(player, player.id === localPlayerId);
      entity = playerEntities.get(player.id)!;
    }
    entity.setPosition(player.x, 0, player.z);
    entity.setEulerAngles(0, (player.yaw * 180) / Math.PI, 0);

    if (player.id !== localPlayerId) {
      const dot = document.createElement("span");
      dot.className = "map-dot";
      dot.style.left = `${50 + Math.max(-45, Math.min(45, player.x * scale))}%`;
      dot.style.top = `${50 + Math.max(-45, Math.min(45, player.z * scale))}%`;
      mapDots.appendChild(dot);
    } else {
      const mapPlayer = document.querySelector<HTMLElement>("#map-player");
      if (mapPlayer) mapPlayer.title = player.name;
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
    dot.style.background = stateClass === "good" ? "#60efa7" : stateClass === "bad" ? "#ff7b8f" : "#ffd166";
  }
}

function connect() {
  if (reconnectTimer !== null) { window.clearTimeout(reconnectTimer); reconnectTimer = null; }
  try { ws = new WebSocket(SERVER_URL); }
  catch { setConnectionState("ERROR","Unable to open the game server connection.","bad"); reconnect(); return; }

  setConnectionState("CONNECTING","Connecting to the Port Harcourt authoritative world…","pending");

  ws.onopen = () => {
    setConnectionState("ONLINE","Live server connection established.","good");
    const name = nameInput.value.trim().slice(0, 20) || "Player";
    send({ type: "hello", name });
  };

  ws.onmessage = (event) => {
    let message: Connected | Snapshot | Interaction;
    try { message = JSON.parse(event.data) as Connected | Snapshot | Interaction; } catch { return; }

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

  ws.onclose = () => { setConnectionState("OFFLINE","Connection lost. Reconnecting…","bad"); reconnect(); };
  ws.onerror = () => setConnectionState("ERROR","Network error. Retrying…","bad");
}

function reconnect() {
  if (reconnectTimer !== null) return;
  reconnectTimer = window.setTimeout(() => { reconnectTimer = null; connect(); }, 1500);
}

function send(payload: unknown) {
  if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
}

function setStick(clientX: number, clientY: number) {
  const rect = joystick.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = clientX - cx, dy = clientY - cy;
  const max = 45;
  const length = Math.hypot(dx, dy) || 1;
  const scale = Math.min(1, max / length);
  stick.style.transform = `translate(${dx * scale}px,${dy * scale}px)`;
  input = { forward: (-dy / 45) * scale, strafe: (dx / 45) * scale };
}
function resetStick() { stick.style.transform = "translate(0,0)"; input = { forward: 0, strafe: 0 }; }

joystick.addEventListener("pointerdown", (event) => {
  joystick.setPointerCapture(event.pointerId); setStick(event.clientX,event.clientY);
});
joystick.addEventListener("pointermove", (event) => { if (event.buttons) setStick(event.clientX,event.clientY); });
joystick.addEventListener("pointerup", resetStick);
joystick.addEventListener("pointercancel", resetStick);

interact.addEventListener("click", () => send({ type: "interact" }));
resetCamera.addEventListener("click", () => { manualCamera = false; });
joinButton.addEventListener("click", () => {
  const nextName = nameInput.value.trim().slice(0,20) || "Player";
  nameInput.value = nextName;
  identityName.textContent = nextName;
  send({ type:"hello", name: nextName });
  status.textContent = `Identity updated to ${nextName}.`;
});

app.on("update", (dt: number) => {
  let forward = input.forward, strafe = input.strafe;
  if (keyboard.has("w") || keyboard.has("arrowup")) forward += 1;
  if (keyboard.has("s") || keyboard.has("arrowdown")) forward -= 1;
  if (keyboard.has("d") || keyboard.has("arrowright")) strafe += 1;
  if (keyboard.has("a") || keyboard.has("arrowleft")) strafe -= 1;

  const magnitude = Math.hypot(forward, strafe);
  if (magnitude > 1) { forward /= magnitude; strafe /= magnitude; }

  const now = performance.now();
  if (now-lastSend >= 50 && ws?.readyState === WebSocket.OPEN &&
      (Math.abs(forward)>.01 || Math.abs(strafe)>.01)) {
    send({ type:"input", input:{ sequence:inputSequence++, forward, strafe } });
    lastSend = now;
  }

  const local = localPlayerId ? playerEntities.get(localPlayerId) : undefined;
  if (!manualCamera && local) {
    const p = local.getPosition();
    const desiredX = p.x;
    const desiredY = p.y + 5.8;
    const desiredZ = p.z + 10.5;
    const current = camera.getPosition();
    const k = Math.min(1, dt * 5);
    camera.setPosition(
      current.x + (desiredX-current.x)*k,
      current.y + (desiredY-current.y)*k,
      current.z + (desiredZ-current.z)*k
    );
    camera.lookAt(p.x, p.y + 1.15, p.z);
  }
});

function requestLandscapeMode() {
  try {
    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (orientation: "landscape") => Promise<void>;
    };
    if (orientation?.lock) {
      orientation.lock("landscape").catch(() => {
        // Browsers commonly require an installed PWA/fullscreen context.
      });
    }
  } catch {
    // Orientation APIs are optional; the portrait blocker handles unsupported browsers.
  }
}

window.addEventListener("pointerdown", requestLandscapeMode, { once: true });
window.addEventListener("touchstart", requestLandscapeMode, { once: true });
window.addEventListener("resize", () => app.resizeCanvas());
window.addEventListener("orientationchange", () => {
  app.resizeCanvas();
  requestLandscapeMode();
});

app.start();
connect();
