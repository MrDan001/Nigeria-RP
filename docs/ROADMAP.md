# NRS Roadmap — Current Stage and Next Work

The full scope, dependencies, acceptance checks, test commands and developer handoff are in [IMPLEMENTATION-ROADMAP.md](IMPLEMENTATION-ROADMAP.md). Stage-specific implementation details are recorded in [Stage 4 status](STAGE-4-STATUS.md) and [Stage 5 status](STAGE-5-STATUS.md).

> **Status update: 11 October 2026.** Stage 3 was accepted by the user. Stage 4 market/bank services have been implemented and deployed to Railway. **Stage 5 — hospital, ambulance, pharmacy and City Park player-to-worker interactions — is now active.** The earlier Face-Me-I-Face-You exterior visibility fix remains a protected regression boundary.

## Stage table

| Stage | Canonical scope | Status |
|---|---|---|
| 0 | Repository, server, persistence, CI and Railway deployment foundation | Foundation exists; maintain and verify |
| 1 | Citizen accounts, saved life and multiplayer | Core code exists; keep as regression coverage; multi-device capacity still requires measurement |
| 2 | Homes, rent, residential exteriors/interiors and car-park routes | Core code deployed; Face-Me visibility defect fixed and user-confirmed; remaining housing/garage checks remain explicit regression closeout |
| 3 | Workplace locations and reusable jobs/ranks/factions engine | **ACCEPTED by user; automated regression coverage retained; two-account Android visual check not performed by agreement because the user is the sole tester** |
| 4 | Market salespeople and bank tellers | **Implemented and deployed**; server-authoritative goods/stock/commissions, manager restock, deposits/withdrawals, receipts and history |
| 5 | Hospital treatment workflows and parks | **ACTIVE**; patient requests, triage, treatment, ambulance assignment/field care, pharmacy, park daily passes and visitor assistance being integrated and verified |
| 6 | Rivers State government and civic finance | Planned |
| 7 | Police, Army, FRSC and Fire Service | Planned |
| 8 | Rivers News Network | Planned |
| 9 | Transport, passengers and haulage | Planned |
| 10 | Food businesses and everyday shops | Planned |
| 11 | Personal services, property services and utilities | Planned |
| 12 | Education, offices, oil and industry | Planned |
| 13 | Economy balance, safety and polish | Planned |
| 14 | Release, load and recovery validation | Planned |
| 15 | Additional cities and inter-city travel | Planned |

## Active stage: Stage 5 — hospital and park services

The core principle is that **citizens can discover and contact available workers through friendly in-game panels, while workers see queues and complete service requests through a validated server workflow**.

Hospitals reuse `hospital-main` and `hospital-princess`. Patients can see available staff, request care, follow triage status, request ambulance help for serious injuries, and buy stocked medicine from another eligible worker who is on duty and present. Regular clinical care requires triage; treatment/fees, health changes, inventory, stock, receipts and request state are server-authoritative. Ambulance dispatch requires a Nurse-or-higher responder, who must reach the assigned patient in a public area before field treatment.

City Park reuses `park-main`. Visitors can buy a daily pass from another on-duty Ticket Seller, request visitor assistance/lost-and-found/first-aid help, and receive notices when the park team responds. Park employees receive a queue of requests from visitors at the park. The current pass is receipt-backed but does **not yet physically unlock a gate**. Respawn routing to a designated public park/parking point also remains open for review.

## Final Stage 5 checks

- Complete the current commit's Game Server CI, Browser Client Build and Android debug APK build.
- Confirm the latest Railway deployment is healthy and the public `/` health check works.
- Run the solo Android visual walkthrough of the hospital and park panels, and verify that status/receipt updates refresh after each action.
- Continue using deterministic tests for permissions, replay, stock, money and cross-account domain scenarios; do not claim two-player live testing if a second session was unavailable.
- Keep unresolved items—especially physical park-gate enforcement and public respawn routing—visible rather than declaring them complete.

## Production and engineering boundaries

- **Production host:** Railway — https://nigeria-rp-production.up.railway.app/
- **Client:** Three.js browser game in `services/web-client/index.html`; WebSocket bridge in `services/web-client/public/nrs-online.js`.
- **Server:** TypeScript/Node.js WebSocket service in `services/game-server/src/server.ts`.
- **Durable data:** PostgreSQL with the existing file-store path retained.
- **Vehicle caveat:** driving remains largely client-simulated; full authoritative vehicle physics and replication are not complete.
- **Root-cause rule:** preserve unrelated roads, roundabouts, controls, housing state and economy. Do not build a workaround that bypasses the canonical server-authoritative request/receipt flow.
