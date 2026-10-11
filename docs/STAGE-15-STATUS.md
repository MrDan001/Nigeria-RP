# Stage 15 — Additional Cities & Inter-City Travel

Status: COMPLETE FOR AUTOMATED RELEASE GATE  
Manual real-device travel/reconnect walkthrough: PENDING

Implemented on `main`:
- authoritative seven-city catalogue: Port Harcourt, Aba, Owerri, Uyo, Warri, Yenagoa and Benin City
- 20 directed routes (including return routes) with distance, duration, passenger capacity and Naira fares
- server-authoritative route/fare/balance checks and money deduction through the shared money-mutation queue
- persistent city identity in PostgreSQL and file-store fallback
- persistent travel ledger, replay protection, recent-trip history and rollback on failed persistence
- city-scoped player snapshots and travel arrival/departure broadcasts
- mobile-friendly route terminal, passenger selector, fare display, arrival transition, cash refresh and saved-city resume
- deterministic route/ledger tests plus a live server integration test in Game Server CI

Live integration test verified:
- newly registered player begins in Port Harcourt with ₦5,000
- Port Harcourt → Aba succeeds, charges ₦4,500 and leaves ₦500
- insufficient-balance return journey is rejected without changing city or cash
- after a full server restart, Aba, the ₦500 balance and completed trip ledger persist
- replaying the completed request after restart is rejected

Release verification on commit `1327ddc61dae0e4f8be02d5c3e1ddd8ff8c966d2`:
- [x] all Game Server regression suites, including Stage 15 live integration and Stage 16 catalogue tests
- [x] Game Server typecheck and build
- [x] browser-client production build
- [x] Railway production deployment successful and service online; no current warning/critical issues reported

Manual acceptance still outstanding:
- [ ] real Android/mobile walkthrough of travel, reconnection and persistence
- [ ] visual confirmation on a physical device that each arrival spawn and landmark is unobstructed

The automated release gate is closed so the roadmap can advance. The manual checks are explicitly not represented as performed.
