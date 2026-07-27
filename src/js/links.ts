import { checkPlugin, showToast, getI18nText } from "./plugin-check";

const API_BASE = "/apis/linksSubmit.muyin.site/v1alpha1";

const applyToggleBtn = document.getElementById("linksApplyToggle");
const applyFormContainer = document.getElementById("linksApplyForm");
const applyFormEl = document.getElementById("linksApplyFormEl") as HTMLFormElement;

if (!applyToggleBtn || !applyFormContainer || !applyFormEl) {
  // Not on the links page, skip initialization
} else {
  const toggleBtn = applyToggleBtn as HTMLElement;
  const formContainer = applyFormContainer as HTMLElement;
  const formEl = applyFormEl as HTMLFormElement;
  const applySubmitBtn = document.getElementById("applySubmitBtn") as HTMLButtonElement | null;
  const applyResetBtn = document.getElementById("applyResetBtn");
  const applyResultBox = document.getElementById("applyFormResult");
  const applyResultIcon = document.getElementById("applyResultIcon");
  const applyResultMsg = document.getElementById("applyResultMsg");
  const applyCaptchaImg = document.getElementById("applyCaptcha") as HTMLImageElement;
  const applyGroupSelect = document.getElementById("applyGroup") as HTMLSelectElement;

  let isExpanded = false;

  function applyI18n() {
    const titleEl = toggleBtn.querySelector("span");
    if (titleEl) titleEl.textContent = getI18nText("links.apply_title", "申请友情链接");
  }

  function showResult(success: boolean, msg: string) {
    if (!applyResultBox || !applyResultIcon || !applyResultMsg) return;
    applyResultBox.style.display = "flex";
    applyResultBox.className = "apply-form-result " + (success ? "success" : "error");
    applyResultIcon.textContent = success ? "✓" : "✕";
    applyResultMsg.textContent = msg;
  }

  function hideResult() {
    if (!applyResultBox) return;
    applyResultBox.style.display = "none";
  }

  function loadCaptcha() {
    if (!applyCaptchaImg) return;
    applyCaptchaImg.src = API_BASE + "/captcha?t=" + Date.now();
  }

  function loadGroups() {
    if (!applyGroupSelect) return;
    fetch(API_BASE + "/linkGroups")
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        const groups = data.items || [];
        groups.forEach(function (g: {
          metadata?: { name?: string };
          spec?: { displayName?: string };
        }) {
          const name = g.metadata?.name || "";
          const displayName = g.spec?.displayName || name;
          if (name) {
            const option = document.createElement("option");
            option.value = name;
            option.textContent = displayName;
            applyGroupSelect.appendChild(option);
          }
        });
      })
      .catch(function () {});
  }

  function showError(msg: string) {
    showResult(false, msg);
  }

  function showSuccess(msg: string) {
    showResult(true, msg);
  }

  toggleBtn.addEventListener("click", function () {
    if (isExpanded) {
      isExpanded = false;
      formContainer.style.display = "none";
      toggleBtn.classList.remove("open");
      return;
    }

    checkPlugin({ apiBase: API_BASE, cacheKey: "link-submit" }).then(function (available) {
      if (!available) {
        showToast(
          getI18nText(
            "links.plugin_not_installed",
            "友链自助提交插件未安装,请先在后台应用市场安装",
          ),
          "error",
        );
        return;
      }

      isExpanded = true;
      formContainer.style.display = "block";
      toggleBtn.classList.add("open");
      loadCaptcha();
      loadGroups();
    });
  });

  if (applyCaptchaImg) {
    applyCaptchaImg.addEventListener("click", loadCaptcha);
  }

  applyResetBtn?.addEventListener("click", function () {
    hideResult();
    loadCaptcha();
  });

  formEl.addEventListener("submit", function (e) {
    e.preventDefault();
    hideResult();

    const formData = new FormData(formEl);
    const data: Record<string, string> = {};
    formData.forEach(function (value, key) {
      data[key] = String(value).trim();
    });

    if (!data.displayName) {
      showError(getI18nText("links.error_name_required", "请输入网站名称"));
      return;
    }
    if (!data.url) {
      showError(getI18nText("links.error_url_required", "请输入网站地址"));
      return;
    }
    if (!data.verifyCode) {
      showError(getI18nText("links.error_verify_required", "请输入验证码"));
      return;
    }

    if (applySubmitBtn) {
      const span = applySubmitBtn.querySelector("span");
      if (span) span.textContent = getI18nText("links.submitting", "提交中...");
      applySubmitBtn.disabled = true;
    }

    const submitData = {
      displayName: data.displayName,
      url: data.url,
      logo: data.logo || "",
      email: data.email || "",
      description: data.description || "",
      linkPageUrl: data.linkPageUrl || "",
      groupName: data.groupName || "",
      rssUrl: data.rssUrl || "",
      verifyCode: data.verifyCode,
    };

    fetch(API_BASE + "/submit?verifyCode=" + encodeURIComponent(data.verifyCode), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(submitData),
    })
      .then(function (res) {
        return res.json();
      })
      .then(function (result) {
        if (applySubmitBtn) {
          const span = applySubmitBtn.querySelector("span");
          if (span) span.textContent = getI18nText("links.submit", "提交申请");
          applySubmitBtn.disabled = false;
        }

        if (result.code === 200 || result.code === 0) {
          showSuccess(
            getI18nText("links.submit_success", "提交成功!管理员审核后将展示,感谢你的申请~"),
          );
          formEl.reset();
          loadCaptcha();
        } else {
          showError(result.msg || getI18nText("links.submit_fail", "提交失败,请稍后重试"));
          loadCaptcha();
        }
      })
      .catch(function () {
        if (applySubmitBtn) {
          const span = applySubmitBtn.querySelector("span");
          if (span) span.textContent = getI18nText("links.submit", "提交申请");
          applySubmitBtn.disabled = false;
        }
        showError(getI18nText("links.error_network", "网络错误,请稍后重试"));
      });
  });

  applyI18n();
}
