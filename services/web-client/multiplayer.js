/* NRS Multiplayer Bridge — Stage 1 */
(function(){
  const state={ws:null,id:null,ready:false,seq:0,targets:new Map(),remotes:new Map(),lastSend:0,reconnect:0};
  const remoteRoot=new THREE.Group(); remoteRoot.name='NRS_REMOTE_PLAYERS'; scene.add(remoteRoot);
  function wsUrl(){return (location.protocol==='https:'?'wss://':'ws://')+location.host;}
  function send(msg){if(state.ws&&state.ws.readyState===WebSocket.OPEN)state.ws.send(JSON.stringify(msg));}
  function labelSprite(text){
    const c=document.createElement('canvas');c.width=256;c.height=64;const g=c.getContext('2d');
    g.font='bold 30px system-ui';g.textAlign='center';g.fillStyle='rgba(8,15,24,.82)';
    if(g.roundRect){g.beginPath();g.roundRect(6,8,244,48,16);g.fill();}else g.fillRect(6,8,244,48);
    g.fillStyle='#fff';g.fillText(text,128,42);
    const t=new THREE.CanvasTexture(c);const m=new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false});
    const s=new THREE.Sprite(m);s.scale.set(2.7,.68,1);s.position.y=2.35;s.renderOrder=50;return s;
  }
  function makeRemote(p){
    const g=new THREE.Group(),mdl=model.clone(true);g.add(mdl);g.position.set(p.x,0,p.z);g.rotation.y=p.yaw||0;
    const tag=labelSprite(p.name||'Player');g.add(tag);g.userData={tag,target:null,name:p.name||'Player'};remoteRoot.add(g);state.remotes.set(p.id,g);return g;
  }
  function removeRemote(id){const g=state.remotes.get(id);if(!g)return;remoteRoot.remove(g);state.remotes.delete(id);}
  function applySnapshot(list){
    const seen=new Set();
    for(const p of list||[]){if(!p||!p.id)continue;seen.add(p.id);
      if(p.id===state.id){state.localTarget={x:p.x,z:p.z,yaw:p.yaw};continue;}
      let g=state.remotes.get(p.id);if(!g)g=makeRemote(p);
      g.userData.target={x:p.x,z:p.z,yaw:p.yaw||0};g.userData.name=p.name||'Player';
    }
    for(const id of state.remotes.keys())if(!seen.has(id))removeRemote(id);
    const count=(list||[]).length;const b=document.querySelector('#top b');if(b)b.textContent=String(count);
    if(window.__nrsOnline)window.__nrsOnline(count);
  }
  function hello(){send({type:'hello',name:'Player'});}
  function connect(){
    try{state.ws=new WebSocket(wsUrl());}catch(e){state.reconnect=setTimeout(connect,1500);return;}
    const ws=state.ws;
    ws.addEventListener('open',()=>{state.ready=true;hello();if(window.__nrsNetStatus)window.__nrsNetStatus('ONLINE');});
    ws.addEventListener('message',e=>{let m;try{m=JSON.parse(e.data);}catch{return;}
      if(m.type==='connected'){state.id=m.playerId;applySnapshot(m.players);return;}
      if(m.type==='snapshot'){applySnapshot(m.players);return;}
      if(m.type==='playerJoined'){applySnapshot((m.player?[m.player]:[]).concat([...state.remotes.entries()].map(([id,g])=>({id,x:g.position.x,z:g.position.z,yaw:g.rotation.y,name:g.userData.name||'Player'}))));return;}
      if(m.type==='playerLeft'){removeRemote(m.playerId);return;}
      if(m.type==='playerUpdated'&&m.player){const g=state.remotes.get(m.player.id);if(g)g.userData.name=m.player.name;return;}
    });
    ws.addEventListener('close',()=>{if(state.ws!==ws)return;state.ready=false;if(window.__nrsNetStatus)window.__nrsNetStatus('RECONNECTING');for(const id of state.remotes.keys())removeRemote(id);state.reconnect=setTimeout(connect,1500);});
  }
  const originalUpdate=update;
  update=function(dt){
    originalUpdate(dt);
    if(state.ready&&!driving&&!inside){
      const ix=inp.x,iy=inp.y;let mag=Math.hypot(ix,iy);if(mag>1)mag=1;
      const now=performance.now();
      if(mag>.01){const s=Math.sin(camYaw),c=Math.cos(camYaw),dx=ix*c-iy*s,dz=-ix*s-iy*c;
        send({type:'input',input:{sequence:state.seq++,forward:clamp(-dz,-1,1)*mag,strafe:clamp(dx,-1,1)*mag}});
        state.lastSend=now;
      }else if(now-state.lastSend>120){send({type:'input',input:{sequence:state.seq++,forward:0,strafe:0}});state.lastSend=now;}
    }
    for(const g of state.remotes.values()){const q=g.userData.target;if(!q)continue;const f=1-Math.exp(-dt*12);
      g.position.x+=(q.x-g.position.x)*f;g.position.z+=(q.z-g.position.z)*f;let d=q.yaw-g.rotation.y;d=Math.atan2(Math.sin(d),Math.cos(d));g.rotation.y+=d*f;}
    const lt=state.localTarget;if(lt&&!driving&&!inside){const dx=lt.x-pos.x,dz=lt.z-pos.z,dist=Math.hypot(dx,dz);
      if(dist>3){pos.x=lt.x;pos.z=lt.z;}else if(dist>.15){const f=1-Math.exp(-dt*7);pos.x+=dx*f;pos.z+=dz*f;}}
  };
  window.__nrsOnline=n=>{const top=document.querySelector('#top');if(top){const spans=top.querySelectorAll('span');const online=[...spans].find(s=>s.textContent.includes('online'));if(online)online.innerHTML='👤 <b>'+n+'</b> online';}};
  window.__nrsNetStatus=s=>{const brand=document.querySelector('#brand small');if(brand)brand.textContent='PORT HARCOURT • '+s;};
  connect();
})();