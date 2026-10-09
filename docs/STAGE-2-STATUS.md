# Stage 2 — Homes, Rent, Realistic Exteriors, Interiors and Car-Park Routes

**Status: In progress. The user reported that the car horn does not consistently leave the garage, the garage feels too open, there is no on-foot door choice, and respawn lands outside the home. The source rebuild is in progress and requires CI plus live phone verification.** Do not start Stage 3 until the user confirms the Stage 2 experience is correct.

## Implemented in the current source

- Places → Homes has a 30-home catalogue with rental prices, district, vacancy/occupancy and rent actions.
- Server-authoritative renting/extension uses player cash, limits players to one rented home, blocks occupied homes, caps prepaid rent at seven days and persists home/life state.
- Rent is settled against the Nigeria-time day. Online life updates and offline settlement at reconnect are implemented; eviction releases a home.
- The client creates separate class-specific home exteriors for hut, face-me-I-face-you compound, two-storey flat, estate house, mansion and palace rather than reusing a generic cube.
- Street rendering has textured asphalt/sidewalk surfaces, lane markings, curbs, crosswalks and streetlights; nearby residential models are built on demand to reduce startup/mobile cost.
- The rented-home interior is a walkable 3D room with furniture and an EXIT interaction.
- EXIT opens a choice menu: return to the street on foot, or enter the private car park.
- The private car park has marked bays and an exit lane. Car spawning is now registered by the server and remains limited to vehicles owned by the account.
- While a car is in the private garage, the browser streams bounded position samples. The server derives speed from accepted samples and rejects exit requests unless the registered car is recently tracked at the marked gate, stopped, owned by the account and accompanied by a held-horn request. This improves route validation; it is not a substitute for full server-authoritative vehicle physics.
- The six rental classes now have different interior dimensions and furnishing plans, including a compact hut, a shared-compound room, an apartment lounge, family-house dining space and larger luxury suites. Modern exterior details include rooftop water storage, solar panels and air-conditioning units where appropriate.
- Route-error events fade out a transition overlay if the server rejects a route request. Driving camera work freezes camera rotation/touch-look and zoom while the vehicle moves, allows camera adjustment at rest, and uses a more responsive steering curve.
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

- Residential and road models still use generated Three.js geometry and procedural textures. The housing classes now have stronger silhouettes and tailored interiors, but the city is not yet photorealistic authored-asset work; inspect the live result before making a quality claim.
- Vehicle movement still runs mainly in the browser. Garage position samples are bounded and the exit gate checks recent movement-derived speed, but full authoritative vehicle physics, collision validation and multiplayer vehicle replication remain future work.
- House coordinates are duplicated between `services/game-server/src/world.ts` and client plot reservations in `services/web-client/index.html`; those definitions must remain aligned.
- CI passing does not confirm that the player can visually enter the correct room, drive through the actual gate, or view the right camera orientation. Those need real browser/device testing.

## Current rebuild: garage doorway and home respawn

- Replace the open-looking bay with a sealed garage structure: continuous roof, side/rear walls, front doorway/roller-door frame, concrete floor, lights, bay markings, safety details and private-garage signage.
- Constrain foot and vehicle movement to the garage interior. A vehicle may leave only via the narrow validated doorway after a full stop and a held horn; the gate contract matches the physical doorway bounds.
- Retry the horn request safely only while the owned car is stationary at the door. Do not repeatedly submit failed requests while it is moving.
- When on foot near the door, show a menu with **Exit to street** and a home-specific return choice: **hut**, **room**, **apartment** or **house**, based on the rented property. The server validates the tenant and completes the route.
- Respawning with a valid tenancy must place the player in the same furnished, walkable home interior and preserve the exterior return point. Homeless respawn remains at the public respawn location.

## Additional acceptance checks for the rebuild

- [ ] Garage has a visible roof and walls on all sides except its framed doorway; neither foot player nor car can drive through side/rear walls or leave by another route.
- [ ] Stop the owned car at the doorway, hold the horn, and transition to the street in that car without needing repeated honks or receiving a false rejection.
- [ ] Pressing the horn away from the doorway or while moving does not leave the garage.
- [ ] Walk to the garage door; verify the menu has **Exit to street** plus the correct home-specific return label.
- [ ] Exit on foot to the street; return to the home interior via the door; verify both routes preserve account and vehicle ownership.
- [ ] Trigger respawn while holding a valid rental; verify the player loads inside the correct home room and can walk to EXIT. Verify the homeless case still spawns at the public location.

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
