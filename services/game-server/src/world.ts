// Stage 1 foundation: game data (ranks, workplaces, houses, cars), the Nigeria-time day clock,
// per-player "life" state, and the pure rules the later stages build on.
// Nothing in here touches the network or the database, so it can be tested on its own
// (see test-stage1.ts) and every rule is decided on the server.

// ---------------------------------------------------------------- ranks

export const RANK_COUNT = 6;
export const BOSS_RANK = 6; // rank 6 is the boss
export const MAX_STAFF_RANK = 5; // bosses can promote staff up to here, never higher
export const START_RANK = 1;

// Pay = task pay x multiplier. Index 0 is rank 1. Easy to change.
export const RANK_MULTIPLIERS: readonly number[] = [1.0, 1.25, 1.6, 2.0, 2.6, 3.5];

export type RuleCheck = { ok: true } | { ok: false; reason: string };

export function rankMultiplier(rank: number): number {
  if (!Number.isInteger(rank) || rank < 1 || rank > RANK_COUNT) return RANK_MULTIPLIERS[0];
  return RANK_MULTIPLIERS[rank - 1];
}

export function payForTask(basePay: number, rank: number): number {
  const safeBasePay = Number.isFinite(basePay) ? Math.max(0, Math.floor(basePay)) : 0;
  return Math.round(safeBasePay * rankMultiplier(rank));
}

// Money transfers must not create funds on the client. Cash purchases may reduce cash,
// and a job reward is validated separately against the server's active job. Any positive
// bank change must be matched by an equal cash decrease; any positive cash change must be
// a validated job reward or a matching bank withdrawal.
export function validateWalletDeltas(
  cashDelta: number,
  bankDelta: number,
  reason: string,
): RuleCheck {
  if (!Number.isSafeInteger(cashDelta) || !Number.isSafeInteger(bankDelta)) {
    return { ok: false, reason: "Wallet amounts must be whole numbers." };
  }
  if (reason === "job") {
    if (cashDelta <= 0 || bankDelta !== 0) {
      return { ok: false, reason: "Invalid job reward request." };
    }
    return { ok: true };
  }
  if (cashDelta > 0 && bankDelta !== -cashDelta) {
    return { ok: false, reason: "Cash increases must come from a matching bank withdrawal." };
  }
  if (bankDelta > 0 && cashDelta !== -bankDelta) {
    return { ok: false, reason: "Bank increases must come from a matching cash deposit." };
  }
  return { ok: true };
}

// ---------------------------------------------------------------- workplaces

export type WorkplaceKind = "market" | "bank" | "hospital" | "park" | "news" | "government";

export type Workplace = {
  id: string;
  name: string;
  kind: WorkplaceKind;
  zone: string; // district it belongs in; exact x/z are set when the stage that builds it places it
  // Six entries, rank 1 first. Each entry lists the titles that share that rank.
  rankTitles: readonly (readonly string[])[];
};

const ladder = (...titles: string[]): readonly (readonly string[])[] => titles.map((t) => [t]);

// Only workplaces whose six titles are already fixed in the plan are listed.
// Police, army, FRSC, fire, transport, shops and the rest are added in their own stages.
export const WORKPLACES: readonly Workplace[] = [
  {
    id: "market-mile1",
    name: "Mile 1 Market",
    kind: "market",
    zone: "Mile 1 Market",
    rankTitles: ladder("Hawker", "Stall Assistant", "Sales Rep", "Senior Sales", "Market Supervisor", "Market Chairman"),
  },
  {
    id: "bank-main",
    name: "Port Harcourt Bank",
    kind: "bank",
    zone: "Port Harcourt Centre",
    rankTitles: ladder("Trainee", "Teller", "Senior Teller", "Loan Officer", "Operations Manager", "Branch Manager"),
  },
  {
    id: "hospital-main",
    name: "General Hospital",
    kind: "hospital",
    zone: "Port Harcourt Centre",
    rankTitles: ladder("Orderly", "Nurse Aide", "Nurse", "Senior Nurse", "Doctor", "Chief Medical Director"),
  },
  {
    id: "park-main",
    name: "City Park",
    kind: "park",
    zone: "Port Harcourt Centre",
    rankTitles: ladder("Cleaner", "Gate Attendant", "Ticket Seller", "Ranger", "Operations Officer", "Park Director"),
  },
  {
    id: "news-main",
    name: "Rivers News Network",
    kind: "news",
    zone: "Port Harcourt Centre",
    rankTitles: ladder("Intern", "Production Assistant", "Reporter", "Anchor", "Editor", "Editor-in-Chief"),
  },
  {
    id: "gov-rivers",
    name: "Rivers State Government",
    kind: "government",
    zone: "Port Harcourt Centre",
    rankTitles: [
      ["Councillor", "Assistant", "Clerk"],
      ["Vice Chairman", "Special Adviser", "PRO"],
      ["Commissioner", "Senator", "LGA Chairman"],
      ["Secretary to the State Government", "Chief of Staff", "Speaker"],
      ["Deputy Governor"],
      ["Governor"],
    ],
  },
];

export function findWorkplace(id: string): Workplace | undefined {
  return WORKPLACES.find((w) => w.id === id);
}

// ---------------------------------------------------------------- houses

export type HouseClassId = "hut" | "faceme" | "flat" | "estate" | "mansion" | "palace";

export type HouseClass = {
  id: HouseClassId;
  name: string;
  rentPerDay: number; // naira
};

export const MAX_PREPAID_DAYS = 7;

export const HOUSE_CLASSES: readonly HouseClass[] = [
  { id: "hut", name: "Local Hut", rentPerDay: 1000 },
  { id: "faceme", name: "Face-Me-I-Face-You", rentPerDay: 2500 },
  { id: "flat", name: "Flat", rentPerDay: 4000 },
  { id: "estate", name: "Estate House", rentPerDay: 7500 },
  { id: "mansion", name: "Mansion", rentPerDay: 10000 },
  { id: "palace", name: "Palace", rentPerDay: 20000 },
];

export type HouseDef = {
  id: string;
  cls: HouseClassId;
  zone: string;
  // Provisional spot inside the district. `placed` stays false until Stage 2 checks it
  // against the real map so no house sits on a road or inside a building.
  x: number;
  z: number;
  placed: boolean;
};

// District bounds copied from the client map (x1, x2, z1, z2).
const ZONE_BOUNDS: Record<string, [number, number, number, number]> = {
  "Mile 1 Market": [-85, -12, 78, 112],
  "D-Line": [24, 85, -100, -14],
  "Old GRA": [-240, -100, -240, -120],
  "Trans Amadi": [100, 240, -240, -120],
  Rumuola: [100, 240, -100, 60],
  Waterlines: [-240, 240, 115, 200],
};
const HOUSE_PLAN: ReadonlyArray<{cls: HouseClassId; zone: string; count: number; tag: string}> = [
  {cls:"hut",zone:"Mile 1 Market",count:4,tag:"m1"},{cls:"hut",zone:"Rumuola",count:4,tag:"rum"},
  {cls:"faceme",zone:"Mile 1 Market",count:3,tag:"m1"},{cls:"faceme",zone:"Rumuola",count:3,tag:"rum"},
  {cls:"flat",zone:"D-Line",count:4,tag:"dl"},{cls:"flat",zone:"Waterlines",count:4,tag:"wl"},
  {cls:"estate",zone:"Trans Amadi",count:3,tag:"ta"},{cls:"mansion",zone:"Old GRA",count:3,tag:"gra"},
  {cls:"palace",zone:"Old GRA",count:2,tag:"gra"},
];
function buildHouses(): HouseDef[] {
 const out: HouseDef[]=[]; const seen: Record<string,number>={};
 for (const p of HOUSE_PLAN) {
  const [x1,x2,z1,z2]=ZONE_BOUNDS[p.zone];
  for(let i=0;i<p.count;i++){
   const key=p.cls+"-"+p.tag; const n=seen[key]=(seen[key]??0)+1; const t=(i+1)/(p.count+1);
   out.push({id:key+"-"+String(n).padStart(2,"0"),cls:p.cls,zone:p.zone,
    x:Math.round(x1+(x2-x1)*t),z:Math.round(z1+(z2-z1)*(0.3+0.4*t)),placed:false});
  }
 }
 return out;
}
export const HOUSES: readonly HouseDef[]=buildHouses();
export function findHouse(id:string){return HOUSES.find(h=>h.id===id);}
export function houseRent(id:string){const h=findHouse(id);return HOUSE_CLASSES.find(c=>c.id===h?.cls)?.rentPerDay??0;}
export const CAR_IDS: readonly string[]=["c0","c1","c2","c3","c4"];

// Nigeria is UTC+1 year-round. Shift the instant before extracting the UTC date.
const WAT_OFFSET_MS=60*60*1000;
const DAY_MS=24*60*60*1000;
export function isValidDayKey(v:unknown):v is string {
 if(typeof v!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;
 const n=Date.parse(v+"T00:00:00.000Z");
 return Number.isFinite(n)&&new Date(n).toISOString().slice(0,10)===v;
}
export function watDayKey(ms:number):string {
 if(!Number.isFinite(ms))throw new Error("Game clock needs a finite timestamp.");
 return new Date(ms+WAT_OFFSET_MS).toISOString().slice(0,10);
}
export function daysBetween(a:string,b:string):number {
 if(!isValidDayKey(a)||!isValidDayKey(b))return 0;
 return Math.round((Date.parse(b+"T00:00:00Z")-Date.parse(a+"T00:00:00Z"))/DAY_MS);
}
export class GameClock {
 private offsetMs=0;
 now(){return Date.now()+this.offsetMs;}
 dayKey(){return watDayKey(this.now());}
 skipDays(days:number){const d=Math.trunc(days);if(Number.isFinite(d)&&d>=1&&d<=3650)this.offsetMs+=d*DAY_MS;}
 get offsetDays(){return Math.round(this.offsetMs/DAY_MS);}
}
export type Employment={workplaceId:string;rank:number};
export type Life={v:1;employment:Employment|null;homeId:string|null;rentDays:number;lastDay:string;ownedCars:string[]};
export function newLife(todayKey:string):Life {
 return {v:1,employment:null,homeId:null,rentDays:0,lastDay:isValidDayKey(todayKey)?todayKey:watDayKey(Date.now()),ownedCars:[]};
}
export function normalizeLife(value:unknown,todayKey:string):Life {
 const base=newLife(todayKey); if(!value||typeof value!=="object"||Array.isArray(value))return base;
 const v=value as Record<string,unknown>;
 let employment:Employment|null=null;
 const e=v.employment;
 if(e&&typeof e==="object"&&!Array.isArray(e)){
  const x=e as Record<string,unknown>;
  if(typeof x.workplaceId==="string"&&findWorkplace(x.workplaceId)&&Number.isInteger(x.rank)&&Number(x.rank)>=1&&Number(x.rank)<=6)
   employment={workplaceId:x.workplaceId,rank:Number(x.rank)};
 }
 const homeId=typeof v.homeId==="string"&&findHouse(v.homeId)?v.homeId:null;
 const rentDays=homeId?Math.max(0,Math.min(MAX_PREPAID_DAYS,Math.floor(Number(v.rentDays)||0))):0;
 const lastDay=isValidDayKey(v.lastDay)&&daysBetween(todayKey,v.lastDay)<=0?v.lastDay:base.lastDay;
 const ownedCars=Array.isArray(v.ownedCars)?[...new Set(v.ownedCars.filter((x):x is string=>typeof x==="string"&&CAR_IDS.includes(x)))]:[];
 return {v:1,employment,homeId,rentDays,lastDay,ownedCars};
}
export type RolloverResult={life:Life;midnights:number;rentUsed:number;homeLost:string|null};
export function settleLife(life:Life,todayKey:string):RolloverResult {
 const n=normalizeLife(life,todayKey);const today=isValidDayKey(todayKey)?todayKey:n.lastDay;
 const midnights=Math.max(0,daysBetween(n.lastDay,today));const next={...n,ownedCars:[...n.ownedCars],lastDay:midnights?today:n.lastDay};
 let rentUsed=0;let homeLost:string|null=null;
 if(next.homeId)for(let i=0;i<midnights;i++){
  if(next.rentDays>0){next.rentDays--;rentUsed++;}
  else {homeLost=next.homeId;next.homeId=null;next.rentDays=0;break;}
 }
 return {life:next,midnights,rentUsed,homeLost};
}
export type RankCheck=RuleCheck;
export function checkRankChange(args:{workplaceId:string;actorId:string;actorBossOf:string|null;targetId:string;targetEmployment:Employment|null;newRank:number}):RankCheck {
 const {workplaceId,actorId,actorBossOf,targetId,targetEmployment,newRank}=args;
 if(!findWorkplace(workplaceId))return {ok:false,reason:"Unknown workplace."};
 if(actorBossOf!==workplaceId)return {ok:false,reason:"Only the boss can change ranks."};
 if(actorId===targetId)return {ok:false,reason:"Nobody can change their own rank."};
 if(!targetEmployment||targetEmployment.workplaceId!==workplaceId)return {ok:false,reason:"That person doesn't work here."};
 if(!Number.isInteger(newRank)||newRank<1||newRank>5)return {ok:false,reason:"Staff ranks go from 1 to 5."};
 if(newRank===targetEmployment.rank)return {ok:false,reason:"They already have that rank."};
 return {ok:true};
}
export type WorldState={v:1;bosses:Record<string,string|null>;houseTenants:Record<string,string|null>;lastDay:string};
export function newWorld(todayKey:string):WorldState {
 const bosses:Record<string,string|null>={};for(const w of WORKPLACES)bosses[w.id]=null;
 const houseTenants:Record<string,string|null>={};for(const h of HOUSES)houseTenants[h.id]=null;
 return {v:1,bosses,houseTenants,lastDay:isValidDayKey(todayKey)?todayKey:watDayKey(Date.now())};
}
export function normalizeWorld(value:unknown,todayKey:string):WorldState {
 const base=newWorld(todayKey);if(!value||typeof value!=="object"||Array.isArray(value))return base;
 const v=value as Record<string,unknown>;
 const bs=v.bosses&&typeof v.bosses==="object"&&!Array.isArray(v.bosses)?v.bosses as Record<string,unknown>:{};
 const ts=v.houseTenants&&typeof v.houseTenants==="object"&&!Array.isArray(v.houseTenants)?v.houseTenants as Record<string,unknown>:{};
 for(const id of Object.keys(base.bosses))if(typeof bs[id]==="string"&&bs[id])base.bosses[id]=bs[id] as string;
 const seen=new Set<string>();
 for(const id of Object.keys(base.houseTenants)){const t=ts[id];if(typeof t==="string"&&t&&!seen.has(t)){base.houseTenants[id]=t;seen.add(t);}}
 if(isValidDayKey(v.lastDay)&&daysBetween(base.lastDay,v.lastDay)<=0)base.lastDay=v.lastDay;
 return base;
}
export function bossWorkplaceOf(world:WorldState,accountId:string):string|null {
 for(const [workplaceId,bossId] of Object.entries(world.bosses))if(bossId===accountId)return workplaceId;
 return null;
}
