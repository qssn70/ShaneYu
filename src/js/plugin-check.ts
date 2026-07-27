export interface PluginCheckOptions {
  apiBase: string;
  cacheKey?: string;
}

const cache = new Map<string, boolean>();

export function checkPlugin(options: PluginCheckOptions): Promise<boolean> {
  const key = options.cacheKey || options.apiBase;
  if (cache.has(key)) {
    return Promise.resolve(cache.get(key)!);
  }
  return fetch(options.apiBase + "?t=" + Date.now(), {
    method: "GET",
  })
    .then(function (res) {
      cache.set(key, res.ok);
      return res.ok;
    })
    .catch(function () {
      cache.set(key, false);
      return false;
    });
}

export function clearPluginCache(key?: string) {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

export function showToast(
  message: string,
  type: "info" | "error" | "success" = "info",
  duration = 3000,
) {
  const existing = document.getElementById("linksToast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "linksToast";
  toast.className = "links-toast links-toast-" + type;

  const icon = document.createElement("span");
  icon.className = "links-toast-icon";
  if (type === "error") icon.textContent = "!";
  else if (type === "success") icon.textContent = "✓";
  else icon.textContent = "i";

  const msg = document.createElement("span");
  msg.className = "links-toast-msg";
  msg.textContent = message;

  toast.appendChild(icon);
  toast.appendChild(msg);
  document.body.appendChild(toast);

  requestAnimationFrame(function () {
    toast.classList.add("show");
  });

  setTimeout(function () {
    toast.classList.remove("show");
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, duration);
}

export function getI18nText(key: string, fallback: string): string {
  const i18n = (window as unknown as Record<string, unknown>).i18n as
    | ((key: string) => string)
    | undefined;
  return i18n ? i18n(key) || fallback : fallback;
}
