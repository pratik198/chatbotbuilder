(function(){"use strict";(function(){const r=document.currentScript||document.querySelector("script[data-bot]"),h=r==null?void 0:r.getAttribute("data-bot");if(!h){console.warn("[ChatPlatform] No data-bot attribute found on widget script tag.");return}const v=(()=>{const e=(r==null?void 0:r.src)||"";try{return new URL(e).origin}catch{return window.location.origin}})();let o=null,y=sessionStorage.getItem("cp_session")||crypto.randomUUID(),s=!1,b=!1,i=[];sessionStorage.setItem("cp_session",y);const n=(()=>{const e=document.createElement("div");return e.id="cp-widget-host",e.style.cssText="position:fixed;bottom:24px;right:24px;z-index:2147483647;font-family:system-ui,sans-serif",document.body.appendChild(e),e.attachShadow({mode:"closed"})})(),w=document.createElement("style");w.textContent=`
    * { box-sizing: border-box; margin: 0; padding: 0 }
    #bubble {
      width: 56px; height: 56px; border-radius: 50%;
      background: var(--cp-primary, #2563eb); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2); border: none;
      transition: transform 0.2s;
    }
    #bubble:hover { transform: scale(1.05) }
    #bubble svg { width: 26px; height: 26px; fill: white }

    #panel {
      position: absolute; bottom: 68px; right: 0;
      width: 360px; height: 520px; max-height: 80vh;
      background: white; border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.15);
      display: flex; flex-direction: column; overflow: hidden;
      transform-origin: bottom right;
      transition: opacity 0.2s, transform 0.2s;
    }
    #panel.hidden { opacity: 0; transform: scale(0.92); pointer-events: none }

    #header {
      background: var(--cp-primary, #2563eb); color: white;
      padding: 16px; display: flex; align-items: center; gap: 10px;
    }
    #header .avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: rgba(255,255,255,0.25);
      display: flex; align-items: center; justify-content: center;
    }
    #header .avatar svg { width: 20px; height: 20px; fill: white }
    #header .name { font-weight: 600; font-size: 15px }
    #header .status { font-size: 11px; opacity: 0.8 }
    #close-btn {
      margin-left: auto; background: transparent; border: none;
      color: white; cursor: pointer; opacity: 0.7; padding: 4px;
    }
    #close-btn:hover { opacity: 1 }

    #messages {
      flex: 1; overflow-y: auto; padding: 16px;
      display: flex; flex-direction: column; gap: 10px;
    }
    .msg { display: flex; max-width: 80% }
    .msg.user { align-self: flex-end }
    .msg.user .bubble {
      background: var(--cp-primary, #2563eb); color: white;
      border-radius: 18px 18px 4px 18px; padding: 10px 14px; font-size: 14px;
    }
    .msg.bot { align-self: flex-start }
    .msg.bot .bubble {
      background: #f1f5f9; color: #1e293b;
      border-radius: 18px 18px 18px 4px; padding: 10px 14px; font-size: 14px;
    }
    .msg.bot .bubble.typing { color: #94a3b8 }

    #footer {
      border-top: 1px solid #e2e8f0; padding: 12px;
      display: flex; gap: 8px; align-items: center;
    }
    #input {
      flex: 1; border: 1.5px solid #e2e8f0; border-radius: 22px;
      padding: 9px 14px; font-size: 14px; outline: none;
      transition: border-color 0.2s; resize: none; height: 38px;
      font-family: inherit; line-height: 1.4;
    }
    #input:focus { border-color: var(--cp-primary, #2563eb) }
    #send-btn {
      width: 36px; height: 36px; border-radius: 50%;
      background: var(--cp-primary, #2563eb); border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    #send-btn:disabled { opacity: 0.4; cursor: not-allowed }
    #send-btn svg { width: 16px; height: 16px; fill: white }
  `,n.appendChild(w);const d=document.createElement("button");d.id="bubble",d.innerHTML=f(),n.appendChild(d);const l=document.createElement("div");l.id="panel",l.className="hidden",l.innerHTML=`
    <div id="header">
      <div class="avatar">${M()}</div>
      <div><div class="name" id="bot-name">Assistant</div><div class="status" id="bot-status">Connecting...</div></div>
      <button id="close-btn" title="Close">${z()}</button>
    </div>
    <div id="messages"></div>
    <div id="footer">
      <input id="input" placeholder="Type a message..." autocomplete="off" />
      <button id="send-btn">${S()}</button>
    </div>
  `,n.appendChild(l);const a=n.getElementById("messages"),p=n.getElementById("input"),u=n.getElementById("send-btn"),B=n.getElementById("bot-name"),E=n.getElementById("bot-status");function g(){a.innerHTML="",i.forEach(({role:e,content:t})=>{const c=document.createElement("div");c.className=`msg ${e==="user"?"user":"bot"}`;const x=document.createElement("div");x.className="bubble",x.textContent=t,c.appendChild(x),a.appendChild(c)}),a.scrollTop=a.scrollHeight}function L(){const e=document.createElement("div");e.className="msg bot",e.id="typing-indicator";const t=document.createElement("div");t.className="bubble typing",t.textContent="...",e.appendChild(t),a.appendChild(e),a.scrollTop=a.scrollHeight}function m(){var e;(e=n.getElementById("typing-indicator"))==null||e.remove()}function C(){const e=v.replace(/^http/,"ws")+`/ws/chat/${h}?sessionKey=${y}`;o=new WebSocket(e),o.onopen=()=>{b=!0,E.textContent="Online"},o.onmessage=t=>{try{const c=JSON.parse(t.data);I(c)}catch{}},o.onclose=()=>{b=!1,E.textContent="Reconnecting...",setTimeout(C,3e3)},o.onerror=()=>o.close()}function I(e){if(e.type==="message")m(),i.push({role:e.role||"assistant",content:e.content}),g(),u.disabled=!1;else if(e.type==="stream_token"){m();const t=i[i.length-1];(t==null?void 0:t.role)==="assistant"?t.content+=e.delta:i.push({role:"assistant",content:e.delta}),g()}else e.type==="stream_end"?u.disabled=!1:e.type==="error"&&(m(),i.push({role:"assistant",content:"⚠️ Sorry, something went wrong. Please try again."}),g(),u.disabled=!1)}function k(e){!e.trim()||!b||(i.push({role:"user",content:e}),g(),L(),u.disabled=!0,o.send(JSON.stringify({type:"message",content:e})),p.value="")}d.addEventListener("click",()=>{s=!s,l.classList.toggle("hidden",!s),d.innerHTML=s?z():f(),s&&!b&&C(),s&&setTimeout(()=>p.focus(),100)}),n.getElementById("close-btn").addEventListener("click",()=>{s=!1,l.classList.add("hidden"),d.innerHTML=f()}),u.addEventListener("click",()=>k(p.value)),p.addEventListener("keydown",e=>{e.key==="Enter"&&!e.shiftKey&&(e.preventDefault(),k(p.value))}),fetch(`${v}/public/v1/bots/${h}/config`).then(e=>e.ok?e.json():null).then(e=>{if(!e)return;B.textContent=e.name||"Assistant";const t=e.widgetConfig||{};t.primaryColor&&n.host.style.setProperty("--cp-primary",t.primaryColor)}).catch(()=>{});function f(){return'<svg viewBox="0 0 24 24"><path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z"/></svg>'}function z(){return'<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>'}function M(){return'<svg viewBox="0 0 24 24"><path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7H3a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2zM7 14a5 5 0 0010 0H7zm0 5h10v2H7v-2z"/></svg>'}function S(){return'<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>'}})()})();
