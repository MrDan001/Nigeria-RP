# NRS Roadmap — Current Stage and Next Work

The full scope, dependencies, acceptance checks, test commands and developer handoff are in [IMPLEMENTATION-ROADMAP.md](IMPLEMENTATION-ROADMAP.md). Stage-specific implementation details are recorded in [Stage 4 status](STAGE-4-STATUS.md) and [Stage 5 status](STAGE-5-STATUS.md).

> **Status update: 11 October 2026.** Stages 0–5 are marked done for sequencing at the user's direction. Stages 6 and 7 are deployed to Railway; Stage 7's 13-test suite, Stage 1–7 regression, typecheck, server/browser builds and Android debug-APK workflow passed. Stage 8 — Rivers News Network — is implemented on `main`; CI and Railway rollout follow this commit. Real-device/two-account checks remain separate.

## Stage table

| Stage | Canonical scope | Status |
|---|---|---|
| 0 | Repository, server, persistence, CI and Railway deployment foundation | Done for sequencing; foundation checks retained |
| 1 | Citizen accounts, saved life and multiplayer | Done for sequencing; automated regression passed |
| 2 | Homes, rent, residential exteriors/interiors and car-park routes | Done for sequencing; key visibility fix user-confirmed |
| 3 | Workplace locations and reusable jobs/ranks/factions engine | Done for sequencing; automated regression passed |
| 4 | Market salespeople and bank tellers | Done for sequencing; automated regression passed |
| 5 | Hospital treatment workflows and parks | Done for sequencing; automated regression passed |
| 6 | Rivers State government and civic finance | Deployed; Stage 1–6 CI and browser build passed |
| 7 | Police, Army, FRSC and Fire Service | Deployed; 13 Stage 7 tests and CI passed |
| 8 | Rivers News Network | Implemented on main; CI/deployment verification pending |
| 9 | Transport, passengers and haulage | Planned |
| 10 | Food businesses and everyday shops | Planned |
| 11 | Personal services, property services and utilities | Planned |
| 12 | Education, offices, oil and industry | Planned |
| 13 | Economy balance, safety and polish | Planned |
| 14 | Release, load and recovery validation | Planned |
| 15 | Additional cities and inter-city travel | Planned |

## Active stage: Stage 8 — Rivers News Network

Stage 7 is on `main` at commit `3d50df0da4a1cfb749bbc56d9a844c2a6ca1d29e`; Railway production is healthy. Stage 8 reuses the existing walkable `news-main` newsroom/studio and six-rank career ladder. Rank 3+ newsroom employees can submit event-based stories into a private queue; rank 5+ Editors approve/reject and rank 4+ Anchors broadcast only approved reports. The public feed and lightweight ticker update via WebSocket. Server-side rank, assignment, duty, uniform and newsroom-location checks protect editorial actions. Cooldowns, replay protection, profanity filtering, citizen reports, protected moderation and an audit log are included. Stage 8 CI and Railway verification follow this release.

## Stage 5 acceptance history — hospital and park services

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
