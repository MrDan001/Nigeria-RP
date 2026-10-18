(function () {
  "use strict";

  const N = window.NRS = window.NRS || {};
  const state = {
    skin: "#7b4528", hair: "#17120f", hairStyle: "long-braids", top: "cream",
    bottom: "denim", shoes: "white", accessory: "gold", gender: "female",
    trait: "Creative", expression: "happy"
  };
  const skinPalette = ["#4b291b", "#63351f", "#7b4528", "#955c39", "#b97952", "#d69a73"];
  const hairPalette = ["#17120f", "#2d1a12", "#4b2b1b", "#6d4127", "#a96b3c", "#6b1821"];
  const topColors = { cream:"#f1ece1", black:"#17191d", green:"#167c53", red:"#a83232", blue:"#2e66a6" };
  const bottomColors = { denim:"#41658b", black:"#1b1d20", khaki:"#8a7954", white:"#e8e5df" };
  const shoeColors = { white:"#eeeeea", black:"#17191b", brown:"#654027" };
  let tab = "appearance", scene = null, renderer = null, camera = null, avatar = null, raf = 0;
  let drag = false, lastX = 0, rotation = 0;

  const q = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));

  const css = document.createElement("style");
  css.id = "nrsSimsCreatorStyles";
  css.textContent = `
  #nrsSimsCreator{position:fixed;inset:0;z-index:100005;display:none;flex-direction:column;overflow:hidden;background:#160720;color:#fff;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;touch-action:none}
  #nrsSimsCreator.open{display:flex}
  #nrsSimsCreator *{box-sizing:border-box}
  .sc-head{height:82px;min-height:82px;display:flex;align-items:center;gap:14px;padding:12px 28px;border-bottom:1px solid rgba(255,255,255,.11);background:#160720;position:relative;z-index:4}
  .sc-back{width:44px;height:44px;flex:0 0 44px;border:1px solid rgba(255,255,255,.24);border-radius:50%;background:#21102c;color:#fff;font-size:27px;line-height:1;cursor:pointer}
  .sc-title{min-width:260px;flex:1}.sc-title b{display:block;font-size:19px;line-height:1.05;letter-spacing:.09em;white-space:nowrap}.sc-title small{display:block;margin-top:7px;color:#bbaac6;font-size:9px;letter-spacing:.16em}
  .sc-save-top{height:48px;padding:0 22px;border:0;border-radius:10px;background:linear-gradient(#f6da73,#e7c25b);color:#2a1734;font-weight:950;font-size:11px;letter-spacing:.03em;cursor:pointer;box-shadow:0 7px 18px rgba(0,0,0,.18)}
  .sc-body{width:100%;flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1fr) 430px;gap:24px;padding:20px 28px 24px;overflow:hidden}
  .sc-stage{position:relative;min-width:0;min-height:0;border:1px solid rgba(255,255,255,.13);border-radius:20px;overflow:hidden;background:radial-gradient(circle at 50% 36%,#744596 0%,#48205f 36%,#271038 68%,#1a0924 100%);box-shadow:inset 0 1px rgba(255,255,255,.06)}
  .sc-stage:after{content:"";position:absolute;left:12%;right:12%;bottom:5%;height:24%;background:radial-gradient(ellipse,rgba(4,0,9,.55),transparent 68%);pointer-events:none}
  .sc-stage-label{position:absolute;top:16px;left:18px;z-index:3;color:#dbcde3;font-size:9px;letter-spacing:.15em;text-transform:uppercase;background:rgba(10,3,18,.3);padding:8px 10px;border-radius:8px}
  #scCanvas{position:absolute;inset:0;width:100%;height:100%;display:block;z-index:2;cursor:grab}
  #scCanvas.dragging{cursor:grabbing}
  .sc-nameplate{position:absolute;left:18px;bottom:18px;z-index:3;padding:12px 15px;border-radius:12px;background:rgba(12,4,22,.78);border:1px solid rgba(255,255,255,.14);backdrop-filter:blur(10px);min-width:190px}.sc-nameplate b{display:block;font-size:15px}.sc-nameplate small{display:block;margin-top:3px;color:#cdbbdc;font-size:9px}
  .sc-panel{min-width:0;min-height:0;display:flex;flex-direction:column;border:1px solid rgba(255,255,255,.13);border-radius:18px;background:#12071b;overflow:hidden}
  .sc-tabs{display:grid;grid-template-columns:repeat(4,1fr);height:54px;flex:0 0 54px;border-bottom:1px solid rgba(255,255,255,.1)}
  .sc-tab{border:0;border-right:1px solid rgba(255,255,255,.07);background:#12071b;color:#9d8ba8;font-weight:850;font-size:9px;letter-spacing:.04em;cursor:pointer}.sc-tab.active{color:#fff;background:#21102e;box-shadow:inset 0 -3px #efd36a}
  .sc-content{flex:1;min-height:0;overflow:auto;padding:20px 18px 12px;overscroll-behavior:contain}.sc-section{margin-bottom:22px}.sc-section h3{margin:0 0 10px;color:#d9cadf;font-size:10px;letter-spacing:.15em;text-transform:uppercase}
  .sc-name{width:100%;height:48px;border:1px solid rgba(255,255,255,.15);border-radius:10px;background:#0a0510;color:#fff;padding:0 13px;font-size:13px;outline:0}.sc-name:focus{border-color:#efd36a}
  .sc-swatches{display:flex;gap:10px;flex-wrap:wrap}.sc-swatch{width:38px;height:38px;border-radius:50%;border:2px solid rgba(255,255,255,.18);cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.25)}.sc-swatch.active{border-color:#efd36a;box-shadow:0 0 0 3px rgba(239,211,106,.22)}
  .sc-choice-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.sc-choice,.sc-trait{min-height:46px;border:1px solid rgba(255,255,255,.11);border-radius:10px;background:#1b0d26;color:#dcd0e3;font-size:10px;font-weight:800;cursor:pointer}.sc-choice.active,.sc-trait.active{border-color:#efd36a;background:#2b1737;color:#fff;box-shadow:inset 0 0 0 1px rgba(239,211,106,.12)}
  .sc-traits{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.sc-trait{padding:12px 8px}
  .sc-footer{height:72px;min-height:72px;padding:12px 16px;border-top:1px solid rgba(255,255,255,.1);display:flex;gap:9px;background:#100619}.sc-footer button{flex:1;border-radius:10px;font-size:10px;font-weight:900;cursor:pointer}.sc-cancel{border:1px solid rgba(255,255,255,.15);background:#1c0d27;color:#d8c9e1}.sc-create{border:1px solid #efd36a;background:linear-gradient(#f3d96e,#d3aa45);color:#251431}.sc-error{min-height:17px;padding:0 16px;color:#ff9cac;font-size:9px}
  .sc-hint{position:absolute;right:18px;bottom:20px;z-index:3;padding:8px 10px;border-radius:8px;background:rgba(10,3,18,.5);color:#d5c7dd;font-size:9px}
  @media(max-width:900px){.sc-head{padding:10px 14px}.sc-body{grid-template-columns:minmax(0,1fr) 390px;padding:12px 14px 14px;gap:12px}.sc-title{min-width:0}.sc-title b{font-size:15px}.sc-title small{font-size:8px}.sc-save-top{padding:0 14px}}
  @media(max-width:720px){#nrsSimsCreator{overflow:auto}.sc-head{height:68px;min-height:68px}.sc-title b{white-space:normal;font-size:13px}.sc-title small{display:none}.sc-save-top{font-size:9px;padding:0 11px}.sc-body{display:flex;flex-direction:column;overflow:auto;padding:10px}.sc-stage{height:52vh;min-height:340px;flex:0 0 52vh}.sc-panel{height:auto;min-height:500px;flex:0 0 auto}.sc-hint{display:none}}
  `;
  document.head.appendChild(css);

  function open() {
    let root = q("nrsSimsCreator");
    if (!root) { root = document.createElement("div"); root.id = "nrsSimsCreator"; document.body.appendChild(root); }
    root.classList.add("open");
    render();
    setTimeout(init3D, 0);
  }
  function close(){ const root=q("nrsSimsCreator"); if(root) root.classList.remove("open"); stop3D(); }

  function render(){
    const root=q("nrsSimsCreator"); if(!root) return;
    const oldName=q("scNameInput")?.value || q("nrsCharacterName")?.value || "";
    root.innerHTML=`<header class="sc-head"><button class="sc-back" id="scBack" aria-label="Back">‹</button><div class="sc-title"><b>CREATE YOUR CHARACTER</b><small>PERSONALIZE YOUR NIGERIA RP CITIZEN</small></div><button class="sc-save-top" id="scTopSave">CREATE CHARACTER</button></header><main class="sc-body"><section class="sc-stage"><div class="sc-stage-label">3D CHARACTER PREVIEW</div><canvas id="scCanvas"></canvas><div class="sc-hint">Drag to rotate • Live preview</div><div class="sc-nameplate"><b>${esc(oldName||"New Citizen")}</b><small>${esc(state.trait)} • Port Harcourt</small></div></section><section class="sc-panel"><nav class="sc-tabs">${["appearance","hair","outfit","personality"].map(x=>`<button class="sc-tab ${tab===x?"active":""}" data-tab="${x}">${x.toUpperCase()}</button>`).join("")}</nav><div class="sc-content">${panelHtml(oldName)}</div><div class="sc-error" id="scError"></div><footer class="sc-footer"><button class="sc-cancel" id="scCancel">CANCEL</button><button class="sc-create" id="scCreate">CREATE CHARACTER</button></footer></section></main>`;
    q("scBack").onclick=close;q("scCancel").onclick=close;q("scCreate").onclick=create;q("scTopSave").onclick=create;
    root.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{tab=b.dataset.tab;render();init3D()});
    const input=q("scNameInput"); if(input) input.oninput=()=>{const n=q("nrsCharacterName");if(n)n.value=input.value;const plate=document.querySelector(".sc-nameplate b");if(plate)plate.textContent=input.value||"New Citizen"};
    root.querySelectorAll("[data-choice]").forEach(b=>b.onclick=()=>{const [k,v]=b.dataset.choice.split("::");state[k]=v;render();init3D()});
    root.querySelectorAll("[data-swatch]").forEach(b=>b.onclick=()=>{const [k,v]=b.dataset.swatch.split("::");state[k]=v;render();init3D()});
  }

  function panelHtml(name){
    if(tab==="appearance") return `<div class="sc-section"><h3>Character name</h3><input id="scNameInput" class="sc-name" maxlength="31" value="${esc(name)}" placeholder="Firstname_lastname" autocomplete="off"></div><div class="sc-section"><h3>Skin tone</h3><div class="sc-swatches">${skinPalette.map(v=>`<button class="sc-swatch ${state.skin===v?"active":""}" data-swatch="skin::${v}" style="background:${v}" aria-label="Skin tone"></button>`).join("")}</div></div><div class="sc-section"><h3>Expression</h3><div class="sc-choice-grid">${["happy","sad","neutral","confident"].map(v=>`<button class="sc-choice ${state.expression===v?"active":""}" data-choice="expression::${v}">${v[0].toUpperCase()+v.slice(1)}</button>`).join("")}</div></div>`;
    if(tab==="hair") return `<div class="sc-section"><h3>Hair style</h3><div class="sc-choice-grid">${[["long-braids","Long Braids"],["short","Short Natural"],["afro","Full Afro"],["locs","Locs"]].map(([v,l])=>`<button class="sc-choice ${state.hairStyle===v?"active":""}" data-choice="hairStyle::${v}">${l}</button>`).join("")}</div></div><div class="sc-section"><h3>Hair colour</h3><div class="sc-swatches">${hairPalette.map(v=>`<button class="sc-swatch ${state.hair===v?"active":""}" data-swatch="hair::${v}" style="background:${v}"></button>`).join("")}</div></div>`;
    if(tab==="outfit") return `<div class="sc-section"><h3>Top</h3><div class="sc-choice-grid">${Object.keys(topColors).map(v=>`<button class="sc-choice ${state.top===v?"active":""}" data-choice="top::${v}">${v[0].toUpperCase()+v.slice(1)}</button>`).join("")}</div></div><div class="sc-section"><h3>Trousers</h3><div class="sc-choice-grid">${Object.keys(bottomColors).map(v=>`<button class="sc-choice ${state.bottom===v?"active":""}" data-choice="bottom::${v}">${v[0].toUpperCase()+v.slice(1)}</button>`).join("")}</div></div><div class="sc-section"><h3>Shoes</h3><div class="sc-choice-grid">${Object.keys(shoeColors).map(v=>`<button class="sc-choice ${state.shoes===v?"active":""}" data-choice="shoes::${v}">${v[0].toUpperCase()+v.slice(1)}</button>`).join("")}</div></div><div class="sc-section"><h3>Accessory</h3><div class="sc-choice-grid"><button class="sc-choice ${state.accessory==='gold'?"active":""}" data-choice="accessory::gold">Gold jewellery</button><button class="sc-choice ${state.accessory==='none'?"active":""}" data-choice="accessory::none">None</button></div></div>`;
    return `<div class="sc-section"><h3>Personality trait</h3><div class="sc-traits">${["Creative","Outgoing","Fitness Lover","Bookworm","Entrepreneur","Street Smart"].map(v=>`<button class="sc-trait ${state.trait===v?"active":""}" data-choice="trait::${v}">${v}</button>`).join("")}</div></div><div class="sc-section"><h3>Character type</h3><div class="sc-choice-grid"><button class="sc-choice ${state.gender==='female'?"active":""}" data-choice="gender::female">Female</button><button class="sc-choice ${state.gender==='male'?"active":""}" data-choice="gender::male">Male</button></div></div>`;
  }

  function create(){
    const input=q("scNameInput"), name=(input?.value||q("nrsCharacterName")?.value||"").trim();
    if(!/^[A-Za-z]+_[A-Za-z]+$/.test(name)){const e=q("scError");if(e)e.textContent="Use a unique Firstname_lastname (letters only).";return}
    const chosen={...state};
    try{localStorage.setItem("nrs_rp_character_appearance_v1",JSON.stringify(chosen));}catch{}
    if(window.NRS?.applyCharacterAppearance)window.NRS.applyCharacterAppearance(chosen);
    else window.dispatchEvent(new CustomEvent("nrs-character-appearance",{detail:chosen}));
    const hidden=q("nrsCharacterName");if(hidden){hidden.value=name;hidden.dispatchEvent(new Event("input",{bubbles:true}))}
    close();const form=q("nrsCreateCharacterForm");if(form){form.requestSubmit();return}const btn=q("nrsCreateCharacterButton");if(btn)btn.click();
  }

  function material(color, rough=.55, metal=0){ return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal}); }
  function sphere(g,m,s){const o=new THREE.Mesh(new THREE.SphereGeometry(1,40,28),m);o.scale.set(s[0],s[1],s[2]);g.add(o);return o}
  function cyl(g,m,r,d,pos,rot=[0,0,0]){const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,d,32),m);o.position.set(...pos);o.rotation.set(...rot);g.add(o);return o}
  function capsule(g,m,r,len,pos,rot=[0,0,0]){const o=new THREE.Mesh(new THREE.CapsuleGeometry(r,len,10,24),m);o.position.set(...pos);o.rotation.set(...rot);g.add(o);return o}

  function buildAvatar(){
    if(!window.THREE)return null;
    const g=new THREE.Group();
    const skin=material(state.skin,.62), hair=material(state.hair,.7), top=material(topColors[state.top],.82), bottom=material(bottomColors[state.bottom],.86), shoes=material(shoeColors[state.shoes],.7);
    const head=sphere(g,skin,[.92,1.12,.84]);head.position.y=3.48;
    const neck=cyl(g,skin,.29,.48,[0,2.63,0]);
    const torso=capsule(g,top,.78,1.05,[0,1.65,0]);torso.scale.z=.52;
    const hips=capsule(g,bottom,.48,.55,[0,.72,0]);hips.scale.x=1.25;hips.scale.z=.62;
    const armL=capsule(g,skin,.23,.95,[-.98,1.55,0],[0,0,.04]), armR=capsule(g,skin,.23,.95,[.98,1.55,0],[0,0,-.04]);
    armL.scale.y=1.05;armR.scale.y=1.05;
    const sleeveL=capsule(g,top,.27,.42,[-.82,1.95,0],[0,0,.04]), sleeveR=capsule(g,top,.27,.42,[.82,1.95,0],[0,0,-.04]);
    const legL=capsule(g,bottom,.29,1.32,[-.34,-.32,0]), legR=capsule(g,bottom,.29,1.32,[.34,-.32,0]);
    capsule(g,shoes,.31,.55,[-.34,-1.12,.12]);capsule(g,shoes,.31,.55,[.34,-1.12,.12]);
    // Hair cap + natural front hair mass
    sphere(g,hair,[.95,.72,.88]).position.y=4.02;
    const fringe=capsule(g,hair,.18,.9,[0,3.93,.66],[Math.PI/2,0,0]);fringe.scale.x=1.7;fringe.scale.z=.55;
    if(state.hairStyle==="long-braids"||state.hairStyle==="locs"){
      const count=12;
      for(let i=0;i<count;i++){const a=(i/(count-1)-.5)*Math.PI*1.15;const x=Math.sin(a)*.86;const z=-.15+Math.cos(a)*.42;const b=capsule(g,hair,.075,1.9,[x,3.05,z]);b.rotation.z=a*.18;b.rotation.x=.05;}
    } else if(state.hairStyle==="afro"){
      for(let i=0;i<28;i++){const a=Math.random()*Math.PI*2, r=.65+Math.random()*.3;const h=sphere(g,hair,[.19,.19,.19]);h.position.set(Math.cos(a)*r,4.0+Math.sin(a)*.58,Math.sin(a)*.42);}
    }
    // facial features, subtle and 3D
    const eyeMat=material("#181217",.35), lipMat=material("#71333b",.5);
    sphere(g,eyeMat,[.075,.055,.035]).position.set(-.32,3.53,.79);sphere(g,eyeMat,[.075,.055,.035]).position.set(.32,3.53,.79);
    const nose=cyl(g,skin,.075,.28,[0,3.28,.82],[Math.PI/2,0,0]);nose.material=material(state.skin,.65);
    if(state.expression!=="neutral"){const mouth=capsule(g,lipMat,.035,.25,[0,3.07,.81],[0,Math.PI/2,0]);mouth.scale.x=state.expression==="sad"?.75:1.2}
    if(state.accessory==="gold"){
      const gold=material("#e5bd54",.25,.72);const earL=sphere(g,gold,[.09,.09,.045]);earL.position.set(-.92,3.35,.03);const earR=sphere(g,gold,[.09,.09,.045]);earR.position.set(.92,3.35,.03);const chain=new THREE.Mesh(new THREE.TorusGeometry(.28,.018,10,48,Math.PI),gold);chain.position.set(0,2.78,.48);chain.rotation.x=Math.PI/2;g.add(chain);
    }
    g.rotation.y=rotation;
    return g;
  }

  function init3D(){
    if(!q("scCanvas")||!window.THREE)return;
    stop3D();
    stop3D();
    const canvas=q("scCanvas"), box=canvas.parentElement;
    renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputEncoding=THREE.sRGBEncoding;renderer.setClearColor(0x000000,0);
    scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(25,1,.1,100);camera.position.set(0,1.55,10.8);camera.lookAt(0,1.3,0);
    scene.add(new THREE.HemisphereLight(0xf8e8ff,0x25112e,2.2));const key=new THREE.DirectionalLight(0xfff2df,3);key.position.set(-4,7,7);scene.add(key);const fill=new THREE.DirectionalLight(0xb58cff,1.5);fill.position.set(5,3,2);scene.add(fill);
    avatar=buildAvatar();if(avatar)scene.add(avatar);
    const resize=()=>{const w=box.clientWidth,h=box.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()};resize();window.addEventListener("resize",resize);renderer.__nrsResize=resize;
    canvas.onpointerdown=e=>{drag=true;lastX=e.clientX;canvas.classList.add("dragging");canvas.setPointerCapture?.(e.pointerId)};
    canvas.onpointermove=e=>{if(!drag||!avatar)return;rotation+=(e.clientX-lastX)*.012;lastX=e.clientX;avatar.rotation.y=rotation};
    canvas.onpointerup=canvas.onpointercancel=()=>{drag=false;canvas.classList.remove("dragging")};
    const loop=()=>{if(!renderer||!scene)return;raf=requestAnimationFrame(loop);if(avatar&&!drag)avatar.rotation.y=rotation+Math.sin(performance.now()*.00035)*.035;renderer.render(scene,camera)};loop();
  }
  function stop3D(){if(raf)cancelAnimationFrame(raf);raf=0;if(renderer){renderer.dispose();if(renderer.__nrsResize)window.removeEventListener("resize",renderer.__nrsResize)}renderer=null;scene=null;camera=null;avatar=null}

  document.addEventListener("click",function(e){const t=e.target instanceof Element?e.target.closest("#nrsCreateCharacterButton"):null;if(!t)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();open()},true);
  document.addEventListener("DOMContentLoaded",()=>{if(!q("nrsSimsCreator")){const d=document.createElement("div");d.id="nrsSimsCreator";document.body.appendChild(d)}});
  N.simsCharacterCreator={open,close,state};
})();
