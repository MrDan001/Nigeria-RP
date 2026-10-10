# Nigeria RP — Full Implementation Roadmap & Developer Handoff

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

The repo currently uses a browser-native Three.js scene and a TypeScript Node.js WebSocket server. Vite builds the browser client; the server uses `ws` and PostgreSQL. **Do not begin an unapproved engine rewrite or add Unity/PlayCanvas as a side task.** If engine migration is proposed, document the cost, migration route and test plan first.

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
**Status: Foundation exists; maintain it.**

Scope: repository/docs, CI, Railway-hosted game server, browser delivery, persistence configuration and local development instructions.

Acceptance:
- [ ] A developer can build/check both workspaces from a clean checkout.
- [ ] CI catches browser syntax errors and server type/test regressions.
- [ ] Deployment state is checked instead of assumed.
- [ ] Persistence, backup/recovery and rollback instructions are documented.

### Stage 1 — Citizen accounts, saved life and multiplayer
**Status: Core code exists; real-player verification is still required.**

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
**Status: In progress. Do not call finished until live interaction/visual testing and user approval.**

Scope and intended behavior:
- Places → Homes lists 30 homes across Mile 1 Market, Rumuola, D-Line, Waterlines, Trans Amadi and Old GRA.
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
- [ ] Inspect hut, flat, estate, mansion and palace shape/door/steps and nearby road clearance on Android.
- [ ] Run Stage 1/Stage 2 tests and both CI workflows.
- [ ] Two-account test confirms players in private interiors are hidden from the shared street.
- [ ] Live behavior is tested and the user approves Stage 2.

**Gate:** Do not begin Stage 3 workplace/rank implementation before Stage 2 is approved.

### Stage 3 — Workplace locations and reusable jobs/ranks engine
**Begin only after Stage 2 passes live testing and the user explicitly approves it.**

- Place and label real workplace buildings and doors at aligned server/client coordinates.
- Build the reusable server-authoritative job service: six titled ranks, rosters, rank-1 hiring/onboarding, clock in/out, shifts, tasks, payout and history.
- Only the data-assigned boss may promote/demote staff from ranks 1–5 or fire staff. Clients cannot set ranks, boss ids or payroll.
- Enforce one main job per citizen; keep simple delivery gigs open to all. Rank-based pay uses the shared multipliers above.
- Add a Work tab and contextual workplace actions; persist work state across logout and reconnect.

Acceptance: two-account hiring and roster test; rank/title changes and pay match the server; self-promotion, boss impersonation, unauthorized firing and double task rewards are rejected.

### Stage 4 — Market salespeople and bank tellers
- Market ranks: Hawker, Stall Assistant, Sales Rep, Senior Sales, Market Supervisor, Market Chairman.
- Bank ranks: Trainee, Teller, Senior Teller, Loan Officer, Operations Manager, Branch Manager.
- At the market, customers arrive and request listed goods. Staff fulfil the correct order from valid stock and earn commission; stock and cash changes are server-authoritative.
- At bank counters, citizens can make supported deposits and withdrawals; tellers follow the transaction flow, receipts and balance rules. A teller cannot invent funds or alter a customer's balance.
- Add inventory/stock, prices, till balances, task attribution and transaction history.

Acceptance: customers receive the right goods; cash, bank balances, stock and commissions reconcile; replayed sales/withdrawals do not duplicate value.

### Stage 5 — Hospital and parks
- Hospital ranks: Orderly, Nurse Aide, Nurse, Senior Nurse, Doctor, Chief Medical Director.
- Park ranks: Cleaner, Gate Attendant, Ticket Seller, Ranger, Operations Officer, Park Director.
- Build hospital triage, treatment, ambulance dispatch, medicine/pharmacy trips and injury care. Hurt citizens must pay valid treatment costs through the server settlement flow.
- Build park entry/ticket sales, visitor-care duties, cleaning/ranger tasks and park activity.
- Use the same workplace roster and rank permissions; emergency or healing actions need a valid place, patient and authorized worker.

Acceptance: health/treatment persists; unauthorized or remote healing is rejected; ticket sales reconcile; homeless respawn routes to a designated public park/parking point without deleting property.

### Stage 6 — Rivers State government and civic finance
- Rank 6: Governor (boss). Rank 5: Deputy Governor. Rank 4: Secretary to the State Government, Chief of Staff and Speaker. Rank 3: Commissioners, Senators and LGA Chairmen. Rank 2: Vice Chairmen, Special Advisers and PRO. Rank 1: Councillors, Assistants and Clerks.
- Government staff use the shared work system. The Governor is the only in-game official allowed to promote/demote/fire this workplace's staff, with rank rules enforced server-side.
- State treasury tracks authorized income and spending. Rent from vacant government-owned houses is collected into the treasury; approved government staff payroll is paid from it.
- PRO tools publish rate-limited official announcements; the other roles receive simple, auditable duties appropriate to their authority.
- Citizen funds and the government treasury must remain separate and auditable.

Acceptance: only authorized ranks can issue notices or civic actions; rent and payroll transactions reconcile to treasury records; no client can mint or redirect public funds.

### Stage 7 — Police, Army, FRSC and Fire Service
- Police ladder: Police Constable through Commissioner of Police. Army ladder: Private through Brigadier General. FRSC ladder: Cadet through Sector Commander. Fire Service ladder: Fire Trainee through Chief Fire Officer.
- Build a shared incident system for reported crimes, traffic accidents, fires and large public-safety events; dispatch should create actionable world tasks.
- Police patrol/respond, investigate, arrest and apply valid fines. Fines flow to the state treasury under logged rules.
- Fire officers respond to fires and record extinguishing outcomes. FRSC handles traffic checks/accidents; the Army handles restricted checkpoints and major incidents.
- Add strict abuse controls: server-side proximity/context checks, evidence/reason capture, logs, permissions, cooldowns, escape/appeal handling and reviewable arrest/fine history.

Acceptance: unauthorized arrests, arbitrary fines and restricted-area misuse are rejected; every consequential action is logged and testable.

### Stage 8 — Rivers News Network
- Create a walkable newsroom/studio, newsroom tools and six-rank ladder: Intern, Production Assistant, Reporter, Anchor, Editor, Editor-in-Chief (boss).
- Reporters file stories tied to in-world events; anchors broadcast approved reports; the editor approves/moderates publication.
- Publish a small in-game news ticker and phone feed; the feed must be readable on Android and update without blocking gameplay.
- Add rate limits, a word/profanity filter, report button, moderation logs and protected Editor-in-Chief permissions.

Acceptance: unapproved stories do not publish; publication permissions and rate limits hold under retries; reported content can be reviewed and removed.

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

### Later task — Protected admin and boss assignment
After the core job system is stable, add a protected admin tool to assign workplace bosses and manage exceptional account actions. It must require server-authorized admin identity, log each action, prevent self-granting admin permissions and avoid hard-coding a client-side secret. Manual boss data remains the source until that tool is reviewed and approved.

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


## Administrator role acceptance

- `Dbase_Mccoll` is configured as the superior administrator using server-side `NRS_SUPER_ADMINS`; match usernames case-insensitively.
- The superior admin can delegate or revoke admin roles for account IDs; role changes survive restart/reconnect.
- The superior admin and delegated admins can assign workplace ranks 1–6 and appoint bosses; only the superior admin manages the administrator list.
- Delegated admins cannot change their own workplace rank or manage the superior admin's account.
- Client-submitted role claims never determine permission. Server role state and the server-only allow-list are authoritative.

## 5. Current authorized focus — 10 October 2026

Stage 3 has been approved and is in progress. The current user-requested work is to correct the player overhead-nameplate feature at its root, configure the named owner account as a faction administrator, and allow that administrator to assign online players to any workplace/faction rank (1 through 6) across departments. The user should be able to appoint bosses, assign staff ranks, and remove staff through server-validated controls.

The nameplate acceptance test must cover:
1. One player online: the local avatar shows its authenticated username and current level above the head.
2. Two or more players online: every player sees the other players' usernames and levels above their avatars.
3. Reconnect: labels reappear from the newly authenticated server identity.
4. Deployed Android browser: the cache-busted client assets load the same build that passed CI.

Patches are prohibited as a substitute for root-cause correction. Trace the canonical identity from the server's authenticated player payload into session state and the avatar render object. Do not layer on duplicate loops or optional-DOM guesses to conceal a missing identity. Likewise, diagnose failures in the responsible layer and remove obsolete workarounds rather than stacking fixes.

Preserve the main roads, roundabouts, residential access paths, homes, account progress, money, driving controls and all other unrelated features. Adding more houses is explicitly deferred. Do not claim the result is complete until the build/tests pass and the named visual scenario is checked in the live game.

