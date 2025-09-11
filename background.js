// --- STATE ---
const tabTimers = {};
let lastActivityTimestamp = Date.now();
let videoIsPlaying = false;
let activeTabId = null;
let latestPageContext = null;
let currentUser = null; // <-- NEW: To hold session state in memory

// =========================================================================
// === 🚀 INITIALIZATION ===
// =========================================================================

// Check auth status when the extension first starts up
(async function checkAuthStatusOnStart() {
  const result = await chrome.storage.local.get(['user']);
  if (result.user) {
    currentUser = result.user;
    console.log('✅ User is already logged in on startup.', currentUser);
  } else {
    console.log('👤 No user is logged in on startup.');
  }
})();


// =========================================================================
// === 🖱️ MESSAGES ===
// =========================================================================
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // NEW: Handle logout message from the popup
  if (msg.type === 'userLoggedOut') {
    console.log('🔒 User logged out. Stopping all timers.');
    currentUser = null;
    pauseAllTabs();
    Object.keys(tabTimers).forEach(key => delete tabTimers[key]); // Clear timers
    return;
  }

  switch (msg.type) {
    // ... (rest of your switch cases are fine)
    case "userActivity":
      lastActivityTimestamp = Date.now();
      break;

    case "videoPlaying":
      videoIsPlaying = msg.playing;
      break;

    case "getTimeOnSite":
      sendResponse({ timeOnSite: getTimeOnTab(msg.tabId ?? -1) });
      return true;

    case "startTrackingIfNeeded":
      startTrackingIfNeeded(msg.tabId);
      sendResponse({ started: true });
      return true;

    case "resetTimer":
      resetTabTimer(msg.tabId);
      sendResponse({ reset: true });
      return true;

    case "pageContext": // from content.js
      updateLatestContext(msg.context);
      break;

    case "getLatestPageContext": // from popup
      sendResponse({ context: latestPageContext });
      return true;
  }
});

// =========================================================================
// === 🔄 BROWSER EVENTS ===
// =========================================================================
// ... (onActivated, onUpdated, onRemoved, onFocusChanged, onStateChanged are all fine)
chrome.tabs.onActivated.addListener(({ tabId }) => {
  pauseAllTabs();
  resumeTab(tabId);
  activeTabId = tabId;
  requestPageContext(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (tabId === activeTabId && changeInfo.status === "complete") {
    requestPageContext(tabId);
  }
});

chrome.tabs.onRemoved.addListener(tabId => {
  delete tabTimers[tabId];
  if (activeTabId === tabId) {
    activeTabId = null;
    latestPageContext = null;
  }
});

chrome.windows.onFocusChanged.addListener(windowId => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    pauseAllTabs();
  } else {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs[0]) {
        resumeTab(tabs[0].id);
        activeTabId = tabs[0].id;
        requestPageContext(activeTabId);
      }
    });
  }
});

chrome.idle.onStateChanged.addListener(state => {
  if (!activeTabId) return;
  if (state === "idle" || state === "locked") {
    pauseTab(activeTabId);
  } else {
    resumeTab(activeTabId);
  }
});
// =========================================================================
// === ⏳ IDLE CHECK ===
// =========================================================================
setInterval(() => {
  if (!currentUser) return; // <-- NEW: Don't check idle state if logged out
  const inactiveSecs = (Date.now() - lastActivityTimestamp) / 1000;
  if (!activeTabId) return;

  if (inactiveSecs > 60 && !videoIsPlaying) {
    pauseTab(activeTabId);
  } else {
    resumeTab(activeTabId);
  }
}, 5000);

// =========================================================================
// === ⏳ TIMER HELPERS ===
// =========================================================================
function resumeTab(tabId) {
  if (!currentUser) return; // <-- NEW: The main guard clause
  if (!tabTimers[tabId]) {
    tabTimers[tabId] = { startTime: Date.now(), accumulatedTime: 0 };
    console.log(`▶️ Started tracking tab ${tabId}`);
  } else if (tabTimers[tabId].startTime === null) {
    tabTimers[tabId].startTime = Date.now();
    console.log(`▶️ Resumed tab ${tabId}`);
  }
}
// ... (The rest of your helper and context functions are fine)
function requestPageContext(tabId) {
  if (!tabId) return;
  chrome.tabs.sendMessage(tabId, { type: "getPageContext" }, (response) => {
    if (chrome.runtime.lastError) {
      console.warn("Could not connect to content script:", chrome.runtime.lastError.message);
      return;
    }
    if (response?.context) {
      latestPageContext = response.context;
      console.log("📄 Updated page context:", latestPageContext);
    }
  });
}

function pauseAllTabs() {
  for (const id of Object.keys(tabTimers)) pauseTab(parseInt(id));
}

function pauseTab(tabId) {
  const timer = tabTimers[tabId];
  if (timer && timer.startTime !== null) {
    timer.accumulatedTime += elapsedSince(timer.startTime);
    timer.startTime = null;
    console.log(`⏸️ Paused tab ${tabId}, total: ${timer.accumulatedTime}s`);
  }
}

function getTimeOnTab(tabId) {
  const timer = tabTimers[tabId];
  if (!timer) return 0;
  return timer.startTime !== null
    ? timer.accumulatedTime + elapsedSince(timer.startTime)
    : timer.accumulatedTime;
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

if (chrome.webNavigation && chrome.webNavigation.onCommitted) {
  chrome.webNavigation.onCommitted.addListener((details) => {
    if (details.frameId === 0) {
      requestPageContext(details.tabId);
    }
  });
} else {
  console.warn("⚠️ webNavigation API not available");
}

async function updateLatestContext(context) {
  latestPageContext = context;
  console.log("📄 Updated page context:", latestPageContext);
  try {
    await chrome.runtime.sendMessage({ type: "pageContextUpdated", context: latestPageContext });
  } catch (error) {
    console.log("Popup not open, pageContextUpdated message not sent.");
  }
}

// =========================================================================
// === 🔐 AUTHENTICATION LOGIC ===
// =========================================================================
const API_URL = 'http://localhost:3000';
const COOKIE_NAME = 'next-auth.session-token';

chrome.cookies.onChanged.addListener((changeInfo) => {
  // Handles a user LOGGING IN on the main website
  if (changeInfo.cookie.name === COOKIE_NAME && !changeInfo.removed) {
    console.log('✅ Auth cookie detected. Fetching user data...');
    fetchUserData();
  }

  // Handles a user LOGGING OUT on the main website
  if (changeInfo.cookie.name === COOKIE_NAME && changeInfo.removed) {
    console.log('🔒 Auth cookie removed. Logging out extension.');
    currentUser = null;
    chrome.storage.local.remove(['user', 'school_id']);
    pauseAllTabs();
    Object.keys(tabTimers).forEach(key => delete tabTimers[key]);
  }
});

async function fetchUserData() {
  try {
    const response = await fetch(`${API_URL}/api/auth/me`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch user data.');

    // MODIFIED: Update state and save to storage
    currentUser = data.user;
    console.log(currentUser)
    await chrome.storage.local.set({
      user: data.user,
      school_id: data.school_id
    });

    console.log('User data saved to extension storage.');

    try {
      await chrome.runtime.sendMessage({ type: 'loginSuccess' });
    } catch (error) {
      console.log("Popup not open, loginSuccess message not sent.");
    }

  } catch (error) {
    console.error('Error fetching user data:', error);
    currentUser = null;
    chrome.storage.local.remove(['user', 'school_id']);
  }
}