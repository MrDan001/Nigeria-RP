export const STAGE13_VERSION = 1;
export const STAGE13_LEDGER_LIMIT = 500;
export const STAGE13_REQUEST_LIMIT = 500;
export const STAGE13_MAX_CASH = 2_000_000_000;
export const STAGE13_MAX_PRICE = 500_000_000;
export const STAGE13_MAX_PAYOUT = 100_000_000;

export type Stage13TransactionKind =
  | "purchase"
  | "wage"
  | "payout"
  | "fine"
  | "transfer"
  | "refund";

export type Stage13Transaction = {
  id: string;
  requestId: string;
  actorId: string;
  counterpartyId: string | null;
  kind: Stage13TransactionKind;
  amount: number;
  at: number;
  balanceAfter: number;
};

export type Stage13Account = {
  cash: number;
  bank: number;
};

export type Stage13State = {
  accounts: Record<string, Stage13Account>;
  completedRequests: Record<string, true>;
  ledger: Stage13Transaction[];
};

const cleanId = (value: unknown, max = 120): string => String(value ?? "").trim().slice(0, max);
const safeMoney = (value: unknown): number => {
  const n = Number(value);
  return Number.isSafeInteger(n) && n >= 0 ? Math.min(STAGE13_MAX_CASH, n) : 0;
};
const validAmount = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) > 0 && Number(value) <= STAGE13_MAX_PAYOUT;
const validTime = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) > 0;

export function createStage13State(): Stage13State {
  return { accounts: {}, completedRequests: {}, ledger: [] };
}

export function normalizeStage13State(raw: unknown): Stage13State {
  const state = createStage13State();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return state;
  const value = raw as Record<string, unknown>;
  if (value.accounts && typeof value.accounts === "object" && !Array.isArray(value.accounts)) {
    for (const [actorId, rawAccount] of Object.entries(value.accounts as Record<string, unknown>)) {
      if (!rawAccount || typeof rawAccount !== "object" || Array.isArray(rawAccount)) continue;
      const account = rawAccount as Record<string, unknown>;
      state.accounts[cleanId(actorId)] = { cash: safeMoney(account.cash), bank: safeMoney(account.bank) };
    }
  }
  if (value.completedRequests && typeof value.completedRequests === "object" && !Array.isArray(value.completedRequests)) {
    for (const [requestId, flag] of Object.entries(value.completedRequests as Record<string, unknown>).slice(-STAGE13_REQUEST_LIMIT)) {
      if (flag === true && cleanId(requestId)) state.completedRequests[cleanId(requestId)] = true;
    }
  }
  if (Array.isArray(value.ledger)) {
    for (const item of value.ledger.slice(-STAGE13_LEDGER_LIMIT)) {
      if (!item || typeof item !== "object" || Array.isArray(item)) continue;
      const tx = item as Record<string, unknown>;
      const id = cleanId(tx.id), requestId = cleanId(tx.requestId), actorId = cleanId(tx.actorId);
      const amount = safeMoney(tx.amount), at = Number(tx.at), balanceAfter = safeMoney(tx.balanceAfter);
      if (!id || !requestId || !actorId || !validTime(at) || !Number.isSafeInteger(amount) || amount < 0) continue;
      state.ledger.push({ id, requestId, actorId, counterpartyId: tx.counterpartyId == null ? null : cleanId(tx.counterpartyId), kind: String(tx.kind) as Stage13TransactionKind, amount, at, balanceAfter });
    }
  }
  return state;
}

export function ensureStage13Account(state: Stage13State, actorId: string, initial: Partial<Stage13Account> = {}): Stage13Account {
  const key = cleanId(actorId);
  if (!key) throw new Error("actor required");
  return state.accounts[key] ?? (state.accounts[key] = { cash: safeMoney(initial.cash), bank: safeMoney(initial.bank) });
}

function markRequest(state: Stage13State, requestId: string): void {
  const key = cleanId(requestId);
  if (!key) throw new Error("request required");
  if (state.completedRequests[key]) throw new Error("request already used");
  state.completedRequests[key] = true;
  const keys = Object.keys(state.completedRequests);
  for (const old of keys.slice(0, Math.max(0, keys.length - STAGE13_REQUEST_LIMIT))) delete state.completedRequests[old];
}

function append(state: Stage13State, tx: Stage13Transaction): void {
  state.ledger.push(tx);
  if (state.ledger.length > STAGE13_LEDGER_LIMIT) state.ledger.splice(0, state.ledger.length - STAGE13_LEDGER_LIMIT);
}

export function creditStage13(
  state: Stage13State,
  actorId: string,
  requestId: string,
  kind: Extract<Stage13TransactionKind, "wage" | "payout" | "refund">,
  amount: number,
  now: number,
  counterpartyId: string | null = null,
): Stage13Transaction {
  if (!validTime(now)) throw new Error("invalid timestamp");
  if (!validAmount(amount)) throw new Error("invalid amount");
  const account = ensureStage13Account(state, actorId);
  markRequest(state, requestId);
  if (account.cash > STAGE13_MAX_CASH - amount) throw new Error("cash cap exceeded");
  account.cash += amount;
  const tx: Stage13Transaction = { id: `${cleanId(actorId)}:${cleanId(requestId)}`, requestId: cleanId(requestId), actorId: cleanId(actorId), counterpartyId: counterpartyId ? cleanId(counterpartyId) : null, kind, amount, at: now, balanceAfter: account.cash };
  append(state, tx);
  return tx;
}

export function debitStage13(
  state: Stage13State,
  actorId: string,
  requestId: string,
  kind: Extract<Stage13TransactionKind, "purchase" | "fine">,
  amount: number,
  now: number,
  counterpartyId: string | null = null,
): Stage13Transaction {
  if (!validTime(now)) throw new Error("invalid timestamp");
  if (!validAmount(amount)) throw new Error("invalid amount");
  const account = ensureStage13Account(state, actorId);
  if (account.cash < amount) throw new Error("insufficient cash");
  markRequest(state, requestId);
  account.cash -= amount;
  const tx: Stage13Transaction = { id: `${cleanId(actorId)}:${cleanId(requestId)}`, requestId: cleanId(requestId), actorId: cleanId(actorId), counterpartyId: counterpartyId ? cleanId(counterpartyId) : null, kind, amount, at: now, balanceAfter: account.cash };
  append(state, tx);
  return tx;
}

export function transferStage13(
  state: Stage13State,
  fromActorId: string,
  toActorId: string,
  requestId: string,
  amount: number,
  now: number,
): { debit: Stage13Transaction; credit: Stage13Transaction } {
  if (!validTime(now)) throw new Error("invalid timestamp");
  if (!validAmount(amount)) throw new Error("invalid amount");
  const from = ensureStage13Account(state, fromActorId);
  const to = ensureStage13Account(state, toActorId);
  if (cleanId(fromActorId) === cleanId(toActorId)) throw new Error("self transfer rejected");
  if (from.cash < amount) throw new Error("insufficient cash");
  if (to.cash > STAGE13_MAX_CASH - amount) throw new Error("recipient cash cap exceeded");
  markRequest(state, requestId);
  from.cash -= amount;
  to.cash += amount;
  const request = cleanId(requestId);
  const debit: Stage13Transaction = { id: `${cleanId(fromActorId)}:${request}:debit`, requestId: request, actorId: cleanId(fromActorId), counterpartyId: cleanId(toActorId), kind: "transfer", amount, at: now, balanceAfter: from.cash };
  const credit: Stage13Transaction = { id: `${cleanId(toActorId)}:${request}:credit`, requestId: request, actorId: cleanId(toActorId), counterpartyId: cleanId(fromActorId), kind: "transfer", amount, at: now, balanceAfter: to.cash };
  append(state, debit);
  append(state, credit);
  return { debit, credit };
}

export function validateStage13Price(price: unknown): number {
  const n = Number(price);
  if (!Number.isSafeInteger(n) || n < 0 || n > STAGE13_MAX_PRICE) throw new Error("price outside safe economy bounds");
  return n;
}

export function validateStage13Balance(state: Stage13State, actorId: string): boolean {
  const account = ensureStage13Account(state, actorId);
  return Number.isSafeInteger(account.cash) && account.cash >= 0 && account.cash <= STAGE13_MAX_CASH && Number.isSafeInteger(account.bank) && account.bank >= 0 && account.bank <= STAGE13_MAX_CASH;
}
