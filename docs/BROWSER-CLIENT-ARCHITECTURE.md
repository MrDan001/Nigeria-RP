# NRS Browser Client Architecture

## Current implementation

The current playable client is browser-native and uses Three.js with HTML/CSS HUD controls. The game source is primarily in `services/web-client/index.html`; Vite packages the web workspace. Network/session functions and WebSocket message handling live in `services/web-client/public/nrs-online.js`.

Do not describe the current client as PlayCanvas or Unity. A future engine migration requires a separate, explicitly approved plan.

## Client responsibilities

- Render the current 3D Port Harcourt scene, houses, roads, rooms, vehicles and ambient activity.
- Handle touch joystick, steering wheel, pedals, mouse/keyboard input, camera, audio and animations.
- Display account state, online count, Homes, interaction prompts, phone, inventory and other HUD panels.
- Send authenticated WebSocket requests and apply server results.
- Interpolate/render remote players as supported by the current protocol.
- Never authoritatively award money, items, property, jobs, ranks or rewards.

## Server responsibilities

The game server is TypeScript/Node.js using WebSocket. It owns sessions, identity, persistent life, housing/rent, and permission checks for authoritative actions. PostgreSQL is used for durable state. The browser can request changes but should only apply valuable changes after a server response.

The current browser driving model is still mostly client-simulated. Server validation of car ownership and car-park entry/exit does not yet constitute server-authoritative vehicle physics, speed/collision validation or production vehicle replication.

## Mobile performance and camera rules

1. Keep the phone experience landscape-first while retaining responsive layout and touch targets.
2. Keep shader/material count and scene geometry reasonable for affordable Android devices.
3. Create residential exteriors near the player rather than generating the entire visual catalogue at startup.
4. Use cache-busted script URLs when shipping browser logic changes so that deployed phones do not keep stale client code.
5. During vehicle motion, camera orientation and zoom stay steady; touch-look and camera-mode changes are only accepted at rest.
6. Steering input should respond quickly without using the camera as a steering effect.
7. Test real-world performance after each visual pass; generated geometry is not the same as a fully authored photorealistic asset pipeline.

## Network flow

Browser client → WebSocket → Railway game server → server responses/snapshots → browser client.

The client may provide presentation and short-term responsiveness, but server state remains authoritative. A rejected route/action must recover its transition overlay and leave the user in a usable state.

## Source map

- `services/web-client/index.html` — 3D scene, HUD/input, houses/rooms, cars, camera and rendering.
- `services/web-client/public/nrs-online.js` — socket, message methods and events.
- `services/game-server/src/server.ts` — authentication, session and server message handlers.
- `services/game-server/src/world.ts` — housing/workplace definitions and domain rules.
- `docs/IMPLEMENTATION-ROADMAP.md` — all project stages, status, acceptance criteria and handoff commands.
- `docs/STAGE-2-STATUS.md` — current home/garage acceptance checklist.

## Current approval gate

Stage 2 (housing, home exits and car-park route) is still active. It must be tested in the deployed game on Android and explicitly approved before Stage 3 work/jobs/ranks begins.
