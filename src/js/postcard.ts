(function () {
  "use strict";

  const STORAGE_KEY_TIME = "ShaneYu-postcard-last-time";

  const overlay = document.querySelector(".postcard-overlay") as HTMLElement | null;
  const card = document.querySelector(".postcard-card") as HTMLElement | null;
  const enterLink = document.querySelector(".postcard-enter-link") as HTMLAnchorElement | null;

  if (!overlay || !card) return;

  // 检查刷新间隔：如果配置了间隔且未过期，直接隐藏覆盖层
  const intervalStr = overlay.dataset.refreshInterval || "";
  if (intervalStr) {
    const intervalHours = parseFloat(intervalStr);
    if (!isNaN(intervalHours) && intervalHours > 0) {
      const lastTime = parseInt(localStorage.getItem(STORAGE_KEY_TIME) || "0", 10);
      const elapsed = (Date.now() - lastTime) / 1000 / 3600; // 转换为小时
      if (elapsed < intervalHours) {
        // 间隔未过，直接移除覆盖层
        overlay.remove();
        return;
      }
    }
  }

  // 点击明信片翻转
  card.addEventListener("click", (e) => {
    // 如果点击的是进入首页链接，不翻转
    if ((e.target as HTMLElement).closest(".postcard-enter-btn")) return;
    card.classList.toggle("flipped");
  });

  // 点击"进入首页"按钮时，淡出覆盖层（首页内容已在背后，无需跳转）
  if (enterLink) {
    enterLink.addEventListener("click", (e) => {
      e.preventDefault();
      overlay.classList.add("fade-out");
      // 记录本次点击时间
      try {
        localStorage.setItem(STORAGE_KEY_TIME, Date.now().toString());
      } catch {}
      setTimeout(() => {
        overlay.remove();
      }, 500);
    });
  }

  // ESC 键关闭
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay) {
      overlay.classList.add("fade-out");
      setTimeout(() => {
        overlay.remove();
      }, 500);
    }
  });
})();
