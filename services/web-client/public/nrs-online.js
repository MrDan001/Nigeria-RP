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
    token: readToken(),
    initialConnection: true,
    resume: false,
    seq: 0,
    remotes: new Map(),
    target: null,
    pending: [],
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
    $("nrsLogin").classList.toggle("active", !isRegister);
    $("nrsReg").classList.toggle("active", isRegister);
    $("nrsLogin").setAttribute("aria-selected", String(!isRegister));
    $("nrsReg").setAttribute("aria-selected", String(isRegister));
    $("nrsUsernameWrap").hidden = !isRegister;
    $("nrsUser").required = isRegister;
    $("nrsEmail").autocomplete = isRegister ? "email" : "username";
    $("nrsConfirmWrap").hidden = !isRegister;
    $("nrsConfirm").required = isRegister;
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
    S.authed = true;
    writeToken(S.token);

    cash = Number(player.cash) || 0;
    bank = Number(player.bank) || 0;
    hp = Number(player.hp) || 100;
    hunger = Number(player.hunger) || 82;
    job = player.job || null;

    for (const key of Object.keys(inv)) delete inv[key];
    Object.assign(inv, player.inventory || {});

    pos.set(Number(player.x) || 0, 0, Number(player.z) || 24);
    face = Number(player.yaw) || Math.PI;

    const level = $("top")?.querySelector(".lv");
    if (level) level.textContent = "LEVEL " + (player.level || 1);

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

  function tag(text) {
    const canvas = document.createElement("canvas");
    canvas.width = 256; canvas.height = 64;
    const ctx = canvas.getContext("2d");
    ctx.font = "bold 28px system-ui";
    ctx.textAlign = "center";
    ctx.fillStyle = "#071016dd";
    ctx.fillRect(6, 8, 244, 48);
    ctx.fillStyle = "#fff";
    ctx.fillText(text, 128, 42);

    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(canvas),
      transparent: true,
      depthTest: false
    }));
    sprite.scale.set(2.7, .68, 1);
    sprite.position.y = 2.35;
    sprite.renderOrder = 50;
    sprite.userData.name = text;
    return sprite;
  }

  function remote(player) {
    if (!player || !player.id || player.id === S.id) return;

    let group = S.remotes.get(player.id);
    if (!group) {
      group = new THREE.Group();
      group.add(model.clone(true));
      group.add(tag(player.name || "Player"));
      group.position.set(player.x, 0, player.z);
      group.rotation.y = player.yaw || 0;
      group.userData = {
        target: { x: Number(player.x) || 0, z: Number(player.z) || 0, yaw: Number(player.yaw) || 0 },
        name: player.name || "Player"
      };
      scene.add(group);
      S.remotes.set(player.id, group);
      return;
    }

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
        snapshot(message.players || [], message.onlineCount);
        $("nrsError").textContent = "";
        status("Account loaded. Welcome to Port Harcourt.");
        return;
      }

      if (message.type === "authError") {
        if (message.code === "INVALID_SESSION") writeToken("");
        S.authed = false;
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
      } else if (message.type === "walletResult") {
        const request = S.pending.shift();
        S.busy = false;
        if (message.ok) {
          cash = Number(message.cash) || 0;
          bank = Number(message.bank) || 0;
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

  N.saveProgress = () => {
    if (!S.authed || !S.open) return;

    send({
      type: "saveProgress",
      hp,
      hunger,
      job,
      inventory: inv
    });
  };

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