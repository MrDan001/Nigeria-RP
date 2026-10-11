# Stage 16 — Distinct City Environments & Regional Identity

Status: IN PROGRESS

Goal:
Make the Stage 15 cities visually recognizable while preserving the shared authoritative account, cash, route, travel and transaction systems.

Implemented on `main`:
- validated environment profile for Port Harcourt, Aba, Owerri, Uyo, Warri, Yenagoa and Benin City
- differentiated sky, fog and accent palettes, applied after login state refresh and successful travel
- lightweight low-poly 3D landmark scenes: port cranes/containers, market canopy/stalls, cultural hall/dome, stadium bowl, river-port dock, creek pavilion/mangrove silhouettes and heritage palace gate
- city-specific landmark name chips in the responsive travel terminal
- server delivery of profile metadata with city travel state and arrival results
- distinct multi-city app title and refreshed browser-client asset version
- deterministic catalogue tests registered in Game Server CI

Automated release verification:
- [x] Stage 1–16 regression suites pass, including Stage 15 live transaction/persistence/replay integration and Stage 16 catalogue coverage
- [x] Game Server typecheck/build and browser-client production build pass
- [x] Railway deployment on the current Stage 16 checkpoint succeeds; service is online with no current warning/critical issues reported

Remaining acceptance:
- [ ] review each city on a physical phone for landmark visibility, spawn/road clearance, performance and touch UX
- [ ] refine landmark placement/scale from device review
- [ ] extend toward more complete city-specific streetscapes/building sets and local interactions without breaking shared gameplay

The current meshes are stylized lightweight landmark representations, not production-accurate 1:1 city models. Do not mark Stage 16 complete until manual mobile review and remaining scene work are finished.
