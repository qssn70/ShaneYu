import { checkPlugin, showToast, getI18nText } from "./plugin-check";

const MOMENTS_API_BASE = "/apis/moment.halo.run/v1alpha1";

const momentsPluginDetected = checkPlugin({
  apiBase: MOMENTS_API_BASE + "/moments",
  cacheKey: "moment-plugin",
});

momentsPluginDetected.then(function (available) {
  if (!available) {
    console.warn("[Moments] Moments plugin is not installed or enabled.");
    showToast(
      getI18nText("moments.plugin_not_installed", "瞬间插件未安装或未启用,请先在后台应用市场安装"),
      "error",
      5000,
    );
  }
});

function openLightbox(el: HTMLElement) {
  const src = el.getAttribute("data-src");
  if (!src) return;

  const videos = document.querySelectorAll("video");
  videos.forEach(function (video) {
    video.pause();
    video.style.zIndex = "-1";
  });

  const lightbox = document.getElementById("lightbox")!;
  const img = document.getElementById("lightbox-img") as HTMLImageElement;
  img.src = src;
  lightbox.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  const lightbox = document.getElementById("lightbox")!;
  lightbox.classList.remove("active");
  document.body.style.overflow = "";

  const videos = document.querySelectorAll("video");
  videos.forEach(function (video) {
    video.style.zIndex = "";
  });
}

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") closeLightbox();
});

function toggleMomentComment(btn: HTMLElement) {
  var card = btn.closest(".moment-card");
  if (!card) return;
  var section = card.querySelector(".moment-comment-section") as HTMLElement | null;
  if (!section) return;
  var isHidden = section.style.display === "none" || section.style.display === "";
  section.style.display = isHidden ? "block" : "none";
  btn.classList.toggle("active", isHidden);
  if (isHidden) {
    setTimeout(function () {
      var targetPos = section!.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: targetPos, behavior: "smooth" });
    }, 100);
  }
}

async function loadMomentCommentCounts() {
  var countEls = document.querySelectorAll(".comment-count");
  if (!countEls.length) return;
  for (var i = 0; i < countEls.length; i++) {
    var el = countEls[i] as HTMLElement;
    var momentName = el.getAttribute("data-moment-name");
    if (!momentName) continue;
    try {
      var res = await fetch(
        "/apis/api.halo.run/v1alpha1/comments?group=moment.halo.run&kind=Moment&name=" +
          momentName +
          "&pageSize=0&page=0",
      );
      if (res.ok) {
        var data = await res.json();
        el.textContent = data.total || 0;
      }
    } catch (e) {
      console.error("加载评论数失败:", e);
    }
  }
}
void loadMomentCommentCounts();

const MOMENT_UPVOTE_KEY = "halo.upvoted.moment.names";

function getUpvotedMoments(): string[] {
  try {
    return JSON.parse(localStorage.getItem(MOMENT_UPVOTE_KEY) || "[]");
  } catch {
    return [];
  }
}

function isMomentUpvoted(name: string): boolean {
  return getUpvotedMoments().includes(name);
}

function markMomentUpvoted(name: string) {
  const names = getUpvotedMoments();
  if (!names.includes(name)) {
    names.push(name);
    localStorage.setItem(MOMENT_UPVOTE_KEY, JSON.stringify(names));
  }
}

async function handleMomentLike(btn: HTMLElement) {
  const momentName = btn.getAttribute("data-moment-name");
  if (!momentName) return;

  if (isMomentUpvoted(momentName)) return;

  btn.classList.add("liked");
  const countEl = btn.querySelector(".like-count");
  const originalCount = parseInt(countEl?.textContent || "0") || 0;
  if (countEl) {
    countEl.textContent = String(originalCount + 1);
  }

  try {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/apis/api.halo.run/v1alpha1/trackers/upvote");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        markMomentUpvoted(momentName);
      } else {
        btn.classList.remove("liked");
        if (countEl) {
          countEl.textContent = String(originalCount);
        }
        console.error("点赞请求失败:", xhr.status);
      }
    };
    xhr.onerror = function () {
      btn.classList.remove("liked");
      if (countEl) {
        countEl.textContent = String(originalCount);
      }
      console.error("点赞请求失败");
    };
    xhr.send(
      JSON.stringify({
        group: "moment.halo.run",
        plural: "moments",
        name: momentName,
      }),
    );
  } catch (error) {
    btn.classList.remove("liked");
    if (countEl) {
      countEl.textContent = String(originalCount);
    }
    console.error("点赞失败:", error);
  }
}

function restoreUpvoteState() {
  const upvotedNames = getUpvotedMoments();
  if (!upvotedNames.length) return;
  upvotedNames.forEach(function (name) {
    var btn = document.querySelector(
      '.moment-action-btn[data-moment-name="' + name + '"]',
    ) as HTMLElement | null;
    if (btn) {
      btn.classList.add("liked");
    }
  });
}
restoreUpvoteState();

function setupMediaPlaybackMutex() {
  const videos = document.querySelectorAll("video");
  const audios = document.querySelectorAll("audio");

  function pauseOtherMedia(currentMedia: HTMLMediaElement) {
    videos.forEach(function (video) {
      if (video !== currentMedia) {
        video.pause();
      }
    });
    audios.forEach(function (audio) {
      if (audio !== currentMedia) {
        audio.pause();
      }
    });
  }

  videos.forEach(function (video) {
    video.addEventListener("play", function () {
      pauseOtherMedia(video);
    });
  });

  audios.forEach(function (audio) {
    audio.addEventListener("play", function () {
      pauseOtherMedia(audio);
    });
  });
}

document.addEventListener("DOMContentLoaded", function () {
  setupMediaPlaybackMutex();
});

(window as any).openLightbox = openLightbox;
(window as any).closeLightbox = closeLightbox;
(window as any).toggleMomentComment = toggleMomentComment;
(window as any).handleMomentLike = handleMomentLike;
