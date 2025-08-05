import { initTabNavigation } from './components/TabNavigation.js';
import { initCalendar } from './components/Calendar.js';
import { initInfoPanelToggle } from './components/InfoPanelToggle.js';
import { initChatWindow } from './components/ChatWindow.js';
import { initChatInput } from './components/ChatInput.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Popup Loaded');

  // Dynamically size popup to 1/3 width and 2/3 height of screen
  const w = Math.floor(window.screen.width / 3);
  const h = Math.floor(window.screen.height * 2 / 3);
  document.documentElement.style.width = `${w}px`;
  document.documentElement.style.height = `${h}px`;
  document.body.style.width = `${w}px`;
  document.body.style.height = `${h}px`;

  // Tabs
  initTabNavigation('tabBar', [
    { id: 'tracker', label: 'Tracker', target: 'trackerTab' },
    { id: 'chat', label: 'Chat', target: 'chatTab' },
    { id: 'learn', label: 'Learn', target: 'learnTab' }
  ]);

  // Tracking panel + toggle button
  initInfoPanelToggle('trackingPanel');

  // Calendar
  initCalendar('calendar', 'monthLabels', 'tooltip');

  // Chat
  initChatWindow('chatWindow');
  initChatInput('chatInputContainer');
});
