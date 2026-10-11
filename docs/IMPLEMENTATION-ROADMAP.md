# Nigeria RP — Full Implementation Roadmap & Developer Handoff

> **Current status, 11 October 2026:** Stage 14 automated release validation is complete. Stage 15 has passed its automated live integration/release gate. Stage 16 — Distinct City Environments & Regional Identity — is active on `main`. Real-device Android walkthroughs remain manual follow-up items.

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
**Status: IN PROGRESS**

Goal: make the newly reachable cities feel different rather than only changing a city name. Keep authoritative accounts, cash, travel routes and transactions shared while applying a unique environment for each destination.

Implemented on `main`:
- [x] Validated profile for all seven Stage 15 cities.
- [x] Differentiated sky, fog and accent palettes.
- [x] Lightweight low-poly 3D landmark silhouettes: Port Harcourt container crane/port; Aba market canopy/stalls; Owerri cultural hall/dome; Uyo stadium; Warri river-port crane/dock; Yenagoa creek pavilion/wetland trees; Benin heritage palace gate.
- [x] City landmark name chips in the mobile travel terminal.
- [x] Environment profile metadata delivered by the live server and applied on city arrival.
- [x] Distinctive multi-city app title and refreshed client asset version.
- [x] Deterministic Stage 16 city catalogue test wired into Game Server CI.
- [x] Game Server test suite, typecheck, server/client builds and Railway deployment passed at the current Stage 16 checkpoint.

Remaining acceptance:
- [ ] Physical mobile review of each city plaza for landmark placement, building collision clearance, touch usability and frame performance.
- [ ] Run the end-to-end device walkthrough: inter-city travel, on-foot district guide, reconnect and saved city/cash persistence.
- [ ] Apply any placement adjustments revealed by the real-device checks before marking Stage 16 fully complete.

These landmarks are intentionally stylized lightweight representations, not 1:1 photogrammetric models.

## Stage 14 — Release, load and recovery validation
**Status: COMPLETE FOR AUTOMATED RELEASE GATE**

- [x] Deterministic release snapshot validation, bounded state checks, finite-number rejection, deterministic load simulation and recovery serialization validation.
- [x] Stage 14 regression registered in Game Server CI.
- [x] Railway production deployment succeeded on the release-validation checkpoint.
- [ ] Real-device Android load/recovery remains a manual test, not automated evidence.

## Stages 0–13
Their scope and recorded status are tracked in [ROADMAP.md](ROADMAP.md) and their stage status documents. Earlier foundations are not silently treated as full client/UI integration unless separately verified.
