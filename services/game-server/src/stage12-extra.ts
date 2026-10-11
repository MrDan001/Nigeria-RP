import { STAGE12_ACTION_LIMIT, type Stage12Actor, type Stage12State } from "./stage12";

const id = (v: unknown): string => String(v ?? "").trim().slice(0, 120);
const validTime = (v: unknown): v is number => Number.isSafeInteger(v) && Number(v) > 0;
const mark = (state: Stage12State, requestId: string): boolean => {
  const key = id(requestId);
  if (!key || state.completedRequests[key]) return false;
  state.completedRequests[key] = true;
  for (const old of Object.keys(state.completedRequests).slice(0, Math.max(0, Object.keys(state.completedRequests).length - STAGE12_ACTION_LIMIT))) delete state.completedRequests[old];
  return true;
};

export function completeStage12SchoolBusTrip(state: Stage12State, actor: Stage12Actor, requestId: string, distanceKm: number, now: number): number {
  if (!validTime(now) || !mark(state, requestId)) throw new Error("invalid or replayed request");
  const business = state.businesses[actor.workplaceId];
  if (!business || business.kind !== "school-bus" || actor.rank < 2 || !actor.onDuty || !actor.uniform || !actor.qualifications.includes("commercial-driver")) throw new Error("qualified school-bus driver required");
  const km = Number.isFinite(distanceKm) ? Math.max(1, Math.min(40, distanceKm)) : 0;
  if (!km) throw new Error("invalid route distance");
  const reward = Math.floor(km * 1200);
  state.ledger.push({ id: `ledger-${id(requestId)}`, requestId: id(requestId), actorId: actor.actorId, kind: "office", amount: reward, at: now });
  if (state.ledger.length > STAGE12_ACTION_LIMIT) state.ledger.splice(0, state.ledger.length - STAGE12_ACTION_LIMIT);
  return reward;
}

export function completeStage12ProfessionalTask(state: Stage12State, actor: Stage12Actor, requestId: string, now: number): number {
  if (!validTime(now) || !mark(state, requestId)) throw new Error("invalid or replayed request");
  const business = state.businesses[actor.workplaceId];
  if (!business || !actor.onDuty || !actor.uniform) throw new Error("professional duty required");
  const allowed = new Set(["office", "call-centre", "law-office", "news-office", "events", "industrial-security"]);
  if (!allowed.has(business.kind)) throw new Error("not a professional workplace");
  const rewardByKind: Record<string, number> = { office: 3000, "call-centre": 3500, "law-office": 7000, "news-office": 5500, events: 5000, "industrial-security": 4500 };
  const reward = rewardByKind[business.kind] ?? 0;
  state.ledger.push({ id: `ledger-${id(requestId)}`, requestId: id(requestId), actorId: actor.actorId, kind: "office", amount: reward, at: now });
  if (state.ledger.length > STAGE12_ACTION_LIMIT) state.ledger.splice(0, state.ledger.length - STAGE12_ACTION_LIMIT);
  return reward;
}
