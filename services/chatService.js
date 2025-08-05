import { addAIMessageStream, updateAIMessage } from '../components/ChatWindow.js';

const BASE_URL = 'http://localhost:3000';

export async function sendMessage(
  message,
  onMessageSent,
  chatAssistantId = 'asst_taps76CqiH8NirfurpM0Gnc5'
) {
  if (!message || !message.trim()) return;

  // Show user message only via the callback — NO fallback and no "You:" prefix
  if (typeof onMessageSent === 'function') {
    onMessageSent({ role: 'user', content: message });
  }

  const { chatThreadId } = await chrome.storage.local.get('chatThreadId');

  const body = {
    message: message.trim(),
    chatAssistantId,
    threadId: chatThreadId || null,
  };

  try {
    const res = await fetch(`${BASE_URL}/api/chat/user-stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok || !res.body) {
      console.error('❌ Failed to stream response from assistant.');
      return;
    }

    // Create empty AI message bubble
    const aiDiv = addAIMessageStream();
    let accumulated = '';

    // Stream chunks into the AI bubble
    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      accumulated += chunk;
      updateAIMessage(aiDiv, accumulated); // No "AI:" prefix
    }

    // Save new thread ID if provided
    const newThreadId = res.headers.get('x-thread-id');
    if (newThreadId) {
      await chrome.storage.local.set({ chatThreadId: newThreadId });
      console.log('💾 Saved new thread ID:', newThreadId);
    }
  } catch (err) {
    console.error('⚠️ Chat streaming error:', err);
  }
}

export async function loadChatHistory(chatWindow) {
  if (!chatWindow) return;

  chatWindow.innerHTML = '';

  const { chatThreadId } = await chrome.storage.local.get('chatThreadId');
  if (!chatThreadId) {
    console.log('ℹ️ No existing threadId, skipping history load.');
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/api/chat/thread-history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threadId: chatThreadId }),
    });

    if (!res.ok) {
      console.error('❌ Failed to fetch chat history.');
      return;
    }

    const data = await res.json();
    if (!Array.isArray(data.messages)) {
      console.error('❌ Invalid chat history format.');
      return;
    }

    for (const msg of data.messages) {
      const div = document.createElement('div');
      div.style.margin = '4px 0';
      div.textContent = msg.content; // No role prefix
      chatWindow.appendChild(div);
    }

    chatWindow.scrollTop = chatWindow.scrollHeight;
  } catch (err) {
    console.error('⚠️ Error fetching chat history:', err);
  }
}
