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

export type Stage15TravelRequest = {
  routeId: string;
  passengers: number;
  requestId: string;
  balanceNaira: number;
};

export type Stage15TravelResult = {
  routeId: string;
  fromCityId: string;
  toCityId: string;
  passengers: number;
  fareNaira: number;
  durationMinutes: number;
  requestId: string;
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

export function calculateStage15Fare(routeId: string, passengers: number): number {
  const route = findStage15Route(routeId);
  if (!route || !Number.isSafeInteger(passengers) || passengers < 1 || passengers > route.capacity) return 0;
  return route.baseFareNaira * passengers;
}

export function validateStage15Travel(request: Stage15TravelRequest, usedRequestIds: ReadonlySet<string> = new Set()): Stage15TravelResult | null {
  const route = findStage15Route(request.routeId);
  if (!route) return null;
  if (!Number.isSafeInteger(request.passengers) || request.passengers < 1 || request.passengers > route.capacity) return null;
  if (!request.requestId || request.requestId.length > 128 || usedRequestIds.has(request.requestId)) return null;
  if (!Number.isFinite(request.balanceNaira) || request.balanceNaira < 0) return null;

  const fareNaira = calculateStage15Fare(route.id, request.passengers);
  if (fareNaira <= 0 || request.balanceNaira < fareNaira) return null;
  if (!findStage15City(route.fromCityId) || !findStage15City(route.toCityId)) return null;

  return {
    routeId: route.id,
    fromCityId: route.fromCityId,
    toCityId: route.toCityId,
    passengers: request.passengers,
    fareNaira,
    durationMinutes: route.durationMinutes,
    requestId: request.requestId,
  };
}
