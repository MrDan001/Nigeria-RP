(function () {
  "use strict";

  const root = document.getElementById("nrsAccount");
  const view = document.getElementById("nrsCharacterView");
  if (!root || !view) return;

  const style = document.createElement("style");
  style.id = "nrsMainLobbyStyles";
  style.textContent = `
    #nrsAccount.nrs-character-screen { background:#16072a !important; overflow:hidden !important; }
    #nrsAccount.nrs-character-screen .nrs-character-header,
    #nrsAccount.nrs-character-screen .nrs-character-main { display:none !important; }
    #nrsMainLobby { position:fixed; inset:0; z-index:100001; display:flex; flex-direction:column; overflow:hidden; color:#f7f2ff; font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; background:linear-gradient(90deg,rgba(35,7,57,.94),rgba(31,8,52,.72)),radial-gradient(circle at 82% 56%,rgba(126,67,156,.25),transparent 45%),radial-gradient(circle at 12% 22%,rgba(101,35,140,.30),transparent 42%),#16072a; isolation:isolate; }
    #nrsMainLobby::before { content:""; position:absolute; inset:76px 0 0; z-index:-2; background:linear-gradient(rgba(35,8,57,.62),rgba(31,8,52,.84)),url("/nrs-city-bg.svg"); background-size:cover; background-position:center; filter:blur(5px) saturate(.85); opacity:.7; transform:scale(1.035); }
    #nrsMainLobby::after { content:""; position:absolute; inset:0; z-index:-1; pointer-events:none; background:radial-gradient(circle at 50% 45%,transparent 0 34%,rgba(13,3,25,.22) 74%,rgba(9,2,18,.48) 100%); }
    #nrsMainLobby .sl-top { min-height:76px; flex:0 0 auto; display:flex; align-items:center; gap:28px; padding:0 clamp(22px,4vw,64px); box-sizing:border-box; background:rgba(16,4,30,.78); border-bottom:1px solid rgba(255,255,255,.035); backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px); }
    #nrsMainLobby .sl-back { width:42px;height:42px;flex:0 0 42px;border:1px solid rgba(255,255,255,.7);border-radius:50%;background:rgba(255,255,255,.02);color:#fff;display:grid;place-items:center;font-size:27px;line-height:1;cursor:pointer;touch-action:manipulation; }
    #nrsMainLobby .sl-title { font-size:clamp(28px,3vw,40px);line-height:1;font-weight:800;letter-spacing:-.025em; }
    #nrsMainLobby .sl-spacer { flex:1; }
    #nrsMainLobby .sl-rule { border:0;border-bottom:2px solid #e2b93e;padding:4px 0 3px;background:transparent;color:#e8c348;font-size:clamp(13px,1.5vw,21px);font-weight:700;cursor:pointer;white-space:nowrap; }
    #nrsMainLobby .sl-stat,#nrsMainLobby .sl-icon { color:#f5effb;white-space:nowrap;font-size:clamp(18px,2vw,27px); }
    #nrsMainLobby .sl-stat .plus { color:#c05eff;font-weight:900;margin-right:5px; }
    #nrsMainLobby .sl-stat .gold { color:#e3bd43;margin-left:4px; }
    #nrsMainLobby .sl-icon { opacity:.82;font-size:28px; }
    #nrsMainLobby .sl-body { width:min(1335px,calc(100vw - 120px));margin:0 auto;flex:1;min-height:0;overflow:auto;padding:38px 0 34px;box-sizing:border-box;scrollbar-width:thin;scrollbar-color:rgba(221,186,244,.35) transparent; }
    #nrsMainLobby .sl-section-head { display:flex;align-items:center;justify-content:space-between;gap:18px;margin:0 0 18px; }
    #nrsMainLobby .sl-section-title { margin:0;color:#fff;font-size:clamp(20px,2vw,29px);font-weight:450;letter-spacing:-.02em; }
    #nrsMainLobby .sl-with-label { margin:0 0 18px;color:#ddd2e8;font-size:clamp(17px,1.65vw,24px);font-weight:500;letter-spacing:.01em; }
    #nrsMainLobby .sl-sort { color:#cfc4da;font-size:clamp(14px,1.45vw,20px);white-space:nowrap; }
    #nrsMainLobby .sl-sort strong { font-weight:500; }
    #nrsMainLobby .sl-chevron { display:inline-grid;place-items:center;width:28px;height:28px;margin-left:8px;border:1px solid rgba(255,255,255,.42);border-radius:50%;color:#d7cae0;font-size:17px; }
    #nrsMainLobby .sl-server-row,#nrsMainLobby .sl-all-row { display:flex;gap:12px;overflow-x:auto;padding:1px 0 12px;scrollbar-width:none; }
    #nrsMainLobby .sl-server-row::-webkit-scrollbar,#nrsMainLobby .sl-all-row::-webkit-scrollbar { display:none; }
    #nrsMainLobby .sl-server { flex:0 0 min(450px,38vw);min-width:330px;padding:11px 12px 12px;box-sizing:border-box;border:1px solid rgba(167,92,210,.15);border-radius:6px;background:linear-gradient(135deg,rgba(90,32,123,.58),rgba(64,25,94,.48));box-shadow:0 12px 28px rgba(10,1,19,.18);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px); }
    #nrsMainLobby .sl-server-head { display:flex;align-items:center;gap:8px;min-height:28px;color:#efe8f5; }
    #nrsMainLobby .sl-server-id { font-size:21px;letter-spacing:.02em; }
    #nrsMainLobby .sl-lang { padding:2px 5px;border:1px solid rgba(255,255,255,.8);border-radius:4px;font-size:12px;line-height:1;font-weight:700; }
    #nrsMainLobby .sl-online { margin-left:auto;font-size:20px;color:#d9d2df; }
    #nrsMainLobby .sl-online-dot { display:inline-block;width:13px;height:13px;margin-right:6px;border-radius:50%;background:#62f000;box-shadow:0 0 0 4px rgba(98,240,0,.14);vertical-align:1px; }
    #nrsMainLobby .sl-online-number { color:#74ff21; }
    #nrsMainLobby .sl-server-slots { display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:3px;margin-top:7px; }
    #nrsMainLobby .sl-char { position:relative;min-width:0;height:170px;overflow:hidden;border:0;border-radius:2px;background:linear-gradient(145deg,rgba(112,63,154,.48),rgba(57,25,88,.45));color:#f2e8f7;cursor:pointer;padding:0;text-align:left;touch-action:manipulation;transition:transform .15s ease,filter .15s ease,outline-color .15s ease;outline:2px solid transparent;outline-offset:-2px; }
    #nrsMainLobby .sl-char:hover { filter:brightness(1.12); }
    #nrsMainLobby .sl-char:active { transform:scale(.985); }
    #nrsMainLobby .sl-char:focus-visible { outline-color:#f0cb4f; }
    #nrsMainLobby .sl-char svg { width:100%;height:100%;display:block; }
    #nrsMainLobby .sl-char-name { position:absolute;left:10px;right:5px;bottom:7px;color:#eee6f3;font-size:14px;font-weight:500;text-shadow:0 2px 7px rgba(0,0,0,.7);overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
    #nrsMainLobby .sl-char-level { position:absolute;left:8px;top:7px;padding:2px 5px;border-radius:4px;background:rgba(23,8,36,.62);color:#efd56d;font-size:9px;font-weight:800; }
    #nrsMainLobby .sl-empty-char { display:grid;place-items:center; }
    #nrsMainLobby .sl-empty-char::before { content:"";width:62px;height:82px;border-radius:45% 45% 38% 38%;background:rgba(202,190,213,.18);box-shadow:0 -8px 0 10px rgba(202,190,213,.08); }
    #nrsMainLobby .sl-empty-char span { position:absolute;bottom:7px;left:9px;color:#bdaec9;font-size:12px; }
    #nrsMainLobby .sl-all { margin-top:47px; }
    #nrsMainLobby .sl-all-server { flex:0 0 min(450px,38vw);min-width:330px;height:52px;padding:0 13px;box-sizing:border-box;display:flex;align-items:center;gap:10px;border-radius:5px;border:1px solid rgba(167,92,210,.13);background:rgba(88,31,121,.38); }
    #nrsMainLobby .sl-all-server .sl-online { font-size:17px; }
    #nrsMainLobby .sl-all-server .sl-online-dot { width:11px;height:11px; }
    #nrsMainLobby .sl-all-server .sl-server-id { font-size:19px; }
    #nrsMainLobby .sl-hint { margin-top:18px;color:rgba(224,211,235,.68);font-size:11px;text-align:center; }
    @media (max-width:800px) {
      #nrsMainLobby .sl-top { min-height:64px;padding:0 13px;gap:10px; }
      #nrsMainLobby .sl-back { width:37px;height:37px;flex-basis:37px;font-size:24px; }
      #nrsMainLobby .sl-title { font-size:27px; }
      #nrsMainLobby .sl-rule { font-size:11px; }
      #nrsMainLobby .sl-stat { display:none; }
      #nrsMainLobby .sl-icon { font-size:22px; }
      #nrsMainLobby .sl-body { width:calc(100vw - 24px);padding:25px 0 24px; }
      #nrsMainLobby .sl-section-head { margin-bottom:14px; }
      #nrsMainLobby .sl-section-title { font-size:21px; }
      #nrsMainLobby .sl-with-label { font-size:17px;margin-bottom:13px; }
      #nrsMainLobby .sl-sort { font-size:12px; }
      #nrsMainLobby .sl-chevron { width:24px;height:24px;font-size:14px; }
      #nrsMainLobby .sl-server { flex-basis:calc(100vw - 24px);min-width:0; }
      #nrsMainLobby .sl-char { height:170px; }
      #nrsMainLobby .sl-char-name { font-size:12px; }
      #nrsMainLobby .sl-all { margin-top:30px; }
      #nrsMainLobby .sl-all-server { flex-basis:calc(100vw - 24px);min-width:0; }
    }
  `;
  document.head.appendChild(style);

  let lobby = null;
  let lastSignature = "";
  let syncing = false;

  const byId = id => document.getElementById(id);
  const onlineCount = () => {
    const n = Number(byId("online-count")?.textContent || 0);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  };
  const oldCards = () => [...view.querySelectorAll(".characterList .characterCard")];
  const oldEmptySlots = () => [...view.querySelectorAll(".characterList .nrs-empty-slot")];
  const safeText = (value, fallback) => String(value ?? "").trim() || fallback;

  function createCharButton(oldCard, character, index) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "sl-char";
    button.setAttribute("aria-label", `Play as ${safeText(character.name, "character")}`);
    const avatar = oldCard?.querySelector(".nrs-avatar-panel");
    if (avatar) button.innerHTML = avatar.innerHTML;
    const level = document.createElement("span");
    level.className = "sl-char-level";
    level.textContent = `LV ${Math.max(1, Number(character.level) || 1)}`;
    const name = document.createElement("span");
    name.className = "sl-char-name";
    name.textContent = safeText(character.name, `Character ${index + 1}`);
    button.append(level, name);
    const oldButton = oldCard?.querySelector(".continueButton");
    button.disabled = !oldButton || oldButton.disabled;
    button.addEventListener("click", () => { if (oldButton && !oldButton.disabled) oldButton.click(); });
    return button;
  }

  function emptyCharacterButton(oldEmpty, index) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "sl-char sl-empty-char";
    button.setAttribute("aria-label", `Create character slot ${index + 1}`);
    const label = document.createElement("span");
    label.textContent = `+ CREATE SLOT ${index + 1}`;
    button.appendChild(label);
    const oldAdd = oldEmpty?.querySelector(".nrs-empty-action");
    if (oldAdd) button.addEventListener("click", () => oldAdd.click());
    return button;
  }

  function serverHeader() {
    const header = document.createElement("div");
    header.className = "sl-server-head";
    header.innerHTML = `<span class="sl-server-id"># 001</span><span class="sl-lang">EN</span><span class="sl-online"><i class="sl-online-dot"></i><b class="sl-online-number">${onlineCount()}</b>/1000</span>`;
    return header;
  }

  function makeServer(chars, cards, empties) {
    const server = document.createElement("article");
    server.className = "sl-server";
    server.appendChild(serverHeader());
    const slots = document.createElement("div");
    slots.className = "sl-server-slots";
    for (let i = 0; i < 3; i++) {
      if (chars[i] && cards[i]) slots.appendChild(createCharButton(cards[i], chars[i], i));
      else if (!chars[i] && empties[i - chars.length]) slots.appendChild(emptyCharacterButton(empties[i - chars.length], i));
      else {
        const blank = document.createElement("div");
        blank.className = "sl-char sl-empty-char";
        const label = document.createElement("span"); label.textContent = "EMPTY"; blank.appendChild(label); slots.appendChild(blank);
      }
    }
    server.appendChild(slots);
    return server;
  }

  function makeAllServer() {
    const row = document.createElement("article");
    row.className = "sl-all-server";
    row.innerHTML = `<span class="sl-server-id"># 001</span><span class="sl-lang">EN</span><span class="sl-online"><i class="sl-online-dot"></i><b class="sl-online-number">${onlineCount()}</b>/1000</span>`;
    return row;
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
    const chars = Array.isArray(window.NRS.session.characters) ? window.NRS.session.characters : [];
    const cards = oldCards();
    const empties = oldEmptySlots();
    if (!cards.length && !empties.length) return;
    const signature = JSON.stringify(chars.map(c => [c.id,c.name,c.level,c.cash,c.bank,c.cityId])) + `|${cards.length}|${empties.length}|${onlineCount()}`;
    if (signature === lastSignature && lobby) return;
    lastSignature = signature;

    const l = makeLobby();
    l.innerHTML = "";
    const top = document.createElement("header");
    top.className = "sl-top";
    top.innerHTML = `<button class="sl-back" id="slBack" type="button" aria-label="Back">←</button><strong class="sl-title">SERVER</strong><span class="sl-spacer"></span><button class="sl-rule" id="slRules" type="button">SERVER RULES</button><span class="sl-stat"><span class="plus">✚</span>16 <span class="gold">Ⓖ</span></span><span class="sl-icon" aria-hidden="true">◉</span>`;
    l.appendChild(top);

    const body = document.createElement("main"); body.className = "sl-body";
    const head = document.createElement("div"); head.className = "sl-section-head"; head.innerHTML = `<h1 class="sl-section-title">SELECT SERVER</h1>`; body.appendChild(head);
    const withRow = document.createElement("div"); withRow.className = "sl-section-head"; withRow.innerHTML = `<div class="sl-with-label">WITH CHARACTER:</div><div class="sl-sort">Sort by: <strong>BY ONLINE</strong><span class="sl-chevron">⌄</span></div>`; body.appendChild(withRow);
    const serverRow = document.createElement("div"); serverRow.className = "sl-server-row"; serverRow.appendChild(makeServer(chars,cards,empties)); body.appendChild(serverRow);

    const all = document.createElement("section"); all.className = "sl-all";
    const allHead = document.createElement("div"); allHead.className = "sl-section-head"; allHead.innerHTML = `<h2 class="sl-with-label" style="margin:0">ALL:</h2><div class="sl-sort">Sort by: <strong>BY ONLINE</strong><span class="sl-chevron">⌄</span></div>`; all.appendChild(allHead);
    const allRow = document.createElement("div"); allRow.className = "sl-all-row"; allRow.appendChild(makeAllServer()); all.appendChild(allRow); body.appendChild(all);

    const hint = document.createElement("p"); hint.className = "sl-hint"; hint.textContent = "Tap your character to enter Port Harcourt RP."; body.appendChild(hint);
    l.appendChild(body);

    l.querySelector("#slRules")?.addEventListener("click", () => view.querySelector(".nrs-rules-button")?.click());
    l.querySelector("#slBack")?.addEventListener("click", () => view.querySelector(".nrs-lobby-back")?.click());
  }

  function sync() { if (syncing) return; syncing = true; try { render(); } finally { syncing = false; } }
  const observer = new MutationObserver(sync);
  observer.observe(view, { childList:true, subtree:true, attributes:true, attributeFilter:["hidden","disabled"] });
  window.setInterval(sync, 800);
  sync();
})();