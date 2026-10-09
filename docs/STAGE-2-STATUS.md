# Stage 2 — Homes, rent, parking and respawn

## Implemented in this stage
- Places → Homes tab shows 30 home listings, location/district, daily rent, and vacant/taken status.
- Server-authoritative rent purchase/extension: uses player cash, enforces one home per player, blocks occupied homes, caps rent at seven prepaid days, and persists the tenant map and player life.
- Rent settles on the Nigeria-time clock. Online players receive a life/housing update; offline players are settled at next login. Eviction releases the home for another player.
- A rented home can open a furnished interior inventory/preview.
- Parking state is saved per account; parked personal cars are hidden locally and their collision boxes are disabled. Players can retrieve them after login.
- Respawn returns the player to home coordinates when they still rent one, otherwise to the public parking-lot fallback at the map centre.
- Client APIs: NRS.getHousing(), NRS.rentHouse(id, days), NRS.enterHome(), NRS.parkCars(), NRS.retrieveCars(), and NRS.respawn().

## Rent table
Local Hut ₦1,000/day; Face-Me-I-Face-You ₦2,500/day; Flat ₦4,000/day; Estate House ₦7,500/day; Mansion ₦10,000/day; Palace ₦20,000/day. Prepayment is capped at seven days.

## Important map note
The house entries use provisional coordinates inside the requested districts. The catalogue's `placed` flag remains false until every coordinate has been checked against roads and existing building footprints. Navigation points to the listing coordinates, but the 30 homes are not yet fully built as independent exterior buildings or enterable 3D interiors. The furnished interior is currently an in-game preview panel, not a separate explorable 3D room. Those visual world assets still need to be completed and tested before calling the entire Stage 2 experience finished.

## Verification
- `npm run typecheck --workspace nigeria-rp-game-server`
- `npm run test:stage1 --workspace nigeria-rp-game-server`
- `npm run test:stage2 --workspace nigeria-rp-game-server`

Stage 2 remains subject to live-player testing before Stage 3 starts.
