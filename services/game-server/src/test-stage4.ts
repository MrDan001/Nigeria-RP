import assert from "node:assert/strict";
import {
  BANK_RANKS,
  MARKET_PRODUCTS,
  MARKET_RANKS,
  MARKET_COMMISSION_RATE,
  canExecuteBankTransaction,
  canExecuteMarketSale,
  createBankState,
  createMarketState,
  normalizeStage4State,
  rankTitle,
  settleBankTransaction,
  settleMarketSale,
} from "./stage4";

let passed = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    passed += 1;
    console.log("ok   " + name);
  } catch (error) {
    console.error("FAIL " + name + "\n     " + (error as Error).message);
    process.exitCode = 1;
  }
}

test("market and bank each expose the required six ranks", () => {
  assert.equal(MARKET_RANKS.length, 6);
  assert.equal(BANK_RANKS.length, 6);
  assert.equal(rankTitle(MARKET_RANKS, 1), "Hawker");
  assert.equal(rankTitle(MARKET_RANKS, 6), "Market Chairman");
  assert.equal(rankTitle(BANK_RANKS, 1), "Trainee");
  assert.equal(rankTitle(BANK_RANKS, 6), "Branch Manager");
  assert.equal(rankTitle(BANK_RANKS, 0), "");
  assert.equal(rankTitle(BANK_RANKS, 7), "");
});

test("market sale settles against server-owned stock and customer cash", () => {
  const state = createMarketState();
  const customer = { cash: 50_000, bank: 0 };
  const before = state.stock[MARKET_PRODUCTS[0].id];
  const result = settleMarketSale({
    state,
    orderId: "order-001",
    customer,
    sellerId: "seller-1",
    sellerRank: 3,
    productId: MARKET_PRODUCTS[0].id,
    quantity: 2,
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.result.total, 24_000);
  assert.equal(result.result.commission, Math.floor(24_000 * MARKET_COMMISSION_RATE));
  assert.equal(customer.cash, 26_000);
  assert.equal(state.stock[MARKET_PRODUCTS[0].id], before - 2);
  assert.equal(state.till, 22_800);
  assert.equal(state.commissions["seller-1"], 1_200);
});

test("market rejects forged seller rank, unknown goods, invalid quantity and insufficient stock/cash", () => {
  const state = createMarketState();
  const customer = { cash: 100_000, bank: 0 };
  assert.equal(canExecuteMarketSale(0), false);
  assert.equal(settleMarketSale({ state, orderId: "a", customer, sellerId: "seller", sellerRank: 0, productId: "rice-5kg", quantity: 1 }).ok, false);
  assert.equal(settleMarketSale({ state, orderId: "b", customer, sellerId: "seller", sellerRank: 2, productId: "invented", quantity: 1 }).ok, false);
  assert.equal(settleMarketSale({ state, orderId: "c", customer, sellerId: "seller", sellerRank: 2, productId: "rice-5kg", quantity: 0 }).ok, false);
  assert.equal(settleMarketSale({ state, orderId: "d", customer: { cash: 1_000, bank: 0 }, sellerId: "seller", sellerRank: 2, productId: "rice-5kg", quantity: 1 }).ok, false);
  state.stock["rice-5kg"] = 0;
  assert.equal(settleMarketSale({ state, orderId: "e", customer, sellerId: "seller", sellerRank: 2, productId: "rice-5kg", quantity: 1 }).ok, false);
});

test("replaying the same market order cannot create a second sale or commission", () => {
  const state = createMarketState();
  const customer = { cash: 50_000, bank: 0 };
  const first = settleMarketSale({ state, orderId: "replay-order", customer, sellerId: "seller", sellerRank: 1, productId: "bread", quantity: 1 });
  assert.equal(first.ok, true);
  const cashAfterFirst = customer.cash;
  const stockAfterFirst = state.stock.bread;
  const commissionAfterFirst = state.commissions.seller;
  const second = settleMarketSale({ state, orderId: "replay-order", customer, sellerId: "seller", sellerRank: 1, productId: "bread", quantity: 1 });
  assert.equal(second.ok, false);
  assert.equal(customer.cash, cashAfterFirst);
  assert.equal(state.stock.bread, stockAfterFirst);
  assert.equal(state.commissions.seller, commissionAfterFirst);
});

test("bank deposit moves cash to bank and creates an auditable receipt", () => {
  const state = createBankState();
  const customer = { cash: 100_000, bank: 25_000 };
  const result = settleBankTransaction({ state, requestId: "dep-001", customerId: "customer", tellerId: "teller", tellerRank: 2, customer, type: "deposit", amount: 40_000, now: 1_760_000_000_000 });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(customer, { cash: 60_000, bank: 65_000 });
  assert.equal(result.result.transaction.type, "deposit");
  assert.equal(result.result.transaction.amount, 40_000);
  assert.equal(state.history.length, 1);
});

test("bank withdrawal moves bank balance to cash and records the teller", () => {
  const state = createBankState();
  const customer = { cash: 5_000, bank: 100_000 };
  const result = settleBankTransaction({ state, requestId: "wd-001", customerId: "customer", tellerId: "teller", tellerRank: 3, customer, type: "withdrawal", amount: 30_000, now: 1_760_000_000_100 });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(customer, { cash: 35_000, bank: 70_000 });
  assert.equal(result.result.transaction.tellerId, "teller");
});

test("bank rejects trainee, self-service, forged amount and insufficient funds", () => {
  assert.equal(canExecuteBankTransaction(1), false);
  assert.equal(canExecuteBankTransaction(2), true);
  const state = createBankState();
  const customer = { cash: 100_000, bank: 20_000 };
  assert.equal(settleBankTransaction({ state, requestId: "a", customerId: "customer", tellerId: "teller", tellerRank: 1, customer, type: "deposit", amount: 10_000, now: 1_760_000_000_000 }).ok, false);
  assert.equal(settleBankTransaction({ state, requestId: "b", customerId: "same", tellerId: "same", tellerRank: 2, customer, type: "deposit", amount: 10_000, now: 1_760_000_000_001 }).ok, false);
  assert.equal(settleBankTransaction({ state, requestId: "c", customerId: "customer", tellerId: "teller", tellerRank: 2, customer, type: "withdrawal", amount: 30_000, now: 1_760_000_000_002 }).ok, false);
  assert.equal(settleBankTransaction({ state, requestId: "d", customerId: "customer", tellerId: "teller", tellerRank: 2, customer, type: "deposit", amount: 0, now: 1_760_000_000_003 }).ok, false);
});

test("replaying the same bank request cannot move money twice", () => {
  const state = createBankState();
  const customer = { cash: 50_000, bank: 50_000 };
  const first = settleBankTransaction({ state, requestId: "same-request", customerId: "customer", tellerId: "teller", tellerRank: 2, customer, type: "withdrawal", amount: 20_000, now: 1_760_000_000_000 });
  assert.equal(first.ok, true);
  const afterFirst = { ...customer };
  const second = settleBankTransaction({ state, requestId: "same-request", customerId: "customer", tellerId: "teller", tellerRank: 2, customer, type: "withdrawal", amount: 20_000, now: 1_760_000_000_001 });
  assert.equal(second.ok, false);
  assert.deepEqual(customer, afterFirst);
  assert.equal(state.history.length, 1);
});

test("legacy or malformed Stage 4 state normalizes to safe bounded values", () => {
  const normalized = normalizeStage4State({
    market: { stock: { "rice-5kg": -50, "unknown": 999999999 }, till: -20, commissions: { seller: -5 } },
    bank: { history: [{ type: "deposit", amount: 0 }, { type: "withdrawal", amount: 20_000, id: "ok", requestId: "r", customerId: "c", tellerId: "t", createdAt: 1_760_000_000_000 }] },
  });
  assert.equal(normalized.market.stock["rice-5kg"], 0);
  assert.equal(normalized.market.till, 0);
  assert.equal(normalized.market.commissions.seller, undefined);
  assert.equal(normalized.bank.history.length, 1);
});

console.log("\n" + passed + " Stage 4 checks passed" + (process.exitCode ? " (with failures)" : ""));
