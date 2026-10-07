# NRS Browser Client Architecture

## Decision

NRS uses a browser-native 3D client. Unity is not a project dependency and must not be reintroduced for core development.

## Client stack

- TypeScript
- Vite
- PlayCanvas Engine
- WebGL 2 compatibility path
- WebGPU opportunistic path
- HTML/CSS DOM overlay for mobile HUD and controls
- WebSocket connection to the authoritative Railway game server

## Responsibilities

### Browser client
- Render the 3D world.
- Capture touch, mouse and keyboard input.
- Display HUD, phone, inventory, menus and contextual interaction prompts.
- Interpolate/render server state smoothly.
- Send player input and interaction requests.
- Never authoritatively award money, items, jobs, vehicles or progression.

### Game server
- Own simulation time and authoritative state.
- Validate movement and interaction requests.
- Own player sessions, jobs, vehicles, economy and world state.
- Persist durable state to PostgreSQL.
- Replicate only the state relevant to connected players.

## Mobile performance principles

1. WebGL 2 remains a first-class fallback for broad Android compatibility.
2. WebGPU is an optimization, not a requirement.
3. Cap render resolution/pixel ratio on low-end devices.
4. Stream world assets rather than loading the whole city at startup.
5. Use LODs, instancing, compressed textures and aggressive visibility culling.
6. Keep simulation on the server and keep client-side effects cheap.
7. Target stable frame pacing before visual complexity.

## Network flow

Browser -> WebSocket -> Railway authoritative server -> snapshots -> browser.

The client never treats local prediction as truth. Prediction/interpolation can be added for responsiveness, but server correction remains authoritative.

## First client milestone

A small Port Harcourt laboratory scene must support:

- live Railway connection;
- local player rendering;
- other-player rendering;
- touch joystick;
- interaction request;
- reconnect loop;
- responsive Android layout.

After that foundation is approved, persistence and the first physical role/job system become the next priority.
