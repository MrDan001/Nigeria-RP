# Stage 15 — Additional Cities & Inter-City Travel

Status: COMPLETE FOR AUTOMATED RELEASE GATE

Implemented on `main`:
- authoritative seven-city catalogue: Port Harcourt, Aba, Owerri, Uyo, Warri, Yenagoa and Benin City
- 20 directed inter-city routes, including return journeys, with distance, duration, capacity and Naira fares
- server-authoritative booking and balance deduction through the shared money-mutation queue
- passenger, fare, current-city/route and replay-request validation
- durable account city selection in PostgreSQL and file-store fallback
- durable Stage 15 travel ledger, replay protection, rollback on failed persistence and recent-trip history
- city-scoped snapshots and player-join/leave broadcasts to keep city instances separate
- mobile-friendly travel terminal, fare/route display, arrival transition, saved-city resume and cash refresh
- deterministic Stage 15 regression tests registered in Game Server CI
- Stage 1–16 tests, server/client type and production builds passed on the Stage 16 pre-landmark checkpoint; final checkpoint rerun remains under verification
- Railway production deployment succeeded on the Stage 16 checkpoint before the latest city-scene polish

Manual acceptance still outstanding:
- real-device Android end-to-end travel, reconnect and persistence walkthrough

This stage is closed for automated release sequencing. Do not claim the manual mobile walkthrough has been performed until it is actually tested on a device.
