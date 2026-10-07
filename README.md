# Nigerian Roleplay Simulator (NRS)

A mobile-first, multiplayer Nigerian roleplay simulator built around a persistent player-driven world.

## Project status

**Stage 0 — Foundation**

This repository is intentionally starting clean. We are establishing the architecture before building gameplay systems.

## Core rules

- Real players perform meaningful service roles.
- Core jobs happen physically in the world; no click-to-complete shortcuts.
- Valuable game state is server-authoritative.
- Android performance is a first-class requirement, including 3 GB RAM devices.
- Port Harcourt is the first production city.
- No architectural patching: broken foundations are rebuilt correctly.
- Every major stage has an approval gate.

## Planned stack

- Unity — Android game client
- GitHub — source control and engineering workflow
- Vercel — web/API/admin layer where appropriate
- Dedicated real-time game server — authoritative multiplayer simulation
- PostgreSQL — persistent game data
- Redis/equivalent — transient state where justified

See `docs/MASTER-DOCUMENT.md` for the complete product and technical specification.

## First playable milestone

Five real players on low-end Android devices must be able to:

1. connect to a shared test world;
2. walk and see each other;
3. interact;
4. enter and drive one vehicle;
5. communicate;
6. start a taxi role;
7. complete a physical taxi job;
8. receive server-validated Naira;
9. disconnect and reconnect with progress intact.

Nothing else outranks making this foundation reliable.
