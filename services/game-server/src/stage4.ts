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

export type MarketSale = {
  orderId: string;
  customerId: string;
  sellerId: string;
  productId: string;
  productName: string;
  quantity: number;
  total: number;
  commission: number;
  tillCredit: number;
  createdAt: number;
};

export type MarketState = {
  stock: Record<string, number>;
  till: number;
  commissions: Record<string, number>;
  completedOrderIds: Record<string, true>;
  history: MarketSale[];
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
    history: [],
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
  customerId?: string;
  idempotencyKey?: string;
  now?: number;
}): { ok: true; result: MarketSaleResult } | { ok: false; reason: string } {
  const { state, orderId, customer, sellerId, sellerRank, productId, quantity } = args;
  const customerId = String(args.customerId ?? "");
  const now = Number(args.now ?? Date.now());
  const idempotencyKey = String(args.idempotencyKey ?? orderId);
  if (!orderId || orderId.length > 100) return { ok: false, reason: "invalid_order_id" };
  if (!idempotencyKey || idempotencyKey.length > 128) return { ok: false, reason: "invalid_order_id" };
  if (state.completedOrderIds[idempotencyKey]) return { ok: false, reason: "duplicate_order" };
  if (!sellerId || !canExecuteMarketSale(sellerRank)) return { ok: false, reason: "unauthorized_seller" };
  const product = findMarketProduct(productId);
  if (!product) return { ok: false, reason: "unknown_product" };
  if (!positiveInteger(quantity) || quantity > 99) return { ok: false, reason: "invalid_quantity" };
  const available = Math.max(0, Math.floor(Number(state.stock[productId] ?? 0)));
  if (available < quantity) return { ok: false, reason: "insufficient_stock" };
  const total = product.unitPrice * quantity;
  const currentTill = Number(state.till);
  const currentCommission = Number(state.commissions[sellerId] ?? 0);
  if (
    !Number.isSafeInteger(customer.cash) || customer.cash < 0 ||
    !Number.isSafeInteger(customer.bank) || customer.bank < 0 ||
    !Number.isSafeInteger(total) || total <= 0 || customer.cash < total
  ) return { ok: false, reason: "insufficient_cash" };

  const commission = Math.floor(total * MARKET_COMMISSION_RATE);
  const tillCredit = total - commission;
  const nextTill = currentTill + tillCredit;
  const nextCommission = currentCommission + commission;
  if (
    !Number.isSafeInteger(currentTill) || currentTill < 0 ||
    !Number.isSafeInteger(currentCommission) || currentCommission < 0 ||
    !Number.isSafeInteger(nextTill) || !Number.isSafeInteger(nextCommission) ||
    !Number.isSafeInteger(customer.cash - total)
  ) return { ok: false, reason: "balance_limit" };

  state.stock[productId] = available - quantity;
  state.till = nextTill;
  state.commissions[sellerId] = nextCommission;
  state.completedOrderIds[idempotencyKey] = true;
  customer.cash -= total;
  state.history.push({
    orderId,
    customerId: customerId.slice(0, 100),
    sellerId: sellerId.slice(0, 100),
    productId,
    productName: product.name,
    quantity,
    total,
    commission,
    tillCredit,
    createdAt: Number.isFinite(now) && now > 0 ? Math.floor(now) : Date.now(),
  });
  if (state.history.length > MAX_TRANSACTION_HISTORY) {
    state.history.splice(0, state.history.length - MAX_TRANSACTION_HISTORY);
  }

  return {
    ok: true,
    result: { orderId, productId, quantity, total, commission, tillCredit },
  };
}

export function settleBankTransaction(args: {
  state: BankState;
  requestId: string;
  idempotencyKey?: string;
  customerId: string;
  tellerId: string;
  tellerRank: number;
  customer: AccountMoney;
  type: "deposit" | "withdrawal";
  amount: number;
  now: number;
}): { ok: true; result: BankTransactionResult } | { ok: false; reason: string } {
  const { state, requestId, customerId, tellerId, tellerRank, customer, type, amount, now } = args;
  const idempotencyKey = String(args.idempotencyKey ?? requestId);
  if (!requestId || requestId.length > 100) return { ok: false, reason: "invalid_request_id" };
  if (!idempotencyKey || idempotencyKey.length > 128) return { ok: false, reason: "invalid_request_id" };
  if (state.completedTransactionIds[idempotencyKey]) return { ok: false, reason: "duplicate_transaction" };
  if (!customerId || !tellerId || customerId === tellerId) return { ok: false, reason: "invalid_participants" };
  if (!canExecuteBankTransaction(tellerRank)) return { ok: false, reason: "unauthorized_teller" };
  if (type !== "deposit" && type !== "withdrawal") return { ok: false, reason: "invalid_transaction_type" };
  if (!positiveMoney(amount) || amount > 10_000_000) return { ok: false, reason: "invalid_amount" };
  if (!Number.isFinite(now) || now <= 0) return { ok: false, reason: "invalid_timestamp" };

  const fee = BANK_TRANSACTION_FEE;
  if (
    !Number.isSafeInteger(customer.cash) || customer.cash < 0 ||
    !Number.isSafeInteger(customer.bank) || customer.bank < 0 ||
    !Number.isSafeInteger(amount + fee)
  ) return { ok: false, reason: "invalid_amount" };

  if (type === "deposit") {
    const nextBank = customer.bank + amount;
    if (customer.cash < amount + fee) return { ok: false, reason: "insufficient_cash" };
    if (!Number.isSafeInteger(nextBank) || !Number.isSafeInteger(customer.cash - amount - fee)) {
      return { ok: false, reason: "balance_limit" };
    }
    customer.cash -= amount + fee;
    customer.bank = nextBank;
  } else {
    const nextCash = customer.cash + amount;
    if (customer.bank < amount + fee) return { ok: false, reason: "insufficient_bank_balance" };
    if (!Number.isSafeInteger(nextCash) || !Number.isSafeInteger(customer.bank - amount - fee)) {
      return { ok: false, reason: "balance_limit" };
    }
    customer.bank -= amount + fee;
    customer.cash = nextCash;
  }

  const transaction: BankTransaction = {
    id: `${type}-${tellerId.slice(0, 8)}-${requestId}`,
    requestId,
    type,
    customerId,
    tellerId,
    amount,
    fee,
    createdAt: now,
  };
  state.completedTransactionIds[idempotencyKey] = true;
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
  const marketHistory: MarketSale[] = [];
  if (Array.isArray(marketRaw.history)) {
    for (const entry of marketRaw.history) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
      const value = entry as Record<string, unknown>;
      const product = findMarketProduct(String(value.productId ?? ""));
      const quantity = Number(value.quantity);
      const total = Number(value.total);
      const commission = Number(value.commission);
      const tillCredit = Number(value.tillCredit);
      const createdAt = Number(value.createdAt);
      if (
        typeof value.orderId !== "string" || !value.orderId ||
        typeof value.customerId !== "string" || typeof value.sellerId !== "string" ||
        !product || !positiveInteger(quantity) || !positiveMoney(total) ||
        !Number.isInteger(commission) || commission < 0 ||
        !Number.isInteger(tillCredit) || tillCredit < 0 ||
        !Number.isFinite(createdAt) || createdAt <= 0
      ) continue;
      marketHistory.push({
        orderId: value.orderId.slice(0, 100),
        customerId: value.customerId.slice(0, 100),
        sellerId: value.sellerId.slice(0, 100),
        productId: product.id,
        productName: product.name,
        quantity: Math.min(99, quantity),
        total: Math.min(Number.MAX_SAFE_INTEGER, total),
        commission: Math.min(Number.MAX_SAFE_INTEGER, commission),
        tillCredit: Math.min(Number.MAX_SAFE_INTEGER, tillCredit),
        createdAt: Math.floor(createdAt),
      });
    }
  }
  return {
    market: {
      stock,
      till: Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(Number(marketRaw.till) || 0))),
      commissions: Object.fromEntries(Object.entries(commissions).map(([id, amount]) => [id, Math.min(Number.MAX_SAFE_INTEGER, amount)])),
      completedOrderIds,
      history: marketHistory.filter(sale => sale.total === findMarketProduct(sale.productId)!.unitPrice * sale.quantity &&
        sale.commission === Math.floor(sale.total * MARKET_COMMISSION_RATE) &&
        sale.tillCredit === sale.total - sale.commission).slice(-MAX_TRANSACTION_HISTORY),
    },
    bank: { completedTransactionIds, history: history.slice(-MAX_TRANSACTION_HISTORY) },
  };
}
