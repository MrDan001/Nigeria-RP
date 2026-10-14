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
| UI enhancement | Job Center touch actions and Careers & factions presentation | Implemented on feature branch; automated and device verification pending |

## Active stage: Stage 17 — City Explorer Passport & Discovery Rewards

Players receive a persistent passport showing cities visited and a one-time ₦1,500 bonus for each first-time arrival in a new destination. Revisits do not pay the discovery bonus again. The server owns discovery validation, rewards, replay protection and persistence; the browser only displays the saved passport. Automated tests cover one-time rewards, returning visits, separate accounts and malformed stored state.

## Stage 16 — Accepted

The seven city environments, low-poly landmarks, off-road civic plaza, themed shopfronts and local-district guide are deployed. The project owner accepted Stage 16 and authorized progression on 11 October 2026. Physical-device visual review remains optional polish and is not claimed as independently performed.

## Manual test queue

For Stage 17, verify first-visit rewards, repeat-visit behavior, saved passport progress after reconnect/restart, and the passport sheet on a physical phone. Stage 15–16 visual polish can be recorded separately without blocking the approved Stage 17 work.

## Gameplay enhancement — Port Harcourt courier coverage (14 October 2026)

Implemented in the browser source:
- [x] Replace the three hard-coded delivery coordinates with an address pool spanning the full housing catalogue (huts, compound rooms, flats, estates, mansions, palaces and grand homes), plus allowlisted static and procedurally generated apartment/building entrances, shops, banks and named workplaces/public buildings.
- [x] Make each courier job a two-stop route: collect the parcel at one address, then deliver it to another.
- [x] Cycle recipient addresses through the full generated pool so a location can be used as both a pickup and a destination.
- [x] Calculate distance-based rewards with a minimum and maximum payout.
- [x] Point the in-world beacon, mission HUD, expanded map and service map at the current pickup/drop-off stop.
- [x] Validate static and procedurally generated apartment entrance metadata, pickup completion and payout on the game server; calculate rewards server-side.
- [x] Browser-client production build passed in GitHub Actions.
- [ ] Manually verify pickup, drop-off, reachability and touch controls on desktop/mobile.


## UI enhancement — Job Center and Careers & factions (14 October 2026)

**Status: SOURCE UPDATED ON `fix/job-center-touch-ui-20261014`; build/CI and live-device acceptance pending.**

- [x] Fix the delegated modal click handler to resolve the actual button with `closest("button")`; tapping the nested icon/label inside the delivery button previously produced a child target without the button's `data-j` action.
- [x] Show a clear pending state while the delivery acceptance request is sent, prevent duplicate taps, and surface a failed server response inside the Job Center.
- [x] Redesign the Job Center around pickup and drop-off steps, the ₦ reward, route coverage and a high-contrast, touch-friendly accept button.
- [x] Refresh Careers & factions quick-service shortcuts for Emergency Services, City News, and Transport & Haulage.
- [x] Refresh asset query versions for the modified browser scripts and stylesheet.
- [x] Parse each modified JavaScript source fragment successfully; the stylesheet's braces are balanced.
- [ ] Run the repository's own web-client syntax/build commands and project regression/CI gates.
- [ ] Test the Accept delivery action, Careers & factions shortcuts, pickup/drop-off completion, and error feedback on a real Android device.

The current PR's Vercel status points to a `build-rate-limit` page, so it is not evidence of a successful preview build. The repository build and Railway deployment remain unverified for this branch.

These source changes are in a feature branch and are not represented as merged or live in Railway until the branch is reviewed, merged, deployed and manually verified.
