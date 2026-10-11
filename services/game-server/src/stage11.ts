export const STAGE11_VERSION = 1;
export const STAGE11_ACTION_LIMIT = 200;
export const STAGE11_MAX_FUEL_LITRES = 200;
export const STAGE11_FUEL_PRICE_PER_LITRE = 950;

export type Stage11BusinessKind =
  | "mechanic"
  | "car-wash"
  | "filling-station"
  | "barber-salon"
  | "courier"
  | "electrician"
  | "plumber";

export type Stage11Business = {
  id: string;
  name: string;
  kind: Stage11BusinessKind;
  x: number;
  z: number;
  rankTitles: readonly string[];
};

export type Stage11Actor = {
  actorId: string;
  workplaceId: string;
  rank: number;
  onDuty: boolean;
  uniform: boolean;
  x: number;
  z: number;
};

export type Stage11Vehicle = {
  id: string;
  ownerId: string;
  x: number;
  z: number;
  fuelLitres: number;
  fuelCapacityLitres: number;
  condition: number;
  cleanliness: number;
};

export type Stage11UtilityKind = "electricity" | "water" | "waste";
export type Stage11RepairKind = "electrical" | "plumbing";

export type Stage11PropertyIssue = {
  id: string;
  kind: Stage11RepairKind;
  description: string;
  status: "open" | "resolved";
  createdAt: number;
  resolvedAt: number | null;
};

export type Stage11UtilityBill = {
  amountDue: number;
  paidAt: number | null;
};

export type Stage11Property = {
  id: string;
  ownerId: string;
  residentIds: string[];
  x: number;
  z: number;
  bills: Record<Stage11UtilityKind, Stage11UtilityBill>;
  issues: Stage11PropertyIssue[];
};

export type Stage11Service = {
  id: string;
  businessId: string;
  name: string;
  price: number;
  kind: "vehicle-repair" | "car-wash" | "barber-cut" | "salon-style";
  requiresVehicle: boolean;
  requiredRank: number;
};

export type Stage11ServiceOrder = {
  id: string;
  requestId: string;
  customerId: string;
  businessId: string;
  serviceId: string;
  targetVehicleId: string | null;
  assignedWorkerId: string | null;
  status: "open" | "assigned" | "completed";
  total: number;
  createdAt: number;
  completedAt: number | null;
};

export type Stage11RepairCall = {
  id: string;
  requestId: string;
  issueId: string;
  customerId: string;
  propertyId: string;
  businessId: string;
  kind: Stage11RepairKind;
  description: string;
  assignedWorkerId: string | null;
  status: "open" | "assigned" | "completed";
  price: number;
  createdAt: number;
  completedAt: number | null;
};

export type Stage11CourierDelivery = {
  id: string;
  requestId: string;
  customerId: string;
  recipientName: string;
  parcelDescription: string;
  dropoffX: number;
  dropoffZ: number;
  assignedWorkerId: string | null;
  status: "open" | "assigned" | "in-transit" | "delivered";
  price: number;
  createdAt: number;
  pickedUpAt: number | null;
  completedAt: number | null;
};

export type Stage11LedgerEntry = {
  id: string;
  requestId: string;
  actorId: string;
  customerId: string;
  businessId: string;
  kind: "fuel" | "service" | "repair" | "utility" | "courier";
  amount: number;
  at: number;
};

export type Stage11UtilityPayment = {
  id: string;
  requestId: string;
  customerId: string;
  propertyId: string;
  utility: Stage11UtilityKind;
  amount: number;
  paidAt: number;
};

export type Stage11State = {
  businesses: Record<string, Stage11Business>;
  fuelStockLitres: Record<string, number>;
  vehicles: Record<string, Stage11Vehicle>;
  properties: Record<string, Stage11Property>;
  serviceOrders: Stage11ServiceOrder[];
  repairCalls: Stage11RepairCall[];
  deliveries: Stage11CourierDelivery[];
  utilityPayments: Stage11UtilityPayment[];
  ledger: Stage11LedgerEntry[];
  completedRequests: Record<string, true>;
};

const businessCatalog: readonly Stage11Business[] = [
  { id: "mechanic-main", name: "Rivers Auto Workshop", kind: "mechanic", x: -35, z: -50, rankTitles: ["Workshop Helper", "Mechanic Trainee", "Mechanic", "Senior Mechanic", "Workshop Supervisor", "Workshop Owner"] },
  { id: "car-wash-main", name: "Fresh Shine Car Wash", kind: "car-wash", x: -58, z: -36, rankTitles: ["Wash Assistant", "Washer", "Senior Washer", "Detailer", "Wash Supervisor", "Wash Manager"] },
  { id: "filling-station-main", name: "Rivers Fuel Station", kind: "filling-station", x: 100, z: 8, rankTitles: ["Pump Assistant", "Fuel Attendant", "Senior Attendant", "Stock Controller", "Station Supervisor", "Station Manager"] },
  { id: "barber-salon-main", name: "D-Line Barber & Beauty", kind: "barber-salon", x: -25, z: 35, rankTitles: ["Salon Assistant", "Barber", "Stylist", "Senior Stylist", "Salon Supervisor", "Salon Owner"] },
  { id: "courier-hub-main", name: "Port Harcourt Courier Hub", kind: "courier", x: 100, z: -45, rankTitles: ["Sorting Assistant", "Courier", "Senior Courier", "Route Coordinator", "Dispatch Supervisor", "Courier Manager"] },
  { id: "electrician-services-main", name: "Rivers Electrical Services", kind: "electrician", x: -55, z: 30, rankTitles: ["Electrical Helper", "Electrician Trainee", "Electrician", "Senior Electrician", "Electrical Supervisor", "Electrical Contractor"] },
  { id: "plumber-services-main", name: "Rivers Plumbing Services", kind: "plumber", x: 38, z: -52, rankTitles: ["Plumbing Helper", "Plumber Trainee", "Plumber", "Senior Plumber", "Plumbing Supervisor", "Plumbing Contractor"] },
];

export const STAGE11_BUSINESSES = businessCatalog;

export const STAGE11_SERVICES: readonly Stage11Service[] = [
  { id: "engine-repair", businessId: "mechanic-main", name: "Vehicle repair", price: 15000, kind: "vehicle-repair", requiresVehicle: true, requiredRank: 2 },
  { id: "standard-car-wash", businessId: "car-wash-main", name: "Exterior and interior wash", price: 2500, kind: "car-wash", requiresVehicle: true, requiredRank: 1 },
  { id: "barber-haircut", businessId: "barber-salon-main", name: "Haircut", price: 2000, kind: "barber-cut", requiresVehicle: false, requiredRank: 1 },
  { id: "salon-style", businessId: "barber-salon-main", name: "Hair styling", price: 6000, kind: "salon-style", requiresVehicle: false, requiredRank: 2 },
];

const REPAIR_PRICES: Record<Stage11RepairKind, number> = {
  electrical: 25000,
  plumbing: 18000,
};
const REPAIR_BUSINESSES: Record<Stage11RepairKind, string> = {
  electrical: "electrician-services-main",
  plumbing: "plumber-services-main",
};
const UTILITIES: readonly Stage11UtilityKind[] = ["electricity", "water", "waste"];

const cleanId = (value: unknown, max = 120): string => String(value ?? "").trim().slice(0, max);
const safeMoney = (value: unknown): number =>
  Number.isSafeInteger(value) && Number(value) >= 0 ? Number(value) : 0;
const validTime = (value: unknown): value is number =>
  Number.isSafeInteger(value) && Number(value) > 0;
const distance = (x1: number, z1: number, x2: number, z2: number): number =>
  Math.hypot(x1 - x2, z1 - z2);
const closeTo = (x: number, z: number, targetX: number, targetZ: number, radius = 24): boolean =>
  Number.isFinite(x) && Number.isFinite(z) && distance(x, z, targetX, targetZ) <= radius;
const appendBounded = <T>(items: T[], item: T): void => {
  items.push(item);
  if (items.length > STAGE11_ACTION_LIMIT) items.splice(0, items.length - STAGE11_ACTION_LIMIT);
};
const markRequest = (state: Stage11State, requestId: string): boolean => {
  if (!requestId || state.completedRequests[requestId]) return false;
  state.completedRequests[requestId] = true;
  const keys = Object.keys(state.completedRequests);
  for (const oldKey of keys.slice(0, Math.max(0, keys.length - STAGE11_ACTION_LIMIT))) {
    delete state.completedRequests[oldKey];
  }
  return true;
};

export function createStage11State(): Stage11State {
  return {
    businesses: Object.fromEntries(STAGE11_BUSINESSES.map((business) => [business.id, { ...business }])) as Record<string, Stage11Business>,
    fuelStockLitres: { "filling-station-main": 10000 },
    vehicles: {},
    properties: {},
    serviceOrders: [],
    repairCalls: [],
    deliveries: [],
    utilityPayments: [],
    ledger: [],
    completedRequests: {},
  };
}

export function normalizeStage11State(raw: unknown): Stage11State {
  const base = createStage11State();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
  const value = raw as Record<string, unknown>;
  if (value.fuelStockLitres && typeof value.fuelStockLitres === "object" && !Array.isArray(value.fuelStockLitres)) {
    const saved = value.fuelStockLitres as Record<string, unknown>;
    const stock = Number(saved["filling-station-main"]);
    base.fuelStockLitres["filling-station-main"] = Math.max(0, Math.min(100000, Math.floor(Number.isFinite(stock) ? stock : 10000)));
  }
  if (value.completedRequests && typeof value.completedRequests === "object" && !Array.isArray(value.completedRequests)) {
    const saved = Object.entries(value.completedRequests as Record<string, unknown>).slice(-STAGE11_ACTION_LIMIT);
    for (const [key, flag] of saved) if (flag === true && cleanId(key)) base.completedRequests[cleanId(key)] = true;
  }
  if (value.vehicles && typeof value.vehicles === "object" && !Array.isArray(value.vehicles)) {
    for (const [key, rawVehicle] of Object.entries(value.vehicles as Record<string, unknown>)) {
      if (!rawVehicle || typeof rawVehicle !== "object" || Array.isArray(rawVehicle)) continue;
      const v = rawVehicle as Record<string, unknown>;
      const id = cleanId(v.id ?? key);
      const ownerId = cleanId(v.ownerId);
      const capacity = Number(v.fuelCapacityLitres);
      const fuel = Number(v.fuelLitres);
      const x = Number(v.x);
      const z = Number(v.z);
      if (!id || !ownerId || !Number.isFinite(x) || !Number.isFinite(z) || !Number.isFinite(capacity) || capacity <= 0) continue;
      base.vehicles[id] = {
        id, ownerId, x, z,
        fuelCapacityLitres: Math.max(1, Math.min(1000, capacity)),
        fuelLitres: Math.max(0, Math.min(Math.max(1, capacity), Number.isFinite(fuel) ? fuel : 0)),
        condition: Math.max(0, Math.min(100, Number(v.condition) || 0)),
        cleanliness: Math.max(0, Math.min(100, Number(v.cleanliness) || 0)),
      };
    }
  }
  if (value.properties && typeof value.properties === "object" && !Array.isArray(value.properties)) {
    for (const [key, rawProperty] of Object.entries(value.properties as Record<string, unknown>)) {
      if (!rawProperty || typeof rawProperty !== "object" || Array.isArray(rawProperty)) continue;
      const p = rawProperty as Record<string, unknown>;
      const id = cleanId(p.id ?? key);
      const ownerId = cleanId(p.ownerId);
      const x = Number(p.x);
      const z = Number(p.z);
      if (!id || !ownerId || !Number.isFinite(x) || !Number.isFinite(z)) continue;
      const residentIds = Array.isArray(p.residentIds) ? p.residentIds.map(cleanId).filter(Boolean).slice(0, 50) : [];
      const rawBills = p.bills && typeof p.bills === "object" ? p.bills as Record<string, unknown> : {};
      const bills = {} as Record<Stage11UtilityKind, Stage11UtilityBill>;
      for (const utility of UTILITIES) {
        const rawBill = rawBills[utility] && typeof rawBills[utility] === "object" ? rawBills[utility] as Record<string, unknown> : {};
        bills[utility] = { amountDue: safeMoney(rawBill.amountDue), paidAt: validTime(rawBill.paidAt) ? rawBill.paidAt : null };
      }
      const issues = Array.isArray(p.issues) ? p.issues.slice(-STAGE11_ACTION_LIMIT).filter((item): item is Stage11PropertyIssue => !!item && typeof item === "object").map((item) => ({
        ...item,
        id: cleanId(item.id),
        kind: item.kind === "plumbing" ? "plumbing" as const : "electrical" as const,
        description: String(item.description ?? "").slice(0, 280),
        status: item.status === "resolved" ? "resolved" as const : "open" as const,
        createdAt: validTime(item.createdAt) ? item.createdAt : 0,
        resolvedAt: validTime(item.resolvedAt) ? item.resolvedAt : null,
      })) : [];
      base.properties[id] = { id, ownerId, residentIds, x, z, bills, issues };
    }
  }
  const arrays: Array<keyof Pick<Stage11State, "serviceOrders" | "repairCalls" | "deliveries" | "utilityPayments" | "ledger">> =
    ["serviceOrders", "repairCalls", "deliveries", "utilityPayments", "ledger"];
  for (const key of arrays) {
    const source = value[key];
    if (Array.isArray(source)) (base[key] as unknown[]) = source.slice(-STAGE11_ACTION_LIMIT).filter((item) => !!item && typeof item === "object");
  }
  return base;
}

export function registerStage11Vehicle(state: Stage11State, vehicle: Stage11Vehicle): boolean {
  const id = cleanId(vehicle?.id);
  const ownerId = cleanId(vehicle?.ownerId);
  if (!id || !ownerId || !Number.isFinite(vehicle.x) || !Number.isFinite(vehicle.z) ||
      !Number.isFinite(vehicle.fuelCapacityLitres) || vehicle.fuelCapacityLitres <= 0) return false;
  const capacity = Math.min(1000, vehicle.fuelCapacityLitres);
  state.vehicles[id] = {
    id, ownerId, x: vehicle.x, z: vehicle.z,
    fuelCapacityLitres: capacity,
    fuelLitres: Math.max(0, Math.min(capacity, Number(vehicle.fuelLitres) || 0)),
    condition: Math.max(0, Math.min(100, Number(vehicle.condition) || 0)),
    cleanliness: Math.max(0, Math.min(100, Number(vehicle.cleanliness) || 0)),
  };
  return true;
}

export function registerStage11Property(state: Stage11State, property: Stage11Property): boolean {
  const id = cleanId(property?.id);
  const ownerId = cleanId(property?.ownerId);
  if (!id || !ownerId || !Number.isFinite(property.x) || !Number.isFinite(property.z)) return false;
  const bills = {} as Record<Stage11UtilityKind, Stage11UtilityBill>;
  for (const utility of UTILITIES) {
    const bill = property.bills?.[utility];
    bills[utility] = {
      amountDue: safeMoney(bill?.amountDue),
      paidAt: validTime(bill?.paidAt) ? bill.paidAt : null,
    };
  }
  state.properties[id] = {
    id,
    ownerId,
    residentIds: Array.isArray(property.residentIds) ? [...new Set(property.residentIds.map(cleanId).filter(Boolean))].slice(0, 50) : [],
    x: property.x,
    z: property.z,
    bills,
    issues: Array.isArray(property.issues) ? property.issues.slice(-STAGE11_ACTION_LIMIT) : [],
  };
  return true;
}

function validActor(actor: Stage11Actor, business: Stage11Business, minimumRank = 1, nearBusiness = true): boolean {
  return !!cleanId(actor?.actorId) &&
    cleanId(actor.workplaceId) === business.id &&
    Number.isInteger(actor.rank) && actor.rank >= minimumRank && actor.rank <= 6 &&
    actor.onDuty === true && actor.uniform === true &&
    Number.isFinite(actor.x) && Number.isFinite(actor.z) &&
    (!nearBusiness || closeTo(actor.x, actor.z, business.x, business.z));
}

function propertyMember(property: Stage11Property, customerId: string): boolean {
  const customer = cleanId(customerId);
  return !!customer && (property.ownerId === customer || property.residentIds.includes(customer));
}

function ledger(state: Stage11State, entry: Stage11LedgerEntry): void {
  appendBounded(state.ledger, entry);
}

export type Stage11Result<T> = { ok: true; result: T } | { ok: false; reason: string };

export function buyStage11Fuel(args: {
  state: Stage11State;
  requestId: string;
  customerId: string;
  vehicleId: string;
  litres: number;
  customerCash: number;
  actor: Stage11Actor;
  now?: number;
}): Stage11Result<{ vehicle: Stage11Vehicle; litres: number; total: number; fuelRemaining: number }> {
  const requestId = cleanId(args.requestId);
  const station = args.state.businesses["filling-station-main"];
  const vehicle = args.state.vehicles[cleanId(args.vehicleId)];
  const litres = Math.round(Number(args.litres) * 10) / 10;
  if (!requestId || args.state.completedRequests[requestId]) return { ok: false, reason: "duplicate_or_invalid_request" };
  if (!station || !vehicle || vehicle.ownerId !== cleanId(args.customerId)) return { ok: false, reason: "vehicle_not_owned" };
  if (!validActor(args.actor, station)) return { ok: false, reason: "unauthorized_attendant" };
  if (!Number.isFinite(litres) || litres <= 0 || litres > STAGE11_MAX_FUEL_LITRES) return { ok: false, reason: "invalid_fuel_quantity" };
  if (!closeTo(vehicle.x, vehicle.z, station.x, station.z)) return { ok: false, reason: "vehicle_not_at_station" };
  if (args.state.fuelStockLitres[station.id] < litres) return { ok: false, reason: "insufficient_station_stock" };
  if (vehicle.fuelLitres + litres > vehicle.fuelCapacityLitres) return { ok: false, reason: "tank_capacity_exceeded" };
  const total = Math.ceil(litres * STAGE11_FUEL_PRICE_PER_LITRE);
  if (safeMoney(args.customerCash) < total) return { ok: false, reason: "insufficient_cash" };
  const now = Number(args.now ?? Date.now());
  if (!validTime(now)) return { ok: false, reason: "invalid_timestamp" };
  if (!markRequest(args.state, requestId)) return { ok: false, reason: "duplicate_or_invalid_request" };
  vehicle.fuelLitres = Math.round((vehicle.fuelLitres + litres) * 10) / 10;
  args.state.fuelStockLitres[station.id] -= litres;
  ledger(args.state, { id: "stage11-fuel:" + requestId, requestId, actorId: cleanId(args.actor.actorId), customerId: cleanId(args.customerId), businessId: station.id, kind: "fuel", amount: total, at: now });
  return { ok: true, result: { vehicle: { ...vehicle }, litres, total, fuelRemaining: vehicle.fuelLitres } };
}

export function openStage11ServiceOrder(args: {
  state: Stage11State;
  requestId: string;
  customerId: string;
  serviceId: string;
  targetVehicleId?: string | null;
  now?: number;
}): Stage11Result<Stage11ServiceOrder> {
  const requestId = cleanId(args.requestId);
  const customerId = cleanId(args.customerId);
  const service = STAGE11_SERVICES.find((item) => item.id === cleanId(args.serviceId));
  if (!requestId || !customerId || args.state.completedRequests[requestId]) return { ok: false, reason: "duplicate_or_invalid_request" };
  if (!service) return { ok: false, reason: "unknown_service" };
  let vehicleId: string | null = null;
  if (service.requiresVehicle) {
    const vehicle = args.state.vehicles[cleanId(args.targetVehicleId)];
    const business = args.state.businesses[service.businessId];
    if (!vehicle || vehicle.ownerId !== customerId) return { ok: false, reason: "vehicle_not_owned" };
    if (!business || !closeTo(vehicle.x, vehicle.z, business.x, business.z)) return { ok: false, reason: "vehicle_not_at_business" };
    vehicleId = vehicle.id;
  } else if (args.targetVehicleId) {
    return { ok: false, reason: "unexpected_vehicle_target" };
  }
  const now = Number(args.now ?? Date.now());
  if (!validTime(now)) return { ok: false, reason: "invalid_timestamp" };
  if (!markRequest(args.state, requestId)) return { ok: false, reason: "duplicate_or_invalid_request" };
  const order: Stage11ServiceOrder = {
    id: "stage11-service:" + requestId,
    requestId,
    customerId,
    businessId: service.businessId,
    serviceId: service.id,
    targetVehicleId: vehicleId,
    assignedWorkerId: null,
    status: "open",
    total: service.price,
    createdAt: now,
    completedAt: null,
  };
  appendBounded(args.state.serviceOrders, order);
  return { ok: true, result: { ...order } };
}

export function assignStage11ServiceOrder(args: {
  state: Stage11State;
  orderId: string;
  supervisor: Stage11Actor;
  assignee: Pick<Stage11Actor, "actorId" | "workplaceId" | "rank">;
}): Stage11Result<Stage11ServiceOrder> {
  const order = args.state.serviceOrders.find((item) => item.id === cleanId(args.orderId));
  if (!order || order.status === "completed") return { ok: false, reason: "order_not_assignable" };
  const business = args.state.businesses[order.businessId];
  if (!business || !validActor(args.supervisor, business, 5)) return { ok: false, reason: "unauthorized_dispatcher" };
  if (cleanId(args.assignee.workplaceId) !== business.id || !cleanId(args.assignee.actorId) ||
      !Number.isInteger(args.assignee.rank) || args.assignee.rank < 1 || args.assignee.rank > 6) return { ok: false, reason: "invalid_assignee" };
  order.assignedWorkerId = cleanId(args.assignee.actorId);
  order.status = "assigned";
  return { ok: true, result: { ...order } };
}

export function completeStage11ServiceOrder(args: {
  state: Stage11State;
  orderId: string;
  customerCash: number;
  actor: Stage11Actor;
  now?: number;
}): Stage11Result<Stage11ServiceOrder> {
  const order = args.state.serviceOrders.find((item) => item.id === cleanId(args.orderId));
  if (!order || order.status !== "assigned" || order.assignedWorkerId !== cleanId(args.actor.actorId)) return { ok: false, reason: "order_not_assigned_to_worker" };
  const service = STAGE11_SERVICES.find((item) => item.id === order.serviceId);
  const business = args.state.businesses[order.businessId];
  if (!service || !business || !validActor(args.actor, business, service.requiredRank)) return { ok: false, reason: "unauthorized_worker" };
  if (safeMoney(args.customerCash) < order.total) return { ok: false, reason: "insufficient_cash" };
  if (order.targetVehicleId) {
    const vehicle = args.state.vehicles[order.targetVehicleId];
    if (!vehicle || vehicle.ownerId !== order.customerId || !closeTo(vehicle.x, vehicle.z, business.x, business.z)) return { ok: false, reason: "target_vehicle_missing" };
    if (service.kind === "vehicle-repair") vehicle.condition = 100;
    if (service.kind === "car-wash") vehicle.cleanliness = 100;
  }
  const now = Number(args.now ?? Date.now());
  if (!validTime(now)) return { ok: false, reason: "invalid_timestamp" };
  order.status = "completed";
  order.completedAt = now;
  ledger(args.state, { id: "stage11-service-ledger:" + order.id, requestId: "complete:" + order.requestId, actorId: cleanId(args.actor.actorId), customerId: order.customerId, businessId: business.id, kind: "service", amount: order.total, at: now });
  return { ok: true, result: { ...order } };
}

export function openStage11RepairCall(args: {
  state: Stage11State;
  requestId: string;
  customerId: string;
  propertyId: string;
  kind: Stage11RepairKind;
  description: string;
  now?: number;
}): Stage11Result<Stage11RepairCall> {
  const requestId = cleanId(args.requestId);
  const customerId = cleanId(args.customerId);
  const property = args.state.properties[cleanId(args.propertyId)];
  if (!requestId || !customerId || args.state.completedRequests[requestId]) return { ok: false, reason: "duplicate_or_invalid_request" };
  if (!property || !propertyMember(property, customerId)) return { ok: false, reason: "property_access_denied" };
  if (args.kind !== "electrical" && args.kind !== "plumbing") return { ok: false, reason: "unknown_repair_kind" };
  const description = String(args.description ?? "").trim().slice(0, 280);
  if (description.length < 3) return { ok: false, reason: "repair_description_required" };
  const now = Number(args.now ?? Date.now());
  if (!validTime(now)) return { ok: false, reason: "invalid_timestamp" };
  if (!markRequest(args.state, requestId)) return { ok: false, reason: "duplicate_or_invalid_request" };
  const businessId = REPAIR_BUSINESSES[args.kind];
  const issue: Stage11PropertyIssue = { id: "stage11-issue:" + requestId, kind: args.kind, description, status: "open", createdAt: now, resolvedAt: null };
  property.issues.push(issue);
  if (property.issues.length > STAGE11_ACTION_LIMIT) property.issues.splice(0, property.issues.length - STAGE11_ACTION_LIMIT);
  const call: Stage11RepairCall = {
    id: "stage11-repair:" + requestId,
    requestId,
    issueId: issue.id,
    customerId,
    propertyId: property.id,
    businessId,
    kind: args.kind,
    description,
    assignedWorkerId: null,
    status: "open",
    price: REPAIR_PRICES[args.kind],
    createdAt: now,
    completedAt: null,
  };
  appendBounded(args.state.repairCalls, call);
  return { ok: true, result: { ...call } };
}

export function assignStage11RepairCall(args: {
  state: Stage11State;
  callId: string;
  supervisor: Stage11Actor;
  assignee: Pick<Stage11Actor, "actorId" | "workplaceId" | "rank">;
}): Stage11Result<Stage11RepairCall> {
  const call = args.state.repairCalls.find((item) => item.id === cleanId(args.callId));
  if (!call || call.status === "completed") return { ok: false, reason: "repair_not_assignable" };
  const business = args.state.businesses[call.businessId];
  if (!business || !validActor(args.supervisor, business, 5)) return { ok: false, reason: "unauthorized_dispatcher" };
  if (cleanId(args.assignee.workplaceId) !== business.id || !cleanId(args.assignee.actorId) ||
      !Number.isInteger(args.assignee.rank) || args.assignee.rank < 2 || args.assignee.rank > 6) return { ok: false, reason: "invalid_assignee" };
  call.assignedWorkerId = cleanId(args.assignee.actorId);
  call.status = "assigned";
  return { ok: true, result: { ...call } };
}

export function completeStage11RepairCall(args: {
  state: Stage11State;
  callId: string;
  customerCash: number;
  actor: Stage11Actor;
  now?: number;
}): Stage11Result<Stage11RepairCall> {
  const call = args.state.repairCalls.find((item) => item.id === cleanId(args.callId));
  if (!call || call.status !== "assigned" || call.assignedWorkerId !== cleanId(args.actor.actorId)) return { ok: false, reason: "repair_not_assigned_to_worker" };
  const business = args.state.businesses[call.businessId];
  const property = args.state.properties[call.propertyId];
  if (!business || !property || !validActor(args.actor, business, 2, false)) return { ok: false, reason: "unauthorized_worker" };
  if (!closeTo(args.actor.x, args.actor.z, property.x, property.z, 20)) return { ok: false, reason: "worker_not_at_property" };
  if (safeMoney(args.customerCash) < call.price) return { ok: false, reason: "insufficient_cash" };
  const now = Number(args.now ?? Date.now());
  if (!validTime(now)) return { ok: false, reason: "invalid_timestamp" };
  const issue = property.issues.find((item) => item.id === call.issueId);
  if (!issue || issue.status !== "open") return { ok: false, reason: "issue_not_open" };
  issue.status = "resolved";
  issue.resolvedAt = now;
  call.status = "completed";
  call.completedAt = now;
  ledger(args.state, { id: "stage11-repair-ledger:" + call.id, requestId: "complete:" + call.requestId, actorId: cleanId(args.actor.actorId), customerId: call.customerId, businessId: business.id, kind: "repair", amount: call.price, at: now });
  return { ok: true, result: { ...call } };
}

export function payStage11UtilityBill(args: {
  state: Stage11State;
  requestId: string;
  customerId: string;
  propertyId: string;
  utility: Stage11UtilityKind;
  customerCash: number;
  now?: number;
}): Stage11Result<Stage11UtilityPayment> {
  const requestId = cleanId(args.requestId);
  const customerId = cleanId(args.customerId);
  const property = args.state.properties[cleanId(args.propertyId)];
  if (!requestId || !customerId || args.state.completedRequests[requestId]) return { ok: false, reason: "duplicate_or_invalid_request" };
  if (!property || !propertyMember(property, customerId)) return { ok: false, reason: "property_access_denied" };
  if (!UTILITIES.includes(args.utility)) return { ok: false, reason: "unknown_utility" };
  const bill = property.bills[args.utility];
  if (!bill || bill.amountDue <= 0) return { ok: false, reason: "no_outstanding_bill" };
  const amount = bill.amountDue;
  if (safeMoney(args.customerCash) < amount) return { ok: false, reason: "insufficient_cash" };
  const now = Number(args.now ?? Date.now());
  if (!validTime(now)) return { ok: false, reason: "invalid_timestamp" };
  if (!markRequest(args.state, requestId)) return { ok: false, reason: "duplicate_or_invalid_request" };
  bill.amountDue = 0;
  bill.paidAt = now;
  const payment: Stage11UtilityPayment = { id: "stage11-utility:" + requestId, requestId, customerId, propertyId: property.id, utility: args.utility, amount, paidAt: now };
  appendBounded(args.state.utilityPayments, payment);
  ledger(args.state, { id: payment.id + ":ledger", requestId, actorId: customerId, customerId, businessId: "rivers-utilities", kind: "utility", amount, at: now });
  return { ok: true, result: { ...payment } };
}

export function openStage11CourierDelivery(args: {
  state: Stage11State;
  requestId: string;
  customerId: string;
  recipientName: string;
  parcelDescription: string;
  dropoffX: number;
  dropoffZ: number;
  now?: number;
}): Stage11Result<Stage11CourierDelivery> {
  const requestId = cleanId(args.requestId);
  const customerId = cleanId(args.customerId);
  const hub = args.state.businesses["courier-hub-main"];
  const recipientName = String(args.recipientName ?? "").trim().slice(0, 100);
  const parcelDescription = String(args.parcelDescription ?? "").trim().slice(0, 180);
  if (!requestId || !customerId || args.state.completedRequests[requestId]) return { ok: false, reason: "duplicate_or_invalid_request" };
  if (!hub || !recipientName || parcelDescription.length < 2) return { ok: false, reason: "invalid_delivery_details" };
  if (!Number.isFinite(args.dropoffX) || !Number.isFinite(args.dropoffZ) || Math.abs(args.dropoffX) > 2000 || Math.abs(args.dropoffZ) > 2000) return { ok: false, reason: "invalid_dropoff" };
  const routeDistance = distance(hub.x, hub.z, args.dropoffX, args.dropoffZ);
  const price = Math.min(50000, Math.ceil(2000 + routeDistance * 75));
  const now = Number(args.now ?? Date.now());
  if (!validTime(now)) return { ok: false, reason: "invalid_timestamp" };
  if (!markRequest(args.state, requestId)) return { ok: false, reason: "duplicate_or_invalid_request" };
  const delivery: Stage11CourierDelivery = {
    id: "stage11-delivery:" + requestId, requestId, customerId, recipientName, parcelDescription,
    dropoffX: args.dropoffX, dropoffZ: args.dropoffZ, assignedWorkerId: null,
    status: "open", price, createdAt: now, pickedUpAt: null, completedAt: null,
  };
  appendBounded(args.state.deliveries, delivery);
  return { ok: true, result: { ...delivery } };
}

export function assignStage11CourierDelivery(args: {
  state: Stage11State;
  deliveryId: string;
  supervisor: Stage11Actor;
  assignee: Pick<Stage11Actor, "actorId" | "workplaceId" | "rank">;
}): Stage11Result<Stage11CourierDelivery> {
  const delivery = args.state.deliveries.find((item) => item.id === cleanId(args.deliveryId));
  const hub = args.state.businesses["courier-hub-main"];
  if (!delivery || delivery.status !== "open" || !hub) return { ok: false, reason: "delivery_not_assignable" };
  if (!validActor(args.supervisor, hub, 5)) return { ok: false, reason: "unauthorized_dispatcher" };
  if (cleanId(args.assignee.workplaceId) !== hub.id || !cleanId(args.assignee.actorId) ||
      !Number.isInteger(args.assignee.rank) || args.assignee.rank < 1 || args.assignee.rank > 6) return { ok: false, reason: "invalid_assignee" };
  delivery.assignedWorkerId = cleanId(args.assignee.actorId);
  delivery.status = "assigned";
  return { ok: true, result: { ...delivery } };
}

export function pickupStage11CourierDelivery(args: {
  state: Stage11State;
  deliveryId: string;
  actor: Stage11Actor;
  now?: number;
}): Stage11Result<Stage11CourierDelivery> {
  const delivery = args.state.deliveries.find((item) => item.id === cleanId(args.deliveryId));
  const hub = args.state.businesses["courier-hub-main"];
  if (!delivery || delivery.status !== "assigned" || delivery.assignedWorkerId !== cleanId(args.actor.actorId) || !hub) return { ok: false, reason: "delivery_not_assigned_to_worker" };
  if (!validActor(args.actor, hub)) return { ok: false, reason: "unauthorized_courier" };
  const now = Number(args.now ?? Date.now());
  if (!validTime(now)) return { ok: false, reason: "invalid_timestamp" };
  delivery.status = "in-transit";
  delivery.pickedUpAt = now;
  return { ok: true, result: { ...delivery } };
}

export function completeStage11CourierDelivery(args: {
  state: Stage11State;
  deliveryId: string;
  customerCash: number;
  actor: Stage11Actor;
  now?: number;
}): Stage11Result<Stage11CourierDelivery> {
  const delivery = args.state.deliveries.find((item) => item.id === cleanId(args.deliveryId));
  const hub = args.state.businesses["courier-hub-main"];
  if (!delivery || delivery.status !== "in-transit" || delivery.assignedWorkerId !== cleanId(args.actor.actorId) || !hub) return { ok: false, reason: "delivery_not_in_transit_with_worker" };
  if (!validActor(args.actor, hub, 1, false)) return { ok: false, reason: "unauthorized_courier" };
  if (!closeTo(args.actor.x, args.actor.z, delivery.dropoffX, delivery.dropoffZ, 18)) return { ok: false, reason: "courier_not_at_dropoff" };
  if (safeMoney(args.customerCash) < delivery.price) return { ok: false, reason: "insufficient_cash" };
  const now = Number(args.now ?? Date.now());
  if (!validTime(now)) return { ok: false, reason: "invalid_timestamp" };
  delivery.status = "delivered";
  delivery.completedAt = now;
  ledger(args.state, { id: "stage11-courier-ledger:" + delivery.id, requestId: "complete:" + delivery.requestId, actorId: cleanId(args.actor.actorId), customerId: delivery.customerId, businessId: hub.id, kind: "courier", amount: delivery.price, at: now });
  return { ok: true, result: { ...delivery } };
}
