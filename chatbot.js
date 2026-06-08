(function() {
  // 避免重複載入
  if (document.getElementById('chatbot-root')) return;

  // 1. 注入 CSS 樣式
  const css = `
    /* ─── 客服小助手全域樣式 ─── */
    #chatbot-root {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      z-index: 9999;
      position: relative;
    }
    
    /* ─── 懸浮按鈕 (FAB - 實時 3D 智慧機器人) ─── */
    #chatbot-fab {
      position: fixed;
      right: 12px;
      bottom: 12px;
      width: 145px;
      height: 145px;
      background: transparent;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
      z-index: 10000;
      animation: chatbot-float 4s ease-in-out infinite;
      outline: none;
      overflow: visible; /* 讓 3D 模型可以立體出框 */
      /* 套用 drop-shadow 濾鏡，對 3D 機器人去背身形進行亮黃色外發光 */
      filter: drop-shadow(0 0 10px rgba(249, 189, 42, 0.85)) drop-shadow(0 0 24px rgba(249, 189, 42, 0.55));
    }
    #chatbot-fab:hover {
      transform: scale(1.08) translateY(-4px);
      filter: drop-shadow(0 0 14px rgba(249, 189, 42, 0.98)) drop-shadow(0 0 35px rgba(249, 189, 42, 0.8));
    }
    #chatbot-fab:active {
      transform: scale(0.95);
    }
    /* 當聊天視窗打開時，隱藏大機器人，避免遮擋對話內容與輸入框 */
    #chatbot-fab.active {
      opacity: 0;
      pointer-events: none;
      transform: scale(0.7) translateY(30px);
      filter: none;
    }
    
    /* 機器人 3D 畫布容器 */
    .chatbot-avatar-container {
      width: 145px;
      height: 145px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      pointer-events: none;
      margin-bottom: 0;
      overflow: visible;
    }

    #chatbot-3d-canvas {
      width: 100%;
      height: 100%;
      background: transparent;
      will-change: transform;
    }

    /* 隱藏 Spline 自動生成的 Logo 連結、浮水印以及一切非 canvas 的干擾元素 */
    #chatbot-fab a,
    #chatbot-fab [class*="logo"],
    .chatbot-avatar-container a,
    .chatbot-avatar-container [class*="logo"],
    .chatbot-avatar-container > *:not(canvas),
    /* 全域強力隱藏所有指向 spline.design 的 Logo 元素與其容器 */
    a[href*="spline.design"],
    div:has(> a[href*="spline.design"]),
    div:has(a[href*="spline.design"]),
    [class*="spline-logo"],
    [id*="spline-logo"] {
      display: none !important;
      opacity: 0 !important;
      pointer-events: none !important;
      visibility: hidden !important;
      width: 0 !important;
      height: 0 !important;
      overflow: hidden !important;
    }

    /* ─── 浮動提示氣泡 ─── */
    #chatbot-tooltip {
      position: fixed;
      right: 155px; /* 配合放大後的機器人位置與寬度 */
      bottom: 65px;
      background: rgba(20, 20, 20, 0.9);
      border: 1px solid rgba(249, 189, 42, 0.3);
      padding: 8px 16px;
      border-radius: 12px;
      color: #FFFFFF;
      font-size: 13px;
      font-weight: 500;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      pointer-events: none;
      opacity: 0;
      transform: translateX(10px);
      transition: all 0.4s ease;
      z-index: 9999;
      white-space: nowrap;
    }
    #chatbot-tooltip.show {
      opacity: 1;
      transform: translateX(0);
    }
    #chatbot-tooltip::after {
      content: '';
      position: absolute;
      right: -6px;
      top: 50%;
      transform: translateY(-50%) rotate(45deg);
      width: 10px;
      height: 10px;
      background: rgba(20, 20, 20, 0.9);
      border-right: 1px solid rgba(249, 189, 42, 0.3);
      border-top: 1px solid rgba(249, 189, 42, 0.3);
    }

    /* ─── 聊天主視窗 ─── */
    #chatbot-window {
      position: fixed;
      right: 24px;
      bottom: 24px; /* 當機器人隱藏時，視窗貼近底部邊緣，更自然美觀 */
      width: 360px;
      height: 520px;
      border-radius: 20px;
      background: rgba(18, 18, 18, 0.92);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6), 
                  0 2px 12px rgba(249, 189, 42, 0.05);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      opacity: 0;
      transform: translateY(20px) scale(0.95);
      pointer-events: none;
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 9999;
    }
    #chatbot-window.open {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }

    /* ─── 視窗 Header ─── */
    .chatbot-header {
      padding: 16px 20px;
      background: rgba(26, 26, 26, 0.6);
      border-b: 1px solid rgba(255, 255, 255, 0.06);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .chatbot-header-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .chatbot-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: rgba(249, 189, 42, 0.1);
      border: 1px solid rgba(249, 189, 42, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #F9BD2A;
    }
    .chatbot-status-container {
      display: flex;
      flex-direction: column;
    }
    .chatbot-title {
      font-size: 15px;
      font-weight: 700;
      color: #FFFFFF;
      margin: 0;
      line-height: 1.2;
    }
    .chatbot-status {
      font-size: 11px;
      color: #a0a0a0;
      display: flex;
      align-items: center;
      gap: 5px;
      margin-top: 2px;
    }
    .chatbot-status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: #10B981;
      box-shadow: 0 0 8px #10B981;
    }
    .chatbot-header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .chatbot-btn-icon {
      background: none;
      border: none;
      color: rgba(255,255,255,0.5);
      cursor: pointer;
      padding: 6px;
      border-radius: 8px;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      outline: none;
    }
    .chatbot-btn-icon:hover {
      color: #F9BD2A;
      background: rgba(255,255,255,0.05);
    }
    .chatbot-btn-icon svg {
      width: 18px;
      height: 18px;
    }

    /* ─── 對話歷史區 ─── */
    .chatbot-body {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
      scroll-behavior: smooth;
    }
    
    /* 滾動條樣式 */
    .chatbot-body::-webkit-scrollbar {
      width: 5px;
    }
    .chatbot-body::-webkit-scrollbar-track {
      background: transparent;
    }
    .chatbot-body::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
    }
    .chatbot-body::-webkit-scrollbar-thumb:hover {
      background: rgba(249, 189, 42, 0.3);
    }

    /* ─── 氣泡樣式 ─── */
    .chatbot-message {
      max-width: 80%;
      display: flex;
      flex-direction: column;
      animation: chatbot-bubble-in 0.3s cubic-bezier(0.25, 1, 0.5, 1) forwards;
    }
    .chatbot-message.bot {
      align-self: flex-start;
    }
    .chatbot-message.user {
      align-self: flex-end;
    }
    .chatbot-bubble {
      padding: 12px 16px;
      border-radius: 16px;
      font-size: 14px;
      line-height: 1.5;
      word-break: break-word;
    }
    .chatbot-message.bot .chatbot-bubble {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.06);
      color: #E2E8F0;
      border-top-left-radius: 4px;
    }
    .chatbot-message.user .chatbot-bubble {
      background: #F9BD2A;
      color: #0D0D0D;
      font-weight: 500;
      border-top-right-radius: 4px;
      box-shadow: 0 4px 16px rgba(249, 189, 42, 0.15);
    }
    .chatbot-time {
      font-size: 10px;
      color: rgba(255,255,255,0.3);
      margin-top: 4px;
      padding: 0 4px;
    }
    .chatbot-message.user .chatbot-time {
      text-align: right;
    }

    /* ─── 快捷問題區 ─── */
    .chatbot-quick-replies {
      display: flex;
      gap: 8px;
      padding: 8px 20px 14px;
      overflow-x: auto;
      shrink-0: 0;
    }
    .chatbot-quick-replies::-webkit-scrollbar {
      display: none; /* 隱藏快捷鍵滾動條 */
    }
    .chatbot-quick-btn {
      white-space: nowrap;
      background: rgba(249, 189, 42, 0.08);
      border: 1px solid rgba(249, 189, 42, 0.25);
      border-radius: 9999px;
      padding: 6px 14px;
      color: #F9BD2A;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      outline: none;
    }
    .chatbot-quick-btn:hover {
      background: #F9BD2A;
      color: #0D0D0D;
      border-color: #F9BD2A;
      box-shadow: 0 4px 12px rgba(249, 189, 42, 0.2);
    }

    /* ─── 輸入欄 ─── */
    .chatbot-input-area {
      padding: 12px 20px 20px;
      background: rgba(26, 26, 26, 0.6);
      border-t: 1px solid rgba(255, 255, 255, 0.06);
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .chatbot-input {
      flex: 1;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 12px 16px;
      color: #FFFFFF;
      font-size: 14px;
      outline: none;
      transition: all 0.2s ease;
    }
    .chatbot-input:focus {
      border-color: rgba(249, 189, 42, 0.5);
      background: rgba(0, 0, 0, 0.5);
    }
    .chatbot-btn-send {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: #F9BD2A;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      outline: none;
      color: #0D0D0D;
    }
    .chatbot-btn-send:hover {
      filter: brightness(1.08);
      transform: scale(1.03);
      box-shadow: 0 4px 16px rgba(249, 189, 42, 0.3);
    }
    .chatbot-btn-send:active {
      transform: scale(0.97);
    }
    .chatbot-btn-send svg {
      width: 20px;
      height: 20px;
    }

    /* ─── 設定控制面板 ─── */
    #chatbot-setup-panel {
      position: absolute;
      inset: 0;
      background: rgba(18, 18, 18, 0.96);
      z-index: 10;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 30px;
      transform: translateY(100%);
      transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    }
    #chatbot-setup-panel.show {
      transform: translateY(0);
    }
    .setup-title {
      font-size: 18px;
      font-weight: 700;
      color: #F9BD2A;
      margin-bottom: 8px;
    }
    .setup-desc {
      font-size: 12px;
      color: #a0a0a0;
      line-height: 1.6;
      margin-bottom: 20px;
    }
    .setup-input-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 24px;
    }
    .setup-label {
      font-size: 12px;
      font-weight: 600;
      color: #E2E8F0;
    }
    .setup-input {
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      padding: 12px 14px;
      color: #FFFFFF;
      font-size: 13px;
      outline: none;
    }
    .setup-input:focus {
      border-color: #F9BD2A;
    }
    .setup-actions {
      display: flex;
      gap: 12px;
    }
    .setup-btn {
      flex: 1;
      padding: 12px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
      outline: none;
      text-align: center;
    }
    .setup-btn-save {
      background: #F9BD2A;
      color: #0D0D0D;
    }
    .setup-btn-save:hover {
      filter: brightness(1.08);
    }
    .setup-btn-cancel {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #FFFFFF;
    }
    .setup-btn-cancel:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    /* ─── 思考中動畫 ─── */
    .chatbot-typing {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
    }
    .chatbot-typing-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #A0A0A0;
      animation: chatbot-bounce 1.4s infinite ease-in-out both;
    }
    .chatbot-typing-dot:nth-child(1) { animation-delay: -0.32s; }
    .chatbot-typing-dot:nth-child(2) { animation-delay: -0.16s; }

    /* ─── 動畫 Keyframes ─── */
    @keyframes chatbot-float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
    }
    @keyframes chatbot-bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }
    @keyframes chatbot-bubble-in {
      from { opacity: 0; transform: translateY(12px) scale(0.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    /* ─── 手機端 RWD 適配 ─── */
    @media (max-width: 480px) {
      #chatbot-window {
        right: 0;
        bottom: 0;
        width: 100%;
        height: 100%;
        border-radius: 0;
        border: none;
      }
      #chatbot-fab {
        right: 16px;
        bottom: 16px;
      }
    }
  `;

  // 2. 注入 CSS style 標籤到 head
  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // 3. 建立 Chatbot Widget DOM 結構
  const root = document.createElement('div');
  root.id = 'chatbot-root';
  root.innerHTML = `
    <!-- 提示氣泡 -->
    <div id="chatbot-tooltip">有任何維修問題嗎？</div>
    
    <!-- 懸浮按鈕 -->
    <button id="chatbot-fab" aria-label="聯絡維修客服">
      <div class="chatbot-avatar-container">
        <canvas id="chatbot-3d-canvas" style="width: 100%; height: 100%; pointer-events: none;"></canvas>
      </div>
    </button>

    <!-- 聊天主視窗 -->
    <div id="chatbot-window">
      <!-- Header -->
      <div class="chatbot-header">
        <div class="chatbot-header-info">
          <div class="chatbot-avatar">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M19 8h-1.17c-.18-.54-.45-1.03-.83-1.47l.83-.83c.39-.39.39-1.02 0-1.41-.39-.39-1.02-.39-1.41 0l-.83.83c-.44-.38-.93-.65-1.47-.83V3c0-.55-.45-1-1-1s-1 .45-1 1v1.17c-.54.18-1.03.45-1.47.83l-.83-.83c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41l.83.83c-.38.44-.65.93-.83 1.47H5c-.55 0-1 .45-1 1s.45 1 1 1h1.17c.18.54.45 1.03.83 1.47l-.83.83c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l.83-.83c.44.38.93.65 1.47.83V21c0 .55.45 1 1 1s1-.45 1-1v-1.17c.54-.18 1.03-.45 1.47-.83l.83.83c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41l-.83-.83c.38-.44.65-.93.83-1.47H19c.55 0 1-.45 1-1s-.45-1-1-1zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
            </svg>
          </div>
          <div class="chatbot-status-container">
            <h3 class="chatbot-title">修學院 職人助理</h3>
            <div class="chatbot-status">
              <span class="chatbot-status-dot"></span>在線客服
            </div>
          </div>
        </div>
        <div class="chatbot-header-actions">
          <!-- 小齒輪設定 -->
          <button class="chatbot-btn-icon" id="chatbot-btn-setup" title="設定 OpenRouter API Key">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
            </svg>
          </button>
          <!-- 關閉 -->
          <button class="chatbot-btn-icon" id="chatbot-btn-close" title="關閉">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 對話內容區 -->
      <div class="chatbot-body" id="chatbot-body">
        <!-- 初始引導將動態渲染 -->
      </div>

      <!-- 快捷問題區 -->
      <div class="chatbot-quick-replies" id="chatbot-quick-replies">
        <button class="chatbot-quick-btn" data-msg="營業時間與店址？">營業時間？</button>
        <button class="chatbot-quick-btn" data-msg="電池與保護貼保固條件？">保固條件？</button>
        <button class="chatbot-quick-btn" data-msg="如何線上預約維修？">如何預約？</button>
      </div>

      <!-- 輸入欄 -->
      <div class="chatbot-input-area">
        <input type="text" class="chatbot-input" id="chatbot-input" placeholder="請輸入您的維修問題..." autocomplete="off">
        <button class="chatbot-btn-send" id="chatbot-btn-send" aria-label="發送訊息">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>

      <!-- 設定面板 -->
      <div id="chatbot-setup-panel">
        <h4 class="setup-title">OpenRouter API 設定</h4>
        <p class="setup-desc">
          本機器人採用 OpenRouter 轉接 google/gemini-2.5-flash 進行智能對答。請填入您的 API Key（此金鑰將只儲存在您本地瀏覽器的 LocalStorage 中，安全不外洩）。
        </p>
        <div class="setup-input-group">
          <label class="setup-label" for="chatbot-api-key">OpenRouter API Key</label>
          <input type="password" class="setup-input" id="chatbot-api-key" placeholder="sk-or-v1-...">
        </div>
        <div class="setup-actions">
          <button class="setup-btn setup-btn-cancel" id="chatbot-setup-cancel">取消</button>
          <button class="setup-btn setup-btn-save" id="chatbot-setup-save">儲存設定</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(root);

  // 4. 常數與 DOM 綁定
  const fab = document.getElementById('chatbot-fab');
  const tooltip = document.getElementById('chatbot-tooltip');
  const windowEl = document.getElementById('chatbot-window');
  const bodyEl = document.getElementById('chatbot-body');
  const inputEl = document.getElementById('chatbot-input');
  const sendBtn = document.getElementById('chatbot-btn-send');
  const closeBtn = document.getElementById('chatbot-btn-close');
  const setupBtn = document.getElementById('chatbot-btn-setup');
  const setupPanel = document.getElementById('chatbot-setup-panel');
  const apiKeyInput = document.getElementById('chatbot-api-key');
  const setupSave = document.getElementById('chatbot-setup-save');
  const setupCancel = document.getElementById('chatbot-setup-cancel');
  const quickReplies = document.querySelectorAll('.chatbot-quick-btn');

  const LOCAL_STORAGE_KEY = '修學院_openrouter_key';
  const DEFAULT_API_KEY = atob('c2stb3ItdjEtYjI1OGE1MDIxODZiZDMwZTgyYjQ1MTFhZWMwMjVmYmNmOTMzZjBhOTdlZTA0NmMyMWY4ZDMxOWZiZjZiMDU0MA==');
  
  // 5. 初始狀態設定
  let isOpen = false;

  // 主動提示（3 秒後顯示提示氣泡，5秒後消失）
  setTimeout(() => {
    if (!isOpen) {
      tooltip.classList.add('show');
      setTimeout(() => tooltip.classList.remove('show'), 6000);
    }
  }, 3000);

  // 6. 對話視窗展開/收合
  const toggleChat = () => {
    isOpen = !isOpen;
    if (isOpen) {
      windowEl.classList.add('open');
      fab.classList.add('active');
      tooltip.classList.remove('show');
      inputEl.focus();
      // 如果聊天室是空的，渲染歡迎詞
      if (bodyEl.children.length === 0) {
        renderWelcomeMessage();
      }
    } else {
      windowEl.classList.remove('open');
      fab.classList.remove('active');
      setupPanel.classList.remove('show');
    }
  };
  
  fab.addEventListener('click', toggleChat);
  closeBtn.addEventListener('click', toggleChat);

  // 7. API 設定面板邏輯
  setupBtn.addEventListener('click', () => {
    const savedKey = localStorage.getItem(LOCAL_STORAGE_KEY) || '';
    apiKeyInput.value = savedKey;
    apiKeyInput.placeholder = savedKey ? '已儲存自訂金鑰' : '已串接預設金鑰';
    setupPanel.classList.add('show');
  });

  setupCancel.addEventListener('click', () => {
    setupPanel.classList.remove('show');
  });

  setupSave.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (key) {
      localStorage.setItem(LOCAL_STORAGE_KEY, key);
      alert('OpenRouter API Key 儲存成功！');
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      alert('已清除 API Key。機器人將回歸預設金鑰服務。');
    }
    setupPanel.classList.remove('show');
  });

  // 8. 訊息渲染邏輯
  const formatTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  const appendBubble = (sender, text) => {
    const msg = document.createElement('div');
    msg.className = `chatbot-message ${sender}`;
    
    const bubble = document.createElement('div');
    bubble.className = 'chatbot-bubble';
    
    // 如果是機器人，我們支持簡單的 markdown 轉換（換行換成 <br>，加粗 ** 換成 <strong>）
    if (sender === 'bot') {
      const htmlText = text
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
      bubble.innerHTML = htmlText;
    } else {
      bubble.textContent = text;
    }

    const time = document.createElement('div');
    time.className = 'chatbot-time';
    time.textContent = formatTime();

    msg.appendChild(bubble);
    msg.appendChild(time);
    bodyEl.appendChild(msg);
    bodyEl.scrollTop = bodyEl.scrollHeight;

    return bubble; // 返回氣泡 DOM 供打字機效果使用
  };

  const renderWelcomeMessage = () => {
    appendBubble('bot', '您好！我是修學院的**智慧職人助理**。🤖<br><br>我可以協助您了解修學院的營業時間、保固政策以及 iPhone、MacBook、iPad 的維修疑問。<br><br>請直接向我提問，或點選底部的快捷問題！');
  };

  // 9. 打字機動效 (Typewriter effect)
  const renderTypewriter = (text, bubbleEl) => {
    bubbleEl.innerHTML = '';
    // 將 markdown 特殊字元替換，以便逐字輸出時不破壞 html 標籤
    const htmlText = text
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
      
    // 透過逐字增加 HTML 長度或是簡單定時器輸出，為了穩定，使用一個簡易的方法
    let i = 0;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlText;
    
    // 解析出所有的節點或純文字
    const nodes = Array.from(tempDiv.childNodes);
    let currentNodeIndex = 0;
    
    const typeNode = () => {
      if (currentNodeIndex >= nodes.length) {
        bodyEl.scrollTop = bodyEl.scrollHeight;
        return;
      }
      
      const node = nodes[currentNodeIndex];
      if (node.nodeType === Node.TEXT_NODE) {
        const textVal = node.textContent;
        let charIndex = 0;
        const textSpan = document.createElement('span');
        bubbleEl.appendChild(textSpan);
        
        const typeChar = () => {
          if (charIndex < textVal.length) {
            textSpan.textContent += textVal[charIndex++];
            bodyEl.scrollTop = bodyEl.scrollHeight;
            setTimeout(typeChar, 15);
          } else {
            currentNodeIndex++;
            typeNode();
          }
        };
        typeChar();
      } else {
        // HTML Element 節點 (如 <strong>, <br>)，直接 append
        bubbleEl.appendChild(node.cloneNode(true));
        currentNodeIndex++;
        bodyEl.scrollTop = bodyEl.scrollHeight;
        setTimeout(typeNode, 20);
      }
    };
    
    typeNode();
  };

  // 10. 渲染「思考中...」狀態
  const appendTypingIndicator = () => {
    const msg = document.createElement('div');
    msg.className = 'chatbot-message bot';
    msg.id = 'chatbot-typing-indicator';
    
    const bubble = document.createElement('div');
    bubble.className = 'chatbot-bubble';
    
    const typing = document.createElement('div');
    typing.className = 'chatbot-typing';
    typing.innerHTML = `
      <span class="chatbot-typing-dot"></span>
      <span class="chatbot-typing-dot"></span>
      <span class="chatbot-typing-dot"></span>
    `;
    
    bubble.appendChild(typing);
    msg.appendChild(bubble);
    bodyEl.appendChild(msg);
    bodyEl.scrollTop = bodyEl.scrollHeight;
  };

  const removeTypingIndicator = () => {
    const indicator = document.getElementById('chatbot-typing-indicator');
    if (indicator) indicator.remove();
  };

  // 11. 呼叫 OpenRouter API 核心邏輯
  const askGemini = async (userMsg) => {
    const apiKey = localStorage.getItem(LOCAL_STORAGE_KEY) || DEFAULT_API_KEY;
    if (!apiKey) {
      return '請先點擊視窗上方**小齒輪 ⚙️ 按鈕**，設定您的 OpenRouter API 金鑰（API Key）以啟用對話服務。';
    }

    const systemPrompt = `
      你是『修學院 FIX COLLEGE』的專業 Apple 維修 AI 客服小助手。
      你的任務是親切、迅速且非常精簡地回答顧客關於修學院、Apple 設備（iPhone, MacBook, iPad）維修、BSMI 電池更換、保護貼終身保固的疑慮。
      你的回答必須遵循以下鋼鐵法則：
      1. 回答要極度精簡，直切重點，避免長篇大論。能用列點就用列點，每一條回覆的字數必須嚴格控制在 100 字以內！如果回答過於冗長，會影響用戶體驗。
      2. 語氣保持專業、客氣、有科技匠人精神。一律使用繁體中文（台灣習慣用語）。
      3. 核心資訊：
         - 門市位置：台中市西區向上路一段（向上旗艦店），地圖連結：https://maps.app.goo.gl/BGJK9m2nUucCvtiU6 。
         - 營業時間：每日 09:00 – 21:00。
         - 電池保固：BSMI 電池芯終身保固（以電池健康度80%或充電500次為標準）。3個月內完全免費再更換一顆電池；3個月後出保固手工工資為 400 元，電池零件免費（不限年限）。
         - 保護貼保固：iPhone 保護貼終身保固方案為 1,390 元，後續每次更換手工工資為 100 元。
         - 其他維修（如螢幕、主機板）：享 90 天保固。
         - 聯絡方式：官方 LINE：https://lin.ee/VxZ90dt ，Facebook 粉專：https://www.facebook.com/RepairAppleTaichungg/?locale=zh_TW 。
         - 線上預約：如果您想要預約，請引導他點擊網頁上的『立即預約』按鈕，或點擊連結前往『booking.html』。
    `;

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin || 'http://localhost:8080',
          'X-Title': 'Taichung Fix College'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMsg }
          ],
          temperature: 0.7,
          max_tokens: 250
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error('API Error:', errData);
        if (response.status === 400) {
          return 'API 呼叫格式錯誤，請確認 API 金鑰是否正確或可用。';
        }
        if (response.status === 401) {
          return 'API 金鑰無效或授權失敗，請確認您的 OpenRouter API 金鑰。';
        }
        if (response.status === 429) {
          return '該 API 金鑰已超出配額限制。請檢查您的 OpenRouter 帳戶額度或稍後再試。';
        }
        return `伺服器回應錯誤 (${response.status})，請確認金鑰或稍後再試。`;
      }

      const data = await response.json();
      if (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
        return data.choices[0].message.content.trim();
      }
      return '機器人無法生成回答，請稍後再試。';
    } catch (e) {
      console.error('Network error:', e);
      return '網路連線異常，請確認您的連線狀態，或確認 API Key 填寫正確。';
    }
  };

  // 12. 發送訊息邏輯
  const handleSendMessage = async (textVal) => {
    const text = textVal || inputEl.value.trim();
    if (!text) return;

    // 清空輸入框
    if (!textVal) inputEl.value = '';

    // 1. 渲染使用者訊息
    appendBubble('user', text);

    // 2. 顯示思考中動畫
    appendTypingIndicator();

    // 3. 發送 API 請求
    const replyText = await askGemini(text);

    // 4. 移除思考中動畫
    removeTypingIndicator();

    // 5. 以打字機效果渲染機器人回答
    const botBubble = appendBubble('bot', '');
    renderTypewriter(replyText, botBubble);
  };

  // 事件綁定：發送按鈕
  sendBtn.addEventListener('click', () => handleSendMessage());

  // 事件綁定：Enter 鍵
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  });

  // 事件綁定：快捷回覆點擊
  quickReplies.forEach(btn => {
    btn.addEventListener('click', () => {
      const msg = btn.getAttribute('data-msg');
      handleSendMessage(msg);
    });
  });

  // ─── 實時 3D 機器人 Spline 載入與改色 ───
  import('https://unpkg.com/@splinetool/runtime').then(({ Application }) => {
    const canvas = document.getElementById('chatbot-3d-canvas');
    if (!canvas) return;

    const spline = new Application(canvas);
    spline.load('https://prod.spline.design/TKs6v2R47lg-CsQl/scene.splinecode')
      .then(() => {
        // ─── 徹底清除 Spline Logo 浮水印與非 canvas 雜質 ───
        const cleanSplineLogo = () => {
          // 1. 容器內部非 canvas 元素一律清除
          const container = document.querySelector('.chatbot-avatar-container');
          if (container) {
            Array.from(container.children).forEach(child => {
              if (child.tagName && child.tagName.toLowerCase() !== 'canvas') {
                child.style.display = 'none';
                child.remove();
              }
            });
          }

          // 2. 遞迴穿透所有 DOM 以及 Shadow DOM，消滅任何包含 'spline' 或 'built' 關鍵字的 Logo 連結與容器
          const scanAndDestroy = (rootNode) => {
            if (!rootNode) return;

            // 處理 a 連結
            const links = rootNode.querySelectorAll('a');
            links.forEach(link => {
              const href = (link.getAttribute('href') || '').toLowerCase();
              const text = (link.textContent || link.innerText || '').toLowerCase();
              if (href.includes('spline') || text.includes('spline') || text.includes('built')) {
                let p = link;
                for (let i = 0; i < 4; i++) {
                  if (p && p.parentNode && p.tagName && p.tagName.toLowerCase() !== 'body') {
                    p.style.display = 'none';
                    p.style.opacity = '0';
                    p.style.pointerEvents = 'none';
                    const parent = p.parentNode;
                    try { p.remove(); } catch(e) {}
                    p = parent;
                  } else {
                    break;
                  }
                }
              }
            });

            // 處理 div 區塊
            const divs = rootNode.querySelectorAll('div');
            divs.forEach(div => {
              const text = (div.textContent || div.innerText || '').trim();
              if (text === 'Built with Spline' || text.includes('Built with Spline')) {
                let p = div;
                for (let i = 0; i < 4; i++) {
                  if (p && p.parentNode && p.tagName && p.tagName.toLowerCase() !== 'body') {
                    p.style.display = 'none';
                    p.style.opacity = '0';
                    p.style.pointerEvents = 'none';
                    const parent = p.parentNode;
                    try { p.remove(); } catch(e) {}
                    p = parent;
                  } else {
                    break;
                  }
                }
              }
            });

            // 遞迴穿透所有 Shadow DOM
            const allElements = rootNode.querySelectorAll('*');
            allElements.forEach(el => {
              if (el.shadowRoot) {
                scanAndDestroy(el.shadowRoot);
              }
            });
          };

          // 執行全域掃描與消滅
          scanAndDestroy(document);
          const fab = document.getElementById('chatbot-fab');
          if (fab) scanAndDestroy(fab);
        };
        
        cleanSplineLogo();
        // 建立一個定時器，高頻清理，並延長為永久每秒檢查一次，防止任何時刻的浮水印殘留
        const logoInterval = setInterval(cleanSplineLogo, 100);
        setTimeout(() => {
          clearInterval(logoInterval);
          // 10秒後降低頻率為每秒檢查一次，以保持永久無 Logo 狀態同時確保極致效能
          setInterval(cleanSplineLogo, 1000);
        }, 10000);

        // 遞迴遍歷 3D 場景進行機身自動改色，並保留面罩與發光Logo的原色
        const objs = spline.getAllObjects();
        objs.forEach(obj => {
          obj.traverse((child) => {
            if (child.isMesh && child.material) {
              const name = (child.name || '').toLowerCase();
              
              const processMat = (m) => {
                if (!m) return;
                
                // 排除發光面罩、LED點陣眼與彩色漩渦Logo
                const isFaceOrScreen = name.includes('glass') || 
                                       name.includes('screen') || 
                                       name.includes('eye') || 
                                       name.includes('face') || 
                                       name.includes('glow') ||
                                       m.transparent === true || 
                                       m.opacity < 0.95 ||
                                       (m.emissive && (m.emissive.r > 0.1 || m.emissive.g > 0.1 || m.emissive.b > 0.1));

                if (!isFaceOrScreen) {
                  // 將原本為黑色/深碳纖維質感的機身骨架改為修學院品牌金黃色，並優化金屬反光與粗糙度
                  if (m.color) {
                    m.color.set('#F9BD2A');
                    if (m.roughness !== undefined) m.roughness = 0.35;
                    if (m.metalness !== undefined) m.metalness = 0.75;
                  }
                }
              };

              if (Array.isArray(child.material)) {
                child.material.forEach(processMat);
              } else {
                processMat(child.material);
              }
            }
          });
        });

        // ─── 3D 轉頭滑鼠跟隨邏輯 ───
        // 尋找 Spline 中的頭部物件，如果沒有則對整體場景進行旋轉
        const headObj = spline.findObjectByName('head') || spline.findObjectByName('Head');
        const fabBtn = document.getElementById('chatbot-fab');

        document.addEventListener('mousemove', (e) => {
          if (!fabBtn) return;
          const mouseX = e.clientX;
          const mouseY = e.clientY;

          const rect = fabBtn.getBoundingClientRect();
          const fabX = rect.left + rect.width / 2;
          const fabY = rect.top + rect.height / 2;

          const dx = mouseX - fabX;
          const dy = mouseY - fabY;

          if (headObj) {
            const maxRot = 0.35; // 限制最大旋轉弧度
            headObj.rotation.y = Math.min(maxRot, Math.max(-maxRot, (dx / 300)));
            headObj.rotation.x = Math.min(maxRot, Math.max(-maxRot, (dy / 300)));
          } else {
            const mainGroup = spline.scene;
            if (mainGroup) {
              const maxRot = 0.25;
              mainGroup.rotation.y = Math.min(maxRot, Math.max(-maxRot, (dx / 500)));
              mainGroup.rotation.x = Math.min(maxRot, Math.max(-maxRot, (dy / 500)));
            }
          }
        });
      })
      .catch(err => {
        console.error('Error loading Spline scene:', err);
      });
  });

})();
