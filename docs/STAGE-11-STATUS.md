# Stage 11 — Personal services, property services and utilities

**Status: SERVER-AUTHORITATIVE DOMAIN FOUNDATION PUSHED TO MAIN — live gameplay integration and release acceptance remain open.**

Implemented in `services/game-server/src/stage11.ts`:

- Mechanic repairs, car washing, barber and salon services through a shared order catalogue.
- Filling-station purchases with vehicle-owner, worker-duty, uniform, station-proximity, tank-capacity, stock, price and cash validation.
- Electrical and plumbing calls tied to a registered property and a specific reported issue.
- Repair dispatch restricted to senior workplace staff; only the assigned qualified worker can complete the repair at the correct property.
- Electricity, water and waste bills that must be outstanding, belong to a property the payer owns or occupies, and are paid once.
- Courier jobs with a server-computed route price, manager dispatch, an explicit hub pickup and destination proximity at delivery.
- Bounded order and ledger history, request replay protection, state normalization and deterministic transaction outputs.
- `test:stage11` regression coverage for fuel, assigned mechanic work, property repair authorization, utility payments and courier route completion.

## Acceptance still outstanding

This is a domain foundation, not a claim that the full Stage 11 player experience is finished. The new engine is not yet wired to live server message handlers, existing saved citizen cash, vehicle persistence, property/rent records, workplace roster dispatch UI or browser shop/service panels. Complete that integration next, then validate the Stage 1–11 CI suite and Railway deployment. Real Android visual checks are still unclaimed until actually performed.
