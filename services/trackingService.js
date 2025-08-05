const BASE_URL = 'http://localhost:3000';

// Utility: Format seconds into readable string
export function formatSeconds(seconds) {
  return `${seconds}s`;
}

// Utility: Seconds since a given timestamp
export function secondsSince(timestamp) {
  if (!timestamp) return 'N/A';
  const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  return formatSeconds(diff);
}

// Show temporary status message
export function showStatus(message, statusDiv, isError = false) {
  statusDiv.textContent = message;
  statusDiv.style.color = isError ? 'red' : 'green';
  setTimeout(() => {
    statusDiv.textContent = '';
  }, 5000);
}

// Fetch current tab's time on site
export function fetchTimeOnSite(tabId, callback) {
  chrome.runtime.sendMessage({ type: 'startTrackingIfNeeded', tabId }, () => {
    chrome.runtime.sendMessage({ type: 'getTimeOnSite', tabId }, (response) => {
      const timeOnSite = response?.timeOnSite || 0;
      callback(timeOnSite);
    });
  });
}

// Fetch tracking stats from backend for a specific domain
export function fetchDbStats(rootDomain, callback) {
  fetch(`${BASE_URL}/api/tracking/records?rootDomain=${encodeURIComponent(rootDomain)}`)
    .then(res => res.json())
    .then(data => {
      if (data.error) throw new Error(data.error);
      callback(data);
    })
    .catch(err => {
      console.error(err);
      callback({ totalTime: 0, lastVisit: null });
    });
}

// Fetch entire visit list for calendar rendering
export function fetchCalendarData(callback) {
  fetch(`${BASE_URL}/api/tracking/records`)
    .then(res => res.json())
    .then(data => {
      callback(data.visits || []);
    })
    .catch(err => {
      console.error('❌ Failed to fetch calendar data:', err);
      callback([]);
    });
}

// Send tracking data to backend
export function trackCurrentPage(statusDiv, calendarRefresh) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab || !tab.id || !tab.url) {
      showStatus('❌ No active tab found.', statusDiv, true);
      return;
    }

    const rootDomain = new URL(tab.url).hostname.replace(/^www\./, '');

    fetchTimeOnSite(tab.id, (timeOnSite) => {
      if (typeof timeOnSite !== 'number') {
        showStatus('❌ Failed to get timeOnSite', statusDiv, true);
        return;
      }

      // Extract page title & content
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
              showStatus(`✅ Tracked! (${timeOnSite} sec)`, statusDiv);
              if (typeof calendarRefresh === 'function') calendarRefresh();
            })
            .catch(err => {
              showStatus('❌ Error tracking page', statusDiv, true);
              console.error(err);
            });
        }
      );
    });
  });
}
