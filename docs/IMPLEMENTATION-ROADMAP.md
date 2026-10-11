# Nigeria RP — Full Implementation Roadmap & Developer Handoff

> Stage 14 has now passed its automated release validation and Railway production deployment gate. Stage 15 — Additional Cities & Inter-City Travel — is active on `main`.

**Stage 15 scope:** expand the world beyond Port Harcourt with authoritative city definitions and server-validated inter-city travel. The travel engine must own route identity, capacity, fare, duration, balance checks and replay protection; the browser client must request travel and render the resulting city/route state.

### Stage 14 — Release, load and recovery validation
**Status: COMPLETE FOR AUTOMATED RELEASE GATE**

- Deterministic release snapshot validation, bounded state checks, finite-number rejection, deterministic load simulation and recovery serialization validation are implemented.
- Stage 14 regression is wired into Game Server CI.
- Railway production deployment is successful on the release-validation checkpoint.
- Real-device Android load/recovery remains a manual limitation and is not claimed as automated evidence.

### Stage 15 — Additional cities and inter-city travel
**Status: IN PROGRESS**

- Add authoritative city catalogue for Port Harcourt, Aba, Owerri, Uyo, Warri, Yenagoa and Benin City.
- Add deterministic inter-city routes with distance, travel duration, passenger capacity and Naira fares.
- Validate travel requests server-side: route identity, passenger count, balance, destination validity and replay protection.
- Persist/commit the eventual travel transaction through the authoritative game server rather than client-only state.
- Add browser travel UI and city/route transitions without weakening existing Port Harcourt gameplay.

Acceptance:
- [x] City and route domain engine implemented.
- [x] Fare, capacity, balance and replay rejection covered by deterministic tests.
- [x] Stage 15 test registered in Game Server CI.
- [ ] Live server transaction integration and persistence.
- [ ] Browser travel terminal/route UI and city transition integration.
- [ ] Stage 1–15 CI, production build and Railway deployment green.
- [ ] Real-device travel/reconnect walkthrough.
