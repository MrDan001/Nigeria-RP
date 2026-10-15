(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const apps = [
    { id: "phone", icon: "📞", name: "Phone", note: "SIM card, dialler and voice calls", badge: "NEW" },
    { id: "messages", icon: "💬", name: "Messages", note: "Private SMS between citizens", badge: "NEW" },
    { id: "travel", icon: "🚌", name: "Interstate Travel", note: "Waterlines · day and night buses" },
    { id: "flights", icon: "✈️", name: "NRS Air", note: "Book an in-game flight" },
    { id: "betting", icon: "⚽", name: "Betting", note: "Daily sports fixtures and virtual-token tickets" },
    { id: "wallet", icon: "₦", name: "Wallet", note: "Game cash and banking" },
    { id: "contacts", icon: "👥", name: "Contacts", note: "Online citizens and phone numbers" },
    { id: "map", icon: "🗺️", name: "City Map", note: "Find local services and shops" },
    { id: "news", icon: "📰", name: "RNN News", note: "In-game city bulletins" },
    { id: "jobs", icon: "💼", name: "Careers", note: "Jobs and workplaces" },
    { id: "services", icon: "🏪", name: "Shop finder", note: "Find the phone shop and city services" },
    { id: "help", icon: "💡", name: "Help & guide", note: "Phone, calls, SMS and game controls" },
    { id: "passport", icon: "🛂", name: "State Passport", note: "Your state discoveries" }
  ];
  const style = document.createElement("style");
  style.textContent = `
#nrsTabletLayer{position:fixed;inset:0;z-index:97000;display:grid;place-items:center;padding:6px;box-sizing:border-box;background:rgba(1,6,16,.76);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#f5f8ff;touch-action:manipulation}
#nrsTabletLayer[hidden]{display:none!important}
#nrsTabletDevice{position:relative;width:min(1420px,98vw);height:min(94dvh,960px);min-height:0;display:grid;grid-template-rows:clamp(22px,2.7vh,30px) minmax(0,1fr) clamp(23px,3vh,32px);gap:0;overflow:hidden;box-sizing:border-box;border:2px solid #5c646d;border-radius:30px;background:#05070a;box-shadow:0 30px 95px #000b,inset 0 0 0 2px #ffffff12,inset 0 0 0 7px #15191e;padding:clamp(30px,3.6vh,43px) clamp(11px,2.4vw,34px) clamp(9px,2.1vh,24px)}
#nrsTabletDevice:before{content:"";position:absolute;z-index:8;top:13px;left:50%;width:7px;height:7px;transform:translateX(-50%);border-radius:50%;background:radial-gradient(circle at 35% 35%,#526d90 0,#111923 55%,#020304 100%);box-shadow:0 0 0 2px #181c21}
#nrsTabletStatus{min-width:0;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 clamp(10px,1.7vw,24px);color:#fff;font-size:clamp(9px,.85vw,13px);font-weight:700;letter-spacing:.01em;background:linear-gradient(112deg,#0755d0,#1438a8 74%,#27369b);border-radius:7px 7px 0 0}
.tabletStatusRight{display:flex;align-items:center;gap:clamp(5px,.7vw,10px);white-space:nowrap}
.statusWifi{display:inline-grid;place-items:center;line-height:1}.statusWifi svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}.statusSignal{font-size:11px;letter-spacing:-2px;transform:scaleY(.88);transform-origin:bottom}.statusBattery{position:relative;display:inline-block;width:17px;height:9px;border:1.5px solid #fff;border-radius:2px;box-sizing:border-box;margin-left:1px}.statusBattery:before{content:"";position:absolute;right:-4px;top:2px;width:2px;height:3px;border-radius:0 1px 1px 0;background:#fff}.statusBattery span{display:block;width:78%;height:100%;background:#fff}
#nrsTabletClose{display:grid;place-items:center;width:23px;height:23px;min-width:23px;border:1px solid #ffffff32;border-radius:50%;background:#ffffff14;color:#fff;font-size:17px;line-height:1;padding:0;touch-action:manipulation}
#nrsTabletBody{position:relative;min-height:0;overflow:auto;overscroll-behavior:contain;scrollbar-width:none;color:#f7f9ff}#nrsTabletBody::-webkit-scrollbar{display:none}
#nrsTabletBody.homeScreen{isolation:isolate;background:radial-gradient(ellipse 44% 76% at 95% 77%,#df2874 0%,#f14d3c 28%,transparent 29%),radial-gradient(ellipse 59% 115% at 91% 68%,#ff6d12 0%,#ff8b18 41%,transparent 42%),radial-gradient(ellipse 58% 100% at 92% 9%,#ffc334 0%,#ffb126 39%,transparent 40%),radial-gradient(ellipse 56% 35% at 56% 52%,#1e31bd 0%,transparent 74%),linear-gradient(138deg,#0759db 0%,#073bb7 50%,#142aa1 100%)}
#nrsTabletBody.homeScreen:before{content:"";position:absolute;z-index:0;pointer-events:none;left:-13%;top:52%;width:88%;height:76%;border-radius:0 68% 0 0/0 52% 0 0;transform:rotate(7deg);background:linear-gradient(153deg,rgba(17,80,219,.98),rgba(8,39,151,.98) 70%);box-shadow:0 -22px 46px rgba(20,84,227,.2)}
.homeContent{position:relative;z-index:1;min-height:100%;display:flex;flex-direction:column;padding:0 0 clamp(8px,1.6vh,16px)}
.homeHero{display:flex;align-items:center;justify-content:space-between;gap:14px;min-height:clamp(106px,19vh,190px);padding:clamp(13px,2.4vw,32px) clamp(20px,6.2vw,90px) clamp(4px,1vh,12px)}
.clockBlock{min-width:0}.homeClock{font-size:clamp(36px,6.2vw,78px);font-weight:350;line-height:.98;letter-spacing:-.065em;text-shadow:0 2px 15px #06318c45;font-variant-numeric:tabular-nums}.homeDate{margin-top:9px;font-size:clamp(11px,1.4vw,19px);font-weight:500;letter-spacing:.01em;color:#f4f7ff}
.weatherWidget{display:flex;align-items:center;gap:clamp(9px,1.6vw,21px);width:clamp(175px,22vw,280px);max-width:43%;padding:clamp(10px,1.8vw,22px);border:1px solid #ffffff18;border-radius:24px;background:rgba(8,55,154,.56);box-shadow:0 14px 32px rgba(4,28,86,.12);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.weatherSymbol{flex:0 0 auto;font-size:clamp(28px,4vw,51px);line-height:1}.weatherReading{min-width:0;display:flex;flex-direction:column;gap:3px}.weatherReading strong{font-size:clamp(25px,3.5vw,43px);font-weight:500;line-height:1}.weatherReading span{font-size:clamp(10px,1.1vw,14px);white-space:nowrap}.weatherReading small{font-size:clamp(9px,.95vw,12px);color:#e3eaff;white-space:nowrap}
.tabletSearch{display:flex;align-items:center;gap:clamp(9px,1.2vw,17px);width:min(86%,1080px);height:clamp(42px,5.7vh,61px);box-sizing:border-box;margin:clamp(2px,1vh,11px) auto clamp(12px,2.4vh,25px);padding:0 clamp(12px,1.7vw,23px);border:1px solid #ffffffa6;border-radius:999px;background:rgba(255,255,255,.91);box-shadow:0 9px 28px #041f6940;color:#586779}
.searchBrand{display:grid;place-items:center;flex:0 0 auto;width:clamp(24px,2.4vw,33px);height:clamp(24px,2.4vw,33px);border-radius:50%;background:conic-gradient(#4285f4 0 25%,#34a853 0 48%,#fbbc05 0 68%,#ea4335 0 83%,#4285f4 0);color:#fff;font-size:clamp(12px,1.1vw,16px);font-weight:900;text-shadow:0 1px 2px #163b8855}
#nrsTabletSearchInput{flex:1;min-width:0;height:100%;border:0;outline:0;background:transparent;color:#213347;font:500 clamp(11px,1.15vw,15px) system-ui,-apple-system,sans-serif}#nrsTabletSearchInput::placeholder{color:#7b8795;opacity:1}
#nrsTabletSearchGo{display:grid;place-items:center;flex:0 0 auto;width:32px;height:32px;border:0;border-radius:50%;background:transparent;color:#2874d8;font-size:23px;font-weight:600}
#nrsTabletGrid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:clamp(7px,1.3vh,15px) clamp(4px,1.2vw,16px);padding:0 clamp(14px,3.7vw,55px)}
#nrsTabletGrid button{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:0;min-width:0;min-height:clamp(74px,12.4vh,126px);padding:5px 3px 7px;border:1px solid transparent;border-radius:17px;background:transparent;color:#fff;text-align:center;touch-action:manipulation}
#nrsTabletGrid button:active{transform:scale(.97);background:#ffffff15;border-color:#ffffff25}
#nrsTabletGrid button[hidden]{display:none!important}
#nrsTabletGrid .appIcon{display:grid;place-items:center;flex:0 0 auto;width:clamp(43px,5.1vw,72px);height:clamp(43px,5.1vw,72px);margin-bottom:9px;border:1px solid #ffffff55;border-radius:clamp(12px,1.4vw,20px);box-shadow:0 7px 16px #07133f35,inset 0 1px 0 #ffffff4c;color:#fff;font-size:clamp(22px,2.5vw,35px);line-height:1}
#nrsTabletGrid strong{display:block;width:100%;font-size:clamp(9px,.96vw,14px);font-weight:550;line-height:1.22;text-shadow:0 1px 3px #07194e75;overflow-wrap:anywhere}
#nrsTabletGrid .badge{position:absolute;z-index:1;top:0;right:0;max-width:75%;padding:3px 4px;border-radius:5px;background:#6e4d16;color:#ffe5a0;font-size:clamp(6px,.52vw,7px);font-weight:900;letter-spacing:.02em}
#nrsTabletGrid button[data-app="travel"] .appIcon{background:linear-gradient(145deg,#159b6c,#075743)}
#nrsTabletGrid button[data-app="flights"] .appIcon{background:linear-gradient(145deg,#4ca9ff,#1557c7)}
#nrsTabletGrid button[data-app="betting"] .appIcon{background:linear-gradient(145deg,#ff8152,#d92446)}
#nrsTabletGrid button[data-app="wallet"] .appIcon{background:linear-gradient(145deg,#21b98b,#078264)}
#nrsTabletGrid button[data-app="contacts"] .appIcon{background:linear-gradient(145deg,#ff9b58,#ec4a35)}
#nrsTabletGrid button[data-app="map"] .appIcon{background:linear-gradient(145deg,#6c83ff,#4435c4)}
#nrsTabletGrid button[data-app="news"] .appIcon{background:linear-gradient(145deg,#f75c9b,#b42175)}
#nrsTabletGrid button[data-app="jobs"] .appIcon{background:linear-gradient(145deg,#55b47c,#197248)}
#nrsTabletGrid button[data-app="passport"] .appIcon{background:linear-gradient(145deg,#ab83ff,#6533c9)}
.tabletDock{display:flex;align-items:center;justify-content:space-evenly;gap:clamp(10px,2.5vw,35px);width:min(70%,740px);box-sizing:border-box;margin:clamp(7px,1.7vh,18px) auto 0;padding:clamp(6px,1.1vh,12px) clamp(12px,2.4vw,30px);border:1px solid #ffffff20;border-radius:25px;background:rgba(7,23,89,.3);box-shadow:0 10px 28px #06184c23;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
.tabletDock button{display:grid;place-items:center;flex:0 1 auto;min-width:0;padding:0;border:0;border-radius:15px;background:transparent;touch-action:manipulation}
.tabletDock button:active{transform:scale(.94)}
.tabletDock .appIcon{display:grid;place-items:center;width:clamp(37px,4.2vw,57px);height:clamp(37px,4.2vw,57px);border:1px solid #ffffff48;border-radius:clamp(11px,1.3vw,16px);box-shadow:0 5px 13px #05143f42,inset 0 1px 0 #ffffff4c;color:#fff;font-size:clamp(18px,2vw,27px);line-height:1}
.tabletDock button[data-app="wallet"] .appIcon{background:linear-gradient(145deg,#21b98b,#078264)}.tabletDock button[data-app="contacts"] .appIcon{background:linear-gradient(145deg,#ff9b58,#ec4a35)}.tabletDock button[data-app="map"] .appIcon{background:linear-gradient(145deg,#6c83ff,#4435c4)}.tabletDock button[data-app="betting"] .appIcon{background:linear-gradient(145deg,#ff8152,#d92446)}.tabletDock button[data-app="news"] .appIcon{background:linear-gradient(145deg,#f75c9b,#b42175)}
#nrsTabletDock[hidden]{display:none!important}
#nrsTabletBody.appScreen{isolation:auto;padding:clamp(12px,2.4vw,28px);background:linear-gradient(150deg,#10283b,#07121e 75%);color:#f3f8ff}
#nrsTabletFoot{display:flex;align-items:center;justify-content:space-evenly;gap:20px;background:rgba(6,18,75,.88);border-radius:0 0 7px 7px}
#nrsTabletFoot .navRecent{color:#ecf2ff;font-size:17px;letter-spacing:-4px;transform:rotate(90deg)}
#nrsTabletFoot button{display:grid;place-items:center;width:29px;height:24px;padding:0;border:0;background:transparent;color:#f4f7ff;font-weight:400;font-size:25px;line-height:1;touch-action:manipulation}
#nrsTabletHome{font-size:20px!important}
#nrsTabletBack{font-size:30px!important}
#nrsTabletDevice .appTitle{margin:0 0 5px;font-size:clamp(20px,2.5vw,28px);letter-spacing:-.035em}
#nrsTabletDevice .appCopy{margin:0 0 16px;color:#9fb4c6;font-size:12px;line-height:1.5}
#nrsTabletDevice .safeBanner{margin:0 0 15px;padding:11px 12px;border:1px solid #2a5d4b;border-radius:12px;background:#0b2c25;color:#9aefc1;font-size:11px;line-height:1.45}
#nrsTabletDevice .infoGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:12px 0}
#nrsTabletDevice .infoCard{min-width:0;padding:13px;border:1px solid #ffffff16;border-radius:13px;background:#0e1c29}
#nrsTabletDevice .infoCard small{display:block;color:#93a9bc;font-size:9px;letter-spacing:.06em}
#nrsTabletDevice .infoCard strong{display:block;overflow-wrap:anywhere;margin-top:6px;font-size:20px;color:#88e7b4}
#nrsTabletDevice .appList{display:grid;gap:9px}
#nrsTabletDevice .listRow{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 12px;border:1px solid #ffffff16;border-radius:12px;background:#0c1a27;font-size:12px}
#nrsTabletDevice .listRow small{display:block;margin-top:4px;color:#93a9bc;font-size:10px}
#nrsTabletDevice .sectionLabel{display:block;margin:17px 0 8px;color:#81a5bd;font-size:9px;font-weight:900;letter-spacing:.12em}
#nrsTabletDevice .fixture{margin:10px 0;padding:13px;border:1px solid #ffffff18;border-radius:14px;background:#0e1d2a}
#nrsTabletDevice .fixtureName{display:flex;align-items:center;justify-content:space-between;gap:10px;font-weight:800;font-size:12px}
#nrsTabletDevice .picks{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:10px}
#nrsTabletDevice .pick{min-width:0;padding:10px 4px;border:1px solid #344b5d;border-radius:10px;background:#122536;color:#dbe9f2;font-size:10px;font-weight:800}
#nrsTabletDevice .pick.on{border-color:#5ed7ff;background:#16465b;color:#fff}
#nrsTabletDevice .pick small{display:block;margin-top:4px;color:#91b6cd;font-size:10px}
#nrsTabletDevice .formRow{display:flex;align-items:center;gap:10px;margin:12px 0}
#nrsTabletDevice input,#nrsTabletDevice select{box-sizing:border-box;max-width:100%;min-width:0;padding:11px;border:1px solid #30485b;border-radius:10px;background:#071522;color:#fff;font:inherit}
#nrsTabletDevice input{flex:1}
#nrsTabletDevice .primary{min-height:42px;padding:10px 14px;border:1px solid #4cbee1;border-radius:10px;background:linear-gradient(135deg,#16769b,#164e75);color:#fff;font-size:11px;font-weight:900}
#nrsTabletDevice .secondary{min-height:38px;padding:8px 12px;border:1px solid #ffffff22;border-radius:10px;background:#1a2c3b;color:#fff;font-size:11px;font-weight:800}
#nrsTabletDevice .feedback{min-height:20px;color:#ffd783;font-size:11px;line-height:1.45}
#nrsTabletDevice .tag{display:inline-block;padding:5px 7px;border:1px solid #6b5525;border-radius:7px;background:#3b2d14;color:#ffdf94;font-size:8px;font-weight:900;letter-spacing:.04em}
#nrsTabletDevice .empty{padding:14px;border:1px dashed #ffffff22;border-radius:12px;color:#9aafc0;font-size:12px;line-height:1.5}
@media(max-width:800px){#nrsTabletGrid{grid-template-columns:repeat(5,minmax(0,1fr));padding:0 12px}.homeHero{padding-left:clamp(13px,4vw,30px);padding-right:clamp(13px,4vw,30px)}.tabletSearch{width:90%}.tabletDock{width:78%}}
@media(max-width:620px){#nrsTabletDevice{width:100vw;height:96dvh;border:1px solid #525d67;border-radius:17px;padding:27px 5px 7px;grid-template-rows:22px minmax(0,1fr) 24px;box-shadow:0 18px 50px #0009,inset 0 0 0 2px #171b20}#nrsTabletDevice:before{top:8px;width:5px;height:5px}#nrsTabletStatus{padding:0 8px;font-size:9px}#nrsTabletClose{width:20px;height:20px;min-width:20px;font-size:15px}.homeHero{min-height:101px;padding:10px 12px 2px;gap:7px}.homeClock{font-size:clamp(34px,6vw,48px)}.homeDate{margin-top:5px;font-size:11px}.weatherWidget{width:auto;max-width:48%;gap:7px;padding:8px 9px;border-radius:14px}.weatherSymbol{font-size:27px}.weatherReading strong{font-size:24px}.weatherReading span,.weatherReading small{font-size:8px}.tabletSearch{width:92%;height:39px;margin:7px auto 9px;padding:0 10px}.searchBrand{width:23px;height:23px;font-size:11px}#nrsTabletSearchInput{font-size:11px}#nrsTabletGrid{grid-template-columns:repeat(5,minmax(0,1fr));gap:3px 2px;padding:0 7px}#nrsTabletGrid button{min-height:clamp(64px,14vh,83px);padding:3px 1px 4px;border-radius:10px}#nrsTabletGrid .appIcon{width:clamp(34px,5.6vh,44px);height:clamp(34px,5.6vh,44px);margin-bottom:5px;border-radius:11px;font-size:21px}#nrsTabletGrid strong{font-size:9px}.tabletDock{width:78%;margin-top:6px;padding:5px 10px;gap:9px;border-radius:18px}.tabletDock .appIcon{width:clamp(31px,5vh,39px);height:clamp(31px,5vh,39px);border-radius:10px;font-size:17px}#nrsTabletBody.appScreen{padding:11px}#nrsTabletDevice .formRow{flex-wrap:wrap}#nrsTabletFoot{gap:16px}}
@media(max-height:500px){.homeHero{min-height:91px;padding-top:7px}.homeClock{font-size:clamp(34px,5vw,47px)}.tabletSearch{height:37px;margin-top:3px;margin-bottom:7px}#nrsTabletGrid{gap:1px 2px}#nrsTabletGrid button{min-height:65px}#nrsTabletGrid .appIcon{width:35px;height:35px;margin-bottom:4px;font-size:19px}.tabletDock{margin-top:3px;padding:4px 9px}.tabletDock .appIcon{width:31px;height:31px}}
`;
  style.textContent += "\n#nrsTabletGrid button[data-app=\"phone\"] .appIcon{background:linear-gradient(145deg,#31c7a1,#087c70)}\n#nrsTabletGrid button[data-app=\"messages\"] .appIcon{background:linear-gradient(145deg,#65b7ff,#275dd5)}\n#nrsTabletGrid button[data-app=\"help\"] .appIcon{background:linear-gradient(145deg,#f9d24c,#e78a16)}\n#nrsTabletGrid button[data-app=\"services\"] .appIcon{background:linear-gradient(145deg,#a7e45a,#278342)}\n#nrsTabletDevice .phoneNumberHero{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:10px 0 14px;padding:16px;border:1px solid #ffffff1c;border-radius:15px;background:linear-gradient(130deg,#0c5248,#0d2430)}\n#nrsTabletDevice .phoneNumberHero small{display:block;color:#a4cabb;font-size:9px;font-weight:900;letter-spacing:.12em}\n#nrsTabletDevice .phoneNumberHero strong{display:block;margin-top:5px;color:#a4f2c8;font-size:clamp(19px,3vw,27px);letter-spacing:.02em}\n#nrsTabletDevice .phoneStatus{color:#b7c9d8;font-size:11px;line-height:1.45}\n#nrsTabletDevice .phoneActions{display:flex;flex-wrap:wrap;gap:5px;align-items:center;justify-content:flex-end}\n#nrsTabletDevice .phoneActions button{margin:0;padding:7px 9px;min-height:32px}\n#nrsTabletDevice .phoneThread{display:flex;flex-direction:column;gap:8px;max-height:min(48vh,390px);overflow:auto;padding:9px 3px;margin:8px 0 12px;overscroll-behavior:contain}\n#nrsTabletDevice .phoneBubble{align-self:flex-start;max-width:84%;padding:9px 11px;border:1px solid #ffffff15;border-radius:13px 13px 13px 3px;background:#142c3c;color:#f1f7fb;font-size:12px;line-height:1.4;overflow-wrap:anywhere}\n#nrsTabletDevice .phoneBubble.outgoing{align-self:flex-end;border-color:#24785b;border-radius:13px 13px 3px 13px;background:#104b3d}\n#nrsTabletDevice .phoneBubble small{display:block;margin-top:4px;color:#94aebf;font-size:9px}\n#nrsTabletDevice .phoneThreadHead{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:7px 0;padding-bottom:9px;border-bottom:1px solid #ffffff15}\n#nrsTabletDevice .phoneThreadHead strong{font-size:14px}\n#nrsTabletDevice .phoneFeedback{margin:9px 0;padding:9px 10px;border:1px solid #765e2d;border-radius:10px;background:#332813;color:#ffdf9d;font-size:11px;line-height:1.4}\n#nrsTabletDevice .phoneFeedback.error{border-color:#693e47;background:#321921;color:#ffbbc5}\n#nrsTabletDevice .phoneContactButtons{display:flex;flex-wrap:wrap;gap:5px}\n#nrsTabletDevice .phoneContactButtons button{margin:0;padding:6px 8px;font-size:10px}\n#nrsTabletDevice .phoneIncoming{margin:9px 0;padding:14px;border:1px solid #2d8f72;border-radius:14px;background:linear-gradient(135deg,#0b372f,#102b3b)}\n#nrsTabletDevice .phoneIncoming h3{margin:0 0 4px;font-size:16px}\n#nrsTabletDevice .phoneIncoming p{color:#b9d3d7;font-size:11px;line-height:1.45}\n#nrsTabletDevice .phoneCallControls{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}\n#nrsTabletDevice .phoneCallControls button{flex:1 1 120px;margin:0}\n#nrsTabletDevice .phoneHangup{background:linear-gradient(135deg,#d94857,#951f37)!important;border-color:#ff8891!important}\n#nrsTabletDevice .phoneDialRow{display:flex;gap:7px;margin:9px 0 14px}\n#nrsTabletDevice .phoneDialRow input{min-width:0;flex:1;width:1%;font-size:13px}\n#nrsTabletDevice .phoneForm{display:flex;gap:7px;margin:10px 0}\n#nrsTabletDevice .phoneForm input{min-width:0;flex:1;width:1%}\n#nrsTabletDevice .phoneForm button{flex:0 0 auto;margin:0}\n#nrsTabletGrid button[data-app=\"phone\"] .badge,#nrsTabletGrid button[data-app=\"messages\"] .badge{background:#d83255;color:#fff}\n@media(max-width:620px){#nrsTabletDevice .phoneNumberHero{padding:12px}#nrsTabletDevice .phoneThread{max-height:37vh}#nrsTabletDevice .phoneBubble{max-width:92%}#nrsTabletDevice .phoneDialRow{flex-wrap:wrap}#nrsTabletDevice .phoneDialRow input{flex:1 1 100%;width:100%}}\n";
  document.head.appendChild(style);

  const layer = document.createElement("div");
  layer.id = "nrsTabletLayer";
  layer.hidden = true;
  layer.innerHTML = '<section id="nrsTabletDevice" aria-label="Nigeria RP Tablet"><div id="nrsTabletStatus"><span id="nrsTabletTime"></span><div class="tabletStatusRight"><span class="statusWifi" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M2.5 8.8a14.4 14.4 0 0 1 19 0M5.5 12a9.8 9.8 0 0 1 13 0M8.7 15.2a5 5 0 0 1 6.6 0"/><circle cx="12" cy="18.4" r="1.4" fill="currentColor" stroke="none"/></svg></span><span class="statusSignal" aria-hidden="true">▂▅▇</span><span class="statusBattery" aria-hidden="true"><span></span></span><span id="nrsTabletBattery">78%</span><button id="nrsTabletClose" type="button" aria-label="Close Tablet" title="Close Tablet">×</button></div></div><main id="nrsTabletBody" class="homeScreen"></main><footer id="nrsTabletFoot"><span class="navRecent" aria-hidden="true">Ⅲ</span><button id="nrsTabletHome" type="button" aria-label="Home" title="Home">○</button><button id="nrsTabletBack" type="button" aria-label="Back" title="Back">‹</button></footer></section>';
  document.body.appendChild(layer);
  const body = $("nrsTabletBody");

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }
  function money(value) { return "₦" + Math.max(0, Math.floor(Number(value) || 0)).toLocaleString("en-NG"); }
  function timeText() { return new Intl.DateTimeFormat("en-NG", { timeZone: "Africa/Lagos", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date()); }
  function dateText() { return new Intl.DateTimeFormat("en-NG", { timeZone: "Africa/Lagos", weekday: "short", day: "numeric", month: "short" }).format(new Date()); }
  let activeAppId = "";
  let phoneState = { phoneNumber: null, hasSim: false, inPhoneShop: false, cash: 0, contacts: [] };
  let phoneFeedback = "";
  let phoneFeedbackError = false;
  let activePhoneThread = "";
  let phoneThreads = null;
  let phoneCall = null;
  let phoneRtc = null;
  let phoneRtcReady = null;
  let phoneRtcCallId = "";
  let phoneLocalStream = null;
  let phoneRemoteAudio = null;
  let phoneRtcPendingCandidates = [];

  function phoneSelfId() {
    return String(window.NRS?.playerIdentity?.id || window.NRS?.session?.id || "");
  }
  function phoneStorageKey() {
    return "nrs-phone-threads-v1:" + (phoneSelfId() || "local-citizen");
  }
  function phoneLoadThreads() {
    if (phoneThreads) return phoneThreads;
    try {
      const parsed = JSON.parse(localStorage.getItem(phoneStorageKey()) || "{}");
      phoneThreads = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch (_) { phoneThreads = {}; }
    return phoneThreads;
  }
  function phoneSaveThreads() {
    const threads = phoneLoadThreads();
    const keys = Object.keys(threads);
    for (const key of keys) {
      if (!Array.isArray(threads[key])) delete threads[key];
      else threads[key] = threads[key].slice(-100);
    }
    const recent = Object.keys(threads).sort((a,b) =>
      Number(threads[b]?.[threads[b].length - 1]?.at || 0) - Number(threads[a]?.[threads[a].length - 1]?.at || 0)
    );
    for (const key of recent.slice(40)) delete threads[key];
    try { localStorage.setItem(phoneStorageKey(), JSON.stringify(threads)); } catch (_) {}
  }
  function phoneRequestState() {
    const send = window.NRS?.sendPhoneMessage;
    if (typeof send !== "function" || !send("getPhoneState")) {
      phoneFeedback = "Phone services are reconnecting. Try again in a moment.";
      phoneFeedbackError = true;
    }
  }
  function phoneSetFeedback(message, isError) {
    phoneFeedback = String(message || "");
    phoneFeedbackError = !!isError;
  }
  function phoneTime(value) {
    const date = new Date(Number(value) || Date.now());
    return new Intl.DateTimeFormat("en-NG", { timeZone: "Africa/Lagos", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);
  }
  function phoneCleanNumber(value) {
    return String(value || "").replace(/\D/g, "").slice(0, 11);
  }
  function phoneButton(label, dataset, className) {
    const button = el("button", className || "secondary", label);
    button.type = "button";
    for (const [key,value] of Object.entries(dataset || {})) button.dataset[key] = String(value);
    return button;
  }
  function phoneContactRow(contact) {
    const row = el("div", "listRow");
    const detail = el("span", "", String(contact.name || "Citizen"));
    detail.appendChild(el("small", "", String(contact.phoneNumber || "No number") + " · " + String(contact.cityId || "unknown city").replace(/-/g, " ")));
    row.appendChild(detail);
    const actions = el("div", "phoneActions");
    if (contact.phoneNumber) {
      actions.appendChild(phoneButton("Call", { phoneCallTarget: contact.phoneNumber }, "primary"));
      actions.appendChild(phoneButton("Message", { phoneMessageTarget: contact.phoneNumber }, "secondary"));
    }
    row.appendChild(actions);
    return row;
  }
  function phoneStoreIncomingText(packet) {
    const outgoing = String(packet.senderId || "") === phoneSelfId();
    const peerNumber = outgoing ? String(packet.toNumber || "") : String(packet.fromNumber || "");
    if (!/^0\d{10}$/.test(peerNumber)) return;
    const threads = phoneLoadThreads();
    const list = Array.isArray(threads[peerNumber]) ? threads[peerNumber] : [];
    const messageId = String(packet.messageId || (String(packet.at || Date.now()) + "-" + Math.random()));
    if (list.some((item) => item.id === messageId)) return;
    list.push({
      id: messageId,
      at: Number(packet.at) || Date.now(),
      direction: outgoing ? "outgoing" : "incoming",
      name: outgoing ? String(packet.recipientName || peerNumber) : String(packet.senderName || peerNumber),
      text: String(packet.text || "").slice(0, 400),
      fromNumber: String(packet.fromNumber || ""),
      toNumber: String(packet.toNumber || ""),
    });
    threads[peerNumber] = list.slice(-100);
    phoneSaveThreads();
    if (activeAppId === "messages") renderMessages();
  }
  function phoneRequestApp(id) {
    activeAppId = id;
    phoneRequestState();
    if (id === "phone") renderPhone();
    else if (id === "messages") renderMessages();
    else if (id === "contacts") renderContacts();
  }
  function phoneEnsureTabletApp(id) {
    if (layer.hidden) openTablet();
    showApp(id);
  }
  function phoneStartCall(rawNumber) {
    const number = phoneCleanNumber(rawNumber);
    if (!phoneState.hasSim) { phoneSetFeedback("Buy a SIM card at Kings Phones & Gadgets before making calls.", true); phoneEnsureTabletApp("phone"); return; }
    if (!/^0\d{10}$/.test(number)) { phoneSetFeedback("Enter an 11-digit Nigerian phone number.", true); phoneEnsureTabletApp("phone"); return; }
    if (phoneCall) { phoneSetFeedback("Finish your current call before starting another.", true); phoneEnsureTabletApp("phone"); return; }
    phoneCall = { mode: "outgoing", targetNumber: number, targetName: number, state: "dialling", callId: "" };
    phoneSetFeedback("Calling " + number + "…", false);
    if (!window.NRS?.sendPhoneMessage?.("phoneCallStart", { toNumber: number })) {
      phoneCall = null;
      phoneSetFeedback("The phone network is disconnected. Reconnect and try again.", true);
    }
    phoneEnsureTabletApp("phone");
  }
  function phoneSendText(rawNumber, rawText) {
    const number = phoneCleanNumber(rawNumber);
    const text = String(rawText || "").trim().slice(0, 400);
    if (!phoneState.hasSim) { phoneSetFeedback("Buy a SIM card before sending SMS.", true); renderMessages(); return; }
    if (!/^0\d{10}$/.test(number)) { phoneSetFeedback("Choose a contact with a valid phone number.", true); renderMessages(); return; }
    if (!text) { phoneSetFeedback("Type a message first.", true); renderMessages(); return; }
    phoneSetFeedback("Sending SMS…", false);
    if (!window.NRS?.sendPhoneMessage?.("phoneTextSend", { toNumber: number, text })) {
      phoneSetFeedback("The phone network is disconnected. Reconnect and try again.", true);
      renderMessages();
      return;
    }
    activePhoneThread = number;
    const input = $("nrsPhoneTextInput");
    if (input) input.value = "";
    if (activeAppId === "messages") renderMessages();
  }
  function phoneClosePeer() {
    if (phoneRtc) {
      try { phoneRtc.onicecandidate = null; phoneRtc.ontrack = null; phoneRtc.onconnectionstatechange = null; phoneRtc.close(); } catch (_) {}
    }
    phoneRtc = null;
    if (phoneLocalStream) for (const track of phoneLocalStream.getTracks()) track.stop();
    phoneLocalStream = null;
    if (phoneRemoteAudio) {
      try { phoneRemoteAudio.pause(); phoneRemoteAudio.srcObject = null; phoneRemoteAudio.remove(); } catch (_) {}
    }
    phoneRemoteAudio = null;
    phoneRtcCallId = "";
    phoneRtcReady = null;
    phoneRtcPendingCandidates = [];
  }
  async function phoneEnsurePeer(callId, isCaller) {
    if (phoneRtcCallId === callId && phoneRtcReady) return phoneRtcReady;
    phoneClosePeer();
    phoneRtcCallId = callId;
    phoneRtcReady = (async () => {
      if (!navigator.mediaDevices?.getUserMedia || typeof RTCPeerConnection === "undefined") {
        throw new Error("Voice calls need a supported browser and microphone permission over HTTPS.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      if (phoneRtcCallId !== callId) {
        for (const track of stream.getTracks()) track.stop();
        return null;
      }
      const peer = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" }
        ]
      });
      phoneRtc = peer;
      phoneLocalStream = stream;
      for (const track of stream.getTracks()) peer.addTrack(track, stream);
      peer.onicecandidate = (event) => {
        if (!event.candidate || phoneRtcCallId !== callId) return;
        window.NRS?.sendPhoneMessage?.("phoneCallSignal", {
          callId, signalKind: "candidate", payload: event.candidate.toJSON()
        });
      };
      peer.ontrack = (event) => {
        if (phoneRtcCallId !== callId) return;
        if (!phoneRemoteAudio) {
          phoneRemoteAudio = document.createElement("audio");
          phoneRemoteAudio.id = "nrsPhoneRemoteAudio";
          phoneRemoteAudio.autoplay = true;
          phoneRemoteAudio.playsInline = true;
          phoneRemoteAudio.style.display = "none";
          document.body.appendChild(phoneRemoteAudio);
        }
        phoneRemoteAudio.srcObject = event.streams[0];
        const playing = phoneRemoteAudio.play();
        if (playing && typeof playing.catch === "function") playing.catch(() => {
          phoneSetFeedback("Tap the screen once to allow call audio.", false);
        });
      };
      peer.onconnectionstatechange = () => {
        if (phoneRtcCallId !== callId || !phoneCall || phoneCall.callId !== callId) return;
        if (peer.connectionState === "connected") {
          phoneCall.state = "connected";
          phoneSetFeedback("Call connected. Your microphone is live.", false);
          if (activeAppId === "phone") renderPhone();
        } else if (peer.connectionState === "failed") {
          phoneCall.state = "failed";
          phoneSetFeedback("Voice connection failed. Hang up and try again; some networks require a relay connection.", true);
          if (activeAppId === "phone") renderPhone();
        }
      };
      return peer;
    })();
    return phoneRtcReady;
  }
  async function phoneFlushCandidates(peer) {
    const pending = phoneRtcPendingCandidates.splice(0);
    for (const candidate of pending) {
      try { await peer.addIceCandidate(new RTCIceCandidate(candidate)); } catch (_) {}
    }
  }
  async function phoneHandleSignal(message) {
    if (!phoneCall || phoneCall.callId !== message.callId) return;
    try {
      const peer = await phoneEnsurePeer(message.callId, false);
      if (!peer) return;
      const payload = message.payload;
      if (message.signalKind === "offer") {
        await peer.setRemoteDescription(new RTCSessionDescription(payload));
        await phoneFlushCandidates(peer);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        window.NRS?.sendPhoneMessage?.("phoneCallSignal", {
          callId: message.callId, signalKind: "answer",
          payload: { type: peer.localDescription.type, sdp: peer.localDescription.sdp }
        });
      } else if (message.signalKind === "answer") {
        await peer.setRemoteDescription(new RTCSessionDescription(payload));
        await phoneFlushCandidates(peer);
      } else if (message.signalKind === "candidate") {
        if (peer.remoteDescription) {
          try { await peer.addIceCandidate(new RTCIceCandidate(payload)); } catch (_) {}
        } else {
          phoneRtcPendingCandidates.push(payload);
        }
      }
    } catch (error) {
      phoneSetFeedback((error && error.message) || "Could not start voice audio. Check microphone permission and try again.", true);
      if (activeAppId === "phone") renderPhone();
      window.NRS?.sendPhoneMessage?.("phoneCallEnd", { callId: message.callId });
    }
  }
  async function phoneStartRtcAsCaller(callId) {
    try {
      const peer = await phoneEnsurePeer(callId, true);
      if (!peer || phoneCall?.callId !== callId) return;
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      window.NRS?.sendPhoneMessage?.("phoneCallSignal", {
        callId, signalKind: "offer",
        payload: { type: peer.localDescription.type, sdp: peer.localDescription.sdp }
      });
    } catch (error) {
      phoneSetFeedback((error && error.message) || "Could not access the microphone. Allow microphone permission and try again.", true);
      if (activeAppId === "phone") renderPhone();
      window.NRS?.sendPhoneMessage?.("phoneCallEnd", { callId });
    }
  }
  function renderPhone() {
    activeAppId = "phone";
    setScreenTitle("Phone", "Your personal number, contacts, messages and voice calls.");
    const hasNumber = !!phoneState.phoneNumber;
    const hero = el("div", "phoneNumberHero");
    const detail = el("div");
    detail.appendChild(el("small", "", hasNumber ? "YOUR ACTIVE NIGERIAN NUMBER" : "NO SIM INSTALLED"));
    detail.appendChild(el("strong", "", hasNumber ? phoneState.phoneNumber : "SIM not activated"));
    hero.appendChild(detail);
    if (hasNumber) hero.appendChild(phoneButton("Copy number", { phoneCopy: phoneState.phoneNumber }, "secondary"));
    body.appendChild(hero);
    if (!hasNumber) {
      body.appendChild(el("p", "appCopy", "Buy one SIM card at Kings Phones & Gadgets for ₦3,500. Your number is saved to this citizen and stays yours when you log out."));
      body.appendChild(el("div", "safeBanner", phoneState.inPhoneShop ? "You are inside Kings Phones & Gadgets. The shop can activate your SIM now." : "Walk into Kings Phones & Gadgets in Port Harcourt and use the shop counter to purchase a SIM."));
      if (phoneState.inPhoneShop) body.appendChild(phoneButton("Buy SIM card · ₦3,500", { phoneBuySim: "1" }, "primary"));
    } else {
      const grid = el("div", "infoGrid");
      const stateCard = el("div", "infoCard");
      stateCard.append(el("small", "", "SIM STATUS"), el("strong", "", "ACTIVE"));
      const cashCard = el("div", "infoCard");
      cashCard.append(el("small", "", "AVAILABLE CASH"), el("strong", "", money(phoneState.cash ?? window.NRS?.cash)));
      grid.append(stateCard, cashCard);
      body.appendChild(grid);
      body.appendChild(el("span", "sectionLabel", "DIAL A PHONE NUMBER"));
      const form = el("form", "phoneDialRow");
      form.id = "nrsPhoneCallForm";
      const input = el("input");
      input.id = "nrsPhoneDialInput";
      input.type = "tel";
      input.inputMode = "numeric";
      input.maxLength = 11;
      input.placeholder = "080XXXXXXXX";
      input.autocomplete = "tel";
      input.value = phoneCall?.mode === "outgoing" ? String(phoneCall.targetNumber || "") : "";
      input.setAttribute("aria-label", "Phone number to call");
      const callButton = el("button", "primary", "Call");
      callButton.type = "submit";
      form.append(input, callButton);
      body.appendChild(form);
      const quickActions = el("div", "phoneContactButtons");
      quickActions.append(
        phoneButton("Open Messages", { phoneOpenMessages: "1" }, "secondary"),
        phoneButton("Refresh contacts", { phoneRefresh: "1" }, "secondary")
      );
      body.appendChild(quickActions);
    }

    if (phoneCall) {
      const card = el("div", "phoneIncoming");
      const title = phoneCall.mode === "incoming" ? "Incoming call" : phoneCall.state === "connected" ? "Call connected" : "Call status";
      card.appendChild(el("h3", "", title));
      const party = phoneCall.mode === "incoming"
        ? String(phoneCall.callerName || phoneCall.callerNumber || "Citizen")
        : String(phoneCall.targetName || phoneCall.targetNumber || "Citizen");
      card.appendChild(el("p", "", party + (phoneCall.mode === "incoming" ? " is calling you." : " · " + String(phoneCall.state || "calling").replace(/-/g, " ") + ".")));
      const controls = el("div", "phoneCallControls");
      if (phoneCall.mode === "incoming" && phoneCall.state === "incoming") {
        controls.append(
          phoneButton("Answer", { phoneAnswer: "1" }, "primary"),
          phoneButton("Decline", { phoneDecline: "1" }, "phoneHangup")
        );
      } else {
        controls.append(phoneButton("Hang up", { phoneHangup: "1" }, "phoneHangup"));
      }
      card.appendChild(controls);
      if (phoneCall.state === "connected") card.appendChild(el("p", "appCopy", "Keep this tablet open or return to the game. Tap Hang up to end the call."));
      body.appendChild(card);
    }

    if (phoneFeedback) body.appendChild(el("div", "phoneFeedback" + (phoneFeedbackError ? " error" : ""), phoneFeedback));
    body.appendChild(el("span", "sectionLabel", "CITIZENS ONLINE WITH A SIM"));
    const contacts = Array.isArray(phoneState.contacts) ? phoneState.contacts : [];
    if (!hasNumber) body.appendChild(el("div", "empty", "Activate a SIM card to call or message other citizens."));
    else if (!contacts.length) body.appendChild(el("div", "empty", "No other SIM-enabled citizens are online right now. Their numbers will appear here when they join."));
    else {
      const list = el("div", "appList");
      contacts.forEach((contact) => list.appendChild(phoneContactRow(contact)));
      body.appendChild(list);
    }
  }
  function renderMessages() {
    activeAppId = "messages";
    setScreenTitle("Messages", "Private SMS uses phone numbers, so friends can chat from different places and cities.");
    const hasNumber = !!phoneState.phoneNumber;
    if (!hasNumber) body.appendChild(el("div", "safeBanner", "You need an active SIM from Kings Phones & Gadgets before you can send SMS."));
    else body.appendChild(el("div", "safeBanner", "Your number: " + phoneState.phoneNumber + " · Messages are delivered live when the other citizen is online."));
    if (activePhoneThread) {
      const threads = phoneLoadThreads();
      const thread = Array.isArray(threads[activePhoneThread]) ? threads[activePhoneThread] : [];
      const contact = (phoneState.contacts || []).find((item) => item.phoneNumber === activePhoneThread);
      const head = el("div", "phoneThreadHead");
      const heading = el("div");
      heading.append(el("strong", "", contact?.name || thread[thread.length - 1]?.name || activePhoneThread), el("small", "", activePhoneThread));
      head.append(heading, phoneButton("All messages", { phoneThreadHome: "1" }, "secondary"));
      body.appendChild(head);
      const log = el("div", "phoneThread");
      if (!thread.length) log.appendChild(el("div", "empty", "No messages yet. Send the first message below."));
      for (const item of thread) {
        const bubble = el("div", "phoneBubble" + (item.direction === "outgoing" ? " outgoing" : ""));
        bubble.appendChild(el("span", "", item.text));
        bubble.appendChild(el("small", "", (item.direction === "outgoing" ? "You" : item.name || activePhoneThread) + " · " + phoneTime(item.at)));
        log.appendChild(bubble);
      }
      body.appendChild(log);
      const form = el("form", "phoneForm");
      form.id = "nrsPhoneTextForm";
      const input = el("input");
      input.id = "nrsPhoneTextInput";
      input.maxLength = 400;
      input.placeholder = hasNumber ? "Type an SMS…" : "Install a SIM to send messages";
      input.autocomplete = "off";
      input.disabled = !hasNumber;
      input.setAttribute("aria-label", "SMS message");
      const button = el("button", "primary", "Send");
      button.type = "submit";
      button.disabled = !hasNumber;
      form.append(input, button);
      body.appendChild(form);
    } else {
      const threads = phoneLoadThreads();
      const numbers = Object.keys(threads).sort((a,b) =>
        Number(threads[b]?.[threads[b].length - 1]?.at || 0) - Number(threads[a]?.[threads[a].length - 1]?.at || 0)
      );
      body.appendChild(el("span", "sectionLabel", "RECENT CONVERSATIONS"));
      const recent = el("div", "appList");
      for (const number of numbers) {
        const items = threads[number] || [];
        const last = items[items.length - 1];
        const row = el("div", "listRow");
        const detail = el("span", "", last?.name || number);
        detail.appendChild(el("small", "", number + " · " + String(last?.text || "").slice(0, 85)));
        row.append(detail, phoneButton("Open", { phoneThread: number }, "secondary"));
        recent.appendChild(row);
      }
      if (!numbers.length) recent.appendChild(el("div", "empty", "Your conversations will appear here. Choose an online citizen below to start one."));
      body.appendChild(recent);
      body.appendChild(el("span", "sectionLabel", "ONLINE PHONE CONTACTS"));
      const contacts = el("div", "appList");
      const online = Array.isArray(phoneState.contacts) ? phoneState.contacts : [];
      online.forEach((contact) => {
        const row = el("div", "listRow");
        const detail = el("span", "", contact.name || "Citizen");
        detail.appendChild(el("small", "", contact.phoneNumber + " · " + String(contact.cityId || "").replace(/-/g, " ")));
        row.append(detail, phoneButton("Message", { phoneThread: contact.phoneNumber }, "secondary"));
        contacts.appendChild(row);
      });
      if (!online.length) contacts.appendChild(el("div", "empty", "No other SIM-enabled citizens are online right now. You can open a previous conversation above."));
      body.appendChild(contacts);
    }
    if (phoneFeedback) body.appendChild(el("div", "phoneFeedback" + (phoneFeedbackError ? " error" : ""), phoneFeedback));
  }
  function renderHelp() {
    setScreenTitle("Help & guide", "A quick guide to using your citizen tablet.");
    const entries = [
      ["Phone number", "Enter Kings Phones & Gadgets in Port Harcourt, then buy one SIM for ₦3,500. Each character keeps the number after logging out."],
      ["Voice calls", "Open Phone, enter a citizen's 11-digit number and tap Call. The other player sees an incoming call and can Answer or Decline. Allow microphone access."],
      ["Private SMS", "Open Messages, choose an online phone contact and send text. Both players see the same conversation even when they are in different places or cities."],
      ["Contacts", "Phone contacts show online citizens who have activated a SIM. You can open a message thread or start a voice call from a contact row."],
      ["Shop finder", "Open City Map, choose Shops and walk to Kings Phones & Gadgets. Enter the store before purchasing your SIM."],
      ["Safety", "Only share your in-game phone number with people you want to contact. Calls and SMS work while both citizens are online."]
    ];
    const list = el("div", "appList");
    for (const [title,copy] of entries) {
      const row=el("div","listRow"),detail=el("span");
      detail.append(el("strong","",title),el("small","",copy));
      list.appendChild(row);row.appendChild(detail);
    }
    body.appendChild(list);
    body.appendChild(phoneButton("Find shops on the map", { phoneOpenMap: "1" }, "primary"));
  }
  function setScreenTitle(title, copy) {
    body.className = "appScreen";
    body.replaceChildren();
    body.appendChild(el("h2", "appTitle", title));
    if (copy) body.appendChild(el("p", "appCopy", copy));
  }
  function returnHome() {
    body.className = "homeScreen";
    body.replaceChildren();
    body.insertAdjacentHTML("afterbegin", '<div class="homeContent"><section class="homeHero"><div class="clockBlock"><div class="homeClock" id="nrsTabletHomeClock"></div><div class="homeDate" id="nrsTabletHomeDate"></div></div><div class="weatherWidget"><span class="weatherSymbol" aria-hidden="true">⛅</span><div class="weatherReading"><strong>28°</strong><span>Port Harcourt</span><small>Partly cloudy</small></div></div></section><div class="tabletSearch"><span class="searchBrand" aria-hidden="true">N</span><input id="nrsTabletSearchInput" type="search" placeholder="Search apps and services" autocomplete="off" aria-label="Search tablet apps"><button id="nrsTabletSearchGo" type="button" aria-label="Find an app">⌕</button></div><div id="nrsTabletGrid"></div><div id="nrsTabletDock" class="tabletDock" aria-label="Pinned apps"></div></div>');
    $("nrsTabletHomeClock").textContent = timeText();
    $("nrsTabletHomeDate").textContent = dateText();
    const grid = $("nrsTabletGrid");
    for (const app of apps) {
      const button = el("button", "", "");
      button.type = "button";
      button.dataset.app = app.id;
      button.dataset.search = (app.name + " " + app.note).toLowerCase();
      button.setAttribute("aria-label", app.name);
      button.title = app.name + (app.note ? " — " + app.note : "");
      const icon = el("span", "appIcon", app.icon);
      icon.setAttribute("aria-hidden", "true");
      const title = el("strong", "", app.name);
      if (app.badge) button.appendChild(el("span", "badge", app.badge));
      button.append(icon, title);
      grid.appendChild(button);
    }
    const dock = $("nrsTabletDock");
    for (const id of ["wallet", "contacts", "map", "betting", "news"]) {
      const app = apps.find((item) => item.id === id);
      if (!app) continue;
      const button = el("button", "", "");
      button.type = "button";
      button.dataset.app = app.id;
      button.setAttribute("aria-label", app.name);
      button.title = app.name;
      const icon = el("span", "appIcon", app.icon);
      icon.setAttribute("aria-hidden", "true");
      button.appendChild(icon);
      dock.appendChild(button);
    }
    const search = $("nrsTabletSearchInput");
    const searchGo = $("nrsTabletSearchGo");
    const filterApps = () => {
      const query = search.value.trim().toLowerCase();
      for (const button of grid.querySelectorAll("button[data-app]")) {
        button.hidden = query.length > 0 && !button.dataset.search.includes(query);
      }
      dock.hidden = query.length > 0;
    };
    search.addEventListener("input", filterApps);
    search.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      const first = Array.from(grid.querySelectorAll("button[data-app]")).find((button) => !button.hidden);
      if (first) first.click();
    });
    searchGo.addEventListener("click", () => {
      search.focus();
      if (search.value.trim()) filterApps();
    });
  }
  function openTablet() {
    layer.hidden = false;
    returnHome();
    $("nrsTabletTime").textContent = timeText();
  }
  function closeTablet() { layer.hidden = true; }

  function openTravel(mode) {
    closeTablet();
    window.dispatchEvent(new CustomEvent("nrs-tablet-travel-mode", { detail: { mode } }));
    window.dispatchEvent(new Event("nrs-open-travel"));
  }
  function renderWallet() {
    setScreenTitle("Wallet & banking", "View your available character cash and bank balance.");
    body.appendChild(el("div", "safeBanner", "CHARACTER FINANCES · Cash and bank balances"));
    const grid = el("div", "infoGrid");
    const cash = $("cash") ? $("cash").textContent : (window.NRS && window.NRS.cash);
    const bank = window.NRS && (window.NRS.bankBalance ?? window.NRS.bank);
    const cashCard = el("div", "infoCard");
    cashCard.append(el("small", "", "CASH IN GAME"), el("strong", "", "₦" + String(cash || "0")));
    const bankCard = el("div", "infoCard");
    bankCard.append(el("small", "", "BANK BALANCE IN GAME"), el("strong", "", bank === undefined ? "Open a bank in the city" : money(bank)));
    grid.append(cashCard, bankCard);
    body.appendChild(grid);
    body.appendChild(el("p", "appCopy", "To use normal character banking, visit a bank in the city. Banking actions are processed by the game server."));
  }
  function renderContacts() {
    activeAppId = "contacts";
    setScreenTitle("Contacts", "Online citizens with an active SIM can be reached from anywhere in the roleplay world.");
    const list = el("div", "appList");
    const session = window.NRS && window.NRS.session;
    const currentName = window.NRS?.playerIdentity?.name || (session && session.name) || "You";
    const self = el("div", "listRow");
    self.appendChild(el("span", "", "You · " + currentName));
    self.appendChild(el("small", "", phoneState.phoneNumber || "No SIM installed"));
    list.appendChild(self);
    const contacts = Array.isArray(phoneState.contacts) ? phoneState.contacts : [];
    for (const contact of contacts) list.appendChild(phoneContactRow(contact));
    if (!contacts.length) list.appendChild(el("div", "empty", "No other SIM-enabled citizens are online. Numbers will appear when citizens connect and activate a SIM."));
    if (!phoneState.hasSim) body.appendChild(el("div", "safeBanner", "You need a SIM from Kings Phones & Gadgets to call or message a citizen."));
    body.appendChild(list);
    body.appendChild(phoneButton("Open Phone", { phoneOpenPhone: "1" }, "primary"));
  }
  function renderNews() {
    setScreenTitle("Rivers News Network", "The official news desk inside Nigeria RP.");
    body.appendChild(el("div", "safeBanner", "IN-GAME EDITORIAL RULES · Citizens submit story reports. Only authorised Rivers News Network staff can publish approved stories."));
    body.appendChild(el("div", "infoCard", "Use the City & News Hub in the game Settings for the current feed and reporting workflow."));
    const button = el("button", "primary", "Open Settings");
    button.type = "button";
    button.onclick = () => {
      closeTablet();
      $("gear")?.click();
    };
    body.appendChild(button);
  }
  function renderJobs() {
    setScreenTitle("Jobs & careers", "Earn and progress as a citizen in the game world.");
    const tips = [
      ["Job Center", "Visit the Job Center to accept a delivery mission and earn in-game cash."],
      ["Workplaces", "Find an office, market, hospital or public service and review available careers."],
      ["Payday", "Complete your assigned work and follow its on-screen instructions."],
      ["Factions", "Some roles require applications, staff approval, duty status and a uniform."]
    ];
    const list=el("div","appList");
    for(const item of tips){const row=el("div","listRow");row.appendChild(el("span","",item[0]));row.appendChild(el("small","",item[1]));list.appendChild(row);}
    body.appendChild(list);
  }
  function renderPassport() {
    setScreenTitle("State passport", "Your character records the game states visited through interstate travel.");
    const passport = window.NRS && window.NRS.stage17Passport;
    if (!passport) {
      body.appendChild(el("div","empty","Travel once or reopen Interstate Travel to load your latest passport progress."));
      return;
    }
    const grid=el("div","infoGrid");
    const visited=el("div","infoCard");
    visited.append(el("small","","STATES VISITED"),el("strong","",String(passport.visitedCount||0)+" / "+String(passport.totalCities||7)));
    const rewards=el("div","infoCard");
    rewards.append(el("small","","DISCOVERY REWARDS"),el("strong","",money(passport.totalRewardsNaira)));
    grid.append(visited,rewards);body.appendChild(grid);
    const list=el("div","appList");
    for(const stamp of Array.isArray(passport.stamps)?passport.stamps:[]){
      const row=el("div","listRow");
      row.appendChild(el("span","",String(stamp.cityName||stamp.cityId)+(stamp.current?" · Current state":"")));
      row.appendChild(el("small","",stamp.current?"Current location":"Discovered in game"));
      list.appendChild(row);
    }
    body.appendChild(list);
  }
  function renderBetting() { window.dispatchEvent(new Event("nrs-open-betting")); }
  function showApp(id) {
    activeAppId = id;
    switch(id){
      case "phone": phoneRequestApp("phone"); return;
      case "messages": phoneRequestApp("messages"); return;
      case "help": renderHelp(); return;
      case "services": setScreenTitle("Shop finder", "Find the shops, homes and public services built into Port Harcourt."); body.appendChild(el("div", "safeBanner", "Kings Phones & Gadgets sells SIM cards for ₦3,500. Open City Map, select Shops, then walk inside the store to activate yours.")); body.appendChild(phoneButton("Open City Map", { phoneOpenMap: "1" }, "primary")); return;
      case "travel": openTravel("day-bus"); return;
      case "flights": openTravel("flight"); return;
      case "betting": renderBetting();return;
      case "wallet": renderWallet();return;
      case "contacts": phoneRequestApp("contacts");return;
      case "map": closeTablet();$("ib3")?.click();return;
      case "news": renderNews();return;
      case "jobs": renderJobs();return;
      case "passport": renderPassport();return;
      default: returnHome();
    }
  }

  $("ib0")?.setAttribute("aria-label","Open Tablet");
  $("ib0")?.setAttribute("title","Open Tablet");
  $("ib0")?.addEventListener("click",(event)=>{event.stopImmediatePropagation();openTablet();},true);
  $("nrsTabletClose").addEventListener("click",closeTablet);
  $("nrsTabletHome").addEventListener("click",returnHome);
  $("nrsTabletBack").addEventListener("click",()=>{if(body.classList.contains("homeScreen"))closeTablet();else returnHome();});
  body.addEventListener("click",(event)=>{
    const button=event.target.closest("button");
    if(button){
      const d=button.dataset;
      if(d.phoneBuySim){
        phoneSetFeedback("Activating SIM and assigning your personal number…",false);
        if(!window.NRS?.sendPhoneMessage?.("buyPhoneSim"))phoneSetFeedback("The game server is disconnected. Reconnect and try again.",true);
        renderPhone();return;
      }
      if(d.phoneCallTarget){phoneStartCall(d.phoneCallTarget);return;}
      if(d.phoneMessageTarget){activePhoneThread=d.phoneMessageTarget;phoneEnsureTabletApp("messages");return;}
      if(d.phoneThread){activePhoneThread=d.phoneThread;renderMessages();return;}
      if(d.phoneThreadHome){activePhoneThread="";renderMessages();return;}
      if(d.phoneAnswer&&phoneCall?.callId){
        phoneCall.state="connecting";phoneSetFeedback("Connecting your microphone…",false);renderPhone();
        window.NRS?.sendPhoneMessage?.("phoneCallAnswer",{callId:phoneCall.callId,accepted:true});return;
      }
      if(d.phoneDecline&&phoneCall?.callId){
        window.NRS?.sendPhoneMessage?.("phoneCallAnswer",{callId:phoneCall.callId,accepted:false});
        phoneSetFeedback("Call declined.",false);return;
      }
      if(d.phoneHangup&&phoneCall?.callId){
        const callId=phoneCall.callId;
        window.NRS?.sendPhoneMessage?.("phoneCallEnd",{callId});
        phoneCall.state="ending";phoneSetFeedback("Ending call…",false);renderPhone();return;
      }
      if(d.phoneOpenMessages){phoneEnsureTabletApp("messages");return;}
      if(d.phoneOpenPhone){phoneEnsureTabletApp("phone");return;}
      if(d.phoneRefresh){phoneRequestState();phoneSetFeedback("Refreshing phone contacts…",false);renderPhone();return;}
      if(d.phoneOpenMap){closeTablet();$("ib3")?.click();return;}
      if(d.phoneCopy){
        const number=String(d.phoneCopy);
        if(navigator.clipboard?.writeText)navigator.clipboard.writeText(number).then(()=>phoneSetFeedback("Number copied.",false)).catch(()=>phoneSetFeedback("Your number is "+number+".",false));
        else phoneSetFeedback("Your number is "+number+".",false);
        if(activeAppId==="phone")renderPhone();return;
      }
    }
    const target=event.target.closest("[data-app]");
    if(target)showApp(target.dataset.app);
  });
  body.addEventListener("submit",(event)=>{
    if(event.target.id==="nrsPhoneCallForm"){
      event.preventDefault();
      phoneStartCall($("nrsPhoneDialInput")?.value||"");
      return;
    }
    if(event.target.id==="nrsPhoneTextForm"){
      event.preventDefault();
      phoneSendText(activePhoneThread,$("nrsPhoneTextInput")?.value||"");
    }
  });
  window.addEventListener("nrs-phone-message",(event)=>{
    const message=event.detail||{};
    if(message.type==="phoneState"){
      phoneState={
        phoneNumber:message.phoneNumber||null,
        hasSim:!!message.hasSim,
        inPhoneShop:!!message.inPhoneShop,
        cash:Number(message.cash)||0,
        contacts:Array.isArray(message.contacts)?message.contacts:[]
      };
      if(activeAppId==="phone")renderPhone();
      else if(activeAppId==="messages")renderMessages();
      else if(activeAppId==="contacts")renderContacts();
    }else if(message.type==="phoneSimResult"){
      phoneSetFeedback(message.message||(message.ok?"SIM activated.":"SIM purchase failed."),!message.ok);
      if(message.ok&&message.phoneNumber)phoneState.phoneNumber=message.phoneNumber,phoneState.hasSim=true;
      if(activeAppId==="phone")renderPhone();
    }else if(message.type==="phoneTextReceived"){
      phoneStoreIncomingText(message);
      if(activeAppId==="messages")renderMessages();
    }else if(message.type==="phoneTextResult"){
      phoneSetFeedback(message.message|| (message.ok?"SMS sent.":"SMS failed."),!message.ok);
      if(activeAppId==="messages")renderMessages();
    }else if(message.type==="phoneCallResult"){
      phoneSetFeedback(message.message||"Call could not be started.",true);
      if(activeAppId==="phone")renderPhone();
      else if(phoneCall)phoneEnsureTabletApp("phone");
    }else if(message.type==="phoneCallStatus"){
      phoneCall={mode:"outgoing",state:message.state||"ringing",callId:String(message.callId||""),targetNumber:String(message.targetNumber||""),targetName:String(message.targetName||message.targetNumber||"Citizen")};
      phoneSetFeedback("Ringing "+phoneCall.targetName+"…",false);
      if(activeAppId==="phone")renderPhone();
    }else if(message.type==="phoneIncomingCall"){
      phoneCall={mode:"incoming",state:"incoming",callId:String(message.callId||""),callerId:String(message.callerId||""),callerName:String(message.callerName||"Citizen"),callerNumber:String(message.callerNumber||"")};
      phoneSetFeedback("Incoming call from "+phoneCall.callerName+".",false);
      phoneEnsureTabletApp("phone");
    }else if(message.type==="phoneCallAnswered"){
      const self=phoneSelfId(),isCaller=String(message.callerId||"")===self;
      phoneCall={
        mode:isCaller?"outgoing":"incoming",
        state:"connecting",
        callId:String(message.callId||""),
        isCaller,
        targetNumber:isCaller?String(message.calleeNumber||""):String(message.callerNumber||""),
        targetName:isCaller?String(message.calleeName||"Citizen"):String(message.callerName||"Citizen"),
        callerName:String(message.callerName||"Citizen")
      };
      phoneSetFeedback("Call answered. Connecting voice audio…",false);
      if(activeAppId==="phone")renderPhone();
      if(isCaller)void phoneStartRtcAsCaller(phoneCall.callId);
      else void phoneEnsurePeer(phoneCall.callId,false).catch((error)=>{
        phoneSetFeedback((error&&error.message)||"Could not access the microphone.",true);
        window.NRS?.sendPhoneMessage?.("phoneCallEnd",{callId:phoneCall?.callId});
        if(activeAppId==="phone")renderPhone();
      });
    }else if(message.type==="phoneCallSignal"){
      void phoneHandleSignal(message);
    }else if(message.type==="phoneCallEnded"){
      const reason=String(message.reason||"ended");
      phoneClosePeer();
      phoneCall=null;
      const readable=reason==="no-answer"?"No answer. The call was missed.":reason==="declined"?"The other citizen declined the call.":reason==="disconnected"?"The other citizen disconnected.":"Call ended.";
      phoneSetFeedback(readable,reason==="no-answer"||reason==="disconnected");
      if(activeAppId==="phone")renderPhone();
    }
  });
  layer.addEventListener("click",(event)=>{if(event.target===layer)closeTablet();});
  window.addEventListener("keydown",(event)=>{if(event.key==="Escape"&&!layer.hidden)closeTablet();});
  window.setInterval(()=>{if(layer.hidden)return;const clock=$("nrsTabletTime");if(clock)clock.textContent=timeText();const homeClock=$("nrsTabletHomeClock");if(homeClock)homeClock.textContent=timeText();const homeDate=$("nrsTabletHomeDate");if(homeDate)homeDate.textContent=dateText();},15000);
  returnHome();

  // Local, walk-up 3D transport hubs: bookings work now; full boarding/terminal animation is Coming Soon.
  function addReadableBoard(parent,x,y,z,width,height,lines,background,rotationY) {
    const canvas=document.createElement("canvas");canvas.width=1024;canvas.height=256;
    const ctx=canvas.getContext("2d");
    ctx.fillStyle=background;ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle="rgba(255,255,255,.14)";ctx.fillRect(0,0,canvas.width,16);
    ctx.strokeStyle="rgba(255,255,255,.8)";ctx.lineWidth=7;ctx.strokeRect(9,9,canvas.width-18,canvas.height-18);
    ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.fillStyle="#fff";ctx.font="900 61px system-ui";
    if(lines.length===1)ctx.fillText(lines[0],512,128,canvas.width-40);
    else {ctx.fillText(lines[0],512,92,canvas.width-40);ctx.fillStyle="#b9f4d6";ctx.font="800 43px system-ui";ctx.fillText(lines[1],512,169,canvas.width-40);}
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const backTexture=texture.clone();backTexture.wrapS=THREE.RepeatWrapping;backTexture.repeat.set(-1,1);backTexture.offset.set(1,0);backTexture.needsUpdate=true;
    const board=new THREE.Group();board.position.set(x,y,z);board.rotation.y=rotationY||0;parent.add(board);
    const geometry=new THREE.PlaneGeometry(width,height);
    const front=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({map:texture,side:THREE.FrontSide,fog:false}));front.position.z=.025;board.add(front);
    const back=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({map:backTexture,side:THREE.FrontSide,fog:false}));back.rotation.y=Math.PI;back.position.z=-.025;board.add(back);
    return board;
  }
  function addFlat(width,depth,color,x,z) {
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,depth),new THREE.MeshLambertMaterial({color}));
    mesh.rotation.x=-Math.PI/2;mesh.position.set(x,.035,z);scene.add(mesh);return mesh;
  }
  function buildTransportHubs() {
    if(window.__nrsStage18TransportHubs||typeof THREE==="undefined")return;
    if(typeof scene==="undefined")return;
    window.__nrsStage18TransportHubs=true;
    addFlat(35,25,0x777d7c,-178,164);
    const busStation=new THREE.Group();busStation.position.set(-178,0,164);scene.add(busStation);
    const box=(w,h,d,mat,x,y,z,parent=busStation)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);parent.add(mesh);return mesh;};
    const concrete=new THREE.MeshLambertMaterial({color:0xd8d3c6}),trim=new THREE.MeshLambertMaterial({color:0x185541}),glass=new THREE.MeshLambertMaterial({color:0x4b91a5,transparent:true,opacity:.8}),dark=new THREE.MeshLambertMaterial({color:0x222a32}),yellow=new THREE.MeshLambertMaterial({color:0xe8b83f}),white=new THREE.MeshLambertMaterial({color:0xf4f2e9}),blue=new THREE.MeshLambertMaterial({color:0x1b6598});
    box(19,4.2,8.4,concrete,0,2.1,0);box(19.5,.5,9,trim,0,4.25,0);box(19.6,.28,9.1,yellow,0,4.52,0);
    box(5,2.5,.12,glass,-6,2,-4.26);box(5,2.5,.12,glass,0,2,-4.26);box(5,2.5,.12,glass,6,2,-4.26);
    addReadableBoard(busStation,0,5.6,-4.7,15,1.55,["WATERLINES COACHES","INTERSTATE · DAY / NIGHT"],"#134f3c",Math.PI);
    const coach=new THREE.Group();coach.position.set(-164,.1,145);coach.rotation.y=Math.PI/2;scene.add(coach);
    box(8.3,2.8,2.5,blue,0,1.55,0,coach);box(7.9,.75,2.56,dark,0,2.25,-.02,coach);box(7.5,.18,2.64,white,0,.24,0,coach);
    for(const x of [-2.8,-.9,1.0,2.8])box(.9,.72,.08,glass,x,1.9,-1.29,coach);
    for(const x of [-2.7,2.7]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.48,.48,.2,12),dark);wheel.rotation.z=Math.PI/2;wheel.position.set(x,.53,1.22);coach.add(wheel);}
    addReadableBoard(coach,0,3.1,-1.32,4.7,.55,["WATERLINES"],"#0b3e2e",0);
    if(typeof boxes!=="undefined"&&Array.isArray(boxes))boxes.push({x:-178,z:164,hw:9.5,hd:4.2,h:4.2},{x:220,z:-220,hw:9,hd:4.5,h:4.2});
    addFlat(112,30,0x454d56,266,-177);
    const runwayWhite=new THREE.MeshLambertMaterial({color:0xf4f2e9});
    for(let x=222;x<=310;x+=22){const marker=new THREE.Mesh(new THREE.BoxGeometry(1.3,.04,.6),runwayWhite);marker.position.set(x,.065,-177);scene.add(marker);}
    const airport=new THREE.Group();airport.position.set(220,0,-220);scene.add(airport);
    box(18,4.2,9,white,0,2.1,0,airport);box(18.6,.55,9.6,blue,0,4.35,0,airport);
    box(6,2.6,.12,glass,-5,2.0,-4.55,airport);box(6,2.6,.12,glass,4,2.0,-4.55,airport);
    addReadableBoard(airport,0,5.65,-5.0,15.5,1.5,["NRS REGIONAL AIRPORT","DEPARTURES · TICKET COUNTER"],"#16496f",Math.PI);
    const plane=new THREE.Group();plane.position.set(235,.3,-177);plane.rotation.y=Math.PI/2;scene.add(plane);
    const fuselage=new THREE.Mesh(new THREE.CylinderGeometry(.48,.55,11,14),white);fuselage.rotation.z=Math.PI/2;plane.add(fuselage);
    box(8,.16,2.4,blue,0,.3,0,plane);box(2.3,.12,1.1,white,-4.5,.2,0,plane);box(2.1,.1,.9,white,4.8,.18,0,plane);
    const nearby=document.createElement("button");nearby.id="nrsTravelNearby";nearby.hidden=true;nearby.textContent="Open ticket counter";
    nearby.style.cssText="position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:92000;padding:13px 18px;border:1px solid #74d9ff;border-radius:13px;background:#0b4e6c;color:white;font-weight:900;box-shadow:0 8px 28px #0008;touch-action:manipulation";
    document.body.appendChild(nearby);
    let nearbyMode=null;
    nearby.addEventListener("click",()=>openTravel(nearbyMode==="airport"?"flight":nearbyMode==="night-bus"?"night-bus":"day-bus"));
    window.setInterval(()=>{
      if(layer.hidden===false){nearby.hidden=true;return;}
      let current=null;
      try{
        const px=Number(pos.x)||0,pz=Number(pos.z)||0;
        if(Math.hypot(px+178,pz-145)<17)current="bus";
        else if(Math.hypot(px-220,pz+220)<18)current="airport";
      }catch(_){}
      nearbyMode=current==="airport"?"airport":"day-bus";
      nearby.hidden=!current;
      nearby.textContent=current==="airport"?"✈ Buy NRS Air ticket":"🚌 Waterlines ticket counter";
    },700);
  }
  try { if(typeof THREE!=="undefined"&&typeof scene!=="undefined")buildTransportHubs(); } catch(error) { console.warn("Stage 18 transport scenery unavailable",error); }
})();