(function () {
  "use strict";

  const N = window.NRS = window.NRS || {};
  let landmarkRoot = null;
  let chosenSite = null;
  let activeSite = null;
  let activeCityId = "";
  let exploreButton = null;
  let guideModal = null;
  let guideTitle = null;
  let guideSubtitle = null;
  let guideIntro = null;
  let guideActivities = null;
  let guideLandmarks = null;
  const sceneColliders = [];

  function cityName(id) {
    const cities = (N.stage15TravelState && N.stage15TravelState.cities) || [];
    const city = cities.find((item) => item.id === id);
    return city?.name || String(id || "Port Harcourt");
  }

  function clearColliders() {
    if (typeof boxes !== "undefined" && Array.isArray(boxes)) {
      for (const item of sceneColliders) {
        const at = boxes.indexOf(item);
        if (at >= 0) boxes.splice(at, 1);
      }
    }
    sceneColliders.length = 0;
  }

  function collidesWithPlot(x, z, radius, item) {
    if (!item || !Number.isFinite(Number(item.x)) || !Number.isFinite(Number(item.z))) return false;
    const hw = Number.isFinite(Number(item.hw)) ? Math.max(0.3, Number(item.hw)) : 0.8;
    const hd = Number.isFinite(Number(item.hd)) ? Math.max(0.3, Number(item.hd)) : 0.8;
    return Math.abs(x - Number(item.x)) < radius + hw && Math.abs(z - Number(item.z)) < radius + hd;
  }

  function siteIsClear(x, z, radius) {
    if (typeof roadNear === "function" && roadNear(x, z, radius)) return false;
    if (typeof bld !== "undefined" && Array.isArray(bld)) {
      for (const item of bld) if (collidesWithPlot(x, z, radius, item)) return false;
    }
    if (typeof boxes !== "undefined" && Array.isArray(boxes)) {
      for (const item of boxes) if (collidesWithPlot(x, z, radius, item)) return false;
    }
    return true;
  }

  function findSite() {
    if (chosenSite) return chosenSite;
    const preferred = [
      [-45, 0], [45, 0], [-45, 42], [45, 42], [-45, -70], [45, -70],
      [-135, 0], [135, 0], [-135, 140], [135, 140], [-135, -145], [135, -145],
      [-180, 35], [180, 35], [-190, 140], [190, -125]
    ];
    for (const point of preferred) {
      if (siteIsClear(point[0], point[1], 17)) {
        chosenSite = { x: point[0], z: point[1] };
        return chosenSite;
      }
    }
    const candidates = [];
    for (let x = -210; x <= 210; x += 22) {
      for (let z = -210; z <= 210; z += 22) candidates.push({ x, z, score: Math.hypot(x + 45, z) });
    }
    candidates.sort((a, b) => a.score - b.score);
    for (const point of candidates) {
      if (siteIsClear(point.x, point.z, 17)) {
        chosenSite = { x: point.x, z: point.z };
        return chosenSite;
      }
    }
    chosenSite = { x: -45, z: 0 };
    return chosenSite;
  }

  function addCollider(site, x, z, hw, hd) {
    if (typeof boxes === "undefined" || !Array.isArray(boxes)) return;
    const item = { x: site.x + x, z: site.z + z, hw, hd, stage16City: true };
    boxes.push(item);
    sceneColliders.push(item);
  }

  function ensureGuideUI() {
    if (exploreButton && guideModal) return;
    const style = document.createElement("style");
    style.id = "nrsStage16ExperienceStyle";
    style.textContent = [
      "#nrsStage16Explore[hidden],#nrsStage16Guide[hidden]{display:none!important}",
      "#nrsStage16Explore{position:fixed;top:calc(env(safe-area-inset-top,0px) + 104px);right:12px;z-index:8002;max-width:calc(100vw - 24px);padding:10px 13px;border:1px solid rgba(255,255,255,.22);border-radius:13px;background:linear-gradient(135deg,#102b3b,#0b1724);color:#fff;font:800 12px system-ui,sans-serif;box-shadow:0 10px 28px rgba(0,0,0,.38);touch-action:manipulation}",
      "#nrsStage16Guide{position:fixed;inset:0;z-index:96000;display:grid;place-items:center;padding:14px;box-sizing:border-box;background:rgba(1,7,14,.82);backdrop-filter:blur(10px);color:#f4f8ff;font:14px/1.45 system-ui,sans-serif}",
      "#nrsStage16Guide .s16-card{width:min(440px,100%);max-height:min(84vh,740px);overflow:auto;box-sizing:border-box;padding:20px;border:1px solid rgba(130,203,255,.26);border-radius:22px;background:linear-gradient(145deg,rgba(13,28,43,.99),rgba(5,15,26,.99));box-shadow:0 24px 70px rgba(0,0,0,.5)}",
      "#nrsStage16Guide .s16-kicker{margin:0 0 6px;color:#78d7ff;font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}",
      "#nrsStage16Guide h2{margin:0 0 5px;font-size:23px;line-height:1.15}",
      "#nrsStage16Guide .s16-sub{margin:0 0 14px;color:#a9c0d2;font-size:12px}",
      "#nrsStage16Guide .s16-intro{margin:0 0 16px;color:#d4e1ec}",
      "#nrsStage16Guide h3{margin:15px 0 7px;font-size:12px;color:#8dddb9;text-transform:uppercase;letter-spacing:.09em}",
      "#nrsStage16Guide ul{display:grid;gap:7px;margin:0;padding:0;list-style:none}",
      "#nrsStage16Guide li{padding:9px 11px;border:1px solid rgba(255,255,255,.09);border-radius:10px;background:rgba(255,255,255,.04)}",
      "#nrsStage16Guide .s16-close{display:block;width:100%;min-height:44px;margin-top:18px;border:0;border-radius:11px;background:linear-gradient(135deg,#158acb,#145a94);color:#fff;font:800 14px system-ui,sans-serif}",
      "@media(max-width:420px){#nrsStage16Guide .s16-card{padding:16px}#nrsStage16Guide h2{font-size:21px}}"
    ].join("\n");
    document.head.appendChild(style);

    exploreButton = document.createElement("button");
    exploreButton.id = "nrsStage16Explore";
    exploreButton.type = "button";
    exploreButton.hidden = true;
    exploreButton.textContent = "📍 Explore local district";
    document.body.appendChild(exploreButton);

    guideModal = document.createElement("div");
    guideModal.id = "nrsStage16Guide";
    guideModal.hidden = true;
    guideModal.setAttribute("role", "dialog");
    guideModal.setAttribute("aria-modal", "true");
    guideModal.setAttribute("aria-label", "Local city district guide");
    const card = document.createElement("section");
    card.className = "s16-card";
    const kicker = document.createElement("p");
    kicker.className = "s16-kicker";
    kicker.textContent = "Local district guide";
    guideTitle = document.createElement("h2");
    guideSubtitle = document.createElement("p");
    guideSubtitle.className = "s16-sub";
    guideIntro = document.createElement("p");
    guideIntro.className = "s16-intro";
    const activityHeading = document.createElement("h3");
    activityHeading.textContent = "Explore nearby";
    guideActivities = document.createElement("ul");
    const landmarkHeading = document.createElement("h3");
    landmarkHeading.textContent = "Regional landmarks";
    guideLandmarks = document.createElement("ul");
    const close = document.createElement("button");
    close.type = "button";
    close.className = "s16-close";
    close.textContent = "Back to the city";
    close.addEventListener("click", () => { guideModal.hidden = true; });
    card.append(kicker, guideTitle, guideSubtitle, guideIntro, activityHeading, guideActivities, landmarkHeading, guideLandmarks, close);
    guideModal.appendChild(card);
    document.body.appendChild(guideModal);
    exploreButton.addEventListener("click", () => {
      const env = N.cityEnvironment;
      if (!env) return;
      updateGuideContent(env);
      guideModal.hidden = false;
      close.focus();
    });
    guideModal.addEventListener("click", (event) => {
      if (event.target === guideModal) guideModal.hidden = true;
    });
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && guideModal && !guideModal.hidden) guideModal.hidden = true;
    });
  }

  function updateGuideContent(environment) {
    if (!environment) return;
    ensureGuideUI();
    guideTitle.textContent = String(environment.guideTitle || "Explore the city");
    guideSubtitle.textContent = cityName(environment.cityId) + " · " + String(environment.districtName || "Civic district");
    guideIntro.textContent = String(environment.atmosphere || "Explore the local district and its landmarks.");
    guideActivities.replaceChildren();
    for (const activity of Array.isArray(environment.localActivities) ? environment.localActivities : []) {
      const item = document.createElement("li");
      item.textContent = String(activity);
      guideActivities.appendChild(item);
    }
    guideLandmarks.replaceChildren();
    for (const landmark of Array.isArray(environment.landmarks) ? environment.landmarks : []) {
      const item = document.createElement("li");
      item.textContent = String(landmark);
      guideLandmarks.appendChild(item);
    }
  }

  function renderCityScene(environment) {
    if (!environment || typeof THREE === "undefined" || typeof scene === "undefined") return;
    if (landmarkRoot && activeCityId === environment.cityId) {
      updateGuideContent(environment);
      return;
    }
    if (landmarkRoot) {
      scene.remove(landmarkRoot);
      landmarkRoot.traverse((node) => {
        if (!node.isMesh) return;
        node.geometry?.dispose?.();
        if (Array.isArray(node.material)) node.material.forEach((material) => material?.dispose?.());
        else node.material?.dispose?.();
      });
    }
    clearColliders();
    const site = findSite();
    activeSite = { x:site.x, z:site.z, guideX:site.x, guideZ:site.z + 18.5 };
    activeCityId = environment.cityId;

    const root = new THREE.Group();
    const profile = String(environment.profile || "coastal-industrial");
    const accent = Number(environment.accentHex) || 0x31b8e8;
    const accentMat = new THREE.MeshLambertMaterial({ color:accent });
    const concrete = new THREE.MeshLambertMaterial({ color:0xb6afa0 });
    const dark = new THREE.MeshLambertMaterial({ color:0x374450 });
    const water = new THREE.MeshLambertMaterial({ color:0x286f89, transparent:true, opacity:0.78 });
    const greenery = new THREE.MeshLambertMaterial({ color:0x398258 });
    const roof = new THREE.MeshLambertMaterial({ color:profile === "commercial-hub" ? 0xce873c : 0x95583d });
    const make = (geometry, material, x, y, z, sx = 1, sy = 1, sz = 1) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz); root.add(mesh); return mesh;
    };
    const box = (material,x,y,z,sx,sy,sz) => make(new THREE.BoxGeometry(1,1,1),material,x,y,z,sx,sy,sz);
    const cyl = (material,x,y,z,rt,rb,h,segments=10) => make(new THREE.CylinderGeometry(rt,rb,h,segments),material,x,y,z);
    const sphere = (material,x,y,z,sx,sy,sz) => make(new THREE.SphereGeometry(1,12,8),material,x,y,z,sx,sy,sz);
    const cone = (material,x,y,z,r,h,segments=8) => make(new THREE.ConeGeometry(r,h,segments),material,x,y,z);
    const plane = (w,d,material,x,y,z) => { const mesh=make(new THREE.PlaneGeometry(w,d),material,x,y,z); mesh.rotation.x=-Math.PI/2; return mesh; };
    const addCollider = (x,z,hw,hd) => {
      if (typeof boxes === "undefined" || !Array.isArray(boxes)) return;
      const c={x:site.x+x,z:site.z+z,hw,hd,stage16City:true}; boxes.push(c); sceneColliders.push(c);
    };

    const palette = ({
      "coastal-industrial":{wall:0xc4ced1,roof:0x455963,accent:0x31b8e8},
      "commercial-hub":{wall:0xe7d0a1,roof:0xa95c2b,accent:0xf0ad45},
      "cultural-capital":{wall:0xe2d4bd,roof:0x82513e,accent:0x67c987},
      "garden-city":{wall:0xe0e8d9,roof:0x477b68,accent:0x6ed4b1},
      "river-port":{wall:0xc3cfce,roof:0x47636c,accent:0xff9c56},
      "delta-wetlands":{wall:0xc7d9d1,roof:0x3f756d,accent:0x52c6b3},
      "royal-heritage":{wall:0xe1c49c,roof:0x8c4033,accent:0xd9a0ff}
    })[profile] || {wall:0xc4ced1,roof:0x455963,accent};
    const plazaMat = new THREE.MeshLambertMaterial({color:profile === "delta-wetlands" ? 0xa2bbb1 : 0xbab7ac});
    const pathMat = new THREE.MeshLambertMaterial({color:0x9b9a91});
    const trimMat = new THREE.MeshLambertMaterial({color:palette.accent});
    const windowMat = new THREE.MeshLambertMaterial({color:0x263c49,emissive:0x101a21});
    const benchMat = new THREE.MeshLambertMaterial({color:profile === "commercial-hub" ? 0x81502b : 0x76543b});
    plane(34,34,plazaMat,0,0.065,0);
    box(trimMat,0,0.12,-16.8,34,0.14,0.34); box(trimMat,0,0.12,16.8,34,0.14,0.34);
    box(trimMat,-16.8,0.12,0,0.34,0.14,34); box(trimMat,16.8,0.12,0,0.34,0.14,34);
    plane(3.6,9,pathMat,0,0.078,11.2);

    const storefront = (x,z,w,d,h) => {
      const wall = new THREE.MeshLambertMaterial({color:palette.wall});
      const cap = new THREE.MeshLambertMaterial({color:palette.roof});
      box(wall,x,h/2,z,w,h,d); box(cap,x,h+0.22,z,w+0.5,0.44,d+0.5);
      box(windowMat,x-w*0.25,1.45,z+d/2+0.07,1.05,0.95,0.12);
      box(windowMat,x+w*0.25,1.45,z+d/2+0.07,1.05,0.95,0.12);
      box(trimMat,x,2.7,z+d/2+0.08,w*0.74,0.2,0.12); box(dark,x,0.92,z+d/2+0.09,0.86,1.84,0.14);
      addCollider(x,z,w/2+0.5,d/2+0.5);
    };
    storefront(-13.2,-11.4,6.2,5.1,3.6);
    storefront(13.2,-11.4,6.2,5.1,4.3);

    for (const x of [-14.2,14.2]) {
      cyl(new THREE.MeshLambertMaterial({color:palette.roof}),x,1.25,12.5,0.22,0.3,2.5,7);
      sphere(new THREE.MeshLambertMaterial({color:0x398258}),x,3,12.5,1.25,1.55,1.25);
      cone(new THREE.MeshLambertMaterial({color:0x398258}),x,4.05,12.5,0.9,1.5,7);
      addCollider(x,12.5,0.48,0.48); box(plazaMat,x,0.19,12.5,2.2,0.22,2.2);
    }
    for (const x of [-8.5,8.5]) {
      box(benchMat,x,0.55,13.1,2.5,0.22,0.78); box(dark,x,0.28,13.1,2.1,0.45,0.3);
      for (const lx of [x-0.85,x+0.85]) box(dark,lx,0.13,13.1,0.13,0.26,0.4);
    }
    for (const x of [-15.1,15.1]) {
      cyl(dark,x,2.8,2.5,0.08,0.12,5.6,7); box(trimMat,x,5.55,2.5,0.65,0.18,0.36);
    }

    if (profile === "coastal-industrial") {
      box(dark,-5,5.2,0,.65,10.4,.65); box(dark,1.4,5.2,0,.65,10.4,.65);
      box(accentMat,-1.8,10.1,0,7.8,.55,.7); box(dark,-1.8,7.7,.5,.2,4.8,.2);
      box(new THREE.MeshLambertMaterial({color:0xd08c4c}),-5,.7,4,4.4,1.4,2.2);
      box(accentMat,-.3,.7,4,4.2,1.4,2.2); box(roof,-5,2.1,4,4.5,.15,2.3); box(roof,-.3,2.1,4,4.3,.15,2.3);
      box(water,5.2,.05,3,3.2,.12,10);
    } else if (profile === "commercial-hub") {
      box(concrete,-4,2.3,2,3.2,4.6,2.6); box(concrete,4,2.3,2,3.2,4.6,2.6);
      box(roof,0,4.8,2,12,.55,4.6);
      for (const x of [-4.6,-1.6,1.6,4.6]) { box(accentMat,x,1.25,-.7,1.8,2.5,.35); box(dark,x,.3,-.2,2.1,.3,1.1); }
      box(accentMat,0,3.1,4.6,7.5,.45,.35);
    } else if (profile === "cultural-capital") {
      box(concrete,0,2.2,2,11,4.4,5.5); cyl(accentMat,0,4.8,2,2.8,3.2,1,14);
      sphere(roof,0,5.8,2,2.7,1.45,2.7);
      for (const x of [-4,-2,2,4]) cyl(concrete,x,2.05,-.9,.19,.19,3.9,8);
      cone(accentMat,0,7.35,2,.45,.85,8); box(dark,0,.6,-1.1,2.2,1.2,.15);
    } else if (profile === "garden-city") {
      cyl(concrete,0,1.4,2,6.2,7.2,2.8,20); cyl(greenery,0,2.65,2,4.5,4.5,.15,20);
      cyl(accentMat,0,2.85,2,2.8,2.8,.12,20);
      for (const x of [-7.1,7.1]) { box(dark,x,5,0,.3,10,.3); box(accentMat,x,10.1,0,1.15,.45,.7); }
      box(concrete,-2,2.1,7,1,4.2,.8); box(concrete,2,2.1,7,1,4.2,.8); box(accentMat,0,4.35,7,5,.45,.8);
    } else if (profile === "river-port") {
      box(dark,-4,4.6,0,.55,9.2,.55); box(dark,4,4.6,0,.55,9.2,.55); box(accentMat,0,9.2,0,9,.6,.65);
      box(dark,0,5.6,.2,.18,6.3,.18); box(new THREE.MeshLambertMaterial({color:0xd9a64a}),-3,1,3.5,4,2,2.4);
      box(roof,1.2,1,3.5,4,2,2.4); box(water,7,.03,2,3.5,.12,12);
      for (let z=-4;z<=5;z+=3) cyl(dark,7,.65,z,.14,.2,1.3,8);
    } else if (profile === "delta-wetlands") {
      box(water,0,.04,3,12,.12,8);
      for (const x of [-4,-1.4,1.4,4]) cyl(roof,x,1.6,2,.16,.21,3.1,7);
      box(concrete,0,3.2,2,10.2,.35,4.5); box(accentMat,0,4,2,10.8,.3,4.8); box(roof,0,4.9,2,11,.45,5);
      for (const x of [-7,7]) {
        cyl(roof,x,1.5,1,.18,.22,3,7); sphere(greenery,x,3.4,1,1.7,2.2,1.7);
        for (let n=0;n<3;n++) cyl(greenery,x+(n-1)*.55,2.8,1.4,.06,.1,1.6,5);
      }
    } else if (profile === "royal-heritage") {
      box(concrete,0,2.25,2,11.5,4.5,.9); box(dark,0,1.5,1.45,3.2,3,.15);
      for (const x of [-4.6,4.6]) {
        box(accentMat,x,4,2,1.9,8,1.6); cone(roof,x,8.6,2,1.55,1.5,6); box(roof,x,1.3,1.35,2.1,.25,1.9);
      }
      box(accentMat,0,5.1,2,4,.45,1.2);
      for (const x of [-2.5,2.5]) cyl(concrete,x,2.7,1,.22,.28,5.2,10);
    }

    // The kiosk is a physical landmark: the action button appears only when the
    // authenticated player walks up to its front, never while driving or indoors.
    box(concrete,0,0.28,15.1,4.8,0.56,1.5);
    box(accentMat,0,1.58,15.1,4.35,2.05,0.18);
    box(roof,0,2.75,15.1,5.6,0.32,2.05);
    for (const x of [-2.2,2.2]) cyl(dark,x,1.42,14.25,0.1,0.13,2.6,7);
    sphere(accentMat,0,3.16,15.1,0.28,0.28,0.28);
    addCollider(0,15.1,2.55,1.0);

    root.position.set(site.x,0,site.z);
    root.userData.stage16CityId = environment.cityId;
    root.userData.stage16District = environment.districtName || "";
    scene.add(root);
    landmarkRoot = root;
    updateGuideContent(environment);
  }

  function updateProximity() {
    if (!exploreButton) return;
    const session = N.session || {};
    const inCar = typeof driving !== "undefined" && !!driving;
    const indoors = typeof inside !== "undefined" && !!inside;
    const mapOpen = typeof MP !== "undefined" && !!MP && !!MP.open;
    const hasPosition = typeof pos !== "undefined" && pos &&
      Number.isFinite(Number(pos.x)) && Number.isFinite(Number(pos.z));
    let visible = !!(activeSite && session.authed && session.open && hasPosition && !inCar && !indoors && !mapOpen);
    if (visible) visible = Math.hypot(Number(pos.x)-activeSite.guideX, Number(pos.z)-activeSite.guideZ) <= 9;
    exploreButton.hidden = !visible;
  }

  function syncFromCurrentState(event) {
    const detail = event && event.detail;
    const environment = detail?.currentEnvironment || detail?.environment ||
      N.cityEnvironment ||
      (N.stage15TravelState && N.stage15TravelState.currentEnvironment);
    if (environment && environment.cityId) renderCityScene(environment);
    updateProximity();
  }

  ensureGuideUI();
  window.addEventListener("nrs-stage15-travel-state", syncFromCurrentState);
  window.addEventListener("nrs-city-changed", syncFromCurrentState);
  window.addEventListener("nrs-stage15-travel-result", syncFromCurrentState);
  window.setInterval(() => {
    const env = N.cityEnvironment || (N.stage15TravelState && N.stage15TravelState.currentEnvironment);
    if (env && env.cityId !== activeCityId) renderCityScene(env);
    updateProximity();
  }, 450);
  syncFromCurrentState();
})();