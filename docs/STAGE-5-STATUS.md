# Stage 5 — Hospital, Ambulance and City Park Services

> **Status: ACTIVE — interaction flows implemented; final integration, regression and production verification in progress (11 October 2026).** This stage is designed around real player-to-player services: a citizen uses clear menus to contact available workers, and the worker sees a queue and handles the request through the same server-authoritative workflow.

## Existing locations and ranks

Use the existing workplace IDs and exteriors. Do not create replacement buildings.

### Hospitals
- `hospital-main` — Mile One General Hospital.
- `hospital-princess` — Princess Hospital.
- Ranks: Orderly, Nurse Aide, Nurse, Senior Nurse, Doctor, Chief Medical Director. Princess Hospital may use its own displayed role titles, with the same server permission tiers.

### City Park
- `park-main` — City Park.
- Ranks: Cleaner, Gate Attendant, Ticket Seller, Ranger, Operations Officer, Park Director.

## What is implemented

### Patient ↔ hospital worker interaction
- Hospital panels are reachable from the existing Careers & Factions workplace cards and from the contextual action available to hospital employees. There are not separate duplicate hospital locations.
- A citizen can select a hospital, see staff who are on duty and in uniform, view their own requests and follow the next step. Workers receive a live patient queue and notifications.
- Patients can request regular care at a hospital or an ambulance for serious injury from a public location.
- Regular care follows a patient request → triage → nurse/doctor treatment flow. Orderlies/Nurse Aides can triage; Nurse rank or higher can change health. Clinical actions are rejected if the patient/worker is not at the correct hospital, the worker is off duty/out of uniform, triage is missing, or the patient has no injury/insufficient cash.
- Ambulance requests are assigned to an on-duty Nurse-or-higher responder. The responder must get within 8 metres of the patient in a public area before field treatment is accepted.
- The old free-form contextual medical-treat shortcut has been disabled so it cannot bypass the patient-request queue, validation, receipts or persistence.

### Patient ↔ pharmacy worker interaction
- Citizens physically at a hospital can see stocked medicines, fixed server-set prices, and medical workers available at that location.
- The citizen selects a worker and quantity. The server validates identity, rank, uniform, duty, stock, inventory capacity, whole-number quantity and cash.
- Medicines enter the player's existing inventory; cash, stock, pharmacy till and a customer/staff-scoped receipt ledger are saved.
- Pharmacy balances reject overflow instead of silently clamping money.

### Visitor ↔ City Park staff interaction
- Visitors at the park can view staff currently on duty, buy a daily visitor pass from another on-duty Ticket Seller, and receive a receipt.
- Visitors can request visitor assistance, lost-and-found help, or first-aid assistance. Staff see the on-site queue, can handle requests when authorised and close enough, and the visitor receives a completion notice.
- The park UI explicitly describes the pass as a daily visitor pass: **physical gate enforcement is not implemented yet**, so the interface does not claim that a gate is locked or physically blocks entry.
- Existing generic park task types (groundskeeping and visitor assistance) remain available through the common workplace task engine.

### User experience and safety
- Responsive, in-game panels are used instead of native browser alert popups.
- Panels show a citizen's own requests/receipts, available staff, worker queues and clear reasons when an action is unavailable.
- The game server—not the browser—decides worker permissions, request state, stock, costs, patient health changes, ticket validity and receipt outcome.
- Stage 5 state is kept separately from Stage 4 state and saved through the existing PostgreSQL/file-store paths.
- Request and purchase replay protection, bounded history and deterministic domain tests are in place.

## Automated tests

`services/game-server/src/test-stage5.ts` covers:
- role-specific triage, treatment and ambulance dispatch permissions;
- on-site patient request creation and duplicate-request rejection;
- triage-before-treatment and protected health/money changes;
- field treatment proximity and assigned-responder checks;
- pharmacy stock, inventory, cash, receipts, replay protection and currency-limit safety;
- daily park passes, ticket seller permissions, cash/till reconciliation and duplicate sale rejection;
- visitor help request/resolution permissions and safe state normalization.

The suite runs in Game Server CI as `npm run test:stage5 --workspace nigeria-rp-game-server`.

## Current verification and remaining acceptance work

- [x] Game Server CI passed on commit `44d5a3f09da2166c82b71c8def08a7c6b62aac61`, including typecheck/build and Stage 1–5 regression suites.
- [x] Browser Client Build passed on commit `44d5a3f09da2166c82b71c8def08a7c6b62aac61`.
- [ ] Android debug APK build for commit `44d5a3f09da2166c82b71c8def08a7c6b62aac61` was still running at the last check; the immediately preceding gate/geometry revision passed Android build.
- [x] Railway deployed commit `44d5a3f09da2166c82b71c8def08a7c6b62aac61`; the application service reports SUCCESS, and PostgreSQL is healthy.
- [x] Implemented a visible ticketed City Park perimeter and gate, local collision for the fence/gate leaves, and server-side position validation against a current-day pass. On-duty park workers in uniform receive staff access.
- [x] Homeless respawn now sends a player to the public City Park gate approach outside ticketed grounds without clearing or replacing their housing/lease record.
- [ ] Solo visual check on Android: hospital cards, patient request status, triage-to-treatment transition, pharmacy stock/receipt, park gate access, daily pass and visitor-help panels.
- [ ] User confirms Stage 5 acceptance.

A second human tester is not required to finish the stage. Replay, rank, balance and invalid-location scenarios should be tested automatically; a real transaction involving two simultaneously online players remains marked as not manually verified unless a second session is available.

## Regression boundaries

Keep Stages 1–4, the Face-Me-I-Face-Me exterior visibility fix, player accounts and balances, existing buildings, housing and roads, vehicles, workplace ranks, Market and Bank workflows intact. Any fix to a treatment or visitor interaction must go through the server-authoritative Stage 5 request flow rather than adding an alternative shortcut.
