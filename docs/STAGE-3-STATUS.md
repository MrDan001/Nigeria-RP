# Stage 3 — Workplace Locations and Reusable Jobs/Ranks Engine

> **Status as of 11 October 2026: COMPLETE / ACCEPTED.** Stage 3 was explicitly approved by the user for closeout. Automated implementation, regression tests, builds, CI and the Railway production deployment passed. The user is working alone and cannot perform the two-account/Android acceptance session, so those manual checks are intentionally recorded as unavailable rather than blocking the project. Stage 4 is now active.

## Scope completed

Stage 3 provides a shared, server-authoritative foundation for workplaces and roleplay factions:

- Workplace/faction directory and aligned outdoor entrances.
- Six-rank ladders: ranks 1–5 are staff; rank 6 is the boss. Shared pay multipliers are centrally defined.
- Workplace applications, approval/roster state, duty state, task requests and rank/role management.
- Server-side authorization for boss/admin actions; a normal client cannot claim a boss ID or promote itself.
- Clock-in/out, authorized-uniform/context rules, task payout/history and persistence across reconnects.
- Walkable workplace reception/lobbies and staff changing rooms, with validated entrances/exits and nearby-player interactions.
- Per-session player display IDs/nameplates and remote-player visibility.
- Requested hospital exterior locations: Mile One General Hospital in Mile 1 and Princess Hospital along Trans Amadi Road. These buildings are location/content work; they do not by themselves count as the Stage 5 clinical-treatment gameplay.

## Stage 3 release evidence

- `npm run typecheck` — passed.
- Stage 1 regression suite — 22 checks passed.
- Stage 2 regression suite — 7 checks passed; the authoritative housing catalogue remains 33 homes and housing geometry was not changed by the regression correction.
- Stage 3 regression suite — 8 checks passed.
- Game-server and browser-client builds — passed.
- GitHub Browser Client Build and Game Server CI — passed on the merged Stage 3 release.
- Railway production deployment — completed successfully on 11 October 2026.
- Face-Me-I-Face-You building visibility defect — fixed and confirmed visible by the user on the live Railway map.

## Manual-testing note

The remaining two-account and Android acceptance checks were not performed because the user is the only tester available. They are not being represented as performed. They remain useful future regression checks, but they no longer block progression to Stage 4.

## Regression boundaries

- Vehicle movement remains largely client-simulated; do not describe full server-authoritative vehicle physics or multiplayer vehicle replication as finished.
- Stage 2 housing has a confirmed Face-Me-I-Face-You visibility fix. Do not broaden housing scope while implementing Stage 4 unless a verified blocker appears.
- Existing account login, saved money, homes, road/roundabout layout and vehicle controls must remain intact during Stage 4 changes.

## Stage 4 transition

**Stage 4 is active.** It covers market salespeople and bank tellers: customer orders, stock/till/commission settlement, supported deposits/withdrawals, receipts and transaction history.
