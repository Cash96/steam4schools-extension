// components/TrackingPanel.js
import { fetchAndRenderCalendarData } from '../services/calendarService.js';
import { fetchTimeOnSite, fetchDbStats } from '../services/trackingService.js';

const BASE_URL = 'http://192.168.1.104:3000';

export function initTrackingPanel(containerId = 'trackingPanel') {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Render the UI inside the container
  container.innerHTML = `
    <div id="time">⏳ Current: 0s</div>
    <div id="dbTotal">📊 DB Total: 0s</div>
    <div id="sinceLastUpload">🕒 Since Last Upload: N/A</div>
    <button id="trackBtn">Refresh Tracking</button>
    <div id="status"></div>
  `;

  const timeDisplay = container.querySelector('#time');
  const dbTotalDisplay = container.querySelector('#dbTotal');
  const sinceLastUploadDisplay = container.querySelector('#sinceLastUpload');
  const trackBtn = container.querySelector('#trackBtn');
  const statusDiv = container.querySelector('#status');

  // Utility functions
  function formatSeconds(seconds) {
    return `${seconds}s`;
  }

  function secondsSince(timestamp) {
    if (!timestamp) return 'N/A';
    const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    return formatSeconds(diff);
  }

  function showStatus(message, isError = false) {
    statusDiv.textContent = message;
    statusDiv.style.color = isError ? 'red' : 'green';
    setTimeout(() => {
      statusDiv.textContent = '';
    }, 5000);
  }

  // Auto-refresh tracking stats
  setInterval(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab || !tab.id || !tab.url) return;

      const rootDomain = new URL(tab.url).hostname.replace(/^www\./, '');

      fetchTimeOnSite(tab.id, (timeOnSite) => {
        timeDisplay.textContent = `⏳ Current: ${formatSeconds(timeOnSite)}`;
      });

      fetchDbStats(rootDomain, (data) => {
        dbTotalDisplay.textContent = `📊 DB Total: ${formatSeconds(data.totalTime || 0)}`;
        sinceLastUploadDisplay.textContent = `🕒 Since Last Upload: ${secondsSince(data.lastVisit)}`;
      });
    });
  }, 1000);

  // Manual refresh button
  trackBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab || !tab.id || !tab.url) {
        showStatus('❌ No active tab found.', true);
        return;
      }

      const rootDomain = new URL(tab.url).hostname.replace(/^www\./, '');

      fetchTimeOnSite(tab.id, (timeOnSite) => {
        if (typeof timeOnSite !== 'number') {
          showStatus('❌ Failed to get timeOnSite', true);
          return;
        }

        chrome.scripting.executeScript(
          {
            target: { tabId: tab.id },
            func: () => ({
              title: document.title,
              content: document.body.innerText
            })
          },
          (results) => {
            const { title, content } = results[0].result;
            const accessedAt = new Date().toISOString();

            fetch(`${BASE_URL}/api/tracking/ingest`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user: 'user1',
                url: tab.url,
                rootDomain,
                accessedAt,
                timeOnSite,
                rawTitle: title,
                pageContent: content
              })
            })
              .then(res => res.json())
              .then(() => {
                showStatus(`✅ Tracked! (${timeOnSite} sec)`);
                return fetchAndRenderCalendarData();
              })
              .catch(err => {
                showStatus('❌ Error', true);
                console.error(err);
              });
          }
        );
      });
    });
  });

  // Initial render of calendar
  fetchAndRenderCalendarData();
}
