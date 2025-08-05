// services/calendarService.js
const BASE_URL = 'http://localhost:3000';

export async function fetchAndRenderCalendarData() {
  const res = await fetch(`${BASE_URL}/api/tracking/records`);
  if (!res.ok) throw new Error(`Failed to fetch calendar data: ${res.status}`);
  const data = await res.json();

  if (!data.visits || data.visits.length === 0) {
    return {};
  }

  const contributions = {};
  data.visits.forEach((visit) => {
    const dateStr = new Date(visit.accessedAt).toISOString().split('T')[0];
    contributions[dateStr] = (contributions[dateStr] || 0) + 1;
  });

  return contributions;
}
