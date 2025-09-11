let intervalId = null;
let contextCheckId = null;
let active = true;
let lastSentUrl = null; // Track last URL to detect navigation changes

// === Safe messaging wrapper ===
function safeSendMessage(msg, cb) {
  if (!active) return;
  try {
    chrome.runtime.sendMessage(msg, cb);
  } catch {
    console.warn("⚠️ Failed to send message, disabling content script");
    active = false;
  }
}

// === Cleanup listeners and timers ===
function cleanup() {
  clearInterval(intervalId);
  clearInterval(contextCheckId);
  document.removeEventListener("mousemove", onActivity);
  document.removeEventListener("keydown", onActivity);
  document.removeEventListener("visibilitychange", onVisibilityChange);
  window.removeEventListener("beforeunload", cleanup);
  console.log("🧹 Content script cleaned up");
}

// === User activity tracking ===
function onActivity() {
  safeSendMessage({ type: "userActivity" });
}

function onVisibilityChange() {
  if (document.visibilityState === "hidden") {
    cleanup();
  }
}

// === Video state tracking ===
function sendVideoState() {
  const playing = Array.from(document.querySelectorAll("video")).some(v => !v.paused);
  safeSendMessage({ type: "videoPlaying", playing });
}

// === Page context sending (only if changed) ===
function sendPageContextIfChanged(force = false) {
  const currentUrl = window.location.href;
  if (force || currentUrl !== lastSentUrl) {
    lastSentUrl = currentUrl;

    const context = {
      title: document.title,
      url: currentUrl,
      rootDomain: window.location.hostname.replace(/^www\./, ""),
      snippet: document.body.innerText.slice(0, 2000) // Limit to avoid huge payloads
    };

    safeSendMessage({ type: "pageContext", context });
    console.log("📄 Sent updated page context to background", context);
  }
}

// === Respond to manual requests from background ===
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "getPageContext") {
    // Force send before responding so background gets fresh context
    sendPageContextIfChanged(true);

    const context = {
      title: document.title,
      url: window.location.href,
      rootDomain: window.location.hostname.replace(/^www\./, ""),
      snippet: document.body.innerText.slice(0, 2000)
    };
    sendResponse({ context });
    return true;
  }
});

// === Init listeners ===
document.addEventListener("mousemove", onActivity);
document.addEventListener("keydown", onActivity);
document.addEventListener("visibilitychange", onVisibilityChange);
window.addEventListener("beforeunload", cleanup);

// === Intervals ===
intervalId = setInterval(sendVideoState, 2000);
contextCheckId = setInterval(sendPageContextIfChanged, 2000); // Handles SPA navigation changes

// === First context send on load ===
sendPageContextIfChanged(true);

console.log("🎯 Content script initialized with live page context tracking");
