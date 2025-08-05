export function initTabNavigation(containerId, tabsConfig = []) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Build the tab buttons dynamically
  container.innerHTML = tabsConfig
    .map(
      (tab, index) => `
      <button 
        class="tab-btn ${index === 0 ? 'active' : ''}" 
        data-tab="${tab.id}"
        style="
          padding: 4px 8px;
          cursor: pointer;
          background: #fff;
          border: 1px solid #00003D;
          border-radius: 4px;
          color: #00003D;
          font-weight: 500;
        "
      >
        ${tab.label}
      </button>
    `
    )
    .join('');

  const tabButtons = container.querySelectorAll('.tab-btn');

  // Setup click events for switching tabs
  tabButtons.forEach((btn, index) => {
    btn.addEventListener('click', () => {
      // Remove active class from all buttons
      tabButtons.forEach((b) => b.classList.remove('active'));
      // Add active to clicked button
      btn.classList.add('active');

      // Hide all tab content
      tabsConfig.forEach((tab) => {
        const content = document.getElementById(tab.target);
        if (content) content.classList.remove('active');
      });

      // Show the matching tab content
      const activeTab = tabsConfig[index];
      const targetContent = document.getElementById(activeTab.target);
      if (targetContent) targetContent.classList.add('active');
    });
  });

  // Set first tab as active by default
  if (tabsConfig.length > 0) {
    const firstTabContent = document.getElementById(tabsConfig[0].target);
    if (firstTabContent) firstTabContent.classList.add('active');
  }
}
