export function initInfoPanelToggle(containerId = 'trackingPanel') {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Render toggle button + info column
  container.innerHTML += `
    <button 
      id="toggleInfoBtn" 
      style="
        font-size: 12px;
        cursor: pointer;
        margin-bottom: 6px;
        background: #fff;
        color: #00003D;
        border: 1px solid #00003D;
        padding: 4px 8px;
        border-radius: 4px;
        font-weight: 500;
      "
    >
      Show Details ⬇️
    </button>
    <div 
      id="infoColumn" 
      style="
        display: none;
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
        font-size: 13px;
        margin-bottom: 8px;
        color: #00003D;
      "
    >
      <div id="time">⏳ Current: 0s</div>
      <div id="dbTotal">📊 DB Total: 0s</div>
      <div id="sinceLastUpload">🕒 Since Last Upload: N/A</div>
    </div>
  `;

  const toggleBtn = container.querySelector('#toggleInfoBtn');
  const infoColumn = container.querySelector('#infoColumn');

  toggleBtn.addEventListener('click', () => {
    const currentlyVisible = infoColumn.style.display !== 'none';
    if (currentlyVisible) {
      infoColumn.style.display = 'none';
      toggleBtn.textContent = 'Show Details ⬇️';
    } else {
      infoColumn.style.display = 'flex';
      toggleBtn.textContent = 'Hide Details ⬆️';
    }
  });
}
