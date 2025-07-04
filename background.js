const tabTimers = {}; // { tabId: { startTime, accumulatedTime } }
let lastActivityTimestamp = Date.now();
let videoIsPlaying = false;

// === 🖱️ User activity + video state (via content.js) ===
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'userActivity') {
    lastActivityTimestamp = Date.now();
    return;
  }

  if (msg.type === 'videoPlaying') {
    videoIsPlaying = msg.playing;
    return;
  }

  if (msg.type === 'getTimeOnSite') {
    const timeOnSite = getTimeOnTab(msg.tabId ?? -1);
    sendResponse({ timeOnSite });
    return true;
  }

  if (msg.type === 'startTrackingIfNeeded') {
    startTrackingIfNeeded(msg.tabId);
    sendResponse({ started: true });
    return true;
  }

  if (msg.type === 'resetTimer') {
    resetTabTimer(msg.tabId);
    sendResponse({ reset: true });
    return true;
  }
});

// === 🔄 Active tab tracking ===
chrome.tabs.onActivated.addListener(({ tabId }) => {
  pauseAllTabs();
  resumeTab(tabId);
});

chrome.tabs.onRemoved.addListener(tabId => {
  delete tabTimers[tabId];
});

chrome.windows.onFocusChanged.addListener(windowId => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    pauseAllTabs();
  } else {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs[0]) resumeTab(tabs[0].id);
    });
  }
});

// === 💤 Idle API integration ===
chrome.idle.onStateChanged.addListener(state => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (!tabs[0]) return;
    const tabId = tabs[0].id;

    if (state === 'idle' || state === 'locked') {
      pauseTab(tabId);
    } else {
      resumeTab(tabId);
    }
  });
});

// === 🧠 Periodic activity/idle check ===
setInterval(() => {
  const now = Date.now();
  const inactiveSecs = (now - lastActivityTimestamp) / 1000;

  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (!tabs[0]) return;

    const tabId = tabs[0].id;

    if (inactiveSecs > 60 && !videoIsPlaying) {
      pauseTab(tabId);
    } else {
      resumeTab(tabId);
    }
  });
}, 5000);

// === 🔷 Helpers ===
function pauseAllTabs() {
  for (const tabId of Object.keys(tabTimers)) {
    pauseTab(parseInt(tabId));
  }
}

function pauseTab(tabId) {
  const timer = tabTimers[tabId];
  if (timer && timer.startTime !== null) {
    timer.accumulatedTime += elapsedSince(timer.startTime);
    timer.startTime = null;
    console.log(`⏸️ Paused tab ${tabId}, total: ${timer.accumulatedTime}s`);
  }
}

function resumeTab(tabId) {
  if (!tabTimers[tabId]) {
    tabTimers[tabId] = { startTime: Date.now(), accumulatedTime: 0 };
    console.log(`▶️ Started tracking tab ${tabId}`);
  } else if (tabTimers[tabId].startTime === null) {
    tabTimers[tabId].startTime = Date.now();
    console.log(`▶️ Resumed tab ${tabId}`);
  }
}

function getTimeOnTab(tabId) {
  const timer = tabTimers[tabId];
  if (!timer) return 0;

  if (timer.startTime !== null) {
    return timer.accumulatedTime + elapsedSince(timer.startTime);
  }
  return timer.accumulatedTime;
}

function resetTabTimer(tabId) {
  tabTimers[tabId] = { startTime: Date.now(), accumulatedTime: 0 };
  console.log(`🔄 Reset timer for tab ${tabId}`);
}

function startTrackingIfNeeded(tabId) {
  if (!tabTimers[tabId]) {
    tabTimers[tabId] = { startTime: Date.now(), accumulatedTime: 0 };
    console.log(`🚀 Started tracking tab ${tabId} (on demand)`);
  }
}

function elapsedSince(startTime) {
  return Math.floor((Date.now() - startTime) / 1000);
}
