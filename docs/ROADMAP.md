# NRS Roadmap — Current Stage and Next Work

The full scope and acceptance checks are in [IMPLEMENTATION-ROADMAP.md](IMPLEMENTATION-ROADMAP.md).

> **Status update: 11 October 2026.** Stage 15 is complete for automated release sequencing. Stage 16 — Distinct City Environments & Regional Identity — is now active on `main`. The Android travel/reconnect walkthrough remains a manual test item.

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
| 15 | Additional cities and inter-city travel | **Complete for automated release sequencing** |
| 16 | Distinct city environments and regional identity | **Active** |

## Active stage: Stage 16 — Distinct City Environments & Regional Identity

Stage 16 defines a differentiated atmosphere and landmark identity for each Stage 15 city. The current release includes seven validated city profiles, separate sky/fog/accent palettes, compact low-poly 3D landmark scenes, and landmark callouts in the mobile travel terminal. Its regression suite is registered in Game Server CI.

Next: refine per-city streetscape/building sets and add city-specific interactions while preserving the current shared simulation rules. Validate the final Stage 16 commit in CI and Railway before claiming the stage complete.

## Manual test queue

Run an Android/mobile walkthrough for Stage 15: book a route, verify fare deduction, reach the destination, refresh/reconnect, and confirm the saved city and balance persist. This is documented as unverified until performed on a real device.
