/**
 * ChatPlatform Embed Widget
 *
 * Usage — add to any website:
 *   <script src="https://yourdomain.com/widget.js" data-bot="<embedToken>" defer></script>
 *
 * The widget:
 *  1. Reads data-bot from the script tag
 *  2. Fetches bot config from the API (colors, welcome message)
 *  3. Injects a chat bubble + panel into the page
 *  4. Connects via WebSocket to the chat-service
 *  5. Streams messages in real time
 */
(function () {
  'use strict'

  // ── 1. Find embed token ───────────────────────────────────────
  const scriptTag = document.currentScript ||
    document.querySelector('script[data-bot]')

  const embedToken = scriptTag?.getAttribute('data-bot')
  if (!embedToken) {
    console.warn('[ChatPlatform] No data-bot attribute found on widget script tag.')
    return
  }

  const apiBase = (() => {
    const src = scriptTag?.src || ''
    try { return new URL(src).origin } catch { return window.location.origin }
  })()

  // ── 2. State ──────────────────────────────────────────────────
  let ws = null
  let sessionKey = sessionStorage.getItem('cp_session') || crypto.randomUUID()
  let botConfig = {}
  let isOpen = false
  let isConnected = false
  let messages = []    // { role, content }
  sessionStorage.setItem('cp_session', sessionKey)

  // ── 3. DOM creation ───────────────────────────────────────────
  const shadow = (() => {
    const host = document.createElement('div')
    host.id = 'cp-widget-host'
    host.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:2147483647;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif'
    document.body.appendChild(host)
    return host.attachShadow({ mode: 'closed' })
  })()

  // Scoped CSS — isolated from host page
  const style = document.createElement('style')
  style.textContent = `
    * { box-sizing: border-box; margin: 0; padding: 0 }
    #bubble {
      width: 56px; height: 56px; border-radius: 50%;
      background: var(--cp-primary, #6366f1); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 10px 25px -5px rgba(99,102,241,0.3), 0 8px 10px -6px rgba(99,102,241,0.2); border: none;
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s;
    }
    #bubble:hover { transform: scale(1.05) }
    #bubble:active { transform: scale(0.95) }
    #bubble svg { width: 24px; height: 24px; fill: white }

    #panel {
      position: absolute; bottom: 68px; right: 0;
      width: 360px; height: 520px; max-height: 80vh;
      background: white; border-radius: 20px;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
      display: flex; flex-direction: column; overflow: hidden;
      transform-origin: bottom right;
      transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      border: 1px solid rgba(226, 232, 240, 0.8);
    }
    #panel.hidden { opacity: 0; transform: scale(0.92) translate(0, 10px); pointer-events: none }

    #header {
      background: var(--cp-primary, #6366f1); color: white;
      padding: 16px 20px; display: flex; align-items: center; gap: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    #header .avatar {
      width: 36px; height: 36px; border-radius: 10px;
      background: rgba(255,255,255,0.15);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    #header .avatar svg { width: 20px; height: 20px; fill: white }
    #header .info { display: flex; flex-direction: column; min-width: 0 }
    #header .name { font-weight: 700; font-size: 14px; letter-spacing: -0.01em; truncate: true; line-height: 1.2 }
    #header .status-container { display: flex; align-items: center; gap: 4px; margin-top: 2px }
    #header .dot { width: 6px; height: 6px; border-radius: 50%; bg-color: #4ade80 }
    #header .status { font-size: 10px; opacity: 0.85; font-weight: 600; text-transform: uppercase; tracking-wider: true }
    #close-btn {
      margin-left: auto; background: rgba(255,255,255,0.1); border: none;
      color: white; cursor: pointer; width: 28px; height: 28px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      transition: background-color 0.2s;
    }
    #close-btn:hover { background: rgba(255,255,255,0.2) }
    #close-btn svg { width: 14px; height: 14px; fill: white }

    #messages {
      flex: 1; overflow-y: auto; padding: 20px;
      display: flex; flex-direction: column; gap: 12px;
      background: #f8fafc;
    }
    .msg { display: flex; max-width: 85%; align-items: flex-end; gap: 8px }
    .msg.user { align-self: flex-end }
    .msg.user .bubble {
      background: var(--cp-primary, #6366f1); color: white;
      border-radius: 16px 16px 4px 16px; padding: 10px 14px; font-size: 13px;
      line-height: 1.5; font-weight: 500;
      box-shadow: 0 4px 6px -1px rgba(99,102,241,0.08);
    }
    .msg.bot { align-self: flex-start }
    .msg.bot .bubble {
      background: white; color: #1e293b;
      border-radius: 16px 16px 16px 4px; padding: 10px 14px; font-size: 13px;
      line-height: 1.5; border: 1px solid #e2e8f0; font-weight: 500;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
    }
    .msg.bot .bubble.typing { color: #94a3b8 }

    #footer {
      border-top: 1px solid #e2e8f0; padding: 12px 16px;
      display: flex; gap: 8px; align-items: center; background: white;
    }
    #input {
      flex: 1; border: 1.5px solid #e2e8f0; border-radius: 14px;
      padding: 10px 14px; font-size: 13px; outline: none;
      transition: border-color 0.2s, box-shadow 0.2s; resize: none; height: 38px;
      font-family: inherit; line-height: 1.4; color: #1e293b;
    }
    #input:focus { border-color: var(--cp-primary, #6366f1); box-shadow: 0 0 0 3px rgba(99,102,241,0.1) }
    #send-btn {
      width: 36px; height: 36px; border-radius: 10px;
      background: var(--cp-primary, #6366f1); border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      transition: opacity 0.2s, background-color 0.2s;
    }
    #send-btn:hover:not(:disabled) { opacity: 0.95 }
    #send-btn:disabled { opacity: 0.4; cursor: not-allowed }
    #send-btn svg { width: 16px; height: 16px; fill: white }
  `
  shadow.appendChild(style)

  // Chat bubble button
  const bubble = document.createElement('button')
  bubble.id = 'bubble'
  bubble.innerHTML = svgChat()
  shadow.appendChild(bubble)

  // Panel
  const panel = document.createElement('div')
  panel.id = 'panel'
  panel.className = 'hidden'
  panel.innerHTML = `
    <div id="header">
      <div class="avatar">${svgBot()}</div>
      <div class="info">
        <div class="name" id="bot-name">Assistant</div>
        <div class="status-container">
          <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#4ade80"></span>
          <div class="status" id="bot-status">Connecting...</div>
        </div>
      </div>
      <button id="close-btn" title="Close">${svgX()}</button>
    </div>
    <div id="messages"></div>
    <div id="footer">
      <input id="input" placeholder="Type a message..." autocomplete="off" />
      <button id="send-btn">${svgSend()}</button>
    </div>
  `
  shadow.appendChild(panel)

  const messagesEl = shadow.getElementById('messages')
  const inputEl    = shadow.getElementById('input')
  const sendBtn    = shadow.getElementById('send-btn')
  const botNameEl  = shadow.getElementById('bot-name')
  const botStatus  = shadow.getElementById('bot-status')

  // ── 4. Render logic ───────────────────────────────────────────
  function renderMessages() {
    messagesEl.innerHTML = ''
    messages.forEach(({ role, content }) => {
      const wrapper = document.createElement('div')
      wrapper.className = `msg ${role === 'user' ? 'user' : 'bot'}`
      const b = document.createElement('div')
      b.className = 'bubble'
      b.textContent = content
      wrapper.appendChild(b)
      messagesEl.appendChild(wrapper)
    })
    messagesEl.scrollTop = messagesEl.scrollHeight
  }

  function addTypingIndicator() {
    const wrapper = document.createElement('div')
    wrapper.className = 'msg bot'
    wrapper.id = 'typing-indicator'
    const b = document.createElement('div')
    b.className = 'bubble typing'
    b.textContent = '...'
    wrapper.appendChild(b)
    messagesEl.appendChild(wrapper)
    messagesEl.scrollTop = messagesEl.scrollHeight
  }

  function removeTypingIndicator() {
    shadow.getElementById('typing-indicator')?.remove()
  }

  // ── 5. WebSocket connection ───────────────────────────────────
  function connect() {
    const wsUrl = apiBase.replace(/^http/, 'ws') +
      `/ws/chat/${embedToken}?sessionKey=${sessionKey}`
    ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      isConnected = true
      botStatus.textContent = 'Online'
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        handleServerMessage(msg)
      } catch (e) { /* ignore malformed */ }
    }

    ws.onclose = () => {
      isConnected = false
      botStatus.textContent = 'Reconnecting...'
      setTimeout(connect, 3000)
    }

    ws.onerror = () => ws.close()
  }

  function handleServerMessage(msg) {
    if (msg.type === 'message') {
      removeTypingIndicator()
      messages.push({ role: msg.role || 'assistant', content: msg.content })
      renderMessages()
      sendBtn.disabled = false
    } else if (msg.type === 'stream_token') {
      removeTypingIndicator()
      const lastMsg = messages[messages.length - 1]
      if (lastMsg?.role === 'assistant') {
        lastMsg.content += msg.delta
      } else {
        messages.push({ role: 'assistant', content: msg.delta })
      }
      renderMessages()
    } else if (msg.type === 'stream_end') {
      sendBtn.disabled = false
    } else if (msg.type === 'error') {
      removeTypingIndicator()
      messages.push({ role: 'assistant', content: '⚠️ Sorry, something went wrong. Please try again.' })
      renderMessages()
      sendBtn.disabled = false
    }
  }

  // Send message
  function sendMessage(text) {
    if (!text.trim() || !isConnected) return
    messages.push({ role: 'user', content: text })
    renderMessages()
    addTypingIndicator()
    sendBtn.disabled = true

    ws.send(JSON.stringify({ type: 'message', content: text }))
    inputEl.value = ''
  }

  // ── 6. Events ─────────────────────────────────────────────────
  bubble.addEventListener('click', () => {
    isOpen = !isOpen
    panel.classList.toggle('hidden', !isOpen)
    bubble.innerHTML = isOpen ? svgX() : svgChat()
    if (isOpen && !isConnected) connect()
    if (isOpen) setTimeout(() => inputEl.focus(), 100)
  })

  shadow.getElementById('close-btn').addEventListener('click', () => {
    isOpen = false
    panel.classList.add('hidden')
    bubble.innerHTML = svgChat()
  })

  sendBtn.addEventListener('click', () => sendMessage(inputEl.value))

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(inputEl.value)
    }
  })

  // ── 7. Load bot config (colors, name) ────────────────────────
  fetch(`${apiBase}/public/v1/bots/${embedToken}/config`)
    .then((r) => r.ok ? r.json() : null)
    .then((cfg) => {
      if (!cfg) return
      botConfig = cfg
      botNameEl.textContent = cfg.name || 'Assistant'
      const wc = cfg.widgetConfig || {}
      if (wc.primaryColor) {
        shadow.host.style.setProperty('--cp-primary', wc.primaryColor)
      }
    })
    .catch(() => { /* use defaults */ })

  // ── 8. SVG helpers ────────────────────────────────────────────
  function svgChat() {
    return `<svg viewBox="0 0 24 24"><path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z"/></svg>`
  }
  function svgX() {
    return `<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`
  }
  function svgBot() {
    return `<svg viewBox="0 0 24 24"><path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7H3a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2zM7 14a5 5 0 0010 0H7zm0 5h10v2H7v-2z"/></svg>`
  }
  function svgSend() {
    return `<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`
  }
})()
