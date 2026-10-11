export const STAGE4_VERSION = 1;

export const MARKET_RANKS = [
  "Hawker",
  "Stall Assistant",
  "Sales Rep",
  "Senior Sales",
  "Market Supervisor",
  "Market Chairman",
] as const;

export const BANK_RANKS = [
  "Trainee",
  "Teller",
  "Senior Teller",
  "Loan Officer",
  "Operations Manager",
  "Branch Manager",
] as const;

export const MARKET_WORKPLACE_ID = "market-mile1";
export const BANK_WORKPLACE_ID = "bank-main";
export const MARKET_COMMISSION_RATE = 0.05;
export const BANK_TRANSACTION_FEE = 0;
export const MAX_TRANSACTION_HISTORY = 100;

export type MarketProduct = {
  id: string;
  name: string;
  unitPrice: number;
  startingStock: number;
};

export const MARKET_PRODUCTS: readonly MarketProduct[] = [
  { id: "rice-5kg", name: "Rice 5kg", unitPrice: 12000, startingStock: 40 },
  { id: "beans-5kg", name: "Beans 5kg", unitPrice: 9000, startingStock: 40 },
  { id: "garri-5kg", name: "Garri 5kg", unitPrice: 7000, startingStock: 50 },
  { id: "cooking-oil-2l", name: "Cooking Oil 2L", unitPrice: 8000, startingStock: 30 },
  { id: "bread", name: "Bread", unitPrice: 2500, startingStock: 60 },
  { id: "water-pack", name: "Bottled Water Pack", unitPrice: 1500, startingStock: 80 },
];

export type MarketState = {
  stock: Record<string, number>;
  till: number;
  commissions: Record<string, number>;
  completedOrderIds: Record<string, true>;
};

export type BankState = {
  completedTransactionIds: Record<string, true>;
  history: BankTransaction[];
};

export type BankTransaction = {
  id: string;
  requestId: string;
  type: "deposit" | "withdrawal";
  customerId: string;
  tellerId: string;
  amount: number;
  fee: number;
  createdAt: number;
};

export type AccountMoney = {
  cash: number;
  bank: number;
};

export type MarketSaleResult = {
  orderId: string;
  productId: string;
  quantity: number;
  total: number;
  commission: number;
  tillCredit: number;
};

export type BankTransactionResult = {
  transaction: BankTransaction;
  customer: AccountMoney;
  tellerCashCredit: number;
};

export function rankTitle(ranks: readonly string[], rank: number): string {
  return Number.isInteger(rank) && rank >= 1 && rank <= ranks.length ? ranks[rank - 1] : "";
}

export function isValidStaffRank(rank: number): boolean {
  return Number.isInteger(rank) && rank >= 1 && rank <= 6;
}

export function canExecuteMarketSale(rank: number): boolean {
  return isValidStaffRank(rank);
}

export function canExecuteBankTransaction(rank: number): boolean {
  // Trainees may learn/assist but cannot settle customer money movements.
  return Number.isInteger(rank) && rank >= 2 && rank <= 6;
}

export function findMarketProduct(productId: string): MarketProduct | null {
  return MARKET_PRODUCTS.find((product) => product.id === productId) ?? null;
}

export function createMarketState(): MarketState {
  return {
    stock: Object.fromEntries(MARKET_PRODUCTS.map((product) => [product.id, product.startingStock])),
    till: 0,
    commissions: {},
    completedOrderIds: {},
  };
}

export function createBankState(): BankState {
  return { completedTransactionIds: {}, history: [] };
}

function positiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

function positiveMoney(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

export function settleMarketSale(args: {
  state: MarketState;
  orderId: string;
  customer: AccountMoney;
  sellerId: string;
  sellerRank: number;
  productId: string;
  quantity: number;
}): { ok: true; result: MarketSaleResult } | { ok: false; reason: string } {
  const { state, orderId, customer, sellerId, sellerRank, productId, quantity } = args;
  if (!orderId || orderId.length > 100) return { ok: false, reason: "invalid_order_id" };
  if (state.completedOrderIds[orderId]) return { ok: false, reason: "duplicate_order" };
  if (!sellerId || !canExecuteMarketSale(sellerRank)) return { ok: false, reason: "unauthorized_seller" };
  const product = findMarketProduct(productId);
  if (!product) return { ok: false, reason: "unknown_product" };
  if (!positiveInteger(quantity) || quantity > 99) return { ok: false, reason: "invalid_quantity" };
  const available = Math.max(0, Math.floor(Number(state.stock[productId] ?? 0)));
  if (available < quantity) return { ok: false, reason: "insufficient_stock" };
  const total = product.unitPrice * quantity;
  if (!positiveMoney(total) || customer.cash < total) return { ok: false, reason: "insufficient_cash" };

  const commission = Math.floor(total * MARKET_COMMISSION_RATE);
  const tillCredit = total - commission;
  state.stock[productId] = available - quantity;
  state.till += tillCredit;
  state.commissions[sellerId] = Math.max(0, Math.floor(state.commissions[sellerId] ?? 0)) + commission;
  state.completedOrderIds[orderId] = true;
  customer.cash -= total;

  return {
    ok: true,
    result: { orderId, productId, quantity, total, commission, tillCredit },
  };
}

export function settleBankTransaction(args: {
  state: BankState;
  requestId: string;
  customerId: string;
  tellerId: string;
  tellerRank: number;
  customer: AccountMoney;
  type: "deposit" | "withdrawal";
  amount: number;
  now: number;
}): { ok: true; result: BankTransactionResult } | { ok: false; reason: string } {
  const { state, requestId, customerId, tellerId, tellerRank, customer, type, amount, now } = args;
  if (!requestId || requestId.length > 100) return { ok: false, reason: "invalid_request_id" };
  if (state.completedTransactionIds[requestId]) return { ok: false, reason: "duplicate_transaction" };
  if (!customerId || !tellerId || customerId === tellerId) return { ok: false, reason: "invalid_participants" };
  if (!canExecuteBankTransaction(tellerRank)) return { ok: false, reason: "unauthorized_teller" };
  if (type !== "deposit" && type !== "withdrawal") return { ok: false, reason: "invalid_transaction_type" };
  if (!positiveMoney(amount) || amount > 10_000_000) return { ok: false, reason: "invalid_amount" };
  if (!Number.isFinite(now) || now <= 0) return { ok: false, reason: "invalid_timestamp" };

  const fee = BANK_TRANSACTION_FEE;
  if (type === "deposit") {
    if (customer.cash < amount + fee) return { ok: false, reason: "insufficient_cash" };
    customer.cash -= amount + fee;
    customer.bank += amount;
  } else {
    if (customer.bank < amount + fee) return { ok: false, reason: "insufficient_bank_balance" };
    customer.bank -= amount + fee;
    customer.cash += amount;
  }

  const transaction: BankTransaction = {
    id: `${type}-${requestId}`,
    requestId,
    type,
    customerId,
    tellerId,
    amount,
    fee,
    createdAt: now,
  };
  state.completedTransactionIds[requestId] = true;
  state.history.push(transaction);
  if (state.history.length > MAX_TRANSACTION_HISTORY) state.history.splice(0, state.history.length - MAX_TRANSACTION_HISTORY);

  return { ok: true, result: { transaction, customer: { ...customer }, tellerCashCredit: fee } };
}

export function normalizeStage4State(input: unknown): { market: MarketState; bank: BankState } {
  const raw = input && typeof input === "object" && !Array.isArray(input) ? input as Record<string, unknown> : {};
  const marketRaw = raw.market && typeof raw.market === "object" && !Array.isArray(raw.market) ? raw.market as Record<string, unknown> : {};
  const bankRaw = raw.bank && typeof raw.bank === "object" && !Array.isArray(raw.bank) ? raw.bank as Record<string, unknown> : {};
  const stock: Record<string, number> = {};
  for (const product of MARKET_PRODUCTS) {
    const value = Number((marketRaw.stock as Record<string, unknown> | undefined)?.[product.id] ?? product.startingStock);
    stock[product.id] = Number.isFinite(value) ? Math.max(0, Math.min(999999, Math.floor(value))) : product.startingStock;
  }
  const commissions: Record<string, number> = {};
  if (marketRaw.commissions && typeof marketRaw.commissions === "object" && !Array.isArray(marketRaw.commissions)) {
    for (const [id, value] of Object.entries(marketRaw.commissions as Record<string, unknown>)) {
      const amount = Number(value);
      if (id && Number.isFinite(amount) && amount >= 0) commissions[id.slice(0, 100)] = Math.floor(amount);
    }
  }
  const completedOrderIds: Record<string, true> = {};
  if (marketRaw.completedOrderIds && typeof marketRaw.completedOrderIds === "object" && !Array.isArray(marketRaw.completedOrderIds)) {
    for (const id of Object.keys(marketRaw.completedOrderIds as Record<string, unknown>).slice(-5000)) completedOrderIds[id.slice(0, 100)] = true;
  }
  const completedTransactionIds: Record<string, true> = {};
  if (bankRaw.completedTransactionIds && typeof bankRaw.completedTransactionIds === "object" && !Array.isArray(bankRaw.completedTransactionIds)) {
    for (const id of Object.keys(bankRaw.completedTransactionIds as Record<string, unknown>).slice(-5000)) completedTransactionIds[id.slice(0, 100)] = true;
  }
  const history: BankTransaction[] = [];
  if (Array.isArray(bankRaw.history)) {
    for (const entry of bankRaw.history) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
      const value = entry as Record<string, unknown>;
      const type = value.type === "deposit" || value.type === "withdrawal" ? value.type : null;
      const amount = Number(value.amount);
      const createdAt = Number(value.createdAt);
      if (!type || typeof value.id !== "string" || typeof value.requestId !== "string" || typeof value.customerId !== "string" || typeof value.tellerId !== "string" || !positiveMoney(amount) || !Number.isFinite(createdAt) || createdAt <= 0) continue;
      history.push({ id: value.id.slice(0, 120), requestId: value.requestId.slice(0, 100), type, customerId: value.customerId.slice(0, 100), tellerId: value.tellerId.slice(0, 100), amount, fee: 0, createdAt });
    }
  }
  return {
    market: { stock, till: Math.max(0, Math.floor(Number(marketRaw.till) || 0)), commissions, completedOrderIds },
    bank: { completedTransactionIds, history: history.slice(-MAX_TRANSACTION_HISTORY) },
  };
}
