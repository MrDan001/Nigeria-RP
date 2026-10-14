(function () {
  "use strict";

  const SESSION = () => window.NRS && window.NRS.session;
  const ROOT_ID = "nrsAccount";
  const VIEW_ID = "nrsCharacterView";
  const LAYER_ID = "nrsFreshLobby";
  let busy = false;
  let lastSignature = "";

  const style = document.createElement("style");
  style.id = "nrsFreshLobbyStyles";
  style.textContent = [
    "#nrsFreshLobby{position:fixed!important;inset:0!important;left:0!important;top:0!important;right:0!important;bottom:0!important;width:100vw!important;height:100vh!important;height:100dvh!important;min-width:0!important;max-width:none!important;margin:0!important;padding:0!important;box-sizing:border-box!important;z-index:2147483000!important;overflow:hidden!important;background:#170923;color:#fff;font-family:system-ui,Arial,sans-serif;line-height:1.35;display:block}",
    "#nrsFreshLobby[hidden]{display:none!important}#nrsFreshLobby *{box-sizing:border-box}",
    "#nrsFreshLobby .shell{position:absolute;inset:0;display:flex;flex-direction:column;width:100%;min-width:0;height:100%;background:radial-gradient(circle at 12% 0%,rgba(150,70,205,.34),transparent 34%),radial-gradient(circle at 90% 80%,rgba(103,40,165,.25),transparent 36%),linear-gradient(135deg,#170923,#311047 52%,#170923)}",
    "#nrsFreshLobby .top{display:flex;flex:0 0 auto;align-items:center;justify-content:space-between;gap:16px;width:100%;min-width:0;padding:14px clamp(16px,4vw,54px);border-bottom:1px solid rgba(255,255,255,.08);background:rgba(10,2,19,.42);backdrop-filter:blur(12px)}",
    "#nrsFreshLobby .brand{display:flex;align-items:center;gap:11px;min-width:0}.nrsFreshLogo{width:44px;height:44px;flex:0 0 44px;border-radius:12px;display:grid;place-items:center;background:linear-gradient(145deg,#ffeaa0,#ca9b31);color:#26112f;font-size:24px;font-weight:950}",
    "#nrsFreshLobby .nrsFreshBrand b{display:block;font-size:14px;letter-spacing:.08em}#nrsFreshLobby .nrsFreshBrand small{display:block;margin-top:4px;color:#c9b7d7;font-size:9px;letter-spacing:.13em}",
    "#nrsFreshLobby .nrsFreshTopRight{display:flex;align-items:center;justify-content:flex-end;gap:16px;color:#efd56d;font-size:10px;font-weight:900}.nrsFreshLogout{border:0;border-bottom:1px solid #efd56d;background:transparent;color:#efd56d;font:inherit;padding:4px 0;cursor:pointer;white-space:nowrap}",
    "#nrsFreshLobby .main{width:100%!important;max-width:none!important;min-width:0;flex:1 1 auto;min-height:0;margin:0!important;padding:clamp(18px,3.5vh,36px) clamp(16px,3.5vw,48px) 24px;overflow:auto;scrollbar-width:thin}",
    "#nrsFreshLobby .nrsFreshKicker{margin:0 0 8px;color:#d3bee2;font-size:11px;font-weight:850;letter-spacing:.17em}#nrsFreshLobby .nrsFreshTitle{margin:0;font-size:clamp(27px,3vw,42px);line-height:1.02;text-transform:uppercase;letter-spacing:-.035em}",
    "#nrsFreshLobby .nrsFreshCopy{max-width:760px;margin:10px 0 0;color:#d5c7df;font-size:13px;line-height:1.5}#nrsFreshLobby .nrsFreshSummary{display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;margin:24px 0 12px;color:#d8c7e5;font-size:11px}#nrsFreshLobby .nrsFreshSummary b{color:#efd56d}",
    "#nrsFreshLobby .nrsFreshGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));align-items:stretch;gap:16px;width:100%}",
    "#nrsFreshLobby .nrsFreshCard,#nrsFreshLobby .nrsFreshEmpty{min-width:0;min-height:390px;border:1px solid rgba(229,202,255,.2);border-radius:16px;overflow:hidden;background:linear-gradient(145deg,rgba(91,44,137,.64),rgba(39,18,67,.72));box-shadow:0 18px 45px rgba(3,0,10,.2)}",
    "#nrsFreshLobby .nrsFreshCard{display:flex;flex-direction:column;cursor:pointer;transition:border-color .16s,transform .16s}#nrsFreshLobby .nrsFreshCard:hover{transform:translateY(-2px);border-color:#efd56d}",
    "#nrsFreshLobby .nrsFreshHead{display:flex;justify-content:space-between;gap:8px;padding:12px 14px;color:#d9c9e5;font-size:9px;font-weight:850;letter-spacing:.1em}#nrsFreshLobby .nrsFreshLevel{color:#efd56d}",
    "#nrsFreshLobby .nrsFreshAvatar{height:clamp(125px,25vh,220px);flex:0 0 auto;margin:0 12px;border-radius:10px;display:grid;place-items:end center;overflow:hidden;background:linear-gradient(150deg,rgba(144,91,190,.35),rgba(45,23,79,.3));border:1px solid rgba(255,255,255,.08)}#nrsFreshLobby .nrsFreshAvatar svg{width:min(100%,230px);height:100%;display:block}",
    "#nrsFreshLobby .nrsFreshInfo{padding:14px 15px 0}#nrsFreshLobby .nrsFreshName{overflow-wrap:anywhere;font-size:17px;font-weight:850}#nrsFreshLobby .nrsFreshMeta{margin-top:5px;color:#cbb9d8;font-size:10px;text-transform:uppercase}",
    "#nrsFreshLobby .nrsFreshMoney{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}#nrsFreshLobby .nrsFreshChip{padding:6px 8px;border:1px solid rgba(255,255,255,.1);border-radius:7px;background:rgba(8,2,15,.2);color:#d8c7e5;font-size:9px}#nrsFreshLobby .nrsFreshChip b{color:#f4e5a4}",
    "#nrsFreshLobby .nrsFreshEnter{margin:auto 14px 14px;min-height:44px;border:1px solid #f1d76f;border-radius:9px;background:linear-gradient(#f3d86e,#c89b32);color:#25112d;font-size:10px;font-weight:950;letter-spacing:.08em;cursor:pointer;touch-action:manipulation}#nrsFreshLobby .nrsFreshEnter:disabled{opacity:.55;cursor:wait}",
    "#nrsFreshLobby .nrsFreshEmpty{display:flex;flex-direction:column;justify-content:center;align-items:center;border-style:dashed;padding:24px;text-align:center;color:#bca7cd}#nrsFreshLobby .nrsFreshEmpty b{color:#e3d4ee}#nrsFreshLobby .nrsFreshEmpty span{margin:8px 0 14px;font-size:10px}",
    "#nrsFreshLobby .nrsFreshButton{min-height:40px;padding:0 14px;border-radius:9px;border:1px solid #efd56d;background:transparent;color:#efd56d;font-size:10px;font-weight:900;cursor:pointer;touch-action:manipulation}#nrsFreshLobby .nrsFreshBottom{display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin-top:16px}#nrsFreshLobby .nrsFreshStatus{min-height:18px;color:#e5d5ef;font-size:11px;overflow-wrap:anywhere}",
    "#nrsFreshLobby .nrsFreshPanel{margin-top:14px;padding:16px;border:1px solid rgba(255,255,255,.12);border-radius:12px;background:rgba(8,2,15,.25)}#nrsFreshLobby .nrsFreshPanel[hidden]{display:none!important}#nrsFreshLobby .nrsFreshPanel label{display:block;color:#ddd0e7;font-size:10px;font-weight:800}",
    "#nrsFreshLobby .nrsFreshPanel input{display:block;width:100%;height:44px;margin-top:7px;border:1px solid rgba(255,255,255,.14);border-radius:8px;background:#0d0615;color:#fff;padding:0 12px;font:inherit}#nrsFreshLobby .nrsFreshActions{display:flex;flex-wrap:wrap;gap:8px;margin-top:9px}#nrsFreshLobby .nrsFreshActions button{min-height:38px;padding:0 12px;border-radius:8px;font-size:10px;font-weight:900;cursor:pointer}#nrsFreshLobby .nrsFreshSubmit{border:1px solid #efd56d;background:#d5aa3f;color:#21102b}#nrsFreshLobby .nrsFreshCancel{border:1px solid rgba(255,255,255,.16);background:transparent;color:#ddd0e7}",
    "@media(max-width:900px){#nrsFreshLobby .nrsFreshGrid{grid-template-columns:repeat(2,minmax(0,1fr))}#nrsFreshLobby .nrsFreshCard,#nrsFreshLobby .nrsFreshEmpty{min-height:340px}#nrsFreshLobby .nrsFreshAvatar{height:clamp(110px,23vh,180px)}}",
    "@media(max-width:560px){#nrsFreshLobby .top{gap:10px;padding:10px 12px}#nrsFreshLobby .nrsFreshTopRight span{display:none}#nrsFreshLobby .nrsFreshBrand b{font-size:11px}#nrsFreshLobby .nrsFreshBrand small{font-size:7px}#nrsFreshLobby .nrsFreshLogo{width:36px;height:36px;flex-basis:36px}#nrsFreshLobby .main{padding:16px 12px 20px}#nrsFreshLobby .nrsFreshGrid{grid-template-columns:1fr}#nrsFreshLobby .nrsFreshCard,#nrsFreshLobby .nrsFreshEmpty{min-height:340px}#nrsFreshLobby .nrsFreshAvatar{height:190px}#nrsFreshLobby .nrsFreshTitle{font-size:27px}}",
    "@media(max-height:520px) and (min-width:561px){#nrsFreshLobby .main{padding-top:14px}#nrsFreshLobby .nrsFreshSummary{margin-top:14px}#nrsFreshLobby .nrsFreshCard,#nrsFreshLobby .nrsFreshEmpty{min-height:310px}#nrsFreshLobby .nrsFreshAvatar{height:140px}}"
  ].join("\n");
  document.head.appendChild(style);

  const esc = value => String(value == null ? "" : value).replace(/[&<>"']/g, ch => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[ch]));
  const money = value => Number(value || 0).toLocaleString("en-NG");
  const fallbackAvatar = '<svg viewBox="0 0 240 300" aria-hidden="true"><ellipse cx="120" cy="286" rx="78" ry="12" fill="#12091d" opacity=".35"/><path d="M43 300c5-77 38-113 77-113s72 36 77 113" fill="#33214d"/><path d="M87 155h66v50c-14 20-52 20-66 0z" fill="#8f6348"/><ellipse cx="120" cy="92" rx="48" ry="61" fill="#a97855"/><path d="M72 91c-4-42 14-69 47-73 37-4 61 21 53 77l-12-27c-25 4-50-9-67-22-1 20-8 34-21 45z" fill="#17131a"/><path d="M84 105q12 9 23 0m26 0q12 9 23 0" fill="none" stroke="#35201b" stroke-width="4" stroke-linecap="round"/><path d="M103 133q17 12 34 0" fill="none" stroke="#5e3328" stroke-width="4" stroke-linecap="round"/></svg>';

  let layer = document.getElementById(LAYER_ID);
  if (!layer) {
    layer = document.createElement("div");
    layer.id = LAYER_ID;
    layer.hidden = true;
    document.body.appendChild(layer);
  }

  function status(message) {
    const node = layer.querySelector(".nrsFreshStatus");
    if (node) node.textContent = message || "";
  }

  function send(message) {
    const session = SESSION();
    if (!session || !session.ws || session.ws.readyState !== WebSocket.OPEN) return false;
    try {
      session.ws.send(JSON.stringify(message));
      return true;
    } catch (_) {
      return false;
    }
  }

  function setEntryButtons(disabled) {
    layer.querySelectorAll(".nrsFreshEnter").forEach(button => { button.disabled = disabled; });
  }

  function selectCharacter(characterId) {
    if (busy) return;
    const session = SESSION();
    if (!session || !session.token || !session.ws || session.ws.readyState !== WebSocket.OPEN) {
      status("Your game connection is reconnecting. Please wait a moment, then try again.");
      return;
    }

    busy = true;
    setEntryButtons(true);
    status("Entering the city…");

    const socket = session.ws;
    let settled = false;
    let timeout = null;

    function finish(kind, message) {
      if (settled) return;
      settled = true;
      if (timeout) clearTimeout(timeout);
      socket.removeEventListener("message", onMessage);
      if (kind === "success") {
        busy = false;
        layer.hidden = true;
        const root = document.getElementById(ROOT_ID);
        if (root) root.hidden = true;
        ["c", "hud"].forEach(id => {
          const element = document.getElementById(id);
          if (element) element.style.visibility = "visible";
        });
        return;
      }
      busy = false;
      setEntryButtons(false);
      status(message || "The game server could not load this character. Please try again.");
    }

    function onMessage(event) {
      let message;
      try { message = JSON.parse(event.data); } catch (_) { return; }
      if (message.type === "authOk") finish("success");
      else if (message.type === "authError") finish("error", message.message || message.code || "The server rejected this character. Please try again.");
      else if (message.type === "authCharacters") finish("error", message.message || "The server returned to character selection instead of entering the city.");
    }

    socket.addEventListener("message", onMessage);
    timeout = setTimeout(() => {
      finish("error", "The server did not confirm entry within 15 seconds. Check the connection and tap ENTER CITY again.");
    }, 15000);

    if (!send({ type: "selectCharacter", token: session.token, characterId: characterId })) {
      finish("error", "Could not send your selection because the game server connection closed. Please try again.");
    }
  }

  function createCharacter() {
    const session = SESSION();
    const input = layer.querySelector("#nrsFreshName");
    const username = String(input ? input.value : "").trim();
    if (!/^[A-Za-z]+_[A-Za-z]+$/.test(username)) {
      status("Use the format Firstname_lastname, with letters only.");
      if (input) input.focus();
      return;
    }
    if (!session || !session.token || !session.ws || session.ws.readyState !== WebSocket.OPEN) {
      status("Your game connection is reconnecting. Please try again in a moment.");
      return;
    }

    status("Creating your character…");
    const socket = session.ws;
    let settled = false;
    let timeout = null;

    function finish(message) {
      if (settled) return;
      settled = true;
      if (timeout) clearTimeout(timeout);
      socket.removeEventListener("message", onMessage);
      status(message || "Character request completed.");
    }

    function onMessage(event) {
      let message;
      try { message = JSON.parse(event.data); } catch (_) { return; }
      if (message.type === "authCharacters") {
        lastSignature = "";
        finish(message.message || "Character created. Select ENTER CITY to continue.");
        refresh();
      } else if (message.type === "authError") {
        finish(message.message || message.code || "Could not create that character.");
      }
    }

    socket.addEventListener("message", onMessage);
    timeout = setTimeout(() => finish("The server did not confirm character creation. Please try again."), 15000);
    if (!send({ type: "createCharacter", token: session.token, username: username })) {
      finish("Could not send the request because the game connection closed. Please try again.");
    }
  }

  function signature(characters) {
    return (characters || []).map(character =>
      [character.id, character.name, character.level, character.cash, character.bank, character.cityId].join(":")
    ).join("|");
  }

  function build(characters) {
    const emailText = (document.getElementById("nrsCharacterEmail") || {}).textContent || "";
    const email = emailText.replace(/^Signed in as\s*/i, "") || "Citizen";
    const list = (characters || []).map((character, index) => {
      const id = esc(character.id);
      const name = esc(character.name || "Unnamed Citizen");
      const level = esc(character.level || 1);
      const city = esc(character.city || character.cityId || "Port Harcourt").replace(/-/g, " ");
      return '<article class="nrsFreshCard" data-id="' + id + '" tabindex="0" aria-label="Play as ' + name + '">' +
        '<div class="nrsFreshHead"><span>CITIZEN ' + (index + 1) + '</span><span class="nrsFreshLevel">LEVEL ' + level + '</span></div>' +
        '<div class="nrsFreshAvatar">' + fallbackAvatar + '</div>' +
        '<div class="nrsFreshInfo"><div class="nrsFreshName">' + name + '</div><div class="nrsFreshMeta">CITIZEN · ' + city + '</div>' +
        '<div class="nrsFreshMoney"><span class="nrsFreshChip">Cash <b>₦' + money(character.cash) + '</b></span><span class="nrsFreshChip">Bank <b>₦' + money(character.bank) + '</b></span></div></div>' +
        '<button class="nrsFreshEnter" type="button">ENTER CITY</button></article>';
    }).join("");

    const empty = (characters || []).length < 3
      ? '<div class="nrsFreshEmpty"><b>OPEN CITIZEN SLOT</b><span>Create another character with separate money, job and progress.</span><button class="nrsFreshButton" data-act="create">＋ CREATE CHARACTER</button></div>'
      : "";

    layer.innerHTML = '<div class="shell">' +
      '<header class="top"><div class="brand"><div class="nrsFreshLogo">N</div><div class="nrsFreshBrand"><b>NIGERIA ROLEPLAY</b><small>PORT HARCOURT • ONLINE WORLD</small></div></div>' +
      '<div class="nrsFreshTopRight"><span>' + (characters || []).length + ' / 3 CHARACTERS</span><button class="nrsFreshLogout" data-act="logout">USE ANOTHER ACCOUNT</button></div></header>' +
      '<main class="main"><p class="nrsFreshKicker">NIGERIA ROLEPLAY / CITIZEN LOBBY</p><h1 class="nrsFreshTitle">SELECT YOUR CHARACTER</h1>' +
      '<p class="nrsFreshCopy">Choose the citizen you want to bring into the shared Nigeria RP world. Every character keeps their own money, job, home and progress.</p>' +
      '<div class="nrsFreshSummary"><span>Signed in as ' + esc(email) + '</span><b>' + (characters || []).length + ' / 3 CHARACTERS</b></div>' +
      '<section class="nrsFreshGrid">' + list + empty + '</section>' +
      '<div class="nrsFreshBottom"><button class="nrsFreshButton" data-act="create">＋ CREATE NEW CHARACTER</button><span class="nrsFreshStatus" role="status" aria-live="polite"></span></div>' +
      '<div class="nrsFreshPanel" id="nrsFreshPanel" hidden><label>New character name<input id="nrsFreshName" maxlength="31" placeholder="Firstname_lastname" autocomplete="off"></label>' +
      '<div class="nrsFreshActions"><button class="nrsFreshSubmit" data-act="create-submit">CREATE CHARACTER</button><button class="nrsFreshCancel" data-act="cancel">CANCEL</button></div></div></main></div>';

    layer.querySelectorAll(".nrsFreshCard").forEach(card => {
      const button = card.querySelector(".nrsFreshEnter");
      function enter(event) {
        if (event) event.stopPropagation();
        selectCharacter(card.dataset.id);
      }
      button.addEventListener("click", enter);
      card.addEventListener("click", enter);
      card.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          enter(event);
        }
      });
    });

    layer.querySelectorAll('[data-act="create"]').forEach(button => {
      button.addEventListener("click", () => {
        const panel = layer.querySelector("#nrsFreshPanel");
        if (panel) panel.hidden = false;
        const input = layer.querySelector("#nrsFreshName");
        if (input) input.focus();
      });
    });
    const submit = layer.querySelector('[data-act="create-submit"]');
    if (submit) submit.addEventListener("click", createCharacter);
    const cancel = layer.querySelector('[data-act="cancel"]');
    if (cancel) cancel.addEventListener("click", () => {
      const panel = layer.querySelector("#nrsFreshPanel");
      if (panel) panel.hidden = true;
      status("Choose an existing character or create another one.");
    });
    const logout = layer.querySelector('[data-act="logout"]');
    if (logout) logout.addEventListener("click", () => {
      const switchButton = document.getElementById("nrsSwitchAccount");
      if (switchButton) switchButton.click();
      else location.reload();
    });
  }

  function refresh() {
    const root = document.getElementById(ROOT_ID);
    const view = document.getElementById(VIEW_ID);
    const session = SESSION();
    const shouldShow = !!(root && !root.hidden && view && !view.hidden && session && session.accountReady);
    if (!shouldShow) {
      // Do not rewrite the same attribute from inside a MutationObserver.
      // Repeated hidden-attribute mutations can spin the page and make it unresponsive.
      if (!layer.hidden) layer.hidden = true;
      if (root && root.hidden) busy = false;
      return;
    }
    const characters = Array.isArray(session.characters) ? session.characters : [];
    const nextSignature = signature(characters) + "::" + ((document.getElementById("nrsCharacterEmail") || {}).textContent || "");
    if (nextSignature !== lastSignature) {
      lastSignature = nextSignature;
      build(characters);
    }
    if (layer.hidden) layer.hidden = false;
  }

  const observer = new MutationObserver(refresh);
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["hidden", "class"]
  });
  window.addEventListener("pageshow", () => {
    busy = false;
    lastSignature = "";
    refresh();
  });
  window.addEventListener("resize", refresh);
  refresh();
  setInterval(refresh, 300);
})();