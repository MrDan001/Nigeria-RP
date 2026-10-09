# NRS Technical Architecture

## Current stack

- **Browser client:** Three.js scene with JavaScript, HTML and CSS HUD in `services/web-client/index.html`; Vite builds the workspace.
- **Network client:** `services/web-client/public/nrs-online.js` communicates by WebSocket.
- **Authoritative game server:** TypeScript/Node.js in `services/game-server/src/server.ts`, hosted on Railway.
- **Durable persistence:** PostgreSQL through the server's storage layer.
- **Web/API and deployment tools:** Vercel and GitHub workflows where configured; not a substitute for the Railway simulation server.

Do not introduce an engine/framework migration without explicit approval and a migration/test plan. The current playable build is not a Unity project or a PlayCanvas client.

## Repository map

```
/
├── services/
│   ├── game-server/       # TypeScript WebSocket server, world rules and tests
│   └── web-client/        # Three.js browser game and WebSocket client
├── docs/                  # product, architecture, stage status and roadmap
├── infrastructure/        # deployment/configuration
└── package.json           # root workspace commands
```

## Runtime boundaries

### Browser client

Responsible for drawing the world, touch/mouse/keyboard controls, camera, local audio/animation, HUD, contextual interactions and rendering state received from the server. It may ask for an action but must not be the source of truth for a valuable state change.

### Game server

Responsible for authenticated sessions, player identity, persisted life state, authorization, domain rules, rent/house ownership, workplace/rank rules as built, server responses and authoritative mutations. Add validation on the server for every valuable action instead of relying on a hidden/disabled browser button.

### PostgreSQL

Source of truth for durable account and game data. Database mutations that couple money with inventory, property or rewards should be atomic or idempotent so retries and reconnects cannot duplicate value.

### Vercel / Railway

Vercel can serve suitable web/API/admin experiences and previews. Railway hosts the current real-time WebSocket game server. Do not place the sole persistent multiplayer simulation in a request-only front end.

## Data ownership rules

Client-owned transient presentation:
- camera angle, touch state, animation timing and UI panel state;
- local rendering and short-lived input.

Server-owned valuable/game state:
- account/session identity;
- money, bank and transactions;
- inventory and item grants;
- owned cars and properties;
- rent settlement/eviction;
- work eligibility, rank, task completion and rewards;
- permissions, health consequences and other persistent progression.

### Vehicles caveat

Driving currently has browser-side simulation. Server-side garage ownership and enter/exit routing are not enough to call vehicle physics authoritative. A future vehicle stage must define and implement server-owned speed/position/collision checks, replication, reconnect handling and exploit tests.

## Networking and performance

Use the existing WebSocket contract and inspect message handlers before adding new messages. Keep message schemas explicit, validate finite/range-limited inputs, and ensure route failures restore the client to a usable state.

Android is a first-class target:
- distance-based world content creation and visibility;
- controlled mesh/material counts, geometry complexity and textures;
- stable frame pacing rather than detail that overloads low-memory devices;
- tested touch targets and landscape camera behavior;
- build and inspect on a real phone after CI.

## Developer workflow and stage gate

From the root:
```bash
npm ci
npm run build
npm run typecheck
npm run test:stage1 --workspace nigeria-rp-game-server
npm run test:stage2 --workspace nigeria-rp-game-server
```

Run/check **Browser Client Build** and **Game Server CI** after pushing. Then verify deployment and test the live game; CI alone does not verify visuals or live interaction.

Read [IMPLEMENTATION-ROADMAP.md](IMPLEMENTATION-ROADMAP.md) for all planned stages, current status, acceptance criteria and next tasks. Stage 2 remains the active gate; Stage 3 must not begin before Stage 2 is tested and explicitly approved.
