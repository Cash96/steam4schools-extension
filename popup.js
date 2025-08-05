import { initTabNavigation } from './components/TabNavigation.js';
import { initCalendar } from './components/Calendar.js';
import { initTrackingPanel } from './components/TrackingPanel.js';
import { initInfoPanelToggle } from './components/InfoPanelToggle.js';
import { initChatWindow } from './components/ChatWindow.js';
import { initChatInput } from './components/ChatInput.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Popup Loaded');

  // --- Tabs ---
  initTabNavigation('tabBar', [
    { id: 'tracker', label: 'Tracker', target: 'trackerTab' },
    { id: 'chat', label: 'Chat', target: 'chatTab' },
    { id: 'learn', label: 'Learn', target: 'learnTab' }
  ]);

  // --- Tracker tab setup ---
  initTrackingPanel('trackingPanel'); // renders tracker stats + refresh btn
  initInfoPanelToggle();              // show/hide extra info
  initCalendar('calendar', 'monthLabels', 'tooltip'); // render contribution calendar

  // --- Chat tab setup ---
  initChatWindow('chatWindow');       // renders chat window
  initChatInput('chatInputContainer'); // attaches input & send logic
});
