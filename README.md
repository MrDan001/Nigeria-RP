# Nigerian Roleplay Simulator (NRS)

A serious, mobile-first, multiplayer Nigerian roleplay simulator built around a persistent player-driven world.

## Current architecture

**NRS is browser-native. Unity is not part of the project.**

- **PlayCanvas Engine + TypeScript** — 3D game client
- **GitHub** — source control and engineering workflow
- **Vercel** — web/API/admin layer where appropriate
- **Railway** — authoritative real-time multiplayer game server
- **PostgreSQL** — persistent game data
- **Redis/equivalent** — transient state where justified

The browser client uses WebGL 2 as the broad compatibility path and can use WebGPU on capable devices. The client is designed for Android browsers first and can later be packaged for app stores without introducing Unity.

## Core rules

- Real players perform meaningful service roles.
- Core jobs happen physically in the world; no click-to-complete shortcuts.
- Valuable game state is server-authoritative.
- Android performance is a first-class requirement, including 3 GB RAM devices.
- Port Harcourt is the first production city.
- No architectural patching: broken foundations are rebuilt correctly.
- Every major stage has an approval gate.
- The client is a presentation/input layer; the game server owns simulation and validation.

See docs/MASTER-DOCUMENT.md for the complete product and technical specification.

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
