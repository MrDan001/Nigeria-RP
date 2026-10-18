/* On-screen error reporter for phones (no console needed). Tap the red box to hide it. */
(function(){
  const box=document.createElement("div"),lines=[];
  box.style.cssText="position:fixed;left:8px;bottom:8px;max-width:72vw;z-index:2147483647;background:rgba(120,0,0,.9);color:#fff;font:11px/1.35 monospace;padding:6px 8px;border-radius:8px;white-space:pre-wrap;display:none;word-break:break-all";
  function add(m){lines.push(String(m).slice(0,240));if(lines.length>5)lines.shift();box.textContent=lines.join("\n")+"\n(tap to hide)";box.style.display="block";}
  window.addEventListener("error",e=>{if(e&&e.message&&e.message!=="Script error."||e.filename)add("ERR "+(e.message||"load failed")+" @"+String(e.filename||"").split("/").pop().split("?")[0]+":"+(e.lineno||""));},true);
  window.addEventListener("unhandledrejection",e=>add("PROMISE "+((e.reason&&e.reason.message)||e.reason)));
  window.addEventListener("webglcontextlost",()=>add("WEBGL CONTEXT LOST"),true);
  const ce=console.error;console.error=function(){try{add("CONSOLE "+Array.prototype.slice.call(arguments).map(a=>a&&a.message?a.message:String(a)).join(" "));}catch(_){}return ce.apply(console,arguments);};
  box.onclick=()=>{box.style.display="none";lines.length=0;};
  (document.body||document.documentElement).appendChild(box);
  setTimeout(()=>{const d=window.NRS&&window.NRS.dieselAvatar;if(d&&d.status!=="loaded")add("DIESEL "+JSON.stringify({status:d.status,error:d.error||null,progress:d.progress||null}));},12000);
})();
