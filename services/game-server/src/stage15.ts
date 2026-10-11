export type Stage15City = {
  id: string;
  name: string;
  state: string;
  region: "south-south" | "south-east";
};

export type Stage15Route = {
  id: string;
  fromCityId: string;
  toCityId: string;
  distanceKm: number;
  durationMinutes: number;
  baseFareNaira: number;
  capacity: number;
};

export type Stage15TravelMode = "day-bus" | "night-bus" | "flight";
export function isStage15TravelMode(value: unknown): value is Stage15TravelMode {
  return value === "day-bus" || value === "night-bus" || value === "flight";
}
const STAGE15_MODE_MULTIPLIER: Record<Stage15TravelMode, number> = {
  "day-bus": 1,
  "night-bus": 1.2,
  flight: 2.5,
};

export type Stage15TravelRequest = {
  routeId: string;
  passengers: number;
  requestId: string;
  balanceNaira: number;
  travelMode?: Stage15TravelMode;
};

export type Stage15TravelResult = {
  routeId: string;
  fromCityId: string;
  toCityId: string;
  passengers: number;
  fareNaira: number;
  durationMinutes: number;
  requestId: string;
  travelMode: Stage15TravelMode;
};

export const STAGE15_CITIES: readonly Stage15City[] = [
  { id: "port-harcourt", name: "Port Harcourt", state: "Rivers", region: "south-south" },
  { id: "aba", name: "Aba", state: "Abia", region: "south-east" },
  { id: "owerri", name: "Owerri", state: "Imo", region: "south-east" },
  { id: "uyo", name: "Uyo", state: "Akwa Ibom", region: "south-south" },
  { id: "warri", name: "Warri", state: "Delta", region: "south-south" },
  { id: "yenagoa", name: "Yenagoa", state: "Bayelsa", region: "south-south" },
  { id: "benin-city", name: "Benin City", state: "Edo", region: "south-south" },
];

const ROUTES: readonly Stage15Route[] = [
  { id: "ph-aba", fromCityId: "port-harcourt", toCityId: "aba", distanceKm: 65, durationMinutes: 90, baseFareNaira: 4500, capacity: 14 },
  { id: "ph-owerri", fromCityId: "port-harcourt", toCityId: "owerri", distanceKm: 105, durationMinutes: 140, baseFareNaira: 6500, capacity: 14 },
  { id: "ph-uyo", fromCityId: "port-harcourt", toCityId: "uyo", distanceKm: 160, durationMinutes: 190, baseFareNaira: 8000, capacity: 14 },
  { id: "ph-warri", fromCityId: "port-harcourt", toCityId: "warri", distanceKm: 170, durationMinutes: 210, baseFareNaira: 8500, capacity: 14 },
  { id: "ph-yenagoa", fromCityId: "port-harcourt", toCityId: "yenagoa", distanceKm: 110, durationMinutes: 135, baseFareNaira: 6000, capacity: 14 },
  { id: "ph-benin", fromCityId: "port-harcourt", toCityId: "benin-city", distanceKm: 310, durationMinutes: 330, baseFareNaira: 12000, capacity: 14 },
  { id: "aba-owerri", fromCityId: "aba", toCityId: "owerri", distanceKm: 75, durationMinutes: 100, baseFareNaira: 4500, capacity: 14 },
  { id: "warri-benin", fromCityId: "warri", toCityId: "benin-city", distanceKm: 160, durationMinutes: 190, baseFareNaira: 7500, capacity: 14 },
  { id: "uyo-owerri", fromCityId: "uyo", toCityId: "owerri", distanceKm: 115, durationMinutes: 145, baseFareNaira: 6500, capacity: 14 },
  { id: "yenagoa-warri", fromCityId: "yenagoa", toCityId: "warri", distanceKm: 185, durationMinutes: 220, baseFareNaira: 9000, capacity: 14 },
  { id: "aba-ph", fromCityId: "aba", toCityId: "port-harcourt", distanceKm: 65, durationMinutes: 90, baseFareNaira: 4500, capacity: 14 },
  { id: "owerri-ph", fromCityId: "owerri", toCityId: "port-harcourt", distanceKm: 105, durationMinutes: 140, baseFareNaira: 6500, capacity: 14 },
  { id: "uyo-ph", fromCityId: "uyo", toCityId: "port-harcourt", distanceKm: 160, durationMinutes: 190, baseFareNaira: 8000, capacity: 14 },
  { id: "warri-ph", fromCityId: "warri", toCityId: "port-harcourt", distanceKm: 170, durationMinutes: 210, baseFareNaira: 8500, capacity: 14 },
  { id: "yenagoa-ph", fromCityId: "yenagoa", toCityId: "port-harcourt", distanceKm: 110, durationMinutes: 135, baseFareNaira: 6000, capacity: 14 },
  { id: "benin-ph", fromCityId: "benin-city", toCityId: "port-harcourt", distanceKm: 310, durationMinutes: 330, baseFareNaira: 12000, capacity: 14 },
  { id: "owerri-aba", fromCityId: "owerri", toCityId: "aba", distanceKm: 75, durationMinutes: 100, baseFareNaira: 4500, capacity: 14 },
  { id: "benin-warri", fromCityId: "benin-city", toCityId: "warri", distanceKm: 160, durationMinutes: 190, baseFareNaira: 7500, capacity: 14 },
  { id: "owerri-uyo", fromCityId: "owerri", toCityId: "uyo", distanceKm: 115, durationMinutes: 145, baseFareNaira: 6500, capacity: 14 },
  { id: "warri-yenagoa", fromCityId: "warri", toCityId: "yenagoa", distanceKm: 185, durationMinutes: 220, baseFareNaira: 9000, capacity: 14 },
];

const cityMap = new Map(STAGE15_CITIES.map((city) => [city.id, city]));
const routeMap = new Map(ROUTES.map((route) => [route.id, route]));

export function stage15Cities(): readonly Stage15City[] {
  return STAGE15_CITIES;
}

export function stage15Routes(): readonly Stage15Route[] {
  return ROUTES;
}

export function findStage15City(id: string): Stage15City | undefined {
  return cityMap.get(id);
}

export function findStage15Route(id: string): Stage15Route | undefined {
  return routeMap.get(id);
}

export function calculateStage15Fare(routeId: string, passengers: number, travelMode: Stage15TravelMode = "day-bus"): number {
  const route = findStage15Route(routeId);
  if (!route || !Number.isSafeInteger(passengers) || passengers < 1 || passengers > route.capacity || !isStage15TravelMode(travelMode)) return 0;
  return Math.round(route.baseFareNaira * STAGE15_MODE_MULTIPLIER[travelMode]) * passengers;
}

export function validateStage15Travel(request: Stage15TravelRequest, usedRequestIds: ReadonlySet<string> = new Set()): Stage15TravelResult | null {
  const route = findStage15Route(request.routeId);
  if (!route) return null;
  if (!Number.isSafeInteger(request.passengers) || request.passengers < 1 || request.passengers > route.capacity) return null;
  if (!request.requestId || request.requestId.length > 128 || usedRequestIds.has(request.requestId)) return null;
  if (!Number.isFinite(request.balanceNaira) || request.balanceNaira < 0) return null;
  const travelMode = request.travelMode ?? "day-bus";
  if (!isStage15TravelMode(travelMode)) return null;

  const fareNaira = calculateStage15Fare(route.id, request.passengers, travelMode);
  if (fareNaira <= 0 || request.balanceNaira < fareNaira) return null;
  if (!findStage15City(route.fromCityId) || !findStage15City(route.toCityId)) return null;

  return {
    routeId: route.id,
    fromCityId: route.fromCityId,
    toCityId: route.toCityId,
    passengers: request.passengers,
    fareNaira,
    durationMinutes: travelMode === "flight" ? Math.max(30, Math.round(route.durationMinutes / 4)) : travelMode === "night-bus" ? Math.round(route.durationMinutes * 1.08) : route.durationMinutes,
    requestId: request.requestId,
    travelMode,
  };
}


export type Stage15LedgerEntry = Stage15TravelResult & {
  accountId: string;
  completedAt: number;
  cashAfter: number;
};

export type Stage15State = {
  usedRequestIds: string[];
  ledger: Stage15LedgerEntry[];
};

const MAX_STAGE15_REQUEST_IDS = 10_000;
const MAX_STAGE15_LEDGER = 2_000;

export function createStage15State(): Stage15State {
  return { usedRequestIds: [], ledger: [] };
}

export function normalizeStage15State(value: unknown): Stage15State {
  if (!value || typeof value !== "object" || Array.isArray(value)) return createStage15State();
  const raw = value as Record<string, unknown>;
  const usedRequestIds = Array.isArray(raw.usedRequestIds)
    ? raw.usedRequestIds.filter((id): id is string => typeof id === "string" && id.length > 0 && id.length <= 128).slice(-MAX_STAGE15_REQUEST_IDS)
    : [];
  const ledger = Array.isArray(raw.ledger)
    ? raw.ledger.filter((entry): entry is Stage15LedgerEntry => {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) return false;
        const item = entry as Record<string, unknown>;
        return typeof item.accountId === "string" &&
          typeof item.requestId === "string" &&
          item.requestId.length > 0 &&
          typeof item.routeId === "string" &&
          !!findStage15Route(item.routeId) &&
          typeof item.fromCityId === "string" &&
          !!findStage15City(item.fromCityId) &&
          typeof item.toCityId === "string" &&
          !!findStage15City(item.toCityId) &&
          Number.isSafeInteger(item.passengers) && Number(item.passengers) > 0 &&
          Number.isSafeInteger(item.fareNaira) && Number(item.fareNaira) > 0 &&
          Number.isSafeInteger(item.durationMinutes) && Number(item.durationMinutes) > 0 &&
          Number.isFinite(item.completedAt) && Number(item.completedAt) >= 0 &&
          Number.isSafeInteger(item.cashAfter) && Number(item.cashAfter) >= 0;
      }).slice(-MAX_STAGE15_LEDGER) as Stage15LedgerEntry[]
    : [];
  // Older saved entries predate travel-mode selection; keep them as day-bus trips.
  const normalizedLedger = ledger.map((entry) => ({
    ...entry,
    travelMode: isStage15TravelMode((entry as { travelMode?: unknown }).travelMode) ? entry.travelMode : "day-bus",
  }));
  // Ledger entries are another durable replay source after a state is restored.
  const requestIds = new Set(usedRequestIds);
  for (const entry of normalizedLedger) requestIds.add(entry.requestId);
  return {
    usedRequestIds: [...requestIds].slice(-MAX_STAGE15_REQUEST_IDS),
    ledger: normalizedLedger,
  };
}

export function recordStage15Travel(
  state: Stage15State,
  result: Stage15TravelResult,
  accountId: string,
  completedAt: number,
  cashAfter: number,
): Stage15State {
  if (!accountId || !Number.isFinite(completedAt) || completedAt < 0 ||
      !Number.isSafeInteger(cashAfter) || cashAfter < 0 ||
      state.usedRequestIds.includes(result.requestId) ||
      !findStage15Route(result.routeId) ||
      !isStage15TravelMode(result.travelMode)) {
    throw new Error("INVALID_STAGE15_LEDGER_ENTRY");
  }
  const entry: Stage15LedgerEntry = {
    ...result,
    accountId,
    completedAt: Math.floor(completedAt),
    cashAfter,
  };
  return {
    usedRequestIds: [...state.usedRequestIds, result.requestId].slice(-MAX_STAGE15_REQUEST_IDS),
    ledger: [...state.ledger, entry].slice(-MAX_STAGE15_LEDGER),
  };
}

export function stage15CityName(cityId: string): string {
  return findStage15City(cityId)?.name ?? "Port Harcourt";
}

export function stage15CitySpawn(cityId: string): { x: number; z: number; yaw: number } {
  // Each city is an isolated logical instance using the current world-template geometry.
  // Safe spawn coordinates intentionally remain within the existing validated world bounds.
  const spawns: Record<string, { x: number; z: number; yaw: number }> = {
    "port-harcourt": { x: 0, z: 24, yaw: Math.PI },
    "aba": { x: 0, z: 24, yaw: Math.PI },
    "owerri": { x: 0, z: 24, yaw: Math.PI },
    "uyo": { x: 0, z: 24, yaw: Math.PI },
    "warri": { x: 0, z: 24, yaw: Math.PI },
    "yenagoa": { x: 0, z: 24, yaw: Math.PI },
    "benin-city": { x: 0, z: 24, yaw: Math.PI },
  };
  return spawns[cityId] ?? spawns["port-harcourt"];
}
