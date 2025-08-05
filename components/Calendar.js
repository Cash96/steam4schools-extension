// components/Calendar.js
import { fetchAndRenderCalendarData } from '../services/calendarService.js';

export function initCalendar(calendarPanel = 'calendar', monthLabelsId = 'monthLabels', tooltipId = 'tooltip') {
  const calendarDiv = document.getElementById(calendarPanel);
  const monthLabelsDiv = document.getElementById(monthLabelsId);
  const tooltip = document.getElementById(tooltipId);

  if (!calendarDiv || !monthLabelsDiv) {
    console.warn('⚠️ Calendar DOM elements not found.');
    return;
  }

  fetchAndRenderCalendarData()
    .then((contributions) => {
      renderCalendar(contributions, calendarDiv, monthLabelsDiv, tooltip);
    })
    .catch((err) => {
      console.error('❌ Failed to initialize calendar:', err);
      calendarDiv.innerHTML = '';
    });
}

export function renderCalendar(contributions, calendarDiv, monthLabelsDiv, tooltip) {
  // Reset existing content
  calendarDiv.innerHTML = '';
  monthLabelsDiv.innerHTML = '';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const numDays = 365;
  const firstDate = new Date(today);
  firstDate.setDate(firstDate.getDate() - (numDays - 1));

  const firstDayOfWeek = firstDate.getDay();
  const gridStartDate = new Date(firstDate);
  gridStartDate.setDate(gridStartDate.getDate() - firstDayOfWeek);

  const totalWeeks = Math.ceil((today - gridStartDate) / (7 * 24 * 60 * 60 * 1000));
  let currentMonth = null;

  for (let week = 0; week < totalWeeks; week++) {
    const col = document.createElement('div');
    col.className = 'calendar-column';

    const weekStart = new Date(gridStartDate);
    weekStart.setDate(gridStartDate.getDate() + week * 7);

    const month = weekStart.toLocaleString('default', { month: 'short' });
    if (currentMonth !== month) {
      const monthLabel = document.createElement('div');
      monthLabel.textContent = month;
      monthLabel.className = 'calendar-month-label';
      monthLabelsDiv.appendChild(monthLabel);
      currentMonth = month;
    } else {
      const emptyLabel = document.createElement('div');
      emptyLabel.className = 'calendar-empty-label';
      monthLabelsDiv.appendChild(emptyLabel);
    }

    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      const day = new Date(gridStartDate);
      day.setDate(gridStartDate.getDate() + week * 7 + dayOfWeek);

      const cell = document.createElement('div');
      cell.className = 'calendar-cell';

      if (day > today) {
        cell.classList.add('calendar-cell-empty');
      } else {
        const dayStr = day.toISOString().split('T')[0];
        const count = contributions[dayStr] || 0;
        cell.style.backgroundColor = getColor(count);

        if (tooltip) {
          cell.addEventListener('mouseenter', () => {
            tooltip.style.display = 'block';
            tooltip.innerHTML = `<strong>${dayStr}</strong><br/>Visits: ${count}`;
          });

          cell.addEventListener('mousemove', (e) => {
            const half = window.innerWidth / 2;
            tooltip.style.left = (e.pageX > half ? e.pageX - 120 : e.pageX + 10) + 'px';
            tooltip.style.top = e.pageY + 10 + 'px';
          });

          cell.addEventListener('mouseleave', () => {
            tooltip.style.display = 'none';
          });
        }
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
