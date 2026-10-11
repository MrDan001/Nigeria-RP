# Stage 16 — Distinct City Environments & Regional Identity

Status: IN PROGRESS

Goal:
Make the Stage 15 cities visually recognizable while preserving the shared authoritative account, cash, route, travel and transaction systems.

Implemented on `main`:
- validated environment profile for Port Harcourt, Aba, Owerri, Uyo, Warri, Yenagoa and Benin City
- differentiated sky, fog and accent palettes, applied after login state refresh and successful travel
- lightweight low-poly 3D landmark scenes: port cranes/containers, market canopy/stalls, cultural hall/dome, stadium bowl, river-port dock, creek pavilion/mangrove silhouettes and heritage palace gate
- a safe off-road civic plaza site selected against road/building collision geometry, with city-themed shopfronts, trees, benches, lamps and an information pavilion
- an on-foot local-district guide interaction that reveals city-specific activities and landmarks without changing the shared wallet or authoritative game state
- city-specific landmark name chips in the responsive travel terminal
- server delivery of profile metadata with city travel state and arrival results
- distinct multi-city app title and refreshed browser-client asset version
- deterministic catalogue tests registered in Game Server CI

Automated release verification:
- [x] Stage 1–16 regression suites pass, including Stage 15 live transaction/persistence/replay integration and Stage 16 catalogue coverage
- [x] Game Server typecheck/build and browser-client production build pass
- [x] Railway deployment on the current Stage 16 checkpoint succeeds; service is online with no current warning/critical issues reported

Remaining acceptance:
- [ ] review all seven city scenes on a physical phone for landmark visibility, collision clearance, movement, performance and touch usability
- [ ] complete a real-device travel → district guide → reconnect walkthrough and confirm saved city/cash persist
- [ ] adjust any landmark or plaza placement issues found during device review before marking Stage 16 complete

The meshes are stylized lightweight representations, not production-accurate 1:1 city models. The implementation now includes interactive local district guides, but Stage 16 must remain IN PROGRESS until the listed real-device visual and end-to-end checks have actually been performed.
