# NRS Roadmap — Current Stage and Next Work

The implementation scope and acceptance checks are in IMPLEMENTATION-ROADMAP.md.

> Status update: 14 October 2026. Stage 16 was accepted by the project owner. Stage 17 — City Explorer Passport & Discovery Rewards — is active on main. Railway is the production host.

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
| 14 | Release, load and recovery validation | Complete for automated release gate |
| 15 | Additional cities and inter-city travel | Complete for automated release gate |
| 16 | Distinct city environments and regional identity | Complete — owner accepted |
| 17 | City Explorer Passport & Discovery Rewards | Active |
| Enhancement | Port Harcourt courier pickup/drop-off coverage | Source updated; live verification pending |

## Active stage: Stage 17 — City Explorer Passport & Discovery Rewards

Players receive a persistent passport showing cities visited and a one-time ₦1,500 bonus for each first-time arrival in a new destination. Revisits do not pay the discovery bonus again. The server owns discovery validation, rewards, replay protection and persistence; the browser only displays the saved passport. Automated tests cover one-time rewards, returning visits, separate accounts and malformed stored state.

## Stage 16 — Accepted

The seven city environments, low-poly landmarks, off-road civic plaza, themed shopfronts and local-district guide are deployed. The project owner accepted Stage 16 and authorized progression on 11 October 2026. Physical-device visual review remains optional polish and is not claimed as independently performed.

## Manual test queue

For Stage 17, verify first-visit rewards, repeat-visit behavior, saved passport progress after reconnect/restart, and the passport sheet on a physical phone. Stage 15–16 visual polish can be recorded separately without blocking the approved Stage 17 work.

## Gameplay enhancement — Port Harcourt courier coverage (14 October 2026)

Implemented in the browser source:
- [x] Replace the three hard-coded delivery coordinates with a generated address pool sourced from the housing catalogue, apartment entrances, shops, banks, named workplaces/public buildings and registered city structures.
- [x] Make each courier job a two-stop route: collect the parcel at one address, then deliver it to another.
- [x] Cycle recipient addresses through the full generated pool so a location can be used as both a pickup and a destination.
- [x] Calculate distance-based rewards with a minimum and maximum payout.
- [x] Point the in-world beacon, mission HUD, expanded map and service map at the current pickup/drop-off stop.
- [ ] Run the browser-client syntax/build checks and manually verify pickup, drop-off and reachability on desktop/mobile.
