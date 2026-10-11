# Stage 16 — Distinct City Environments & Regional Identity

Status: IN PROGRESS

Goal:
Make each Stage 15 city visually recognizable while preserving the shared authoritative account, cash, route, travel and transaction systems.

Implemented on `main`:
- validated environment profiles for Port Harcourt, Aba, Owerri, Uyo, Warri, Yenagoa and Benin City
- differentiated sky, fog and accent palettes, applied on login state refresh and successful travel
- lightweight low-poly 3D landmarks: port cranes and containers, market canopy/stalls, cultural hall/dome, stadium bowl, river-port dock, creek pavilion/mangrove silhouettes and heritage palace gate
- city-specific landmark name chips in the responsive travel terminal
- server delivery of profile metadata with city travel state and arrival results
- deterministic catalogue coverage tests registered in Game Server CI

Acceptance gate:
- latest commit passes the full Game Server regression suite, typecheck, web client syntax check and both production builds
- Railway production deployment is successful and runtime health is confirmed
- review every city on a real phone for landmark visibility, spawn/road clearance, performance and touch UX
- refine per-city road/building sets and add local interactions without breaking existing city gameplay

Do not mark Stage 16 complete until automated release checks are green and the mobile scene review is performed. The listed landmark meshes are lightweight, stylized representations—not production-accurate 1:1 city models.
