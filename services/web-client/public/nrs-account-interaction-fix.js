(function () {
  "use strict";

  const root = document.getElementById("nrsAccount");
  if (!root) return;

  function applyAccountInteractionFix() {
    const styleId = "nrsAccountInteractionFixStyles";
    let style = document.getElementById(styleId);
    if (!style) {
      style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        /* Account UI must sit above the game canvas and remain a real touch target. */
        body.nrs-account-backdrop { touch-action: auto !important; }
        #nrsAccount {
          z-index: 100001 !important;
          pointer-events: auto !important;
          touch-action: auto !important;
          isolation: isolate;
          -webkit-user-select: text !important;
          user-select: text !important;
        }
        #nrsAccount .card,
        #nrsAccount form,
        #nrsAccount button,
        #nrsAccount input,
        #nrsAccount label,
        #nrsAccount .tab,
        #nrsAccount .submit,
        #nrsAccount .subtleButton,
        #nrsAccount .continueButton {
          pointer-events: auto !important;
          touch-action: manipulation !important;
        }
        #nrsAccount button,
        #nrsAccount input { position: relative; z-index: 1; }
        #nrsAccount input { -webkit-user-select: text !important; user-select: text !important; }
        #start.nrs-direct-entry-hidden { display: none !important; }
      `;
      document.head.appendChild(style);
    }

    root.style.setProperty("pointer-events", "auto", "important");
    root.style.setProperty("z-index", "100001", "important");
    root.style.setProperty("touch-action", "auto", "important");
  }

  applyAccountInteractionFix();
  window.setInterval(applyAccountInteractionFix, 500);

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

  // The character card itself is now the entry point. The old UI required a
  // second click on ENTER CITY, which created an unnecessary pre-game step.
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

  // After selectCharacter succeeds, authOk hides the account overlay. The 3D
  // world is already running; only the old landscape/start overlay was blocking it.
  const stateObserver = new MutationObserver(() => {
    const session = window.NRS?.session;
    if (enteringCharacter && session?.authed && root.hidden) finishDirectEntry();
  });
  stateObserver.observe(root, { attributes: true, attributeFilter: ["hidden"] });

  // Android/Chrome can restore the entire document from the back/forward cache.
  // Reset the stale login state and make the restored document use a fresh socket
  // without silently resuming the old character. The persistent token remains in
  // localStorage, so a normal fresh visit still keeps remembered-account behavior.
  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;

    const session = window.NRS?.session;
    enteringCharacter = false;
    if (entryTimer) {
      window.clearTimeout(entryTimer);
      entryTimer = null;
    }
    restoreStartOverlay();

    if (session) {
      session.resume = false;
      session.authed = false;
      session.accountReady = false;
      session.id = null;
      session.ownerId = null;
      session.name = "";
      session.characters = [];
      // Do not delete localStorage. Only this restored JS session is forced to
      // wait for an explicit login instead of auto-resuming a stale socket.
      session.token = "";
      try { session.ws?.close(1000, "history restore"); } catch {}
      session.ws = null;
      session.open = false;
    }

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
    if (status) status.textContent = "Reconnecting securely — log in to continue.";

    for (const id of ["c", "hud"]) {
      const el = document.getElementById(id);
      if (el) el.style.visibility = "hidden";
    }
  });
})();
