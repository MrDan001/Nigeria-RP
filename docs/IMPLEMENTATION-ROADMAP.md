# Nigeria RP — Full Implementation Roadmap & Developer Handoff

> **Project status — 11 October 2026:** Stage 7 is deployed on Railway at commit `3d50df0da4a1cfb749bbc56d9a844c2a6ca1d29e`; its 13 tests plus Stage 1–7 regression, typecheck, server/browser builds and Android debug-APK workflow passed. Stage 8 — Rivers News Network — is implemented on `main`; verification and Railway rollout for this release are pending. Real-device/two-account checks remain explicitly unclaimed. Keep the Face-Me-I-Face-You visibility fix protected.

> **Gate rule:** The user has explicitly asked to continue through the stages without requiring a second human tester. Use deterministic automated tests for replay, rank, balance and multi-account domain scenarios. Do not claim an unperformed two-account/Android live check as complete; record it as a manual limitation while proceeding with the next approved stage.

**Purpose:** Single practical handoff for a developer joining this repository: current state, implementation sequence, dependencies, tests and the next approved task. Read this before changing gameplay.

**Product:** Nigeria Roleplay Simulator (NRS), a persistent multiplayer roleplay world starting in Port Harcourt, Rivers State, Nigeria.  
**Primary device:** Android browsers, including affordable/low-memory phones.  
**Production play URL:** https://nigeria-rp-production.up.railway.app  
**Repository:** https://github.com/MrDan001/Nigeria-RP  
**Rule:** Do not move to the next major stage until the active stage has been tested and explicitly approved.

---

## 1. Current project reality

### Runtime and source layout

- `services/web-client/index.html` — current 3D browser game: HUD, touch controls, world geometry, homes/interiors, vehicle presentation and local camera/drive simulation.
- `services/web-client/public/nrs-online.js` — browser WebSocket client, authentication/session messages, server API methods and events dispatched into the game.
- `services/game-server/src/server.ts` — TypeScript WebSocket server, sessions, authentication, validation, housing/rent and car-park route messages.
- `services/game-server/src/world.ts` — house/workplace catalogues, saved-life types, Nigeria-time day clock and shared business rules.
- `services/game-server/src/test-stage1.ts`, `test-stage2.ts` — server regression checks.
- `docs/` — product specification, architecture, deployment, stage status and developer handoff.
- `infrastructure/` — deployment/configuration support.

The repo currently uses a browser-native Three.js scene and a TypeScript Node.js WebSocket server. Vite builds the browser client; the same Railway service serves the built browser client and runs the server. PostgreSQL holds durable game data. **Do not begin an unapproved engine rewrite or add another engine as a side task.** If engine migration is proposed, document the cost, migration route and test plan first.

### Data authority

The server/database must own identity, cash/bank, rent, tenancy, owned vehicles, jobs, ranks, inventory and rewards. The client renders the world, takes input and requests actions; it must not authoritatively award valuable state. Current vehicle driving is still largely simulated in the browser. Garage entry/exit and ownership checks use server messages, but production-grade server-authoritative vehicle physics, collision validation and cross-player vehicle replication are **not yet complete**.

### CI and deployment discipline

Run and check both repository workflows after every push:
- **Browser Client Build**
- **Game Server CI**

A green build is not the same as tested gameplay. After CI, check deployment status, hard-refresh the browser (cache-bust the script URL when changing client code), and test on a real phone. Do not claim a visual interaction was live-tested just because a workflow passed.

---

## 2. Work stages and acceptance gates

Checkboxes are evidence still required—not merely a list of UI elements.

### Rules that apply across all workplaces and the economy

- A workplace has exactly six ranks. Ranks 1–5 are staff; rank 6 is the boss. Rank 1 is the normal starting rank.
- Only the assigned boss may promote or demote staff, and staff can never be promoted beyond rank 5. No self-promotion. The boss may promote, demote or fire staff.
- Boss identities are assigned manually in server data for now. A protected admin/boss-management tool is a later task; never trust a client-supplied boss identity.
- Task pay is multiplied by rank: rank 1 = 1.0×, rank 2 = 1.25×, rank 3 = 1.6×, rank 4 = 2.0×, rank 5 = 2.6×, rank 6 = 3.5×. Keep the table easy to tune centrally.
- A game day ends at midnight Nigeria time (WAT, UTC+1), using the server clock. Do not use a device's local clock for rent or payroll.
- Money, bank balances, rent, home ownership, ranks, task completion and valuable inventory changes must be verified and committed by the server/database. UI state is only a request/display, never the authority.
- Default decisions: open hiring at a workplace starting at rank 1; one main job at a time; basic delivery gigs may be open to all; staff cannot quit a boss-level role until admin handling exists; houses are rented with money and have no minimum job rank.
- Each stage must include repeatable tests for valid actions, forged requests, duplicate/replayed requests, disconnects and reconnects. A green build does not replace live phone testing.

### Stage 0 — Repository, server and delivery foundation
**Status: DONE FOR SEQUENCING AT THE USER'S DIRECTION — server/browser build and Railway health checks passed; backup/recovery acceptance remains part of the combined release checklist.**

Scope: repository/docs, CI, Railway-hosted game server, browser delivery, persistence configuration and local development instructions.

Acceptance:
- [ ] A developer can build/check both workspaces from a clean checkout.
- [ ] CI catches browser syntax errors and server type/test regressions.
- [ ] Deployment state is checked instead of assumed.
- [ ] Persistence, backup/recovery and rollback instructions are documented.

### Stage 1 — Citizen accounts, saved life and multiplayer
**Status: DONE FOR SEQUENCING AT THE USER'S DIRECTION — automated Stage 1 regression passed in Stage 6 CI; real-account relogin and multiplayer visual checks remain unclaimed.**

Scope:
- Create account: Email, Username in `Firstname_lastname` form, Password, Repeat password.
- Login: Email and Password only.
- Persist player profile, finances, supported survival state, owned cars, fuel and life.
- Shared online-player count and other-player visibility.
- Reconnect/resume without lost or duplicated progress.
- Server validates sessions and valuable state.

Acceptance:
- [ ] Register a new valid username and reject malformed names.
- [ ] Log out/in and recover the same citizen and saved progress.
- [ ] Run two separate accounts and verify online count and player visibility.
- [ ] Disconnect/reconnect without duplicating or losing progression.
- [ ] Verify persistence against the configured database, not browser-only storage.

### Stage 2 — Homes, rent, exterior buildings, interiors and car-park exits
**Status: DONE FOR SEQUENCING AT THE USER'S DIRECTION — the Face-Me-I-Face-You visibility fix is user-confirmed live; remaining housing and garage checks stay on the combined release-test checklist.**

Scope and intended behavior:
- The server-authoritative Places → Homes catalogue and Stage 2 regression test define 33 rentable homes across Mile 1 Market, Rumuola, D-Line, Waterlines, Trans Amadi and Old GRA. The browser map has 33 residential exterior slots. Automated count alignment does not certify the physical entrance/collision route for every home; those checks remain part of Stage 2 live acceptance.
- Daily rent: Local Hut ₦1,000; Face-Me-I-Face-You ₦2,500; Flat ₦4,000; Estate House ₦7,500; Mansion ₦10,000; Palace ₦20,000.
- One home per player; occupied homes cannot be rented; up to seven prepaid days; rent settles at Nigeria-time midnight; unpaid homes become vacant.
- Distinct class-specific 3D architecture: local hut; shared compound; two-storey flat with balcony; modern estate bungalow/garage wing; mansion with portico; palace with columns/dome.
- Textured asphalt/sidewalks, lane markings, crosswalks, curbs and streetlights.
- Walkable furnished home interiors with an EXIT interaction.
- EXIT presents two choices:
  1. **Exit directly to street** — return on foot to the rented home's outdoor approach.
  2. **Private car park** — enter a covered garage, choose an owned car, register its spawn with the server, drive through the marked gate, stop and honk to enter the street. Garage position samples are bounded and the server derives recent movement speed to reject direct or invalid exit requests; full server-owned vehicle physics remains a separate milestone.
- Camera orientation and zoom remain stable while moving; touch-look and camera-mode changes are allowed only at rest; steering is responsive without moving the camera.
- Eviction must not delete vehicle ownership.

Important limitations:
- House/street models are currently composed from generated Three.js geometry and textures, not bespoke photogrammetry assets. They are more detailed class-specific 3D models, but do not call them photorealistic until art-directed assets and real-device visual inspection justify that description.
- Vehicle movement remains client-simulated. Do not describe full authoritative vehicle physics/anti-cheat as finished.
- House coordinates in `services/game-server/src/world.ts` and reservation geometry in `services/web-client/index.html` must stay aligned.
- Route transitions must not leave the player under a black overlay, inside a hidden session, or at an unrelated point after a failure.

Acceptance:
- [ ] Rent a vacant home; verify money, occupancy, save/refresh and relogin.
- [ ] Server rejects renting a taken home or a second home.
- [ ] Approach the actual home entrance, enter, walk around and reach EXIT.
- [ ] Direct exit returns to the correct outdoor approach.
- [ ] Car park only lists vehicles owned by the account; the server rejects unowned or unregistered garage spawns.
- [ ] Server rejects exit requests when the car has not reached the gate, is moving, has stale samples or the horn is not held.
- [ ] Spawn car, drive down the visible exit lane, stop/honk and emerge on the street in that car.
- [ ] While moving, touch-look cannot rotate the camera and zoom stays fixed; while stopped, camera can be adjusted.
- [ ] Touch steering, brakes and reverse respond cleanly without screen rotation.
- [x] User confirmed Face-Me-I-Face-You exterior buildings are visible on the live Railway map after the root-cause fix deployed on 11 October 2026.
- [ ] Inspect all six home classes, entrance alignment, steps and nearby road clearance on Android.
- [ ] Run Stage 1/Stage 2 tests and both CI workflows.
- [ ] Two-account test confirms players in private interiors are hidden from the shared street.
- [ ] Live behavior is tested and the user approves Stage 2.

**Gate/status note:** Stage 3 was explicitly approved by the user on 10 October 2026 and is already active. Continue to retain the unchecked Stage 2 items as housing regression/closeout checks; do not claim Stage 2 is fully accepted until those specific checks are completed. Do not broaden the housing scope while implementing Stage 3 unless a verified blocker requires it.

### Stage 3 — Workplace locations and reusable jobs/ranks engine
**Status: DONE FOR SEQUENCING AT THE USER'S DIRECTION — automated Stage 3 regression passed in Stage 6 CI; manual multiplayer visual checks remain unclaimed.** Automated permissions, payout and regression checks are part of CI. Two-account Android live acceptance was intentionally not made a blocker because the user is the sole tester; keep that limitation explicit rather than claiming it was manually performed.

- Place and label real workplace buildings and doors at aligned server/client coordinates.
- Build the reusable server-authoritative job service: six titled ranks, rosters, rank-1 hiring/onboarding, clock in/out, shifts, tasks, payout and history.
- Only the data-assigned boss may promote/demote staff from ranks 1–5 or fire staff. Clients cannot set ranks, boss ids or payroll.
- Enforce one main job per citizen; keep simple delivery gigs open to all. Rank-based pay uses the shared multipliers above.
- Add a Work tab and contextual workplace actions; persist work state across logout and reconnect.

Acceptance / closeout:
- [x] Workplace, roster, rank, duty/uniform, task/payout and history paths are implemented and protected by server validation and deterministic regression tests.
- [x] Stage 1–3 automated regression, typecheck/build and CI passed on the accepted Stage 3 checkpoint.
- [x] User explicitly accepted Stage 3 and approved moving to Stage 4.
- [ ] Two-account and Android visual acceptance was not performed because the user is the only available tester; this is documented and does not block progression by agreement.

### Stage 4 — Market salespeople and bank tellers
**Status: DONE FOR SEQUENCING AT THE USER'S DIRECTION — market/bank regression passed in Stage 6 CI; Stage 4 was previously deployed to Railway.** The server-authoritative market catalogue/sales/stock/till/commission flows, manager restocking, bank deposits/withdrawals, receipts and transaction history are wired into the existing workplace cards. The Stage 4 domain suite and server/browser build checks passed on the accepted implementation checkpoint; see [Stage 4 status](STAGE-4-STATUS.md). Solo visual review remains a final user-facing check.
- Market ranks: Hawker, Stall Assistant, Sales Rep, Senior Sales, Market Supervisor, Market Chairman.
- Bank ranks: Trainee, Teller, Senior Teller, Loan Officer, Operations Manager, Branch Manager.
- At the market, customers arrive and request listed goods. Staff fulfil the correct order from valid stock and earn commission; stock and cash changes are server-authoritative.
- At bank counters, citizens can make supported deposits and withdrawals; tellers follow the transaction flow, receipts and balance rules. A teller cannot invent funds or alter a customer's balance.
- Add inventory/stock, prices, till balances, task attribution and transaction history.

Acceptance: customers receive the right goods; cash, bank balances, stock and commissions reconcile; replayed sales/withdrawals do not duplicate value.

### Stage 5 — Hospital and parks
**Status: DONE FOR SEQUENCING AT THE USER'S DIRECTION — automated Stage 5 regression passed in Stage 6 CI; real-device visual checks remain unclaimed.** Stage 5 features are deployed; integrated regression across Stages 1–6 and remaining solo Android visual checks are grouped with the planned test. The existing Mile One General Hospital, Princess Hospital and City Park locations are reused.

- Hospital ranks: Orderly, Nurse Aide, Nurse, Senior Nurse, Doctor, Chief Medical Director.
- Park ranks: Cleaner, Gate Attendant, Ticket Seller, Ranger, Operations Officer, Park Director.
- Hospital panels allow patients to request care or an ambulance, follow status, meet available staff and use a staffed pharmacy; workers receive an on-site queue and must triage before regular treatment. Ambulance dispatch requires a Nurse-or-higher responder, and field treatment requires the assigned worker to reach the patient in a public area.
- City Park visitors can buy a daily pass from a real on-duty ticket seller, request help/lost-and-found/first-aid assistance, and receive completion notices. Park workers receive the visitor-request queue. The receipt-backed pass opens the visible client gate, and server movement validation requires a current-day ticket to enter the bounded grounds; park staff on duty and in uniform receive staff access.
- Hospital treatment, pharmacy sales, park tickets and assistance requests are server-authoritative, persist through the existing store and have deterministic Stage 5 tests. Old contextual treatment that bypassed the hospital request workflow is disabled.
- Existing park work tasks (groundskeeping/visitor assistance) use the shared employment system.

Acceptance:
- [x] Server domain and account-scoped hospital/park workflows are implemented.
- [x] Game Server CI passed on commit `44d5a3f09da2166c82b71c8def08a7c6b62aac61`, including Stage 1–5 regression, typecheck and builds.
- [x] Browser Client Build and Android debug APK build passed on commit `44d5a3f09da2166c82b71c8def08a7c6b62aac61`.
- [x] Railway production deployed commit `44d5a3f09da2166c82b71c8def08a7c6b62aac61`; service is online and the configured `/` health check succeeded.
- [x] Server-authoritative daily park-pass entry, visible gate/collision and public-gate homeless respawn are implemented; respawn does not clear the home/lease record.
- [ ] Solo Android visual check of patient status, triage-to-treatment flow, pharmacy receipt, park gate access, visitor pass and help panels.
- [x] The user directed that previous stages be marked done for sequencing and approved Stage 6; integrated testing is scheduled across Stages 1–6.
- [ ] Remaining solo Android visual checks are not claimed as performed.

### Stage 6 — Rivers State government and civic finance
**Status: DONE — deployed to Railway; Stage 1–6 automated regression, server typecheck/build, browser build and Android debug-APK build all passed.** Railway release label: **Stage 6: Rivers State Government and Civic Finance**.

- Reuses the Rivers State Government workplace and six-rank ladder: Councillor/Assistant/Clerk; Vice Chairman/Special Adviser/PRO; Commissioner/Senator/LGA Chairman; Secretary to the State Government/Chief of Staff/Speaker; Deputy Governor; Governor.
- The appointed Rank-6 Governor is the only ordinary in-game official who can authorize state spending and manage government staff; protected admin override remains available.
- The durable treasury starts with a recorded ₦5,000,000 opening allocation. Public-housing rent credits it; government daily payroll and government task pay debit it. Citizen cash and bank balances remain separate.
- Daily payroll is server-calculated by rank, claimable once per Nigeria-time game day and refused when the treasury cannot cover it.
- Rank-2 officials can publish rate-limited official announcements. The shared job model still groups Vice Chairman, Special Adviser and PRO into Rank 2, so the exact sub-posts cannot yet be distinguished.
- Governor-authorized expenditures require a purpose, are capped at ₦1,000,000 per transaction, and are rejected for invalid amounts, replayed transaction references or insufficient treasury funds.
- Transactions record actor, purpose, time, direction and resulting balance. State is saved through the existing PostgreSQL world-state store with a file-store fallback.

Verification:
- [x] Stage 1–6 Game Server CI suites passed, including Stage 6 treasury/replay/payroll/announcement/spending tests.
- [x] Game server typecheck/build passed.
- [x] Browser client production build passed.
- [x] Android debug-APK build and artifact upload passed in GitHub Actions.
- [x] Railway production deployed commit `f4e795c446bdc5927b9cc3ec30f72bafa32fdee4`; runtime started on port 8080 and PostgreSQL storage initialized.
- [ ] Real-device visual review and a two-account session were not performed and are not claimed; they remain in the combined release review.

### Stage 7 — Police, Army, FRSC and Fire Service
**Status: Implementation pushed to main; Stage 1–7 CI and production deployment are being verified for this release. Real-device/two-account checks are not claimed.**
- Police ladder: Police Constable through Commissioner of Police. Army ladder: Private through Brigadier General. FRSC ladder: Cadet through Sector Commander. Fire Service ladder: Fire Trainee through Chief Fire Officer.
- Build a shared incident system for reported crimes, traffic accidents, fires and large public-safety events; dispatch should create actionable world tasks.
- Police patrol/respond, investigate, arrest and apply valid fines. Fines flow to the state treasury under logged rules.
- Fire officers respond to fires and record extinguishing outcomes. FRSC handles traffic checks/accidents; the Army handles restricted checkpoints and major incidents.
- Add strict abuse controls: server-side proximity/context checks, evidence/reason capture, logs, permissions, cooldowns, escape/appeal handling and reviewable arrest/fine history.

Acceptance: unauthorized arrests, arbitrary fines and restricted-area misuse are rejected; every consequential action is logged and testable.

### Stage 8 — Rivers News Network
**Status — implemented on main; CI and Railway verification pending for this release.** Reuses the existing walkable `news-main` newsroom/studio and six-rank ladder.
- Rank 3+ employees submit event-based copy into a private queue. Rank 5+ Editors approve/reject; rank 4+ Anchors broadcast only approved stories.
- A mobile-conscious public feed and non-blocking ticker update over WebSocket without interrupting gameplay.
- Server-side rank, job, duty, uniform and newsroom-location checks protect editorial actions. Stories may link to active Stage 6 government notices or Stage 7 public-safety incidents.
- Cooldowns, replay protection, profanity filtering, citizen content reports, protected report review/removal and a bounded audit log are implemented.

Acceptance: unapproved stories do not publish; editorial permissions and rate limits hold under retries; reported content can be reviewed and removed. Automated checks are added; live Android/two-account checks remain separate.

### Stage 9 — Transport, passengers and haulage
- Add player-operated danfo/bus routes and stops, keke/okada passenger trips, taxis, terminals and truck-haul depots.
- Each transport workplace uses the shared six-rank system and company-owned vehicles with safe checkout/return and fuel rules.
- Passenger pickup/drop-off, fares, route checkpoints and haulage deliveries must validate proximity, correct vehicle, passenger/task state and route progress on the server.
- Keep steering, camera stability, braking, touch controls and mobile performance as acceptance criteria for vehicle work.

Acceptance: a driver cannot claim a pickup/drop-off or delivery from an invalid location; fare settlements are consistent for both sides; vehicle ownership and fuel persist.

### Stage 10 — Food businesses and everyday shops
- Mama Put, restaurants (cook/waiter), bakery and suya spots; supermarkets (cashier), pharmacy attendant, phone repair and tailor.
- Reuse product stock, orders, service appointments, tills, inventory and server settlement rather than creating separate client-only economy code for every shop.
- Show clear prices, orders and receipts, with stock/ingredient needs where relevant.

Acceptance: a sale, meal or repair requires valid stock/service and a successful server transaction; no duplicate item grants or free client-authored sales.

### Stage 11 — Personal services, property services and utilities
- Mechanic, car wash, filling-station attendant, barber/salon and courier jobs.
- Add electrician/NEPA lineman and plumber roles; household repair calls are linked to the correct property and issue.
- Repair/maintenance orders, fuel purchases, courier deliveries and utility payments use the shared job and transaction framework.
- Avoid turning utilities into cosmetic buttons: each supported bill, repair and payment must persist and produce a result.

Acceptance: only the assigned/authorized worker can complete the right nearby service order; fuel, repairs and utility charges reconcile and survive relogin.

### Stage 12 — Education, offices, oil and industry
- School teachers, school-bus drivers, receptionists, call-centre staff and other office roles.
- Oil-rig workers, refinery technicians, site security, lawyers, journalists and event DJs.
- Restricted facilities need role/qualification checks; industrial production must use validated inputs, shifts, maintenance and output records.
- Keep school/office/industrial duties appropriate to their workplaces and the six-rank rule.

Acceptance: qualifications and facility access are enforced; production cannot create output or revenue without valid resources and work; office and industrial progress persists.

### Stage 13 — Economy balance, safety and polish
- Balance income and sinks so rank 1 can afford a local hut; high-rent houses should require progression through better-paying work and produce meaningful social/economic advancement.
- Test task/reward/rent balance through real play sessions and tune the shared pay multipliers centrally.
- Add anti-cheat checks for position, speed, car ownership, inventory, job completion, task replay, ranks, money and private-route access.
- Polish mobile performance, touch controls, camera stability, onboarding tutorials, error messages and reconnect recovery.
- Audit persistent-data migrations, logs, moderation/reporting and support recovery flows.

Acceptance: new players can understand their first session and earn starter rent; high-value actions resist forgery/replay; Android frame time, memory and interaction targets stay within the agreed budget.

### Stage 14 — Release, load and recovery validation
- Test production build reproducibility, database backup/restore, startup/recovery after a service restart, reconnect behavior and critical persistent-data migrations.
- Load-test concurrent users, snapshots, WebSocket reconnects and common economy/workplace flows; record measured limits instead of assuming capacity.
- Verify operational alerts, moderation/reporting, support/recovery procedures, dependency updates and rollback instructions.
- Run a final real-device Android matrix for low-memory performance, install/open behavior, touch controls, rendering and network failure recovery.

Acceptance: documented load limits; recoverable backups; no duplicate money/items/work rewards after retries/restarts; no release-blocking client/server errors on the supported device matrix.

### Stage 15 — Additional cities and inter-city travel
- Expand beyond Port Harcourt only after the first city passes release/load/recovery acceptance.
- Plan and implement the next city catalogue and server authority boundaries before adding maps; candidate destinations include Lagos, Abuja, Calabar, Aba, Umuahia and Uyo.
- Implement physical road/flight routes, checkpoints, city-specific workplaces and atomic server-side city transfer; retain identity, finances, inventory, property and progression across transfer.
- Validate city loading/interest management and bandwidth/performance on Android.

Acceptance: a citizen can complete an authorized inter-city trip, arrive at the correct destination, retain authoritative state, reconnect safely and not duplicate or lose value during transfer.

### Protected admin and boss assignment — implementation in progress
The current implementation branch introduces a persistent role hierarchy:
- `Dbase_Mccoll` (case-insensitive username) is the exclusive main administrator.
- Only the main administrator may grant or revoke delegated administrator access. The main account cannot be demoted through the in-game controls.
- Delegated admins can use server-validated cross-workplace staff/rank/boss controls already in the job system; ordinary players cannot.
- Admin-role changes, admin-driven rank/dismiss actions, and boss appointments are recorded in a bounded, persistent world audit trail.
- `NRS_MAIN_ADMIN_EMAIL` can bind the root username to the owner's email. Configure this Railway variable to the owner's actual registered email for stronger protection. If the owner account has not yet been created, configure this variable first; public registration cannot claim `Dbase_Mccoll` without the matching email.
- Legacy `NRS_FACTION_ADMINS` usernames are imported to immutable account IDs once on startup. After this migration, the environment allowlist no longer grants live privileges, so main-admin revocations stay effective even if the old Railway variable is still present. Remove that variable after rollout.

This is not a claim that the entire administration feature is complete. It still needs CI, live verification, and a reviewed account-to-account test. Do not store passwords or admin secrets in the client.

---

## 3. Stage sequencing and approval rules

1. Complete the current stage's acceptance list.
2. Run unit/regression tests and both CI workflows.
3. Verify the deployed build on a real phone; record screenshots or notes if useful.
4. Fix current-stage failures before adding new scope.
5. Update stage status and this document whenever behavior changes.
6. Obtain the user's approval before starting the next major stage.

A stage is **not done** just because a commit exists, UI renders, or CI is green.

## 4. Developer commands

Run from repository root:

```bash
npm ci
npm run build
npm run typecheck
npm run test:stage1 --workspace nigeria-rp-game-server
npm run test:stage2 --workspace nigeria-rp-game-server
npm run dev
```

Use `npm run web:dev` to start the browser workspace directly. Check the package scripts before changing commands.

## 5. Current status and production fix — 11 October 2026

The latest gameplay fix, commit `6ccc856311d9bf3513b292c615cc3f504cc2bbb3` (**Fix residential exterior registration and plaque refresh**), was deployed to Railway. The deployment succeeded and its health check passed. The user then confirmed that Face-Me-I-Face-You buildings now appear on the live map. This is confirmation of the housing visibility defect only; it is not a claim that the complete Stage 2 checklist or Stage 3 acceptance is finished.

The workplace interior and per-login player identity feature described below remains part of the active Stage 3 scope. Earlier CI results and a healthy Railway service confirm build/host health but do not replace the outstanding live mobile/multiplayer checks. Admin permissions were not changed.

### Deployed feature — workplace interiors and player identity

The deployed build introduces:
- a walk-in 3D reception/lobby for every existing workplace and faction, with workplace-specific colours, a front entrance, waiting seats, an actual reception counter, office equipment and a visible secretary behind the desk;
- a proximity interaction at the reception desk that welcomes visitors and routes them to reception guidance or the workplace's existing staff/career functions; players in the same reception can see one another and use the existing role-gated player service menu there;
- a side doorway/staff-only entry in each workplace reception; only an employee assigned to that workplace can enter that workplace's staff changing room;
- a visible uniform counter/locker interaction inside the changing room. Server-side employment, correct workplace and off-duty checks remain authoritative. A uniform is not granted by clicking the counter in a different workplace;
- a staff-room exit that returns the employee to the same workplace reception, not to the street. The lobby's own front exit returns them to the outdoor entrance at which they entered;
- a server-authorised, temporary 3-digit player ID for each live login session, shown with the username above the avatar in the exact two-line format `023 | Dbase_Mccoll` / `Level 5`. The permanent account UUID stays internal for saves and player targeting; reconnects allocate a new active-session display ID;
- a small avatar-root height adjustment to keep shoe soles above raised road/pavement and interior-floor surfaces, including after getting out of a vehicle;
- a regression test that verifies each workplace's reception coordinates are unique and within server world bounds.

No existing road or roundabout geometry, home catalogue, housing state, account balance, saved funds, vehicle controls or unrelated gameplay should be changed. This feature does not add new workplaces or houses, and does not implement the separate admin lookup/location tools.

### Required verification before calling this complete

1. Run server typecheck/build and Stage 1/Stage 2 tests, plus the browser build.
2. With a mobile browser, enter at least a hospital, bank, school and one law-enforcement/emergency workplace. Confirm each opens the right reception, and the counter interaction is reachable.
3. Confirm a non-employee cannot enter the staff room or equip a uniform; an employee can go from reception through the staff-only doorway into their assigned changing room, use the uniform counter, then return into reception—not to the street.
4. Confirm the clock-in/task rules still require the authorised uniform and that clocking out restores civilian clothes.
5. Check avatar foot placement on the main roads, walkways, indoor lobby floors, changing-room floors and after exiting a vehicle.
6. With two or more accounts online in the same reception, confirm both avatars are visible to each other and that a permitted on-duty employee can use the role-gated player interaction menu inside the building. Confirm the nameplate displays a session ID and username on one line, level below, and a reconnect changes the reconnected player's ID without breaking player targeting.
7. Recheck login, saved progress/funds, homes, vehicle controls, main roads and roundabouts.

A passing automated build is necessary but is not a substitute for the live-device visual checks above. Do not claim completion until the checks have been performed on the deployed browser game.
