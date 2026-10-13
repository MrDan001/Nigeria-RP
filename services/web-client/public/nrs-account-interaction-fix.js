(function () {
  "use strict";

  const root = document.getElementById("nrsAccount");
  if (!root) return;

  const SESSION_KEY = "nrs_rp_account_session_v3";
  let restoreTimer = null;

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
        "#start.nrs-direct-entry-hidden { display: none !important; }",
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

  // On a normal visit, bypass the login form when this device has a saved session.
  // The server still validates the token before the saved character list is trusted.
  showRememberedCharacterLobby();

  const start = document.getElementById("start");
  let enteringCharacter = false;
  let entryTimer = null;

  function hideSecondLobby() {
    if (!start) return;
    start.classList.add("nrs-direct-entry-hidden");
    start.setAttribute("aria-hidden", "true");
  }

  function restoreStartOverlay() {
    if (!start) return;
    start.classList.remove("nrs-direct-entry-hidden");
    start.removeAttribute("aria-hidden");
  }

  function beginDirectEntry() {
    enteringCharacter = true;
    hideSecondLobby();
    if (entryTimer) window.clearTimeout(entryTimer);
    entryTimer = window.setTimeout(() => {
      if (!window.NRS?.session?.authed) {
        enteringCharacter = false;
        restoreStartOverlay();
      }
    }, 15000);
  }

  function finishDirectEntry() {
    enteringCharacter = false;
    if (entryTimer) {
      window.clearTimeout(entryTimer);
      entryTimer = null;
    }
    hideSecondLobby();
  }

  // A character card is the entry point. Its existing button sends the secure
  // selectCharacter request; the old start overlay is hidden so there is no second lobby.
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
    const session = window.NRS?.session;
    if (enteringCharacter && session?.authed && root.hidden) finishDirectEntry();
  });
  stateObserver.observe(root, { attributes: true, attributeFilter: ["hidden"] });

  // Back/forward-cache restores the old page's JavaScript heap. Preserve the
  // saved token, reconnect the socket, and show the character lobby while the
  // server refreshes the account. Never force a returning player back to login.
  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;

    enteringCharacter = false;
    if (entryTimer) {
      window.clearTimeout(entryTimer);
      entryTimer = null;
    }
    restoreStartOverlay();

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