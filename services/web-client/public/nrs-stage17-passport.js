(function () {
 "use strict";
 const N=window.NRS=window.NRS||{};
 let hubButton,modal,cityValue,progressValue,rewardValue,cityList,newsList;
 let latestFeed=Array.isArray(N.stage8State?.feed)?N.stage8State.feed:[];
 const fallbackCities=[
  {id:"port-harcourt",name:"Port Harcourt"},{id:"aba",name:"Aba"},{id:"owerri",name:"Owerri"},
  {id:"uyo",name:"Uyo"},{id:"warri",name:"Warri"},{id:"yenagoa",name:"Yenagoa"},{id:"benin-city",name:"Benin City"}
 ];
 const el=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n;};
 function currentCity(){
  const travel=N.stage15TravelState||{},state=N.stage17Passport||travel.stage17Passport||{};
  const id=String(travel.cityId||N.cityId||state.currentCityId||"port-harcourt");
  const cities=Array.isArray(travel.cities)&&travel.cities.length?travel.cities:fallbackCities;
  return {id,name:travel.currentCity?.name||cities.find(c=>c.id===id)?.name||fallbackCities.find(c=>c.id===id)?.name||"Port Harcourt",cities};
 }
 function render(passport){
  if(passport)N.stage17Passport=passport;
  if(!modal||!cityList||!newsList)return;
  const travel=N.stage15TravelState||{},state=passport||N.stage17Passport||travel.stage17Passport||{};
  const city=currentCity(),stamps=Array.isArray(state.stamps)?state.stamps:[];
  const visited=new Map(stamps.map(stamp=>[stamp.cityId,stamp]));
  const count=Math.max(0,Number(state.visitedCount??visited.size)||0);
  const total=Math.max(1,Number(state.totalCities)||city.cities.length||7);
  cityValue.textContent=city.name+" · "+city.id.replace(/-/g," ").toUpperCase();
  progressValue.textContent=count+" of "+total+" cities collected";
  rewardValue.textContent="₦"+Math.max(0,Number(state.totalRewardsNaira)||0).toLocaleString("en-NG");
  cityList.replaceChildren();
  for(const target of city.cities){
   const stamp=visited.get(target.id),item=el("li","cnh-city"+(stamp?" visited":"")),detail=el("span");
   detail.append(el("strong","",target.name));
   const desc=stamp?(target.id===city.id?"You are here · stamp collected":"City stamp collected")+(Number(stamp.rewardNaira)>0?" · +₦"+Number(stamp.rewardNaira).toLocaleString("en-NG"):" · Starting stamp"):"Not yet discovered · ₦1,500 on first arrival";
   detail.append(el("small","",desc));item.append(detail,el("span","cnh-badge",stamp?"✓ COLLECTED":"LOCKED"));cityList.appendChild(item);
  }
  const feed=(Array.isArray(N.stage8State?.feed)?N.stage8State.feed:latestFeed).filter(s=>s&&s.status==="published");
  newsList.replaceChildren();
  if(!feed.length){newsList.append(el("p","cnh-empty","No official news broadcasts yet. New updates will appear here when newsroom staff publish them."));return;}
  for(const story of feed.slice(0,3)){
   const item=el("article","cnh-news-item"),heading=el("span","cnh-news-category",String(story.category||"local news").replace(/-/g," ").toUpperCase());
   item.append(heading,el("strong","cnh-news-title",story.title||"Local news update"),el("p","cnh-news-copy",story.body||""));
   item.addEventListener("click",()=>{modal.hidden=true;N.openStage8Feed?.();});
   item.tabIndex=0;item.setAttribute("role","button");item.setAttribute("aria-label","Read news: "+String(story.title||"Local news update"));
   item.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();item.click();}});
   newsList.appendChild(item);
  }
 }
 function mount(){
  if(hubButton)return;
  const style=el("style");
  style.textContent=[
   "#nrsCityNewsHubModal[hidden]{display:none!important}",
   "#nrsCityNewsHubModal{position:fixed;inset:0;z-index:99990;display:grid;place-items:center;padding:12px;box-sizing:border-box;background:rgba(1,7,14,.86);backdrop-filter:blur(12px);color:#f4f8ff;font:14px/1.45 system-ui,sans-serif}",
   "#nrsCityNewsHubModal .cnh-card{width:min(500px,100%);max-height:min(88vh,760px);overflow:auto;box-sizing:border-box;padding:18px;border:1px solid rgba(130,203,255,.26);border-radius:21px;background:linear-gradient(145deg,rgba(13,28,43,.99),rgba(5,15,26,.99));box-shadow:0 24px 70px rgba(0,0,0,.52)}",
   "#nrsCityNewsHubModal .cnh-kicker{margin:0 0 5px;color:#8be5cd;font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}",
   "#nrsCityNewsHubModal h2{margin:0 0 6px;font-size:23px;line-height:1.15}",
   "#nrsCityNewsHubModal .cnh-intro{margin:0 0 14px;color:#afc3d7;font-size:12px}",
   "#nrsCityNewsHubModal .cnh-current{display:grid;gap:4px;margin:0 0 12px;padding:12px;border:1px solid rgba(139,229,205,.26);border-radius:13px;background:rgba(139,229,205,.07)}",
   "#nrsCityNewsHubModal .cnh-label{color:#9db7ca;font-size:9px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}",
   "#nrsCityNewsHubModal .cnh-current strong{font-size:17px;overflow-wrap:anywhere}",
   "#nrsCityNewsHubModal .cnh-stat{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 0 12px;padding:10px 11px;border:1px solid rgba(255,255,255,.09);border-radius:11px;background:rgba(255,255,255,.035);font-size:11px;color:#c4d4e4}",
   "#nrsCityNewsHubModal .cnh-stat strong{color:#8be5cd;font-size:13px}",
   "#nrsCityNewsHubModal h3{margin:16px 0 7px;font-size:14px}",
   "#nrsCityNewsHubModal .cnh-cities{display:grid;gap:6px;margin:8px 0 12px;padding:0;list-style:none}",
   "#nrsCityNewsHubModal .cnh-city{display:flex;align-items:center;justify-content:space-between;gap:9px;padding:9px 10px;border:1px solid rgba(255,255,255,.09);border-radius:10px;background:rgba(255,255,255,.035);min-width:0}",
   "#nrsCityNewsHubModal .cnh-city>span:first-child{min-width:0;overflow-wrap:anywhere}",
   "#nrsCityNewsHubModal .cnh-city strong{display:block;font-size:12px}",
   "#nrsCityNewsHubModal .cnh-city small{display:block;margin-top:2px;color:#a9c0d2;font-size:10px;line-height:1.35}",
   "#nrsCityNewsHubModal .cnh-badge{flex:0 0 auto;padding:4px 6px;border-radius:7px;background:rgba(255,255,255,.08);font-size:9px;font-weight:900;color:#c6d7e4}",
   "#nrsCityNewsHubModal .cnh-city.visited{border-color:rgba(139,229,205,.23);background:rgba(139,229,205,.05)}",
   "#nrsCityNewsHubModal .cnh-city.visited .cnh-badge{background:rgba(139,229,205,.13);color:#8be5cd}",
   "#nrsCityNewsHubModal .cnh-news-list{display:grid;gap:7px}",
   "#nrsCityNewsHubModal .cnh-news-item{display:grid;gap:4px;padding:11px;border:1px solid rgba(255,255,255,.1);border-radius:11px;background:rgba(255,255,255,.035);cursor:pointer;min-width:0}",
   "#nrsCityNewsHubModal .cnh-news-category{font-size:9px;font-weight:900;letter-spacing:.08em;color:#8be5cd}",
   "#nrsCityNewsHubModal .cnh-news-title{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;overflow-wrap:anywhere;font-size:12px;line-height:1.3}",
   "#nrsCityNewsHubModal .cnh-news-copy{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;overflow-wrap:anywhere;margin:0;color:#aec2d4;font-size:11px;line-height:1.35}",
   "#nrsCityNewsHubModal .cnh-empty{margin:0;padding:10px;border:1px dashed rgba(255,255,255,.16);border-radius:10px;color:#a9c0d2;font-size:12px}",
   "#nrsCityNewsHubModal .cnh-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px}",
   "#nrsCityNewsHubModal .cnh-actions button{min-height:42px;padding:10px;border:1px solid #2f5f82;border-radius:10px;background:linear-gradient(135deg,#158acb,#145a94);color:#fff;font:800 12px system-ui,sans-serif;cursor:pointer}",
   "#nrsCityNewsHubModal .cnh-actions .cnh-close{border-color:#33465d;background:#17283b}",
   "@media(max-width:420px){#nrsCityNewsHubModal .cnh-card{padding:14px}#nrsCityNewsHubModal h2{font-size:21px}#nrsCityNewsHubModal .cnh-actions{grid-template-columns:1fr}}"
  ].join("\n");
  document.head.appendChild(style);
  hubButton=el("button","","🏙️ City & News Hub");hubButton.id="nrsCityNewsHubOpen";hubButton.type="button";hubButton.hidden=true;
  hubButton.setAttribute("aria-label","Open City and News Hub");
  hubButton.addEventListener("click",()=>{render(N.stage17Passport||N.stage15TravelState?.stage17Passport||null);modal.hidden=false;document.getElementById("gp")&&(document.getElementById("gp").style.display="none");N.getStage15TravelState?.();N.getStage8State?.();});
  const gearMenu=document.getElementById("gp");if(gearMenu)gearMenu.appendChild(hubButton);else document.body.appendChild(hubButton);
  modal=el("div");modal.id="nrsCityNewsHubModal";modal.hidden=true;modal.setAttribute("role","dialog");modal.setAttribute("aria-modal","true");modal.setAttribute("aria-label","City and News Hub");
  const card=el("section","cnh-card");
  card.append(el("p","cnh-kicker","City services · official news"),el("h2","","City & News Hub"),el("p","cnh-intro","Your current city, discovery passport and official Rivers News Network broadcasts in one place."));
  const current=el("div","cnh-current");current.append(el("span","cnh-label","CURRENT CITY"),cityValue=el("strong","","Port Harcourt"));
  const stat=el("div","cnh-stat");stat.append(el("span","","City discovery progress"),progressValue=el("strong","","1 of 7 cities collected"));
  const rewards=el("div","cnh-stat");rewards.append(el("span","","Discovery rewards earned"),rewardValue=el("strong","","₦0"));
  card.append(current,stat,rewards,el("h3","","City Explorer Passport"),cityList=el("ul","cnh-cities"),el("h3","","Latest official news"),newsList=el("div","cnh-news-list"));
  const actions=el("div","cnh-actions"),newsButton=el("button","","Open full news feed"),close=el("button","cnh-close","Back to the city");
  newsButton.type="button";close.type="button";newsButton.addEventListener("click",()=>{modal.hidden=true;if(N.openStage8Feed)N.openStage8Feed();else window.dispatchEvent(new Event("nrs-open-stage8-feed"));});
  close.addEventListener("click",()=>{modal.hidden=true;});
  actions.append(newsButton,close);card.appendChild(actions);modal.appendChild(card);document.body.appendChild(modal);
  modal.addEventListener("click",event=>{if(event.target===modal)modal.hidden=true;});
  window.addEventListener("keydown",event=>{if(event.key==="Escape"&&modal&&!modal.hidden)modal.hidden=true;});
  window.addEventListener("nrs-stage15-travel-state",event=>render(event.detail?.stage17Passport||N.stage17Passport||null));
  window.addEventListener("nrs-stage15-travel-result",event=>render(event.detail?.stage17Passport||N.stage17Passport||null));
  window.addEventListener("nrs-city-changed",()=>render(N.stage17Passport||N.stage15TravelState?.stage17Passport||null));
  window.addEventListener("nrs-stage8-state",event=>{latestFeed=Array.isArray(event.detail?.feed)?event.detail.feed:latestFeed;render();});
  window.addEventListener("nrs-stage15-passport",event=>render(event.detail||null));
  window.setInterval(()=>{if(hubButton)hubButton.hidden=!(N.session?.authed&&N.session?.open);},1000);
  render(N.stage17Passport||N.stage15TravelState?.stage17Passport||null);
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});else mount();
})();