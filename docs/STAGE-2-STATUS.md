# Stage 2 — Homes, Rent, Realistic Exteriors, Interiors and Car-Park Routes

**Status: In progress. Source implementation has been expanded, but it is not approved as complete until the live game is tested on a phone.** Do not start Stage 3 until the user confirms the Stage 2 experience is correct.

## Implemented in the current source

- Places → Homes has a 30-home catalogue with rental prices, district, vacancy/occupancy and rent actions.
- Server-authoritative renting/extension uses player cash, limits players to one rented home, blocks occupied homes, caps prepaid rent at seven days and persists home/life state.
- Rent is settled against the Nigeria-time day. Online life updates and offline settlement at reconnect are implemented; eviction releases a home.
- The client creates separate class-specific home exteriors for hut, face-me-I-face-you compound, two-storey flat, estate house, mansion and palace rather than reusing a generic cube.
- Street rendering has textured asphalt/sidewalk surfaces, lane markings, curbs, crosswalks and streetlights; nearby residential models are built on demand to reduce startup/mobile cost.
- The rented-home interior is a walkable 3D room with furniture and an EXIT interaction.
- EXIT opens a choice menu: return to the street on foot, or enter the private car park.
- The private car park has marked bays and an exit lane. The client can display owned vehicles as spawn options; the intended flow is to spawn one, drive to the marked gate, stop and honk to exit onto the street.
- Server messages cover car-park entry/exit and validate that the account owns the selected vehicle. Route-error events fade out a transition overlay if the server rejects a route request.
- Driving camera work freezes camera rotation/touch-look and zoom while the vehicle moves, allows camera adjustment at rest, and uses a more responsive steering curve.
- Vehicle ownership is separate from rent, so losing a home must not delete the player's owned cars.
- Test file covers the rent table, 30-home catalogue, parking-state normalization and rent-day settlement. Residential road/lot placement assertions have also been added.

## Rental price table

| Home class | Rent per day |
|---|---:|
| Local Hut | ₦1,000 |
| Face-Me-I-Face-You | ₦2,500 |
| Flat | ₦4,000 |
| Estate House | ₦7,500 |
| Mansion | ₦10,000 |
| Palace | ₦20,000 |

Rent can be prepaid for up to seven days.

## Known limitations — do not hide these

- Residential and road models use generated Three.js geometry and procedural textures. They are more differentiated than cubes, but this is not yet photorealistic authored asset work.
- Vehicle movement still runs mainly in the browser. Server-side ownership and garage-route checks exist, but authoritative vehicle physics, server collision/speed validation and multiplayer vehicle replication are future work.
- House coordinates are duplicated between `services/game-server/src/world.ts` and client plot reservations in `services/web-client/index.html`; those definitions must remain aligned.
- CI passing does not confirm that the player can visually enter the correct room, drive through the actual gate, or view the right camera orientation. Those need real browser/device testing.

## Required commands

From the repo root:

```bash
npm run typecheck
npm run test:stage1 --workspace nigeria-rp-game-server
npm run test:stage2 --workspace nigeria-rp-game-server
npm run build
```

Both **Browser Client Build** and **Game Server CI** GitHub workflows must pass for the target commit. Then hard-refresh the live game and test the user flows above on Android.

## Stage 2 approval checklist

- [ ] Rent a vacant property, check the correct price/cash deduction and relog to confirm ownership.
- [ ] Confirm the front entrance lines up with the visible model and enter the correct rented home.
- [ ] Walk the room, reach EXIT and use the street choice.
- [ ] Re-enter and choose car park; spawn an owned car and see the marked garage exit.
- [ ] Drive to the gate, stop, honk and appear on the street in that car.
- [ ] Confirm the view does not rotate or zoom while moving, but camera adjustment works at rest.
- [ ] Confirm steering is responsive on touch and does not cause the camera to move.
- [ ] Inspect the six home classes and road clearance on a real Android screen.
- [ ] Verify two-account visibility, rent expiry/eviction and reconnect behavior.
- [ ] Both CI workflows pass and the user explicitly approves this stage.

**Next stage after approval:** Stage 3 — shared workplace/job framework, rank 1–5 staff, rank 6 boss, authorized promotion/demotion/fire, clock-in/out, task completion and server-validated payout.
