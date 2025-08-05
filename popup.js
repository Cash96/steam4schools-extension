import { initTabNavigation } from './components/TabNavigation.js';
import { initCalendar } from './components/Calendar.js';
import { initInfoPanelToggle } from './components/InfoPanelToggle.js';
import { initChatWindow, addUserMessage, addAIMessageStream, updateAIMessage } from './components/ChatWindow.js';
import { initChatInput } from './components/ChatInput.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Popup Loaded');

  initTabNavigation('tabBar', [
    { id: 'tracker', label: 'Tracker', target: 'trackerTab' },
    { id: 'chat', label: 'Chat', target: 'chatTab' },
    { id: 'learn', label: 'Learn', target: 'learnTab' }
  ]);

  initInfoPanelToggle('trackingPanel');
  initCalendar('calendar', 'monthLabels', 'tooltip');

  // Chat setup with onMessageSent
  initChatWindow('chatWindow');
  initChatInput('chatInputContainer', {
    onMessageSent: ({ role, content }) => {
      if (role === 'user') {
        addUserMessage(content);
      } else if (role === 'assistant') {
        addAIMessageStream(content);
      }
    }
  });
});
