import { sendMessage } from '../services/chatService.js';
import { addUserMessage, addAIMessageStream, updateAIMessage } from './ChatWindow.js';

export function initChatInput(containerId = 'chatInputContainer') {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div style="display:flex;gap:8px;background:#FFFFFF;border:1px solid rgba(0,0,61,0.2);border-radius:8px;padding:8px;">
      <textarea
        id="chatInput"
        placeholder="Type your message..."
        style="flex:1;resize:none;border:1px solid #ccc;border-radius:6px;padding:6px 8px;font-size:14px;min-height:36px;outline:none;"
      ></textarea>
      <button
        id="sendChat"
        style="background:#4141FF;color:white;border:none;padding:0 16px;border-radius:6px;cursor:pointer;font-size:14px;"
      >
        Send
      </button>
    </div>
  `;

  const chatInput = container.querySelector('#chatInput');
  const sendChatBtn = container.querySelector('#sendChat');
  const chatWindowEl = document.getElementById('chatWindow'); // ✅ Grab the actual chat window DOM

  sendChatBtn.addEventListener('click', async () => {
    const message = chatInput.value.trim();
    if (!message) return;
    chatInput.value = '';

    // Optional: show local bubble before sending
    addUserMessage(message);

    // ✅ Pass chatWindow DOM node, not a callback
    await sendMessage(message, chatWindowEl);
  });

  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatBtn.click();
    }
  });
}
