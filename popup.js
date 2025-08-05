import { initTabNavigation } from './components/TabNavigation.js';
import { initCalendar } from './components/Calendar.js';
import { initInfoPanelToggle } from './components/InfoPanelToggle.js';
import { initChatWindow } from './components/ChatWindow.js';
import { initChatInput } from './components/ChatInput.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Popup Loaded');

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
