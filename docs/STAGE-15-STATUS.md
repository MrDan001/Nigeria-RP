# Stage 15 — Additional Cities & Inter-City Travel

Status: IN PROGRESS

Implemented on `main`:
- authoritative catalogue for Port Harcourt plus Aba, Owerri, Uyo, Warri, Yenagoa and Benin City
- deterministic inter-city route catalogue with distance, travel duration, capacity and Naira fares
- server-side fare calculation
- server-side validation for passenger limits, balance, route validity and replayed request IDs
- deterministic Stage 15 regression tests
- Stage 15 test wired into Game Server CI

Current release gate:
- CI must pass Stage 1–15 regression, typecheck and builds
- Railway deployment must become healthy on the Stage 15 checkpoint
- live browser/client travel UI and actual city scene transitions still need integration before Stage 15 can be marked complete

Do not mark Stage 15 complete until those integration and release checks are green.
