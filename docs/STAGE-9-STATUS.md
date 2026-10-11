# Stage 9 — Transport, passengers and haulage

**Implementation status:** Server rules, persistent state, browser controls, tests and CI wiring are committed to `main`. Confirm the resulting Game Server CI run and actual Railway deployment before calling the stage released. Live two-account/mobile validation remains separate.

## Delivered
- Six-rank Transport Union fleet: keke, okada, taxi, danfo minibus, city bus and haulage truck.
- Server-validated checkout/return, unique vehicle assignment, tank capacity, depot refuelling, cash validation and saved fuel consumption while a company vehicle moves.
- Passenger ride requests at named Port Harcourt stops, with pickup proximity and fare affordability checks.
- Rank/duty/uniform-gated drivers, vehicle-type matching, nearby pickup, ordered route checkpoints and cancellation before boarding.
- Fare settlement only after destination validation; 80% goes to the driver and 20% to Union treasury. Passenger position follows the driver while onboard and moves to the destination on settlement.
- Rank 5+ haulage contracts, truck-only assignment, sequential checkpoint receipts, proximity validation and persisted delivery rewards.
- State persistence in the existing `nrs_world` PostgreSQL key-store or configured JSON fallback. Request IDs and a bounded action log provide replay protection and audit history.
- In-game transport console, company vehicle models, map stop markers and a Stage 9 regression suite added to Game Server CI.

## Route catalog
| Route | Checkpoints | Work |
|---|---|---|
| Danfo: Terminal → Mile 1 → Rumuola | Terminal, Mile 1 Market, Rumuola | Passenger transit |
| Bus: Terminal → Park → Mile 1 → Hospital → Waterlines | Terminal, Park Gate, Mile 1 Market, Mile One General Hospital, Waterlines | Passenger transit |
| Haulage: Terminal → Mile 1 → Rumuola → Waterlines | Terminal, Mile 1 Market, Rumuola, Waterlines | Rank 5+ delivery |

Passengers may request keke, okada or taxi rides between published stops. Fares vary by distance and vehicle class. Haulage rewards are fixed by the published contract.

## Verification
Run `npm run test:stage9 --workspace nigeria-rp-game-server`, existing Stage 1–8 tests, typecheck, server/browser builds, then a real two-account ride and persistence/restart check. Vehicle movement physics remain browser-driven; Stage 9 validates actions and accepted position progress but does not replace all vehicle physics with server-owned physics.
