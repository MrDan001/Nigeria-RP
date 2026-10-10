# Nigerian Roleplay Simulator (NRS)

A serious, mobile-first, multiplayer Nigerian roleplay simulator built around a persistent player-driven world.

## Current architecture

**NRS is browser-native. Unity is not part of the project.**

- **Three.js + browser JavaScript** — current 3D game client and rendering
- **GitHub** — source control and engineering workflow
- **Vercel** — web/API/admin layer where appropriate
- **TypeScript + WebSocket on Railway** — current real-time multiplayer server
- **PostgreSQL** — persistent game data
- **Redis/equivalent** — transient state where justified

The browser client uses WebGL 2 as the broad compatibility path and can use WebGPU on capable devices. The client is designed for Android browsers first and can later be packaged for app stores without introducing Unity.

## Core rules

- Real players perform meaningful service roles.
- Core jobs happen physically in the world; no click-to-complete shortcuts.
- Valuable game state is server-authoritative.
- Android performance is a first-class requirement, including 3 GB RAM devices.
- Port Harcourt is the first production city.
- **Patches are prohibited as substitutes for root-cause fixes.** Rebuild the responsible component when its design is wrong; do not stack overrides or workarounds.
- Preserve unrelated systems and world geometry unless the user explicitly authorizes changes.
- Every major stage has an approval gate.
- The client is a presentation/input layer; the game server owns simulation and validation.

Read [docs/IMPLEMENTATION-ROADMAP.md](docs/IMPLEMENTATION-ROADMAP.md) first for every planned stage, current progress, developer commands, acceptance criteria and the next approved task. Also see [docs/MASTER-DOCUMENT.md](docs/MASTER-DOCUMENT.md) for the product specification, [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for runtime boundaries and [docs/STAGE-2-STATUS.md](docs/STAGE-2-STATUS.md) for the current housing/car-park gate.

## First browser-playable milestone

Five real players on Android/browser devices must be able to:

1. open the NRS web client;
2. connect to a shared test world;
3. see and move around with other players;
4. interact;
5. enter and drive one vehicle;
6. communicate;
7. start a taxi role;
8. complete a physical taxi job;
9. receive server-validated Naira;
10. disconnect and reconnect with progress intact.

Nothing else outranks making this foundation reliable.


## Account Authentication
Players register with Email, Username (`Firstname_lastname`), Password, and Repeat password; login uses Email and Password.
