import { randomUUID } from "node:crypto";

export const TRANSPORT_WORKPLACE_ID = "transport-union";
export const STAGE9_DEPOT = { x: 16, z: 54 } as const;
export const STAGE9_STOP_RADIUS = 13;
export const STAGE9_FUEL_PRICE = 1150;
export const STAGE9_ACTION_LIMIT = 400;

export type Stage9VehicleType = "keke" | "okada" | "taxi" | "danfo" | "bus" | "haulage";
export type Stage9RideStatus = "waiting" | "assigned" | "onboard" | "completed" | "cancelled";
export type Stage9DeliveryStatus = "active" | "completed" | "cancelled";
export type Stage9Stop = { id: string; name: string; x: number; z: number; kind: string };
export type Stage9Vehicle = {
  id: string; type: Stage9VehicleType; label: string; minRank: number; tankLitres: number;
  ownerId: string | null; ownerName: string | null; fuelLitres: number; checkedOutAt: number | null;
};
export type Stage9Ride = {
  id: string; requestId: string; passengerId: string; passengerName: string;
  pickupStopId: string; destinationStopId: string; vehicleType: Exclude<Stage9VehicleType, "haulage">;
  driverId: string | null; driverName: string | null; vehicleId: string | null;
  routeStopIds: string[]; nextStopIndex: number; status: Stage9RideStatus;
  fare: number; driverShare: number; createdAt: number; updatedAt: number; settledAt: number | null;
};
export type Stage9Delivery = {
  id: string; requestId: string; driverId: string; driverName: string; vehicleId: string;
  routeId: string; stopIds: string[]; nextStopIndex: number; status: Stage9DeliveryStatus;
  reward: number; createdAt: number; updatedAt: number; completedAt: number | null;
};
export type Stage9Action = { id: string; requestId: string; kind: string; actorId: string; actorName: string; targetId: string; detail: string; at: number; result: string };
export type Stage9State = { vehicles: Record<string, Stage9Vehicle>; rides: Stage9Ride[]; deliveries: Stage9Delivery[]; actions: Stage9Action[]; unionTreasury: number };
export type Stage9Actor = { actorId: string; actorName: string; workplaceId: string | null; rank: number; onDuty: boolean; uniform: boolean; x: number; z: number };
export type Stage9Result = { ok: boolean; state: Stage9State; message: string; ride?: Stage9Ride; delivery?: Stage9Delivery; vehicle?: Stage9Vehicle; fare?: number; driverShare?: number; cost?: number; reward?: number };
type Base = { requestId: string; actor: Stage9Actor; now: number };
const catalog: readonly Omit<Stage9Vehicle, "ownerId" | "ownerName" | "fuelLitres" | "checkedOutAt">[] = [
  { id: "fleet-keke-01", type: "keke", label: "Keke Napep", minRank: 2, tankLitres: 24 },
  { id: "fleet-okada-01", type: "okada", label: "Okada", minRank: 2, tankLitres: 18 },
  { id: "fleet-taxi-01", type: "taxi", label: "City Taxi", minRank: 3, tankLitres: 40 },
  { id: "fleet-danfo-01", type: "danfo", label: "Danfo Minibus", minRank: 3, tankLitres: 70 },
  { id: "fleet-bus-01", type: "bus", label: "City Bus", minRank: 4, tankLitres: 100 },
  { id: "fleet-truck-01", type: "haulage", label: "Haulage Truck", minRank: 5, tankLitres: 150 },
];
export const STAGE9_VEHICLES = catalog;
export const STAGE9_STOPS: readonly Stage9Stop[] = [
  { id: "transport-terminal", name: "Transport Union Terminal", x: 16, z: 54, kind: "terminal" },
  { id: "park-gate", name: "City Park Gate", x: -30, z: 20, kind: "district" },
  { id: "mile1-market", name: "Mile 1 Market", x: -60, z: 40, kind: "market" },
  { id: "mile1-hospital", name: "Mile One General Hospital", x: -79, z: 106, kind: "hospital" },
  { id: "rumuola", name: "Rumuola Junction", x: 110, z: 70, kind: "district" },
  { id: "waterlines", name: "Waterlines", x: 90, z: 150, kind: "district" },
  { id: "civic-centre", name: "Civic Centre", x: 36, z: -8, kind: "civic" },
  { id: "newsroom", name: "Rivers News Network", x: 20, z: -52, kind: "civic" },
  { id: "trans-amadi", name: "Trans Amadi", x: 155, z: -126, kind: "industrial" },
];
export const STAGE9_ROUTES = [
  { id: "danfo-mile1-rumuola", name: "Danfo: Terminal → Mile 1 → Rumuola", vehicleType: "danfo" as const, stopIds: ["transport-terminal", "mile1-market", "rumuola"], reward: 2200 },
  { id: "bus-waterlines", name: "Bus: Terminal → Park → Mile 1 → Hospital → Waterlines", vehicleType: "bus" as const, stopIds: ["transport-terminal", "park-gate", "mile1-market", "mile1-hospital", "waterlines"], reward: 3600 },
  { id: "haulage-market-waterlines", name: "Haulage: Terminal → Mile 1 → Rumuola → Waterlines", vehicleType: "haulage" as const, stopIds: ["transport-terminal", "mile1-market", "rumuola", "waterlines"], reward: 11500 },
];
const validStop = (id: unknown): Stage9Stop | undefined => STAGE9_STOPS.find(s => s.id === id);
function isPassengerVehicleType(value: unknown): value is Stage9Ride["vehicleType"] { return value === "keke" || value === "okada" || value === "taxi" || value === "danfo" || value === "bus"; }
const rideStatuses: readonly Stage9RideStatus[] = ["waiting", "assigned", "onboard", "completed", "cancelled"];
const deliveryStatuses: readonly Stage9DeliveryStatus[] = ["active", "completed", "cancelled"];
const edges: readonly (readonly [string, string])[] = [
  ["transport-terminal", "park-gate"], ["transport-terminal", "mile1-market"], ["transport-terminal", "civic-centre"],
  ["park-gate", "mile1-market"], ["mile1-market", "mile1-hospital"], ["mile1-market", "rumuola"],
  ["mile1-hospital", "waterlines"], ["rumuola", "waterlines"], ["civic-centre", "newsroom"],
  ["newsroom", "trans-amadi"], ["rumuola", "trans-amadi"],
];
function obj(v: unknown): v is Record<string, unknown> { return !!v && typeof v === "object" && !Array.isArray(v); }
function clean(v: unknown, max = 180): string { return String(v ?? "").replace(/[<>\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max); }
function stamp(v: unknown, fallback = 0): number { const n = Number(v); return Number.isSafeInteger(n) && n >= 0 ? n : fallback; }
function amount(v: unknown): number { const n = Math.floor(Number(v)); return Number.isSafeInteger(n) && n >= 0 ? Math.min(2_000_000_000, n) : 0; }
function dist(x: number, z: number, p: Stage9Stop): number { return Math.hypot(x - p.x, z - p.z); }
function actorClean(a: Stage9Actor): Stage9Actor { return { actorId: clean(a.actorId, 120), actorName: clean(a.actorName, 80) || "Citizen", workplaceId: clean(a.workplaceId, 100) || null, rank: Math.max(0, Math.min(6, Math.floor(Number(a.rank) || 0)),), onDuty: a.onDuty === true, uniform: a.uniform === true, x: Number(a.x), z: Number(a.z) }; }
function ready(a: Stage9Actor, rank = 1): boolean { a = actorClean(a); return !!a.actorId && a.workplaceId === TRANSPORT_WORKPLACE_ID && a.rank >= rank && a.rank <= 6 && a.onDuty && a.uniform; }
function clone(s: Stage9State): Stage9State { return { vehicles: Object.fromEntries(Object.entries(s.vehicles).map(([k,v]) => [k,{...v}])), rides: s.rides.map(r=>({...r,routeStopIds:[...r.routeStopIds]})), deliveries: s.deliveries.map(d=>({...d,stopIds:[...d.stopIds]})), actions:s.actions.map(a=>({...a})), unionTreasury:s.unionTreasury }; }
function fail(s: Stage9State, message: string): Stage9Result { return { ok:false,state:s,message }; }
function jobActive(s: Stage9State, id: string): boolean { return s.rides.some(r=>(r.passengerId===id||r.driverId===id)&&["waiting","assigned","onboard"].includes(r.status)) || s.deliveries.some(d=>d.driverId===id&&d.status==="active"); }
function owned(s: Stage9State, id: string): Stage9Vehicle | undefined { return Object.values(s.vehicles).find(v=>v.ownerId===id); }
function used(s: Stage9State, id: string): boolean { return s.actions.some(a=>a.requestId===id); }
function log(s: Stage9State, requestId: string, kind: string, a: Stage9Actor, targetId: string, detail: string, now: number, result: string): void { s.actions.push({id:"stage9-action:"+requestId,requestId,kind,actorId:clean(a.actorId,120),actorName:clean(a.actorName,80)||"Citizen",targetId:clean(targetId,180),detail:clean(detail,240),at:stamp(now),result:clean(result,120)}); s.actions=s.actions.slice(-STAGE9_ACTION_LIMIT); }
function routeBetween(from: string, to: string): string[] {
  if (from===to || !validStop(from) || !validStop(to)) return [];
  const q: string[][]=[[from]], seen=new Set([from]);
  while(q.length){const route=q.shift()!,last=route[route.length-1];if(last===to)return route;
    for(const [a,b] of edges){const n=a===last?b:b===last?a:"";if(n&&!seen.has(n)){seen.add(n);q.push([...route,n]);}}}
  return [];
}
function fareFor(type: Exclude<Stage9VehicleType,"haulage">, from: Stage9Stop, to: Stage9Stop): number {
  const rate: Record<Exclude<Stage9VehicleType,"haulage">,number>={keke:15,okada:13,taxi:19,danfo:7,bus:6};
  const base: Record<Exclude<Stage9VehicleType,"haulage">,number>={keke:300,okada:250,taxi:550,danfo:250,bus:200};
  return Math.max(base[type],Math.round((base[type]+Math.hypot(from.x-to.x,from.z-to.z)*rate[type])/50)*50);
}
function normVehicle(raw: unknown, def: typeof catalog[number]): Stage9Vehicle {
  const v=obj(raw)?raw:{}, fuel=Number(v.fuelLitres), ownerId=clean(v.ownerId,120);
  return {...def,ownerId:ownerId||null,ownerName:clean(v.ownerName,80)||null,fuelLitres:Math.round(Math.max(0,Math.min(def.tankLitres,Number.isFinite(fuel)?fuel:def.tankLitres))*100)/100,checkedOutAt:v.checkedOutAt==null?null:stamp(v.checkedOutAt)};
}
export function createStage9State(): Stage9State { const vehicles:Record<string,Stage9Vehicle>={}; for(const d of catalog)vehicles[d.id]=normVehicle(null,d); return {vehicles,rides:[],deliveries:[],actions:[],unionTreasury:0}; }
export function normalizeStage9State(raw: unknown): Stage9State {
  if(!obj(raw))return createStage9State(); const base=createStage9State(),vehicles={...base.vehicles};
  if(obj(raw.vehicles))for(const d of catalog)vehicles[d.id]=normVehicle(raw.vehicles[d.id],d);
  const rides:Stage9Ride[]=Array.isArray(raw.rides)?raw.rides.slice(-120).flatMap(v=>{
    if(!obj(v)||!rideStatuses.includes(v.status as Stage9RideStatus))return [];
    const id=clean(v.id,180),requestId=clean(v.requestId,120),passengerId=clean(v.passengerId,120),pickupStopId=clean(v.pickupStopId,80),destinationStopId=clean(v.destinationStopId,80),rawVehicleType=v.vehicleType;
    if(!id||!requestId||!passengerId||!validStop(pickupStopId)||!validStop(destinationStopId)||pickupStopId===destinationStopId||!isPassengerVehicleType(rawVehicleType))return [];\n    const vehicleType = rawVehicleType;
    const routeStopIds=Array.isArray(v.routeStopIds)?v.routeStopIds.filter((x):x is string=>typeof x==="string"&&!!validStop(x)).slice(0,20):[];
    return [{id,requestId,passengerId,passengerName:clean(v.passengerName,80)||"Passenger",pickupStopId,destinationStopId,vehicleType,driverId:clean(v.driverId,120)||null,driverName:clean(v.driverName,80)||null,vehicleId:clean(v.vehicleId,80)||null,routeStopIds,nextStopIndex:Math.max(0,Math.min(routeStopIds.length,Math.floor(Number(v.nextStopIndex)||0))),status:v.status as Stage9RideStatus,fare:amount(v.fare),driverShare:amount(v.driverShare),createdAt:stamp(v.createdAt),updatedAt:stamp(v.updatedAt),settledAt:v.settledAt==null?null:stamp(v.settledAt)}];
  }):[];
  const deliveries:Stage9Delivery[]=Array.isArray(raw.deliveries)?raw.deliveries.slice(-100).flatMap(v=>{
    if(!obj(v)||!deliveryStatuses.includes(v.status as Stage9DeliveryStatus))return [];
    const id=clean(v.id,180),requestId=clean(v.requestId,120),driverId=clean(v.driverId,120),vehicleId=clean(v.vehicleId,80),routeId=clean(v.routeId,100),stopIds=Array.isArray(v.stopIds)?v.stopIds.filter((x):x is string=>typeof x==="string"&&!!validStop(x)).slice(0,20):[];
    if(!id||!requestId||!driverId||!vehicles[vehicleId]||!stopIds.length)return [];
    return [{id,requestId,driverId,driverName:clean(v.driverName,80)||"Driver",vehicleId,routeId,stopIds,nextStopIndex:Math.max(0,Math.min(stopIds.length,Math.floor(Number(v.nextStopIndex)||0))),status:v.status as Stage9DeliveryStatus,reward:amount(v.reward),createdAt:stamp(v.createdAt),updatedAt:stamp(v.updatedAt),completedAt:v.completedAt==null?null:stamp(v.completedAt)}];
  }):[];
  const actions:Stage9Action[]=Array.isArray(raw.actions)?raw.actions.slice(-STAGE9_ACTION_LIMIT).flatMap(v=>{
    if(!obj(v))return [];const requestId=clean(v.requestId,120),id=clean(v.id,180),actorId=clean(v.actorId,120),kind=clean(v.kind,100);if(!requestId||!id||!actorId||!kind)return [];
    return [{id,requestId,kind,actorId,actorName:clean(v.actorName,80)||"Citizen",targetId:clean(v.targetId,180),detail:clean(v.detail,240),at:stamp(v.at),result:clean(v.result,120)}];
  }):[];
  return {vehicles,rides,deliveries,actions,unionTreasury:amount(raw.unionTreasury)};
}
export function stage9DistanceToStop(x:number,z:number,id:string):number { const p=validStop(id);return p?dist(x,z,p):Infinity; }

export function checkoutStage9Vehicle(s:Stage9State,i:Base&{vehicleId:string;nearDepot:boolean}):Stage9Result {
  const a=actorClean(i.actor),r=clean(i.requestId,120);
  if(r.length<4||used(s,r))return fail(s,"This transport request is missing or was already processed.");
  if(!ready(a,2))return fail(s,"Join the Transport Union, clock in, wear its uniform and reach the required rank.");
  if(!i.nearDepot||dist(a.x,a.z,STAGE9_STOPS[0])>18)return fail(s,"Company vehicles can only be checked out at the Transport Union terminal.");
  if(jobActive(s,a.actorId)||owned(s,a.actorId))return fail(s,"Finish your current assignment and return any vehicle already checked out.");
  const v=s.vehicles[clean(i.vehicleId,80)];if(!v)return fail(s,"Choose a listed company vehicle.");if(a.rank<v.minRank)return fail(s,"Your rank does not qualify for that vehicle.");if(v.ownerId)return fail(s,"That fleet vehicle is already checked out.");
  const n=clone(s),nv=n.vehicles[v.id];nv.ownerId=a.actorId;nv.ownerName=a.actorName;nv.checkedOutAt=stamp(i.now);log(n,r,"vehicle-checkout",a,v.id,v.label,i.now,"checked-out");
  return {ok:true,state:n,message:v.label+" checked out. Return it to the terminal and fuel is preserved.",vehicle:{...nv}};
}
export function returnStage9Vehicle(s:Stage9State,i:Base&{nearDepot:boolean}):Stage9Result {
  const a=actorClean(i.actor),r=clean(i.requestId,120),v=owned(s,a.actorId);
  if(r.length<4||used(s,r))return fail(s,"This return request is missing or was already processed.");if(!v)return fail(s,"You do not have a company vehicle checked out.");
  if(!i.nearDepot||dist(a.x,a.z,STAGE9_STOPS[0])>18)return fail(s,"Drive the company vehicle back to the Transport Union terminal first.");
  if(jobActive(s,a.actorId))return fail(s,"Complete or cancel your active passenger trip/delivery before returning the vehicle.");
  const n=clone(s),nv=n.vehicles[v.id];nv.ownerId=null;nv.ownerName=null;nv.checkedOutAt=null;log(n,r,"vehicle-return",a,v.id,"Returned with "+nv.fuelLitres+" L fuel.",i.now,"returned");
  return {ok:true,state:n,message:v.label+" returned. Remaining fuel has been saved.",vehicle:{...nv}};
}
export function refuelStage9Vehicle(s:Stage9State,i:Base&{litres:number;nearFuelPoint:boolean;cash:number}):Stage9Result {
  const a=actorClean(i.actor),r=clean(i.requestId,120),v=owned(s,a.actorId),litres=Math.floor(Number(i.litres));
  if(r.length<4||used(s,r))return fail(s,"This fuel request is missing or was already processed.");if(!v)return fail(s,"Check out a company vehicle first.");
  if(!i.nearFuelPoint||dist(a.x,a.z,STAGE9_STOPS[0])>18)return fail(s,"The fleet fuel point is at the Transport Union terminal.");
  if(!Number.isInteger(litres)||litres<1||litres>80||v.fuelLitres+litres>v.tankLitres)return fail(s,"Choose whole litres within the tank's remaining capacity.");
  const cost=litres*STAGE9_FUEL_PRICE;if(amount(i.cash)<cost)return fail(s,"Not enough cash to pay for that fuel.");
  const n=clone(s),nv=n.vehicles[v.id];nv.fuelLitres=Math.round((nv.fuelLitres+litres)*100)/100;log(n,r,"vehicle-refuel",a,v.id,litres+" L at ₦"+STAGE9_FUEL_PRICE+"/L",i.now,"refuelled");
  return {ok:true,state:n,message:litres+" L added. Fuel cost: ₦"+cost.toLocaleString("en-NG")+".",vehicle:{...nv},cost};
}
export function consumeStage9Fuel(s:Stage9State,vehicleId:string,ownerId:string,distanceMoved:number):{state:Stage9State;vehicle:Stage9Vehicle|null;consumed:number} {
  const v=s.vehicles[vehicleId];if(!v||v.ownerId!==ownerId||!Number.isFinite(distanceMoved)||distanceMoved<=0)return {state:s,vehicle:v?.ownerId===ownerId?v:null,consumed:0};
  const rate:Record<Stage9VehicleType,number>={okada:.012,keke:.018,taxi:.025,danfo:.04,bus:.05,haulage:.075},consumed=Math.min(v.fuelLitres,distanceMoved*rate[v.type]);
  const n=clone(s),nv=n.vehicles[vehicleId];nv.fuelLitres=Math.round(Math.max(0,nv.fuelLitres-consumed)*100)/100;return {state:n,vehicle:{...nv},consumed};
}

export function requestStage9Ride(s:Stage9State,i:Base&{pickupStopId:string;destinationStopId:string;vehicleType:unknown;passengerCash:number}):Stage9Result {
  const a=actorClean(i.actor),r=clean(i.requestId,120),from=validStop(clean(i.pickupStopId,80)),to=validStop(clean(i.destinationStopId,80)),rawType=i.vehicleType;
  if(r.length<4||used(s,r))return fail(s,"This ride request is missing or was already processed.");if(!from||!to||from.id===to.id)return fail(s,"Choose two different public transport stops.");
  if(!isPassengerVehicleType(rawType))return fail(s,"Choose a passenger vehicle, not a haulage truck.");\n  const type = rawType;
  if(dist(a.x,a.z,from)>STAGE9_STOP_RADIUS)return fail(s,"Walk to the pickup stop before requesting a ride.");
  if(jobActive(s,a.actorId))return fail(s,"You already have an active passenger request or assignment.");
  const fare=fareFor(type,from,to);if(amount(i.passengerCash)<fare)return fail(s,"You need ₦"+fare.toLocaleString("en-NG")+" cash available for that fare.");
  const route=routeBetween(from.id,to.id);if(route.length<2)return fail(s,"No validated route connects those stops.");
  const n=clone(s),ride:Stage9Ride={id:"ride-"+randomUUID(),requestId:r,passengerId:a.actorId,passengerName:a.actorName,pickupStopId:from.id,destinationStopId:to.id,vehicleType:type,driverId:null,driverName:null,vehicleId:null,routeStopIds:[],nextStopIndex:0,status:"waiting",fare,driverShare:Math.floor(fare*.8),createdAt:stamp(i.now),updatedAt:stamp(i.now),settledAt:null};
  n.rides.push(ride);n.rides=n.rides.slice(-120);log(n,r,"ride-requested",a,ride.id,from.name+" → "+to.name+" · "+type,i.now,"waiting");
  return {ok:true,state:n,message:"Ride requested. Wait at the selected stop for an available matching driver.",ride:{...ride},fare};
}
export function acceptStage9Ride(s:Stage9State,i:Base&{rideId:string}):Stage9Result {
  const a=actorClean(i.actor),r=clean(i.requestId,120),ride=s.rides.find(x=>x.id===clean(i.rideId,180)),v=owned(s,a.actorId);
  if(r.length<4||used(s,r))return fail(s,"This driver action is missing or was already processed.");if(!ready(a,3))return fail(s,"Only an on-duty, uniformed rank 3+ driver can accept passenger work.");
  if(!v||v.type==="haulage"||v.fuelLitres<=0)return fail(s,"Check out a fueled passenger vehicle first.");if(jobActive(s,a.actorId))return fail(s,"Finish the current transport assignment first.");
  if(!ride||ride.status!=="waiting")return fail(s,"That passenger request is no longer waiting.");if(ride.passengerId===a.actorId)return fail(s,"You cannot drive your own passenger request.");
  if(ride.vehicleType!==v.type)return fail(s,"This ride requires a "+ride.vehicleType+". Your current vehicle is "+v.type+".");
  const route=v.type==="taxi"||v.type==="keke"||v.type==="okada"?[ride.pickupStopId,ride.destinationStopId]:routeBetween(ride.pickupStopId,ride.destinationStopId);
  if(route.length<2)return fail(s,"No valid route is available.");const n=clone(s),updated={...n.rides.find(x=>x.id===ride.id)!,driverId:a.actorId,driverName:a.actorName,vehicleId:v.id,routeStopIds:route,nextStopIndex:0,status:"assigned" as const,updatedAt:stamp(i.now)};
  n.rides=n.rides.map(x=>x.id===ride.id?updated:x);log(n,r,"ride-accepted",a,ride.id,"Accepted with "+v.label,i.now,"assigned");return {ok:true,state:n,message:"Ride accepted. Reach the pickup and confirm boarding.",ride:updated,fare:updated.fare};
}
export function pickupStage9Ride(s:Stage9State,i:Base&{rideId:string;passengerX:number;passengerZ:number}):Stage9Result {
  const a=actorClean(i.actor),r=clean(i.requestId,120),ride=s.rides.find(x=>x.id===clean(i.rideId,180));
  if(r.length<4||used(s,r))return fail(s,"This pickup action is missing or was already processed.");if(!ready(a,3)||!ride||ride.status!=="assigned"||ride.driverId!==a.actorId)return fail(s,"Only the assigned on-duty driver can confirm pickup.");
  const v=owned(s,a.actorId),p=validStop(ride.pickupStopId);if(!v||v.id!==ride.vehicleId||v.type!==ride.vehicleType||v.fuelLitres<=0)return fail(s,"The assigned fleet vehicle must be checked out and have fuel.");
  if(!p||dist(a.x,a.z,p)>STAGE9_STOP_RADIUS||dist(i.passengerX,i.passengerZ,p)>STAGE9_STOP_RADIUS)return fail(s,"Driver and passenger must both be at the selected pickup stop.");
  const n=clone(s),updated={...n.rides.find(x=>x.id===ride.id)!,status:"onboard" as const,nextStopIndex:1,updatedAt:stamp(i.now)};
  n.rides=n.rides.map(x=>x.id===ride.id?updated:x);log(n,r,"ride-picked-up",a,ride.id,"Passenger boarded at "+p.name,i.now,"onboard");return {ok:true,state:n,message:"Passenger boarded. Follow route checkpoints to the destination.",ride:updated,fare:updated.fare};
}
export function advanceStage9Ride(s:Stage9State,i:Base&{rideId:string}):Stage9Result {
  const a=actorClean(i.actor),r=clean(i.requestId,120),ride=s.rides.find(x=>x.id===clean(i.rideId,180));
  if(r.length<4||used(s,r))return fail(s,"This route action is missing or was already processed.");if(!ready(a,3)||!ride||ride.status!=="onboard"||ride.driverId!==a.actorId)return fail(s,"Only the assigned on-duty driver may advance this trip.");
  const v=owned(s,a.actorId);if(!v||v.id!==ride.vehicleId||v.fuelLitres<=0)return fail(s,"The assigned vehicle is missing or out of fuel.");
  const id=ride.routeStopIds[ride.nextStopIndex],p=id?validStop(id):undefined;if(!p)return fail(s,"No next stop remains; complete the fare settlement at the destination.");
  if(dist(a.x,a.z,p)>STAGE9_STOP_RADIUS)return fail(s,"Route checkpoint rejected: reach "+p.name+" before confirming it.");
  const n=clone(s),updated={...n.rides.find(x=>x.id===ride.id)!,nextStopIndex:ride.nextStopIndex+1,updatedAt:stamp(i.now)};n.rides=n.rides.map(x=>x.id===ride.id?updated:x);
  log(n,r,"ride-stop",a,ride.id,"Reached "+p.name,i.now,"stop-reached");return {ok:true,state:n,message:p.id===ride.destinationStopId?"Destination reached. Settle the fare.":"Route checkpoint recorded: "+p.name+".",ride:updated};
}
export function completeStage9Ride(s:Stage9State,i:Base&{rideId:string;passengerCash:number}):Stage9Result {
  const a=actorClean(i.actor),r=clean(i.requestId,120),ride=s.rides.find(x=>x.id===clean(i.rideId,180));
  if(r.length<4||used(s,r))return fail(s,"This settlement is missing or was already processed.");if(!ready(a,3)||!ride||ride.status!=="onboard"||ride.driverId!==a.actorId)return fail(s,"Only the assigned driver can settle this active trip.");
  const v=owned(s,a.actorId),dest=validStop(ride.destinationStopId);if(!v||v.id!==ride.vehicleId||v.fuelLitres<=0)return fail(s,"The assigned vehicle must remain checked out and fueled.");
  if(ride.nextStopIndex<ride.routeStopIds.length||!dest||dist(a.x,a.z,dest)>STAGE9_STOP_RADIUS)return fail(s,"Fare settlement requires verified route progress and arrival at the destination.");
  if(amount(i.passengerCash)<ride.fare)return fail(s,"The passenger's available cash no longer covers the agreed fare.");
  const n=clone(s),updated={...n.rides.find(x=>x.id===ride.id)!,status:"completed" as const,driverShare:Math.floor(ride.fare*.8),updatedAt:stamp(i.now),settledAt:stamp(i.now)};
  n.rides=n.rides.map(x=>x.id===ride.id?updated:x);n.unionTreasury+=ride.fare-updated.driverShare;log(n,r,"ride-completed",a,ride.id,"Fare ₦"+ride.fare+"; driver ₦"+updated.driverShare+"; Union ₦"+(ride.fare-updated.driverShare),i.now,"settled");
  return {ok:true,state:n,message:"Trip completed. Driver receives 80% of fare; 20% goes to the Union.",ride:updated,fare:ride.fare,driverShare:updated.driverShare};
}
export function cancelStage9Ride(s:Stage9State,i:Base&{rideId:string}):Stage9Result {
  const a=actorClean(i.actor),r=clean(i.requestId,120),ride=s.rides.find(x=>x.id===clean(i.rideId,180));
  if(r.length<4||used(s,r))return fail(s,"This cancellation is missing or was already processed.");if(!ride||!["waiting","assigned"].includes(ride.status)||(ride.passengerId!==a.actorId&&ride.driverId!==a.actorId))return fail(s,"Only the passenger or assigned driver may cancel before boarding.");
  const n=clone(s),updated={...n.rides.find(x=>x.id===ride.id)!,status:"cancelled" as const,updatedAt:stamp(i.now)};n.rides=n.rides.map(x=>x.id===ride.id?updated:x);log(n,r,"ride-cancelled",a,ride.id,"Cancelled before boarding",i.now,"cancelled");return {ok:true,state:n,message:"Ride cancelled before boarding; no fare was charged.",ride:updated};
}
export function startStage9Delivery(s:Stage9State,i:Base&{routeId:string;nearDepot:boolean}):Stage9Result {
  const a=actorClean(i.actor),r=clean(i.requestId,120),route=STAGE9_ROUTES.find(x=>x.id===clean(i.routeId,100)&&x.vehicleType==="haulage"),v=owned(s,a.actorId);
  if(r.length<4||used(s,r))return fail(s,"This haulage request is missing or was already processed.");if(!ready(a,5))return fail(s,"Haulage requires on-duty, uniformed Transport Union rank 5+.");
  if(!v||v.type!=="haulage"||v.fuelLitres<=0)return fail(s,"Check out a fueled haulage truck first.");if(!i.nearDepot||dist(a.x,a.z,STAGE9_STOPS[0])>18)return fail(s,"Start haulage at the Transport Union terminal.");
  if(jobActive(s,a.actorId))return fail(s,"Finish your current transport task first.");if(!route)return fail(s,"Choose a valid haulage route.");
  const n=clone(s),delivery:Stage9Delivery={id:"delivery-"+randomUUID(),requestId:r,driverId:a.actorId,driverName:a.actorName,vehicleId:v.id,routeId:route.id,stopIds:[...route.stopIds],nextStopIndex:1,status:"active",reward:route.reward,createdAt:stamp(i.now),updatedAt:stamp(i.now),completedAt:null};
  n.deliveries.push(delivery);n.deliveries=n.deliveries.slice(-100);log(n,r,"delivery-started",a,delivery.id,route.name,i.now,"active");return {ok:true,state:n,message:"Haulage order accepted. Verify each checkpoint in order.",delivery};
}
export function advanceStage9Delivery(s:Stage9State,i:Base&{deliveryId:string}):Stage9Result {
  const a=actorClean(i.actor),r=clean(i.requestId,120),d=s.deliveries.find(x=>x.id===clean(i.deliveryId,180));
  if(r.length<4||used(s,r))return fail(s,"This delivery checkpoint is missing or was already processed.");if(!ready(a,5)||!d||d.status!=="active"||d.driverId!==a.actorId)return fail(s,"Only the assigned rank 5+ haulage driver may advance this delivery.");
  const v=owned(s,a.actorId);if(!v||v.id!==d.vehicleId||v.type!=="haulage"||v.fuelLitres<=0)return fail(s,"The assigned fueled haulage truck must remain checked out.");
  const id=d.stopIds[d.nextStopIndex],p=id?validStop(id):undefined;if(!p)return fail(s,"All checkpoints are complete; submit the delivery receipt.");
  if(dist(a.x,a.z,p)>STAGE9_STOP_RADIUS)return fail(s,"Delivery rejected: reach "+p.name+" before confirming the checkpoint.");
  const n=clone(s),updated={...n.deliveries.find(x=>x.id===d.id)!,nextStopIndex:d.nextStopIndex+1,updatedAt:stamp(i.now)};n.deliveries=n.deliveries.map(x=>x.id===d.id?updated:x);log(n,r,"delivery-stop",a,d.id,"Reached "+p.name,i.now,"stop-reached");
  return {ok:true,state:n,message:updated.nextStopIndex>=updated.stopIds.length?"Final destination reached. Submit the delivery receipt.":"Checkpoint recorded: "+p.name+".",delivery:updated};
}
export function completeStage9Delivery(s:Stage9State,i:Base&{deliveryId:string}):Stage9Result {
  const a=actorClean(i.actor),r=clean(i.requestId,120),d=s.deliveries.find(x=>x.id===clean(i.deliveryId,180));
  if(r.length<4||used(s,r))return fail(s,"This delivery settlement is missing or was already processed.");if(!ready(a,5)||!d||d.status!=="active"||d.driverId!==a.actorId)return fail(s,"Only the assigned rank 5+ driver can complete this delivery.");
  const v=owned(s,a.actorId),dest=validStop(d.stopIds[d.stopIds.length-1]);if(!v||v.id!==d.vehicleId||v.type!=="haulage"||v.fuelLitres<=0)return fail(s,"The assigned fueled haulage truck must remain checked out.");
  if(d.nextStopIndex<d.stopIds.length||!dest||dist(a.x,a.z,dest)>STAGE9_STOP_RADIUS)return fail(s,"Delivery payment requires every route checkpoint and arrival at the final destination.");
  const n=clone(s),updated={...n.deliveries.find(x=>x.id===d.id)!,status:"completed" as const,updatedAt:stamp(i.now),completedAt:stamp(i.now)};n.deliveries=n.deliveries.map(x=>x.id===d.id?updated:x);log(n,r,"delivery-completed",a,d.id,"Reward ₦"+d.reward,i.now,"paid");return {ok:true,state:n,message:"Delivery completed. ₦"+d.reward.toLocaleString("en-NG")+" credited.",delivery:updated,reward:d.reward};
}
