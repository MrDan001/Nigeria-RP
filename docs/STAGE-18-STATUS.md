# Stage 18 — Tablet and Interstate Travel

## Included
- Corrected two-sided 3D signage UVs and the workplace staff-door sign orientation.
- Added an in-game NRS Tablet with Wallet, Contacts, City Map, Rivers News Network, Careers, State Passport, Interstate Travel, NRS Air, and Betting apps.
- Interstate travel supports Waterlines Day Bus, Waterlines Night Bus and NRS Air mode selection. Server-side fares and travel ledger records include the selected mode; older saved trips are migrated as day-bus entries.
- Added fictional Waterlines and NRS Regional Airport visual landmarks. Walk-up boarding, flight check-in, expanded schedules and physical terminal interactions remain clearly marked Coming Soon.
- Betting is a local-only simulation using a separate virtual token balance. It never changes character cash/bank balance and makes no calls to real services.

## Verification notes
- The route catalogue remains at seven city/state destinations and 20 existing route IDs.
- Mode pricing is validated on the game server. The legacy travel protocol defaults to day bus.
- Stage 15 tests now cover mode pricing, invalid modes, duration estimates and legacy ledger normalization.
- Visual device testing should still be performed in a browser after Railway finishes deploying this commit.


## Stage 2 — Character creator Diesel preview integration (18 October 2026)

- [x] Character creator now attempts to load `/Diesel.glb` asynchronously and validates model bounds before showing it.
- [x] The existing mannequin stays visible until Diesel loads successfully and remains as a fallback on error.
- [x] Preview includes camera framing, pointer rotation, idle rotation, and stale-request cancellation when the preview is recreated.
- [ ] Verify the model asset is served by Railway and inspect the deployed creator on desktop/mobile.
- [ ] Confirm whether the Diesel model exposes suitable materials/body parts for skin, hair, outfit and gender customization before claiming those controls alter the imported model.

**Important:** the deployed Stage 1 loader diagnostics previously passed Railway deployment, but actual in-browser GLB rendering has not been visually verified. This integration deliberately preserves the mannequin as a safe fallback.


## Live avatar URL and cache correction (18 October 2026)
- [x] Corrected live-game loader URL from an invalid placeholder GitHub URL containing `...` to `/Diesel.glb`.
- [x] Added revision strings to model and script URLs and advanced the service-worker cache name.
- [ ] Verify production request for `/Diesel.glb` returns successfully and visually confirm Diesel in the live world and creator.

The previous deployment's SUCCESS status only proved the build and server started; it did not prove that the model was loaded by the browser. Visual validation remains open.
