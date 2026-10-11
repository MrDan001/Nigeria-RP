# Stage 4 — Market Salespeople and Bank Tellers

> **Status: IMPLEMENTED AND DEPLOYED — FINAL REVIEW PENDING (11 October 2026).** The Stage 4 server and browser implementation is live on Railway. Automated Stage 1–4 regression, server typecheck/build, and browser build have passed on the latest code commit. The Android debug APK build was still running at the last CI check.

## Scope and ranks

### Market — Mile 1 Market (`market-mile1`)
1. Hawker
2. Stall Assistant
3. Sales Rep
4. Senior Sales
5. Market Supervisor
6. Market Chairman

### Bank — Port Harcourt Bank (`bank-main`)
1. Trainee
2. Teller
3. Senior Teller
4. Loan Officer
5. Operations Manager
6. Branch Manager

## Delivered implementation

### Server-authoritative market
- Six seeded goods, fixed server-owned prices and starting stock.
- A customer may purchase only from a different, online market employee who is clocked in, wearing the market uniform and physically at Mile 1 Market. The customer must also be at the market.
- The server checks seller rank, product, quantity, available stock, buyer cash and inventory capacity. It debits the buyer, adds the goods to the buyer's backpack, credits the market till and tracks the salesperson's 5% commission.
- Receipts and a bounded sales history are saved in the existing PostgreSQL world table or file store.
- Commissions are claimable by the on-duty salesperson at the market; collection is server-validated and persisted.
- Market Supervisors and the Market Chairman may replenish stock from the market till. The wholesale cost is 60% of the listed retail price, per-product stock is capped, and manager identity, receipt and timestamp are recorded in a bounded restock ledger. Restock requests have server-side replay protection.
- Manager stock purchase receipts are visible to Market Supervisors, Market Chairmen and authorised administrators, including when the manager is off duty. Commission-claim controls appear only for an eligible on-duty employee at the market.

### Server-authoritative bank
- Customers can see their own cash and bank balances and transaction history, plus tellers currently available at the branch.
- A teller must be a bank employee of Teller rank or higher, clocked in, wearing the bank uniform and physically at the bank. Both teller and customer must be on site; they must be different players.
- Deposits move existing customer cash into the customer's bank balance. Withdrawals move existing bank funds into cash. The server enforces amount limits, available funds, safe balance limits, whole-number amounts and request replay protection.
- Receipts include a unique transaction reference, customer and teller identity, amount, time and resulting balances. Customer and teller views are filtered to their relevant transactions; authorised management has broader oversight.
- No client-supplied price, balance, commission or final transaction outcome is trusted.

### Client integration and persistence
- Market and bank terminals are accessible from their existing cards in Careers & Factions; no duplicate workplace/building was added.
- Responsive in-game panels cover product catalogue, available salespeople, purchasing, manager restocking, commission collection, receipts/history, teller customer selection, deposits/withdrawals, and bank receipts/history.
- UI validation uses in-game panels instead of native browser alerts.
- Stage 4 state is persisted alongside the existing world data. Money-affecting server actions are queued within a server process so competing requests do not interleave stale in-memory balance snapshots.
- Added deterministic domain tests and registered `npm run test:stage4 --workspace nigeria-rp-game-server` in game-server CI.

## Automated checks

`services/game-server/src/test-stage4.ts` covers:
- rank ladder and teller permissions;
- valid market sales, stock/cash/till/commission reconciliation and inventory purchase mapping;
- invalid product, quantity, stock, rank and insufficient-funds rejection;
- replay protection and request idempotency;
- valid deposits/withdrawals, receipt identity and balance reconciliation;
- trainee/self-service/invalid amount/fractional amount/overflow rejection;
- market supervisor restocking, till funds, stock caps, replay rejection and persisted stock receipts;
- safe normalization of stored state.

## Final acceptance checklist

- [x] Stage 1–4 regression tests, server typecheck/build, and browser build passed on the latest code commit.
- [ ] Android installable debug APK build completes successfully for the latest code commit.
- [x] Railway production deployment succeeded for the latest application code commit; the service is online and its configured `/` health check succeeded.
- [ ] User's solo visual check of the market and bank panels and balances after reconnect.
- [ ] User confirms Stage 4 acceptance.

As previously agreed, a second human tester is not required. Multi-account, replay, authorization and competing-balance domain scenarios are covered by deterministic automated tests. A live transaction that requires two simultaneously online player sessions is not claimed as manually tested here.

## Regression boundaries

Keep the accepted Stage 1–3 implementation and the existing buildings/map, player authentication, player cash/bank, homes/apartments, roads, vehicles and workplace/interior structure intact. Stage 4 reuses `market-mile1` and `bank-main`; no duplicate market or bank locations were added.
