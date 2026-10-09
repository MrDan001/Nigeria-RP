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

### Stage 3 — Workplaces, staff ranks and job engine
**Next major stage only after Stage 2 approval.**

Build one reusable, server-authoritative Work framework:
- Work tab, workplace interaction, hiring at the workplace, rank 1 onboarding.
- Ranks 1–5 staff and rank 6 boss.
- Only a workplace's assigned boss may promote/demote staff within ranks 1–5; nobody changes their own rank; only the boss can fire staff. Boss assignment remains admin-controlled until a protected admin tool exists.
- One main job per player at a time; simple delivery gigs may be open to all.
- Server owns clock-in/out, shifts, task assignment/progress/completion, rewards and transaction history.
- Rank pay multipliers: 1.0×, 1.25×, 1.6×, 2.0×, 2.6× and 3.5× for ranks 1–6.
- Every request rechecks workplace, rank and task state; persist the result and recover from disconnects.

Acceptance: two-account hiring/working/pay flow; forged tasks, double payouts and unauthorized rank changes are rejected; rank and pay logic have repeatable tests.

### Stage 4 — Markets, shops, food and everyday economy
- Common vendor/business model for market stalls, groceries, water, food sellers and consumer goods.
- Server-managed stock, price, purchase/sale contracts, cash/inventory mutation and transaction receipt.
- No client-only purchases or silent free-item grants.
- Idempotent handling so retrying a request cannot duplicate a purchase.

Acceptance: funds and item grants commit consistently and remain correct after refresh/reconnect.

### Stage 5 — Banking, treasury and financial records
- Citizen wallet, bank deposit/withdrawal, supported transfers, statements and transaction history.
- Business accounts and records for salary, rent, market and service charges.
- Government treasury and approved spending/collection as protected extensions, not editable client balance fields.
- Audit records include identifiers, Nigeria-time timestamp, actor, counterparty, amount and result.

Acceptance: replayed/concurrent requests cannot double-spend; history reconciles with balances; role permissions are enforced.

### Stage 6 — Health, hospital, pharmacy and recreation
- Server-owned health, hunger and treatment outcomes.
- Physical clinic/hospital, medical staff interactions, prescriptions/stock and payments.
- Parks and recreation/social locations with world-based interaction.
- Injury and respawn rules must not incorrectly delete cash or property.

Acceptance: treatment requires valid context and staff authority; health changes persist and cannot be client-forged.

### Stage 7 — Public safety and emergency services
- Police: incidents, officers, evidence, arrest and justice workflow.
- FRSC: traffic incidents, road checks and vehicle-related actions.
- Fire service: dispatch, fire incidents and physical response.
- Army/military: restricted access, rank and misuse safeguards.
- Dispatch creates real world tasks; NPCs must not secretly replace a player role intended by design.

Acceptance: access follows role/rank; actions are logged; permissions and abuse scenarios are tested.

### Stage 8 — Transport and passenger services
- Taxi as the first flagship physical player-to-player job.
- Passenger requests, proximity pickup/drop-off, fares, receipts, cancellation/dispute rules.
- Expand to keke, danfo, bus routes, terminals, shifts and fares.
- Validate real proximity, vehicle state, task state and fare calculation server-side; keep outcomes consistent across clients.

Acceptance: a driver cannot claim a pickup/drop-off without a valid nearby passenger and matching task; both sides see the same settlement.

### Stage 9 — Communication, news and social systems
- Proximity/local/global text chat, rate limits and moderation.
- Phone interactions, contacts, notifications and call-state architecture.
- News stations/reporters and in-world bulletin publishing with permissions.
- Choose any voice technology only after evaluating device/network constraints; a button is not proof that voice works.
- Reporting, mute/block, retention and moderation controls.

Acceptance: permissions and proximity are enforced; disconnects do not leave stuck call/chat state.

### Stage 10 — Government and civic institutions
- Government offices, official roles, appointments and public services.
- Public treasury/budgets with approval controls and audit records.
- Civic workflows performed by authorized staff.
- Protected news and public notices.

Acceptance: users cannot impersonate officials, rewrite treasury totals or approve restricted actions for themselves.

### Stage 11 — Utilities and education
- Electricity, water, waste/utilities, bills and outages where required by design.
- Schools, training and qualifications that affect relevant job eligibility.
- Providers/educators use the common employment, economy and permission models.
- Persist bills and qualifications; handle restart and appealable failures.

Acceptance: bills, grades and qualifications require server validation and survive restart.

### Stage 12 — Offices, oil, gas and industry
- Office buildings, company ownership and role-specific in-world workflows.
- Oil/gas sites, industrial businesses, shifts, production tasks and supply chain.
- Restricted facilities, safety/environment events and qualifications.
- Production, stock and revenue are auditable and server-owned.

Acceptance: output requires eligible staff, resources and task state; client requests cannot create duplicate output/revenue.

### Stage 13 — Port Harcourt world completion and content density
- Extend neighborhoods with reviewed streets, lots, buildings, entrances, sidewalks, signs and landmarks.
- Keep house placements, collision footprints, road geometry and navigation destinations aligned.
- Replace geometry placeholders with optimized art-directed assets as the budget allows; use LODs, instancing and distance-based creation.
- Add traffic, pedestrians, sound, day/night/weather and world events within Android budgets.
- Interest management and streaming must avoid loading the whole city at full fidelity.

Acceptance: district-by-district visual/route tests; no essential entrance blocked; mobile frame time and memory stay within budget.

### Stage 14 — Gameplay balance, onboarding, anti-cheat and moderation
- Guided first session, clear controls, starter funds/items and safe first-job path.
- Balance income/sinks, rent pressure, pacing and progression through playtests.
- Server validation for position, speed, vehicles, money, inventory, job completion, ranks and item use.
- Reports, bans, audit trail, support/recovery tools and data migration plans.
- Failure/reconnect and abuse cases are required for each feature, not deferred to launch.

Acceptance: new players understand the core loop; high-value actions resist forgery/replay; support can use audit history to investigate problems.

### Stage 15 — Release readiness and additional cities
- Multiplayer soak/load testing: start at 5 concurrent players, then 20 and 50+ where infrastructure permits.
- Latency, reconnect, database restart, deploy rollback, recovery and mobile performance tests.
- Backup/restore drill, schema migrations, secrets audit, monitoring and incident runbooks.
- Expand to Lagos, Abuja, Calabar, Aba, Umuahia, Uyo and inter-city routes only after Port Harcourt is stable.
- Inter-city transfer must preserve identity, inventory, vehicles, money and job state atomically.

Acceptance: release checklist is signed off; recovery/rollback has been tested; additional cities are not used to hide unfinished core multiplayer systems.

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

## 5. Next action today

**Continue Stage 2 only:** finish and test home exit choice and private car-park route, keep the camera stable during motion while improving steering response, verify exterior building/door placement and road clearance, run both CI workflows, then test the live game. Do not start Stage 3 until the user tests and approves Stage 2.

The client currently uses generated Three.js geometry for residential and street visuals. Keep the Android performance budget in view and be honest about whether changes have been visually tested on the live deployment.
