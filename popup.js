const timeDisplay = document.getElementById('time');
const dbTotalDisplay = document.getElementById('dbTotal');
const sinceLastUploadDisplay = document.getElementById('sinceLastUpload');
const trackBtn = document.getElementById('trackBtn');
const statusDiv = document.getElementById('status');
const calendarDiv = document.getElementById('calendar');

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

function fetchTimeOnSite(tabId, callback) {
  chrome.runtime.sendMessage({ type: 'startTrackingIfNeeded', tabId }, () => {
    chrome.runtime.sendMessage({ type: 'getTimeOnSite', tabId }, (response) => {
      const timeOnSite = response?.timeOnSite || 0;
      callback(timeOnSite);
    });
  });
}

function fetchDbStats(rootDomain, callback) {
  fetch(`http://localhost:3000/api/tracking/records?rootDomain=${encodeURIComponent(rootDomain)}`)
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

function fetchAndRenderCalendar() {
  fetch(`http://localhost:3000/api/tracking/records`)
    .then(res => res.json())
    .then(data => {
      if (!data.visits || data.visits.length === 0) {
        calendarDiv.innerHTML = '';
        return;
      }

      const contributions = {};
      data.visits.forEach(visit => {
        const dateStr = new Date(visit.accessedAt).toISOString().split('T')[0];
        contributions[dateStr] = (contributions[dateStr] || 0) + 1;
      });

      renderCalendar(contributions);
    })
    .catch(err => {
      console.error('❌ Failed to fetch calendar data:', err);
      calendarDiv.innerHTML = '';
    });
}

function renderCalendar(contributions) {
  calendarDiv.innerHTML = '';
  document.getElementById('monthLabels').innerHTML = '';

  const today = new Date();
  today.setHours(0, 0, 0, 0); // normalize

  const numDays = 365;
  const lastDate = new Date(today);

  const firstDate = new Date(today);
  firstDate.setDate(firstDate.getDate() - (numDays - 1));

  const firstDayOfWeek = firstDate.getDay(); // 0 = Sun
  const gridStartDate = new Date(firstDate);
  gridStartDate.setDate(gridStartDate.getDate() - firstDayOfWeek);

  const totalWeeks = Math.ceil((today - gridStartDate) / (7 * 24 * 60 * 60 * 1000));

  const monthLabelsDiv = document.getElementById('monthLabels');
  let currentMonth = null;

  for (let week = 0; week < totalWeeks; week++) {
    const col = document.createElement('div');
    col.className = 'calendar-column';

    const weekStart = new Date(gridStartDate);
    weekStart.setDate(gridStartDate.getDate() + week * 7);

    const month = weekStart.toLocaleString('default', { month: 'short' });

    if (currentMonth !== month) {
      const monthLabel = document.createElement('div');
      monthLabel.style.width = '12px';
      monthLabel.style.fontSize = '10px';
      monthLabel.style.textAlign = 'center';
      monthLabel.textContent = month;
      monthLabelsDiv.appendChild(monthLabel);

      currentMonth = month;
    } else {
      const emptyLabel = document.createElement('div');
      emptyLabel.style.width = '12px';
      monthLabelsDiv.appendChild(emptyLabel);
    }

    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      const day = new Date(gridStartDate);
      day.setDate(gridStartDate.getDate() + week * 7 + dayOfWeek);

      const cell = document.createElement('div');
      cell.className = 'calendar-cell';

      if (day > today) {
        cell.style.backgroundColor = '#fff';
      } else {
        const dayStr = day.toISOString().split('T')[0];
        const count = contributions[dayStr] || 0;
        cell.style.backgroundColor = getColor(count);

        cell.addEventListener('mouseenter', (e) => {
          const tooltip = document.getElementById('tooltip');
          tooltip.style.display = 'block';
          tooltip.innerHTML = `
            <strong>${dayStr}</strong><br/>
            Visits: ${count}
          `;
        });

        cell.addEventListener('mousemove', (e) => {
          const tooltip = document.getElementById('tooltip');
          const half = window.innerWidth / 2;
          tooltip.style.left = (e.pageX > half ? e.pageX - 120 : e.pageX + 10) + 'px';
          tooltip.style.top = e.pageY + 10 + 'px';
        });

        cell.addEventListener('mouseleave', () => {
          const tooltip = document.getElementById('tooltip');
          tooltip.style.display = 'none';
        });
      }

      col.appendChild(cell);
    }

    calendarDiv.appendChild(col);
  }
}



function getColor(count) {
  if (count >= 5) return '#216e39';
  if (count >= 3) return '#30a14e';
  if (count >= 1) return '#40c463';
  return '#ebedf0';
}

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

          fetch('http://localhost:3000/api/tracking/ingest', {
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
              fetchAndRenderCalendar();
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

document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('toggleInfoBtn');
  const infoColumn = document.getElementById('infoColumn');

  toggleBtn.addEventListener('click', () => {
    const currentlyVisible = window.getComputedStyle(infoColumn).display !== 'none';
    if (currentlyVisible) {
      infoColumn.style.display = 'none';
      toggleBtn.textContent = 'Show Details ⬇️';
    } else {
      infoColumn.style.display = 'flex';
      toggleBtn.textContent = 'Hide Details ⬆️';
    }
  });
});


fetchAndRenderCalendar();
