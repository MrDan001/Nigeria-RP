# Stage 2 — Homes, Rent, Realistic Exteriors, Interiors and Car-Park Routes

**Status as of 12 October 2026:** The housing implementation is deployed to Railway. The Face-Me-I-Face-You exterior visibility defect was fixed in commit `6ccc856` and the user confirmed that the buildings now appear on the live map. That closes this specific visual defect only. The entire Stage 2 acceptance checklist is not yet verified in this session; rent/tenancy, interior routing, the garage/horn exit, respawn, two-account visibility and full Android regression checks remain to be recorded. Stage 3 was explicitly approved and is already active, so keep these remaining items as housing closeout/regression checks rather than retroactively undoing that approval.

## Implemented in the current source

- Places → Homes now uses a server-authoritative catalogue of 35 rentable homes across seven house classes, with prices, districts, vacancy/occupancy and rent actions. The browser map includes all 35 residential exterior slots. The catalogue regression test checks all 35 IDs; physical entrance/collision alignment, rent flows, garage routing and device visibility remain separate acceptance checks.
- Server-authoritative renting/extension uses player cash, limits players to one rented home, blocks occupied homes, caps prepaid rent at seven days and persists home/life state.
- Rent is settled against the Nigeria-time day. Online life updates and offline settlement at reconnect are implemented; eviction releases a home.
- The client creates distinct class-specific exteriors for Village Hut, Compound Rooms (face-me-I-face-you), Urban Flat, Estate Duplex, Grand Villa, Royal Palace and the new modern Grand Building; the Grand Building has a glass-and-steel facade, garage, private pool, roof terrace and solar details.
- Street rendering has textured asphalt/sidewalk surfaces, lane markings, curbs, crosswalks and streetlights. The client seeds the residential visual catalogue in small asynchronous batches; server housing snapshots synchronize authoritative tenancy/rent data and entrance points.
- Rented-home interiors have walkable, class-specific room arrangements, furnishings, WC/shower/vanity fixtures and an EXIT interaction. Estate Duplexes and Royal Palaces have two navigable levels; Grand Buildings have three levels with upstairs suite areas, cinema/office, gym and roof-lounge details.
- EXIT opens a choice menu: return to the street on foot, or enter the private car park.
- The private car park has marked bays and an exit lane. Car spawning is now registered by the server and remains limited to vehicles owned by the account.
- While a car is in the private garage, the browser streams bounded position samples. The server derives speed from accepted samples and rejects exit requests unless the registered car is recently tracked at the marked gate, stopped, owned by the account and accompanied by a held-horn request. This improves route validation; it is not a substitute for full server-authoritative vehicle physics.
- All seven house classes have different interior dimensions and room/furnishing plans. Three apartment tiers are selected from the building's floor count, and their daily room prices are calculated on the server: Standard (2–4 floors, ₦1,500/room/day), Serviced (5–7 floors, ₦3,500/room/day) and Luxury Tower (8–10 floors, ₦7,500/room/day). Modern homes and apartments have tier-appropriate visual details.
- Route-error events fade out a transition overlay if the server rejects a route request. Driving camera work freezes camera rotation/touch-look and zoom while the vehicle moves, allows camera adjustment at rest, and uses a more responsive steering curve.
- Vehicle ownership is separate from rent, so losing a home must not delete the player's owned cars.
- Test file covers all seven house prices, the 35-home catalogue, the two new Grand Building plots, apartment pricing tiers and floor-boundary handling, parking-state normalization and rent-day settlement. Residential road/lot placement assertions have also been added.

## Rental price table

| Home class | Rent per day |
|---|---:|
| Village Hut | ₦1,000 |
| Compound Rooms | ₦2,500 |
| Urban Flat | ₦4,000 |
| Estate Duplex | ₦7,500 |
| Grand Villa | ₦10,000 |
| Royal Palace | ₦20,000 |
| Grand Building | ₦30,000 |

Rent can be prepaid for up to seven days.

## Known limitations — do not hide these

- Residential and road models still use generated Three.js geometry and procedural textures. The housing classes now have stronger silhouettes and tailored interiors, but the city is not yet photorealistic authored-asset work; inspect the live result before making a quality claim.
- Vehicle movement still runs mainly in the browser. Garage position samples are bounded and the exit gate checks recent movement-derived speed, but full authoritative vehicle physics, collision validation and multiplayer vehicle replication remain future work.
- House coordinates are duplicated between `services/game-server/src/world.ts` and client plot reservations in `services/web-client/index.html`; those definitions must remain aligned.
- CI passing does not confirm that the player can visually enter the correct room, drive through the actual gate, or view the right camera orientation. Those need real browser/device testing.

## Previously reported garage/respawn issues — live acceptance still required

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

- [x] User confirmed Face-Me-I-Face-You exterior buildings are visible on the live Railway map after the 11 October root-cause fix.
- [ ] Rent a vacant property, check the correct price/cash deduction and relog to confirm ownership.
- [ ] Confirm the front entrance lines up with the visible model and enter the correct rented home.
- [ ] Walk the room, reach EXIT and use the street choice.
- [ ] Re-enter and choose car park; spawn an owned car and see the marked garage exit.
- [ ] Drive to the gate, stop, honk and appear on the street in that car.
- [ ] Confirm the view does not rotate or zoom while moving, but camera adjustment works at rest.
- [ ] Confirm steering is responsive on touch and does not cause the camera to move.
- [ ] Inspect all seven home classes, apartment tiers and road clearance on a real Android screen.
- [ ] Verify two-account visibility, rent expiry/eviction and reconnect behavior.
- [ ] Both CI workflows pass and the user explicitly approves this stage.

**Current stage:** Stage 3 — shared workplace/job framework, rank 1–5 staff, rank 6 boss, authorized promotion/demotion/fire, clock-in/out, task completion, workplace interiors and server-validated payout — is approved and active. The next major stage after Stage 3 acceptance is **Stage 4 — market salespeople and bank tellers**.


## Follow-up: Face-Me visual layout and map navigation (2026-10-11)

- The current authoritative `HOUSES` catalogue and Stage 2 regression test define 35 rentable properties across seven house classes. The former 30-versus-33 discrepancy was resolved, and the new 35-property count is covered by tests; this does not verify every house's live entrance, collision, tenancy or garage routes.
- Keep client house plots, server house IDs/coordinates and collision/entrance positions aligned and verify them in live play. The home-count test no longer treats three Face-Me-I-Face-You visuals as client-only previews.
- Added an **All Places** navigation tab that aggregates registered points of interest, workplaces/organizations, services, shops/stalls, fuel stations, districts and every home without duplicating the same home entry.
- The Homes tab lists every server-provided home and explicitly labels it YOUR HOME, AVAILABLE or OCCUPIED; occupancy and rent actions remain server-authoritative.
- The housing visibility fix does not mark Stage 2 fully complete and does not complete Stage 3. Stage 3 remains the active approved stage; Stage 4 must wait until Stage 3's acceptance gate passes.
