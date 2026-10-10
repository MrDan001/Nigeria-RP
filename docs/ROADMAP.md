# NRS Roadmap — Stage Status and Next Approved Work

The complete scope, sequence, implementation notes, acceptance checks and developer commands are in **[IMPLEMENTATION-ROADMAP.md](IMPLEMENTATION-ROADMAP.md)**. Read that handoff before starting work.

## Current status — October 2026

| Stage | Scope | Status |
|---|---|---|
| 0 | Repository, server, persistence, CI and deployment foundation | Foundation exists; maintain it |
| 1 | Accounts, saved life, reconnect and multiplayer visibility | Core code exists; real-player testing remains |
| 2 | Homes/rent, realistic exterior/interior, private car park, driving exit | In progress — visual checks and later house additions remain |
| 3 | Workplace/job engine, staff ranks, boss permissions, factions and payroll | **In progress — user approved; first implementation pass** |
| 4 | Markets, shops, food and everyday economy | Planned |
| 5 | Banking, treasury and auditable financial records | Planned |
| 6 | Health, hospital, pharmacy and recreation | Planned |
| 7 | Police, FRSC, fire and military services | Planned |
| 8 | Taxi, keke, danfo, bus routes and passenger workflows | Planned |
| 9 | Communications, phone, news and social systems | Planned |
| 10 | Government and civic institutions | Planned |
| 11 | Utilities and education | Planned |
| 12 | Offices, oil/gas and industry | Planned |
| 13 | Port Harcourt content, streets/buildings, traffic and optimization | Planned |
| 14 | Onboarding, economy balance, anti-cheat and moderation | Planned |
| 15 | Release/load/recovery testing and additional cities | Planned |

## Current gate

Do **not** start Stage 3 yet. Finish Stage 2, run server tests plus **Browser Client Build** and **Game Server CI**, verify the live flow on Android, document failures, and get explicit user approval. Green CI is necessary, but it does not prove the game looks or behaves correctly in a browser.

## Project boundaries

The browser game currently uses Three.js from `services/web-client/index.html`; the game server is TypeScript/WebSocket in `services/game-server/src/server.ts`. The server/database must own valuable state. Vehicle movement still needs server-authoritative simulation before the car system can be called production-ready.

See:
- [Full implementation roadmap and developer handoff](IMPLEMENTATION-ROADMAP.md)
- [Master product specification](MASTER-DOCUMENT.md)
- [Technical architecture](ARCHITECTURE.md)
- [Browser client architecture](BROWSER-CLIENT-ARCHITECTURE.md)
- [Stage 2 status and test notes](STAGE-2-STATUS.md)
