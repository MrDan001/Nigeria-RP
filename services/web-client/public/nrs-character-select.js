(function () {
  "use strict";

  const root = document.getElementById("nrsAccount");
  const view = document.getElementById("nrsCharacterView");
  if (!root || !view) return;

  const css = document.createElement("style");
  css.id = "nrsCharacterSelectStyles";
  css.textContent = String.raw`
    body.nrs-account-backdrop #c {
      visibility: visible !important;
      filter: blur(8px) brightness(.38) saturate(.82);
      transform: scale(1.035);
      transform-origin: center;
      transition: filter .25s ease;
    }
    body.nrs-account-backdrop #hud,
    body.nrs-account-backdrop #start,
    body.nrs-account-backdrop #rot {
      visibility: hidden !important;
    }
    #nrsAccount.nrs-character-screen {
      display: block;
      padding: 0;
      overflow: hidden;
      background:
        radial-gradient(ellipse at 14% 3%, rgba(117, 45, 169, .34), transparent 42%),
        radial-gradient(ellipse at 88% 65%, rgba(84, 31, 127, .28), transparent 44%),
        linear-gradient(110deg, rgba(20, 5, 36, .90), rgba(44, 11, 69, .77) 52%, rgba(23, 5, 40, .89));
      backdrop-filter: blur(5px);
      -webkit-backdrop-filter: blur(5px);
    }
    #nrsAccount.nrs-character-screen #nrsCharacterView {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100dvh;
      min-height: 0;
      max-height: 100dvh;
      overflow: hidden;
      margin: 0;
      padding: 0;
      border: 0;
      border-radius: 0;
      background: transparent;
      box-shadow: none;
      box-sizing: border-box;
    }
    #nrsAccount.nrs-character-screen #nrsCharacterView[hidden] { display: none !important; }
    #nrsAccount.nrs-character-screen .nrs-character-header {
      flex: 0 0 auto;
      min-height: 76px;
      display: flex;
      align-items: center;
      gap: clamp(12px, 2vw, 28px);
      padding: 12px clamp(16px, 5.5vw, 82px);
      box-sizing: border-box;
      background: rgba(14, 4, 26, .54);
      border-bottom: 1px solid rgba(255,255,255,.07);
    }
    #nrsAccount.nrs-character-screen .nrs-lobby-back {
      flex: 0 0 42px;
      width: 42px;
      height: 42px;
      display: grid;
      place-items: center;
      padding: 0;
      border: 1px solid rgba(235,222,255,.66);
      border-radius: 50%;
      background: rgba(255,255,255,.035);
      color: #f4ecff;
      font: 28px/1 system-ui, sans-serif;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    #nrsAccount.nrs-character-screen .nrs-lobby-back:active { transform: scale(.96); }
    #nrsAccount.nrs-character-screen .brand {
      flex: 1 1 auto;
      min-width: 0;
      display: flex;
      align-items: center;
      gap: 11px;
    }
    #nrsAccount.nrs-character-screen .logo {
      width: 43px;
      height: 43px;
      flex: 0 0 43px;
      border-radius: 12px;
      color: #21112d;
      background: linear-gradient(145deg, #ffeaa1, #d9a735);
      box-shadow: 0 4px 18px rgba(221,169,63,.2);
      font-size: 25px;
    }
    #nrsAccount.nrs-character-screen .brand strong {
      display: block;
      font-size: clamp(14px, 1.35vw, 20px);
      line-height: 1.1;
      letter-spacing: .07em;
      color: #fff;
    }
    #nrsAccount.nrs-character-screen .brand small {
      display: block;
      margin-top: 5px;
      color: #c4b4d2;
      font-size: 9px;
      letter-spacing: .12em;
    }
    #nrsAccount.nrs-character-screen .nrs-lobby-actions {
      flex: 0 0 auto;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: clamp(12px, 2.5vw, 36px);
    }
    #nrsAccount.nrs-character-screen .nrs-lobby-count {
      color: #f0d678;
      font-size: clamp(10px, 1.05vw, 14px);
      font-weight: 850;
      white-space: nowrap;
      letter-spacing: .06em;
    }
    #nrsAccount.nrs-character-screen .nrs-rules-button {
      border: 0;
      border-bottom: 2px solid rgba(239,206,90,.75);
      border-radius: 0;
      padding: 4px 0 3px;
      background: transparent;
      color: #f2d158;
      font: 800 clamp(11px, 1.5vw, 20px)/1.2 system-ui, sans-serif;
      text-decoration: none;
      white-space: nowrap;
      cursor: pointer;
    }
    #nrsAccount.nrs-character-screen .nrs-character-main {
      width: min(1270px, 88vw);
      max-width: 1270px;
      flex: 1 1 auto;
      min-height: 0;
      overflow: auto;
      box-sizing: border-box;
      margin: 0 auto;
      padding: clamp(22px, 4.1vh, 44px) 0 23px;
      scrollbar-width: thin;
      scrollbar-color: rgba(211,178,239,.35) transparent;
    }
    #nrsAccount.nrs-character-screen .eyebrow {
      margin: 0 0 8px;
      color: #d0badf;
      font-size: clamp(10px, 1.05vw, 14px);
      font-weight: 800;
      letter-spacing: .16em;
    }
    #nrsAccount.nrs-character-screen #nrsCharacterView h1 {
      margin: 0 0 9px;
      color: #fff;
      font-size: clamp(25px, 3vw, 39px);
      line-height: 1.04;
      font-weight: 850;
      letter-spacing: -.025em;
      text-transform: uppercase;
    }
    #nrsAccount.nrs-character-screen #nrsCharacterView .copy {
      max-width: 660px;
      margin: 0;
      color: #d3c6df;
      font-size: clamp(11px, 1vw, 13px);
      line-height: 1.5;
    }
    #nrsAccount.nrs-character-screen .accountSummary {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin: clamp(20px, 3.1vh, 31px) 0 10px;
      padding: 0;
      color: #d7c6e7;
      font-size: clamp(10px, 1vw, 13px);
    }
    #nrsAccount.nrs-character-screen .accountSummary strong {
      color: #f0d678;
      font-size: 11px;
      letter-spacing: .06em;
    }
    #nrsAccount.nrs-character-screen .characterList {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      align-items: stretch;
      gap: clamp(10px, 1.4vw, 18px);
      margin: 10px 0 17px;
    }
    #nrsAccount.nrs-character-screen .characterList > .copy { display: none; }
    #nrsAccount.nrs-character-screen .characterCard,
    #nrsAccount.nrs-character-screen .nrs-empty-slot {
      position: relative;
      min-width: 0;
      min-height: 0;
      overflow: hidden;
      box-sizing: border-box;
      padding: 0;
      border: 1px solid rgba(215,184,245,.18);
      border-radius: 12px;
      background: linear-gradient(135deg, rgba(83,40,126,.58), rgba(41,20,72,.63));
      box-shadow: 0 11px 30px rgba(5,0,15,.14);
      transition: border-color .18s ease, background .18s ease, transform .18s ease;
    }
    #nrsAccount.nrs-character-screen .characterCard { cursor: pointer; }
    #nrsAccount.nrs-character-screen .characterCard:hover,
    #nrsAccount.nrs-character-screen .nrs-empty-slot:hover {
      border-color: rgba(236,207,255,.55);
      background: linear-gradient(135deg, rgba(96,49,145,.73), rgba(48,23,82,.73));
    }
    #nrsAccount.nrs-character-screen .characterCard.selected {
      border-color: #efd36a;
      box-shadow: 0 0 0 1px rgba(239,211,106,.45), 0 12px 28px rgba(0,0,0,.2);
    }
    #nrsAccount.nrs-character-screen .nrs-character-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      min-height: 38px;
      padding: 8px 13px 5px;
      box-sizing: border-box;
      color: #e9ddf4;
      font-size: clamp(9px, .9vw, 12px);
      letter-spacing: .08em;
      text-transform: uppercase;
    }
    #nrsAccount.nrs-character-screen .nrs-character-index {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    #nrsAccount.nrs-character-screen .characterLevel {
      flex: 0 0 auto;
      padding: 4px 7px;
      border: 1px solid rgba(255,255,255,.18);
      border-radius: 6px;
      color: #f0d678;
      background: rgba(16,8,28,.24);
      font-size: 9px;
      letter-spacing: .03em;
    }
    #nrsAccount.nrs-character-screen .nrs-avatar-panel {
      position: relative;
      display: grid;
      place-items: end center;
      height: clamp(142px, 24vh, 224px);
      overflow: hidden;
      margin: 0 10px;
      border: 1px solid rgba(238,218,255,.08);
      border-radius: 8px;
      background: linear-gradient(150deg, rgba(130,81,175,.34), rgba(43,25,80,.22));
    }
    #nrsAccount.nrs-character-screen .nrs-avatar-panel:after {
      content: "";
      position: absolute;
      left: 12%;
      right: 12%;
      bottom: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(244,223,255,.4), transparent);
      pointer-events: none;
    }
    #nrsAccount.nrs-character-screen .nrs-avatar-panel svg {
      width: min(100%, 250px);
      height: 100%;
      display: block;
      filter: drop-shadow(0 8px 9px rgba(5,0,14,.18));
    }
    #nrsAccount.nrs-character-screen .characterHeading {
      display: block;
      padding: 12px 13px 0;
    }
    #nrsAccount.nrs-character-screen .characterHeading strong {
      display: block;
      color: #fff;
      font-size: clamp(12px, 1.25vw, 16px);
      line-height: 1.25;
      font-weight: 750;
      overflow-wrap: anywhere;
    }
    #nrsAccount.nrs-character-screen .characterHeading small {
      display: block;
      margin-top: 5px;
      color: #c7b6d8;
      font-size: clamp(9px, .92vw, 11px);
      line-height: 1.35;
      text-transform: uppercase;
      letter-spacing: .025em;
    }
    #nrsAccount.nrs-character-screen .nrs-money-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 10px 13px 0;
    }
    #nrsAccount.nrs-character-screen .nrs-money-chip {
      padding: 5px 7px;
      border: 1px solid rgba(255,255,255,.1);
      border-radius: 6px;
      background: rgba(12,6,23,.25);
      color: #d7c6e6;
      font-size: 9px;
      font-weight: 700;
    }
    #nrsAccount.nrs-character-screen .nrs-money-chip strong {
      color: #f5e7a7;
      font-weight: 800;
    }
    #nrsAccount.nrs-character-screen .continueButton {
      width: calc(100% - 26px);
      min-height: 39px;
      margin: 13px 13px 13px;
      padding: 8px 10px;
      border: 1px solid rgba(245,219,112,.64);
      border-radius: 8px;
      background: linear-gradient(180deg, #f0d267, #c79a31);
      color: #21112d;
      font-size: 10px;
      font-weight: 950;
      letter-spacing: .07em;
      box-shadow: 0 6px 16px rgba(8,2,17,.15);
      cursor: pointer;
      touch-action: manipulation;
    }
    #nrsAccount.nrs-character-screen .continueButton:disabled { opacity: .58; cursor: wait; }
    #nrsAccount.nrs-character-screen .nrs-empty-slot {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      justify-content: stretch;
      min-height: 285px;
      padding: 0;
      border-style: dashed;
      background: linear-gradient(145deg, rgba(75,38,111,.34), rgba(28,14,50,.42));
    }
    #nrsAccount.nrs-character-screen .nrs-empty-meta {
      padding: 16px 14px 8px;
      color: #c5b0db;
      font-size: 10px;
      font-weight: 850;
      letter-spacing: .09em;
    }
    #nrsAccount.nrs-character-screen .nrs-empty-art {
      flex: 1 1 auto;
      display: grid;
      place-items: center;
      min-height: 150px;
      margin: 0 10px;
      border-radius: 8px;
      background: rgba(132,91,177,.14);
    }
    #nrsAccount.nrs-character-screen .nrs-empty-art svg {
      width: 112px;
      max-width: 55%;
      height: 135px;
      opacity: .45;
    }
    #nrsAccount.nrs-character-screen .nrs-empty-label {
      margin: 13px 14px 4px;
      color: #e2d5ee;
      font-size: 12px;
      font-weight: 750;
    }
    #nrsAccount.nrs-character-screen .nrs-empty-help {
      margin: 0 14px 13px;
      color: #bda8d0;
      font-size: 10px;
      line-height: 1.4;
    }
    #nrsAccount.nrs-character-screen .nrs-empty-action {
      min-height: 36px;
      margin: 0 13px 13px;
      border: 1px solid rgba(233,208,255,.28);
      border-radius: 8px;
      background: rgba(255,255,255,.06);
      color: #f5eaff;
      font-size: 10px;
      font-weight: 850;
      letter-spacing: .055em;
      cursor: pointer;
    }
    #nrsAccount.nrs-character-screen .nrs-character-footer {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      flex-wrap: wrap;
      gap: 9px;
      margin-top: 12px;
    }
    #nrsAccount.nrs-character-screen #nrsCreateCharacterButton,
    #nrsAccount.nrs-character-screen #nrsCreateCharacterSubmit {
      width: auto;
      min-width: 190px;
      min-height: 40px;
      padding: 10px 16px;
      border: 1px solid rgba(242,215,109,.58);
      border-radius: 8px;
      background: linear-gradient(180deg, #f0d267, #c79a31);
      color: #21112d;
      font-size: 10px;
      font-weight: 950;
      letter-spacing: .055em;
      cursor: pointer;
      box-shadow: 0 7px 18px rgba(4,0,10,.17);
    }
    #nrsAccount.nrs-character-screen #nrsCreateCharacterButton[hidden],
    #nrsAccount.nrs-character-screen #nrsCreateCharacterPanel[hidden],
    #nrsAccount.nrs-character-screen #nrsSwitchAccount[hidden] {
      display: none !important;
    }
    #nrsAccount.nrs-character-screen #nrsSwitchAccount {
      width: auto;
      min-height: 40px;
      margin: 0;
      padding: 8px 14px;
      border: 1px solid rgba(255,255,255,.2);
      border-radius: 8px;
      background: rgba(20,8,33,.32);
      color: #e9ddf4;
      font-size: 10px;
      font-weight: 800;
      cursor: pointer;
    }
    #nrsAccount.nrs-character-screen .characterStatus {
      flex-basis: 100%;
      min-height: 18px;
      margin: 3px 0 0;
      color: #d8c7e6;
      font-size: 10px;
      line-height: 1.4;
      text-align: left;
    }
    #nrsAccount.nrs-character-screen #nrsCreateCharacterPanel {
      margin-top: 14px;
      padding: 15px;
      border: 1px solid rgba(235,210,255,.18);
      border-radius: 12px;
      background: rgba(26,10,43,.48);
    }
    #nrsAccount.nrs-character-screen #nrsCreateCharacterForm {
      display: grid;
      grid-template-columns: minmax(0,1fr) auto auto;
      align-items: end;
      gap: 10px;
      margin: 0;
    }
    #nrsAccount.nrs-character-screen #nrsCreateCharacterForm .field { min-width: 0; }
    #nrsAccount.nrs-character-screen #nrsCreateCharacterForm .field > span {
      color: #e9dcf4;
      font-size: 10px;
    }
    #nrsAccount.nrs-character-screen #nrsCharacterName {
      width: 100%;
      height: 40px;
      padding: 0 12px;
      border: 1px solid rgba(235,215,255,.2);
      border-radius: 8px;
      background: rgba(11,4,20,.62);
      color: #fff;
      font-size: 12px;
    }
    #nrsAccount.nrs-character-screen #nrsCreateCharacterForm .hint {
      grid-column: 1 / -1;
      color: #bca9ce;
      font-size: 10px;
    }
    #nrsAccount.nrs-character-screen #nrsCreateCharacterForm .subtleButton {
      min-height: 40px;
      margin: 0;
      padding: 8px 14px;
      border: 1px solid rgba(255,255,255,.18);
      border-radius: 8px;
      background: rgba(255,255,255,.05);
      color: #eee4f7;
      font-size: 10px;
      font-weight: 800;
      cursor: pointer;
    }
    #nrsAccount.nrs-character-screen #nrsCreateCharacterSubmit:disabled { opacity: .6; }
    #nrsCharacterRulesModal {
      position: fixed;
      z-index: 100002;
      inset: 0;
      display: grid;
      place-items: center;
      padding: 18px;
      box-sizing: border-box;
      background: rgba(6,2,12,.78);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      color: #fff;
      font-family: system-ui, sans-serif;
    }
    #nrsCharacterRulesModal[hidden] { display: none !important; }
    #nrsCharacterRulesModal .nrs-rules-card {
      width: min(520px, 100%);
      box-sizing: border-box;
      padding: 24px;
      border: 1px solid rgba(229,204,250,.22);
      border-radius: 17px;
      background: linear-gradient(145deg, #25133a, #100819);
      box-shadow: 0 24px 70px rgba(0,0,0,.45);
    }
    #nrsCharacterRulesModal .nrs-rules-kicker {
      margin: 0 0 7px;
      color: #f0d678;
      font-size: 10px;
      font-weight: 900;
      letter-spacing: .14em;
    }
    #nrsCharacterRulesModal h2 { margin: 0 0 10px; font-size: 24px; }
    #nrsCharacterRulesModal p { color: #d6c8e3; font-size: 12px; line-height: 1.55; }
    #nrsCharacterRulesModal ul { display: grid; gap: 9px; padding-left: 19px; color: #e9def2; font-size: 12px; line-height: 1.5; }
    #nrsCharacterRulesModal button {
      width: 100%;
      min-height: 42px;
      margin-top: 12px;
      border: 1px solid rgba(242,215,109,.6);
      border-radius: 8px;
      background: linear-gradient(180deg, #f0d267, #c79a31);
      color: #21112d;
      font-size: 10px;
      font-weight: 950;
      letter-spacing: .06em;
      cursor: pointer;
    }
    @media (max-height: 600px) and (orientation: landscape) {
      /* Keep the sign-in form reachable on short Android landscape viewports.
         Scroll the overlay itself rather than trapping the bottom fields in a clipped card. */
      #nrsAccount:not(.nrs-character-screen) {
        display: block;
        overflow-x: hidden;
        overflow-y: auto;
        padding: 10px;
        box-sizing: border-box;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior-y: contain;
      }
      #nrsAccount:not(.nrs-character-screen) #nrsLoginCard {
        width: min(600px, 100%);
        max-height: none;
        overflow: visible;
        margin: 0 auto;
        padding: 14px 18px;
      }
      #nrsAccount:not(.nrs-character-screen) .brand .logo {
        width: 36px;
        height: 36px;
        font-size: 21px;
      }
      #nrsAccount:not(.nrs-character-screen) .eyebrow { margin-top: 12px; }
      #nrsAccount:not(.nrs-character-screen) h1 {
        margin: 4px 0;
        font-size: 22px;
      }
      #nrsAccount:not(.nrs-character-screen) .copy { font-size: 11px; }
      #nrsAccount:not(.nrs-character-screen) .tabs { margin: 11px 0 10px; }
      #nrsAccount:not(.nrs-character-screen) .tab { min-height: 36px; }
      #nrsAccount:not(.nrs-character-screen) form { gap: 8px; }
      #nrsAccount:not(.nrs-character-screen) .field { gap: 4px; }
      #nrsAccount:not(.nrs-character-screen) input { height: 40px; }
      #nrsAccount:not(.nrs-character-screen) .submit { min-height: 40px; }
      #nrsAccount:not(.nrs-character-screen) .status { margin-top: 5px; }
    }
    @media (max-width: 760px) {
      #nrsAccount.nrs-character-screen .nrs-character-header { padding: 10px 14px; gap: 10px; min-height: 66px; }
      #nrsAccount.nrs-character-screen .nrs-lobby-back { flex-basis: 36px; width: 36px; height: 36px; font-size: 24px; }
      #nrsAccount.nrs-character-screen .brand { gap: 8px; }
      #nrsAccount.nrs-character-screen .brand small { font-size: 7px; letter-spacing: .06em; }
      #nrsAccount.nrs-character-screen .logo { width: 36px; height: 36px; flex-basis: 36px; font-size: 22px; }
      #nrsAccount.nrs-character-screen .nrs-lobby-actions { gap: 12px; }
      #nrsAccount.nrs-character-screen .nrs-lobby-count { display: none; }
      #nrsAccount.nrs-character-screen .nrs-character-main { width: min(94vw, 620px); padding-top: 23px; }
      #nrsAccount.nrs-character-screen .characterList { grid-template-columns: repeat(2, minmax(0,1fr)); gap: 10px; }
      #nrsAccount.nrs-character-screen .nrs-avatar-panel { height: clamp(135px, 25vh, 190px); margin: 0 7px; }
      #nrsAccount.nrs-character-screen .characterHeading { padding: 10px 10px 0; }
      #nrsAccount.nrs-character-screen .nrs-character-meta { padding-left: 10px; padding-right: 10px; }
      #nrsAccount.nrs-character-screen .nrs-money-row { padding-left: 10px; padding-right: 10px; }
      #nrsAccount.nrs-character-screen .continueButton { width: calc(100% - 20px); margin: 11px 10px 10px; }
      #nrsAccount.nrs-character-screen .nrs-empty-slot { min-height: 270px; }
    }
    @media (max-width: 460px) {
      #nrsAccount.nrs-character-screen .nrs-character-header { gap: 8px; }
      #nrsAccount.nrs-character-screen .brand strong { font-size: 12px; letter-spacing: .035em; }
      #nrsAccount.nrs-character-screen .brand small { max-width: 145px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      #nrsAccount.nrs-character-screen .nrs-rules-button { font-size: 9px; }
      #nrsAccount.nrs-character-screen .nrs-character-main { width: 92vw; padding-top: 19px; }
      #nrsAccount.nrs-character-screen .characterList { grid-template-columns: 1fr; }
      #nrsAccount.nrs-character-screen .nrs-avatar-panel { height: 175px; }
      #nrsAccount.nrs-character-screen .nrs-empty-slot { min-height: 250px; }
      #nrsAccount.nrs-character-screen #nrsCreateCharacterForm { grid-template-columns: minmax(0,1fr) minmax(0,1fr); }
      #nrsAccount.nrs-character-screen #nrsCreateCharacterForm .field { grid-column: 1 / -1; }
      #nrsAccount.nrs-character-screen #nrsCreateCharacterSubmit { min-width: 0; width: 100%; }
      #nrsAccount.nrs-character-screen #nrsCreateCharacterForm .subtleButton { min-width: 0; width: 100%; }
    }
    @media (max-height: 560px) and (min-width: 761px) {
      #nrsAccount.nrs-character-screen .nrs-character-header { min-height: 62px; padding-top: 6px; padding-bottom: 6px; }
      #nrsAccount.nrs-character-screen .nrs-character-main { padding-top: 16px; }
      #nrsAccount.nrs-character-screen .nrs-character-main .eyebrow { margin-bottom: 4px; }
      #nrsAccount.nrs-character-screen #nrsCharacterView h1 { font-size: 27px; margin-bottom: 4px; }
      #nrsAccount.nrs-character-screen .accountSummary { margin-top: 13px; }
      #nrsAccount.nrs-character-screen .nrs-avatar-panel { height: 124px; }
      #nrsAccount.nrs-character-screen .nrs-empty-slot { min-height: 240px; }
      #nrsAccount.nrs-character-screen .nrs-character-meta { min-height: 31px; padding-top: 5px; }
    }
  `;
  document.head.appendChild(css);

  const byId = (id) => document.getElementById(id);
  const header = document.createElement("header");
  header.className = "nrs-character-header";
  const back = document.createElement("button");
  back.className = "nrs-lobby-back";
  back.type = "button";
  back.textContent = "←";
  back.setAttribute("aria-label", "Return to account login");

  const brand = view.querySelector(".brand");
  const actions = document.createElement("div");
  actions.className = "nrs-lobby-actions";
  const count = document.createElement("span");
  count.className = "nrs-lobby-count";
  count.textContent = "0 / 3 CHARACTERS";
  const rules = document.createElement("button");
  rules.className = "nrs-rules-button";
  rules.type = "button";
  rules.textContent = "CHARACTER RULES";
  rules.setAttribute("aria-haspopup", "dialog");
  actions.append(count, rules);
  header.append(back, brand, actions);
  view.insertBefore(header, view.firstChild);

  const main = document.createElement("main");
  main.className = "nrs-character-main";
  for (const child of [...view.children]) {
    if (child !== header) main.appendChild(child);
  }
  view.appendChild(main);

  const eyebrow = view.querySelector(".eyebrow");
  const heading = view.querySelector("h1");
  const intro = view.querySelector("#nrsCharacterView .copy");
  if (eyebrow) eyebrow.textContent = "NIGERIA ROLEPLAY  /  CITIZEN LOBBY";
  if (heading) heading.textContent = "SELECT CHARACTER";
  if (intro) intro.textContent = "Choose a saved citizen to enter the shared Nigeria RP world. Each character keeps their own money, job, home and progress.";

  const createButton = byId("nrsCreateCharacterButton");
  const switchButton = byId("nrsSwitchAccount");
  const status = byId("nrsCharacterStatus");
  const list = byId("nrsCharacterList");
  const summary = byId("nrsCharacterEmail");
  const characterCount = byId("nrsCharacterCount");
  const createPanel = byId("nrsCreateCharacterPanel");
  const rememberedKey = "nrs_rp_last_character_v1";
  const stateCityLabels = {
    "port-harcourt": "PORT HARCOURT · RIVERS STATE",
    "aba": "ABA · ABIA STATE",
    "owerri": "OWERRI · IMO STATE",
    "uyo": "UYO · AKWA IBOM STATE",
    "warri": "WARRI · DELTA STATE",
    "yenagoa": "YENAGOA · BAYELSA STATE",
    "benin-city": "BENIN CITY · EDO STATE"
  };

  const rulesModal = document.createElement("div");
  rulesModal.id = "nrsCharacterRulesModal";
  rulesModal.hidden = true;
  rulesModal.setAttribute("role", "dialog");
  rulesModal.setAttribute("aria-modal", "true");
  rulesModal.setAttribute("aria-labelledby", "nrsCharacterRulesTitle");
  rulesModal.innerHTML = `
    <section class="nrs-rules-card">
      <p class="nrs-rules-kicker">NRS CITIZEN LOBBY</p>
      <h2 id="nrsCharacterRulesTitle">Character rules</h2>
      <p>Pick the citizen you want to play in Nigeria RP.</p>
      <ul>
        <li>One account can create a maximum of three characters.</li>
        <li>Every character needs a unique <strong>Firstname_lastname</strong> name.</li>
        <li>Cash, bank balance, job, home and game progress belong to the selected character.</li>
        <li>All characters enter the same shared Nigeria RP world; this screen selects a character, not a separate server.</li>
      </ul>
      <button type="button" id="nrsCharacterRulesClose">GOT IT</button>
    </section>`;
  document.body.appendChild(rulesModal);

  const showRules = () => {
    rulesModal.hidden = false;
    byId("nrsCharacterRulesClose").focus();
  };
  const hideRules = () => {
    rulesModal.hidden = true;
    rules.focus();
  };
  rules.addEventListener("click", showRules);
  byId("nrsCharacterRulesClose").addEventListener("click", hideRules);
  rulesModal.addEventListener("click", (event) => {
    if (event.target === rulesModal) hideRules();
  });
  back.addEventListener("click", () => switchButton?.click());
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !rulesModal.hidden) hideRules();
  });

  function makeAvatarSvg(index) {
    const looks = [
      { jacket: "#29354d", shirt: "#d6dfdf", hair: "#17151c", skin: "#a96d4f", trim: "#e2ba59" },
      { jacket: "#37463b", shirt: "#e2d7c6", hair: "#251c18", skin: "#bd815e", trim: "#93d4be" },
      { jacket: "#4b304d", shirt: "#f0d2b5", hair: "#211922", skin: "#8e563f", trim: "#e2aa76" }
    ];
    const look = looks[index % looks.length];
    const hair = index % 3 === 1
      ? '<path d="M76 82 Q67 43 96 29 Q123 13 147 35 Q165 51 154 88 L148 119 L75 117Z" fill="' + look.hair + '"/><path d="M88 47 Q112 27 141 46" fill="none" stroke="#6b4b3f" stroke-width="5" opacity=".45"/>'
      : index % 3 === 2
        ? '<path d="M77 77 Q69 41 93 30 Q122 12 147 33 Q166 50 153 84 L146 105 L81 105Z" fill="' + look.hair + '"/><path d="M84 53 Q70 78 82 111 M151 53 Q162 79 149 111" fill="none" stroke="' + look.hair + '" stroke-width="10" stroke-linecap="round"/>'
        : '<path d="M77 75 Q73 38 99 28 Q125 18 146 34 Q160 45 156 75 L148 88 L82 88Z" fill="' + look.hair + '"/><path d="M86 49 Q111 18 146 43" fill="none" stroke="#5b4034" stroke-width="4" opacity=".45"/>';
    return '<svg viewBox="0 0 240 220" role="img" aria-label="Stylised character portrait" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><linearGradient id="bg' + index + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9871c0" stop-opacity=".42"/><stop offset="1" stop-color="#2a1849" stop-opacity=".3"/></linearGradient>' +
      '<linearGradient id="coat' + index + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + look.jacket + '"/><stop offset="1" stop-color="#121723"/></linearGradient>' +
      '<linearGradient id="face' + index + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + look.skin + '"/><stop offset="1" stop-color="#71412f"/></linearGradient></defs>' +
      '<rect width="240" height="220" fill="url(#bg' + index + ')"/>' +
      '<circle cx="120" cy="91" r="70" fill="#e6d1ff" opacity=".055"/>' +
      '<path d="M35 222 Q38 174 68 153 Q88 140 104 136 L136 136 Q156 142 177 154 Q204 174 207 222Z" fill="url(#coat' + index + ')"/>' +
      '<path d="M101 133 L101 157 Q120 176 139 157 L139 133Z" fill="url(#face' + index + ')"/>' +
      '<path d="M100 146 L120 165 L140 146 L157 157 L137 194 L120 179 L103 194 L83 157Z" fill="' + look.shirt + '" opacity=".94"/>' +
      '<path d="M69 158 L97 145 L120 178 L143 145 L171 158 L187 220 L53 220Z" fill="url(#coat' + index + ')"/>' +
      '<path d="M101 147 L120 164 L139 147 L132 183 L120 191 L108 183Z" fill="' + look.shirt + '"/>' +
      '<path d="M91 145 L105 139 L120 164 L135 139 L149 145 L138 166 L120 178 L102 166Z" fill="' + look.jacket + '"/>' +
      '<path d="M90 73 Q92 46 120 44 Q148 46 150 74 L146 109 Q141 132 120 138 Q99 132 94 109Z" fill="url(#face' + index + ')"/>' +
      '<path d="M86 75 Q82 48 102 32 Q124 17 147 35 Q163 50 155 79 L149 94 L145 69 Q130 61 116 55 Q104 67 91 69 L91 100Z" fill="' + look.hair + '"/>' +
      hair +
      '<path d="M101 89 Q106 85 112 89 M128 89 Q134 85 139 89" fill="none" stroke="#38231f" stroke-width="2.4" stroke-linecap="round"/>' +
      '<path d="M118 92 L114 105 L121 106" fill="none" stroke="#7e4d39" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M111 116 Q120 122 130 115" fill="none" stroke="#542d29" stroke-width="2.6" stroke-linecap="round"/>' +
      '<path d="M91 71 Q97 47 121 42 Q143 42 151 66" fill="none" stroke="' + look.trim + '" stroke-width="1.5" opacity=".65"/>' +
      '<circle cx="58" cy="47" r="2" fill="' + look.trim + '" opacity=".8"/><circle cx="185" cy="77" r="2" fill="' + look.trim + '" opacity=".7"/>' +
      '<path d="M33 204 H207" stroke="' + look.trim + '" stroke-width="1" opacity=".25"/>' +
      '</svg>';
  }

  function createSilhouetteSvg() {
    return '<svg viewBox="0 0 120 145" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="60" cy="43" r="24" fill="#bda2df" opacity=".6"/>' +
      '<path d="M17 139 Q19 98 39 82 Q49 74 60 74 Q71 74 81 82 Q101 98 103 139Z" fill="#bda2df" opacity=".6"/>' +
      '<path d="M31 24 Q40 7 60 8 Q83 8 90 27" fill="none" stroke="#8b6ab4" stroke-width="7" stroke-linecap="round" opacity=".5"/>' +
      '</svg>';
  }

  function numberMoney(value) {
    return Math.max(0, Number(value) || 0).toLocaleString("en-NG");
  }

  function selectCard(card) {
    if (!list) return;
    list.querySelectorAll(".characterCard").forEach((item) => item.classList.toggle("selected", item === card));
    const name = card.querySelector(".characterHeading strong")?.textContent || "your character";
    if (status) status.textContent = "Selected " + name + ". Choose ENTER CITY to load this saved character.";
  }

  function openCreateCharacter() {
    if (!createButton || createButton.disabled || !SReadyForNewCharacter()) return;
    if (createPanel && !createPanel.hidden) {
      byId("nrsCharacterName")?.focus();
      return;
    }
    createButton.click();
  }

  function SReadyForNewCharacter() {
    const session = window.NRS?.session;
    return !!session && session.accountReady && Array.isArray(session.characters) && session.characters.length < 3;
  }

  function enhanceCards() {
    if (!list) return;
    const cards = [...list.querySelectorAll(".characterCard")];
    const placeholderText = list.querySelector(":scope > .copy");
    if (placeholderText) placeholderText.remove();

    cards.forEach((card, index) => {
      if (card.dataset.nrsEnhanced === "true") return;
      card.dataset.nrsEnhanced = "true";
      card.tabIndex = 0;
      card.setAttribute("aria-label", "Select character " + (index + 1));
      const heading = card.querySelector(".characterHeading");
      const nameBlock = heading?.firstElementChild;
      const level = heading?.querySelector(".characterLevel");
      const originalDetails = card.querySelector(":scope > small");
      const continueButton = card.querySelector(".continueButton");
      const character = window.NRS?.session?.characters?.[index] || {};
      const cityNode = nameBlock?.querySelector("small");
      const cityId = String(character.cityId || "port-harcourt");
      if (cityNode) cityNode.textContent = stateCityLabels[cityId] || cityId.replace(/-/g, " ").toUpperCase();

      const meta = document.createElement("div");
      meta.className = "nrs-character-meta";
      const indexLabel = document.createElement("span");
      indexLabel.className = "nrs-character-index";
      indexLabel.textContent = "CHARACTER SLOT 0" + (index + 1);
      meta.appendChild(indexLabel);
      if (level) {
        level.textContent = "LEVEL " + Math.max(1, Number(character.level ?? level.textContent.replace(/\D/g, "")) || 1);
        meta.appendChild(level);
      }

      const avatar = document.createElement("div");
      avatar.className = "nrs-avatar-panel";
      avatar.innerHTML = makeAvatarSvg(index);
      avatar.setAttribute("aria-hidden", "true");

      if (heading) heading.insertBefore(avatar, heading.firstChild);
      card.insertBefore(avatar, card.firstChild);
      card.insertBefore(meta, avatar);

      if (nameBlock) nameBlock.classList.add("nrs-character-name-block");
      if (originalDetails) {
        originalDetails.className = "nrs-money-row";
        const moneyRow = document.createElement("div");
        moneyRow.className = "nrs-money-row";
        const cashChip = document.createElement("span");
        cashChip.className = "nrs-money-chip";
        cashChip.innerHTML = "CASH <strong>₦" + numberMoney(character.cash) + "</strong>";
        const bankChip = document.createElement("span");
        bankChip.className = "nrs-money-chip";
        bankChip.innerHTML = "BANK <strong>₦" + numberMoney(character.bank) + "</strong>";
        moneyRow.append(cashChip, bankChip);
        originalDetails.replaceWith(moneyRow);
      }
      if (continueButton) {
        continueButton.textContent = "ENTER CITY";
        continueButton.setAttribute("aria-label", "Enter Nigeria RP as " + (nameBlock?.querySelector("strong")?.textContent || "this character"));
      }
      card.addEventListener("click", (event) => {
        if (event.target.closest("button")) return;
        selectCard(card);
      });
      card.addEventListener("keydown", (event) => {
        if (event.target !== card || (event.key !== "Enter" && event.key !== " ")) return;
        event.preventDefault();
        selectCard(card);
      });

      try {
        const lastId = localStorage.getItem(rememberedKey) || "";
        if (lastId && character.id && character.id === lastId) selectCard(card);
      } catch {}
    });

    const oldEmpty = [...list.querySelectorAll(".nrs-empty-slot")];
    const desiredEmptyCount = Math.max(0, 3 - cards.length);
    if (oldEmpty.length !== desiredEmptyCount) {
      oldEmpty.forEach((item) => item.remove());
      for (let i = cards.length; i < 3; i += 1) {
        const slot = document.createElement("section");
        slot.className = "nrs-empty-slot";
        const meta = document.createElement("div");
        meta.className = "nrs-empty-meta";
        meta.textContent = "CHARACTER SLOT 0" + (i + 1);
        const art = document.createElement("div");
        art.className = "nrs-empty-art";
        art.innerHTML = createSilhouetteSvg();
        const label = document.createElement("strong");
        label.className = "nrs-empty-label";
        label.textContent = "Empty character slot";
        const help = document.createElement("p");
        help.className = "nrs-empty-help";
        help.textContent = "Create another citizen to begin a new life in Nigeria RP.";
        const add = document.createElement("button");
        add.type = "button";
        add.className = "nrs-empty-action";
        add.textContent = "+ CREATE CHARACTER";
        add.addEventListener("click", openCreateCharacter);
        slot.append(meta, art, label, help, add);
        list.appendChild(slot);
      }
    }

    if (characterCount) {
      const used = cards.length;
      count.textContent = used + " / 3 CHARACTERS";
      characterCount.textContent = used + " / 3 characters";
    }
    if (createButton) createButton.textContent = cards.length >= 3 ? "CHARACTER LIMIT REACHED (3/3)" : "+ CREATE CHARACTER";
  }

  function updateOverlayState() {
    const authVisible = !root.hidden;
    const selectionVisible = authVisible && !view.hidden;
    document.body.classList.toggle("nrs-account-backdrop", authVisible);
    root.classList.toggle("nrs-character-screen", selectionVisible);
    if (selectionVisible) enhanceCards();
  }

  back.addEventListener("focus", () => {});
  const observer = new MutationObserver(() => {
    if (list) enhanceCards();
    updateOverlayState();
  });
  observer.observe(root, { attributes: true, attributeFilter: ["hidden", "class"], subtree: true, childList: true });
  if (view) observer.observe(view, { attributes: true, attributeFilter: ["hidden"] });
  window.setInterval(updateOverlayState, 250);
  updateOverlayState();
})();