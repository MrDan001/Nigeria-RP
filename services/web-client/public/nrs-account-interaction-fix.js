(function () {
  "use strict";

  const root = document.getElementById("nrsAccount");
  if (!root) return;

  const SESSION_KEY = "nrs_rp_account_session_v3";
  let restoreTimer = null;

  // The old #start screen is a separate legacy lobby. It must not exist in the
  // live UI at all: character lobby -> game is now the only entry path.
  function removeLegacyLobby() {
    const legacy = document.getElementById("start");
    if (legacy) legacy.remove();
  }

  removeLegacyLobby();
  const legacyLobbyObserver = new MutationObserver(removeLegacyLobby);
  legacyLobbyObserver.observe(document.documentElement, { childList: true, subtree: true });

  const style = document.createElement("style");
  style.id = "nrsLegacyLobbyRemovalStyles";
  style.textContent = "#start,#start.nrs-direct-entry-hidden{display:none!important;visibility:hidden!important;pointer-events:none!important}";
  document.head.appendChild(style);

  function savedToken() {
    try {
      return localStorage.getItem(SESSION_KEY) || window.NRS?.session?.token || "";
    } catch {
      return window.NRS?.session?.token || "";
    }
  }

  function clearRestoreTimer() {
    if (restoreTimer !== null) {
      window.clearTimeout(restoreTimer);
      restoreTimer = null;
    }
  }

  function applyAccountInteractionFix() {
    const styleId = "nrsAccountInteractionFixStyles";
    let style = document.getElementById(styleId);
    if (!style) {
      style = document.createElement("style");
      style.id = styleId;
      style.textContent = [
        "/* Account UI must sit above the game canvas and remain a real touch target. */",
        "body.nrs-account-backdrop { touch-action: auto !important; }",
        "#nrsAccount { z-index: 100001 !important; pointer-events: auto !important; touch-action: auto !important; isolation: isolate; -webkit-user-select: text !important; user-select: text !important; }",
        "#nrsAccount .card, #nrsAccount form, #nrsAccount button, #nrsAccount input, #nrsAccount label, #nrsAccount .tab, #nrsAccount .submit, #nrsAccount .subtleButton, #nrsAccount .continueButton { pointer-events: auto !important; touch-action: manipulation !important; }",
        "#nrsAccount button, #nrsAccount input { position: relative; z-index: 1; }",
        "#nrsAccount input { -webkit-user-select: text !important; user-select: text !important; }",
        "#nrsAccount.nrs-account-restoring #nrsCharacterList, #nrsAccount.nrs-account-restoring #nrsCreateCharacterButton, #nrsAccount.nrs-account-restoring #nrsSwitchAccount, #nrsAccount.nrs-account-restoring #nrsCreateCharacterPanel { display: none !important; }",
        "#nrsAccount.nrs-account-restoring #nrsCharacterStatus { display: block !important; min-height: 44px; padding: 24px 0; }"
      ].join("\n");
      document.head.appendChild(style);
    }

    root.style.setProperty("pointer-events", "auto", "important");
    root.style.setProperty("z-index", "100001", "important");
    root.style.setProperty("touch-action", "auto", "important");

    if (root.classList.contains("nrs-account-restoring")) {
      const session = window.NRS?.session;
      const view = document.getElementById("nrsCharacterView");
      if (session?.accountReady || view?.hidden) {
        root.classList.remove("nrs-account-restoring");
        clearRestoreTimer();
      }
    }
  }

  function showRememberedCharacterLobby() {
    const token = savedToken();
    const session = window.NRS?.session;
    if (!token) return false;

    if (session) {
      session.token = token;
      session.resume = false;
      session.authed = false;
      session.accountReady = false;
      session.id = null;
      session.ownerId = null;
      session.name = "";
      session.characters = [];
    }

    const loginCard = document.getElementById("nrsLoginCard");
    const characterView = document.getElementById("nrsCharacterView");
    const summary = document.getElementById("nrsCharacterEmail");
    const characterCount = document.getElementById("nrsCharacterCount");
    const characterStatus = document.getElementById("nrsCharacterStatus");
    const loginStatus = document.getElementById("nrsStatus");
    const loginError = document.getElementById("nrsError");

    if (loginCard) loginCard.hidden = true;
    if (characterView) characterView.hidden = false;
    root.hidden = false;
    root.classList.add("nrs-account-restoring");
    document.body.classList.add("nrs-account-backdrop");

    if (summary) summary.textContent = "Restoring your remembered account…";
    if (characterCount) characterCount.textContent = "Loading saved characters…";
    const lobbyCount = root.querySelector(".nrs-lobby-count");
    if (lobbyCount) lobbyCount.textContent = "RESTORING ACCOUNT…";
    if (characterStatus) characterStatus.textContent = "Restoring your account and saved characters…";
    if (loginStatus) loginStatus.textContent = "Restoring your saved account…";
    if (loginError) loginError.textContent = "";

    clearRestoreTimer();
    restoreTimer = window.setTimeout(() => {
      restoreTimer = null;
      if (window.NRS?.session?.accountReady || root.hidden) return;
      root.classList.remove("nrs-account-restoring");
      if (characterView) characterView.hidden = true;
      if (loginCard) loginCard.hidden = false;
      if (loginStatus) loginStatus.textContent = "Your saved session could not be restored. Log in to continue.";
      if (loginError) loginError.textContent = "We could not confirm your saved session. Please log in again.";
    }, 18000);

    return true;
  }

  applyAccountInteractionFix();
  window.setInterval(applyAccountInteractionFix, 500);
  showRememberedCharacterLobby();

  let enteringCharacter = false;
  let entryTimer = null;

  function hideLegacyLobby() {
    removeLegacyLobby();
  }

  function hideCharacterLobbyForEntry() {
    root.hidden = true;
    document.body.classList.remove("nrs-account-backdrop");
    for (const id of ["c", "hud"]) {
      const el = document.getElementById(id);
      if (el) el.style.visibility = "visible";
    }
  }

  function beginDirectEntry() {
    enteringCharacter = true;
    hideLegacyLobby();
    hideCharacterLobbyForEntry();
    if (entryTimer) window.clearTimeout(entryTimer);
    entryTimer = window.setTimeout(() => {
      entryTimer = null;
      if (!window.NRS?.session?.authed) {
        enteringCharacter = false;
        root.hidden = false;
        document.body.classList.add("nrs-account-backdrop");
      }
    }, 15000);
  }

  function finishDirectEntry() {
    enteringCharacter = false;
    if (entryTimer) {
      window.clearTimeout(entryTimer);
      entryTimer = null;
    }
    hideLegacyLobby();
  }

  // A character card is the only entry point. Its existing button sends the
  // secure selectCharacter request. The legacy #start screen is physically
  // removed rather than merely hidden, so no second lobby can be displayed.
  root.addEventListener("click", (event) => {
    const card = event.target.closest?.(".characterCard");
    if (!card || !root.contains(card)) return;

    const button = card.querySelector(".continueButton");
    if (!button || button.disabled) return;

    if (event.target.closest(".continueButton")) {
      beginDirectEntry();
      return;
    }

    event.preventDefault();
    beginDirectEntry();
    button.click();
  }, true);

  const stateObserver = new MutationObserver(() => {
    removeLegacyLobby();
    const session = window.NRS?.session;
    if (!enteringCharacter) return;

    if (session?.authed) {
      finishDirectEntry();
      return;
    }

    if (!root.hidden) {
      root.hidden = true;
      document.body.classList.remove("nrs-account-backdrop");
    }
  });
  stateObserver.observe(root, { attributes: true, attributeFilter: ["hidden"] });

  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;

    enteringCharacter = false;
    if (entryTimer) {
      window.clearTimeout(entryTimer);
      entryTimer = null;
    }
    hideLegacyLobby();

    const session = window.NRS?.session;
    const token = savedToken();
    if (session) {
      session.resume = false;
      session.authed = false;
      session.accountReady = false;
      session.id = null;
      session.ownerId = null;
      session.name = "";
      session.characters = [];
      if (token) session.token = token;
      try { session.ws?.close(1000, "history restore"); } catch {}
      session.open = false;
    }

    if (token) {
      showRememberedCharacterLobby();
    } else {
      clearRestoreTimer();
      root.classList.remove("nrs-account-restoring");
      const characterView = document.getElementById("nrsCharacterView");
      const loginCard = document.getElementById("nrsLoginCard");
      const submit = document.getElementById("nrsSubmit");
      const error = document.getElementById("nrsError");
      const status = document.getElementById("nrsStatus");

      if (characterView) characterView.hidden = true;
      if (loginCard) loginCard.hidden = false;
      root.hidden = false;
      document.body.classList.add("nrs-account-backdrop");
      if (submit) submit.disabled = false;
      if (error) error.textContent = "";
      if (status) status.textContent = "Log in to open your saved characters.";
    }

    for (const id of ["c", "hud"]) {
      const el = document.getElementById(id);
      if (el) el.style.visibility = "hidden";
    }
  });
})();
