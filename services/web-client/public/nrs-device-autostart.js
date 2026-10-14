(function () {
  "use strict";

  const TOKEN_KEY = "nrs_rp_account_session_v3";
  const ROOT_ID = "nrsAccount";
  const LOGIN_ID = "nrsLoginCard";
  const CHARACTER_VIEW_ID = "nrsCharacterView";

  const style = document.createElement("style");
  style.id = "nrsDeviceAutostartStyles";
  style.textContent = `
    #nrsAccount.nrs-device-resuming #${LOGIN_ID}{display:none!important}
    #nrsAccount.nrs-device-resuming{display:none!important}
    #nrsAccount.nrs-device-character #${LOGIN_ID}{display:none!important}
    #nrsAccount.nrs-device-character #${CHARACTER_VIEW_ID}{display:block!important}
  `;
  document.head.appendChild(style);

  function hasSavedSession() {
    try { return !!localStorage.getItem(TOKEN_KEY); } catch (_) { return false; }
  }

  function sync() {
    const root = document.getElementById(ROOT_ID);
    const session = window.NRS && window.NRS.session;
    if (!root || !session) return;

    // Once a character is authenticated, this account layer must stay out of the game.
    // nrs-online toggles root.hidden on successful entry; never unhide it just because a
    // previous character-selection response left accountReady true.
    if (session.authed) {
      if (root.classList.contains("nrs-device-resuming")) root.classList.remove("nrs-device-resuming");
      if (root.classList.contains("nrs-device-character")) root.classList.remove("nrs-device-character");
      if (!root.hidden) root.hidden = true;
      const login = document.getElementById(LOGIN_ID);
      if (login && !login.hidden) login.hidden = true;
      return;
    }

    if (!hasSavedSession()) {
      if (root.classList.contains("nrs-device-resuming")) root.classList.remove("nrs-device-resuming");
      if (root.classList.contains("nrs-device-character")) root.classList.remove("nrs-device-character");
      // A missing/expired token needs a usable recovery screen; never leave the
      // whole account root hidden after the resume attempt has been cleared.
      if (root.hidden) root.hidden = false;
      const login = document.getElementById(LOGIN_ID);
      if (login && !session.accountReady && login.hidden) login.hidden = false;
      return;
    }

    if (session.accountReady) {
      if (root.classList.contains("nrs-device-resuming")) root.classList.remove("nrs-device-resuming");
      if (!root.classList.contains("nrs-device-character")) root.classList.add("nrs-device-character");
      if (root.hidden) root.hidden = false;
      // Keep the login DOM intact but hidden. Removing it breaks the normal
      // recovery path if a remembered server session later becomes invalid.
      const login = document.getElementById(LOGIN_ID);
      if (login && !login.hidden) login.hidden = true;
      return;
    }

    // A remembered account is never sent back to the login page while the
    // saved session is being resumed. nrs-online owns the actual WebSocket
    // authentication; this layer only controls what the player sees.
    if (!root.classList.contains("nrs-device-resuming")) root.classList.add("nrs-device-resuming");
    if (root.classList.contains("nrs-device-character")) root.classList.remove("nrs-device-character");
    if (!root.hidden) root.hidden = true;
  }

  const observer = new MutationObserver(sync);
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden", "class"] });
  window.addEventListener("pageshow", sync);
  window.addEventListener("focus", sync);
  setInterval(sync, 250);
  sync();
})();
