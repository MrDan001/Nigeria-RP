# Stage 4 — Market Salespeople and Bank Tellers

> **Status: ACTIVE — 11 October 2026.** Stage 3 has been accepted and Stage 4 is now the active implementation stage.

## Goal

Build the next complete economy layer without disturbing the already-working housing, roads, vehicles, accounts or workplace framework.

## Market

Six ranks:

1. Hawker
2. Stall Assistant
3. Sales Rep
4. Senior Sales
5. Market Supervisor
6. Market Chairman

The market must support server-authoritative customer orders, listed products, stock, prices, till settlement, salesperson commission and sales history. A client request must never be trusted for product price, stock quantity, commission or final cash outcome.

## Bank

Six ranks:

1. Trainee
2. Teller
3. Senior Teller
4. Loan Officer
5. Operations Manager
6. Branch Manager

The bank must support server-authoritative deposits and withdrawals, receipts and transaction history. A teller cannot invent a balance, withdraw beyond the customer's bank balance, deposit money the customer does not possess, or replay the same request to move money twice.

## Automated foundation added

`services/game-server/src/stage4.ts` now contains the isolated Stage 4 domain engine for:

- Market and bank rank ladders.
- Market product catalogue and starting stock.
- Market sale settlement and commission calculation.
- Bank deposit and withdrawal settlement.
- Idempotency/replay protection for orders and transactions.
- Bounded transaction history and safe state normalization.

`services/game-server/src/test-stage4.ts` contains automated checks covering valid sales, stock/cash reconciliation, commission calculation, invalid/forged requests, replay protection, deposits, withdrawals, teller authorization, insufficient funds and state normalization.

## Next implementation work

1. Wire the Stage 4 domain engine into the existing WebSocket server and persistent world/account state.
2. Reuse the existing `market-mile1` and `bank-main` workplace/interior groundwork instead of creating duplicate locations.
3. Add market customer-order UI and employee sales/till UI to the browser client.
4. Add bank teller transaction UI, receipts and transaction-history UI.
5. Persist Stage 4 state through the existing PostgreSQL/file-store paths used by the server.
6. Add the Stage 4 regression command to the game-server workspace and CI.
7. Deploy to Railway and run automated regression checks before making any visual/gameplay claims.
8. Because the user is the only tester, provide a single-account verification path and rely on deterministic server tests for multi-account/replay/security scenarios rather than blocking on a second human tester.

## Acceptance gate

- [ ] Customer receives exactly the goods ordered and paid for.
- [ ] Market stock, till and salesperson commission reconcile after every valid sale.
- [ ] Invalid products, quantities, prices, ranks and stock states are rejected server-side.
- [ ] Replayed market orders cannot duplicate goods, cash or commission.
- [ ] Deposits reconcile cash and bank balances.
- [ ] Withdrawals reconcile bank and cash balances.
- [ ] Insufficient funds are rejected.
- [ ] Trainees cannot independently settle bank transactions.
- [ ] Replayed bank requests cannot move money twice.
- [ ] Receipts and transaction history persist and are account-scoped.
- [ ] Stage 1–3 regression suites remain green.
- [ ] Stage 4 tests, typecheck, build and CI are green.
- [ ] Railway deployment is healthy.
- [ ] The user approves Stage 4 completion.
