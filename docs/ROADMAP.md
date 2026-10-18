# NRS Roadmap — Current Stage and Next Work

The implementation scope and acceptance checks are in IMPLEMENTATION-ROADMAP.md.

> Status update: 14 October 2026. Stage 16 was accepted by the project owner. Stage 17 — City Explorer Passport & Discovery Rewards — is active on main. Railway is the production host.

| Stage | Canonical scope | Status |
|---|---|---|
| 0 | Repository, server, persistence, CI and Railway deployment foundation | Done for sequencing |
| 1 | Citizen accounts, saved life and multiplayer | Done for sequencing |
| 2 | Homes, rent, residential exteriors/interiors and car-park routes | Done for sequencing |
| 3 | Workplace locations and reusable jobs/ranks/factions engine | Done for sequencing |
| 4 | Market salespeople and bank tellers | Done for sequencing |
| 5 | Hospital treatment workflows and parks | Done for sequencing |
| 6 | Rivers State government and civic finance | Deployed |
| 7 | Police, Army, FRSC and Fire Service | Deployed |
| 8 | Rivers News Network | Implemented |
| 9 | Transport, passengers and haulage | Implemented |
| 10 | Food businesses and everyday shops | Implemented as server foundation |
| 11 | Personal services, property services and utilities | Implemented as server foundation |
| 12 | Education, offices, oil and industry | Implemented |
| 13 | Economy balance, safety and polish | Implemented |
| 14 | Release, load and recovery validation | Complete for automated release gate |
| 15 | Additional cities and inter-city travel | Complete for automated release gate |
| 16 | Distinct city environments and regional identity | Complete — owner accepted |
| 17 | City Explorer Passport & Discovery Rewards | Active |
| Enhancement | Port Harcourt courier pickup/drop-off coverage | Source updated; live verification pending |

## Active stage: Stage 17 — City Explorer Passport & Discovery Rewards

Players receive a persistent passport showing cities visited and a one-time ₦1,500 bonus for each first-time arrival in a new destination. Revisits do not pay the discovery bonus again. The server owns discovery validation, rewards, replay protection and persistence; the browser only displays the saved passport. Automated tests cover one-time rewards, returning visits, separate accounts and malformed stored state.

## Stage 16 — Accepted

The seven city environments, low-poly landmarks, off-road civic plaza, themed shopfronts and local-district guide are deployed. The project owner accepted Stage 16 and authorized progression on 11 October 2026. Physical-device visual review remains optional polish and is not claimed as independently performed.

## Manual test queue

For Stage 17, verify first-visit rewards, repeat-visit behavior, saved passport progress after reconnect/restart, and the passport sheet on a physical phone. Stage 15–16 visual polish can be recorded separately without blocking the approved Stage 17 work.

## Gameplay enhancement — Port Harcourt courier coverage (14 October 2026)

Implemented in the browser source:
- [x] Replace the three hard-coded delivery coordinates with an address pool spanning the full housing catalogue (huts, compound rooms, flats, estates, mansions, palaces and grand homes), plus allowlisted static and procedurally generated apartment/building entrances, shops, banks and named workplaces/public buildings.
- [x] Make each courier job a two-stop route: collect the parcel at one address, then deliver it to another.
- [x] Cycle recipient addresses through the full generated pool so a location can be used as both a pickup and a destination.
- [x] Calculate distance-based rewards with a minimum and maximum payout.
- [x] Point the in-world beacon, mission HUD, expanded map and service map at the current pickup/drop-off stop.
- [x] Validate static and procedurally generated apartment entrance metadata, pickup completion and payout on the game server; calculate rewards server-side.
- [x] Browser-client production build passed in GitHub Actions.
- [ ] Manually verify pickup, drop-off, reachability and touch controls on desktop/mobile.


## Browser build recovery — source fragment size (18 October 2026)

- [x] Split the oversized world/character source at the existing top-level character-section boundary into two ordered classic-script fragments; no game logic was intentionally changed.
- [x] Update the source assembler, browser script loading order, and script cache key for the new character asset.
- [x] Update the source-structure documentation to reflect the split.
- [ ] Confirm the Railway build passes and the new production deployment is healthy.
- [ ] Open the live game and manually verify the lobby-to-game transition, character rendering (including Diesel GLB fallback), movement, and core interactions on desktop/mobile.


## Stage 18 — Diesel GLB character integration (18 October 2026)

- [x] Confirmed `Diesel.glb` is committed in the repository and available in the web-client public assets.
- [x] Found and corrected the live-game loader's invalid placeholder URL (it contained a literal `...`) to use the app-hosted `/Diesel.glb` asset.
- [x] Committed explicit loader diagnostics and fallback-safe validation in the in-game character source.
- [ ] Verify browser loading/CORS and inspect the reported mesh, skeleton and animation metadata.
- [ ] After in-game verification, replace the character creator mannequin with the validated model.
- [ ] Verify movement, appearance options, mobile performance and Railway deployment health.


### Stage 18 follow-up — character creator preview

- [x] Add Diesel GLB loading to the character creator preview with a fallback mannequin and visible load failure status.
- [x] Preserve pointer rotation and fit the model to the creator camera.
- [ ] Verify Railway serves `/Diesel.glb` and inspect the live creator visually.
- [ ] Map customization controls to Diesel model materials/rig after inspecting its mesh and material names.


### Diesel live-avatar correction — 18 October 2026
- [x] Use the local public asset rather than the invalid placeholder GitHub URL.
- [x] Add script/model revision identifiers to bypass stale browser caches.
- [ ] Verify model HTTP response and visual rendering in the deployed game.


### Diesel rendering diagnostics — 18 October 2026
- [x] Production requests show `/Diesel.glb` returns HTTP 200; this proves delivery only, not GLB parsing/rendering.
- [x] Added explicit load progress, timeout, and console diagnostics; bumped script revisions.
- [ ] Inspect the new browser diagnostic and resolve the actual GLB parse/render failure.
- [ ] Confirm Diesel visibly renders in both game world and creator.


### Diesel no-fallback/full-body correction — 18 October 2026
- [x] Removed the visible mannequin fallback from the creator preview while Diesel loads/fails.
- [x] Added bounds-based full-body camera fitting and resize recalculation.
- [x] Legacy in-world avatar now hides before Diesel loading begins.
- [ ] Production visual verification still required; successful deployment alone does not prove GLB rendering.


## Character slots — delete and recreate (18 October 2026)
- [x] Citizen lobby cards now include a DELETE button with a permanent-deletion confirmation.
- [x] Server validates ownership and refuses deletion of an online character; deleting a secondary character frees one of the account's three slots.
- [x] Account-root character is protected to preserve the account's login/ownership anchor.
- [ ] Verify deletion, slot count refresh and replacement-character creation in production.


## Deployment correction — character deletion (18 October 2026)
- [x] Fixed malformed selector quoting that caused the character-selection JavaScript syntax check to fail.
- [ ] Verify successful Railway build and character deletion/recreation in production.


### Character appearance / static-pose fix — 18 October 2026
- [x] Stop replacing the animated, customizable player rig with the static Diesel GLB.
- [x] Restore skin-tone, hairstyle, clothing and gender changes on the visible player rig.
- [x] Add relaxed idle motion and small trait-based posture differences while retaining walk/run cycles.
- [x] Use the same state-driven avatar builder in the creator preview and update client/PWA cache keys.
- [ ] Confirm live visual quality and all options in the deployed game; browser gameplay verification remains outstanding.


### No-block avatar correction — 18 October 2026
- [x] Remove the homemade block/capsule avatar from the creator preview; use Diesel.glb and show a load error instead of a block fallback.
- [x] Restore the same Diesel GLB in the live player scene, keeping the previous rig hidden.
- [x] Route appearance colours to named imported materials and toggle hairstyle meshes only if the asset contains named variants.
- [x] Enable available animations and a bone-pose fallback for supported rigs; refresh script/PWA cache keys.
- [ ] Confirm visual quality on the deployed game; model capability depends on actual mesh/material names and rig contents.


### Procedural body removal — 18 October 2026
- [x] Removed primitive block/capsule body geometry from the game source (not merely hidden it).
- [x] The visible player now depends on Diesel.glb; model load failures do not swap in the old block avatar.
- [x] Refreshed character and animation script cache keys.
- [ ] Visual production verification of the imported model and its rig remains outstanding.
