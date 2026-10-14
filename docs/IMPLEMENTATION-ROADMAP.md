# Nigeria RP — Full Implementation Roadmap & Developer Handoff

> **Current status, 14 October 2026:** Stage 14 automated release validation is complete. Stage 15 has passed its automated live integration/release gate. Stage 16 — Distinct City Environments & Regional Identity — was accepted by the project owner on 11 October 2026. Stage 17 — City Explorer Passport & Discovery Rewards — is active on main.

## Stage 15 — Additional cities and inter-city travel
**Status: COMPLETE FOR AUTOMATED RELEASE GATE**

The server owns route identity, capacity, fare, duration, balance validation, persistent destination and replay protection. The client requests travel and renders the resulting city/route state.

Implemented:
- [x] Seven-city catalogue: Port Harcourt, Aba, Owerri, Uyo, Warri, Yenagoa and Benin City.
- [x] Twenty directed routes with distance, travel time, capacity and Naira fares, including return journeys.
- [x] Server-authoritative fare validation and deduction inside the shared money mutation queue.
- [x] Persisted city identity in PostgreSQL and file-store fallback.
- [x] Durable trip ledger, replay rejection, recent trip history and rollback on failed persistence.
- [x] City-scoped snapshots and travel departure/arrival broadcast handling.
- [x] Responsive browser travel terminal, route/passenger selection, fare display, arrival transition and cash refresh.
- [x] Saved-city resume/reconnect.
- [x] Deterministic Stage 15 tests and live WebSocket integration test registered in Game Server CI.
- [x] Live integration proves fare deduction, low-balance rejection, city/cash persistence after server restart and replay rejection after restart.
- [x] Stage 1–16 regression suite, typecheck, server build and browser-client production build passed on commit `1327ddc61dae0e4f8be02d5c3e1ddd8ff8c966d2`.
- [x] Railway production deployment succeeded; production service reports online with no current warning/critical issues.

Manual acceptance:
- [ ] Physical Android/mobile route, arrival, reconnect and persistence walkthrough.
- [ ] Visual check of city spawn safety and landmark clearance on a device.

## Stage 16 — Distinct city environments and regional identity
**Status: COMPLETE — ACCEPTED BY PROJECT OWNER**

Implemented:
- [x] Validated environment profiles and distinct sky/fog/accent palettes for all seven travel cities.
- [x] City-specific low-poly landmarks and landmark names.
- [x] Off-road civic plaza, themed shopfronts, trees, benches, street lights and information pavilion.
- [x] On-foot district guide listing city-specific activities and regional landmarks.
- [x] Automated catalogue, game-server, browser build and Railway release checks passed for the deployed checkpoint.
- [x] Project owner accepted Stage 16 and authorized Stage 17 progression on 11 October 2026.

Optional post-acceptance polish:
- [ ] Physical-device visual walkthrough of landmark clearance, movement, frame performance and touch usability.

The owner's acceptance is recorded as an explicit decision to proceed; it does not claim that a physical-device test was independently run. The low-poly landmark models are stylized, not 1:1 photogrammetric replicas.

## Stage 17 — City Explorer Passport & Discovery Rewards
**Status: IN PROGRESS**

Goal: turn inter-city travel into a persistent exploration objective while preventing reward farming through repeat journeys.

Implemented:
- [x] A player-scoped passport records the starting city and each new destination.
- [x] A first server-validated arrival in a previously unstamped city awards ₦1,500; repeated arrivals in already stamped cities award ₦0.
- [x] The passport displays cities visited out of seven, current city, collected stamps and total discovery rewards.
- [x] Reward validation and request replay protection are server-owned.
- [x] Passport state and reward ledger are persisted using the existing PostgreSQL world store with file-store fallback.
- [x] Regression tests cover first arrival, repeat visit, account isolation, replay rejection and malformed stored state.
- [ ] Verify live first-arrival and repeat-visit behavior on Railway.
- [ ] Confirm passport progress survives reconnect/restart and inspect the passport sheet on a physical phone.

The existing fare calculation and travel-route authorization remain authoritative. The discovery reward is applied to the same server-side cash transaction, not calculated by the client.

## Gameplay enhancement — Port Harcourt courier routes
**Status: SOURCE UPDATED; AUTOMATED BUILD AND LIVE PLAYTEST PENDING**

- [x] Delivery routes cover the full residential catalogue (huts, compound rooms, flats, estates, mansions, palaces and grand homes) plus allowlisted static apartment/building entrances, retail, bank and workplace/public-building addresses instead of three fixed coordinates.
- [x] Each route requires a parcel pickup and a separate recipient drop-off.
- [x] Route rewards scale with distance and are bounded to a predictable Naira range.
- [x] The active pickup/drop-off waypoint is reflected in the beacon, mission HUD and map labels.
- [x] Parcel pickup is confirmed and persisted by the server; rewards require the confirmed pickup and the assigned drop-off position.
- [x] Server derives each route payment from distance and validates both addresses against the authored Port Harcourt delivery-point catalogue.
- [ ] Run `npm run typecheck` and `npm run build` in `services/web-client`.
- [ ] Manually test residential and business destinations, reward settlement, reconnect behavior and touch controls on the live game.

## Stage 14 — Release, load and recovery validation
**Status: COMPLETE FOR AUTOMATED RELEASE GATE**

- [x] Deterministic release snapshot validation, bounded state checks, finite-number rejection, deterministic load simulation and recovery serialization validation.
- [x] Stage 14 regression registered in Game Server CI.
- [x] Railway production deployment succeeded on the release-validation checkpoint.
- [ ] Real-device Android load/recovery remains a manual test, not automated evidence.

## Stages 0–13
Their scope and recorded status are tracked in [ROADMAP.md](ROADMAP.md) and their stage status documents. Earlier foundations are not silently treated as full client/UI integration unless separately verified.
