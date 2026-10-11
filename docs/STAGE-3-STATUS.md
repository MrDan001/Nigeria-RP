# Stage 3 — Workplace Locations and Reusable Jobs/Ranks Engine

> **Status as of 11 October 2026: ACTIVE.** Stage 3 was explicitly approved on 10 October 2026. Its implementation is present in the current source/deployed game, but the stage is not marked complete until the acceptance checks below are run, recorded and approved. Stage 4 is the next major stage.

## Scope

Stage 3 provides a shared, server-authoritative foundation for workplaces and roleplay factions:

- Workplace/faction directory and aligned outdoor entrances.
- Six-rank ladders: ranks 1–5 are staff; rank 6 is the boss. Shared pay multipliers are centrally defined.
- Workplace applications, approval/roster state, duty state, task requests and rank/role management.
- Server-side authorization for boss/admin actions; a normal client cannot claim a boss ID or promote itself.
- Clock-in/out, authorized-uniform/context rules, task payout/history and persistence across reconnects.
- Walkable workplace reception/lobbies and staff changing rooms, with validated entrances/exits and nearby-player interactions.
- Per-session player display IDs/nameplates and remote-player visibility.
- Requested hospital exterior locations: Mile One General Hospital in Mile 1 and Princess Hospital along Trans Amadi Road. These buildings are location/content work; they do not by themselves count as the Stage 5 clinical-treatment gameplay.

Some Stage 4 groundwork is already present in source (bank transfers/withdrawal validation, market/storefront interactions and shop interiors). This is acknowledged as early implementation, not a reason to skip or mark the Stage 3 gate passed.

## Current known boundaries

- Vehicle movement is still largely client-simulated. Do not call vehicle physics or multiplayer vehicle replication fully authoritative.
- Stage 2 housing has a confirmed root-cause fix for Face-Me-I-Face-You visibility, but the rest of the rent/interior/car-park and two-account regression list remains open where not yet verified.
- The server-backed house catalogue and Stage 2 tests now define 33 rentable homes, matching the 33 residential exterior slots documented in the browser map. Live house entrance/collision, rent and garage checks remain open; do not change residential rendering as part of this Stage 3 closeout.
- Railway health checks establish deployment health, not full Stage 3 gameplay acceptance.
- A dedicated `test:stage3` script now exists in the game-server workspace. It covers rank ladders/multipliers, workplace and faction mapping, application and duty rules, rank permissions, task eligibility, work payout-history normalization and audit persistence. It is domain/regression coverage, not a substitute for two-account gameplay tests.

## Automated implementation updates — 11 October 2026

The current Stage 3 closeout adds durable recent paid-task receipts to each account's saved life record (bounded to 50 records), shows those receipts in the Careers panel, and records applications, hires, departures, promotions/demotions, dismissals and boss replacements in a separate persistent workplace audit trail (bounded to 500 entries). The privileged admin audit remains separately capped at 200 entries so routine career activity cannot evict admin-access records. Existing saves without a work history or workplace audit normalize safely. A player's receipts are returned only in that authenticated player's snapshot and are not used as authority for the payout itself; the server still validates and applies the payout.

The Stage 2 CI regression mismatch was a stale assertion: the current authoritative home catalogue has 33 entries. The fix updates the expected count to 33; it deliberately does not remove or reposition any housing/building geometry, and does not close the outstanding Stage 2 live-route checks.

Automated acceptance remains only one part of the Stage 3 gate. The deployed Android and two-account checks below remain unchecked until they are actually performed.

## Acceptance checklist

### Authorization, ranks and tasks

- [ ] Two separate accounts can view the workplace state and complete a valid application/approval/hiring flow.
- [ ] Every workplace shows its correct six rank titles and server-defined multipliers.
- [ ] Only the assigned boss or explicitly authorized administrator can promote, demote, dismiss staff or appoint a boss.
- [ ] A normal player cannot self-promote, spoof another boss, bypass approval, or set a client-supplied rank/pay value.
- [ ] Clock-in/out and uniform requirements are enforced server-side for workplace actions.
- [ ] Tasks require the correct location/context, reject invalid/replayed completion, and pay only once.
- [ ] Work state and payouts survive refresh, logout and reconnect; database results remain authoritative.
- [ ] Admin/rank/boss changes and consequential staff actions are auditable and cannot be forged from the browser.

### Buildings, client and multiplayer

- [ ] Workplace doors and navigation markers line up with their visible entrances.
- [ ] A non-employee cannot enter the staff-only room or equip another workplace's uniform.
- [ ] The employee can follow the reception → assigned staff room → reception → outdoor exit route correctly.
- [ ] Single-player and two-player checks confirm each avatar nameplate is readable; session ID changes on reconnect without breaking targeting.
- [ ] Existing account login, saved money, homes, road/roundabout layout and vehicle controls still work.
- [ ] Test at least a hospital, bank, school and one law-enforcement/emergency workplace on Android.

### Build/deployment/release gate

- [ ] `npm run typecheck`
- [ ] `npm run test:stage1 --workspace nigeria-rp-game-server`
- [ ] `npm run test:stage2 --workspace nigeria-rp-game-server`
- [ ] Add and run the appropriate Stage 3 regression tests for the high-risk permission/task/payout flows.
- [ ] `npm run build`
- [ ] GitHub **Browser Client Build** and **Game Server CI** workflows pass.
- [ ] Railway deployment is successful and healthy.
- [ ] Real Android/two-account gameplay checks above are completed.
- [ ] The user approves Stage 3 completion and transition.

## Next stage — Stage 4

Stage 4 is market salespeople and bank tellers: customer orders, stock/till/commission settlement, supported deposits/withdrawals, receipts and transaction history. Its formal gate begins after the checklist above passes and the user approves the transition. See [the implementation roadmap](IMPLEMENTATION-ROADMAP.md).
