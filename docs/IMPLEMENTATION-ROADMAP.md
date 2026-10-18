# Nigeria RP — Full Implementation Roadmap & Developer Handoff

> **Current status, 14 October 2026:** Stage 14 automated release validation is complete. Stage 15 has passed its automated live integration/release gate. Stage 16 — Distinct City Environments & Regional Identity — was accepted by the project owner on 11 October 2026. Stage 17 — City Explorer Passport & Discovery Rewards — is active on main.

## Stage 15 — Additional cities and inter-city travel
**Status: COMPLETE FOR AUTOMATED RELEASE GATE**

The server owns route identity, capacity, fare, duration, balance validation, persistent destination and replay protection. The client requests travel and renders the resulting city/route state.

Implemented:
- [x] Seven-city catalogue: Port Harcourt, Aba, Owerri, Uyo, Warri, Yenagoa and Benin City.
- [x] Twenty directed routes with distance, travel time, capacity and Naira fares, including return journeys.
- [x] Server-authoritative fare validation and deduction inside the shared money mutation queue.
- [x] Persisted city identity in PostgreSQL and file-store fallback.
- [x] Durable trip ledger, replay rejection, recent trip history and rollback on failed persistence.
- [x] City-scoped snapshots and travel departure/arrival broadcast handling.
- [x] Responsive browser travel terminal, route/passenger selection, fare display, arrival transition and cash refresh.
- [x] Saved-city resume/reconnect.
- [x] Deterministic Stage 15 tests and live WebSocket integration test registered in Game Server CI.
- [x] Live integration proves fare deduction, low-balance rejection, city/cash persistence after server restart and replay rejection after restart.
- [x] Stage 1–16 regression suite, typecheck, server build and browser-client production build passed on commit `1327ddc61dae0e4f8be02d5c3e1ddd8ff8c966d2`.
- [x] Railway production deployment succeeded; production service reports online with no current warning/critical issues.

Manual acceptance:
- [ ] Physical Android/mobile route, arrival, reconnect and persistence walkthrough.
- [ ] Visual check of city spawn safety and landmark clearance on a device.

## Stage 16 — Distinct city environments and regional identity
**Status: COMPLETE — ACCEPTED BY PROJECT OWNER**

Implemented:
- [x] Validated environment profiles and distinct sky/fog/accent palettes for all seven travel cities.
- [x] City-specific low-poly landmarks and landmark names.
- [x] Off-road civic plaza, themed shopfronts, trees, benches, street lights and information pavilion.
- [x] On-foot district guide listing city-specific activities and regional landmarks.
- [x] Automated catalogue, game-server, browser build and Railway release checks passed for the deployed checkpoint.
- [x] Project owner accepted Stage 16 and authorized Stage 17 progression on 11 October 2026.

Optional post-acceptance polish:
- [ ] Physical-device visual walkthrough of landmark clearance, movement, frame performance and touch usability.

The owner's acceptance is recorded as an explicit decision to proceed; it does not claim that a physical-device test was independently run. The low-poly landmark models are stylized, not 1:1 photogrammetric replicas.

## Stage 17 — City Explorer Passport & Discovery Rewards
**Status: IN PROGRESS**

Goal: turn inter-city travel into a persistent exploration objective while preventing reward farming through repeat journeys.

Implemented:
- [x] A player-scoped passport records the starting city and each new destination.
- [x] A first server-validated arrival in a previously unstamped city awards ₦1,500; repeated arrivals in already stamped cities award ₦0.
- [x] The passport displays cities visited out of seven, current city, collected stamps and total discovery rewards.
- [x] Reward validation and request replay protection are server-owned.
- [x] Passport state and reward ledger are persisted using the existing PostgreSQL world store with file-store fallback.
- [x] Regression tests cover first arrival, repeat visit, account isolation, replay rejection and malformed stored state.
- [ ] Verify live first-arrival and repeat-visit behavior on Railway.
- [ ] Confirm passport progress survives reconnect/restart and inspect the passport sheet on a physical phone.

The existing fare calculation and travel-route authorization remain authoritative. The discovery reward is applied to the same server-side cash transaction, not calculated by the client.

## Gameplay enhancement — Port Harcourt courier routes
**Status: SOURCE UPDATED; browser production build and Railway build/tests passed; full server CI and live playtest pending**

- [x] Delivery routes cover the full residential catalogue (huts, compound rooms, flats, estates, mansions, palaces and grand homes) plus allowlisted static and procedurally generated apartment/building entrances, retail, bank and workplace/public-building addresses instead of three fixed coordinates.
- [x] Each route requires a parcel pickup and a separate recipient drop-off.
- [x] Route rewards scale with distance and are bounded to a predictable Naira range.
- [x] The active pickup/drop-off waypoint is reflected in the beacon, mission HUD and map labels.
- [x] Parcel pickup is confirmed and persisted by the server; rewards require the confirmed pickup and the assigned drop-off position.
- [x] Server derives each route payment from distance and validates both addresses against house/building coordinates or a procedurally generated apartment's grid position, dimensions and entry metadata.
- [x] Browser production build passed in GitHub Actions.
- [x] Game-server TypeScript typecheck passed in CI.
- [ ] Resolve/retry the existing Stage 15 live-auth integration timeout; the same `authOk` timeout was recorded on the pre-change baseline.
- [ ] Manually test residential and business destinations, reward settlement, reconnect behavior and touch controls on the live game.

## Stage 14 — Release, load and recovery validation
**Status: COMPLETE FOR AUTOMATED RELEASE GATE**

- [x] Deterministic release snapshot validation, bounded state checks, finite-number rejection, deterministic load simulation and recovery serialization validation.
- [x] Stage 14 regression registered in Game Server CI.
- [x] Railway production deployment succeeded on the release-validation checkpoint.
- [ ] Real-device Android load/recovery remains a manual test, not automated evidence.

## Stages 0–13
Their scope and recorded status are tracked in [ROADMAP.md](ROADMAP.md) and their stage status documents. Earlier foundations are not silently treated as full client/UI integration unless separately verified.


## Build recovery — browser source size (18 October 2026)

- [x] Split the oversized world foundation at the existing top-level character/avatar section boundary into two ordered classic-script assets, keeping shared global scope and execution order.
- [x] Update the source assembler, HTML script order/cache key, source-structure guide and quick roadmap.
- [ ] Confirm Railway builds the new commit and the production service returns healthy.
- [ ] Manual live-game test: enter from lobby, inspect character/GLB fallback, move around, and verify key interactions on desktop/mobile. Build success alone does not count as gameplay acceptance.


## Stage 18 — Diesel GLB character integration (18 October 2026)
**Status: Stage 1 diagnostics committed; model and live rendering verification pending**

- [x] Confirm the public test repository contains `Diesel.glb` at its root (10,515,216 bytes) and the game references the matching raw GitHub URL.
- [x] Add explicit loader states, a 20-second timeout, model-bounds/mesh validation, and console diagnostics for load, validation, timeout and request failures.
- [x] Log mesh/material/skinned-mesh/bone/animation metadata when the browser successfully loads the GLB; keep the procedural model visible on failure.
- [ ] Capture actual browser diagnostics from the deployed game and verify the GLB loads over HTTPS/CORS.
- [ ] Confirm Diesel mesh dimensions, rig and animation availability in a running browser; no skeleton/animation compatibility is claimed yet.
- [ ] Integrate Diesel into the character creator preview after the live-game model is verified.
- [ ] Test movement, appearance choices, workplace uniforms, camera framing and mobile performance; then confirm Railway deployment health.

Stage approach: do not replace the character creator mannequin until the in-game model has passed the first visual/load check. A successful source build alone is not gameplay acceptance.


## Stage 18 — Diesel character creator preview (18 October 2026)

- [x] Add asynchronous Diesel GLB loading to the character creator's 3D preview using the repository-served `/Diesel.glb` asset.
- [x] Keep the existing customizable mannequin visible until the GLB loads and passes bounds validation; retain it if loading fails.
- [x] Fit the imported model to the preview camera, support drag rotation and idle rotation, and invalidate stale loads when the creator is closed or rerendered.
- [x] Add clear loading/fallback diagnostics in the creator UI and browser console.
- [ ] Verify the asset path is served by Railway and visually confirm the Diesel preview on desktop and mobile.
- [ ] Verify skin/hair/outfit controls against the Diesel model. The controls remain available, but imported GLB material/body-part mapping is not assumed until inspected.


### Live-game Diesel loading correction (18 October 2026)
- [x] Found the blocker: the in-game avatar loader used a placeholder GitHub URL containing a literal `...`, so the Diesel model request could never reach the intended file.
- [x] Changed the in-game loader to the local `/Diesel.glb` asset and added a revision query to bypass stale model caching.
- [x] Bumped the in-game character and character-creator script URLs and service-worker cache version so deployed clients request fresh assets.
- [ ] Verify Railway serves `/Diesel.glb` and confirm the Diesel avatar visibly replaces the built-in character in the live game and character creator.


### Diesel model load diagnostics — 18 October 2026
- [x] Add progress reporting and explicit timeout/error handling to creator preview and in-world avatar loader.
- [x] Bump script URLs to bypass browser/PWA cached script copies.
- [ ] Capture the precise GLTFLoader parse/load error from production and fix any incompatible/corrupt model data before claiming visual success.
- [ ] Visually verify both the creator preview and in-world player model.


### Diesel no-fallback/full-body correction — 18 October 2026
- [x] Character creator no longer displays the old mannequin while Diesel is loading or when loading fails.
- [x] Creator camera fits imported model bounds and recalculates framing on viewport resize.
- [x] In-world legacy avatar is hidden at load start; it is not shown as a loading fallback.
- [x] Bumped script URLs and service-worker cache version to force clients to request corrected scripts.
- [ ] Verify GLTF parsing and visually confirm full-body Diesel in creator and game world on production.


## Character management — delete and replace a slot (18 October 2026)
- [x] Add a DELETE action to each saved character card in the citizen lobby.
- [x] Require a browser confirmation before permanent deletion; clearly warn that saved progress is removed.
- [x] Handle deletion on the server, verify the character belongs to the signed-in account, refresh the saved character list and make the slot available under the three-character limit.
- [x] Reject deletion of a character currently online.
- [x] Protect the account's original/root character because it anchors account credentials and ownership; a different character must be deleted to free a slot.
- [ ] Run the server build/tests and verify deletion plus recreation on Railway. Do not treat a source commit or deployment success as proof of the live flow.


## Deployment correction — character deletion (18 October 2026)
- [x] Inspected failed Railway build logs: the character-selection script failed the syntax checker due to an incorrectly escaped CSS selector in the new deletion handler.
- [x] Corrected the selector quoting in the deletion handler.
- [ ] Re-run Railway build and verify delete/recreate flow in production.


## Character appearance and animation recovery (18 October 2026)

- [x] Identified why customization did not reach the visible player: the static Diesel GLB replaced the visible rig and hid its animated body parts.
- [x] Keep the appearance-aware joint rig visible until the Diesel model has verified skeletal animations and mapped body materials.
- [x] Restore the customizable model to the creator preview with bounds-based full-body camera fitting and gentle idle motion.
- [x] Preserve the selected personality trait in appearance data and use it to alter idle stance/movement cadence and the player identity line.
- [x] Bump client asset revisions to avoid stale cached scripts.
- [ ] Visually verify appearance, hair, outfit and movement in the live client on desktop and mobile; deployment success alone is not visual acceptance.


## No-block character model recovery (18 October 2026)

- [x] Removed the procedural sphere/capsule character builder from the character creator; the preview loads the repository's Diesel GLB and never substitutes the block model on failure.
- [x] Restored the Diesel model in-world and keep the legacy rig hidden from the first frame through load failure.
- [x] Route saved skin, hair colour and outfit choices to named GLB mesh/material parts where the asset exposes them; hairstyle switching is enabled only if the GLB has multiple named variants.
- [x] Play available idle/walk clips and add a rig-bone relaxed-pose fallback for unanimated skeletal parts.
- [x] Bump client and PWA cache revisions.
- [ ] Visually verify model appearance and movement in the live game. Unmapped choices remain dependent on the asset's actual mesh/material names and skeleton.


## Remove obsolete procedural character geometry (18 October 2026)

- [x] Deleted the capsule/sphere body, head, limbs and clothing meshes from the assembled player source; the remaining compatibility node is empty.
- [x] Simplified the animation loop so it updates the imported Diesel model and no longer manipulates the removed body joints.
- [x] Kept Diesel.glb as the sole visible avatar asset, with no block fallback, and changed cache revisions again.
- [ ] Confirm the Diesel mesh pose, animation and mapped custom appearance choices on a live client.


## Character preview controls and relaxed arms (18 October 2026)
- [x] Added previous/next preview buttons and three appearance presets synchronised to the creator state.
- [x] Improved upper-arm/clavicle bone matching and relaxed-pose rotation to reduce the T-pose.
- [ ] Verify precise pose and all mesh/material mappings in a live browser; hairstyle/accessory variants depend on model geometry.


## Character appearance pipeline follow-up (18 October 2026)
- [x] Set the saved character appearance as the canonical `NRS.characterAppearance` when authenticated character data arrives.
- [x] Dispatch the saved appearance to the active Diesel avatar so the same persisted settings are reapplied after entering the city.
- [x] Reapply appearance updates to an already-loaded Diesel model when creator appearance events fire.
- [x] Run animation mixer updates before the fallback relaxed-pose correction so the mixer does not overwrite the pose in the same frame.
- [ ] Confirm on-device that the GLB exposes compatible arm bones and material names; if the asset is rigid/static, it needs a rigged replacement to get real arm motion and full customization.
