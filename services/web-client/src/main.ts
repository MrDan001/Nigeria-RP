import { Application, Color, Entity, StandardMaterial, Vec3 } from "@playcanvas/engine";
import "./style.css";

const SERVER_URL = import.meta.env.VITE_NRS_SERVER_URL ?? "wss://nigeria-rp-production.up.railway.app";

type NetPlayer = { id:string; name:string; x:number; z:number; yaw:number };
type Snapshot = { type:"snapshot"; players:NetPlayer[]; serverTime:number };
type Connected = { type:"connected"; playerId:string; players:NetPlayer[] };

const canvas = document.querySelector<HTMLCanvasElement>("#game-canvas")!;
const connection = document.querySelector<HTMLSpanElement>("#connection")!;
const status = document.querySelector<HTMLDivElement>("#status")!;
const joystick = document.querySelector<HTMLDivElement>("#joystick")!;
const stick = document.querySelector<HTMLDivElement>("#stick")!;
const interact = document.querySelector<HTMLButtonElement>("#interact")!;

const app = new Application(canvas, { graphicsDeviceOptions: { alpha:true, antialias:true } });
app.setCanvasFillMode("FILL_WINDOW");
app.setCanvasResolution("AUTO");

const camera = new Entity("Camera");
camera.addComponent("camera", { clearColor: new Color(0.04,0.05,0.06,1), fov:60 });
camera.setPosition(0, 8, 11);
camera.lookAt(0, 0, 0);
app.root.addChild(camera);

const light = new Entity("Sun");
light.addComponent("light", { type:"directional", intensity:2.2 });
light.setEulerAngles(50, -30, 0);
app.root.addChild(light);

const ground = new Entity("PortHarcourtTestGround");
ground.addComponent("render", { type:"box" });
ground.setLocalScale(80, .2, 80);
const groundMaterial = new StandardMaterial();
groundMaterial.diffuse.set(0.12,0.15,0.13);
groundMaterial.update();
ground.render!.material = groundMaterial;
app.root.addChild(ground);

const playerEntities = new Map<string,Entity>();
let localPlayerId = "";
let ws: WebSocket | null = null;
let inputSequence = 0;
let input = { forward:0, strafe:0 };

function makePlayer(player:NetPlayer, local:boolean) {
  const entity = new Entity(player.name || "Player");
  entity.addComponent("render", { type:"capsule" });
  entity.setPosition(player.x, 1, player.z);
  const material = new StandardMaterial();
  material.diffuse.set(local ? 0.15 : 0.85, local ? 0.55 : 0.25, local ? 0.95 : 0.25);
  material.update();
  entity.render!.material = material;
  app.root.addChild(entity);
  playerEntities.set(player.id, entity);
}

function applyPlayers(players:NetPlayer[]) {
  const live = new Set(players.map(p=>p.id));
  for (const [id,entity] of playerEntities) {
    if (!live.has(id)) { entity.destroy(); playerEntities.delete(id); }
  }
  for (const player of players) {
    let entity = playerEntities.get(player.id);
    if (!entity) { makePlayer(player, player.id === localPlayerId); entity = playerEntities.get(player.id)!; }
    entity.setPosition(player.x, 1, player.z);
    entity.setEulerAngles(0, player.yaw * 57.2958, 0);
  }
}

function send(payload:unknown) {
  if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
}

function connect() {
  ws = new WebSocket(SERVER_URL);
  connection.textContent = "CONNECTING";
  ws.onopen = () => {
    connection.textContent = "ONLINE";
    status.textContent = "Connected to the authoritative NRS game server.";
    send({ type:"hello", name:"Player" });
  };
  ws.onmessage = event => {
    const message = JSON.parse(event.data) as Connected | Snapshot;
    if (message.type === "connected") {
      localPlayerId = message.playerId;
      applyPlayers(message.players);
    } else if (message.type === "snapshot") {
      applyPlayers(message.players);
    }
  };
  ws.onclose = () => {
    connection.textContent = "OFFLINE";
    status.textContent = "Game server connection lost. Reconnecting…";
    setTimeout(connect, 1500);
  };
  ws.onerror = () => { connection.textContent = "ERROR"; };
}
connect();

function setStick(clientX:number, clientY:number) {
  const rect = joystick.getBoundingClientRect();
  const cx = rect.left + rect.width/2, cy = rect.top + rect.height/2;
  const dx = clientX-cx, dy = clientY-cy, max = 38;
  const length = Math.hypot(dx,dy) || 1, scale = Math.min(1,max/length);
  stick.style.transform = `translate(${dx*scale}px,${dy*scale}px)`;
  input = { forward: -dy/38*scale, strafe: dx/38*scale };
}
function resetStick(){ stick.style.transform="translate(0,0)"; input={forward:0,strafe:0}; }
joystick.addEventListener("pointerdown", e => { joystick.setPointerCapture(e.pointerId); setStick(e.clientX,e.clientY); });
joystick.addEventListener("pointermove", e => { if(e.buttons) setStick(e.clientX,e.clientY); });
joystick.addEventListener("pointerup", resetStick);
joystick.addEventListener("pointercancel", resetStick);
interact.addEventListener("click", () => send({type:"interact"}));

let lastSend = 0;
app.on("update", () => {
  const now = performance.now();
  if (now-lastSend >= 50 && (input.forward || input.strafe)) {
    send({type:"input",input:{sequence:inputSequence++,forward:input.forward,strafe:input.strafe}});
    lastSend = now;
  }
});

window.addEventListener("resize", () => app.resizeCanvas());
