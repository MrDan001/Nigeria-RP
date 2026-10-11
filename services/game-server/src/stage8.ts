export const NEWS_WORKPLACE_ID="news-main";
export const STAGE8_STORY_COOLDOWN_MS=45_000,STAGE8_REPORT_COOLDOWN_MS=20_000;
export const STAGE8_STORY_LIMIT=300,STAGE8_REPORT_LIMIT=250,STAGE8_ACTION_LIMIT=300,STAGE8_PUBLIC_FEED_LIMIT=20;
export const STAGE8_CATEGORIES=["community","public-safety","government","business","transport","weather","events"] as const;
export type Stage8Category=typeof STAGE8_CATEGORIES[number];
export type Stage8StoryStatus="submitted"|"approved"|"published"|"rejected"|"removed";
export type Stage8ReportStatus="open"|"dismissed"|"resolved";
export type Stage8ModerationDecision="remove"|"dismiss";
export type Stage8Story={id:string;requestId:string;title:string;category:Stage8Category;body:string;eventContext:string;eventRef:string|null;authorId:string;authorName:string;authorRank:number;status:Stage8StoryStatus;createdAt:number;updatedAt:number;reviewedById:string|null;reviewedByName:string|null;reviewNote:string;publishedById:string|null;publishedByName:string|null;publishedAt:number|null;removedById:string|null;removedByName:string|null;removedAt:number|null};
export type Stage8Report={id:string;requestId:string;storyId:string;storyTitle:string;reporterId:string;reporterName:string;reason:string;status:Stage8ReportStatus;createdAt:number;reviewedAt:number|null;reviewedById:string|null;reviewedByName:string|null;reviewNote:string};
export type Stage8ActionType="story-submitted"|"story-approved"|"story-rejected"|"story-published"|"story-reported"|"story-removed"|"report-dismissed";
export type Stage8Action={id:string;requestId:string;type:Stage8ActionType;actorId:string;actorName:string;targetId:string;targetName:string;reason:string;at:number;result:string};
export type Stage8State={stories:Stage8Story[];reports:Stage8Report[];actions:Stage8Action[];lastSubmitAt:Record<string,number>;lastReportAt:Record<string,number>};
export type Stage8Actor={actorId:string;actorName:string;workplaceId:string|null;rank:number;onDuty:boolean;uniform:boolean;inNewsroom:boolean;isAdmin?:boolean};
export type Stage8Result={ok:boolean;state:Stage8State;message:string;story?:Stage8Story;report?:Stage8Report};
type Base={requestId:string;actor:Stage8Actor;now:number};
type Submit=Base&{title:string;category:unknown;body:string;eventContext:string;eventRef?:string|null;validEventRefs?:readonly string[]};
type StoryInput=Base&{storyId:string;note?:string};
type ReportInput=Base&{storyId:string;reason:string};
type Moderate=Base&{reportId:string;decision:Stage8ModerationDecision;reason:string};
const storyStatuses:readonly Stage8StoryStatus[]=["submitted","approved","published","rejected","removed"];
const reportStatuses:readonly Stage8ReportStatus[]=["open","dismissed","resolved"];
const actionTypes:readonly Stage8ActionType[]=["story-submitted","story-approved","story-rejected","story-published","story-reported","story-removed","report-dismissed"];
const blocked=new Set(["fuck","fucking","fucked","shit","bullshit","bitch","bitches","bastard","asshole","motherfucker","motherfuckers","cunt","dickhead","piss","nigger","niggers","nigga","retard","retarded"]);
function obj(v:unknown):v is Record<string,unknown>{return !!v&&typeof v==="object"&&!Array.isArray(v);}
function clean(v:unknown,max=500):string{return String(v??"").replace(/<[^>]*>/g," ").replace(/[\u0000-\u001F\u007F]/g," ").replace(/\s+/g," ").trim().slice(0,max);}
function stamp(v:unknown,fallback=0):number{const n=Number(v);return Number.isSafeInteger(n)&&n>=0?n:fallback;}
function numberMap(v:unknown):Record<string,number>{const out:Record<string,number>={};if(obj(v))for(const [k,x]of Object.entries(v)){const n=stamp(x,-1);if(k&&k.length<=160&&n>=0)out[k]=n;}return out;}
function isCategory(v:unknown):v is Stage8Category{return STAGE8_CATEGORIES.includes(v as Stage8Category);}
function hasProfanity(v:string):boolean{return (v.toLowerCase().match(/[a-z0-9']+/g)||[]).some(raw=>{const w=raw.replace(/(.)\1{2,}/g,"$1$1");return [...blocked].some(b=>w===b||(w.startsWith(b)&&w.length<=b.length+4));});}
function clone(s:Stage8State):Stage8State{return {stories:s.stories.map(x=>({...x})),reports:s.reports.map(x=>({...x})),actions:s.actions.map(x=>({...x})),lastSubmitAt:{...s.lastSubmitAt},lastReportAt:{...s.lastReportAt}};}
function request(v:unknown):string{return clean(v,120);}
function used(s:Stage8State,r:string):boolean{return s.actions.some(a=>a.requestId===r);}
function ready(a:Stage8Actor,min:number):boolean{return a.workplaceId===NEWS_WORKPLACE_ID&&Number.isInteger(a.rank)&&a.rank>=min&&a.rank<=6&&a.onDuty&&a.uniform&&a.inNewsroom;}
function fail(state:Stage8State,message:string):Stage8Result{return {ok:false,state,message};}
function log(s:Stage8State,r:string,type:Stage8ActionType,a:Stage8Actor,targetId:string,targetName:string,reason:string,at:number,result:string):void{
 s.actions.push({id:"news-action:"+r,requestId:r,type,actorId:clean(a.actorId,120),actorName:clean(a.actorName,80)||"Citizen",targetId:clean(targetId,160),targetName:clean(targetName,120),reason:clean(reason,260),at:stamp(at),result:clean(result,120)});s.actions=s.actions.slice(-STAGE8_ACTION_LIMIT);
}
function cleanStory(v:unknown):Stage8Story|null{
 if(!obj(v))return null;const status=storyStatuses.includes(v.status as Stage8StoryStatus)?v.status as Stage8StoryStatus:null,cat=isCategory(v.category)?v.category:null;
 const id=clean(v.id,160),requestId=clean(v.requestId,120),title=clean(v.title,120),body=clean(v.body,1600),eventContext=clean(v.eventContext,220),authorId=clean(v.authorId,120);
 if(!status||!cat||!id||!requestId||!title||!body||!eventContext||!authorId)return null;
 const pub=v.publishedAt==null?null:stamp(v.publishedAt,-1),removed=v.removedAt==null?null:stamp(v.removedAt,-1);
 return {id,requestId,title,category:cat,body,eventContext,eventRef:clean(v.eventRef,180)||null,authorId,authorName:clean(v.authorName,80)||"Reporter",authorRank:Math.min(6,Math.max(1,Math.floor(Number(v.authorRank)||1))),status,createdAt:stamp(v.createdAt),updatedAt:stamp(v.updatedAt),reviewedById:clean(v.reviewedById,120)||null,reviewedByName:clean(v.reviewedByName,80)||null,reviewNote:clean(v.reviewNote,260),publishedById:clean(v.publishedById,120)||null,publishedByName:clean(v.publishedByName,80)||null,publishedAt:pub!==null&&pub>=0?pub:null,removedById:clean(v.removedById,120)||null,removedByName:clean(v.removedByName,80)||null,removedAt:removed!==null&&removed>=0?removed:null};
}
function cleanReport(v:unknown):Stage8Report|null{
 if(!obj(v))return null;const status=reportStatuses.includes(v.status as Stage8ReportStatus)?v.status as Stage8ReportStatus:null;
 const id=clean(v.id,160),requestId=clean(v.requestId,120),storyId=clean(v.storyId,160),reporterId=clean(v.reporterId,120),reason=clean(v.reason,260);
 if(!status||!id||!requestId||!storyId||!reporterId||!reason)return null;const reviewed=v.reviewedAt==null?null:stamp(v.reviewedAt,-1);
 return {id,requestId,storyId,storyTitle:clean(v.storyTitle,120),reporterId,reporterName:clean(v.reporterName,80)||"Citizen",reason,status,createdAt:stamp(v.createdAt),reviewedAt:reviewed!==null&&reviewed>=0?reviewed:null,reviewedById:clean(v.reviewedById,120)||null,reviewedByName:clean(v.reviewedByName,80)||null,reviewNote:clean(v.reviewNote,260)};
}
export function createStage8State():Stage8State{return {stories:[],reports:[],actions:[],lastSubmitAt:{},lastReportAt:{}};}
export function normalizeStage8State(v:unknown):Stage8State{
 if(!obj(v))return createStage8State();
 const stories=Array.isArray(v.stories)?v.stories.slice(-STAGE8_STORY_LIMIT).flatMap(x=>{const s=cleanStory(x);return s?[s]:[]}):[];
 const reports=Array.isArray(v.reports)?v.reports.slice(-STAGE8_REPORT_LIMIT).flatMap(x=>{const r=cleanReport(x);return r?[r]:[]}):[];
 const actions=Array.isArray(v.actions)?v.actions.slice(-STAGE8_ACTION_LIMIT).flatMap(x=>{if(!obj(x)||!actionTypes.includes(x.type as Stage8ActionType))return [];const r=clean(x.requestId,120),id=clean(x.id,160),actorId=clean(x.actorId,120);if(!r||!id||!actorId)return [];return [{id,requestId:r,type:x.type as Stage8ActionType,actorId,actorName:clean(x.actorName,80)||"Citizen",targetId:clean(x.targetId,160),targetName:clean(x.targetName,120),reason:clean(x.reason,260),at:stamp(x.at),result:clean(x.result,120)}];}):[];
 return {stories,reports,actions,lastSubmitAt:numberMap(v.lastSubmitAt),lastReportAt:numberMap(v.lastReportAt)};
}
export function stage8PublicFeed(s:Stage8State,limit=STAGE8_PUBLIC_FEED_LIMIT):Stage8Story[]{const cap=Math.max(1,Math.min(STAGE8_PUBLIC_FEED_LIMIT,Math.floor(Number(limit)||STAGE8_PUBLIC_FEED_LIMIT)));return s.stories.filter(x=>x.status==="published"&&x.publishedAt!==null).sort((a,b)=>Number(b.publishedAt)-Number(a.publishedAt)).slice(0,cap).map(x=>({...x}));}
export function submitStage8Story(s:Stage8State,i:Submit):Stage8Result{
 const r=request(i.requestId),a=i.actor;if(r.length<4||!clean(a.actorId,120))return fail(s,"A valid request and signed-in reporter are required.");if(used(s,r))return fail(s,"This request has already been processed.");if(!ready(a,3))return fail(s,"Only an on-duty, uniformed Reporter or senior newsroom employee inside the newsroom can file a story.");
 const now=stamp(i.now);if(now-(s.lastSubmitAt[a.actorId]??0)<STAGE8_STORY_COOLDOWN_MS)return fail(s,"Please wait before filing another news story.");
 const title=clean(i.title,120),body=clean(i.body,1600),context=clean(i.eventContext,220),eventRef=clean(i.eventRef,180);
 if(title.length<8)return fail(s,"The headline must be at least 8 characters.");if(!isCategory(i.category))return fail(s,"Choose a valid news category.");if(body.length<50)return fail(s,"The story must contain at least 50 characters.");if(context.length<5)return fail(s,"Add the in-world event or location that the story is about.");if(hasProfanity(title+" "+body+" "+context))return fail(s,"Please remove profanity or abusive language before submitting.");
 if(eventRef&&eventRef!=="local"&&!(i.validEventRefs??[]).includes(eventRef))return fail(s,"That linked in-world event is no longer available. Refresh and try again.");
 const n=clone(s),story:Stage8Story={id:"news-"+now+"-"+(n.stories.length+1),requestId:r,title,category:i.category,body,eventContext:context,eventRef:eventRef&&eventRef!=="local"?eventRef:null,authorId:clean(a.actorId,120),authorName:clean(a.actorName,80)||"Reporter",authorRank:a.rank,status:"submitted",createdAt:now,updatedAt:now,reviewedById:null,reviewedByName:null,reviewNote:"",publishedById:null,publishedByName:null,publishedAt:null,removedById:null,removedByName:null,removedAt:null};
 n.stories.push(story);n.stories=n.stories.slice(-STAGE8_STORY_LIMIT);n.lastSubmitAt[a.actorId]=now;log(n,r,"story-submitted",a,story.id,story.title,context,now,"submitted");return {ok:true,state:n,message:"Story submitted to the editor's queue. It is not public until reviewed and broadcast.",story};
}
export function approveStage8Story(s:Stage8State,i:StoryInput):Stage8Result{
 const r=request(i.requestId),a=i.actor;if(!r||used(s,r))return fail(s,"This request is invalid or has already been processed.");if(!ready(a,5))return fail(s,"Only an on-duty, uniformed Editor or Editor-in-Chief inside the newsroom can approve stories.");
 const story=s.stories.find(x=>x.id===clean(i.storyId,160));if(!story||story.status!=="submitted")return fail(s,"Only a submitted story can be approved.");if(story.authorId===a.actorId)return fail(s,"Editors cannot approve their own story.");
 const n=clone(s),at=stamp(i.now),updated={...story,status:"approved" as const,updatedAt:at,reviewedById:a.actorId,reviewedByName:clean(a.actorName,80),reviewNote:clean(i.note,260)};n.stories=n.stories.map(x=>x.id===story.id?updated:x);log(n,r,"story-approved",a,story.id,story.title,i.note??"",at,"approved");return {ok:true,state:n,message:"Editor approval recorded. An Anchor or senior newsroom member may now broadcast the story.",story:updated};
}
export function rejectStage8Story(s:Stage8State,i:StoryInput):Stage8Result{
 const r=request(i.requestId),a=i.actor,note=clean(i.note,260);if(!r||used(s,r))return fail(s,"This request is invalid or has already been processed.");if(!ready(a,5))return fail(s,"Only an on-duty, uniformed Editor or Editor-in-Chief inside the newsroom can reject stories.");
 const story=s.stories.find(x=>x.id===clean(i.storyId,160));if(!story||story.status!=="submitted")return fail(s,"Only a submitted story can be rejected.");if(story.authorId===a.actorId)return fail(s,"Editors cannot reject their own story.");if(note.length<8)return fail(s,"Record a moderation reason of at least 8 characters.");
 const n=clone(s),at=stamp(i.now),updated={...story,status:"rejected" as const,updatedAt:at,reviewedById:a.actorId,reviewedByName:clean(a.actorName,80),reviewNote:note};n.stories=n.stories.map(x=>x.id===story.id?updated:x);log(n,r,"story-rejected",a,story.id,story.title,note,at,"rejected");return {ok:true,state:n,message:"Story rejected and kept out of the public feed.",story:updated};
}
export function publishStage8Story(s:Stage8State,i:StoryInput):Stage8Result{
 const r=request(i.requestId),a=i.actor;if(!r||used(s,r))return fail(s,"This request is invalid or has already been processed.");if(!ready(a,4))return fail(s,"Only an on-duty, uniformed Anchor or senior newsroom employee inside the newsroom can broadcast stories.");
 const story=s.stories.find(x=>x.id===clean(i.storyId,160));if(!story||story.status!=="approved")return fail(s,"Only an editor-approved story can be broadcast.");
 const n=clone(s),at=stamp(i.now),updated={...story,status:"published" as const,updatedAt:at,publishedById:a.actorId,publishedByName:clean(a.actorName,80),publishedAt:at};n.stories=n.stories.map(x=>x.id===story.id?updated:x);log(n,r,"story-published",a,story.id,story.title,i.note??"",at,"published");return {ok:true,state:n,message:"Story broadcast to the public news feed and live ticker.",story:updated};
}
export function reportStage8Story(s:Stage8State,i:ReportInput):Stage8Result{
 const r=request(i.requestId),a=i.actor,reason=clean(i.reason,260);if(r.length<4||used(s,r))return fail(s,"This request is invalid or has already been processed.");const story=s.stories.find(x=>x.id===clean(i.storyId,160));if(!story||story.status!=="published")return fail(s,"Only a currently published story can be reported.");if(story.authorId===a.actorId)return fail(s,"You cannot report your own story.");if(reason.length<8)return fail(s,"Please explain the concern in at least 8 characters.");
 if((s.lastReportAt[a.actorId]??0)>0&&stamp(i.now)-s.lastReportAt[a.actorId]<STAGE8_REPORT_COOLDOWN_MS)return fail(s,"Please wait before submitting another content report.");if(s.reports.some(x=>x.storyId===story.id&&x.reporterId===a.actorId))return fail(s,"You have already reported this story.");
 const n=clone(s),at=stamp(i.now),report:Stage8Report={id:"news-report:"+r,requestId:r,storyId:story.id,storyTitle:story.title,reporterId:clean(a.actorId,120),reporterName:clean(a.actorName,80)||"Citizen",reason,status:"open",createdAt:at,reviewedAt:null,reviewedById:null,reviewedByName:null,reviewNote:""};n.reports.push(report);n.reports=n.reports.slice(-STAGE8_REPORT_LIMIT);n.lastReportAt[a.actorId]=at;log(n,r,"story-reported",a,story.id,story.title,reason,at,"open");return {ok:true,state:n,message:"Report sent to the newsroom moderation queue.",report};
}
export function moderateStage8Report(s:Stage8State,i:Moderate):Stage8Result{
 const r=request(i.requestId),a=i.actor,reason=clean(i.reason,260);if(!r||used(s,r))return fail(s,"This request is invalid or has already been processed.");if(!(a.isAdmin===true||ready(a,5)))return fail(s,"Only an Editor, Editor-in-Chief or protected administrator can review reports.");if(i.decision!=="remove"&&i.decision!=="dismiss")return fail(s,"Choose a valid moderation decision.");if(reason.length<8)return fail(s,"Record the moderation decision and reason in at least 8 characters.");
 const report=s.reports.find(x=>x.id===clean(i.reportId,160));if(!report||report.status!=="open")return fail(s,"This content report is no longer open.");const story=s.stories.find(x=>x.id===report.storyId);if(!story)return fail(s,"The reported story could not be found.");if(i.decision==="remove"&&story.status!=="published")return fail(s,"Only a currently published story can be removed from the public feed.");
 const n=clone(s),at=stamp(i.now),updatedReport={...report,status:(i.decision==="remove"?"resolved":"dismissed") as Stage8ReportStatus,reviewedAt:at,reviewedById:clean(a.actorId,120),reviewedByName:clean(a.actorName,80),reviewNote:reason};n.reports=n.reports.map(x=>x.id===report.id?updatedReport:x);
 if(i.decision==="remove"){const removed={...story,status:"removed" as const,updatedAt:at,removedById:clean(a.actorId,120),removedByName:clean(a.actorName,80),removedAt:at};n.stories=n.stories.map(x=>x.id===story.id?removed:x);n.reports=n.reports.map(x=>x.storyId===story.id&&x.status==="open"?{...x,status:"resolved" as const,reviewedAt:at,reviewedById:clean(a.actorId,120),reviewedByName:clean(a.actorName,80),reviewNote:"Story removed from public feed."}:x);log(n,r,"story-removed",a,story.id,story.title,reason,at,"removed");return {ok:true,state:n,message:"Published story removed from the ticker and public feed. The moderation action is logged.",story:removed,report:updatedReport};}
 log(n,r,"report-dismissed",a,story.id,story.title,reason,at,"dismissed");return {ok:true,state:n,message:"Report reviewed and dismissed. The published story remains available.",story,report:updatedReport};
}
