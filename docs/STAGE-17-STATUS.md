# Stage 17 — City Explorer Passport & Discovery Rewards

Status: IN PROGRESS

Stage 16 was accepted by the project owner on 11 October 2026. Stage 17 adds a persistent exploration goal to the seven-city travel system.

## Scope
- One player-scoped passport and one stamp per discovered city.
- The starting city is stamped without a cash reward.
- The first server-validated arrival in each new destination awards ₦1,500 once; repeat visits pay no discovery bonus.
- The passport displays visited cities, current city, total discovery rewards and progress out of seven.
- Current city, the passport and recent official news are grouped in a dedicated City & News Hub opened from the settings menu; the city badge and passport chip no longer occupy persistent HUD space.
- Server-side replay protection and bounded state normalization.
- Durable persistence in PostgreSQL and the existing file-store fallback, with rollback if a travel transaction cannot be saved.
- Automated tests for first arrival, return visits, separate accounts, replay protection, malformed state and normalization.

## Acceptance gate
- [ ] Stage 1–17 regression suites and server/client builds pass.
- [ ] Railway production deployment succeeds and the service is online.
- [ ] Verify a first-time arrival gives one stamp and ₦1,500.
- [ ] Verify revisiting a stamped city gives no duplicate reward.
- [ ] Verify passport progress survives reconnect and restart.
- [ ] Inspect the passport sheet on a mobile device.

The reward is a one-time discovery bonus, not payment for repeated journeys. Fare validation and the authoritative cash balance remain server-owned.