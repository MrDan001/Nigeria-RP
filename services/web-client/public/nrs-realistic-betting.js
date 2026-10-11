(function () {
  "use strict";

  const MIN_STAKE = 10;
  const MAX_SELECTIONS = 9;
  const $ = (id) => document.getElementById(id);
  const labels = { home: "Home win", draw: "Draw", away: "Away win" };
  const state = {
    picks: {},
    stake: MIN_STAKE,
    fixtures: [],
    tickets: [],
    results: [],
    date: "",
    closed: false,
    cash: 0,
    pending: false,
    feedback: "",
    feedbackError: false,
  };

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function money(value) {
    const amount = Math.max(0, Math.floor(Number(value) || 0));
    return "₦" + amount.toLocaleString("en-NG");
  }

  function currentCash() {
    const value = Number(window.NRS && window.NRS.cash);
    if (Number.isFinite(value)) return Math.max(0, Math.floor(value));
    const raw = $("cash") ? $("cash").textContent : "0";
    return Math.max(0, Math.floor(Number(String(raw).replace(/[^0-9.-]/g, "")) || 0));
  }

  function randomId(prefix) {
    let suffix = "";
    try {
      if (window.crypto && typeof window.crypto.randomUUID === "function") suffix = window.crypto.randomUUID();
    } catch (_) {}
    if (!suffix) suffix = Date.now().toString(36) + "_" + Math.random().toString(36).slice(2);
    return prefix + "_" + suffix;
  }

  function send(message) {
    const session = window.NRS && window.NRS.session;
    const socket = session && session.ws;
    if (!session || !session.authed || !socket || socket.readyState !== WebSocket.OPEN) {
      state.feedback = "Log in to your player account to use Sports Betting.";
      state.feedbackError = true;
      renderFeedbackOnly();
      return false;
    }
    socket.send(JSON.stringify(message));
    return true;
  }

  function requestState() {
    return send({ type: "bettingStateRequest", requestId: randomId("betstate") });
  }

  function combinedOdds() {
    const picks = Object.entries(state.picks);
    if (!picks.length) return 0;
    let value = 1;
    for (const [fixtureId, pick] of picks) {
      const fixture = state.fixtures.find((item) => item.id === fixtureId);
      const odds = fixture && fixture.odds ? Number(fixture.odds[pick]) : 0;
      if (!(odds > 1)) return 0;
      value *= odds;
    }
    return Number(value.toFixed(2));
  }

  function potentialReturn() {
    return Math.round(Math.max(0, Number(state.stake) || 0) * combinedOdds());
  }

  function renderFeedbackOnly() {
    const feedback = $("realBetFeedback");
    if (feedback) {
      feedback.textContent = state.feedback;
      feedback.classList.toggle("error", state.feedbackError);
    }
    const button = $("realBetPlace");
    if (button) button.disabled = state.pending || state.closed;
  }

  function updateSummary() {
    const summary = $("realBetSummary");
    if (!summary) return;
    const count = Object.keys(state.picks).length;
    const odds = combinedOdds();
    summary.replaceChildren();
    summary.appendChild(infoCard("SELECTIONS", count + "/" + MAX_SELECTIONS));
    summary.appendChild(infoCard("COMBINED ODDS", odds ? odds.toFixed(2) : "—"));
    summary.appendChild(infoCard("POTENTIAL RETURN", odds ? money(potentialReturn()) : "—"));
    const funds = $("realBetFunds");
    if (funds) funds.textContent = money(currentCash());
  }

  function infoCard(label, value) {
    const card = element("div", "infoCard");
    card.appendChild(element("small", "", label));
    card.appendChild(element("strong", "", value));
    return card;
  }

  function showMessage(message, isError) {
    state.feedback = message || "";
    state.feedbackError = Boolean(isError);
    renderFeedbackOnly();
  }

  function render() {
    const body = $("nrsTabletBody");
    if (!body) return;
    body.replaceChildren();

    body.appendChild(element("h2", "appTitle", "Sports betting"));
    body.appendChild(element(
      "p",
      "appCopy",
      "Choose from 9 daily matches. Combine 1–9 selections on a ticket, place multiple tickets and check your returns here. Betting closes at 10:00 PM Nigeria time."
    ));

    if (!state.date) {
      body.appendChild(element("div", "empty", "Loading today's fixtures and your current wallet balance…"));
      const feedback = element("div", "feedback", state.feedback);
      feedback.id = "realBetFeedback";
      body.appendChild(feedback);
      return;
    }

    const grid = element("div", "infoGrid");
    grid.appendChild(infoCard("AVAILABLE CASH", money(currentCash())));
    grid.appendChild(infoCard("DAILY MATCHES", String(state.fixtures.length)));
    body.appendChild(grid);

    const cutoff = element("div", state.closed ? "safeBanner" : "appCopy",
      state.closed
        ? "Today's betting is closed. Tickets have been settled by the game server."
        : "Today's ticket window is open until 10:00 PM Nigeria time.");
    body.appendChild(cutoff);

    const resultByFixture = new Map((state.results || []).map((result) => [result.fixtureId, result]));
    for (let index = 0; index < state.fixtures.length; index += 1) {
      const fixture = state.fixtures[index];
      const row = element("div", "fixture");
      const head = element("div", "fixtureName");
      head.appendChild(element("span", "", (index + 1) + ". " + fixture.home + " vs " + fixture.away));
      head.appendChild(element("small", "", fixture.date === state.date ? "Today" : fixture.date));
      row.appendChild(head);

      const picks = element("div", "picks");
      for (const pick of ["home", "draw", "away"]) {
        const button = element("button", "pick");
        button.type = "button";
        button.disabled = state.closed || state.pending;
        if (state.picks[fixture.id] === pick) button.classList.add("on");
        button.appendChild(document.createTextNode(labels[pick]));
        button.appendChild(element("small", "", Number(fixture.odds[pick]).toFixed(2)));
        button.addEventListener("click", () => {
          if (state.closed || state.pending) return;
          if (state.picks[fixture.id] === pick) delete state.picks[fixture.id];
          else if (Object.keys(state.picks).length < MAX_SELECTIONS || state.picks[fixture.id]) state.picks[fixture.id] = pick;
          else return showMessage("A ticket can contain up to 9 selections.", true);
          state.feedback = "";
          state.feedbackError = false;
          renderSelections();
          updateSummary();
          renderFeedbackOnly();
        });
        picks.appendChild(button);
      }
      row.appendChild(picks);

      const result = resultByFixture.get(fixture.id);
      if (result) {
        const resultName = result.outcome === "home" ? fixture.home + " win" : result.outcome === "away" ? fixture.away + " win" : "Draw";
        row.appendChild(element("small", "sectionLabel", "FINAL · " + result.homeScore + " – " + result.awayScore + " · " + resultName.toUpperCase()));
      }
      body.appendChild(row);
    }

    const form = element("div", "formRow");
    const stake = element("input");
    stake.id = "realBetStake";
    stake.type = "number";
    stake.min = String(MIN_STAKE);
    stake.max = "50000000";
    stake.step = "1";
    stake.inputMode = "numeric";
    stake.value = String(state.stake);
    stake.disabled = state.closed || state.pending;
    stake.setAttribute("aria-label", "Stake in naira");
    stake.addEventListener("input", () => {
      state.stake = Math.floor(Number(stake.value) || 0);
      updateSummary();
    });
    form.appendChild(stake);
    const place = element("button", "primary", state.pending ? "Sending…" : "Place ticket");
    place.id = "realBetPlace";
    place.type = "button";
    place.disabled = state.closed || state.pending;
    place.addEventListener("click", placeTicket);
    form.appendChild(place);
    body.appendChild(form);

    const summary = element("div", "infoGrid");
    summary.id = "realBetSummary";
    body.appendChild(summary);

    const feedback = element("div", "feedback", state.feedback);
    feedback.id = "realBetFeedback";
    if (state.feedbackError) feedback.classList.add("error");
    body.appendChild(feedback);

    const historyTitle = element("h3", "sectionLabel", "YOUR TICKET HISTORY");
    body.appendChild(historyTitle);
    const tickets = element("div", "appList");
    const recent = (state.tickets || []).slice(0, 12);
    if (!recent.length) {
      tickets.appendChild(element("div", "empty", "No tickets placed yet. Your tickets and settlement results will appear here."));
    } else {
      for (const ticket of recent) {
        const row = element("div", "listRow");
        const left = element("span");
        const title = ticket.selections && ticket.selections.length
          ? ticket.selections.length + "-selection ticket"
          : "Sports ticket";
        left.appendChild(element("strong", "", title + " · " + money(ticket.stake)));
        const summaryText = (ticket.selections || []).map((selection) =>
          selection.home + " vs " + selection.away + ": " + (labels[selection.pick] || selection.pick)
        ).join(" • ");
        left.appendChild(element("small", "", summaryText));
        left.appendChild(element("small", "", "Odds " + Number(ticket.combinedOdds || 0).toFixed(2) + " · Potential " + money(ticket.potentialReturn)));
        const right = element("span");
        right.style.textAlign = "right";
        right.appendChild(element("strong", "", String(ticket.status || "OPEN")));
        if (ticket.status === "WON") right.appendChild(element("small", "", "Paid " + money(ticket.payout)));
        else if (ticket.status === "LOST") right.appendChild(element("small", "", "Payout " + money(0)));
        else right.appendChild(element("small", "", "Awaiting settlement"));
        row.append(left, right);
        tickets.appendChild(row);
      }
    }
    body.appendChild(tickets);
    updateSummary();
  }

  function renderSelections() {
    document.querySelectorAll("#nrsTabletBody .pick").forEach((button) => {
      const row = button.closest(".fixture");
      if (!row) return;
      const fixtureId = state.fixtures.find((fixture) =>
        row.querySelector(".fixtureName span")?.textContent?.includes(fixture.home + " vs " + fixture.away)
      )?.id;
      const label = button.childNodes[0] && button.childNodes[0].textContent;
      const pick = Object.keys(labels).find((key) => labels[key] === label);
      button.classList.toggle("on", Boolean(fixtureId && pick && state.picks[fixtureId] === pick));
    });
  }

  function placeTicket() {
    if (state.pending) return;
    if (state.closed) return showMessage("Today's betting has closed at 10:00 PM Nigeria time.", true);
    const entries = Object.entries(state.picks);
    const stake = Math.floor(Number(state.stake) || 0);
    if (!entries.length) return showMessage("Select at least 1 match.", true);
    if (entries.length > MAX_SELECTIONS) return showMessage("A ticket can contain up to 9 selections.", true);
    if (!Number.isSafeInteger(stake) || stake < MIN_STAKE) return showMessage("Minimum stake is ₦10.", true);
    if (stake > 50000000) return showMessage("Maximum stake per ticket is ₦50,000,000.", true);
    if (currentCash() < stake) return showMessage("Your displayed balance is below the stake. The server will verify your actual available cash.", true);

    state.pending = true;
    showMessage("Submitting your ticket to the game server…", false);
    renderFeedbackOnly();
    const requestId = randomId("bet");
    const sent = send({
      type: "placeBettingTicket",
      requestId,
      stake,
      selections: entries.map(([fixtureId, pick]) => ({ fixtureId, pick })),
    });
    if (!sent) {
      state.pending = false;
      return;
    }
    const place = $("realBetPlace");
    if (place) place.disabled = true;
  }

  function handleMessage(event) {
    const message = event && event.detail;
    if (!message || typeof message.type !== "string") return;

    if (message.type === "bettingState") {
      state.pending = false;
      if (!message.ok) {
        showMessage(message.message || "Betting data could not be loaded.", true);
        return;
      }
      state.date = String(message.date || "");
      state.fixtures = Array.isArray(message.fixtures) ? message.fixtures : [];
      state.tickets = Array.isArray(message.tickets) ? message.tickets : [];
      state.results = Array.isArray(message.results) ? message.results : [];
      state.closed = Boolean(message.isClosed);
      state.cash = Math.max(0, Math.floor(Number(message.cash) || 0));
      state.feedback = "";
      state.feedbackError = false;
      if (isOpen()) render();
      return;
    }

    if (message.type === "bettingTicketResult") {
      state.pending = false;
      if (message.cash !== undefined) state.cash = Math.max(0, Math.floor(Number(message.cash) || 0));
      if (message.ok) {
        state.picks = {};
        state.stake = MIN_STAKE;
        showMessage(message.message || "Ticket placed successfully.", false);
      } else {
        showMessage(message.message || "The ticket could not be placed.", true);
      }
      if (isOpen()) {
        const stake = $("realBetStake");
        if (stake && message.ok) stake.value = String(MIN_STAKE);
        updateSummary();
        renderFeedbackOnly();
      }
      return;
    }

    if (message.type === "bettingSettlementNotice") {
      if (message.ticket) {
        state.tickets = [message.ticket, ...state.tickets.filter((ticket) => ticket.id !== message.ticket.id)].slice(0, 30);
      }
      if (message.cash !== undefined) state.cash = Math.max(0, Math.floor(Number(message.cash) || 0));
      showMessage(message.message || "A ticket has been settled.", false);
      if (isOpen()) {
        render();
        requestState();
      }
      return;
    }

    if (message.type === "bettingBalanceUpdate") {
      if (message.cash !== undefined) state.cash = Math.max(0, Math.floor(Number(message.cash) || 0));
      updateSummary();
    }
  }

  function isOpen() {
    const layer = $("nrsTabletLayer");
    return Boolean(layer && !layer.hidden);
  }

  function openBetting() {
    const layer = $("nrsTabletLayer");
    if (layer) layer.hidden = false;
    state.picks = {};
    state.stake = MIN_STAKE;
    state.feedback = "";
    state.feedbackError = false;
    state.pending = false;
    state.date = "";
    state.fixtures = [];
    render();
    requestState();
  }

  function intercept(event) {
    const button = event.target && event.target.closest && event.target.closest('[data-app="betting"]');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openBetting();
  }

  document.addEventListener("click", intercept, true);
  window.addEventListener("nrs-betting-message", handleMessage);
  window.addEventListener("nrs-open-betting", openBetting);

  // Refresh the authoritative cutoff/results if the player leaves betting open across 10 PM.
  window.setInterval(() => {
    if (!isOpen()) return;
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Lagos",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now);
    const hour = Number(parts.find((part) => part.type === "hour")?.value || 0);
    const minute = Number(parts.find((part) => part.type === "minute")?.value || 0);
    if (!state.closed && (hour > 22 || (hour === 22 && minute >= 0))) requestState();
  }, 30000);
})();