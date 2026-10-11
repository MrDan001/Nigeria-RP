# Nigeria RP — Full Implementation Roadmap & Developer Handoff

> **Current status, 11 October 2026:** Stage 14 automated release validation is complete, Stage 15 is complete for automated release sequencing, and Stage 16 — Distinct City Environments & Regional Identity — is active on `main`. Real-device Android travel/reconnect testing is still a manual limitation.

## Stage 15 — Additional cities and inter-city travel
**Status: COMPLETE FOR AUTOMATED RELEASE SEQUENCING**

Scope: expand the world beyond Port Harcourt with authoritative city definitions and server-validated inter-city travel. The travel engine owns route identity, capacity, fare, duration, balance checks, persistence and replay protection; the browser client requests travel and applies the destination state.

Implemented:
- [x] Seven-city catalogue: Port Harcourt, Aba, Owerri, Uyo, Warri, Yenagoa and Benin City.
- [x] Twenty directed routes with distance, travel time, capacity and Naira fares, including return journeys.
- [x] Server-authoritative fare validation and deduction in the shared money mutation queue.
- [x] Persisted city identity in PostgreSQL and file fallback.
- [x] Durable request ledger, replay rejection, recent trip history and failed-persistence rollback.
- [x] City-filtered realtime snapshots/player broadcasts.
- [x] Mobile browser travel terminal, destination selection, fare display, arrival overlay and saved-city reconnect.
- [x] Deterministic Stage 15 tests wired into Game Server CI.
- [x] Stage 1–16 automated regression, typecheck and production build passed on the Stage 16 pre-landmark checkpoint.
- [x] Railway successfully deployed the Stage 16 checkpoint before the most recent city-scene polish; latest checkpoint verification is running.

Manual acceptance:
- [ ] Real-device Android travel/reconnect walkthrough. Do not represent this as completed until it has actually been run on a device.

## Stage 16 — Distinct city environments and regional identity
**Status: IN PROGRESS**

Goal: make the added cities feel different rather than only changing a city name. Keep the existing authoritative account, cash, route and transaction rules shared, while applying a distinct regional visual identity after login and travel.

Implemented on `main`:
- [x] Validated environment profile for all seven Stage 15 cities.
- [x] Distinct sky, fog and accent palettes.
- [x] Lightweight low-poly 3D landmarks: Port Harcourt container crane/port; Aba market canopy/stalls; Owerri cultural hall/dome; Uyo stadium; Warri river-port crane/dock; Yenagoa creek pavilion/wetland trees; Benin heritage palace gate.
- [x] City landmark name chips displayed in the mobile travel terminal.
- [x] Profile metadata delivered with the live travel state and successful city transition.
- [x] Stage 16 deterministic catalogue tests wired into Game Server CI.

Remaining acceptance:
- [ ] Final Stage 16 commit passes all Game Server tests, typecheck and both production builds.
- [ ] Final Stage 16 deployment is healthy on Railway.
- [ ] Review each city scene on an actual mobile device; refine landmark placement/scale and ensure it does not obstruct movement or existing interactions.
- [ ] Continue toward more complete city-specific street layouts, businesses, and interactions without breaking shared gameplay.

## Stage 14 — Release, load and recovery validation
**Status: COMPLETE FOR AUTOMATED RELEASE GATE**

- [x] Deterministic release snapshot validation, bounded state checks, finite-number rejection, deterministic load simulation and recovery serialization validation.
- [x] Stage 14 regression registered in Game Server CI.
- [x] Railway production deployment succeeded on the release-validation checkpoint.
- [ ] Real-device Android load/recovery test is a manual limitation, not automated evidence.

## Stages 0–13
Their scope and recorded status are tracked in [ROADMAP.md](ROADMAP.md) and their stage status documents. Earlier stage foundations are not to be silently expanded or claimed to have full client/UI integration unless separately verified.
