import { findStage15City, stage15Cities } from "./stage15";
export const STAGE17_CITY_DISCOVERY_REWARD_NAIRA = 1500;
export const STAGE17_LEDGER_LIMIT = 5000;
export const STAGE17_REQUEST_LIMIT = 10000;
export const STAGE17_MAX_PASSPORTS = 50000;
export type Stage17CityStamp = { cityId: string; discoveredAt: number; rewardNaira: number };
export type Stage17LedgerEntry = { id: string; requestId: string; accountId: string; cityId: string; rewardNaira: number; at: number };
export type Stage17State = { passports: Record<string, Stage17CityStamp[]>; completedRequests: Record<string, true>; ledger: Stage17LedgerEntry[] };
export type Stage17PassportView = {
 accountId: string; currentCityId: string;
 stamps: Array<Stage17CityStamp & { cityName: string; current: boolean }>;
 visitedCityIds: string[]; visitedCount: number; totalCities: number;
 totalRewardsNaira: number; nextDiscoveryRewardNaira: number;
};
export type Stage17DiscoveryResult = { state: Stage17State; newlyDiscovered: boolean; cityId: string; rewardNaira: number; stamp: Stage17CityStamp };
const clean = (v: unknown, max=128) => String(v ?? "").trim().slice(0,max);
function rememberRequest(input: Record<string,true>, requestId:string): Record<string,true> {
 const next={...input,[requestId]:true}; const keys=Object.keys(next);
 for(const key of keys.slice(0,Math.max(0,keys.length-STAGE17_REQUEST_LIMIT))) delete next[key];
 return next;
}
export function createStage17State(): Stage17State { return {passports:{},completedRequests:{},ledger:[]}; }
export function normalizeStage17State(rawValue: unknown): Stage17State {
 if(!rawValue || typeof rawValue!=="object" || Array.isArray(rawValue)) return createStage17State();
 const raw=rawValue as Record<string,unknown>; const result=createStage17State();
 if(raw.passports && typeof raw.passports==="object" && !Array.isArray(raw.passports)) {
  for(const [rawId,rawStamps] of Object.entries(raw.passports as Record<string,unknown>).slice(-STAGE17_MAX_PASSPORTS)) {
   const accountId=clean(rawId); if(!accountId || !Array.isArray(rawStamps)) continue;
   const stamps:Stage17CityStamp[]=[]; const seen=new Set<string>();
   for(const value of rawStamps) {
    if(!value || typeof value!=="object" || Array.isArray(value)) continue;
    const stamp=value as Record<string,unknown>; const cityId=clean(stamp.cityId,64);
    const discoveredAt=Number(stamp.discoveredAt), rewardNaira=Number(stamp.rewardNaira);
    if(!findStage15City(cityId) || seen.has(cityId) || !Number.isSafeInteger(discoveredAt) || discoveredAt<0) continue;
    if(!Number.isSafeInteger(rewardNaira) || rewardNaira<0 || rewardNaira>STAGE17_CITY_DISCOVERY_REWARD_NAIRA) continue;
    stamps.push({cityId,discoveredAt,rewardNaira}); seen.add(cityId);
   }
   if(stamps.length) result.passports[accountId]=stamps.slice(-stage15Cities().length);
  }
 }
 if(raw.completedRequests && typeof raw.completedRequests==="object" && !Array.isArray(raw.completedRequests)) {
  for(const [key,flag] of Object.entries(raw.completedRequests as Record<string,unknown>).slice(-STAGE17_REQUEST_LIMIT)) {
   const request=clean(key); if(request && flag===true) result.completedRequests[request]=true;
  }
 }
 if(Array.isArray(raw.ledger)) for(const value of raw.ledger.slice(-STAGE17_LEDGER_LIMIT)) {
  if(!value || typeof value!=="object" || Array.isArray(value)) continue;
  const e=value as Record<string,unknown>; const id=clean(e.id), requestId=clean(e.requestId), accountId=clean(e.accountId), cityId=clean(e.cityId,64);
  const rewardNaira=Number(e.rewardNaira), at=Number(e.at);
  if(!id || !requestId || !accountId || !findStage15City(cityId) || rewardNaira!==STAGE17_CITY_DISCOVERY_REWARD_NAIRA || !Number.isSafeInteger(at) || at<0) continue;
  result.ledger.push({id,requestId,accountId,cityId,rewardNaira,at}); result.completedRequests[requestId]=true;
 }
 return result;
}
export function ensureStage17CityStamp(state:Stage17State, accountId:string, cityId:string, at:number):Stage17State {
 const account=clean(accountId), city=clean(cityId,64);
 if(!account || !findStage15City(city) || !Number.isSafeInteger(at) || at<0) throw new Error("INVALID_STAGE17_CITY_STAMP");
 if((state.passports[account]||[]).some(stamp=>stamp.cityId===city)) return state;
 const passports={...state.passports,[account]:[...(state.passports[account]||[]),{cityId:city,discoveredAt:at,rewardNaira:0}].slice(-stage15Cities().length)};
 const keys=Object.keys(passports); for(const key of keys.slice(0,Math.max(0,keys.length-STAGE17_MAX_PASSPORTS))) delete passports[key];
 return {...state,passports};
}
export function recordStage17CityDiscovery(state:Stage17State, accountId:string, fromCityId:string, toCityId:string, requestId:string, at:number):Stage17DiscoveryResult {
 const account=clean(accountId), from=clean(fromCityId,64), to=clean(toCityId,64), request=clean(requestId);
 if(!account || !findStage15City(from) || !findStage15City(to) || from===to || !request || !Number.isSafeInteger(at) || at<0) throw new Error("INVALID_STAGE17_DISCOVERY");
 if(state.completedRequests[request]) throw new Error("STAGE17_REQUEST_REPLAY");
 let next=ensureStage17CityStamp(state,account,from,at);
 const stamps=next.passports[account]||[]; const existing=stamps.find(stamp=>stamp.cityId===to);
 const newlyDiscovered=!existing, rewardNaira=newlyDiscovered?STAGE17_CITY_DISCOVERY_REWARD_NAIRA:0;
 const stamp=existing||{cityId:to,discoveredAt:at,rewardNaira};
 const ledger=newlyDiscovered?[...next.ledger,{id:account+":"+request,requestId:request,accountId:account,cityId:to,rewardNaira,at}].slice(-STAGE17_LEDGER_LIMIT):next.ledger;
 next={...next,passports:{...next.passports,[account]:existing?stamps:[...stamps,stamp].slice(-stage15Cities().length)},completedRequests:rememberRequest(next.completedRequests,request),ledger};
 return {state:next,newlyDiscovered,cityId:to,rewardNaira,stamp};
}
export function stage17Passport(state:Stage17State, accountId:string, currentCityId:string):Stage17PassportView {
 const account=clean(accountId), proposed=clean(currentCityId,64), current=findStage15City(proposed)?proposed:"port-harcourt";
 const stamps=(state.passports[account]||[]).slice();
 if(!stamps.some(stamp=>stamp.cityId===current)) stamps.push({cityId:current,discoveredAt:0,rewardNaira:0});
 const names=new Map(stage15Cities().map(city=>[city.id,city.name]));
 const unique=stamps.filter((stamp,i,all)=>all.findIndex(item=>item.cityId===stamp.cityId)===i);
 const normalized=unique.map(stamp=>({...stamp,cityName:names.get(stamp.cityId)||stamp.cityId,current:stamp.cityId===current}));
 return {accountId:account,currentCityId:current,stamps:normalized,visitedCityIds:normalized.map(stamp=>stamp.cityId),visitedCount:normalized.length,totalCities:stage15Cities().length,totalRewardsNaira:normalized.reduce((sum,stamp)=>sum+stamp.rewardNaira,0),nextDiscoveryRewardNaira:normalized.length<stage15Cities().length?STAGE17_CITY_DISCOVERY_REWARD_NAIRA:0};
}
