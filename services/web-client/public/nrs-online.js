(function () {
  "use strict";

  const SESSION_KEY = "nrs_rp_session_v2";
  // Remove the old overlay's token so it cannot interfere with the new flow.
  try {
    localStorage.removeItem("nrs_session_token");
    localStorage.removeItem(SESSION_KEY); // tokens now live in sessionStorage only
  } catch {}

  const N = window.NRS = window.NRS || {};
  const S = N.session = {
    ws: null,
    open: false,
    authed: false,
    id: null,
    name: "",
    level: 1,
    token: readToken(),
    initialConnection: true,
    resume: false,
    seq: 0,
    remotes: new Map(),
    target: null,
    pending: [],
    jobCb: null,
    fuelCb: null,
    garageSpawnCb: null,
    carparkSyncAt: 0,
    posAt: 0,
    posX: 1e9,
    posZ: 1e9,
    busy: false,
    online: 0
  };

  const $ = (id) => document.getElementById(id);

  function readToken() {
    try { return sessionStorage.getItem(SESSION_KEY) || ""; } catch { return ""; }
  }

  function writeToken(token) {
    S.token = token || "";
    try {
      if (S.token) sessionStorage.setItem(SESSION_KEY, S.token);
      else sessionStorage.removeItem(SESSION_KEY);
    } catch {}
  }

  function setVisible(show) {
    for (const id of ["c", "hud", "start"]) {
      const el = $(id);
      if (el) el.style.visibility = show ? "visible" : "hidden";
    }
  }

  /* ---------- one and only account UI ---------- */
  const style = document.createElement("style");
  style.textContent = `
    #nrsAccount{
      position:fixed;inset:0;z-index:99999;display:grid;place-items:center;
      padding:18px;box-sizing:border-box;background:rgba(2,7,13,.88);
      backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
      font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
      color:#fff;touch-action:manipulation
    }
    #nrsAccount[hidden]{display:none}
    #nrsAccount .card{
      width:min(420px,100%);max-height:calc(100vh - 36px);overflow:auto;
      box-sizing:border-box;padding:24px 22px 20px;
      border:1px solid rgba(255,255,255,.13);border-radius:22px;
      background:linear-gradient(180deg,#101b2a 0%,#08121f 100%);
      box-shadow:0 28px 90px rgba(0,0,0,.55)
    }
    #nrsAccount .brand{display:flex;align-items:center;gap:11px}
    #nrsAccount .logo{
      width:45px;height:45px;border-radius:11px;background:#1e91f3;
      display:grid;place-items:center;font-weight:900;font-size:25px;flex:none
    }
    #nrsAccount .brand strong{display:block;font-size:15px;letter-spacing:.06em}
    #nrsAccount .brand small{display:block;margin-top:2px;font-size:9px;letter-spacing:.1em;opacity:.58}
    #nrsAccount .eyebrow{margin-top:22px;font-size:9px;font-weight:800;letter-spacing:.18em;color:#8da0b5}
    #nrsAccount h1{margin:7px 0 6px;font-size:27px;line-height:1.08}
    #nrsAccount .copy{margin:0;color:rgba(255,255,255,.68);font-size:12px;line-height:1.45}
    #nrsAccount .tabs{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:18px 0 16px}
    #nrsAccount .tab{
      min-height:44px;border:1px solid rgba(255,255,255,.12);border-radius:10px;
      background:rgba(255,255,255,.045);color:#fff;font-weight:900;font-size:10px;
      letter-spacing:.04em;cursor:pointer;pointer-events:auto;touch-action:manipulation;
      -webkit-tap-highlight-color:transparent
    }
    #nrsAccount .tab.active{background:#1d8ef0;border-color:#50b0ff;box-shadow:0 8px 22px rgba(29,142,240,.2)}
    #nrsAccount form{display:grid;gap:12px}
    #nrsAccount .field{display:grid;gap:6px}
    #nrsAccount .field>span{font-size:10px;font-weight:800;color:#d7e0e9}
    #nrsAccount .inputWrap{position:relative}
    #nrsAccount input{
      display:block;width:100%;height:48px;box-sizing:border-box;padding:0 48px 0 13px;
      border-radius:10px;border:1px solid rgba(255,255,255,.14);
      background:#07111d;color:#fff;font:inherit;font-size:13px;outline:0;
      pointer-events:auto;touch-action:manipulation;-webkit-appearance:none
    }
    #nrsAccount input:focus{border-color:#4aa9ff;box-shadow:0 0 0 3px rgba(74,169,255,.12)}
    #nrsAccount input::placeholder{color:rgba(255,255,255,.3)}
    #nrsAccount .eye{
      position:absolute;right:5px;top:50%;transform:translateY(-50%);
      width:38px;height:38px;border:0;border-radius:8px;background:transparent;
      color:#aebfd0;display:grid;place-items:center;cursor:pointer;pointer-events:auto;
      touch-action:manipulation;-webkit-tap-highlight-color:transparent
    }
    #nrsAccount .eye:active{background:rgba(255,255,255,.08)}
    #nrsAccount .eye svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
    #nrsAccount .error{min-height:18px;color:#ff98a6;font-size:10px;line-height:1.35}
    #nrsAccount .hint{font-size:9px;color:rgba(255,255,255,.42);line-height:1.3}
    #nrsAccount .submit{
      width:100%;min-height:48px;border:0;border-radius:10px;
      background:linear-gradient(180deg,#259af5,#177bd0);color:#fff;
      font-weight:900;font-size:11px;letter-spacing:.05em;cursor:pointer;
      pointer-events:auto;touch-action:manipulation;box-shadow:0 8px 20px rgba(29,142,240,.18)
    }
    #nrsAccount .submit:disabled{opacity:.52;cursor:wait}
    #nrsAccount .status{text-align:center;margin-top:11px;min-height:18px;color:rgba(255,255,255,.45);font-size:9px}
    @media(max-width:480px){
      #nrsAccount{padding:10px}
      #nrsAccount .card{width:100%;padding:19px 16px 16px;border-radius:18px}
      #nrsAccount h1{font-size:24px}
      #nrsAccount .copy{font-size:11px}
    }
  `;
  document.head.appendChild(style);

  const auth = document.createElement("div");
  auth.id = "nrsAccount";
  auth.innerHTML = `
    <div class="card">
      <div class="brand">
        <div class="logo">N</div>
        <div><strong>NIGERIA ROLEPLAY</strong><small>PORT HARCOURT • ONLINE WORLD</small></div>
      </div>

      <div class="eyebrow">PLAYER ACCOUNT</div>
      <h1 id="nrsAuthTitle">Welcome back</h1>
      <p class="copy" id="nrsAuthCopy">Log in to load your character, money, jobs and progress.</p>

      <div class="tabs" role="tablist" aria-label="Account access">
        <button class="tab active" id="nrsLogin" type="button" role="tab" aria-selected="true">LOG IN</button>
        <button class="tab" id="nrsReg" type="button" role="tab" aria-selected="false">CREATE ACCOUNT</button>
      </div>

      <form id="nrsForm" autocomplete="on">
        <label class="field">
          <span>Email</span>
          <div class="inputWrap">
            <input id="nrsEmail" name="email" type="email" autocomplete="email" maxlength="160" placeholder="Enter your email address" required>
          </div>
        </label>

        <label class="field" id="nrsUsernameWrap" hidden>
          <span>Username</span>
          <div class="inputWrap">
            <input id="nrsUser" name="username" autocomplete="username" maxlength="31" placeholder="Firstname_lastname">
          </div>
          <div class="hint">Required format: Firstname_lastname — letters only on both sides of the underscore.</div>
        </label>

        <label class="field">
          <span>Password</span>
          <div class="inputWrap">
            <input id="nrsPass" name="password" type="password" minlength="6" autocomplete="current-password" placeholder="Enter your password" required>
            <button class="eye" id="nrsPassEye" type="button" aria-label="Show password" aria-pressed="false">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.2-5 9.5-5 9.5 5 9.5 5-3.2 5-9.5 5-9.5-5-9.5-5Z"/><circle cx="12" cy="12" r="2.4"/></svg>
            </button>
          </div>
        </label>

        <label class="field" id="nrsConfirmWrap" hidden>
          <span>Repeat password</span>
          <div class="inputWrap">
            <input id="nrsConfirm" name="confirmPassword" type="password" minlength="6" autocomplete="new-password" placeholder="Repeat your password">
            <button class="eye" id="nrsConfirmEye" type="button" aria-label="Show password" aria-pressed="false">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.2-5 9.5-5 9.5 5 9.5 5-3.2 5-9.5 5-9.5-5-9.5-5Z"/><circle cx="12" cy="12" r="2.4"/></svg>
            </button>
          </div>
        </label>

        <div class="error" id="nrsError" role="alert" aria-live="polite"></div>
        <button class="submit" id="nrsSubmit" type="submit">LOG IN & ENTER</button>
      </form>

      <div class="status" id="nrsStatus">Connecting securely to the game server…</div>
    </div>
  `;
  document.body.appendChild(auth);

  const status = (message) => { $("nrsStatus").textContent = message || ""; };
  let registerMode = false;

  function setMode(isRegister) {
    registerMode = isRegister;

    const usernameWrap = $("nrsUsernameWrap");
    const usernameInput = $("nrsUser");
    const confirmWrap = $("nrsConfirmWrap");
    const confirmInput = $("nrsConfirm");

    $("nrsLogin").classList.toggle("active", !isRegister);
    $("nrsReg").classList.toggle("active", isRegister);
    $("nrsLogin").setAttribute("aria-selected", String(!isRegister));
    $("nrsReg").setAttribute("aria-selected", String(isRegister));

    // Explicitly control visibility and disabled state so LOGIN can only show
    // Email + Password and the Create Account form remains unchanged.
    usernameWrap.hidden = !isRegister;
    usernameWrap.style.display = isRegister ? "grid" : "none";
    usernameInput.required = isRegister;
    usernameInput.disabled = !isRegister;
    confirmWrap.hidden = !isRegister;
    confirmWrap.style.display = isRegister ? "grid" : "none";
    confirmInput.required = isRegister;
    confirmInput.disabled = !isRegister;

    $("nrsEmail").autocomplete = "email";
    $("nrsPass").autocomplete = isRegister ? "new-password" : "current-password";
    $("nrsAuthTitle").textContent = isRegister ? "Create your citizen account" : "Welcome back";
    $("nrsAuthCopy").textContent = isRegister
      ? "Create one account with your email and your Firstname_lastname citizen name."
      : "Log in with the email linked to your citizen account.";
    $("nrsSubmit").textContent = isRegister ? "CREATE ACCOUNT" : "LOG IN & ENTER";
    $("nrsError").textContent = "";
  }

  function togglePassword(input, button) {
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    button.setAttribute("aria-label", show ? "Hide password" : "Show password");
    button.setAttribute("aria-pressed", String(show));
  }

  $("nrsLogin").addEventListener("click", () => setMode(false));
  $("nrsReg").addEventListener("click", () => setMode(true));
  $("nrsPassEye").addEventListener("click", () => togglePassword($("nrsPass"), $("nrsPassEye")));
  $("nrsConfirmEye").addEventListener("click", () => togglePassword($("nrsConfirm"), $("nrsConfirmEye")));

  // Start in LOGIN mode explicitly. Create Account is opt-in via its tab.
  setMode(false);

  function send(message) {
    if (S.ws?.readyState === WebSocket.OPEN) S.ws.send(JSON.stringify(message));
  }

  function online(count) {
    S.online = Math.max(0, Number(count) || 0);
    const exact = $("online-count");
    if (exact) exact.textContent = String(S.online);

    const top = $("top");
    if (top && !exact) {
      const span = [...top.querySelectorAll("span")].find((el) => el.textContent.includes("online"));
      if (span) span.innerHTML = "👤 <b>" + S.online + "</b> online";
    }
  }

  function syncAccount(player) {
    S.id = player.id;
    S.name = String(player.name || "Player");
    S.level = Math.max(1, Math.floor(Number(player.level) || 1));
    N.playerIdentity = { id: S.id, name: S.name, level: S.level };
    S.authed = true;
    writeToken(S.token);
    window.dispatchEvent(new CustomEvent("nrs-player-identity", { detail: N.playerIdentity }));

    cash = Number(player.cash) || 0;
    N.cash = cash;
    bank = Number(player.bank) || 0;
    hp = Number(player.hp) || 100;
    hunger = Number(player.hunger) || 82;
    job = player.job || null;

    // Server-owned "life" state (job rank, home, prepaid rent, cars). Read-only on the client.
    N.life = player.life || null;
    N.today = player.today || "";

    // Restore each car's saved fuel (cars are matched by their fixed id, e.g. c0..c4).
    const savedFuel = player.fuel || {};
    for (const car of cars) {
      if (car.kind === "t" || !car.id) continue;
      if (typeof savedFuel[car.id] === "number") car.fuel = savedFuel[car.id];
    }

    for (const key of Object.keys(inv)) delete inv[key];
    Object.assign(inv, player.inventory || {});

    pos.set(Number(player.x) || 0, 0, Number(player.z) || 24);
    face = Number(player.yaw) || Math.PI;

    const level = $("top")?.querySelector(".lv");
    if (level) level.textContent = "LEVEL " + S.level;

    if ($("cash")) $("cash").textContent = Math.round(cash).toLocaleString();
    if ($("hpv")) $("hpv").textContent = String(Math.round(hp));
    if ($("hgv")) $("hgv").textContent = String(Math.round(hunger));
    if ($("hpb")) $("hpb").style.width = Math.round(hp) + "%";
    if ($("hgb")) $("hgb").style.width = Math.round(hunger) + "%";

    const nameInput = $("player-name");
    if (nameInput) nameInput.value = player.name;
    const identity = $("identity-name");
    if (identity) identity.textContent = player.name;

    auth.hidden = true;
    setVisible(true);
  }

  // Always-visible, camera-facing multiplayer nameplate. It works on touch screens too
  // (no mouse-hover required) and refreshes when the server reports a new level/name.
  function tag(username, level = 1) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const label = { username: String(username || "Player"), level: Math.max(1, Math.floor(Number(level) || 1)) };
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // A soft outline plus a dark translucent card keeps the text legible over bright scenery.
      const x = 12, y = 8, w = 488, h = 108, r = 18;
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.beginPath();
      ctx.roundRect(x + 2, y + 3, w, h, r);
      ctx.fill();
      ctx.fillStyle = "rgba(6,16,27,0.88)";
      ctx.strokeStyle = "rgba(142,201,231,0.78)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      ctx.fill();
      ctx.stroke();

      // Username is the primary line; shrink long names instead of allowing them to clip.
      const name = label.username;
      let fontSize = 34;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "700 " + fontSize + "px system-ui, sans-serif";
      while (fontSize > 20 && ctx.measureText(name).width > 440) {
        fontSize -= 2;
        ctx.font = "700 " + fontSize + "px system-ui, sans-serif";
      }
      ctx.fillStyle = "#ffffff";
      ctx.fillText(name, 256, 48, 444);

      const levelText = "LEVEL " + label.level;
      ctx.font = "800 19px system-ui, sans-serif";
      const pillW = Math.max(94, ctx.measureText(levelText).width + 34);
      const pillX = (512 - pillW) / 2;
      ctx.fillStyle = "rgba(32,139,178,0.25)";
      ctx.beginPath();
      ctx.roundRect(pillX, 78, pillW, 29, 14);
      ctx.fill();
      ctx.strokeStyle = "rgba(112,219,245,0.45)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "#92ebff";
      ctx.fillText(levelText, 256, 93, pillW - 14);
      texture.needsUpdate = true;
    };
    draw();

    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false
    }));
    sprite.scale.set(3.25, .82, 1);
    sprite.position.y = 2.55;
    sprite.renderOrder = 50;
    sprite.userData.name = label.username;
    sprite.userData.level = label.level;
    sprite.userData.setPlayerLabel = (nextUsername, nextLevel) => {
      const nextName = String(nextUsername || "Player");
      const parsedLevel = Math.max(1, Math.floor(Number(nextLevel) || 1));
      if (label.username === nextName && label.level === parsedLevel) return;
      label.username = nextName;
      label.level = parsedLevel;
      sprite.userData.name = nextName;
      sprite.userData.level = parsedLevel;
      draw();
    };
    sprite.userData.disposeLabel = () => {
      texture.dispose();
      sprite.material.dispose();
    };
    return sprite;
  }

  function remote(player) {
    if (!player || !player.id || player.id === S.id) return;

    let group = S.remotes.get(player.id);
    if (!group) {
      group = new THREE.Group();
      group.add(model.clone(true));
      const playerName = player.name || "Player";
      const playerLevel = Math.max(1, Math.floor(Number(player.level) || 1));
      const nameplate = tag(playerName, playerLevel);
      nameplate.userData.playerNameplate = true;
      group.add(nameplate);
      group.position.set(Number(player.x) || 0, 0, Number(player.z) || 0);
      group.rotation.y = Number(player.yaw) || 0;
      group.userData = {
        target: { x: Number(player.x) || 0, z: Number(player.z) || 0, yaw: Number(player.yaw) || 0 },
        name: playerName,
        level: playerLevel
      };
      scene.add(group);
      S.remotes.set(player.id, group);
      return;
    }

    const nextName = player.name || group.userData.name || "Player";
    const nextLevel = Math.max(1, Math.floor(Number(player.level) || 1));
    group.userData.name = nextName;
    group.userData.level = nextLevel;
    const labelSprite = group.children.find((child) => child.userData?.playerNameplate);
    labelSprite?.userData?.setPlayerLabel?.(nextName, nextLevel);
    group.userData.target = {
      x: Number(player.x) || 0,
      z: Number(player.z) || 0,
      yaw: Number(player.yaw) || 0
    };
  }

  function remove(id) {
    const group = S.remotes.get(id);
    if (group) {
      scene.remove(group);
      for (const child of group.children) {
        child.userData?.disposeLabel?.();
      }
      S.remotes.delete(id);
    }
  }

  function snapshot(players, authoritativeOnlineCount = null) {
    const seen = new Set();
    for (const player of players || []) {
      if (!player?.id) continue;
      seen.add(player.id);
      if (player.id !== S.id) {
        remote(player);
      }
    }

    for (const id of [...S.remotes.keys()]) {
      if (!seen.has(id)) remove(id);
    }

    online(authoritativeOnlineCount ?? (players || []).length);
  }

  function connect() {
    if (S.ws && [WebSocket.OPEN, WebSocket.CONNECTING].includes(S.ws.readyState)) return;

    let socket;
    try {
      socket = new WebSocket(
        (location.protocol === "https:" ? "wss://" : "ws://") + location.host
      );
    } catch {
      window.setTimeout(connect, 1500);
      return;
    }

    S.ws = socket;

    socket.onopen = () => {
      S.open = true;
      $("nrsSubmit").disabled = false;

      S.initialConnection = false;

      // Auto-resume ONLY when a logged-in session was dropped mid-play.
      // Any other connect (fresh load, dropped login screen) stays on the gate.
      if (S.resume && S.token) {
        S.resume = false;
        status("Restoring your account…");
        send({ type: "authResume", token: S.token });
      } else {
        S.resume = false;
        status("Ready — log in or create your citizen account.");
      }
    };

    socket.onmessage = (event) => {
      let message;
      try { message = JSON.parse(event.data); } catch { return; }

      if (message.type === "authOk") {
        writeToken(message.token);
        syncAccount(message.player);
        N.houses = message.houses || [];
        N.workplaces = message.workplaces || [];
        N.factions = message.factions || [];
        N.workplaceState = message.workplaces ? message : null;
        window.dispatchEvent(new CustomEvent("nrs-housing", { detail: { houses: N.houses, life: N.life, cash, today: N.today } }));
        window.dispatchEvent(new CustomEvent("nrs-workplaces", { detail: message }));
        snapshot(message.players || [], message.onlineCount);
        $("nrsError").textContent = "";
        status("Account loaded. Welcome to Port Harcourt.");
        return;
      }

      if (message.type === "authError") {
        if (message.code === "INVALID_SESSION") writeToken("");
        S.authed = false;
        S.id = null;
        S.name = "";
        S.level = 1;
        N.playerIdentity = null;
        window.dispatchEvent(new CustomEvent("nrs-player-identity", { detail: null }));
        auth.hidden = false;
        setVisible(false);
        $("nrsSubmit").disabled = false;
        $("nrsError").textContent = message.message || "Authentication failed. Please try again.";
        status("Please check your details and try again.");
        return;
      }

      if (!S.authed) return;

      if (message.type === "snapshot") {
        snapshot(message.players || [], message.onlineCount);
      } else if (message.type === "playerJoined") {
        if (message.player?.id !== S.id) remote(message.player);
        online(message.onlineCount);
      } else if (message.type === "playerLeft") {
        remove(message.playerId);
        online(message.onlineCount);
      } else if (message.type === "fuelResult") {
        const cb = S.fuelCb;
        S.fuelCb = null;
        if (message.ok) {
          cash = Number(message.cash) || 0;
          N.cash = cash;
          money();
        }
        cb?.(message);
      } else if (message.type === "posCorrect") {
        if (!driving && !inside) {
          pos.set(Number(message.x) || 0, 0, Number(message.z) || 0);
          vel.set(0, 0, 0);
        }
      } else if (message.type === "jobResult") {
        const cb = S.jobCb;
        S.jobCb = null;
        if (message.ok && message.job) job = message.job;
        cb?.(message);
      } else if (message.type === "workplaceState" || message.type === "workplaceResult") {
        N.workplaceState = message;
        N.workplaces = message.workplaces || N.workplaces || [];
        N.factions = message.factions || N.factions || [];
        if (Object.prototype.hasOwnProperty.call(message, "employment")) {
          N.life = { ...(N.life || {}), employment: message.employment };
        }
        if (message.cash !== undefined) {
          cash = Number(message.cash) || 0;
          N.cash = cash;
          money();
        }
        if (message.today) N.today = message.today;
        if (message.type === "workplaceResult" && message.message) sys(message.message);
        window.dispatchEvent(new CustomEvent("nrs-workplaces", { detail: message }));
      } else if (message.type === "lifeState" || message.type === "lifeUpdate") {
        N.life = message.life || N.life;
        N.today = message.today || N.today;
        if (message.type === "lifeUpdate" && message.homeLost) {
          sys("🏚 Your home was lost: the prepaid rent ran out.");
        }
        window.dispatchEvent(new CustomEvent("nrs-life", { detail: { life: N.life, today: N.today, message } }));
      } else if (message.type === "housingState" || message.type === "housingResult") {
        N.houses = message.houses || N.houses || [];
        N.life = message.life || N.life;
        N.today = message.today || N.today;
        if (message.cash !== undefined) { cash = Number(message.cash) || 0; money(); }
        if (message.type === "housingResult" && message.message) sys(message.message);
        window.dispatchEvent(new CustomEvent("nrs-housing", { detail: { ...message, houses: N.houses, life: N.life, cash, today: N.today } }));
      } else if (message.type === "homeInterior") {
        if (!message.ok) window.dispatchEvent(new CustomEvent("nrs-route-error", { detail: message }));
        window.dispatchEvent(new CustomEvent("nrs-home-interior", { detail: message }));
        if (!message.ok && message.message) sys(message.message);
      } else if (message.type === "homeExitResult") {
        if (message.ok) {
          window.dispatchEvent(new CustomEvent("nrs-home-exit", { detail: message }));
        } else {
          window.dispatchEvent(new CustomEvent("nrs-route-error", { detail: message }));
          if (message.message) sys(message.message);
        }
      } else if (message.type === "carparkEnterResult") {
        if (message.ok) {
          N.life = message.life || N.life;
          N.today = message.today || N.today;
          window.dispatchEvent(new CustomEvent("nrs-life", { detail: { life: N.life, today: N.today, message } }));
          window.dispatchEvent(new CustomEvent("nrs-carpark-enter", { detail: message }));
        } else {
          window.dispatchEvent(new CustomEvent("nrs-route-error", { detail: message }));
          if (message.message) sys(message.message);
        }
      } else if (message.type === "carparkVehicleSpawnResult") {
        const cb = S.garageSpawnCb;
        S.garageSpawnCb = null;
        cb?.(message);
        if (!message.ok && message.message) sys(message.message);
      } else if (message.type === "carparkExitResult") {
        if (message.ok) {
          N.life = message.life || N.life;
          N.today = message.today || N.today;
          window.dispatchEvent(new CustomEvent("nrs-life", { detail: { life: N.life, today: N.today, message } }));
          window.dispatchEvent(new CustomEvent("nrs-carpark-exit", { detail: message }));
        } else {
          window.dispatchEvent(new CustomEvent("nrs-route-error", { detail: message }));
          if (message.message) sys(message.message);
        }
      } else if (message.type === "carparkFootExitResult") {
        if (message.ok) {
          N.life = message.life || N.life;
          N.today = message.today || N.today;
          window.dispatchEvent(new CustomEvent("nrs-life", { detail: { life: N.life, today: N.today, message } }));
          window.dispatchEvent(new CustomEvent("nrs-carpark-foot-exit", { detail: message }));
        } else {
          window.dispatchEvent(new CustomEvent("nrs-route-error", { detail: message }));
          if (message.message) sys(message.message);
        }
      } else if (message.type === "parkingResult") {
        N.life = message.life || N.life;
        if (message.message) sys(message.message);
        window.dispatchEvent(new CustomEvent("nrs-life", { detail: { life: N.life, today: N.today, message } }));
      } else if (message.type === "respawnResult") {
        N.life = message.life || N.life;
        if (message.message) sys(message.message);
        window.dispatchEvent(new CustomEvent("nrs-respawn", { detail: message }));
        window.dispatchEvent(new CustomEvent("nrs-life", { detail: { life: N.life, today: N.today, message } }));
      } else if (message.type === "walletResult") {
        const request = S.pending.shift();
        S.busy = false;
        if (message.ok) {
          cash = Number(message.cash) || 0;
          bank = Number(message.bank) || 0;
          N.cash = cash;
          money();
        }
        request?.cb?.(message);
        drain();
      }
    };

    socket.onclose = () => {
      S.resume = S.authed; // was a real session live when the link dropped?
      S.open = false;
      S.authed = false;
      S.id = null;
      S.name = "";
      S.level = 1;
      N.playerIdentity = null;
      window.dispatchEvent(new CustomEvent("nrs-player-identity", { detail: null }));

      for (const id of [...S.remotes.keys()]) remove(id);

      setVisible(false);
      auth.hidden = false;
      $("nrsSubmit").disabled = true;
      status("Connection lost. Reconnecting…");
      window.setTimeout(connect, 1500);
    };

    socket.onerror = () => {
      status("Network error. Retrying…");
    };
  }

  $("nrsForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const email = $("nrsEmail").value.trim();
    const username = $("nrsUser").value.trim();
    const password = $("nrsPass").value;
    const confirm = $("nrsConfirm").value;

    $("nrsError").textContent = "";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      $("nrsError").textContent = "Enter a valid email address.";
      return;
    }

    if (registerMode && !/^[A-Za-z]+_[A-Za-z]+$/.test(username)) {
      $("nrsError").textContent = "Username must be exactly Firstname_lastname, for example Dan_mccoll.";
      return;
    }

    if (registerMode && password !== confirm) {
      $("nrsError").textContent = "Passwords do not match.";
      return;
    }

    if (!S.open) {
      status("Connecting to the game server…");
      connect();
      return;
    }

    $("nrsSubmit").disabled = true;
    status(registerMode ? "Creating your account…" : "Logging you in…");

    send({
      type: registerMode ? "authRegister" : "authLogin",
      email,
      ...(registerMode ? { username } : {}),
      password
    });
  });

  function drain() {
    if (S.busy || !S.open || !S.authed || !S.pending.length) return;

    S.busy = true;
    const request = S.pending[0];

    send({
      type: "walletChange",
      requestId: String(Date.now()),
      cashDelta: request.dc,
      bankDelta: request.db,
      reason: request.reason || ""
    });
  }

  N.walletChange = (cashDelta, bankDelta, callback, reason = "") => {
    S.pending.push({
      dc: Math.trunc(cashDelta || 0),
      db: Math.trunc(bankDelta || 0),
      cb: callback,
      reason
    });
    drain();
  };

  N.acceptJob = (name, callback) => {
    if (!S.authed || !S.open) {
      callback?.({ ok: false, message: "Not connected to the game server." });
      return;
    }
    S.jobCb = callback;
    send({ type: "acceptJob", name });
  };

  // Stage 3 careers and factions are server-authoritative; this bridge only sends requests.
  N.getWorkplaces = () => send({ type: "getWorkplaces" });
  N.applyWorkplace = (workplaceId) => send({ type: "applyWorkplace", workplaceId });
  N.leaveWorkplace = () => send({ type: "leaveWorkplace" });
  N.setWorkplaceDuty = (workplaceId, onDuty) => send({ type: "setWorkplaceDuty", workplaceId, onDuty: onDuty === true });
  N.startWorkTask = (taskId) => send({ type: "startWorkTask", taskId });
  N.completeWorkTask = () => send({ type: "completeWorkTask" });
  N.approveWorkplaceApplication = (workplaceId, targetId, approve) => send({ type: "approveWorkplaceApplication", workplaceId, targetId, approve: approve === true });
  N.hireWorkplaceStaff = (workplaceId, targetId) => send({ type: "hireWorkplaceStaff", workplaceId, targetId });
  N.dismissWorkplaceStaff = (workplaceId, targetId) => send({ type: "dismissWorkplaceStaff", workplaceId, targetId });
  N.setStaffRank = (workplaceId, targetId, newRank) => send({ type: "setStaffRank", workplaceId, targetId, newRank });
  N.appointWorkplaceBoss = (workplaceId, targetId) => send({ type: "appointWorkplaceBoss", workplaceId, targetId });

  N.buyFuel = (carId, litres, brand, callback) => {
    if (!S.authed || !S.open) {
      callback?.({ ok: false, message: "Not connected to the game server." });
      return;
    }
    N.saveProgress(); // flush the car's current fuel first so the server knows how much room is left
    S.fuelCb = callback;
    send({ type: "buyFuel", carId, litres, brand });
  };

  // Ask the server for the current life state (answer arrives as a "nrs-life" window event).
  N.getLife = () => send({ type: "getLife" });
  N.getHousing = () => send({ type: "getHousing" });
  N.rentHouse = (houseId, days = 1) => send({ type: "rentHouse", houseId, days });
  N.enterHome = () => send({ type: "enterHome" });
  N.enterHouse = (houseId) => send({ type: "enterHouse", houseId });
  N.setHouseLock = (houseId, locked) => send({ type: "setHouseLock", houseId, locked: locked === true });
  N.exitHome = () => send({ type: "exitHome" });
  N.enterCarpark = () => send({ type: "enterCarpark" });
  N.spawnCarparkVehicle = (carId, callback) => {
    if (!S.authed || !S.open) {
      callback?.({ ok: false, message: "You are not connected to the game server." });
      return;
    }
    S.garageSpawnCb = callback;
    send({ type: "carparkVehicleSpawn", carId });
  };
  N.exitCarpark = (carId, hornHeld = false) => send({ type: "exitCarpark", carId, hornHeld: hornHeld === true });
  N.exitCarparkOnFoot = (route) => send({ type: "carparkFootExit", route: route === "home" ? "home" : "street" });
  N.parkCars = () => send({ type: "parkCars" });
  N.retrieveCars = () => send({ type: "retrieveCars" });
  N.respawn = () => send({ type: "respawn" });

  // Test-only. The server ignores these unless it was started with NRS_DEBUG_CLOCK=1.
  N.debugSkipDays = (days) => send({ type: "debugSkipDays", days });
  N.debugGiveHome = (houseId, rentDays) => send({ type: "debugGiveHome", houseId, rentDays });

  N.saveProgress = () => {
    if (!S.authed || !S.open) return;

    send({
      type: "saveProgress",
      hp,
      hunger,
      inventory: inv,
      fuel: Object.fromEntries(cars.filter((car) => car.kind !== "t" && car.id).map((car) => [car.id, Math.round(car.fuel * 100) / 100]))
    });
  };

  // Persist hp / hunger / backpack regularly and when the tab is hidden or closed.
  window.setInterval(() => N.saveProgress(), 10000);
  document.addEventListener("visibilitychange", () => { if (document.hidden) N.saveProgress(); });
  window.addEventListener("pagehide", () => N.saveProgress());

  const playersButton = $("ib1");
  if (playersButton) {
    playersButton.onclick = () => {
      const names = [...S.remotes.values()]
        .map((group) => "• " + (group.userData.name || "Player"))
        .join("<br>");

      panel(
        "<b>👥 Players online</b>" +
        "<p><b>" + S.online + "</b> people are in Port Harcourt right now.</p>" +
        (names || "<p>You are currently the only player online.</p>")
      );
    };
  }

  const baseUpdate = update;
  update = function (dt) {
    baseUpdate(dt);

    if (S.authed && S.open && !driving && !inside) {
      let ix = inp.x;
      let iy = inp.y;
      if (keys.KeyW || keys.ArrowUp) iy += 1;
      if (keys.KeyS || keys.ArrowDown) iy -= 1;
      if (keys.KeyD || keys.ArrowRight) ix += 1;
      if (keys.KeyA || keys.ArrowLeft) ix -= 1;

      const raw = Math.hypot(ix, iy);
      if (raw > 1) { ix /= raw; iy /= raw; }
      const magnitude = Math.min(1, Math.hypot(ix, iy));
      const sn = Math.sin(camYaw);
      const cs = Math.cos(camYaw);
      const now = performance.now();

      if (magnitude > .01) {
        const dx = ix * cs - iy * sn;
        const dz = -ix * sn - iy * cs;

        send({
          type: "input",
          input: {
            sequence: S.seq++,
            forward: Math.max(-1, Math.min(1, -dz)) * magnitude,
            strafe: Math.max(-1, Math.min(1, dx)) * magnitude
          }
        });
        S.moving = true;
      } else if (S.moving) {
        send({
          type: "input",
          input: {
            sequence: S.seq++,
            forward: 0,
            strafe: 0
          }
        });
        S.moving = false;
      }

      S.last = now;
    }

    // Stream short, bounded vehicle-position samples while driving inside the
    // private garage. The server derives movement speed from consecutive samples
    // and requires a recent stopped sample at the actual gate before allowing exit.
    if (S.authed && S.open && inside?.isCarpark && driving && driving.id) {
      const garageNow = performance.now();
      if (garageNow - S.carparkSyncAt >= 180) {
        S.carparkSyncAt = garageNow;
        send({
          type: "carparkDriveSync",
          carId: driving.id,
          x: driving.x,
          z: driving.z,
          yaw: driving.ry
        });
      }
    }

    // Report our real position (on foot or driving) so the server can validate
    // job rewards. Skipped inside shop interiors, which use separate coordinates.
    if (S.authed && S.open && !inside) {
      const now = performance.now();
      const moved = Math.hypot(pos.x - S.posX, pos.z - S.posZ);
      if ((moved > 0.5 && now - S.posAt > 400) || now - S.posAt > 2000) {
        S.posAt = now;
        S.posX = pos.x;
        S.posZ = pos.z;
        send({ type: "posSync", x: pos.x, z: pos.z, yaw: face });
      }
    }

    for (const group of S.remotes.values()) {
      const target = group.userData.target;
      const follow = 1 - Math.exp(-dt * 12);
      group.position.x += (target.x - group.position.x) * follow;
      group.position.z += (target.z - group.position.z) * follow;

      let delta = target.yaw - group.rotation.y;
      delta = Math.atan2(Math.sin(delta), Math.cos(delta));
      group.rotation.y += delta * follow;
    }
  };

  function stopMoving() {
    try {
      for (const k of Object.keys(keys)) keys[k] = false;
      inp.x = 0;
      inp.y = 0;
    } catch (_) {}
    if (S.moving && S.authed && S.open) {
      send({ type: "input", input: { sequence: S.seq++, forward: 0, strafe: 0 } });
    }
    S.moving = false;
  }

  window.addEventListener("blur", stopMoving);
  document.addEventListener("visibilitychange", () => { if (document.hidden) stopMoving(); });

  setVisible(false);
  connect();
})();
