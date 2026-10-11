import {
  STAGE13_MAX_CASH,
  createStage13State,
  creditStage13,
  debitStage13,
  ensureStage13Account,
  normalizeStage13State,
  transferStage13,
  validateStage13Balance,
  validateStage13Price,
} from "./stage13";

const assert = (condition: unknown, message: string): void => { if (!condition) throw new Error(message); };
const rejects = (fn: () => unknown, message: string): void => { try { fn(); throw new Error(`expected rejection: ${message}`); } catch (error) { if (error instanceof Error && error.message === `expected rejection: ${message}`) throw error; } };

const state = createStage13State();
ensureStage13Account(state, "alice", { cash: 1000 });
ensureStage13Account(state, "bob", { cash: 100 });

const purchase = debitStage13(state, "alice", "purchase-1", "purchase", 250, 1700000000000);
assert(purchase.balanceAfter === 750, "purchase balance incorrect");
assert(state.accounts.alice.cash === 750, "purchase was not applied");
rejects(() => debitStage13(state, "alice", "purchase-1", "purchase", 1, 1700000000001), "replay protection");

creditStage13(state, "alice", "wage-1", "wage", 500, 1700000000002);
assert(state.accounts.alice.cash === 1250, "wage balance incorrect");

const transfer = transferStage13(state, "alice", "bob", "transfer-1", 200, 1700000000003);
assert(transfer.debit.balanceAfter === 1050 && transfer.credit.balanceAfter === 300, "transfer balances incorrect");
assert(state.ledger.length === 4, "ledger count incorrect");

rejects(() => transferStage13(state, "alice", "bob", "transfer-2", 999999999, 1700000000004), "insufficient funds");
assert(state.accounts.alice.cash === 1050 && state.accounts.bob.cash === 300, "failed transaction mutated balances");
rejects(() => creditStage13(state, "alice", "bad-time", "wage", 50, 0), "invalid timestamp");
assert(state.accounts.alice.cash === 1050, "invalid timestamp mutated balance");
rejects(() => debitStage13(state, "alice", "too-much", "purchase", 100_000_001, 1700000000005), "payout cap");
assert(state.accounts.alice.cash === 1050, "invalid amount mutated balance");
assert(validateStage13Price(500_000_000) === 500_000_000, "maximum price rejected");
rejects(() => validateStage13Price(500_000_001), "price cap");

const normalized = normalizeStage13State({ accounts: { alice: { cash: -50, bank: 7 }, bob: { cash: 20, bank: 30 } }, completedRequests: { a: true }, ledger: [{ id: "x", requestId: "a", actorId: "bob", kind: "fine", amount: 20, at: 1700000000000, balanceAfter: 10 }] });
assert(normalized.accounts.alice.cash === 0 && normalized.accounts.alice.bank === 7, "state normalization failed");
assert(normalized.accounts.bob.cash === 20 && normalized.ledger.length === 1, "normalized state lost valid data");

const capped = createStage13State();
ensureStage13Account(capped, "rich", { cash: STAGE13_MAX_CASH - 10 });
creditStage13(capped, "rich", "small-credit", "refund", 10, 1700000000006);
assert(capped.accounts.rich.cash === STAGE13_MAX_CASH, "cash cap failed");
rejects(() => creditStage13(capped, "rich", "overflow-credit", "refund", 1, 1700000000007), "cash cap");
assert(validateStage13Balance(capped, "rich"), "final balance validation failed");

console.log("Stage 13 tests passed");
