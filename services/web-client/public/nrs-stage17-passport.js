(function () {
 "use strict";
 const N=window.NRS=window.NRS||{}; let button,modal,summary,list,rewardText;
 const el=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n;};
 function render(passport){
  if(!button||!list)return;
  if(passport)N.stage17Passport=passport;
  const state=passport||N.stage17Passport||N.stage15TravelState?.stage17Passport||null;
  const cities=N.stage15TravelState?.cities||[], stamps=state?.stamps||[];
  const visited=new Map(stamps.map(stamp=>[stamp.cityId,stamp]));
  const count=Number(state?.visitedCount??visited.size)||0,total=Math.max(1,Number(state?.totalCities)||cities.length||7);
  button.textContent="🧭 City Passport · "+count+"/"+total;button.hidden=!(N.session?.authed&&N.session?.open);
  const currentName=cities.find(city=>city.id===state?.currentCityId)?.name||"Port Harcourt";
  summary.textContent=count+" of "+total+" cities collected · Current city: "+currentName;
  rewardText.textContent="₦"+Math.max(0,Number(state?.totalRewardsNaira)||0).toLocaleString("en-NG");list.replaceChildren();
  for(const city of cities){
   const stamp=visited.get(city.id),item=el("li","s17-city"+(stamp?" visited":"")),detail=el("span");
   detail.append(el("strong","",city.name));
   const desc=stamp?(city.id===state?.currentCityId?"You are here · stamp collected":"City stamp collected")+(Number(stamp.rewardNaira)>0?" · +₦"+Number(stamp.rewardNaira).toLocaleString("en-NG"):" · Starting stamp"):"Not yet discovered · ₦1,500 on first arrival";
   detail.append(el("small","",desc));item.append(detail,el("span","s17-badge",stamp?"✓ COLLECTED":"LOCKED"));list.appendChild(item);
  }
 }
 function mount(){
  if(button)return;
  const style=el("style");style.textContent=[
   "#nrsStage17Passport[hidden],#nrsStage17PassportModal[hidden]{display:none!important}",
   "#nrsStage17Passport{position:fixed;top:calc(env(safe-area-inset-top,0px) + 104px);left:12px;z-index:8500;max-width:calc(100vw - 24px);padding:10px 13px;border:1px solid rgba(139,229,205,.35);border-radius:13px;background:linear-gradient(135deg,#154b47,#102b3b);color:#fff;font:800 12px system-ui,sans-serif;box-shadow:0 10px 28px rgba(0,0,0,.38);touch-action:manipulation}",
   "#nrsStage17PassportModal{position:fixed;inset:0;z-index:96010;display:grid;place-items:center;padding:14px;box-sizing:border-box;background:rgba(1,7,14,.84);backdrop-filter:blur(10px);color:#f4f8ff;font:14px/1.45 system-ui,sans-serif}",
   "#nrsStage17PassportModal .s17-card{width:min(440px,100%);max-height:min(84vh,740px);overflow:auto;box-sizing:border-box;padding:20px;border:1px solid rgba(130,203,255,.26);border-radius:22px;background:linear-gradient(145deg,rgba(13,28,43,.99),rgba(5,15,26,.99));box-shadow:0 24px 70px rgba(0,0,0,.5)}",
   "#nrsStage17PassportModal .s17-kicker{margin:0 0 6px;color:#8be5cd;font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}",
   "#nrsStage17PassportModal h2{margin:0 0 5px;font-size:23px;line-height:1.15}",
   "#nrsStage17PassportModal .s17-summary{margin:0 0 14px;color:#c6d7e4;font-size:12px}",
   "#nrsStage17PassportModal .s17-rewards{display:flex;justify-content:space-between;gap:10px;margin:12px 0;padding:12px;border:1px solid rgba(139,229,205,.2);border-radius:12px;background:rgba(139,229,205,.07)}",
   "#nrsStage17PassportModal .s17-rewards strong{color:#8be5cd}",
   "#nrsStage17PassportModal .s17-cities{display:grid;gap:7px;margin:12px 0;padding:0;list-style:none}",
   "#nrsStage17PassportModal .s17-city{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 11px;border:1px solid rgba(255,255,255,.09);border-radius:11px;background:rgba(255,255,255,.035)}",
   "#nrsStage17PassportModal .s17-city strong{display:block;font-size:13px}",
   "#nrsStage17PassportModal .s17-city small{display:block;margin-top:2px;color:#a9c0d2;font-size:11px}",
   "#nrsStage17PassportModal .s17-badge{flex:0 0 auto;padding:5px 7px;border-radius:8px;background:rgba(255,255,255,.08);font-size:10px;font-weight:800;color:#c6d7e4}",
   "#nrsStage17PassportModal .s17-city.visited{border-color:rgba(139,229,205,.22);background:rgba(139,229,205,.05)}",
   "#nrsStage17PassportModal .s17-city.visited .s17-badge{background:rgba(139,229,205,.13);color:#8be5cd}",
   "#nrsStage17PassportModal .s17-close{display:block;width:100%;min-height:44px;margin-top:16px;border:0;border-radius:11px;background:linear-gradient(135deg,#158acb,#145a94);color:#fff;font:800 14px system-ui,sans-serif}",
   "@media(max-width:420px){#nrsStage17PassportModal .s17-card{padding:16px}#nrsStage17PassportModal h2{font-size:21px}}"
  ].join("\n");document.head.appendChild(style);
  button=el("button");button.id="nrsStage17Passport";button.type="button";button.hidden=true;button.textContent="🧭 City Passport · 1/7";document.body.appendChild(button);
  modal=el("div");modal.id="nrsStage17PassportModal";modal.hidden=true;modal.setAttribute("role","dialog");modal.setAttribute("aria-modal","true");modal.setAttribute("aria-label","City Explorer Passport");
  const card=el("section","s17-card");card.append(el("p","s17-kicker","Stage 17 · Regional explorer"),el("h2","","City Explorer Passport"));
  summary=el("p","s17-summary","");const rewards=el("div","s17-rewards");rewards.append(el("span","","Discovery rewards earned"));rewardText=el("strong","","₦0");rewards.appendChild(rewardText);
  list=el("ul","s17-cities");const note=el("p","s17-summary","Arrive in a new city to collect its stamp and a one-time ₦1,500 discovery reward. Returning to a stamped city does not pay again.");
  const close=el("button","s17-close","Back to the city");close.type="button";close.addEventListener("click",()=>{modal.hidden=true;});
  card.append(summary,rewards,list,note,close);modal.appendChild(card);document.body.appendChild(modal);
  button.addEventListener("click",()=>{render(N.stage17Passport||N.stage15TravelState?.stage17Passport||null);modal.hidden=false;});
  modal.addEventListener("click",event=>{if(event.target===modal)modal.hidden=true;});
  window.addEventListener("keydown",event=>{if(event.key==="Escape"&&modal&&!modal.hidden)modal.hidden=true;});
  window.addEventListener("nrs-stage15-travel-state",event=>render(event.detail?.stage17Passport||N.stage17Passport||null));
  window.addEventListener("nrs-stage15-travel-result",event=>render(event.detail?.stage17Passport||N.stage17Passport||null));
  window.setInterval(()=>render(N.stage17Passport||N.stage15TravelState?.stage17Passport||null),500);render(N.stage17Passport||N.stage15TravelState?.stage17Passport||null);
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});else mount();
})();