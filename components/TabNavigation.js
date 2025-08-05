// components/TabNavigation.js
export function initTabNavigation(containerId, tabsConfig = []) {
  const container = document.getElementById(containerId);
  if (!container || tabsConfig.length === 0) return;

  // Create the tab buttons
  container.innerHTML = tabsConfig
    .map(
      (tab, index) => `
        <button
          class="tab-btn ${index === 0 ? 'active' : ''}"
          data-target="${tab.target}"
          style="
            padding: 4px 8px;
            cursor: pointer;
            background: ${index === 0 ? '#4141FF' : '#fff'};
            border: 1px solid #00003D;
            border-radius: 4px;
            color: ${index === 0 ? 'white' : '#00003D'};
            font-weight: 500;
            transition: background 0.2s ease;
          "
        >
          ${tab.label}
        </button>
      `
    )
    .join('');

  const tabButtons = container.querySelectorAll('.tab-btn');
  const tabContents = tabsConfig.map(tab => document.getElementById(tab.target));

  function activateTab(targetId) {
    // Update button active state
    tabButtons.forEach(btn => {
      const isActive = btn.dataset.target === targetId;
      btn.classList.toggle('active', isActive);
      btn.style.background = isActive ? '#4141FF' : '#fff';
      btn.style.color = isActive ? 'white' : '#00003D';
    });

    // Update tab content visibility
    tabContents.forEach(content => {
      if (content) {
        content.classList.toggle('active', content.id === targetId);
        content.style.display = content.id === targetId ? 'flex' : 'none';
      }
    });
  }

  // Set up click handlers
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      activateTab(targetId);
    });
  });

  // Initialize with first tab active
  activateTab(tabsConfig[0].target);
}
