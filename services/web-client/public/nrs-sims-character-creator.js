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
  let tab = "appearance", scene = null, renderer = null, camera = null, avatar = null, raf = 0, previewAnimator = null, previewBaseY = 0;
  let drag = false, lastX = 0, rotation = 0, onSaveHandler = null, previewLoadToken = 0;
  let cachedDieselGLTF = null, dieselGLTFLoading = false, dieselGLTFWaiters = [];

  const q = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));

  const css = document.createElement("style");
  css.id = "nrsSimsCreatorStyles";
  css.textContent = `
  #nrsSimsCreator{position:fixed;inset:0;z-index:2147483002;display:none;flex-direction:column;overflow:hidden;background:#160720;color:#fff;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;touch-action:none}
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

  function open(options = {}) {
    onSaveHandler = typeof options.onSave === "function" ? options.onSave : null;
    let root = q("nrsSimsCreator");
    if (!root) { root = document.createElement("div"); root.id = "nrsSimsCreator"; document.body.appendChild(root); }
    root.classList.add("open");
    render();
    setTimeout(init3D, 0);
  }
  function close(){ const root=q("nrsSimsCreator"); if(root) root.classList.remove("open"); stop3D(); onSaveHandler=null; }
  function setError(message){ const e=q("scError"); if(e)e.textContent=String(message||""); }
  function setSaving(saving){ const root=q("nrsSimsCreator"); if(!root)return; ["scTopSave","scCreate"].forEach(id=>{const b=q(id);if(b){b.disabled=!!saving;b.textContent=saving?"CREATING...":"CREATE CHARACTER";}}); }

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
    if(typeof onSaveHandler==="function"){
      setError("");
      try{onSaveHandler(name,chosen);}catch(error){setError(error?.message||"Could not save this character. Please try again.");}
      return;
    }
    try{localStorage.setItem("nrs_rp_character_appearance_v1",JSON.stringify(chosen));}catch{}
    if(window.NRS?.applyCharacterAppearance)window.NRS.applyCharacterAppearance(chosen);
    else window.dispatchEvent(new CustomEvent("nrs-character-appearance",{detail:chosen}));
    const hidden=q("nrsCharacterName");if(hidden){hidden.value=name;hidden.dispatchEvent(new Event("input",{bubbles:true}))}
    close();const form=q("nrsCreateCharacterForm");if(form){form.requestSubmit();return}const btn=q("nrsCreateCharacterButton");if(btn)btn.click();
  }

  function countMeshes(root){let count=0;root.traverse(o=>{if(o.isMesh)count++});return count}
  function requestDieselGLTF(onLoad,onProgress,onError){
    if(cachedDieselGLTF){onLoad(cachedDieselGLTF);return;}
    dieselGLTFWaiters.push({onLoad,onProgress,onError});if(dieselGLTFLoading)return;
    if(!window.THREE?.GLTFLoader){dieselGLTFWaiters.splice(0).forEach(w=>w.onError(new Error("GLTFLoader is not available.")));return;}
    dieselGLTFLoading=true;const loader=new THREE.GLTFLoader();loader.setCrossOrigin?.("anonymous");
    loader.load("/Diesel.glb?rev=diesel-no-block-animated-20261018b",gltf=>{
      dieselGLTFLoading=false;cachedDieselGLTF=gltf;
      if(!gltf.__nrsBaseTransform)gltf.__nrsBaseTransform={position:gltf.scene.position.clone(),quaternion:gltf.scene.quaternion.clone(),scale:gltf.scene.scale.clone()};
      dieselGLTFWaiters.splice(0).forEach(w=>w.onLoad(gltf));
    },event=>{dieselGLTFWaiters.forEach(w=>{try{w.onProgress(event)}catch{}});},error=>{dieselGLTFLoading=false;dieselGLTFWaiters.splice(0).forEach(w=>w.onError(error||new Error("Failed to load Diesel model.")));});
  }
  function init3D(){
    if(!q("scCanvas"))return;
    if(!window.THREE||!window.THREE.GLTFLoader){setError("The 3D character model could not start. Close and reopen the creator.");return;}
    stop3D();const canvas=q("scCanvas"),box=canvas.parentElement;
    renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputEncoding=THREE.sRGBEncoding;renderer.setClearColor(0x000000,0);
    scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(25,1,.1,100);
    scene.add(new THREE.HemisphereLight(0xf8e8ff,0x25112e,2.2));
    const key=new THREE.DirectionalLight(0xfff2df,3);key.position.set(-4,7,7);scene.add(key);
    const fill=new THREE.DirectionalLight(0xb58cff,1.5);fill.position.set(5,3,2);scene.add(fill);
    const token=++previewLoadToken;setError("Loading Diesel character model…");
    const fitCamera=()=>{
      if(!avatar||!camera||!renderer)return;const w=Math.max(1,box.clientWidth),h=Math.max(1,box.clientHeight);
      camera.aspect=w/h;camera.updateProjectionMatrix();const bb=new THREE.Box3().setFromObject(avatar),sz=bb.getSize(new THREE.Vector3()),c=bb.getCenter(new THREE.Vector3());
      const fov=THREE.MathUtils.degToRad(camera.fov),distance=(Math.max(sz.y,sz.x/Math.max(.35,camera.aspect))*.5)/Math.tan(fov*.5)*1.2;
      camera.position.set(c.x,c.y,c.z+Math.max(distance,4.4));camera.lookAt(c.x,c.y,c.z);
    };
    const showModel=gltf=>{
      if(token!==previewLoadToken||!scene)return;const imported=gltf.scene;if(imported.parent)imported.parent.remove(imported);
      const base=gltf.__nrsBaseTransform;imported.position.copy(base.position);imported.quaternion.copy(base.quaternion);imported.scale.copy(base.scale);
      const bounds=new THREE.Box3().setFromObject(imported),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
      if(!Number.isFinite(size.x+size.y+size.z)||size.y<=0||size.x<=0||size.z<=0){setError("Diesel model has invalid dimensions. No block fallback is shown.");return;}
      const scale=3.65/size.y;imported.scale.multiplyScalar(scale);imported.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);imported.rotation.y=rotation;
      imported.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
      avatar=imported;scene.add(avatar);
      const mapped=window.NRS?.applyDieselModelAppearance?.(avatar,state);previewAnimator=window.NRS?.attachDieselAnimator?.(avatar,gltf.animations||[])||null;previewBaseY=avatar.position.y;
      fitCamera();renderer.__nrsFitCamera=fitCamera;setError("");
      console.info("[Nigeria RP] Creator loaded Diesel model.",{meshes:countMeshes(avatar),animations:previewAnimator?.animationNames||[],mappedParts:mapped?.mappedParts||[],styleVariants:mapped?.styleVariants||0,fallbackBones:previewAnimator?.fallbackBoneCount||0});
    };
    requestDieselGLTF(showModel,event=>{if(token===previewLoadToken&&event?.total)setError("Loading Diesel character model… "+Math.round(event.loaded/event.total*100)+"%");},error=>{
      if(token!==previewLoadToken)return;setError("Diesel model could not load. No block character will be substituted. Reopen the creator to retry.");console.error("[Nigeria RP] Creator Diesel model load failed.",error);
    });
    const resize=()=>{const w=box.clientWidth,h=box.clientHeight;if(!w||!h||!renderer||!camera)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.__nrsFitCamera?.()};
    resize();window.addEventListener("resize",resize);
    canvas.onpointerdown=e=>{drag=true;lastX=e.clientX;canvas.classList.add("dragging");canvas.setPointerCapture?.(e.pointerId)};
    canvas.onpointermove=e=>{if(!drag)return;rotation+=(e.clientX-lastX)*.012;lastX=e.clientX;if(avatar)avatar.rotation.y=rotation};
    canvas.onpointerup=canvas.onpointercancel=()=>{drag=false;canvas.classList.remove("dragging")};
    let last=performance.now();const loop=()=>{if(!renderer||!scene)return;raf=requestAnimationFrame(loop);const now=performance.now(),dt=Math.min((now-last)/1000,.05),t=now/1000;last=now;
      if(avatar){previewAnimator?.update(dt,t,0);if(!drag)avatar.rotation.y=rotation+Math.sin(t*.35)*.018;avatar.position.y=previewBaseY+Math.sin(t*2)*.012;}
      renderer.render(scene,camera);
    };loop();
  }
  function stop3D(){
    previewLoadToken++;if(raf)cancelAnimationFrame(raf);raf=0;
    if(previewAnimator?.reset)previewAnimator.reset();previewAnimator=null;
    if(avatar?.parent)avatar.parent.remove(avatar);
    if(renderer){renderer.dispose();if(renderer.__nrsResize)window.removeEventListener("resize",renderer.__nrsResize);}
    renderer=null;scene=null;camera=null;avatar=null;
  }

  document.addEventListener("click",function(e){const t=e.target instanceof Element?e.target.closest("#nrsCreateCharacterButton"):null;if(!t)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();open()},true);
  document.addEventListener("DOMContentLoaded",()=>{if(!q("nrsSimsCreator")){const d=document.createElement("div");d.id="nrsSimsCreator";document.body.appendChild(d)}});
  N.simsCharacterCreator={open,close,state,setError,setSaving};
})();
