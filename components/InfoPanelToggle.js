// components/InfoPanelToggle.js
import { fetchAndRenderCalendarData } from '../services/calendarService.js';
import { fetchTimeOnSite, fetchDbStats } from '../services/trackingService.js';

const BASE_URL = 'http://localhost:3000';

export function initInfoPanelToggle(containerId = 'trackingPanel') {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Create the toggle button & info column
  container.innerHTML = `
    <button id="toggleInfoBtn" style="margin-bottom:6px; background:#fff; border:1px solid #00003D; border-radius:4px; padding:4px 8px; font-size:12px; cursor:pointer;">
      Show Details ⬇️
    </button>
    <div id="infoColumn" style="display:none; flex-direction:column; gap:4px; font-size:13px;">
      <div id="time">⏳ Current: 0s</div>
      <div id="dbTotal">📊 DB Total: 0s</div>
      <div id="sinceLastUpload">🕒 Since Last Upload: N/A</div>
      <button id="trackBtn" style="margin-top:4px; background:#4141FF; color:white; border:none; border-radius:4px; padding:4px 8px; font-size:12px; cursor:pointer;">
        Refresh Tracking
      </button>
      <div id="status" style="font-size:12px;"></div>
    </div>
  `;

  const toggleBtn = container.querySelector('#toggleInfoBtn');
  const infoColumn = container.querySelector('#infoColumn');
  const timeDisplay = container.querySelector('#time');
  const dbTotalDisplay = container.querySelector('#dbTotal');
  const sinceLastUploadDisplay = container.querySelector('#sinceLastUpload');
  const trackBtn = container.querySelector('#trackBtn');
  const statusDiv = container.querySelector('#status');

  // Toggle show/hide
  toggleBtn.addEventListener('click', () => {
    const visible = infoColumn.style.display !== 'none';
    infoColumn.style.display = visible ? 'none' : 'flex';
    toggleBtn.textContent = visible ? 'Show Details ⬇️' : 'Hide Details ⬆️';
  });

  function formatSeconds(sec) { return `${sec}s`; }
  function secondsSince(ts) {
    if (!ts) return 'N/A';
    return formatSeconds(Math.floor((Date.now() - new Date(ts)) / 1000));
  }
  function showStatus(msg, err=false) {
    statusDiv.textContent = msg;
    statusDiv.style.color = err ? 'red' : 'green';
    setTimeout(()=> statusDiv.textContent = '', 5000);
  }

  // Auto-update every second
  setInterval(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab?.id || !tab.url) return;
      const rootDomain = new URL(tab.url).hostname.replace(/^www\./, '');
      fetchTimeOnSite(tab.id, t => timeDisplay.textContent = `⏳ Current: ${formatSeconds(t)}`);
      fetchDbStats(rootDomain, d => {
        dbTotalDisplay.textContent = `📊 DB Total: ${formatSeconds(d.totalTime || 0)}`;
        sinceLastUploadDisplay.textContent = `🕒 Since Last Upload: ${secondsSince(d.lastVisit)}`;
      });
    });
  }, 1000);

  // Manual refresh
  trackBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab?.id || !tab.url) return showStatus('❌ No active tab found.', true);
      const rootDomain = new URL(tab.url).hostname.replace(/^www\./, '');
      fetchTimeOnSite(tab.id, (timeOnSite) => {
        if (typeof timeOnSite !== 'number') return showStatus('❌ Failed to get timeOnSite', true);
        chrome.scripting.executeScript(
          { target: { tabId: tab.id }, func: () => ({ title: document.title, content: document.body.innerText }) },
          (results) => {
            const { title, content } = results[0].result;
            fetch(`${BASE_URL}/api/tracking/ingest`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user: 'user1', url: tab.url, rootDomain, accessedAt: new Date().toISOString(), timeOnSite, rawTitle: title, pageContent: content })
            })
            .then(res => res.json())
            .then(() => { showStatus(`✅ Tracked! (${timeOnSite} sec)`); fetchAndRenderCalendarData(); })
            .catch(err => showStatus('❌ Error', true));
          }
        );
      });
    });
  });
}
