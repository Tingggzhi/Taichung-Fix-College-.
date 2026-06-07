/**
 * 修學院 FIX COLLEGE - 高效能視差滾動 (Parallax Scrolling) 系統
 * 採用 GPU 3D 加速渲染，支援 IntersectionObserver 進行效能優化，並提供優雅的無障礙降級
 */
document.addEventListener('DOMContentLoaded', () => {
  // 偵測是否開啟減少動態效果 (Accessibility)
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    console.log('Parallax: 偵測到減少動態效果設定，已自動停用視差滾動。');
    return;
  }

  const parallaxItems = [];
  const elements = document.querySelectorAll('.parallax-bg, .parallax-item');

  if (elements.length === 0) return;

  // 初始化每個視差元素的位置與設定
  elements.forEach((el) => {
    const speed = parseFloat(el.getAttribute('data-parallax-speed')) ?? 0.15; // 視差速度，預設為 0.15
    const direction = el.getAttribute('data-parallax-direction') || 'vertical'; // vertical, horizontal, zoom
    const zoomMin = parseFloat(el.getAttribute('data-parallax-zoom-min')) || 1.0;
    const zoomMax = parseFloat(el.getAttribute('data-parallax-zoom-max')) || 1.15;
    
    // 設定硬體加速提示，並為背景元件進行必要的樣式修正 (如溢出隱藏)
    el.style.willChange = 'transform';
    
    // 如果是背景視差類型，確保其父層容器有剪裁溢出 (overflow: hidden)，避免圖片平移時穿幫
    if (el.classList.contains('parallax-bg')) {
      const parent = el.parentElement;
      if (parent) {
        parent.style.overflow = 'hidden';
        // 如果父層沒設定 position，給予相對定位以利絕對定位的背景圖運作
        const parentStyle = window.getComputedStyle(parent);
        if (parentStyle.position === 'static') {
          parent.style.position = 'relative';
        }
      }
    }
    
    parallaxItems.push({
      element: el,
      speed: speed,
      direction: direction,
      zoomMin: zoomMin,
      zoomMax: zoomMax,
      rect: null, // 用來快取相對於頁面的位置資訊
      inView: false
    });
  });

  // 使用 IntersectionObserver 監聽元素是否在視窗內，只有在視窗內時才進行滾動計算
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const item = parallaxItems.find(i => i.element === entry.target);
      if (item) {
        item.inView = entry.isIntersecting;
        if (entry.isIntersecting) {
          // 當進入視窗時，更新 Rect 快取
          updateItemRect(item);
        }
      }
    });
  }, {
    root: null,
    threshold: 0,
    rootMargin: '100px 0px 100px 0px' // 上下擴展 100px 提前載入，避免邊緣閃動
  });

  parallaxItems.forEach(item => observer.observe(item.element));

  // 更新元素相對於視窗的絕對位置資訊
  function updateItemRect(item) {
    const rect = item.element.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    
    // 如果元素高度為 0（可能尚未加載完成），則稍後重新獲取
    if (rect.height === 0) {
      setTimeout(() => updateItemRect(item), 100);
      return;
    }

    item.rect = {
      top: rect.top + scrollTop,
      height: rect.height,
      center: rect.top + scrollTop + rect.height / 2
    };
  }

  // 當視窗縮放或資源完全加載後，重新計算所有元素的位置
  const refreshRects = () => {
    parallaxItems.forEach(item => updateItemRect(item));
  };
  window.addEventListener('resize', refreshRects);
  window.addEventListener('load', refreshRects);

  // 核心渲染迴圈 (使用 RequestAnimationFrame)
  let ticking = false;

  function updateParallax() {
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const viewportHeight = window.innerHeight;
    const scrollCenter = scrollY + viewportHeight / 2;

    parallaxItems.forEach(item => {
      // 只有在視窗內且 rect 計算完成時才處理
      if (!item.inView || !item.rect) return;

      // 計算元素相對於視窗中央的偏移百分比 (-1 到 1)
      const elementCenter = item.rect.center;
      const distanceFromCenter = scrollCenter - elementCenter;
      // 計算最大可滾動範圍距離
      const maxDistance = (viewportHeight + item.rect.height) / 2;
      const progress = Math.max(-1, Math.min(1, distanceFromCenter / maxDistance));

      // 計算偏移量
      let transformStr = '';
      const isBg = item.element.classList.contains('parallax-bg');

      if (item.direction === 'vertical') {
        const yOffset = progress * (viewportHeight * item.speed * 0.5);
        // 背景視差為防止邊緣露出，預設加上 scale 放大
        const scaleStr = isBg ? ' scale(1.15)' : '';
        transformStr = `translate3d(0, ${yOffset}px, 0)${scaleStr}`;
      } else if (item.direction === 'horizontal') {
        const xOffset = progress * (viewportHeight * item.speed * 0.5);
        const scaleStr = isBg ? ' scale(1.15)' : '';
        transformStr = `translate3d(${xOffset}px, 0, 0)${scaleStr}`;
      } else if (item.direction === 'zoom') {
        const scaleRange = item.zoomMax - item.zoomMin;
        // 接近畫面中央 (progress 趨近 0) 時放大，邊緣時縮小
        const factor = 1 - Math.abs(progress);
        const scale = item.zoomMin + (factor * scaleRange);
        transformStr = `scale3d(${scale}, ${scale}, 1)`;
      }

      // 套用 GPU 加速變型
      item.element.style.transform = transformStr;
    });

    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }

  // 註冊滾動事件 (使用 passive 屬性提升行動端滾動流暢度)
  window.addEventListener('scroll', onScroll, { passive: true });
  
  // 首次手動執行，初始化定位
  setTimeout(updateParallax, 50);
});
