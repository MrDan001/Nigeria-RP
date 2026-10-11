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
