export const STAGE18_BET_MIN_STAKE = 10;
export const STAGE18_BET_MAX_STAKE = 50_000_000;
export const STAGE18_BET_CLOSE_HOUR = 22;
export const STAGE18_MAX_SELECTIONS = 9;

export type Stage18Pick = "home" | "draw" | "away";
export type Stage18Odds = Record<Stage18Pick, number>;
export type Stage18Fixture = {
  id: string;
  date: string;
  home: string;
  away: string;
  odds: Stage18Odds;
};
export type Stage18Outcome = {
  fixtureId: string;
  date: string;
  outcome: Stage18Pick;
  homeScore: number;
  awayScore: number;
};
export type Stage18Clock = {
  date: string;
  hour: number;
  minute: number;
  second: number;
  isoTime: string;
  isClosed: boolean;
};

const TEAMS: ReadonlyArray<readonly [string, string]> = [
  ["Port City FC", "Delta Rovers"],
  ["Rivergate Athletic", "Creekside United"],
  ["Civic Stars", "Harbour Town"],
  ["Garden City FC", "Riverside Lions"],
  ["Eagle Heights", "Dockyard United"],
  ["Old Township", "Creek Warriors"],
  ["Atlantic City", "Mainland Stars"],
  ["Waterfront FC", "Industrial Town"],
  ["Rivers United", "Coastal Kings"],
];

function seed(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function random(value: number): number {
  let number = (value + 0x6D2B79F5) | 0;
  let temp = Math.imul(number ^ (number >>> 15), 1 | number);
  temp ^= temp + Math.imul(temp ^ (temp >>> 7), 61 | temp);
  return ((temp ^ (temp >>> 14)) >>> 0) / 4294967296;
}

function partsAt(value: number | Date): Record<string, string> {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error("INVALID_STAGE18_TIME");
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const result: Record<string, string> = {};
  for (const part of parts) if (part.type !== "literal") result[part.type] = part.value;
  return result;
}

export function stage18NigeriaClock(value: number | Date = Date.now()): Stage18Clock {
  const date = value instanceof Date ? value : new Date(value);
  const parts = partsAt(date);
  const hour = Number(parts.hour);
  return {
    date: parts.year + "-" + parts.month + "-" + parts.day,
    hour,
    minute: Number(parts.minute),
    second: Number(parts.second),
    isoTime: date.toISOString(),
    isClosed: hour >= STAGE18_BET_CLOSE_HOUR,
  };
}

export function stage18Fixtures(date: string): Stage18Fixture[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("INVALID_STAGE18_DATE");
  const base = seed(date);
  return TEAMS.map(([home, away], index) => {
    const homeWeight = 0.42 + random(base + index * 71) * 0.26;
    const drawWeight = 0.24 + random(base + index * 97) * 0.16;
    const awayWeight = 0.42 + random(base + index * 131) * 0.26;
    const total = homeWeight + drawWeight + awayWeight;
    const margin = 1.06;
    return {
      id: date + "-" + String(index + 1).padStart(2, "0"),
      date,
      home,
      away,
      odds: {
        home: Number((margin / (homeWeight / total)).toFixed(2)),
        draw: Number((margin / (drawWeight / total)).toFixed(2)),
        away: Number((margin / (awayWeight / total)).toFixed(2)),
      },
    };
  });
}

function scoreSeed(date: string, fixtureId: string, segment: string): number {
  return seed(date + "|" + fixtureId + "|" + segment);
}

export function stage18ResultsForDate(date: string): Stage18Outcome[] {
  return stage18Fixtures(date).map((fixture) => {
    const resultRoll = random(scoreSeed(date, fixture.id, "result"));
    let outcome: Stage18Pick = resultRoll < 0.44 ? "home" : resultRoll < 0.70 ? "draw" : "away";
    let homeScore = Math.floor(random(scoreSeed(date, fixture.id, "home-score")) * 4);
    let awayScore = Math.floor(random(scoreSeed(date, fixture.id, "away-score")) * 4);
    if (outcome === "home" && homeScore <= awayScore) homeScore = awayScore + 1;
    if (outcome === "away" && awayScore <= homeScore) awayScore = homeScore + 1;
    if (outcome === "draw") awayScore = homeScore;
    return { fixtureId: fixture.id, date, outcome, homeScore, awayScore };
  });
}
