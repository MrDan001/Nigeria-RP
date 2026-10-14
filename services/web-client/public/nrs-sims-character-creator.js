(function () {
  "use strict";

  const N = window.NRS = window.NRS || {};
  const state = {
    skin: "#7b4528",
    hair: "#17120f",
    hairStyle: "long-braids",
    top: "cream",
    bottom: "denim",
    shoes: "white",
    accessory: "gold",
    gender: "female",
    trait: "Creative",
    expression: "happy"
  };

  const palettes = {
    skin: ["#4b291b", "#63351f", "#7b4528", "#955c39", "#b97952", "#d69a73"],
    hair: ["#17120f", "#2d1a12", "#4b2b1b", "#6d4127", "#a96b3c", "#6b1821"],
    top: ["cream", "black", "green", "red", "blue"],
    bottom: ["denim", "black", "khaki", "white"],
    shoes: ["white", "black", "brown"]
  };

  const topColors = { cream: "#f4eee3", black: "#17191d", green: "#147a52", red: "#a83232", blue: "#2f67a9" };
  const bottomColors = { denim: "#41648b", black: "#1b1d20", khaki: "#8a7954", white: "#e9e7e1" };
  const shoeColors = { white: "#f2f2ee", black: "#17191b", brown: "#6c432a" };

  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); }
  function q(id) { return document.getElementById(id); }

  const style = document.createElement("style");
  style.id = "nrsSimsCreatorStyles";
  style.textContent = `
    #nrsSimsCreator{position:fixed;inset:0;z-index:100005;display:none;background:linear-gradient(115deg,rgba(20,7,36,.98),rgba(49,16,72,.97));color:#fff;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;touch-action:manipulation}
    #nrsSimsCreator.open{display:flex}
    #nrsSimsCreator *{box-sizing:border-box}
    .sc-head{height:72px;flex:0 0 72px;display:flex;align-items:center;gap:14px;padding:10px clamp(14px,4vw,52px);border-bottom:1px solid rgba(255,255,255,.1);background:rgba(9,3,18,.4)}
    .sc-back{width:42px;height:42px;border-radius:50%;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.06);color:#fff;font-size:25px;cursor:pointer}
    .sc-title{flex:1}.sc-title b{display:block;font-size:clamp(14px,2vw,21px);letter-spacing:.08em}.sc-title small{color:#bdaed0;font-size:9px;letter-spacing:.14em}
    .sc-save-top{border:1px solid #efd36a;background:#efd36a;color:#23132f;border-radius:9px;padding:10px 15px;font-weight:900;font-size:10px;cursor:pointer}
    .sc-body{width:min(1380px,94vw);margin:0 auto;flex:1;min-height:0;display:grid;grid-template-columns:minmax(320px,1fr) minmax(330px,430px);gap:clamp(16px,3vw,42px);padding:22px 0 26px;overflow:hidden}
    .sc-stage{position:relative;min-height:0;border:1px solid rgba(255,255,255,.12);border-radius:18px;overflow:hidden;background:radial-gradient(circle at 50% 30%,rgba(142,91,183,.5),rgba(44,17,67,.8) 60%,rgba(19,7,29,.96));display:flex;align-items:flex-end;justify-content:center}
    .sc-stage:before{content:"";position:absolute;left:10%;right:10%;bottom:5%;height:26%;background:radial-gradient(ellipse,rgba(5,0,12,.5),transparent 70%)}
    .sc-avatar{position:relative;width:min(75%,420px);height:92%;min-height:360px;display:flex;align-items:flex-end;justify-content:center;z-index:1}
    .sc-avatar svg{width:100%;height:100%;filter:drop-shadow(0 20px 18px rgba(0,0,0,.3))}
    .sc-nameplate{position:absolute;left:18px;bottom:18px;z-index:2;padding:10px 13px;border-radius:10px;background:rgba(12,4,22,.72);border:1px solid rgba(255,255,255,.12);backdrop-filter:blur(8px)}
    .sc-nameplate b{display:block;font-size:14px}.sc-nameplate small{color:#cdbbdc;font-size:9px}
    .sc-panel{min-height:0;display:flex;flex-direction:column;border:1px solid rgba(255,255,255,.11);border-radius:18px;background:rgba(12,5,22,.66);overflow:hidden}
    .sc-tabs{display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid rgba(255,255,255,.1)}
    .sc-tab{min-height:48px;border:0;border-right:1px solid rgba(255,255,255,.08);background:transparent;color:#a996b8;font-weight:800;font-size:9px;cursor:pointer}.sc-tab.active{color:#fff;background:rgba(239,211,106,.1);box-shadow:inset 0 -2px #efd36a}
    .sc-content{padding:16px;overflow:auto;flex:1}.sc-section{margin-bottom:18px}.sc-section h3{margin:0 0 9px;font-size:10px;letter-spacing:.13em;color:#d8c7e2;text-transform:uppercase}
    .sc-swatches{display:flex;flex-wrap:wrap;gap:8px}.sc-swatch{width:34px;height:34px;border-radius:50%;border:2px solid rgba(255,255,255,.18);cursor:pointer;box-shadow:0 2px 7px rgba(0,0,0,.2)}.sc-swatch.active{border-color:#efd36a;box-shadow:0 0 0 2px rgba(239,211,106,.25)}
    .sc-choice-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.sc-choice{min-height:44px;border:1px solid rgba(255,255,255,.1);border-radius:9px;background:rgba(255,255,255,.045);color:#e9deef;font-weight:750;font-size:10px;cursor:pointer}.sc-choice.active{border-color:#efd36a;background:rgba(239,211,106,.12);color:#fff}
    .sc-traits{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.sc-trait{padding:12px 8px;border:1px solid rgba(255,255,255,.1);border-radius:10px;background:rgba(255,255,255,.04);color:#ddd0e6;font-size:10px;font-weight:800;cursor:pointer}.sc-trait.active{border-color:#efd36a;color:#fff;background:rgba(239,211,106,.12)}
    .sc-name{width:100%;height:46px;border-radius:9px;border:1px solid rgba(255,255,255,.14);background:#0b0611;color:#fff;padding:0 12px;outline:0;font-size:13px}.sc-name:focus{border-color:#efd36a}
    .sc-footer{padding:12px 16px;border-top:1px solid rgba(255,255,255,.1);display:flex;gap:8px}.sc-footer button{flex:1;min-height:44px;border-radius:9px;font-weight:900;font-size:10px;cursor:pointer}.sc-cancel{border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);color:#d8c9e1}.sc-create{border:1px solid #efd36a;background:linear-gradient(180deg,#f3d96e,#c79b32);color:#251431}.sc-error{min-height:16px;color:#ff9cac;font-size:9px;padding:0 16px 5px}
    @media(max-width:760px){#nrsSimsCreator{overflow:auto}.sc-head{height:64px;flex-basis:64px}.sc-body{display:flex;flex-direction:column;width:96vw;overflow:auto;padding:10px 0 18px}.sc-stage{height:52vh;min-height:330px;flex:0 0 52vh}.sc-panel{min-height:430px;flex:0 0 auto}.sc-avatar{height:94%}.sc-save-top{display:none}}
  `;
  document.head.appendChild(style);

  function avatarSvg() {
    const hair = state.hair;
    const top = topColors[state.top];
    const bottom = bottomColors[state.bottom];
    const shoes = shoeColors[state.shoes];
    const skin = state.skin;
    const eye = state.expression === "sad" ? "M137 118 Q145 113 153 118 M177 118 Q185 113 193 118" : state.expression === "angry" ? "M136 114 L153 118 M177 118 L194 114" : "M137 116 Q145 121 153 116 M177 116 Q185 121 193 116";
    const mouth = state.expression === "sad" ? "M157 145 Q165 138 173 145" : state.expression === "angry" ? "M157 145 L173 143" : "M156 141 Q165 151 174 141";
    const hairBack = state.hairStyle === "short" ? `<path d="M120 94Q120 39 165 35Q210 39 210 94L198 181Q165 206 132 181Z" fill="${hair}"/>` : state.hairStyle === "afro" ? `<circle cx="165" cy="75" r="59" fill="${hair}"/>` : `<path d="M116 96Q115 38 165 34Q215 38 214 96L218 270Q205 294 191 271L180 172L165 188L150 172L139 271Q125 294 112 270Z" fill="${hair}"/>`;
    const frontHair = state.hairStyle === "short" ? `<path d="M124 89Q125 38 165 37Q205 38 206 89Q190 70 177 66Q159 80 124 89Z" fill="${hair}"/>` : state.hairStyle === "afro" ? `<path d="M116 91Q120 37 165 36Q210 37 214 91Q199 68 181 66Q157 78 116 91Z" fill="${hair}"/>` : `<path d="M119 91Q121 37 165 36Q209 37 211 91Q191 69 176 64Q154 80 119 91Z" fill="${hair}"/>`;
    return `<svg viewBox="0 0 330 500" xmlns="http://www.w3.org/2000/svg" aria-label="Character preview">
      <defs><linearGradient id="skinGlow" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${skin}"/><stop offset="1" stop-color="${skin}"/></linearGradient></defs>
      ${hairBack}
      <path d="M133 198Q116 209 109 246L98 350H232L221 246Q214 209 197 198Z" fill="${top}"/>
      <path d="M137 335L193 335L205 454L180 454L165 370L150 454L125 454Z" fill="${bottom}"/>
      <path d="M124 452h28v17h-38q0-17 10-17zm54 0h28q10 0 10 17h-38z" fill="${shoes}"/>
      <ellipse cx="165" cy="125" rx="43" ry="55" fill="url(#skinGlow)"/>
      <path d="M126 123Q127 77 165 74Q203 77 204 123Q198 91 177 86Q154 98 126 123Z" fill="${hair}"/>
      ${frontHair}
      <ellipse cx="145" cy="119" rx="5" ry="3.5" fill="#201713"/><ellipse cx="185" cy="119" rx="5" ry="3.5" fill="#201713"/>
      <path d="${eye}" fill="none" stroke="#241814" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M165 122Q160 135 165 137Q170 135 165 122" fill="none" stroke="#633522" stroke-width="1.6"/>
      <path d="${mouth}" fill="none" stroke="#71302f" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M133 198Q165 217 197 198" fill="none" stroke="${skin}" stroke-width="10"/>
      ${state.accessory === "gold" ? `<circle cx="119" cy="137" r="7" fill="none" stroke="#e7bd51" stroke-width="3"/><circle cx="211" cy="137" r="7" fill="none" stroke="#e7bd51" stroke-width="3"/><path d="M154 198L165 214L176 198" fill="none" stroke="#e7bd51" stroke-width="2"/>` : ""}
    </svg>`;
  }

  function open() {
    let root = q("nrsSimsCreator");
    if (!root) { root = document.createElement("div"); root.id = "nrsSimsCreator"; document.body.appendChild(root); }
    root.classList.add("open");
    render();
  }
  function close() { const root = q("nrsSimsCreator"); if (root) root.classList.remove("open"); }

  let tab = "appearance";
  function render() {
    const root = q("nrsSimsCreator"); if (!root) return;
    const name = q("nrsCharacterName")?.value || "";
    root.innerHTML = `<header class="sc-head"><button class="sc-back" id="scBack">‹</button><div class="sc-title"><b>CREATE YOUR CHARACTER</b><small>PERSONALIZE YOUR NIGERIA RP CITIZEN</small></div><button class="sc-save-top" id="scTopSave">CREATE CHARACTER</button></header>
      <main class="sc-body"><section class="sc-stage"><div class="sc-avatar">${avatarSvg()}</div><div class="sc-nameplate"><b>${esc(name || "New Citizen")}</b><small>${esc(state.trait)} • Port Harcourt</small></div></section>
      <section class="sc-panel"><nav class="sc-tabs">${["appearance","hair","outfit","personality"].map(x=>`<button class="sc-tab ${tab===x?"active":""}" data-tab="${x}">${x.toUpperCase()}</button>`).join("")}</nav><div class="sc-content">${panelHtml()}</div><div class="sc-error" id="scError"></div><footer class="sc-footer"><button class="sc-cancel" id="scCancel">CANCEL</button><button class="sc-create" id="scCreate">CREATE CHARACTER</button></footer></section></main>`;
    root.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{tab=b.dataset.tab;render()});
    q("scBack").onclick=close;q("scCancel").onclick=close;q("scCreate").onclick=create;q("scTopSave").onclick=create;
    const input=q("scNameInput"); if(input){input.value=name;input.oninput=()=>{const n=q("nrsCharacterName");if(n){n.value=input.value} renderNameOnly(input.value)}}
    root.querySelectorAll("[data-choice]").forEach(b=>b.onclick=()=>{const [k,v]=b.dataset.choice.split(":");state[k]=v;render()});
    root.querySelectorAll("[data-swatch]").forEach(b=>b.onclick=()=>{const [k,v]=b.dataset.swatch.split(":");state[k]=v;render()});
  }
  function renderNameOnly(value){const p=document.querySelector(".sc-nameplate b");if(p)p.textContent=value||"New Citizen"}
  function panelHtml(){
    if(tab==="appearance") return `<div class="sc-section"><h3>Character name</h3><input class="sc-name" id="scNameInput" maxlength="31" pattern="[A-Za-z]+_[A-Za-z]+" placeholder="Firstname_lastname"></div><div class="sc-section"><h3>Skin tone</h3><div class="sc-swatches">${palettes.skin.map(v=>`<button class="sc-swatch ${state.skin===v?"active":""}" data-swatch="skin:${v}" style="background:${v}"></button>`).join("")}</div></div><div class="sc-section"><h3>Expression</h3><div class="sc-choice-grid">${["happy","sad","angry","playful"].map(v=>`<button class="sc-choice ${state.expression===v?"active":""}" data-choice="expression:${v}">${v[0].toUpperCase()+v.slice(1)}</button>`).join("")}</div></div>`;
    if(tab==="hair") return `<div class="sc-section"><h3>Hair style</h3><div class="sc-choice-grid">${[["long-braids","Long Braids"],["short","Short Natural"],["afro","Full Afro"]].map(([v,l])=>`<button class="sc-choice ${state.hairStyle===v?"active":""}" data-choice="hairStyle:${v}">${l}</button>`).join("")}</div></div><div class="sc-section"><h3>Hair colour</h3><div class="sc-swatches">${palettes.hair.map(v=>`<button class="sc-swatch ${state.hair===v?"active":""}" data-swatch="hair:${v}" style="background:${v}"></button>`).join("")}</div></div>`;
    if(tab==="outfit") return `<div class="sc-section"><h3>Top</h3><div class="sc-choice-grid">${palettes.top.map(v=>`<button class="sc-choice ${state.top===v?"active":""}" data-choice="top:${v}">${v[0].toUpperCase()+v.slice(1)}</button>`).join("")}</div></div><div class="sc-section"><h3>Trousers</h3><div class="sc-choice-grid">${palettes.bottom.map(v=>`<button class="sc-choice ${state.bottom===v?"active":""}" data-choice="bottom:${v}">${v[0].toUpperCase()+v.slice(1)}</button>`).join("")}</div></div><div class="sc-section"><h3>Shoes</h3><div class="sc-choice-grid">${palettes.shoes.map(v=>`<button class="sc-choice ${state.shoes===v?"active":""}" data-choice="shoes:${v}">${v[0].toUpperCase()+v.slice(1)}</button>`).join("")}</div></div><div class="sc-section"><h3>Accessory</h3><div class="sc-choice-grid"><button class="sc-choice ${state.accessory==='gold'?"active":""}" data-choice="accessory:gold">Gold jewellery</button><button class="sc-choice ${state.accessory==='none'?"active":""}" data-choice="accessory:none">None</button></div></div>`;
    return `<div class="sc-section"><h3>Personality trait</h3><div class="sc-traits">${["Creative","Outgoing","Fitness Lover","Bookworm","Entrepreneur","Street Smart"].map(v=>`<button class="sc-trait ${state.trait===v?"active":""}" data-choice="trait:${v}">${v}</button>`).join("")}</div></div><div class="sc-section"><h3>Character type</h3><div class="sc-choice-grid"><button class="sc-choice ${state.gender==='female'?"active":""}" data-choice="gender:female">Female</button><button class="sc-choice ${state.gender==='male'?"active":""}" data-choice="gender:male">Male</button></div></div>`;
  }

  function create(){
    const root=q("nrsSimsCreator"), input=q("scNameInput"), name=(input?.value||q("nrsCharacterName")?.value||"").trim();
    const valid=/^[A-Za-z]+_[A-Za-z]+$/.test(name);
    if(!valid){const e=q("scError");if(e)e.textContent="Use a unique Firstname_lastname (letters only).";return}
    const hidden=q("nrsCharacterName"); if(hidden){hidden.value=name;hidden.dispatchEvent(new Event("input",{bubbles:true}))}
    close();
    const form=q("nrsCreateCharacterForm");
    if(form){form.requestSubmit();return}
    const btn=q("nrsCreateCharacterButton"); if(btn){btn.click()}
  }

  document.addEventListener("click", function (event) {
    const target = event.target instanceof Element ? event.target.closest("#nrsCreateCharacterButton") : null;
    if (!target) return;
    event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
    open();
  }, true);

  document.addEventListener("DOMContentLoaded", () => {
    if (!q("nrsSimsCreator")) { const d=document.createElement("div");d.id="nrsSimsCreator";document.body.appendChild(d); }
  });
  N.simsCharacterCreator = { open, close, state };
})();
