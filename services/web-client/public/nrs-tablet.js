(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const apps = [
    { id: "travel", icon: "🚌", name: "Interstate", note: "Waterlines coach bookings", badge: "COMING SOON" },
    { id: "flights", icon: "✈️", name: "NRS Air", note: "Book an in-game flight" },
    { id: "betting", icon: "🏟️", name: "Betting", note: "Virtual-token sports game" },
    { id: "wallet", icon: "💳", name: "Wallet", note: "Game cash and banking" },
    { id: "contacts", icon: "👥", name: "Contacts", note: "Players in this city" },
    { id: "map", icon: "🗺️", name: "City map", note: "Find local services" },
    { id: "news", icon: "📰", name: "RNN News", note: "In-game city bulletins" },
    { id: "jobs", icon: "💼", name: "Careers", note: "Jobs and workplaces" },
    { id: "passport", icon: "🛂", name: "Passport", note: "Your state discoveries" }
  ];
  const matches = [
    { id: "fixture-coast", home: "Port City FC", away: "Delta Rovers", odds: { home: 1.75, draw: 3.1, away: 2.25 } },
    { id: "fixture-river", home: "Rivergate Athletic", away: "Creekside United", odds: { home: 2.05, draw: 3.0, away: 1.8 } },
    { id: "fixture-civic", home: "Civic Stars", away: "Harbour Town", odds: { home: 1.95, draw: 3.25, away: 1.95 } }
  ];
  const choiceName = { home: "Home win", draw: "Draw", away: "Away win" };
  const storeKey = "nrs_tablet_virtual_betting_v1";
  let selected = { fixtureId: matches[0].id, pick: "home" };
  let bettingFeedback = "";

  const style = document.createElement("style");
  style.textContent = "#nrsTabletLayer{position:fixed;inset:0;z-index:97000;display:grid;place-items:center;padding:clamp(4px,2vw,22px);box-sizing:border-box;background:rgba(1,7,14,.82);backdrop-filter:blur(9px);font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#f3f8ff;touch-action:manipulation}#nrsTabletLayer[hidden]{display:none!important}#nrsTabletDevice{width:min(1040px,100%);height:min(680px,94dvh);min-height:min(420px,94dvh);display:grid;grid-template-rows:auto auto 1fr auto;overflow:hidden;box-sizing:border-box;border:5px solid #364351;border-radius:25px;background:linear-gradient(145deg,#101d2a,#07111b 65%);box-shadow:0 30px 95px #000b,inset 0 0 0 1px #ffffff19}#nrsTabletHead{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 17px;background:linear-gradient(100deg,#13344c,#102030);border-bottom:1px solid #ffffff19}#nrsTabletHead strong{display:block;font-size:15px;letter-spacing:.12em}#nrsTabletHead small{display:block;margin-top:3px;color:#8fb1c6;font-size:10px}#nrsTabletClose{min-width:40px;min-height:38px;border:1px solid #ffffff25;border-radius:10px;background:#203549;color:white;font-size:22px}#nrsTabletStatus{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:7px 17px;color:#8eacbc;font-size:9px;letter-spacing:.08em;background:#0a1621}#nrsTabletStatus .safe{color:#8be4b0;font-weight:900}#nrsTabletBody{overflow:auto;padding:clamp(12px,2.4vw,26px);overscroll-behavior:contain}#nrsTabletFoot{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 14px;background:#09131d;border-top:1px solid #ffffff14;color:#7791a4;font-size:9px;letter-spacing:.05em}#nrsTabletFoot button,.nrsTabBtn{border:1px solid #ffffff1e;border-radius:10px;background:#172a3a;color:#f5f8fb;padding:9px 12px;font-weight:800;touch-action:manipulation}#nrsTabletFoot button:disabled{opacity:.4}#nrsTabletHomeTitle{margin:2px 0 5px;font-size:clamp(22px,3vw,31px);letter-spacing:-.04em}#nrsTabletHomeCopy{margin:0 0 18px;color:#9fb4c6;font-size:12px;line-height:1.5}#nrsTabletGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}#nrsTabletGrid button{position:relative;display:flex;flex-direction:column;align-items:flex-start;min-width:0;min-height:115px;padding:14px;border:1px solid #ffffff17;border-radius:16px;background:linear-gradient(145deg,#172b3c,#0c1a28);color:white;text-align:left;touch-action:manipulation}#nrsTabletGrid button:active{transform:scale(.99);border-color:#54c7ee}#nrsTabletGrid .appIcon{display:grid;place-items:center;width:39px;height:39px;margin-bottom:11px;border-radius:12px;background:#21445b;font-size:22px}#nrsTabletGrid strong{font-size:13px}#nrsTabletGrid small{margin-top:4px;color:#9bb2c4;font-size:10px;line-height:1.35}#nrsTabletGrid .badge{position:absolute;top:8px;right:8px;padding:4px 5px;border-radius:6px;background:#6e4d16;color:#ffe5a0;font-size:7px;font-weight:900;letter-spacing:.03em}#nrsTabletDevice .appTitle{margin:0 0 5px;font-size:23px}#nrsTabletDevice .appCopy{margin:0 0 16px;color:#9fb4c6;font-size:12px;line-height:1.5}#nrsTabletDevice .safeBanner{margin:0 0 15px;padding:11px 12px;border:1px solid #2a5d4b;border-radius:12px;background:#0b2c25;color:#9aefc1;font-size:11px;line-height:1.45}#nrsTabletDevice .infoGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:12px 0}#nrsTabletDevice .infoCard{min-width:0;padding:13px;border:1px solid #ffffff16;border-radius:13px;background:#0e1c29}#nrsTabletDevice .infoCard small{display:block;color:#93a9bc;font-size:9px;letter-spacing:.06em}#nrsTabletDevice .infoCard strong{display:block;overflow-wrap:anywhere;margin-top:6px;font-size:20px;color:#88e7b4}#nrsTabletDevice .appList{display:grid;gap:9px}#nrsTabletDevice .listRow{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 12px;border:1px solid #ffffff16;border-radius:12px;background:#0c1a27;font-size:12px}#nrsTabletDevice .listRow small{display:block;margin-top:4px;color:#93a9bc;font-size:10px}#nrsTabletDevice .sectionLabel{display:block;margin:17px 0 8px;color:#81a5bd;font-size:9px;font-weight:900;letter-spacing:.12em}#nrsTabletDevice .fixture{margin:10px 0;padding:13px;border:1px solid #ffffff18;border-radius:14px;background:#0e1d2a}#nrsTabletDevice .fixtureName{display:flex;align-items:center;justify-content:space-between;gap:10px;font-weight:800;font-size:12px}#nrsTabletDevice .picks{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:10px}#nrsTabletDevice .pick{min-width:0;padding:10px 4px;border:1px solid #344b5d;border-radius:10px;background:#122536;color:#dbe9f2;font-size:10px;font-weight:800}#nrsTabletDevice .pick.on{border-color:#5ed7ff;background:#16465b;color:#fff}#nrsTabletDevice .pick small{display:block;margin-top:4px;color:#91b6cd;font-size:10px}#nrsTabletDevice .formRow{display:flex;align-items:center;gap:10px;margin:12px 0}#nrsTabletDevice input,#nrsTabletDevice select{box-sizing:border-box;max-width:100%;min-width:0;padding:11px;border:1px solid #30485b;border-radius:10px;background:#071522;color:#fff;font:inherit}#nrsTabletDevice input{flex:1}#nrsTabletDevice .primary{min-height:42px;padding:10px 14px;border:1px solid #4cbee1;border-radius:10px;background:linear-gradient(135deg,#16769b,#164e75);color:#fff;font-size:11px;font-weight:900}#nrsTabletDevice .secondary{min-height:38px;padding:8px 12px;border:1px solid #ffffff22;border-radius:10px;background:#1a2c3b;color:#fff;font-size:11px;font-weight:800}#nrsTabletDevice .feedback{min-height:20px;color:#ffd783;font-size:11px;line-height:1.45}#nrsTabletDevice .tag{display:inline-block;padding:5px 7px;border:1px solid #6b5525;border-radius:7px;background:#3b2d14;color:#ffdf94;font-size:8px;font-weight:900;letter-spacing:.04em}#nrsTabletDevice .empty{padding:14px;border:1px dashed #ffffff22;border-radius:12px;color:#9aafc0;font-size:12px;line-height:1.5}@media(max-width:620px){#nrsTabletDevice{height:96dvh;min-height:0;border-width:3px;border-radius:16px}#nrsTabletHead{padding:8px 11px}#nrsTabletGrid{gap:7px}#nrsTabletGrid button{min-height:94px;padding:9px;border-radius:11px}#nrsTabletGrid .appIcon{width:30px;height:30px;font-size:17px;margin-bottom:7px}#nrsTabletGrid strong{font-size:11px}#nrsTabletGrid small{font-size:8px}#nrsTabletGrid .badge{position:static;order:-1;margin-bottom:5px}#nrsTabletStatus{padding:6px 11px;font-size:8px}#nrsTabletBody{padding:10px}#nrsTabletDevice .infoGrid{gap:7px}#nrsTabletDevice .infoCard{padding:10px}#nrsTabletDevice .formRow{flex-wrap:wrap}#nrsTabletFoot{padding:7px 9px;font-size:7px}}@media(max-height:500px){#nrsTabletGrid button{min-height:78px;padding:7px}#nrsTabletGrid .appIcon{width:26px;height:26px;margin-bottom:4px}#nrsTabletDevice .appTitle{font-size:19px}#nrsTabletDevice .appCopy{margin-bottom:8px}}";
  document.head.appendChild(style);

  const layer = document.createElement("div");
  layer.id = "nrsTabletLayer";
  layer.hidden = true;
  layer.innerHTML = '<section id="nrsTabletDevice" aria-label="Nigeria RP Tablet"><header id="nrsTabletHead"><div><strong>NRS TABLET</strong><small>Everyday apps for your character</small></div><button id="nrsTabletClose" type="button" aria-label="Close Tablet">×</button></header><div id="nrsTabletStatus"><span class="safe">● GAME WORLD ONLY</span><span id="nrsTabletClock"></span></div><main id="nrsTabletBody"></main><footer id="nrsTabletFoot"><button id="nrsTabletHome" type="button">⌂ Home</button><span>NO REAL-WORLD CONNECTIONS</span></footer></section>';
  document.body.appendChild(layer);
  const body = $("nrsTabletBody");

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }
  function money(value) { return "₦" + Math.max(0, Math.floor(Number(value) || 0)).toLocaleString("en-NG"); }
  function timeText() { return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
  function readBetState() {
    try {
      const raw = JSON.parse(localStorage.getItem(storeKey) || "null");
      if (raw && Number.isSafeInteger(raw.balance) && raw.balance >= 0 && Array.isArray(raw.tickets)) {
        return { balance: Math.min(raw.balance, 100000000), tickets: raw.tickets.slice(-50) };
      }
    } catch (_) {}
    return { balance: 25000, tickets: [] };
  }
  function saveBetState(state) {
    try { localStorage.setItem(storeKey, JSON.stringify(state)); } catch (_) {}
  }
  function setScreenTitle(title, copy) {
    body.replaceChildren();
    body.appendChild(el("h2", "appTitle", title));
    if (copy) body.appendChild(el("p", "appCopy", copy));
  }
  function returnHome() {
    body.replaceChildren();
    body.insertAdjacentHTML("afterbegin", '<h1 id="nrsTabletHomeTitle">Your day, your city.</h1><p id="nrsTabletHomeCopy">Use services inside Nigeria RP. Every action below is fictional and stays inside the game world.</p><div id="nrsTabletGrid"></div>');
    const grid = $("nrsTabletGrid");
    for (const app of apps) {
      const button = el("button", "", "");
      button.type = "button";
      button.dataset.app = app.id;
      const icon = el("span", "appIcon", app.icon);
      const title = el("strong", "", app.name);
      const note = el("small", "", app.note);
      if (app.badge) button.appendChild(el("span", "badge", app.badge));
      button.append(icon, title, note);
      grid.appendChild(button);
    }
    const hint = el("p", "appCopy", "Game cash is separate from Betting virtual tokens. Nothing here contacts real companies or services.");
    hint.style.marginTop = "16px";
    body.appendChild(hint);
  }
  function openTablet() {
    layer.hidden = false;
    returnHome();
    $("nrsTabletClock").textContent = timeText();
  }
  function closeTablet() { layer.hidden = true; }

  function openTravel(mode) {
    closeTablet();
    window.dispatchEvent(new CustomEvent("nrs-tablet-travel-mode", { detail: { mode } }));
    const open = $("nrsTravelOpen");
    if (open) open.click();
    else {
      openTablet();
      setScreenTitle("Travel terminal", "The interstate travel service is loading. Close the Tablet and try again once the game connects.");
    }
  }
  function renderWallet() {
    setScreenTitle("Wallet & banking", "This screen only displays your Nigeria RP character wallet. It is not a real bank account.");
    body.appendChild(el("div", "safeBanner", "IN-GAME CURRENCY ONLY · No deposits, withdrawals or payments to real-world services."));
    const grid = el("div", "infoGrid");
    const cash = $("cash") ? $("cash").textContent : (window.NRS && window.NRS.cash);
    const bank = window.NRS && (window.NRS.bankBalance ?? window.NRS.bank);
    const cashCard = el("div", "infoCard");
    cashCard.append(el("small", "", "CASH IN GAME"), el("strong", "", "₦" + String(cash || "0")));
    const bankCard = el("div", "infoCard");
    bankCard.append(el("small", "", "BANK BALANCE IN GAME"), el("strong", "", bank === undefined ? "Open a bank in the city" : money(bank)));
    grid.append(cashCard, bankCard);
    body.appendChild(grid);
    body.appendChild(el("p", "appCopy", "To use normal character banking, visit a bank in the city. Banking actions are processed by the game server."));
  }
  function renderContacts() {
    setScreenTitle("Contacts", "Citizens currently visible to your game session.");
    const list = el("div", "appList");
    const session = window.NRS && window.NRS.session;
    const currentName = session && session.name ? session.name : "You";
    list.appendChild(el("div", "listRow", "You · " + currentName));
    const remotes = session && session.remotes instanceof Map ? Array.from(session.remotes.values()) : [];
    for (const player of remotes.slice(0, 60)) {
      const row = el("div", "listRow");
      const detail = el("span", "", String(player.username || player.name || player.displayName || "Citizen"));
      const level = el("small", "", "Level " + Math.max(1, Number(player.level) || 1));
      detail.appendChild(level);
      row.appendChild(detail);
      list.appendChild(row);
    }
    if (!remotes.length) list.appendChild(el("div", "empty", "No other citizens are visible in this city right now."));
    body.appendChild(list);
  }
  function renderNews() {
    setScreenTitle("Rivers News Network", "The official news desk inside Nigeria RP.");
    body.appendChild(el("div", "safeBanner", "IN-GAME EDITORIAL RULES · Citizens submit story reports. Only authorised Rivers News Network staff can publish approved stories."));
    body.appendChild(el("div", "infoCard", "Use the City & News Hub in the game Settings for the current feed and reporting workflow."));
    const button = el("button", "primary", "Open Settings");
    button.type = "button";
    button.onclick = () => {
      closeTablet();
      $("gear")?.click();
    };
    body.appendChild(button);
  }
  function renderJobs() {
    setScreenTitle("Jobs & careers", "Earn and progress as a citizen in the game world.");
    const tips = [
      ["Job Center", "Visit the Job Center to accept a delivery mission and earn in-game cash."],
      ["Workplaces", "Find an office, market, hospital or public service and review available careers."],
      ["Payday", "Complete your assigned work and follow its on-screen instructions."],
      ["Factions", "Some roles require applications, staff approval, duty status and a uniform."]
    ];
    const list=el("div","appList");
    for(const item of tips){const row=el("div","listRow");row.appendChild(el("span","",item[0]));row.appendChild(el("small","",item[1]));list.appendChild(row);}
    body.appendChild(list);
  }
  function renderPassport() {
    setScreenTitle("State passport", "Your character records the game states visited through interstate travel.");
    const passport = window.NRS && window.NRS.stage17Passport;
    if (!passport) {
      body.appendChild(el("div","empty","Travel once or reopen Interstate Travel to load your latest passport progress."));
      return;
    }
    const grid=el("div","infoGrid");
    const visited=el("div","infoCard");
    visited.append(el("small","","STATES VISITED"),el("strong","",String(passport.visitedCount||0)+" / "+String(passport.totalCities||7)));
    const rewards=el("div","infoCard");
    rewards.append(el("small","","DISCOVERY REWARDS"),el("strong","",money(passport.totalRewardsNaira)));
    grid.append(visited,rewards);body.appendChild(grid);
    const list=el("div","appList");
    for(const stamp of Array.isArray(passport.stamps)?passport.stamps:[]){
      const row=el("div","listRow");
      row.appendChild(el("span","",String(stamp.cityName||stamp.cityId)+(stamp.current?" · Current state":"")));
      row.appendChild(el("small","",stamp.current?"Current location":"Discovered in game"));
      list.appendChild(row);
    }
    body.appendChild(list);
  }
  function renderBetting() {
    setScreenTitle("Betting", "A fictional sports mini-game that uses only separate virtual tokens.");
    const state=readBetState();
    body.appendChild(el("div","safeBanner","SIMULATION ONLY · NO REAL-MONEY BETTING · Tokens cannot be purchased, transferred, redeemed or used outside this game."));
    const wallet=el("div","infoGrid");
    const balance=el("div","infoCard");
    balance.append(el("small","","BETTING TOKENS"),el("strong","",state.balance.toLocaleString("en-NG")));
    const game=el("div","infoCard");
    game.append(el("small","","NETWORK"),el("strong","","LOCAL SIMULATION"));
    wallet.append(balance,game);body.appendChild(wallet);
    const stakeRow=el("div","formRow");
    stakeRow.appendChild(el("label","","Stake (virtual tokens)"));
    const stake=el("input","");
    stake.type="number";stake.min="100";stake.max=String(state.balance);stake.step="100";stake.value="500";stake.id="nrsBetStake";
    stake.setAttribute("inputmode","numeric");
    stakeRow.appendChild(stake);
    body.appendChild(stakeRow);
    for(const fixture of matches){
      const card=el("section","fixture");
      const title=el("div","fixtureName");
      title.append(el("span","",fixture.home+" vs "+fixture.away),el("span","tag","FICTIONAL FIXTURE"));
      card.appendChild(title);
      const picks=el("div","picks");
      for(const key of ["home","draw","away"]){
        const button=el("button","pick"+(selected.fixtureId===fixture.id&&selected.pick===key?" on":""),"");
        button.type="button";button.dataset.fixture=fixture.id;button.dataset.pick=key;
        button.append(el("span","",choiceName[key]),el("small","",fixture.odds[key].toFixed(2)+"x"));
        button.onclick=()=>{const priorStake=$("nrsBetStake")?.value||"500";selected={fixtureId:fixture.id,pick:key};renderBetting();const nextStake=$("nrsBetStake");if(nextStake)nextStake.value=priorStake;};
        picks.appendChild(button);
      }
      card.appendChild(picks);body.appendChild(card);
    }
    const place=el("button","primary","Place virtual bet");
    place.type="button";
    const feedback=el("div","feedback",bettingFeedback);
    place.onclick=()=>{
      const latest=readBetState();
      const amount=Math.floor(Number(stake.value));
      const fixture=matches.find((item)=>item.id===selected.fixtureId);
      if(!fixture||!choiceName[selected.pick]){bettingFeedback="Choose a fictional match outcome.";renderBetting();return;}
      if(!Number.isSafeInteger(amount)||amount<100||amount>latest.balance||amount%100!==0){bettingFeedback="Enter a stake in 100-token increments, between 100 and your available token balance.";renderBetting();return;}
      const ticket={id:"virtual-"+Date.now()+"-"+Math.floor(Math.random()*1000000),fixtureId:fixture.id,fixtureName:fixture.home+" vs "+fixture.away,pick:selected.pick,pickName:choiceName[selected.pick],stake:amount,odds:fixture.odds[selected.pick],status:"open",payout:0,createdAt:Date.now()};
      latest.balance-=amount;latest.tickets.push(ticket);latest.tickets=latest.tickets.slice(-50);saveBetState(latest);
      bettingFeedback="Virtual ticket placed. Simulate the fixture below to settle it.";renderBetting();
    };
    body.appendChild(place);body.appendChild(feedback);
    body.appendChild(el("span","sectionLabel","YOUR VIRTUAL TICKETS"));
    const current=readBetState();
    const tickets=el("div","appList");
    for(const ticket of current.tickets.slice().reverse().slice(0,12)){
      const row=el("div","listRow");
      const text=el("span","",String(ticket.fixtureName||"Fictional match"));
      text.appendChild(el("small","","Pick: "+String(ticket.pickName||"—")+" · Stake "+Number(ticket.stake||0).toLocaleString()+" tokens · "+String(ticket.status||"open").toUpperCase()));
      row.appendChild(text);
      if(ticket.status==="open"){
        const settle=el("button","secondary","Simulate result");
        settle.type="button";settle.onclick=()=>{
          const result=readBetState();
          const currentTicket=result.tickets.find((item)=>item.id===ticket.id);
          if(!currentTicket||currentTicket.status!=="open")return;
          const outcome=["home","draw","away"][Math.floor(Math.random()*3)];
          currentTicket.result=choiceName[outcome];
          currentTicket.status=outcome===currentTicket.pick?"won":"lost";
          if(currentTicket.status==="won"){
            currentTicket.payout=Math.floor(currentTicket.stake*currentTicket.odds);
            result.balance+=currentTicket.payout;
          }
          saveBetState(result);
          bettingFeedback=currentTicket.status==="won"?"Simulated result: "+currentTicket.result+". You won "+currentTicket.payout.toLocaleString()+" virtual tokens.":"Simulated result: "+currentTicket.result+". This ticket did not win; no game cash was charged.";
          renderBetting();
        };
        row.appendChild(settle);
      }else{
        row.appendChild(el("small","",ticket.status==="won"?"Paid "+Number(ticket.payout||0).toLocaleString()+" tokens":ticket.status==="lost"?"Settled · no payout":"Settled"));
      }
      tickets.appendChild(row);
    }
    if(!current.tickets.length)tickets.appendChild(el("div","empty","No virtual tickets yet. Choose a fictional fixture above."));
    body.appendChild(tickets);
  }
  function showApp(id) {
    switch(id){
      case "travel": openTravel("day-bus"); return;
      case "flights": openTravel("flight"); return;
      case "betting": bettingFeedback="";renderBetting();return;
      case "wallet": renderWallet();return;
      case "contacts": renderContacts();return;
      case "map": closeTablet();$("ib3")?.click();return;
      case "news": renderNews();return;
      case "jobs": renderJobs();return;
      case "passport": renderPassport();return;
      default: returnHome();
    }
  }

  $("ib0")?.setAttribute("aria-label","Open Tablet");
  $("ib0")?.setAttribute("title","Open Tablet");
  $("ib0")?.addEventListener("click",(event)=>{event.stopImmediatePropagation();openTablet();},true);
  $("nrsTabletClose").addEventListener("click",closeTablet);
  $("nrsTabletHome").addEventListener("click",returnHome);
  body.addEventListener("click",(event)=>{const target=event.target.closest("[data-app]");if(target)showApp(target.dataset.app);});
  layer.addEventListener("click",(event)=>{if(event.target===layer)closeTablet();});
  window.addEventListener("keydown",(event)=>{if(event.key==="Escape"&&!layer.hidden)closeTablet();});
  window.setInterval(()=>{const clock=$("nrsTabletClock");if(clock&&!layer.hidden)clock.textContent=timeText();},15000);
  returnHome();

  // Local, walk-up 3D transport hubs: bookings work now; full boarding/terminal animation is Coming Soon.
  function addReadableBoard(parent,x,y,z,width,height,lines,background,rotationY) {
    const canvas=document.createElement("canvas");canvas.width=1024;canvas.height=256;
    const ctx=canvas.getContext("2d");
    ctx.fillStyle=background;ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle="rgba(255,255,255,.14)";ctx.fillRect(0,0,canvas.width,16);
    ctx.strokeStyle="rgba(255,255,255,.8)";ctx.lineWidth=7;ctx.strokeRect(9,9,canvas.width-18,canvas.height-18);
    ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.fillStyle="#fff";ctx.font="900 61px system-ui";
    if(lines.length===1)ctx.fillText(lines[0],512,128,canvas.width-40);
    else {ctx.fillText(lines[0],512,92,canvas.width-40);ctx.fillStyle="#b9f4d6";ctx.font="800 43px system-ui";ctx.fillText(lines[1],512,169,canvas.width-40);}
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const backTexture=texture.clone();backTexture.wrapS=THREE.RepeatWrapping;backTexture.repeat.set(-1,1);backTexture.offset.set(1,0);backTexture.needsUpdate=true;
    const board=new THREE.Group();board.position.set(x,y,z);board.rotation.y=rotationY||0;parent.add(board);
    const geometry=new THREE.PlaneGeometry(width,height);
    const front=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({map:texture,side:THREE.FrontSide,fog:false}));front.position.z=.025;board.add(front);
    const back=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({map:backTexture,side:THREE.FrontSide,fog:false}));back.rotation.y=Math.PI;back.position.z=-.025;board.add(back);
    return board;
  }
  function addFlat(width,depth,color,x,z) {
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,depth),new THREE.MeshLambertMaterial({color}));
    mesh.rotation.x=-Math.PI/2;mesh.position.set(x,.035,z);scene.add(mesh);return mesh;
  }
  function buildTransportHubs() {
    if(window.__nrsStage18TransportHubs||typeof THREE==="undefined")return;
    if(typeof scene==="undefined")return;
    window.__nrsStage18TransportHubs=true;
    addFlat(35,25,0x777d7c,-178,164);
    const busStation=new THREE.Group();busStation.position.set(-178,0,164);scene.add(busStation);
    const box=(w,h,d,mat,x,y,z,parent=busStation)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);parent.add(mesh);return mesh;};
    const concrete=new THREE.MeshLambertMaterial({color:0xd8d3c6}),trim=new THREE.MeshLambertMaterial({color:0x185541}),glass=new THREE.MeshLambertMaterial({color:0x4b91a5,transparent:true,opacity:.8}),dark=new THREE.MeshLambertMaterial({color:0x222a32}),yellow=new THREE.MeshLambertMaterial({color:0xe8b83f}),white=new THREE.MeshLambertMaterial({color:0xf4f2e9}),blue=new THREE.MeshLambertMaterial({color:0x1b6598});
    box(19,4.2,8.4,concrete,0,2.1,0);box(19.5,.5,9,trim,0,4.25,0);box(19.6,.28,9.1,yellow,0,4.52,0);
    box(5,2.5,.12,glass,-6,2,-4.26);box(5,2.5,.12,glass,0,2,-4.26);box(5,2.5,.12,glass,6,2,-4.26);
    addReadableBoard(busStation,0,5.6,-4.7,15,1.55,["WATERLINES COACHES","INTERSTATE · DAY / NIGHT"],"#134f3c",Math.PI);
    const coach=new THREE.Group();coach.position.set(-164,.1,145);coach.rotation.y=Math.PI/2;scene.add(coach);
    box(8.3,2.8,2.5,blue,0,1.55,0,coach);box(7.9,.75,2.56,dark,0,2.25,-.02,coach);box(7.5,.18,2.64,white,0,.24,0,coach);
    for(const x of [-2.8,-.9,1.0,2.8])box(.9,.72,.08,glass,x,1.9,-1.29,coach);
    for(const x of [-2.7,2.7]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.48,.48,.2,12),dark);wheel.rotation.z=Math.PI/2;wheel.position.set(x,.53,1.22);coach.add(wheel);}
    addReadableBoard(coach,0,3.1,-1.32,4.7,.55,["WATERLINES"],"#0b3e2e",0);
    if(typeof boxes!=="undefined"&&Array.isArray(boxes))boxes.push({x:-178,z:164,hw:9.5,hd:4.2,h:4.2},{x:259,z:-157,hw:9,hd:4.5,h:4.2});
    addFlat(112,30,0x454d56,302,-177);
    const runwayWhite=new THREE.MeshLambertMaterial({color:0xf4f2e9});
    for(let x=258;x<=346;x+=22){const marker=new THREE.Mesh(new THREE.BoxGeometry(1.3,.04,.6),runwayWhite);marker.position.set(x,.065,-177);scene.add(marker);}
    const airport=new THREE.Group();airport.position.set(259,0,-157);scene.add(airport);
    box(18,4.2,9,white,0,2.1,0,airport);box(18.6,.55,9.6,blue,0,4.35,0,airport);
    box(6,2.6,.12,glass,-5,2.0,-4.55,airport);box(6,2.6,.12,glass,4,2.0,-4.55,airport);
    addReadableBoard(airport,0,5.65,-5.0,15.5,1.5,["NRS REGIONAL AIRPORT","DEPARTURES · TICKET COUNTER"],"#16496f",Math.PI);
    const plane=new THREE.Group();plane.position.set(304,.3,-177);plane.rotation.y=Math.PI/2;scene.add(plane);
    const fuselage=new THREE.Mesh(new THREE.CylinderGeometry(.48,.55,11,14),white);fuselage.rotation.z=Math.PI/2;plane.add(fuselage);
    box(8,.16,2.4,blue,0,.3,0,plane);box(2.3,.12,1.1,white,-4.5,.2,0,plane);box(2.1,.1,.9,white,4.8,.18,0,plane);
    const nearby=document.createElement("button");nearby.id="nrsTravelNearby";nearby.hidden=true;nearby.textContent="Open ticket counter";
    nearby.style.cssText="position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:92000;padding:13px 18px;border:1px solid #74d9ff;border-radius:13px;background:#0b4e6c;color:white;font-weight:900;box-shadow:0 8px 28px #0008;touch-action:manipulation";
    document.body.appendChild(nearby);
    let nearbyMode=null;
    nearby.addEventListener("click",()=>openTravel(nearbyMode==="airport"?"flight":nearbyMode==="night-bus"?"night-bus":"day-bus"));
    window.setInterval(()=>{
      if(layer.hidden===false){nearby.hidden=true;return;}
      let current=null;
      try{
        const px=Number(pos.x)||0,pz=Number(pos.z)||0;
        if(Math.hypot(px+178,pz-145)<17)current="bus";
        else if(Math.hypot(px-259,pz+157)<18)current="airport";
      }catch(_){}
      nearbyMode=current==="airport"?"airport":"day-bus";
      nearby.hidden=!current;
      nearby.textContent=current==="airport"?"✈ Buy NRS Air ticket":"🚌 Waterlines ticket counter";
    },700);
  }
  try { if(typeof THREE!=="undefined"&&typeof scene!=="undefined")buildTransportHubs(); } catch(error) { console.warn("Stage 18 transport scenery unavailable",error); }
})();