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

    if (!hasSavedSession()) {
      root.classList.remove("nrs-device-resuming", "nrs-device-character");
      return;
    }

    if (session.accountReady) {
      root.classList.remove("nrs-device-resuming");
      root.classList.add("nrs-device-character");
      root.hidden = false;
      const login = document.getElementById(LOGIN_ID);
      if (login) login.remove();
      return;
    }

    // A remembered account is never sent back to the login page while the
    // saved session is being resumed. nrs-online owns the actual WebSocket
    // authentication; this layer only controls what the player sees.
    root.classList.add("nrs-device-resuming");
    root.hidden = true;
  }

  const observer = new MutationObserver(sync);
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden", "class"] });
  window.addEventListener("pageshow", sync);
  window.addEventListener("focus", sync);
  setInterval(sync, 250);
  sync();
})();
