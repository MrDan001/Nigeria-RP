import { rankMultiplier } from "./world";

export const GOVERNMENT_WORKPLACE_ID = "gov-rivers";
export const TREASURY_OPENING_BALANCE = 5_000_000;
export const GOVERNMENT_BASE_DAILY_PAYROLL = 2_500;
export const GOVERNMENT_ANNOUNCEMENT_COOLDOWN_MS = 120_000;
export const GOVERNMENT_MAX_SPENDING = 1_000_000;
export const GOVERNMENT_LEDGER_LIMIT = 300;
export const GOVERNMENT_ANNOUNCEMENT_LIMIT = 50;

export type GovernmentTransaction = {
  id: string; requestId: string;
  kind: "opening-allocation" | "housing-rent" | "government-payroll" | "government-duty" | "approved-spending" | "public-safety-fine";
  direction: "credit" | "debit"; amount: number; actorId: string; actorName: string;
  memo: string; at: number; balanceAfter: number; rank?: number;
};
export type GovernmentAnnouncement = { id:string; requestId:string; authorId:string; authorName:string; rank:number; text:string; createdAt:number };
export type Stage6State = {
  treasuryBalance:number; ledger:GovernmentTransaction[]; announcements:GovernmentAnnouncement[];
  payrollDayByAccount:Record<string,string>; lastAnnouncementAt:Record<string,number>;
};
export type Stage6Result = { ok:boolean; state:Stage6State; message:string; transaction?:GovernmentTransaction; announcement?:GovernmentAnnouncement };

const kinds: GovernmentTransaction["kind"][] = ["opening-allocation","housing-rent","government-payroll","government-duty","approved-spending","public-safety-fine"];
function record(v:unknown):v is Record<string,unknown>{return !!v&&typeof v==="object"&&!Array.isArray(v);}
function txt(v:unknown,max=180){return String(v??"").replace(/[\u0000-\u001F\u007F]/g," ").replace(/\s+/g," ").trim().slice(0,max);}
function amount(v:unknown){const n=Number(v);return Number.isSafeInteger(n)&&n>=0?n:-1;}
function timestamp(v:unknown,fallback=0){const n=Number(v);return Number.isSafeInteger(n)&&n>=0?n:fallback;}
function blankState(now=Date.now()):Stage6State{return {
 treasuryBalance:TREASURY_OPENING_BALANCE,
 ledger:[{id:"opening-allocation:initial-state-budget",requestId:"initial-state-budget",kind:"opening-allocation",direction:"credit",amount:TREASURY_OPENING_BALANCE,actorId:"state-treasury",actorName:"Rivers State Treasury",memo:"Authorized opening state budget allocation",at:timestamp(now),balanceAfter:TREASURY_OPENING_BALANCE}],
 announcements:[],payrollDayByAccount:{},lastAnnouncementAt:{}
};}
export function createStage6State(now=Date.now()){return blankState(now);}
export function governmentPayrollAmount(rank:number){return Number.isInteger(rank)&&rank>=1&&rank<=6?Math.round(GOVERNMENT_BASE_DAILY_PAYROLL*rankMultiplier(rank)):0;}

export function normalizeStage6State(v:unknown):Stage6State{
 if(!record(v))return blankState();
 const bal=amount(v.treasuryBalance);if(bal<0)return blankState();
 const ledger:GovernmentTransaction[]=Array.isArray(v.ledger)?v.ledger.filter(record).slice(-GOVERNMENT_LEDGER_LIMIT).flatMap((t)=>{
  const kind=kinds.includes(t.kind as GovernmentTransaction["kind"])?t.kind as GovernmentTransaction["kind"]:null;
  const dir=t.direction==="credit"||t.direction==="debit"?t.direction:null;
  const n=amount(t.amount),after=amount(t.balanceAfter),req=txt(t.requestId,120);
  if(!kind||!dir||n<1||after<0||!req)return [];
  return [{id:txt(t.id,160)||kind+":"+req,requestId:req,kind,direction:dir,amount:n,actorId:txt(t.actorId,120)||"unknown",actorName:txt(t.actorName,80)||"Unknown actor",memo:txt(t.memo,180),at:timestamp(t.at),balanceAfter:after,...(Number.isInteger(Number(t.rank))&&Number(t.rank)>=1&&Number(t.rank)<=6?{rank:Number(t.rank)}:{})}];
 }):[];
 if(bal>0&&!ledger.length)ledger.push({id:"opening-allocation:migrated-balance",requestId:"migrated-balance",kind:"opening-allocation",direction:"credit",amount:bal,actorId:"state-treasury",actorName:"Rivers State Treasury",memo:"Treasury balance carried forward during state migration",at:0,balanceAfter:bal});
 const announcements:GovernmentAnnouncement[]=Array.isArray(v.announcements)?v.announcements.filter(record).slice(-GOVERNMENT_ANNOUNCEMENT_LIMIT).flatMap((a)=>{
  const req=txt(a.requestId,120),text=txt(a.text,240),rank=Number(a.rank);
  if(!req||!text||!Number.isInteger(rank)||rank<1||rank>6)return [];
  return [{id:txt(a.id,160)||"announcement:"+req,requestId:req,authorId:txt(a.authorId,120)||"unknown",authorName:txt(a.authorName,80)||"Government official",rank,text,createdAt:timestamp(a.createdAt)}];
 }):[];
 const payroll:Record<string,string>={},cooldowns:Record<string,number>={};
 if(record(v.payrollDayByAccount))for(const [k,x] of Object.entries(v.payrollDayByAccount).slice(-5000)){if(txt(k,120)&&txt(x,20))payroll[txt(k,120)]=txt(x,20);}
 if(record(v.lastAnnouncementAt))for(const [k,x] of Object.entries(v.lastAnnouncementAt).slice(-5000)){const t=timestamp(x,-1);if(txt(k,120)&&t>=0)cooldowns[txt(k,120)]=t;}
 return {treasuryBalance:bal,ledger,announcements,payrollDayByAccount:payroll,lastAnnouncementAt:cooldowns};
}
function append(s:Stage6State,a:{requestId:string;kind:GovernmentTransaction["kind"];direction:"credit"|"debit";amount:number;actorId:string;actorName:string;memo:string;now:number;rank?:number}):Stage6Result{
 const req=txt(a.requestId,120),n=amount(a.amount);
 if(!req)return {ok:false,state:s,message:"A transaction reference is required."};
 if(n<1)return {ok:false,state:s,message:"Enter a valid positive whole-naira amount."};
 if(s.ledger.some(t=>t.requestId===req))return {ok:false,state:s,message:"This treasury transaction has already been processed."};
 if(a.direction==="debit"&&s.treasuryBalance<n)return {ok:false,state:s,message:"The state treasury has insufficient funds for this transaction."};
 const nextBalance=a.direction==="credit"?s.treasuryBalance+n:s.treasuryBalance-n;
 if(!Number.isSafeInteger(nextBalance)||nextBalance<0)return {ok:false,state:s,message:"The treasury balance limit would be exceeded."};
 const tx:GovernmentTransaction={id:a.kind+":"+req,requestId:req,kind:a.kind,direction:a.direction,amount:n,actorId:txt(a.actorId,120)||"unknown",actorName:txt(a.actorName,80)||"Unknown actor",memo:txt(a.memo,180),at:timestamp(a.now),balanceAfter:nextBalance,...(Number.isInteger(a.rank)&&Number(a.rank)>=1&&Number(a.rank)<=6?{rank:Number(a.rank)}:{})};
 return {ok:true,state:{...s,treasuryBalance:nextBalance,ledger:[...s.ledger,tx].slice(-GOVERNMENT_LEDGER_LIMIT),announcements:[...s.announcements],payrollDayByAccount:{...s.payrollDayByAccount},lastAnnouncementAt:{...s.lastAnnouncementAt}},transaction:tx,message:"Treasury transaction recorded."};
}
export function recordHousingRent(s:Stage6State,a:{requestId:string;actorId:string;actorName:string;houseId:string;amount:number;now:number}):Stage6Result{
 return append(s,{requestId:"rent:"+txt(a.requestId,100),kind:"housing-rent",direction:"credit",amount:a.amount,actorId:a.actorId,actorName:a.actorName,memo:"Public housing rent collected: "+txt(a.houseId,80),now:a.now});
}
export function payGovernmentDuty(s:Stage6State,a:{requestId:string;actorId:string;actorName:string;rank:number;amount:number;memo:string;now:number}):Stage6Result{
 if(!Number.isInteger(a.rank)||a.rank<1||a.rank>6)return {ok:false,state:s,message:"A valid government rank is required to draw duty pay."};
 return append(s,{requestId:"duty:"+txt(a.requestId,100),kind:"government-duty",direction:"debit",amount:a.amount,actorId:a.actorId,actorName:a.actorName,rank:a.rank,memo:"Government duty payment: "+txt(a.memo,140),now:a.now});
}
export function claimGovernmentPayroll(s:Stage6State,a:{actorId:string;actorName:string;rank:number;dayKey:string;now:number}):Stage6Result{
 const id=txt(a.actorId,120),day=txt(a.dayKey,20);
 if(!id||!day)return {ok:false,state:s,message:"The account and official game date are required."};
 if(!Number.isInteger(a.rank)||a.rank<1||a.rank>6)return {ok:false,state:s,message:"A valid government rank is required for payroll."};
 if(s.payrollDayByAccount[id]===day)return {ok:false,state:s,message:"Your government payroll has already been collected for today."};
 const pay=governmentPayrollAmount(a.rank),r=append(s,{requestId:"payroll:"+id+":"+day,kind:"government-payroll",direction:"debit",amount:pay,actorId:id,actorName:a.actorName,rank:a.rank,memo:"Daily government payroll for "+day,now:a.now});
 if(!r.ok)return r;
 r.state.payrollDayByAccount[id]=day;
 return {...r,message:"Daily government payroll of ₦"+pay.toLocaleString("en-NG")+" paid."};
}
export function approveGovernmentSpending(s:Stage6State,a:{requestId:string;actorId:string;actorName:string;amount:number;memo:string;now:number}):Stage6Result{
 const memo=txt(a.memo,180),n=amount(a.amount);
 if(memo.length<3)return {ok:false,state:s,message:"Enter a clear spending purpose of at least 3 characters."};
 if(n<1||n>GOVERNMENT_MAX_SPENDING)return {ok:false,state:s,message:"Authorized spending must be between ₦1 and ₦1,000,000."};
 return append(s,{requestId:"spend:"+txt(a.requestId,100),kind:"approved-spending",direction:"debit",amount:n,actorId:a.actorId,actorName:a.actorName,rank:6,memo,now:a.now});
}
export function publishGovernmentAnnouncement(s:Stage6State,a:{requestId:string;authorId:string;authorName:string;rank:number;text:string;now:number}):Stage6Result{
 const req=txt(a.requestId,120),id=txt(a.authorId,120),raw=String(a.text??"").replace(/[\u0000-\u001F\u007F]/g," ").replace(/\s+/g," ").trim();
 if(a.rank!==2)return {ok:false,state:s,message:"Only the government public-relations rank can publish official announcements."};
 if(!req||!id)return {ok:false,state:s,message:"An announcement reference is required."};
 if(s.announcements.some(x=>x.requestId===req))return {ok:false,state:s,message:"This announcement has already been submitted."};
 if(!raw||raw.length>240)return {ok:false,state:s,message:"Write an official announcement of 1–240 characters."};
 const now=timestamp(a.now),last=s.lastAnnouncementAt[id]??0;
 if(now<last+GOVERNMENT_ANNOUNCEMENT_COOLDOWN_MS)return {ok:false,state:s,message:"Please wait "+Math.ceil((last+GOVERNMENT_ANNOUNCEMENT_COOLDOWN_MS-now)/1000)+" seconds before publishing another announcement."};
 const announcement:GovernmentAnnouncement={id:"announcement:"+req,requestId:req,authorId:id,authorName:txt(a.authorName,80)||"Government PRO",rank:2,text:raw,createdAt:now};
 return {ok:true,state:{...s,ledger:[...s.ledger],announcements:[...s.announcements,announcement].slice(-GOVERNMENT_ANNOUNCEMENT_LIMIT),payrollDayByAccount:{...s.payrollDayByAccount},lastAnnouncementAt:{...s.lastAnnouncementAt,[id]:now}},announcement,message:"Official announcement published."};
}


/** Credit a settled law-enforcement fine to the durable Rivers State treasury ledger. */
export function recordCivicFine(s: Stage6State, a: {
  requestId: string; actorId: string; actorName: string; targetId: string; targetName: string;
  amount: number; offence: string; now: number;
}): Stage6Result {
  const target = String(a.targetName ?? "").replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, 80);
  const offence = String(a.offence ?? "").replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, 80);
  if (!target || !offence) return { ok: false, state: s, message: "A target and offence are required for the fine ledger." };
  return append(s, {
    requestId: "public-safety-fine:" + String(a.requestId ?? "").slice(0, 100),
    kind: "public-safety-fine", direction: "credit", amount: a.amount,
    actorId: a.actorId, actorName: a.actorName,
    memo: "Public safety fine from " + offence + " against " + target, now: a.now,
  });
}
