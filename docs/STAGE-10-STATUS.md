# Stage 10 — Food businesses and everyday shops

**Status: IMPLEMENTATION FOUNDATION PUSHED TO MAIN — production gameplay integration remains the next acceptance step.**

Implemented in `services/game-server/src/stage10.ts`:

- Mama Put, restaurant, bakery and suya businesses.
- Supermarket and pharmacy product catalogues.
- Server-side stock, quantity and proximity validation.
- Server-side worker workplace/rank/duty/uniform authorization.
- Idempotent sales with persistent order and transaction-ledger records.
- Phone-repair and tailoring service orders with required worker rank.
- Stock is decremented only by an accepted server transaction.
- Duplicate request replay is rejected.
- Insufficient cash, invalid worker context, invalid location and insufficient stock are rejected.
- `test:stage10` regression suite covers successful sale, replay protection, location/duty authorization, cash validation and service-rank validation.

## Acceptance still outstanding

The roadmap acceptance requires these transactions to be wired into the live player/shop interaction UI and persistent player cash/inventory settlement, then verified on Railway and on a real Android device. This status file deliberately does **not** claim those live checks are complete.
