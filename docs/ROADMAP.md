# NRS Roadmap — Current Stage and Next Work

The implementation scope and acceptance checks are in IMPLEMENTATION-ROADMAP.md.

> Status update: 15 October 2026. Stage 16 was accepted by the project owner. Stage 17 — City Explorer Passport & Discovery Rewards — remains active on main. Citizen Tablet Phone, SIM, SMS & Voice Calls is being developed on feat/citizen-tablet-phone-comms; CI, two-account multiplayer testing and production release are pending. Railway remains the production host.

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
| Enhancement | Citizen tablet phone, SIM, private SMS and voice calls | In progress on feature branch; CI and real-device verification pending |

## Active stage: Stage 17 — City Explorer Passport & Discovery Rewards

Players receive a persistent passport showing cities visited and a one-time ₦1,500 bonus for each first-time arrival in a new destination. Revisits do not pay the discovery bonus again. The server owns discovery validation, rewards, replay protection and persistence; the browser only displays the saved passport. Automated tests cover one-time rewards, returning visits, separate accounts and malformed stored state.

## Stage 16 — Accepted

The seven city environments, low-poly landmarks, off-road civic plaza, themed shopfronts and local-district guide are deployed. The project owner accepted Stage 16 and authorized progression on 11 October 2026. Physical-device visual review remains optional polish and is not claimed as independently performed.

## Gameplay enhancement — Citizen Tablet Phone, SIM & Communications (15 October 2026)

**Status: IN PROGRESS — feature branch only; not deployed.**

- [x] Add Phone and Messages apps to the existing tablet home screen, plus Shop Finder and Help & guide.
- [x] Add a SIM item at Kings Phones & Gadgets, with server-side checks for shop location, funds, duplicate SIM and phone-number assignment.
- [x] Persist a citizen's assigned Nigerian 080 phone number in the saved life record.
- [x] Add private SMS delivery between online citizens by phone number, without a same-city restriction; show a conversation on both clients.
- [x] Add server-coordinated incoming/outgoing call states, answer/decline/hang-up and WebRTC audio signaling.
- [x] Add regression coverage for SIM-number persistence and invalid saved numbers.
- [x] Roll back the SIM's number, inventory and cash in memory when persistence fails; rate-limit repeated SMS and call requests.
- [x] Server TypeScript check, server production build, browser syntax/build, Stage 1 phone-number regression checks and Stage 18 tests passed.
- [ ] Full Game Server CI is blocked by the pre-existing Stage 15 live integration test: it sends the legacy authRegister request and waits for authOk, but that request is not handled by the current main-branch server. Update that test harness separately rather than treating this as phone-feature acceptance.
- [ ] Test two independent characters/accounts purchasing unique SIMs, logging out/in, cross-location SMS, inbound calls, decline, missed call, hang-up and reconnect.
- [ ] Verify microphone permissions, audio playback and call setup on two real devices/networks. Add/configure TURN before claiming robust calling across restrictive carrier NATs.
- [ ] Merge/release only after CI and manual acceptance; then confirm Railway deployment and cache invalidation.

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
