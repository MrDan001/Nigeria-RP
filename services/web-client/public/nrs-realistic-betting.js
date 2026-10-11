(function () {
  "use strict";

  const MIN_STAKE = 10;
  const MAX_LEGS = 9;
  const SETTLE_HOUR = 22;
  const TICKET_KEY = "nrs_real_betting_tickets_v1";
  const WALLET_KEY = "nrs_real_betting_wallet_v1";
  const games = [
    ["Port City FC", "Delta Rovers"], ["Rivergate Athletic", "Creekside United"],
    ["Civic Stars", "Harbour Town"], ["Garden City FC", "Riverside Lions"],
    ["Eagle Heights", "Dockyard United"], ["Old Township", "Creek Warriors"],
    ["Atlantic City", "Mainland Stars"], ["Waterfront FC", "Industrial Town"],
    ["Rivers United", "Coastal Kings"]
  ];
  const seed = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = (n) => { n = (n + 0x6D2B79F5) | 0; let t = Math.imul(n ^ n >>> 15, 1 | n); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const today = () => { const d = new Date(); return d.toISOString().slice(0, 10); };
  const settled = () => new Date().getHours() >= SETTLE_HOUR;
  const money = (n) => "₦" + Math.max(0, Math.floor(Number(n) || 0)).toLocaleString("en-NG");
  const cashEl = () => document.getElementById("cash");
  const getCash = () => Math.max(0, Math.floor(Number((cashEl()?.textContent || "0").replace(/[^0-9.-]/g, "")) || 0));
  const setCash = (n) => { const e = cashEl(); if (e) e.textContent = Math.max(0, Math.floor(n)).toLocaleString("en-NG"); };
  const read = (k, fallback) => { try { const v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? fallback : v; } catch (_) { return fallback; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} };

  function fixtures() {
    const day = today();
    const base = seed(day);
    return games.map((g, i) => {
      const a = rng(base + i * 71), b = rng(base + i * 97), c = rng(base + i * 131);
      const raw = [0.42 + a * .26, 0.24 + b * .16, 0.42 + c * .26];
      const sum = raw.reduce((x, y) => x + y, 0);
      const p = raw.map(x => x / sum);
      const margin = 1.06;
      return { id: `${day}-${i + 1}`, home: g[0], away: g[1], odds: { home: +(1 / p[0] * margin).toFixed(2), draw: +(1 / p[1] * margin).toFixed(2), away: +(1 / p[2] * margin).toFixed(2) } };
    });
  }

  function tickets() { return read(TICKET_KEY, []).filter(t => t && t.date); }
  function selectedMap() { return {}; }
  function render() {
    const body = document.getElementById("nrsTabletBody");
    if (!body) return;
    const fs = fixtures();
    const state = { picks: {}, stake: 10 };
    body.innerHTML = "";
    const h = document.createElement("h2"); h.className = "appTitle"; h.textContent = "Sports betting"; body.appendChild(h);
    const p = document.createElement("p"); p.className = "appCopy"; p.textContent = "9 matches are available each day. Build a ticket with up to all 9 selections. Tickets close at 10:00 PM."; body.appendChild(p);

    const summary = document.createElement("div"); summary.className = "infoGrid";
    const c = document.createElement("div"); c.className = "infoCard"; c.innerHTML = `<small>AVAILABLE FUNDS</small><strong id="realBetFunds">${money(getCash())}</strong>`;
    const l = document.createElement("div"); l.className = "infoCard"; l.innerHTML = `<small>DAILY GAMES</small><strong>9</strong>`;
    summary.append(c, l); body.appendChild(summary);

    const picks = document.createElement("div"); picks.id = "realBetPicks";
    fs.forEach((m, i) => {
      const row = document.createElement("div"); row.className = "fixture";
      row.innerHTML = `<div class="fixtureName"><span>${i + 1}. ${m.home} vs ${m.away}</span><small>Today</small></div>`;
      const buttons = document.createElement("div"); buttons.className = "picks";
      [["home","Home win"],["draw","Draw"],["away","Away win"]].forEach(([k,label]) => {
        const b = document.createElement("button"); b.type = "button"; b.className = "pick"; b.dataset.game = m.id; b.dataset.pick = k;
        b.innerHTML = `${label}<small>${m.odds[k].toFixed(2)}</small>`;
        b.addEventListener("click", () => {
          if (settled()) return feedback("Today's betting has closed. New games open tomorrow.");
          const old = state.picks[m.id];
          if (old === k) delete state.picks[m.id]; else state.picks[m.id] = k;
          if (Object.keys(state.picks).length > MAX_LEGS) delete state.picks[m.id];
          render();
        });
        if (state.picks[m.id] === k) b.classList.add("on");
        buttons.appendChild(b);
      });
      row.appendChild(buttons); picks.appendChild(row);
    });
    body.appendChild(picks);

    const controls = document.createElement("div"); controls.className = "formRow";
    const input = document.createElement("input"); input.type = "number"; input.min = String(MIN_STAKE); input.step = "1"; input.value = String(state.stake); input.id = "realBetStake"; input.placeholder = "Stake";
    const place = document.createElement("button"); place.className = "primary"; place.type = "button"; place.textContent = "Place ticket";
    controls.append(input, place); body.appendChild(controls);
    const odds = Object.entries(state.picks).reduce((acc, [id, k]) => { const m = fs.find(x => x.id === id); return acc * (m ? m.odds[k] : 1); }, 1);
    const calc = document.createElement("div"); calc.className = "infoGrid"; calc.innerHTML = `<div class="infoCard"><small>SELECTIONS</small><strong>${Object.keys(state.picks).length}/9</strong></div><div class="infoCard"><small>COMBINED ODDS</small><strong>${odds.toFixed(2)}</strong></div>`; body.appendChild(calc);
    const fb = document.createElement("div"); fb.id = "realBetFeedback"; fb.className = "feedback"; body.appendChild(fb);
    place.addEventListener("click", () => {
      const stake = Math.floor(Number(input.value) || 0);
      const count = Object.keys(state.picks).length;
      if (settled()) return feedback("Today's betting has closed at 10:00 PM.");
      if (count < 1 || count > MAX_LEGS) return feedback("Select at least 1 game and no more than 9 games.");
      if (stake < MIN_STAKE) return feedback("Minimum stake is ₦10.");
      const funds = getCash();
      if (funds < stake) return feedback(`Insufficient funds. You need ${money(stake)} to place this ticket.`);
      const ticket = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, date: today(), selections: fs.filter(m => state.picks[m.id]).map(m => ({ gameId:m.id, home:m.home, away:m.away, pick:state.picks[m.id], odds:m.odds[state.picks[m.id]] })), stake, combinedOdds:+odds.toFixed(2), potentialReturn:+(stake * odds).toFixed(2), status:"OPEN", createdAt:new Date().toISOString() };
      const ts = tickets(); ts.push(ticket); write(TICKET_KEY, ts.slice(-200));
      setCash(funds - stake);
      feedback(`Ticket ${ticket.id.slice(-8).toUpperCase()} placed for ${money(stake)}. Potential return ${money(ticket.potentialReturn)}.`);
      render();
    });
    if (settled()) feedback("Today's games are closed and settle by 10:00 PM. New fixtures open tomorrow.");
  }

  function feedback(text) { const e = document.getElementById("realBetFeedback"); if (e) e.textContent = text; }

  function intercept(e) {
    const b = e.target.closest && e.target.closest('[data-app="betting"]');
    if (!b) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const layer = document.getElementById("nrsTabletLayer"); if (layer) layer.hidden = false;
    render();
  }
  document.addEventListener("click", intercept, true);

  // Remove prototype/demo wording wherever the tablet re-renders. This keeps
  // the player-facing UI focused on the actual game experience.
  const forbidden = /mockup|prototype|demo|demonstration|virtual-token|virtual tokens|not real|real-world connections|game world only|fictional|not a real|game cash is separate|safe banner|no real-world|not a real bank account|in-game currency only/i;
  const clean = () => {
    document.querySelectorAll("#nrsTabletLayer *").forEach(el => {
      if (el.children.length) return;
      const t = el.textContent || "";
      if (forbidden.test(t)) {
        if (el.id === "nrsTabletStatus") el.textContent = "";
        else if (el.id === "nrsTabletFoot") el.textContent = "";
        else el.remove();
      }
    });
    const cards = document.querySelectorAll('#nrsTabletGrid button');
    cards.forEach(card => { if (card.dataset.app === "betting") { const small = card.querySelector("small"); if (small) small.textContent = "Sports fixtures and tickets"; } });
  };
  const observer = new MutationObserver(clean);
  observer.observe(document.body, { childList:true, subtree:true, characterData:true });
  setInterval(clean, 1200);
})();
