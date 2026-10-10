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

Stage 3 was explicitly approved by the user on 10 October 2026. Proceed with server-authoritative employment, faction applications and leadership, clock-in/out, timed paid tasks, rank management and test coverage. The user specifically requested two hospital exteriors in this stage: **Mile One General Hospital in Mile 1** and **Princess Hospital along Trans Amadi Road**. These are content additions; the existing main-road and roundabout arrays must remain untouched.

Stage 2 visual acceptance is still pending, and additional houses are intentionally deferred. Keep current homes, account/persistence features, the existing delivery job, road network, roundabouts and driving controls intact. Run Stage 1/2 tests, Stage 3 tests, **Browser Client Build** and **Game Server CI** before merging. Green CI is necessary, but does not prove the game looks or behaves correctly in a browser.

Faction leadership is server-controlled. Boss appointment uses the optional NRS_FACTION_ADMINS comma-separated username allow-list; a normal client must never be able to claim a faction boss seat.

## Required engineering standard

Patches are prohibited as a substitute for a root-cause fix. Diagnose the authoritative data flow and the component responsible for a defect; repair or rebuild that component, remove stale workaround code, and test the exact failure scenario. Do not modify unrelated roads, roundabouts, saved accounts, controls, economy, or other systems without explicit authorization.

For multiplayer identity labels, test both the local avatar with only one player online and remote avatars with two or more players online. Identity must come from the authenticated session/server snapshot, not from optional or nonexistent DOM nodes. Validate that the renderer attaches the label to the avatar and that the deployed browser is loading the latest client script.

## Project boundaries

The browser game currently uses Three.js from `services/web-client/index.html`; the game server is TypeScript/WebSocket in `services/game-server/src/server.ts`. The server/database must own valuable state. Vehicle movement still needs server-authoritative simulation before the car system can be called production-ready.

See:
- [Full implementation roadmap and developer handoff](IMPLEMENTATION-ROADMAP.md)
- [Master product specification](MASTER-DOCUMENT.md)
- [Technical architecture](ARCHITECTURE.md)
- [Browser client architecture](BROWSER-CLIENT-ARCHITECTURE.md)
- [Stage 2 status and test notes](STAGE-2-STATUS.md)
