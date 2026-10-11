# NRS Roadmap — Current Stage and Next Work

The full scope and acceptance checks are in [IMPLEMENTATION-ROADMAP.md](IMPLEMENTATION-ROADMAP.md).

> **Status update: 11 October 2026.** Stage 14 release validation has passed its automated gate and Railway production deployment is successful. Stage 15 — Additional Cities & Inter-City Travel — is now the active stage.

## Stage table

| Stage | Canonical scope | Status |
|---|---|---|
| 0 | Repository, server, persistence, CI and Railway deployment foundation | Done for sequencing |
| 1 | Citizen accounts, saved life and multiplayer | Done for sequencing |
| 2 | Homes, rent, residential exteriors/interiors and car-park routes | Done for sequencing |
| 3 | Workplace locations and reusable jobs/ranks/factions engine | Done for sequencing |
| 4 | Market salespeople and bank tellers | Done for sequencing |
| 5 | Hospital treatment workflows and parks | Done for sequencing |
| 6 | Rivers State government and civic finance | Deployed |
| 7 | Police, Army, FRSC and Fire Service | Deployed |
| 8 | Rivers News Network | Implemented |
| 9 | Transport, passengers and haulage | Implemented |
| 10 | Food businesses and everyday shops | Implemented as server foundation |
| 11 | Personal services, property services and utilities | Implemented as server foundation |
| 12 | Education, offices, oil and industry | Implemented |
| 13 | Economy balance, safety and polish | Implemented |
| 14 | Release, load and recovery validation | **Complete for automated release gate** |
| 15 | Additional cities and inter-city travel | **Active** |

## Active stage: Stage 15 — Additional Cities & Inter-City Travel

Stage 15 now has an authoritative city/route engine in `services/game-server/src/stage15.ts` and deterministic coverage in `test-stage15.ts`. The initial expansion includes Port Harcourt, Aba, Owerri, Uyo, Warri, Yenagoa and Benin City, with route distance, duration, capacity and Naira fare data.

Travel requests reject invalid routes, invalid passenger counts, insufficient balances and replayed request IDs. The next implementation step is to connect this engine to the authoritative server transaction/persistence path and the browser travel terminal/city transition, then release through CI and Railway.
