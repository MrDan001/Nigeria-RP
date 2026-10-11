# NRS Roadmap — Current Stage and Next Work

The full scope and acceptance checks are in [IMPLEMENTATION-ROADMAP.md](IMPLEMENTATION-ROADMAP.md).

> **Status update: 11 October 2026.** Stage 15 is complete for the automated release gate and its live transaction/persistence integration test passes. Railway production is online. Stage 16 — Distinct City Environments & Regional Identity — is now active on `main`. Real-device Android walkthroughs remain manual follow-up work.

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
| 14 | Release, load and recovery validation | Complete for automated release gate |
| 15 | Additional cities and inter-city travel | **Complete for automated release gate** |
| 16 | Distinct city environments and regional identity | **Active** |

## Active stage: Stage 16 — Distinct City Environments & Regional Identity

The seven Stage 15 cities have validated environment profiles, separate sky/fog/accent palettes, city-specific low-poly landmarks, an off-road civic plaza with themed shopfronts and street furniture, and an on-foot district-guide interaction listing local activities and landmarks. Profiles are returned by the game server and applied on city arrival. Stage 16 catalogue tests validate each city’s guide content in Game Server CI.

The latest automated checkpoint passed all Game Server tests, typecheck, server/client builds and the Railway deployment gate. The remaining Stage 16 acceptance work is a real-device visual and end-to-end walkthrough, followed by any placement adjustments the test reveals.

## Manual test queue

Run a physical Android/mobile walkthrough for Stages 15–16: select a route, confirm fare deduction, arrive in the destination city, reconnect, and verify the saved city and cash persist. Inspect the new landmark models for road/spawn clearance and mobile performance. These manual actions remain unverified until performed on a device.
