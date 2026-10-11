export const STAGE10_VERSION = 1;
export const STAGE10_ACTION_LIMIT = 200;
export const STAGE10_MAX_ORDER_QUANTITY = 20;
export const STAGE10_MAX_STOCK = 500;

export type Stage10BusinessKind = "mama-put" | "restaurant" | "bakery" | "suya" | "supermarket" | "pharmacy" | "phone-repair" | "tailor";
export type Stage10OrderStatus = "completed" | "cancelled";
export type Stage10ServiceStatus = "completed" | "cancelled";

export type Stage10Product = {
  id: string;
  name: string;
  businessId: string;
  kind: Stage10BusinessKind;
  price: number;
  inventoryItem: string;
  stock: number;
};

export type Stage10Business = {
  id: string;
  name: string;
  kind: Stage10BusinessKind;
  x: number;
  z: number;
  rankTitles: readonly string[];
  products: readonly string[];
};

export type Stage10Order = {
  id: string;
  customerId: string;
  businessId: string;
  productId: string;
  quantity: number;
  total: number;
  status: Stage10OrderStatus;
  createdAt: number;
  completedAt: number | null;
};

export type Stage10ServiceOrder = {
  id: string;
  customerId: string;
  workerId: string;
  businessId: string;
  serviceId: string;
  price: number;
  status: Stage10ServiceStatus;
  createdAt: number;
  completedAt: number | null;
};

export type Stage10LedgerEntry = {
  id: string;
  requestId: string;
  actorId: string;
  customerId: string;
  businessId: string;
  kind: "sale" | "service";
  amount: number;
  at: number;
};

export type Stage10State = {
  products: Record<string, Stage10Product>;
  businesses: Record<string, Stage10Business>;
  orders: Stage10Order[];
  services: Stage10ServiceOrder[];
  ledger: Stage10LedgerEntry[];
  completedRequests: Record<string, true>;
};

export type Stage10Actor = {
  actorId: string;
  workplaceId: string | null;
  rank: number;
  onDuty: boolean;
  uniform: boolean;
  x: number;
  z: number;
};

type SaleResult = { ok: true; order: Stage10Order; product: Stage10Product } | { ok: false; reason: string };
type ServiceResult = { ok: true; order: Stage10ServiceOrder } | { ok: false; reason: string };

const businessCatalog: readonly Omit<Stage10Business, "products">[] = [
  { id: "mama-put-main", name: "Mama Put Kitchen", kind: "mama-put", x: -8.4, z: 6, rankTitles: ["Kitchen Assistant", "Cook", "Senior Cook", "Head Cook", "Kitchen Supervisor", "Owner"] },
  { id: "restaurant-main", name: "Rivers Restaurant", kind: "restaurant", x: 55, z: 12, rankTitles: ["Waiter", "Server", "Senior Server", "Cook", "Floor Manager", "Restaurant Manager"] },
  { id: "bakery-main", name: "Rivers Bakery", kind: "bakery", x: 72, z: 18, rankTitles: ["Bakery Assistant", "Baker", "Senior Baker", "Pastry Lead", "Bakery Supervisor", "Bakery Manager"] },
  { id: "suya-main", name: "Port Harcourt Suya Spot", kind: "suya", x: 84, z: 30, rankTitles: ["Grill Assistant", "Griller", "Senior Griller", "Lead Griller", "Suya Supervisor", "Suya Manager"] },
  { id: "supermarket-main", name: "Rivers Supermart", kind: "supermarket", x: 8.4, z: 2, rankTitles: ["Store Assistant", "Cashier", "Senior Cashier", "Stock Controller", "Floor Supervisor", "Store Manager"] },
  { id: "pharmacy-main", name: "Rivers Pharmacy", kind: "pharmacy", x: -8.4, z: 32, rankTitles: ["Pharmacy Assistant", "Dispenser", "Pharmacy Technician", "Senior Technician", "Pharmacy Supervisor", "Pharmacist Manager"] },
  { id: "phone-repair-main", name: "Kings Phones & Gadgets", kind: "phone-repair", x: -8.4, z: -52, rankTitles: ["Shop Assistant", "Repair Trainee", "Repair Technician", "Senior Technician", "Workshop Supervisor", "Workshop Manager"] },
  { id: "tailor-main", name: "Sapele Fashion House", kind: "tailor", x: 8.4, z: -24, rankTitles: ["Fashion Assistant", "Sewing Trainee", "Tailor", "Senior Tailor", "Fashion Supervisor", "Fashion Manager"] },
];

const productCatalog: readonly Omit<Stage10Product, "stock">[] = [
  { id: "mama-jollof", name: "Jollof Rice", businessId: "mama-put-main", kind: "mama-put", price: 2500, inventoryItem: "Jollof Rice" },
  { id: "mama-fufu", name: "Fufu & Soup", businessId: "mama-put-main", kind: "mama-put", price: 3000, inventoryItem: "Fufu & Soup" },
  { id: "restaurant-meal", name: "Rice & Chicken Meal", businessId: "restaurant-main", kind: "restaurant", price: 4500, inventoryItem: "Restaurant Meal" },
  { id: "restaurant-drink", name: "Soft Drink", businessId: "restaurant-main", kind: "restaurant", price: 1200, inventoryItem: "Soft Drink" },
  { id: "bakery-bread", name: "Fresh Bread", businessId: "bakery-main", kind: "bakery", price: 2500, inventoryItem: "Fresh Bread" },
  { id: "bakery-pastry", name: "Meat Pie", businessId: "bakery-main", kind: "bakery", price: 1800, inventoryItem: "Meat Pie" },
  { id: "suya-beef", name: "Beef Suya", businessId: "suya-main", kind: "suya", price: 3500, inventoryItem: "Beef Suya" },
  { id: "suya-chicken", name: "Chicken Suya", businessId: "suya-main", kind: "suya", price: 4000, inventoryItem: "Chicken Suya" },
  { id: "super-rice", name: "Rice 5kg", businessId: "supermarket-main", kind: "supermarket", price: 12000, inventoryItem: "Rice (5kg)" },
  { id: "super-water", name: "Bottled Water Pack", businessId: "supermarket-main", kind: "supermarket", price: 1500, inventoryItem: "Bottle Water" },
  { id: "pharmacy-paracetamol", name: "Paracetamol", businessId: "pharmacy-main", kind: "pharmacy", price: 1200, inventoryItem: "Paracetamol" },
  { id: "pharmacy-bandage", name: "Bandage Pack", businessId: "pharmacy-main", kind: "pharmacy", price: 1800, inventoryItem: "Bandage Pack" },
];

export const STAGE10_BUSINESSES: readonly Stage10Business[] = businessCatalog.map((business) => ({
  ...business,
  products: productCatalog.filter((product) => product.businessId === business.id).map((product) => product.id),
}));
export const STAGE10_PRODUCTS = productCatalog;

export type Stage10Service = { id: string; businessId: string; name: string; price: number; inventoryItem: string; requiredRank: number };
export const STAGE10_SERVICES: readonly Stage10Service[] = [
  { id: "phone-screen-repair", businessId: "phone-repair-main", name: "Phone screen repair", price: 18000, inventoryItem: "Screen Repair Part", requiredRank: 2 },
  { id: "phone-battery-repair", businessId: "phone-repair-main", name: "Phone battery repair", price: 12000, inventoryItem: "Battery Repair Part", requiredRank: 2 },
  { id: "tailor-outfit", businessId: "tailor-main", name: "Custom outfit tailoring", price: 15000, inventoryItem: "Tailored Outfit", requiredRank: 2 },
];

const money = (value: unknown) => Number.isSafeInteger(value) && Number(value) >= 0 ? Number(value) : 0;
const cleanId = (value: unknown, max = 120) => String(value ?? "").trim().slice(0, max);
const dist = (a: Stage10Actor, business: Stage10Business) => Math.hypot(a.x - business.x, a.z - business.z);
const atBusiness = (actor: Stage10Actor, business: Stage10Business) => dist(actor, business) <= 24;

export function createStage10State(): Stage10State {
  const businesses = Object.fromEntries(STAGE10_BUSINESSES.map((business) => [business.id, business]));
  const products = Object.fromEntries(STAGE10_PRODUCTS.map((product) => [product.id, { ...product, stock: 40 }]));
  return { products, businesses, orders: [], services: [], ledger: [], completedRequests: {} };
}

export function normalizeStage10State(raw: unknown): Stage10State {
  const base = createStage10State();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
  const value = raw as Record<string, unknown>;
  if (value.products && typeof value.products === "object" && !Array.isArray(value.products)) {
    for (const product of STAGE10_PRODUCTS) {
      const saved = (value.products as Record<string, unknown>)[product.id];
      const stock = saved && typeof saved === "object" ? Number((saved as Record<string, unknown>).stock) : 40;
      base.products[product.id].stock = Math.max(0, Math.min(STAGE10_MAX_STOCK, Math.floor(Number.isFinite(stock) ? stock : 40)));
    }
  }
  if (value.completedRequests && typeof value.completedRequests === "object") {
    for (const [key, flag] of Object.entries(value.completedRequests as Record<string, unknown>).slice(-STAGE10_ACTION_LIMIT)) if (flag === true) base.completedRequests[cleanId(key)] = true;
  }
  if (Array.isArray(value.orders)) base.orders = value.orders.slice(-STAGE10_ACTION_LIMIT).filter((order): order is Stage10Order => !!order && typeof order === "object").map((order) => ({ ...order, id: cleanId(order.id), customerId: cleanId(order.customerId), businessId: cleanId(order.businessId), productId: cleanId(order.productId), quantity: Math.max(1, Math.floor(Number(order.quantity) || 1)), total: money(order.total), status: order.status === "cancelled" ? "cancelled" : "completed", createdAt: Number(order.createdAt) || 0, completedAt: order.completedAt == null ? null : Number(order.completedAt) || 0 }));
  if (Array.isArray(value.services)) base.services = value.services.slice(-STAGE10_ACTION_LIMIT).filter((order): order is Stage10ServiceOrder => !!order && typeof order === "object").map((order) => ({ ...order, id: cleanId(order.id), customerId: cleanId(order.customerId), workerId: cleanId(order.workerId), businessId: cleanId(order.businessId), serviceId: cleanId(order.serviceId), price: money(order.price), status: order.status === "cancelled" ? "cancelled" : "completed", createdAt: Number(order.createdAt) || 0, completedAt: order.completedAt == null ? null : Number(order.completedAt) || 0 }));
  if (Array.isArray(value.ledger)) base.ledger = value.ledger.slice(-STAGE10_ACTION_LIMIT).filter((entry): entry is Stage10LedgerEntry => !!entry && typeof entry === "object").map((entry) => ({ ...entry, id: cleanId(entry.id), requestId: cleanId(entry.requestId), actorId: cleanId(entry.actorId), customerId: cleanId(entry.customerId), businessId: cleanId(entry.businessId), kind: entry.kind === "service" ? "service" : "sale", amount: money(entry.amount), at: Number(entry.at) || 0 }));
  return base;
}

function validActor(actor: Stage10Actor, business: Stage10Business, minimumRank: number): boolean {
  return !!cleanId(actor.actorId) && cleanId(actor.workplaceId) === business.id && Number.isInteger(actor.rank) && actor.rank >= minimumRank && actor.rank <= 6 && actor.onDuty === true && actor.uniform === true && atBusiness(actor, business);
}

export function settleStage10Sale(args: {
  state: Stage10State;
  requestId: string;
  customerId: string;
  businessId: string;
  productId: string;
  quantity: number;
  customerCash: number;
  actor: Stage10Actor;
  now?: number;
}): SaleResult {
  const requestId = cleanId(args.requestId);
  const business = args.state.businesses[cleanId(args.businessId)];
  const product = args.state.products[cleanId(args.productId)];
  const quantity = Number(args.quantity);
  if (!requestId || args.state.completedRequests[requestId]) return { ok: false, reason: "duplicate_or_invalid_request" };
  if (!business || !product || product.businessId !== business.id) return { ok: false, reason: "unknown_business_product" };
  if (!validActor(args.actor, business, 1)) return { ok: false, reason: "unauthorized_worker" };
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > STAGE10_MAX_ORDER_QUANTITY) return { ok: false, reason: "invalid_quantity" };
  if (product.stock < quantity) return { ok: false, reason: "insufficient_stock" };
  const total = product.price * quantity;
  if (!Number.isSafeInteger(total) || money(args.customerCash) < total) return { ok: false, reason: "insufficient_cash" };
  const now = Number(args.now ?? Date.now());
  if (!Number.isSafeInteger(now) || now <= 0) return { ok: false, reason: "invalid_timestamp" };
  product.stock -= quantity;
  args.state.completedRequests[requestId] = true;
  const order: Stage10Order = { id: "stage10-order:" + requestId, customerId: cleanId(args.customerId), businessId: business.id, productId: product.id, quantity, total, status: "completed", createdAt: now, completedAt: now };
  args.state.orders.push(order);
  args.state.ledger.push({ id: "stage10-ledger:" + requestId, requestId, actorId: cleanId(args.actor.actorId), customerId: cleanId(args.customerId), businessId: business.id, kind: "sale", amount: total, at: now });
  args.state.orders = args.state.orders.slice(-STAGE10_ACTION_LIMIT);
  args.state.ledger = args.state.ledger.slice(-STAGE10_ACTION_LIMIT);
  return { ok: true, order, product: { ...product } };
}

export function completeStage10Service(args: {
  state: Stage10State;
  requestId: string;
  customerId: string;
  businessId: string;
  serviceId: string;
  customerCash: number;
  actor: Stage10Actor;
  now?: number;
}): ServiceResult {
  const requestId = cleanId(args.requestId);
  const service = STAGE10_SERVICES.find((item) => item.id === cleanId(args.serviceId) && item.businessId === cleanId(args.businessId));
  const business = args.state.businesses[cleanId(args.businessId)];
  if (!requestId || args.state.completedRequests[requestId]) return { ok: false, reason: "duplicate_or_invalid_request" };
  if (!service || !business) return { ok: false, reason: "unknown_service" };
  if (!validActor(args.actor, business, service.requiredRank)) return { ok: false, reason: "unauthorized_worker" };
  if (money(args.customerCash) < service.price) return { ok: false, reason: "insufficient_cash" };
  const now = Number(args.now ?? Date.now());
  if (!Number.isSafeInteger(now) || now <= 0) return { ok: false, reason: "invalid_timestamp" };
  args.state.completedRequests[requestId] = true;
  const order: Stage10ServiceOrder = { id: "stage10-service:" + requestId, customerId: cleanId(args.customerId), workerId: cleanId(args.actor.actorId), businessId: business.id, serviceId: service.id, price: service.price, status: "completed", createdAt: now, completedAt: now };
  args.state.services.push(order);
  args.state.ledger.push({ id: "stage10-ledger:" + requestId, requestId, actorId: cleanId(args.actor.actorId), customerId: cleanId(args.customerId), businessId: business.id, kind: "service", amount: service.price, at: now });
  args.state.services = args.state.services.slice(-STAGE10_ACTION_LIMIT);
  args.state.ledger = args.state.ledger.slice(-STAGE10_ACTION_LIMIT);
  return { ok: true, order };
}
