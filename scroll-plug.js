/**
 * 修學院 FIX COLLEGE - 插頭式滾動進度指示器 (Scroll Plug Indicator)
 * 右側固定一個插頭 ICON，隨滾動拉出一條金色電線，線越長代表越接近頁底。
 * 到底時插頭會發亮閃爍，表示「已充飽 / 已到底」。
 */
(function () {
  // 行動裝置不顯示（螢幕太小會擋到內容）
  if (window.innerWidth < 768) return;

  // ─── 建立 DOM 結構 ───
  const container = document.createElement('div');
  container.id = 'scroll-plug-container';

  // 插頭圖示（SVG 手繪風格電源插頭）
  container.innerHTML = `
    <div id="scroll-plug-icon" title="滾動進度">
      <svg viewBox="0 0 32 80" width="28" height="70" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- 插頭本體 -->
        <rect x="6" y="0" width="20" height="36" rx="4" fill="#1a1a1a" stroke="#F9BD2A" stroke-width="1.5"/>
        <!-- 插頭金屬片左 -->
        <rect x="11" y="36" width="3" height="14" rx="1" fill="#F9BD2A"/>
        <!-- 插頭金屬片右 -->
        <rect x="18" y="36" width="3" height="14" rx="1" fill="#F9BD2A"/>
        <!-- 插頭上方小圓孔（接地） -->
        <circle cx="16" cy="14" r="3" fill="none" stroke="#F9BD2A" stroke-width="1" opacity="0.6"/>
        <!-- 插頭上方裝飾線 -->
        <line x1="10" y1="24" x2="22" y2="24" stroke="#F9BD2A" stroke-width="0.8" opacity="0.4"/>
      </svg>
    </div>
    <div id="scroll-plug-track">
      <div id="scroll-plug-wire"></div>
      <div id="scroll-plug-spark"></div>
    </div>
    <div id="scroll-plug-percent">0%</div>
  `;

  // ─── 注入樣式 ───
  const style = document.createElement('style');
  style.textContent = `
    #scroll-plug-container {
      position: fixed;
      right: 18px;
      top: 50%;
      transform: translateY(-50%);
      z-index: 900;
      display: flex;
      flex-direction: column;
      align-items: center;
      pointer-events: none;
      user-select: none;
      opacity: 0;
      transition: opacity 0.5s ease;
    }
    #scroll-plug-container.visible {
      opacity: 1;
    }
    #scroll-plug-icon {
      position: relative;
      z-index: 2;
      filter: drop-shadow(0 0 4px rgba(249, 189, 42, 0.3));
      transition: filter 0.4s ease, transform 0.3s ease;
    }
    #scroll-plug-icon.charged {
      filter: drop-shadow(0 0 12px rgba(249, 189, 42, 0.9)) drop-shadow(0 0 25px rgba(249, 189, 42, 0.5));
      transform: scale(1.1);
    }
    #scroll-plug-track {
      position: relative;
      width: 2px;
      height: 180px;
      background: rgba(255, 255, 255, 0.06);
      border-radius: 1px;
      overflow: visible;
      margin-top: -2px;
    }
    #scroll-plug-wire {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 0%;
      background: linear-gradient(180deg, #F9BD2A 0%, #c9961e 70%, #F9BD2A 100%);
      border-radius: 1px;
      transition: height 0.15s ease-out;
      box-shadow: 0 0 6px rgba(249, 189, 42, 0.3);
    }
    #scroll-plug-wire.full {
      box-shadow: 0 0 14px rgba(249, 189, 42, 0.7), 0 0 30px rgba(249, 189, 42, 0.3);
    }
    #scroll-plug-spark {
      position: absolute;
      bottom: -6px;
      left: 50%;
      transform: translateX(-50%);
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #F9BD2A;
      opacity: 0;
      transition: opacity 0.3s ease;
      box-shadow: 0 0 8px #F9BD2A, 0 0 20px rgba(249, 189, 42, 0.6);
    }
    #scroll-plug-spark.active {
      opacity: 1;
      animation: spark-pulse 1.2s ease-in-out infinite;
    }
    @keyframes spark-pulse {
      0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.7; }
      50% { transform: translateX(-50%) scale(1.6); opacity: 1; }
    }
    #scroll-plug-percent {
      margin-top: 10px;
      font-family: 'Inter', monospace;
      font-size: 10px;
      font-weight: 700;
      color: rgba(249, 189, 42, 0.5);
      letter-spacing: 0.05em;
      transition: color 0.3s ease;
    }
    #scroll-plug-percent.full {
      color: #F9BD2A;
      text-shadow: 0 0 8px rgba(249, 189, 42, 0.6);
    }
    @media (max-width: 767px) {
      #scroll-plug-container { display: none !important; }
    }
    @media (prefers-reduced-motion: reduce) {
      #scroll-plug-container { display: none !important; }
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(container);

  // ─── 元素快取 ───
  const wire = document.getElementById('scroll-plug-wire');
  const spark = document.getElementById('scroll-plug-spark');
  const icon = document.getElementById('scroll-plug-icon');
  const percent = document.getElementById('scroll-plug-percent');

  // ─── 滾動邏輯 ───
  let ticking = false;

  function updateScrollProgress() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? Math.min(1, Math.max(0, scrollTop / docHeight)) : 0;

    // 延遲顯示（滾動超過 30px 才浮出）
    if (scrollTop > 30) {
      container.classList.add('visible');
    } else {
      container.classList.remove('visible');
    }

    // 更新電線長度
    wire.style.height = (progress * 100) + '%';

    // 更新百分比文字
    percent.innerText = Math.round(progress * 100) + '%';

    // 到底效果（>= 95%）
    if (progress >= 0.95) {
      wire.classList.add('full');
      spark.classList.add('active');
      icon.classList.add('charged');
      percent.classList.add('full');
    } else {
      wire.classList.remove('full');
      spark.classList.remove('active');
      icon.classList.remove('charged');
      percent.classList.remove('full');
    }

    // 將火花定位在電線尾端
    spark.style.top = (progress * 180 - 4) + 'px';

    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateScrollProgress);
      ticking = true;
    }
  }, { passive: true });

  // 初始化
  updateScrollProgress();
})();
