# Stage 1 — Citizen State and Multiplayer Foundation (Historical Status)

> **Status refreshed 11 October 2026:** The core saved-life/rent clock groundwork described here has been superseded by the current production implementation. This page remains useful as a historical inventory; it is not the current active stage. See [the roadmap](ROADMAP.md).

## Foundation capabilities recorded here

- Server-side life state, workplace/rank definitions, home classes, vehicle IDs and Nigeria-time (WAT) day clock.
- Durable `life` and world state with startup normalization.
- Midnight settlement for online players and offline settlement at reconnect.
- Server request/response paths for life-state refresh and guarded debug test tools.
- Central rank titles and pay multipliers.

## Historical manual boss assignment

The early version used manual boss assignment in stored world data until protected administrator tooling was introduced. Do not use an old account ID or an environmental username allow-list as proof of current authorization. Use the current server-side role/boss/admin logic and verify it through the Stage 3 test gate.

## Regression checks

- [ ] Run `npm run test:stage1 --workspace nigeria-rp-game-server`.
- [ ] Verify account/life state survives logout and reconnect.
- [ ] Verify Nigeria-time rent/settlement does not depend on the device clock.
- [ ] Verify rank/pay rules cannot be changed by a normal client.
- [ ] Run the Stage 1 checks alongside current-stage tests after changes to shared server state.

Stage 3 is active; Stage 4 (market salespeople and bank tellers) is next after Stage 3 acceptance.
