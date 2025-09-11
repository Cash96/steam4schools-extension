import { initTabNavigation } from "./components/TabNavigation.js";
import { initCalendar } from "./components/Calendar.js";
import { initInfoPanelToggle } from "./components/InfoPanelToggle.js";
import { initChatWindow } from "./components/ChatWindow.js";
import { initChatInput } from "./components/ChatInput.js";

const LOGIN_URL = 'http://localhost:3000/login';

let loginView;
let appView;

// This function contains all of your original UI setup code.
function initializeAppUI() {
  // Tabs
  initTabNavigation("tabBar", [
    { id: "tracker", label: "Tracker", target: "trackerTab" },
    { id: "chat", label: "Chat", target: "chatTab" },
    { id: "learn", label: "Learn", target: "learnTab" },
  ]);

  // Tracking panel + toggle button
  initInfoPanelToggle("trackingPanel");

  // Calendar
  initCalendar("calendar", "monthLabels", "tooltip");

  // Chat window
  initChatWindow("chatWindow");
  initChatInput("chatInputContainer");

  chrome.runtime.sendMessage({ type: "getLatestPageContext" })
        .catch(err => console.log("Could not get page context on init.", err));
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "pageContextUpdated") {
    console.log("📄 Context updated in popup:", msg.context);
  }

  if (msg.type === 'loginSuccess') {
    console.log('🎉 Login successful! Updating popup view.');
    if (loginView && appView) {
      loginView.classList.add('d-none');
      appView.classList.remove('d-none');
      initializeAppUI();
    }
  }
});

// --- DOMContentLoaded listener ---
document.addEventListener("DOMContentLoaded", () => {
  loginView = document.getElementById('login-view');
  appView = document.getElementById('app-view');
  const loginButton = document.getElementById('login-button');
  const logoutButton = document.getElementById('logout-button');

  // Make app-view hidden by class by default, overriding inline style
  appView.classList.add('d-none');

  chrome.storage.local.get(['user'], (result) => {
    if (result.user) {
      // --- UPDATED LOGIC ---
      loginView.classList.add('d-none');
      appView.classList.remove('d-none');
      document.getElementById('e-header').textContent = `Knowledge Tracker - ${result.user.name}`
      initializeAppUI();
    } else {
      // --- UPDATED LOGIC ---
      loginView.classList.remove('d-none');
      appView.classList.add('d-none');
    }
  });

  loginButton.addEventListener('click', () => {
    chrome.tabs.create({ url: LOGIN_URL });
  });

  logoutButton.addEventListener('click', () => {
    // Tell the background script to stop tracking, but catch potential errors
    chrome.runtime.sendMessage({ type: 'userLoggedOut' }).catch(error => {
      console.log("Could not send logout message to background, but proceeding with logout.", error);
    });

    chrome.storage.local.clear(() => {
      // This part is the most important for the UI, and it runs independently
      loginView.classList.remove('d-none');
      appView.classList.add('d-none');
    });
  });
});