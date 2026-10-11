import { stage15Cities } from "./stage15";

export type Stage16CityEnvironment = {
  cityId: string;
  profile: "coastal-industrial" | "commercial-hub" | "cultural-capital" | "garden-city" | "river-port" | "delta-wetlands" | "royal-heritage";
  atmosphere: string;
  districtName: string;
  guideTitle: string;
  localActivities: readonly string[];
  skyHex: number;
  fogHex: number;
  accentHex: number;
  accentCss: string;
  landmarks: readonly string[];
};

export const STAGE16_CITY_ENVIRONMENTS: readonly Stage16CityEnvironment[] = [
  {
    cityId: "port-harcourt",
    profile: "coastal-industrial",
    atmosphere: "Coastal industry and waterfront energy",
    districtName: "Port Waterfront",
    guideTitle: "Waterfront & Civic Walk",
    localActivities: ["Walk the waterfront overlook","Explore the civic green and park edge","View the port-inspired landmark and freight displays"],
    skyHex: 0x8bbad0,
    fogHex: 0xb6c9cb,
    accentHex: 0x31b8e8,
    accentCss: "#31b8e8",
    landmarks: ["Port Harcourt Pleasure Park", "Isaac Boro Park", "Waterfront industrial district"],
  },
  {
    cityId: "aba",
    profile: "commercial-hub",
    atmosphere: "Busy trading streets and maker culture",
    districtName: "Ariaria Trading Quarter",
    guideTitle: "Market & Makers Walk",
    localActivities: ["Browse the covered market stalls","Explore the maker-street shopfronts","Visit the traders' information pavilion"],
    skyHex: 0xc7bca0,
    fogHex: 0xd3c8ad,
    accentHex: 0xf0ad45,
    accentCss: "#f0ad45",
    landmarks: ["Ariaria International Market", "Aba garment and footwear district", "Ngwa Road trading corridor"],
  },
  {
    cityId: "owerri",
    profile: "cultural-capital",
    atmosphere: "Cultural venues and lively civic streets",
    districtName: "Cultural & Civic Quarter",
    guideTitle: "Culture & Civic Walk",
    localActivities: ["Visit the cultural hall forecourt","Explore the public art and columned plaza","Discover the local landmarks guide"],
    skyHex: 0xb0cba8,
    fogHex: 0xc7d3b9,
    accentHex: 0x67c987,
    accentCss: "#67c987",
    landmarks: ["Assumpta Cathedral", "Mbari Cultural and Art Centre", "Owerri civic district"],
  },
  {
    cityId: "uyo",
    profile: "garden-city",
    atmosphere: "Green avenues and modern civic spaces",
    districtName: "Garden Boulevard",
    guideTitle: "Garden & Stadium Walk",
    localActivities: ["Explore the landscaped plaza","Visit the stadium-inspired landmark","Take the shaded path beside the civic garden"],
    skyHex: 0xa8cde0,
    fogHex: 0xc3d7d9,
    accentHex: 0x6ed4b1,
    accentCss: "#6ed4b1",
    landmarks: ["Ibom Plaza", "Godswill Akpabio International Stadium", "Uyo central boulevard"],
  },
  {
    cityId: "warri",
    profile: "river-port",
    atmosphere: "River port, industry and commercial streets",
    districtName: "Riverfront Commercial Quarter",
    guideTitle: "Riverfront & Trade Walk",
    localActivities: ["Explore the riverside dock display","Walk by the port-side shopfronts","Visit the harbour information kiosk"],
    skyHex: 0xaac5d3,
    fogHex: 0xc3c8c6,
    accentHex: 0xff9c56,
    accentCss: "#ff9c56",
    landmarks: ["Warri River waterfront", "Effurun-Warri commercial corridor", "Warri civic district"],
  },
  {
    cityId: "yenagoa",
    profile: "delta-wetlands",
    atmosphere: "Creeks, wetlands and a growing state capital",
    districtName: "Creekside Civic Quarter",
    guideTitle: "Creek & Wetlands Walk",
    localActivities: ["Follow the creekside boardwalk display","Explore the mangrove garden edge","Visit the civic pavilion information point"],
    skyHex: 0x9fcbc5,
    fogHex: 0xbcd5cd,
    accentHex: 0x52c6b3,
    accentCss: "#52c6b3",
    landmarks: ["Ox-Bow Lake", "Bayelsa State Secretariat district", "Yenagoa creek-side district"],
  },
  {
    cityId: "benin-city",
    profile: "royal-heritage",
    atmosphere: "Historic walls, royal heritage and broad avenues",
    districtName: "Royal Heritage Quarter",
    guideTitle: "Heritage & Palace Walk",
    localActivities: ["Explore the palace-gate landmark","Walk the heritage forecourt","Visit the local history information kiosk"],
    skyHex: 0xc9b39e,
    fogHex: 0xd6c8b6,
    accentHex: 0xd9a0ff,
    accentCss: "#d9a0ff",
    landmarks: ["Oba's Palace", "Benin Moat", "Benin City heritage district"],
  },
] as const;

const environmentMap = new Map(STAGE16_CITY_ENVIRONMENTS.map((environment) => [environment.cityId, environment]));

export function stage16Environments(): readonly Stage16CityEnvironment[] {
  return STAGE16_CITY_ENVIRONMENTS;
}

export function findStage16Environment(cityId: string): Stage16CityEnvironment | undefined {
  return environmentMap.get(cityId);
}

export function validateStage16EnvironmentCatalogue(): { ok: boolean; issues: string[] } {
  const issues: string[] = [];
  const expectedCityIds = new Set(stage15Cities().map((city) => city.id));
  const actualCityIds = new Set(STAGE16_CITY_ENVIRONMENTS.map((environment) => environment.cityId));
  for (const cityId of expectedCityIds) {
    if (!actualCityIds.has(cityId)) issues.push("missing environment profile: " + cityId);
  }
  for (const environment of STAGE16_CITY_ENVIRONMENTS) {
    if (!expectedCityIds.has(environment.cityId)) issues.push("unknown city profile: " + environment.cityId);
    if (!Number.isInteger(environment.skyHex) || environment.skyHex < 0 || environment.skyHex > 0xffffff) issues.push("invalid sky colour: " + environment.cityId);
    if (!Number.isInteger(environment.fogHex) || environment.fogHex < 0 || environment.fogHex > 0xffffff) issues.push("invalid fog colour: " + environment.cityId);
    if (!Number.isInteger(environment.accentHex) || environment.accentHex < 0 || environment.accentHex > 0xffffff) issues.push("invalid accent colour: " + environment.cityId);
    if (environment.landmarks.length < 2) issues.push("insufficient city landmarks: " + environment.cityId);
    if (!environment.districtName.trim()) issues.push("missing city district name: " + environment.cityId);
    if (!environment.guideTitle.trim()) issues.push("missing city guide title: " + environment.cityId);
    if (environment.localActivities.length < 2 || environment.localActivities.some((activity) => !activity.trim())) {
      issues.push("insufficient local activities: " + environment.cityId);
    }
  }
  if (actualCityIds.size !== STAGE16_CITY_ENVIRONMENTS.length) issues.push("duplicate city environment profile");
  if (new Set(STAGE16_CITY_ENVIRONMENTS.map((environment) => environment.accentHex)).size !== STAGE16_CITY_ENVIRONMENTS.length) {
    issues.push("city accent palettes must be distinct");
  }
  return { ok: issues.length === 0, issues };
}
