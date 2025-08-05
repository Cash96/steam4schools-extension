import { sendMessage } from '../services/chatService.js';

export function initChatInput(containerId = 'chatInputContainer', { onMessageSent } = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Render chat input UI
  container.innerHTML = `
    <div style="display: flex; gap: 6px; margin-top: 8px;">
      <textarea 
        id="chatInput" 
        placeholder="Type your message…" 
        style="
          flex: 1; 
          resize: none; 
          padding: 6px; 
          border: 1px solid #00003D; 
          border-radius: 6px;
          font-size: 14px;
          min-height: 36px;
        "
      ></textarea>
      <button 
        id="sendChat" 
        style="
          padding: 0 12px; 
          background: #4141FF; 
          color: white; 
          border: none; 
          border-radius: 6px;
          cursor: pointer;
        "
      >
        Send
      </button>
    </div>
  `;

  const chatInput = container.querySelector('#chatInput');
  const sendChatBtn = container.querySelector('#sendChat');

  // Click to send
  sendChatBtn.addEventListener('click', async () => {
    const message = chatInput.value.trim();
    if (!message) return;

    chatInput.value = ''; // clear field
    if (onMessageSent) onMessageSent({ role: 'user', content: message });

    await sendMessage(message, onMessageSent);
  });

  // Enter to send (Shift+Enter for newline)
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatBtn.click();
    }
  });
}
