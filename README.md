# Nigeria Roleplay Simulator (NRS)

A browser-native, mobile-first multiplayer roleplay game set in Port Harcourt, Rivers State, Nigeria.

> **Current status — 15 October 2026:** Stage 17 — City Explorer Passport & Discovery Rewards — remains the active roadmap stage on main. The citizen phone/SIM, private SMS and voice-call flow is being developed on feat/citizen-tablet-phone-comms; the enhancement is pending CI, multiplayer testing and an approved production release. Do not treat branch changes as deployed.

## Production and deployment

- **Live game:** https://nigeria-rp-production.up.railway.app/
- **Host:** Railway. The production `Nigeria-RP` service builds the browser client and runs the Node.js/WebSocket game server from the repository root.
- **Build:** `npm run build`
- **Start:** `npm run start`
- **Health check:** `/`
- **Persistence:** PostgreSQL through the authoritative game server.

Railway is the production platform for the live game. Do not assume the game is deployed on another host or introduce a hosting migration without explicit approval.

## Current runtime

- **3D client:** Three.js, HTML, CSS and browser JavaScript in `services/web-client/index.html`.
- **Browser network client:** `services/web-client/public/nrs-online.js`.
- **Authoritative server:** TypeScript/Node.js WebSocket runtime in `services/game-server/src/server.ts`.
- **World and domain rules:** `services/game-server/src/world.ts`.
- **Regression tests:** `services/game-server/src/test-stage1.ts` and `services/game-server/src/test-stage2.ts`.

This is a browser-native client. Do not treat Unity or another engine as the current runtime. The browser renders the world and sends requests; the server/database own valuable state. Vehicle movement is still largely client-simulated, so full server-authoritative vehicle physics and replication remain future work.

## Engineering rules

- Server-validate money, bank transactions, inventory, rent, properties, jobs, rank changes, task payouts and permissions.
- Test the real deployed Android/browser experience; a successful build is not visual or multiplayer acceptance.
- Protect unrelated features and geometry when repairing a defect.
- **No patches as substitutes for root-cause fixes.** Correct the responsible component rather than stacking overrides or fallbacks.
- Do not move to the next major stage until the active stage's acceptance checks have passed and the user approves the transition.

## Roadmap and handoff

Read [the full implementation roadmap](docs/IMPLEMENTATION-ROADMAP.md) before changing gameplay. Use [the quick roadmap](docs/ROADMAP.md) to confirm the current stage, [Stage 2 status](docs/STAGE-2-STATUS.md) for housing/garage regression checks, and [Stage 3 status](docs/STAGE-3-STATUS.md) for the active workplace framework and its acceptance gate. See [technical architecture](docs/ARCHITECTURE.md), [browser client architecture](docs/BROWSER-CLIENT-ARCHITECTURE.md), [Railway deployment](docs/RAILWAY-DEPLOYMENT.md), [Stage 7 status](docs/STAGE-7-STATUS.md), [Stage 8 status](docs/STAGE-8-STATUS.md) and [contributing rules](docs/CONTRIBUTING.md).

## First multiplayer foundation milestone

Five real players on Android/browser devices should be able to open the game, connect to one shared world, see and move around with one another, interact, use a vehicle, communicate, complete a physical taxi workflow, receive server-validated Naira, and disconnect/reconnect with progress intact.

## Citizen phone and communications enhancement (in progress)

The feature branch feat/citizen-tablet-phone-comms adds Phone, Messages, Shop Finder and Help apps to the in-game tablet. The intended player flow is: enter Kings Phones & Gadgets, buy a server-validated ₦3,500 SIM, receive a persistent 080 phone number, then call or send private SMS to another online SIM-enabled citizen regardless of their current city. SMS uses the authenticated game WebSocket; voice audio uses WebRTC with the server routing call setup/signaling.

The implementation is not considered accepted until server and browser builds/regression tests pass, two separate accounts verify number persistence and cross-location SMS, and real-device microphone/call behaviour is checked. Voice connectivity may require a TURN relay on networks where STUN-only WebRTC cannot establish a peer connection.

## Accounts

Registration uses Email, Username in `Firstname_lastname` form, Password and Repeat password. Login uses Email and Password.
