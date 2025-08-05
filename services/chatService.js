const BASE_URL = 'http://localhost:3000';

/**
 * Sends a chat message to the assistant and streams the reply.
 * @param {string} message - The user message to send.
 * @param {HTMLElement} chatWindow - The chat window element where messages will appear.
 * @param {string} chatAssistantId - The ID of the chat assistant to send the message to.
 */
export async function sendMessage(message, chatWindow, chatAssistantId = 'asst_taps76CqiH8NirfurpM0Gnc5') {
  if (!message || !message.trim() || !chatWindow) return;

  // --- Show user message immediately ---
  const userMessageDiv = document.createElement('div');
  userMessageDiv.style.margin = '4px 0';
  userMessageDiv.innerHTML = `<strong>You:</strong> ${message}`;
  chatWindow.appendChild(userMessageDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  // --- Retrieve existing thread ID from Chrome storage ---
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

    // --- Create AI message placeholder ---
    let assistantMsg = '';
    const aiMessageDiv = document.createElement('div');
    aiMessageDiv.style.margin = '4px 0';
    aiMessageDiv.innerHTML = `<strong>AI:</strong> `;
    chatWindow.appendChild(aiMessageDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;

    // --- Read and stream chunks from response ---
    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      assistantMsg += chunk;

      aiMessageDiv.innerHTML = `<strong>AI:</strong> ${assistantMsg}`;
      chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    // --- Save new thread ID if provided ---
    const newThreadIdHeader = res.headers.get('x-thread-id');
    if (newThreadIdHeader) {
      await chrome.storage.local.set({ chatThreadId: newThreadIdHeader });
      console.log('💾 Saved chatThreadId:', newThreadIdHeader);
    }
  } catch (err) {
    console.error('⚠️ Error during chat fetch:', err);
  }
}

/**
 * Loads the chat history for the current thread and appends it to the chat window.
 * @param {HTMLElement} chatWindow - The chat window element where history will appear.
 */
export async function loadChatHistory(chatWindow) {
  if (!chatWindow) return;

  chatWindow.innerHTML = ''; // Clear previous content

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
      console.error('❌ Invalid chat history response format.');
      return;
    }

    // --- Render previous messages ---
    for (const msg of data.messages) {
      const div = document.createElement('div');
      div.style.margin = '4px 0';
      div.innerHTML = `<strong>${msg.role === 'user' ? 'You' : 'AI'}:</strong> ${msg.content}`;
      chatWindow.appendChild(div);
    }

    chatWindow.scrollTop = chatWindow.scrollHeight;
  } catch (err) {
    console.error('⚠️ Error fetching chat history:', err);
  }
}
