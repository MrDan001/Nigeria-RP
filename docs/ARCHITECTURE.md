# NRS Technical Architecture

> **Project status — 11 October 2026:** Stage 3 (workplace/job/rank/faction framework) is the active, user-approved stage. Stage 4 (market salespeople and bank tellers) is next after Stage 3 acceptance is verified. The Face-Me-I-Face-You visibility defect was fixed in commit `6ccc856` and the user confirmed the buildings now appear in the live Railway game; this closes that specific visual defect, not the full housing or Stage 3 acceptance checklist. See [the roadmap](ROADMAP.md) and [the full implementation handoff](IMPLEMENTATION-ROADMAP.md).

## Current production stack

- **Browser client:** Three.js scene and HTML/CSS HUD in `services/web-client/index.html`; Vite packages the web workspace.
- **WebSocket client:** `services/web-client/public/nrs-online.js`.
- **HTTP/static host and authoritative game server:** TypeScript/Node.js in `services/game-server/src/server.ts`, deployed as the `Nigeria-RP` service on Railway.
- **Production build:** repository-root `npm run build`; production start: `npm run start`. The root scripts build the game-server and browser-client workspaces; the server serves the built client and upgrades the same HTTP server to WebSocket.
- **Durable persistence:** PostgreSQL through the server's storage layer.
- **Live URL:** https://nigeria-rp-production.up.railway.app/

The optional API workspace is not the authoritative real-time game runtime. Railway is the production platform for the playable game. Do not introduce another host or engine migration without explicit approval and a documented migration/test plan.

## Repository map

```
/
├── services/
│   ├── game-server/       # TypeScript WebSocket server, world rules and regression tests
│   ├── web-client/        # Three.js browser game and WebSocket client
│   └── api/               # auxiliary API scaffold; not the live simulation host
├── contracts/             # client/server contract notes
├── docs/                  # product, architecture, stage status and handoff
├── infrastructure/        # deployment notes
└── package.json           # root workspace commands
```

## Runtime boundaries

### Browser client

Responsible for world rendering, touch/mouse/keyboard controls, camera, local animation/audio, HUD, contextual prompts and presentation of server state. It may request an action but must not authoritatively award value.

### Game server

Responsible for authenticated sessions, player identity, persistent life state, authorization, domain rules, housing/rent, workplaces/ranks, bank and economy actions, and authoritative mutations. Enforce permissions on the server even when the matching UI action is hidden or disabled.

### PostgreSQL

The durable source of truth for account and game data. Mutations that couple money with inventory, property, work or rewards should be atomic or idempotent where appropriate.

### Vehicle caveat

Vehicle movement remains largely browser-simulated. Garage ownership and route checks do not constitute full server-authoritative physics, collision validation or multiplayer vehicle replication. Do not mark vehicle security complete until those are implemented and tested.

## Data ownership

**Client-owned transient presentation:** camera angle, touch state, animation timing, UI panel state and short-lived input.

**Server-owned valuable/game state:** account/session identity, money, bank transactions, inventory, owned cars/properties, rent settlement/eviction, work eligibility, ranks, task completion/rewards, permissions and persistent health consequences.

## Citizen phone, SMS and voice-call architecture

The phone/communications enhancement is being developed on feat/citizen-tablet-phone-comms; it is not yet a production capability. The design keeps valuable state and authorization on the game server:

- **Identity/persistence:** Life.phoneNumber stores a server-assigned 080XXXXXXXX number, normalized and saved alongside the citizen's other life state in the existing PostgreSQL/file-store persistence layer.
- **SIM purchase:** Kings Phones & Gadgets is the authorized location. The server verifies that the citizen is inside that shop, has enough cash, has no existing number, and that the new number is not already assigned before deducting ₦3,500 and saving the SIM/number.
- **SMS:** the authenticated WebSocket routes a validated private message to the account holding the destination number. City and physical distance do not restrict delivery, but both recipients must currently be online. The current client saves a bounded copy of recent threads in local storage; server-side/offline inbox history is not implemented.
- **Calls:** the server coordinates ring, answer/decline, timeout, hang-up and disconnect cleanup, and forwards WebRTC offer/answer/ICE signaling only between the two participants in the active call. Audio media itself is peer-to-peer; the initial ICE config uses public STUN servers only, so a TURN relay may be needed for reliable calling on restrictive mobile networks.
- **Verification:** build success alone does not prove working audio or cross-location messaging. Test two separate authenticated clients, unique/persistent numbers, SMS in both directions, incoming calls and microphone/audio setup on real devices before release.

## Android and rendering performance

- Target affordable Android phones, including devices with limited RAM.
- Keep geometry, textures, draw calls and per-frame work bounded.
- Seed residential visuals in small asynchronous batches without leaving required homes untracked or repeatedly recreating their meshes.
- Keep the scene responsive during startup and login.
- Use cache-busted client script URLs when browser logic changes.
- Test deployed visuals and touch interactions on a real phone.

## Developer commands

Run from repository root:

```bash
npm ci
npm run build
npm run typecheck
npm run test:stage1 --workspace nigeria-rp-game-server
npm run test:stage2 --workspace nigeria-rp-game-server
```

Run/check the **Browser Client Build** and **Game Server CI** workflows after source changes, then verify the live Railway deployment. CI and health checks do not prove that a 3D interaction behaves correctly on a phone.

## Current gate

Stage 3 (workplace/job/rank/faction framework) is the active, approved stage. Stage 4 (market salespeople and bank tellers) is next after the Stage 3 acceptance checklist in [STAGE-3-STATUS.md](STAGE-3-STATUS.md) is passed and the user approves the transition. The Face-Me-I-Face-You visibility fix is deployed and user-confirmed; other housing/garage checks remain regression items rather than evidence that Stage 3 is complete.
