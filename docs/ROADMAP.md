# NRS Roadmap — Current Stage and Next Work

The full scope, dependencies, acceptance checks, test commands and developer handoff are in [IMPLEMENTATION-ROADMAP.md](IMPLEMENTATION-ROADMAP.md). This file is the short stage-status index.

> **Last status update: 11 October 2026.** The Face-Me-I-Face-You exterior visibility defect was fixed in commit `6ccc856`, deployed to Railway, and confirmed visible by the user. That confirms the specific rendering defect only. **Stage 3 is the current approved stage; Stage 4 is next after Stage 3 acceptance passes and the user approves transition.**

## Stage table

| Stage | Canonical scope | Status |
|---|---|---|
| 0 | Repository, server, persistence, CI and Railway deployment foundation | Foundation exists; maintain and verify |
| 1 | Citizen accounts, saved life and multiplayer | Core code exists; keep as regression coverage; real multi-device capacity still requires measurement |
| 2 | Homes, rent, residential exteriors/interiors and car-park routes | Core code deployed; Face-Me visibility defect fixed and user-confirmed; rental/garage acceptance and catalogue alignment still need closeout |
| 3 | Workplace locations and reusable jobs/ranks/factions engine | **ACTIVE — user-approved; implementation is present, acceptance/live verification still required** |
| 4 | Market salespeople and bank tellers | **NEXT after Stage 3 gate; some early market/bank/storefront groundwork already exists, but end-to-end acceptance is not complete** |
| 5 | Hospital treatment workflows and parks | Planned; hospital exteriors already exist, clinical/park gameplay is future scope |
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

## Active stage: Stage 3

Stage 3 was explicitly approved on 10 October 2026. The focus is workplace locations, server-authoritative employment, six-rank ladders, hiring/approval, boss-only staff management, duty/uniform rules, contextual tasks/payouts, workplace interiors and multiplayer identity presentation.

Completion requires server tests for permissions and replay resistance, persistence/reconnect checks, two-account testing, Android live verification, both CI workflows and explicit user approval. A visible panel or healthy deployment alone is not sufficient.

## Next stage: Stage 4

Stage 4 focuses on market salespeople and bank tellers: real customer orders, stock/till/commission settlement, supported deposits and withdrawals, receipts and transaction history. Some banking, transfer and shop-interior code is already present in the source; treat it as groundwork, not accepted completion. Do not start the formal Stage 4 gate until Stage 3 passes.

## Production and engineering boundaries

- **Production host:** Railway — https://nigeria-rp-production.up.railway.app/
- **Client:** Three.js browser app in `services/web-client/index.html`, with networking in `services/web-client/public/nrs-online.js`.
- **Server:** TypeScript/Node.js WebSocket service in `services/game-server/src/server.ts`.
- **Durable data:** PostgreSQL.
- **Vehicle caveat:** driving is still largely client-simulated; full authoritative physics and replication are not complete.
- **Root-cause rule:** no patches as a substitute for fixing the responsible component; preserve unrelated roads, roundabouts, controls, housing state and economy.

See [Stage 2 checks](STAGE-2-STATUS.md), [Stage 3 acceptance](STAGE-3-STATUS.md), [architecture](ARCHITECTURE.md), [browser client architecture](BROWSER-CLIENT-ARCHITECTURE.md), and [Railway deployment](RAILWAY-DEPLOYMENT.md).
