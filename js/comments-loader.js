(function () {
  "use strict";

  function resolveUtterancesTheme() {
    return document.documentElement.dataset.theme === "dark" ? "github-dark" : "github-light";
  }

  function normalizeIssueTerm(value, fallbackPath) {
    if (!value) {
      return "pathname";
    }

    if (value === "path") {
      return "pathname";
    }

    if (value === "page.path") {
      return fallbackPath || "pathname";
    }

    return value;
  }

  function initUtterancesComments() {
    const host = document.querySelector("[data-utterances-comments]");
    if (!host) {
      return;
    }

    const container = host.querySelector(".comments-embed");
    const status = host.querySelector(".comments-status");
    const retryButton = host.querySelector(".comments-retry-btn");
    const repo = host.getAttribute("data-repo");
    const issueTerm = normalizeIssueTerm(host.getAttribute("data-issue-term"), host.getAttribute("data-page-path"));
    const maxAttempts = 3;
    let attempts = 0;
    let isLoaded = false;
    let timeoutId = null;
    let iframeObserver = null;
    let intersectionObserver = null;

    if (!container || !status || !retryButton || !repo) {
      return;
    }

    function hasFrame() {
      return !!container.querySelector("iframe.utterances-frame");
    }

    function isNearViewport() {
      const rect = host.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
      return rect.top <= viewportHeight + 240 && rect.bottom >= -240;
    }

    function setStatus(message, isError) {
      status.textContent = message;
      status.classList.toggle("is-error", !!isError);
      status.hidden = !message;
    }

    function clearPendingState() {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (iframeObserver) {
        iframeObserver.disconnect();
        iframeObserver = null;
      }
    }

    function disconnectIntersectionObserver() {
      if (intersectionObserver) {
        intersectionObserver.disconnect();
        intersectionObserver = null;
      }
    }

    function armIntersectionObserver() {
      if (!("IntersectionObserver" in window) || intersectionObserver || isLoaded) {
        return;
      }

      intersectionObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            return;
          }

          disconnectIntersectionObserver();
          ensureCommentsReady(false);
        });
      }, {
        rootMargin: "240px 0px"
      });
      intersectionObserver.observe(host);
    }

    function updateTheme() {
      const frame = container.querySelector("iframe.utterances-frame");
      if (!frame || !frame.contentWindow) {
        return;
      }

      frame.contentWindow.postMessage({
        type: "set-theme",
        theme: resolveUtterancesTheme()
      }, "https://utteranc.es");
    }

    function syncFrameState() {
      isLoaded = hasFrame();
      if (isLoaded) {
        clearPendingState();
        disconnectIntersectionObserver();
        setStatus("");
      }
    }

    function handleFailure() {
      clearPendingState();
      isLoaded = false;
      container.innerHTML = "";

      if (attempts < maxAttempts) {
        setStatus("评论区连接超时，正在重试…", true);
        timeoutId = setTimeout(function () {
          loadComments(true);
        }, 1200 * attempts);
        return;
      }

      setStatus("评论区加载失败，请点按钮重试。", true);
      retryButton.hidden = false;
    }

    function loadComments(forceReload) {
      syncFrameState();

      if (isLoaded && !forceReload) {
        updateTheme();
        return;
      }

      attempts += 1;
      retryButton.hidden = true;
      setStatus("评论区加载中…");
      container.innerHTML = "";
      clearPendingState();

      iframeObserver = new MutationObserver(function () {
        if (!container.querySelector("iframe.utterances-frame")) {
          return;
        }

        clearPendingState();
        isLoaded = true;
        setStatus("");
        updateTheme();
      });
      iframeObserver.observe(container, { childList: true, subtree: true });

      const script = document.createElement("script");
      script.src = "https://utteranc.es/client.js";
      script.async = true;
      script.crossOrigin = "anonymous";
      script.setAttribute("repo", repo);
      script.setAttribute("issue-term", issueTerm);
      script.setAttribute("theme", resolveUtterancesTheme());
      script.addEventListener("error", handleFailure, { once: true });
      container.appendChild(script);

      timeoutId = setTimeout(function () {
        if (!hasFrame()) {
          handleFailure();
        }
      }, 9000);
    }

    function ensureCommentsReady(forceReload) {
      syncFrameState();
      if (isLoaded) {
        updateTheme();
        return;
      }

      if (!forceReload && !isNearViewport()) {
        armIntersectionObserver();
        return;
      }

      if (attempts >= maxAttempts && !forceReload) {
        armIntersectionObserver();
        return;
      }

      if (forceReload) {
        attempts = 0;
      }

      loadComments(!!forceReload);
    }

    syncFrameState();

    retryButton.addEventListener("click", function () {
      ensureCommentsReady(true);
    });

    const themeObserver = new MutationObserver(function () {
      updateTheme();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"]
    });

    if ("IntersectionObserver" in window) {
      armIntersectionObserver();
      ensureCommentsReady(false);
      return;
    }

    ensureCommentsReady(false);
  }

  // Run on initial page load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initUtterancesComments, { once: true });
  } else {
    initUtterancesComments();
  }

  // Re-run after PJAX navigation replaces page content
  document.addEventListener("starter:page-ready", function () {
    initUtterancesComments();
  });
})();