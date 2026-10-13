(function () {
  "use strict";

  const root = document.getElementById("nrsAccount");
  const view = document.getElementById("nrsCharacterView");
  if (!root || !view) return;

  const style = document.createElement("style");
  style.id = "nrsMainLobbyStyles";
  style.textContent = `
    #nrsAccount.nrs-character-screen {
      background:
        radial-gradient(circle at 12% 0%, rgba(31,101,158,.22), transparent 34%),
        radial-gradient(circle at 90% 18%, rgba(17,70,113,.18), transparent 32%),
        linear-gradient(145deg,#07121d 0%,#0a1724 48%,#06101a 100%) !important;
      color:#f4f8fb;
    }
    #nrsAccount.nrs-character-screen .nrs-character-header,
    #nrsAccount.nrs-character-screen .nrs-character-main { display:none !important; }
    #nrsMainLobby {
      position:fixed; inset:0; z-index:100001; display:flex; flex-direction:column;
      overflow:hidden; box-sizing:border-box; font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
      color:#f4f8fb; background:
        radial-gradient(circle at 12% 0%,rgba(35,118,182,.20),transparent 34%),
        radial-gradient(circle at 90% 18%,rgba(21,78,120,.17),transparent 34%),
        linear-gradient(145deg,#07121d,#0b1825 52%,#06101a);
    }
    #nrsMainLobby .ml-top {
      flex:0 0 auto; display:flex; align-items:center; gap:14px; min-height:70px;
      padding:12px clamp(16px,5vw,72px); box-sizing:border-box;
      border-bottom:1px solid rgba(255,255,255,.08); background:rgba(4,12,20,.64);
      backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px);
    }
    #nrsMainLobby .ml-logo { width:42px;height:42px;display:grid;place-items:center;flex:0 0 42px;border-radius:12px;background:linear-gradient(145deg,#2d9de4,#1267a5);font-size:25px;font-weight:950;box-shadow:0 7px 22px rgba(0,0,0,.22); }
    #nrsMainLobby .ml-brand { min-width:0;flex:1; }
    #nrsMainLobby .ml-brand strong { display:block;font-size:clamp(13px,1.4vw,19px);letter-spacing:.07em; }
    #nrsMainLobby .ml-brand small { display:block;margin-top:4px;color:#8fa8b9;font-size:8px;letter-spacing:.13em; }
    #nrsMainLobby .ml-actions { display:flex;align-items:center;gap:8px; }
    #nrsMainLobby .ml-pill { border:1px solid rgba(112,190,238,.24);border-radius:999px;padding:8px 11px;background:rgba(27,102,151,.12);color:#9ee0ff;font-size:10px;font-weight:850;white-space:nowrap; }
    #nrsMainLobby .ml-btn { min-height:34px;border:1px solid rgba(255,255,255,.14);border-radius:8px;padding:7px 10px;background:rgba(255,255,255,.05);color:#dce9f2;font-size:9px;font-weight:850;letter-spacing:.05em;cursor:pointer; }
    #nrsMainLobby .ml-content { width:min(1060px,92vw);margin:0 auto;flex:1;min-height:0;overflow:auto;box-sizing:border-box;padding:clamp(24px,5vh,52px) 0 30px;scrollbar-width:thin; }
    #nrsMainLobby .ml-kicker { margin:0 0 8px;color:#63b8e9;font-size:10px;font-weight:900;letter-spacing:.18em; }
    #nrsMainLobby h1 { margin:0;color:#fff;font-size:clamp(28px,4vw,46px);line-height:1.02;letter-spacing:-.035em; }
    #nrsMainLobby .ml-intro { max-width:650px;margin:10px 0 0;color:#9eb2c1;font-size:12px;line-height:1.5; }
    #nrsMainLobby .ml-account { display:flex;align-items:center;justify-content:space-between;gap:12px;margin:25px 0 11px;padding:11px 13px;border:1px solid rgba(255,255,255,.08);border-radius:10px;background:rgba(255,255,255,.035); }
    #nrsMainLobby .ml-account span { min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#91a8b8;font-size:10px; }
    #nrsMainLobby .ml-account strong { color:#8fe0b9;font-size:10px;white-space:nowrap; }
    #nrsMainLobby .ml-grid { display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px; }
    #nrsMainLobby .ml-card { min-width:0;display:grid;grid-template-columns:110px minmax(0,1fr);gap:13px;padding:10px;border:1px solid rgba(116,190,229,.14);border-radius:13px;background:linear-gradient(145deg,rgba(17,39,55,.94),rgba(8,25,38,.94));box-shadow:0 13px 35px rgba(0,0,0,.18); }
    #nrsMainLobby .ml-avatar { width:110px;height:145px;overflow:hidden;border-radius:9px;background:linear-gradient(150deg,#283f62,#121d34);display:grid;place-items:end center; }
    #nrsMainLobby .ml-avatar svg { width:100%;height:100%;display:block; }
    #nrsMainLobby .ml-info { min-width:0;display:flex;flex-direction:column;justify-content:center; }
    #nrsMainLobby .ml-slot { color:#6f9bb3;font-size:8px;font-weight:900;letter-spacing:.12em; }
    #nrsMainLobby .ml-name { margin-top:5px;color:#fff;font-size:17px;font-weight:850;overflow-wrap:anywhere; }
    #nrsMainLobby .ml-city { margin-top:3px;color:#91a8b8;font-size:9px;text-transform:uppercase;letter-spacing:.04em; }
    #nrsMainLobby .ml-level { margin-top:8px;color:#e7c65b;font-size:9px;font-weight:900; }
    #nrsMainLobby .ml-money { display:flex;flex-wrap:wrap;gap:5px;margin-top:8px; }
    #nrsMainLobby .ml-money span { padding:5px 6px;border:1px solid rgba(255,255,255,.08);border-radius:6px;background:rgba(0,0,0,.16);color:#91a8b8;font-size:8px;font-weight:700; }
    #nrsMainLobby .ml-money b { color:#eaf4fa; }
    #nrsMainLobby .ml-play { width:100%;min-height:35px;margin-top:10px;border:1px solid rgba(103,193,239,.45);border-radius:8px;background:linear-gradient(180deg,#1679b4,#0d5885);color:#fff;font-size:9px;font-weight:950;letter-spacing:.08em;cursor:pointer;touch-action:manipulation; }
    #nrsMainLobby .ml-play:disabled { opacity:.55;cursor:wait; }
    #nrsMainLobby .ml-play:active { transform:scale(.985); }
    #nrsMainLobby .ml-empty { min-height:145px;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;padding:16px;border:1px dashed rgba(116,190,229,.22);border-radius:13px;background:rgba(10,29,44,.45); }
    #nrsMainLobby .ml-empty .slot { color:#6f9bb3;font-size:8px;font-weight:900;letter-spacing:.12em; }
    #nrsMainLobby .ml-empty strong { margin-top:7px;font-size:14px; }
    #nrsMainLobby .ml-empty p { margin:5px 0 10px;color:#8298a8;font-size:9px;line-height:1.4; }
    #nrsMainLobby .ml-create { min-height:33px;border:1px solid rgba(230,201,92,.45);border-radius:8px;background:rgba(230,201,92,.08);color:#e8ca62;font-size:9px;font-weight:900;cursor:pointer; }
    #nrsMainLobby .ml-foot { margin-top:18px;color:#657d8d;font-size:9px;text-align:center; }
    @media (max-width:700px) {
      #nrsMainLobby .ml-top { min-height:62px;padding:9px 12px; }
      #nrsMainLobby .ml-logo { width:36px;height:36px;flex-basis:36px;font-size:21px;border-radius:10px; }
      #nrsMainLobby .ml-brand strong { font-size:12px; }
      #nrsMainLobby .ml-brand small { font-size:7px; }
      #nrsMainLobby .ml-pill { padding:7px 8px;font-size:8px; }
      #nrsMainLobby .ml-btn { font-size:8px;padding:7px 8px; }
      #nrsMainLobby .ml-content { width:92vw;padding-top:23px; }
      #nrsMainLobby h1 { font-size:31px; }
      #nrsMainLobby .ml-grid { grid-template-columns:1fr;gap:9px; }
      #nrsMainLobby .ml-card { grid-template-columns:86px minmax(0,1fr);padding:8px;gap:10px; }
      #nrsMainLobby .ml-avatar { width:86px;height:126px; }
      #nrsMainLobby .ml-name { font-size:15px; }
    }
  `;
  document.head.appendChild(style);

  let lobby = document.getElementById("nrsMainLobby");
  let lastSignature = "";
  let syncing = false;

  function money(value) {
    return new Intl.NumberFormat("en-NG").format(Math.max(0, Number(value) || 0));
  }

  function oldCards() {
    return [...view.querySelectorAll(".characterList .characterCard")];
  }

  function oldEmptySlots() {
    return [...view.querySelectorAll(".characterList .nrs-empty-slot")];
  }

  function makeLobby() {
    if (lobby) return lobby;
    lobby = document.createElement("section");
    lobby.id = "nrsMainLobby";
    root.appendChild(lobby);
    return lobby;
  }

  function render() {
    if (!root.classList.contains("nrs-character-screen") || view.hidden || !window.NRS?.session?.accountReady) return;
    const cards = oldCards();
    const empties = oldEmptySlots();
    if (!cards.length && !empties.length) return;

    const chars = window.NRS.session.characters || [];
    const email = byId("nrsCharacterEmail")?.textContent || "Your saved account";
    const signature = JSON.stringify(chars.map((c) => [c.id,c.name,c.level,c.cash,c.bank,c.cityId])) + "|" + cards.length + "|" + empties.length;
    if (signature === lastSignature && lobby) return;
    lastSignature = signature;

    const l = makeLobby();
    const count = chars.length + " / 3 CHARACTERS";
    l.innerHTML = `
      <header class="ml-top">
        <div class="ml-logo">N</div>
        <div class="ml-brand"><strong>NIGERIA ROLEPLAY</strong><small>PORT HARCOURT · ONLINE WORLD · MAIN LOBBY</small></div>
        <div class="ml-actions"><span class="ml-pill">${count}</span><button class="ml-btn" id="mlRules" type="button">RULES</button><button class="ml-btn" id="mlSwitch" type="button">SWITCH</button></div>
      </header>
      <main class="ml-content">
        <p class="ml-kicker">CITIZEN LOBBY</p>
        <h1>Choose your character</h1>
        <p class="ml-intro">Select the citizen you want to play. Your money, home, job and progress stay with that character.</p>
        <div class="ml-account"><span>${email.replace(/[<>]/g,"")}</span><strong>${chars.length} SAVED</strong></div>
        <div class="ml-grid" id="mlGrid"></div>
        <div class="ml-foot">Choose a character to enter Nigeria RP.</div>
      </main>`;

    const grid = l.querySelector("#mlGrid");
    cards.forEach((oldCard, index) => {
      const character = chars[index] || {};
      const card = document.createElement("article");
      card.className = "ml-card";
      const avatar = document.createElement("div");
      avatar.className = "ml-avatar";
      const oldAvatar = oldCard.querySelector(".nrs-avatar-panel");
      if (oldAvatar) avatar.innerHTML = oldAvatar.innerHTML;
      const info = document.createElement("div");
      info.className = "ml-info";
      const city = oldCard.querySelector(".characterHeading small")?.textContent || String(character.cityId || "PORT HARCOURT").replace(/-/g," ");
      const level = Math.max(1, Number(character.level) || 1);
      info.innerHTML = `
        <span class="ml-slot">CHARACTER SLOT 0${index + 1}</span>
        <strong class="ml-name"></strong>
        <span class="ml-city"></span>
        <span class="ml-level">LEVEL ${level}</span>
        <div class="ml-money"><span>CASH <b>₦${money(character.cash)}</b></span><span>BANK <b>₦${money(character.bank)}</b></span></div>
        <button class="ml-play" type="button">PLAY AS ${String(character.name || "CHARACTER").toUpperCase()}</button>`;
      info.querySelector(".ml-name").textContent = character.name || "Unnamed citizen";
      info.querySelector(".ml-city").textContent = city;
      const play = info.querySelector(".ml-play");
      const oldButton = oldCard.querySelector(".continueButton");
      play.disabled = !oldButton || oldButton.disabled;
      play.addEventListener("click", () => { if (oldButton && !oldButton.disabled) oldButton.click(); });
      card.append(avatar, info);
      grid.appendChild(card);
    });

    empties.forEach((oldEmpty, index) => {
      const card = document.createElement("article");
      card.className = "ml-empty";
      card.innerHTML = `<span class="slot">CHARACTER SLOT 0${chars.length + index + 1}</span><strong>Empty character slot</strong><p>Create another citizen to begin a new life in Nigeria RP.</p>`;
      const oldAdd = oldEmpty.querySelector(".nrs-empty-action");
      if (oldAdd) {
        const add = document.createElement("button");
        add.className = "ml-create"; add.type = "button"; add.textContent = "+ CREATE CHARACTER";
        add.addEventListener("click", () => oldAdd.click());
        card.appendChild(add);
      }
      grid.appendChild(card);
    });

    l.querySelector("#mlRules")?.addEventListener("click", () => view.querySelector(".nrs-rules-button")?.click());
    l.querySelector("#mlSwitch")?.addEventListener("click", () => byId("nrsSwitchAccount")?.click());
  }

  function byId(id) { return document.getElementById(id); }

  function sync() {
    if (syncing) return;
    syncing = true;
    try { render(); } finally { syncing = false; }
  }

  const observer = new MutationObserver(() => sync());
  observer.observe(view, { childList:true, subtree:true, attributes:true, attributeFilter:["hidden","disabled"] });
  window.setInterval(sync, 800);
  sync();
})();
