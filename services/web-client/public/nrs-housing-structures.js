(() => {
  if (!window.THREE || !window.scene) return;
  const T = window.THREE;
  const mat = (c) => new T.MeshLambertMaterial({ color: c });
  const M = {
    wall: mat(0xe9dfcf), roof: mat(0x5a2d24), roof2: mat(0x30343a), trim: mat(0xc89f68), glass: new T.MeshLambertMaterial({ color: 0x5b91aa, transparent: true, opacity: .72 }),
    door: mat(0x4b3026), floor: mat(0xb89b72), grass: mat(0x4e713d), pool: new T.MeshLambertMaterial({ color: 0x3c9fc7, transparent: true, opacity: .78 }), gold: mat(0xd3ad55), white: mat(0xf4eee4), dark: mat(0x25272b), hedge: mat(0x315638), concrete: mat(0xa9a39a)
  };
  const add = (g, m, x, y, z, sx=1, sy=1, sz=1, parent=window.scene) => { const o=new T.Mesh(g,m); o.position.set(x,y,z); o.scale.set(sx,sy,sz); parent.add(o); return o; };
  const box=(m,x,y,z,w,h,d)=>add(new T.BoxGeometry(w,h,d),m,x,y,z);
  const cyl=(m,x,y,z,r,h)=>add(new T.CylinderGeometry(r,r,h,16),m,x,y,z);
  const roof=(m,x,y,z,w,d,h=1)=>box(m,x,y,z,w,h,d);
  const label=(text,x,z)=>{
    const c=document.createElement('canvas'); c.width=512;c.height=96;const g=c.getContext('2d');g.fillStyle='#111820';g.fillRect(0,0,512,96);g.fillStyle='#f4d27a';g.font='bold 34px Arial';g.textAlign='center';g.fillText(text,256,61);
    const t=new T.CanvasTexture(c); const s=new T.Sprite(new T.SpriteMaterial({map:t,transparent:true}));s.position.set(x,4.2,z);s.scale.set(8,.95,1);window.scene.add(s);return s;
  };
  const windowPane=(x,y,z,w=.9,h=1.1)=>{ box(M.glass,x,y,z,w,.06,h); box(M.trim,x,y+h/2,z,w+.12,.08,.08); box(M.trim,x,y-h/2,z,w+.12,.08,.08); };
  const door=(x,y,z,w=.85,h=1.9)=>{ box(M.door,x,y,z,w,.08,h); box(M.trim,x,y+h/2,z,w+.12,.1,.08); };
  const yard=(x,z,w,d)=>{box(M.grass,x,-.02,z,w,.08,d); box(M.hedge,x,.55,z-d/2,w,.95,.28);box(M.hedge,x,.55,z+d/2,w,.95,.28);};
  function hut(x,z,id){yard(x,z,11,9);box(M.wall,x,1.35,z,7.5,2.7,6.2);roof(M.roof,x,3.1,z,8.4,7,.7);roof(M.roof,x,3.65,z,6.4,5,.55);door(x,1,z+3.13);windowPane(x-2.3,1.5,z+3.15);label('VILLAGE HUT • ₦1,000/DAY',x,z-5);}
  function faceme(x,z,id){yard(x,z,16,9);box(M.wall,x,1.45,z,13.5,2.9,5.5);roof(M.roof2,x,3.25,z,14.2,6,.55);for(let i=-1;i<=1;i++){door(x+i*4,1,z+2.8,.75,1.8);windowPane(x+i*4-1.3,1.5,z+2.85,.75,1);windowPane(x+i*4+1.3,1.5,z+2.85,.75,1);}box(M.trim,x,2.85,z-2.82,13.8,.18,.18);label('COMPOUND ROOMS • ₦2,500/DAY',x,z-5);}
  function flat(x,z,id){yard(x,z,15,12);box(M.wall,x,2.4,z,10.5,4.8,7.2);roof(M.roof2,x,5.1,z,11.2,7.8,.6);door(x,1,z+3.62);for(let i=-1;i<=1;i++)windowPane(x+i*2.6,2.6,z+3.65,1.2,1.4);box(M.concrete,x,1.0,z+4.7,11.5,.12,2.2);label('URBAN FLAT • ₦4,000/DAY',x,z-6.5);}
  function duplex(x,z,id){yard(x,z,19,15);box(M.wall,x,1.65,z,12.5,3.3,9);box(M.wall,x,4.55,z,11.8,2.5,8.4);roof(M.roof2,x,6.05,z,13,9,.65);door(x,1.1,z+4.55);for(let i=-1;i<=1;i++)windowPane(x+i*2.8,2.5,z+4.6,1.3,1.5);for(let i=-1;i<=1;i++)windowPane(x+i*2.7,4.7,z+4.25,1.2,1.1);box(M.concrete,x,3.2,z+5.15,12.8,.2,2);label('ESTATE DUPLEX • ₦7,500/DAY',x,z-8);}
  function villa(x,z,id){yard(x,z,23,18);box(M.wall,x,1.8,z,15.5,3.6,11);roof(M.roof2,x,3.85,z,16.2,11.8,.7);door(x,1.15,z+5.55,1,2.1);for(let i=-2;i<=2;i++)windowPane(x+i*2.6,2.2,z+5.6,1.25,1.5);box(M.pool,x+7.3,.12,z-5,5.2,.25,2.8);box(M.concrete,x,3.5,z+6.05,16,.22,2.2);label('GRAND VILLA • ₦10,000/DAY',x,z-9.5);}
  function palace(x,z,id){yard(x,z,27,21);box(M.wall,x,2.0,z,18,4,13);box(M.wall,x,5.3,z-1,16.5,2.6,11.5);roof(M.roof2,x,6.8,z-1,18,13,.7);box(M.gold,x,3.8,z+6.55,1.4,5.2,.5);box(M.gold,x-7,3.8,z+6.55,.8,5.2,.5);box(M.gold,x+7,3.8,z+6.55,.8,5.2,.5);door(x,1.3,z+6.58,1.5,2.6);for(let i=-3;i<=3;i+=2)windowPane(x+i*2,2.8,z+6.62,1.25,1.6);box(M.pool,x+9,.12,z-6,5.5,.25,3.2);cyl(M.gold,x-9,.8,z-5,.75,1.5);label('ROYAL PALACE • ₦20,000/DAY',x,z-11);}
  function grand(x,z){yard(x,z,34,28);box(M.white,x,2.8,z,23,5.6,17);box(M.white,x,7,z-2,21,2.8,15);roof(M.roof2,x,8.65,z-2,24,17,.8);box(M.glass,x,4.1,z+8.6,12,.12,5.8);box(M.glass,x,6.7,z+7.9,10,.12,3);door(x,1.7,z+8.62,2.2,3.2);for(let i=-3;i<=3;i+=2)windowPane(x+i*2.6,3.6,z+8.7,1.6,1.8);box(M.pool,x+11,.14,z-7,8,.3,4.5);box(M.concrete,x-11,.4,z-7,5,.8,5);cyl(M.gold,x-11,1.2,z-7,1.5,2.2);label('GRAND BUILDING • ₦30,000/DAY',x,z-15);}

  // Existing server-authoritative house plots. These structures sit on their established plots;
  // the rental/ownership state remains controlled by the existing house system.
  const plots=[
    ['hut',-70,87],['hut',-56,87],['hut',-41,87],['hut',-27,87],['hut',128,-60],['hut',156,-60],['hut',184,-60],['hut',212,-60],
    ['faceme',-67,101],['faceme',-48,101],['faceme',-30,101],['faceme',135,-34],['faceme',170,-34],['faceme',205,-34],['faceme',135,-8],['faceme',170,-8],['faceme',205,-8],
    ['flat',-205,55],['flat',-175,55],['flat',-145,55],['flat',180,155],['flat',210,155],['flat',240,155],['flat',270,155],
    ['duplex',128,-228],['duplex',156,-228],['duplex',184,-228],['duplex',212,-228],
    ['villa',-200,-228],['villa',-144,-228],['villa',-117,-228],['palace',-228,-228],['palace',-172,-228]
  ];
  plots.forEach(([type,x,z],i)=>{ if(type==='hut')hut(x,z,''); else if(type==='faceme')faceme(x,z,''); else if(type==='flat')flat(x,z,''); else if(type==='duplex')duplex(x,z,''); else if(type==='villa')villa(x,z,''); else palace(x,z,''); });

  // New premium tier: deliberately separate from the existing Palace plots so it can be tested
  // without changing saved homes. The server-side rental catalogue can be promoted to this tier later.
  grand(-82,-270);

  const style=document.createElement('style');style.textContent='#nrsHousingToast{position:fixed;left:50%;bottom:14%;transform:translateX(-50%);z-index:12000;background:rgba(8,16,24,.92);border:1px solid rgba(244,210,122,.55);border-radius:14px;padding:10px 16px;color:#fff;font:700 14px Arial;pointer-events:none;opacity:0;transition:opacity .18s}';document.head.appendChild(style);
  const toast=document.createElement('div');toast.id='nrsHousingToast';document.body.appendChild(toast);
  let last=0;
  function notice(text){const now=Date.now();if(now-last<800)return;last=now;toast.textContent=text;toast.style.opacity='1';setTimeout(()=>toast.style.opacity='0',1800);}
  // Use the existing action button when the game exposes a house interaction target.
  window.addEventListener('nrs-house-focus',e=>{const d=e.detail||{};if(d.name)notice(d.name+' • ₦'+Number(d.rent||0).toLocaleString('en-NG')+'/day');});
  window.NRSHousingStructures={version:'2026-10-12',tiers:{hut:1000,faceme:2500,flat:4000,duplex:7500,villa:10000,palace:20000,grand:30000}};
})();
