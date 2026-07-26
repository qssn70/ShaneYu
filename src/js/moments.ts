function openLightbox(el: HTMLElement) {
  const src = el.getAttribute("data-src");
  if (!src) return;

  // 暂停所有视频播放
  const videos = document.querySelectorAll("video");
  videos.forEach(function (video) {
    video.pause();
    // 在移动端，确保视频元素不干扰灯箱显示
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

  // 恢复视频的 z-index
  const videos = document.querySelectorAll("video");
  videos.forEach(function (video) {
    video.style.zIndex = "";
  });
}

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") closeLightbox();
});

// 瞬间评论切换
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

// 加载瞬间评论数
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

// 瞬间点赞（使用 Halo 通用 upvote API，与官方主题一致）
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

// 页面加载时恢复点赞状态（从 localStorage 读取）
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

// 媒体播放互斥 - 确保同一时间只有一个音视频在播放
function setupMediaPlaybackMutex() {
  // 获取所有媒体元素
  const videos = document.querySelectorAll("video");
  const audios = document.querySelectorAll("audio");

  // 暂停除当前播放元素外的所有媒体
  function pauseOtherMedia(currentMedia: HTMLMediaElement) {
    // 暂停所有视频
    videos.forEach(function (video) {
      if (video !== currentMedia) {
        video.pause();
      }
    });
    // 暂停所有音频
    audios.forEach(function (audio) {
      if (audio !== currentMedia) {
        audio.pause();
      }
    });
  }

  // 为每个视频添加播放事件监听
  videos.forEach(function (video) {
    video.addEventListener("play", function () {
      pauseOtherMedia(video);
    });
  });

  // 为每个音频添加播放事件监听
  audios.forEach(function (audio) {
    audio.addEventListener("play", function () {
      pauseOtherMedia(audio);
    });
  });
}

// 页面加载完成后初始化媒体播放互斥
document.addEventListener("DOMContentLoaded", function () {
  setupMediaPlaybackMutex();
});

// 挂载到全局供 onclick 使用
(window as any).openLightbox = openLightbox;
(window as any).closeLightbox = closeLightbox;
(window as any).toggleMomentComment = toggleMomentComment;
(window as any).handleMomentLike = handleMomentLike;
