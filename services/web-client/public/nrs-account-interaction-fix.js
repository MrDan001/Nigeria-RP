(function () {
  "use strict";

  function applyAccountInteractionFix() {
    const root = document.getElementById("nrsAccount");
    if (!root) return;

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
      `;
      document.head.appendChild(style);
    }

    root.style.setProperty("pointer-events", "auto", "important");
    root.style.setProperty("z-index", "100001", "important");
    root.style.setProperty("touch-action", "auto", "important");
  }

  applyAccountInteractionFix();
  window.setInterval(applyAccountInteractionFix, 500);
})();
