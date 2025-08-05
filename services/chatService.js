const BASE_URL = 'http://localhost:3000';

/**
 * Get the active tab's title and text content
 */
function getActivePageContext() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]?.id) return resolve(null);

      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          func: () => ({
            title: document.title,
            content: document.body.innerText
          })
        },
        (results) => {
          if (!results || !results[0]?.result) return resolve(null);
          resolve(results[0].result);
        }
      );
    });
  });
}

/**
 * Very basic markdown → HTML conversion
 */
function markdownToHtml(markdown) {
  return markdown
    .replace(/(?:\r\n|\r|\n)/g, '<br>') // line breaks
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // bold
    .replace(/\*(.*?)\*/g, '<em>$1</em>') // italics
    .replace(/`(.*?)`/g, '<code>$1</code>') // inline code
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>'); // links
}

/**
 * Sends a chat message to the assistant and streams the reply.
 * NO LONGER appends user message — ChatInput handles that.
 */
export async function sendMessage(message, chatWindow, chatAssistantId = 'asst_taps76CqiH8NirfurpM0Gnc5') {
  if (!message || !message.trim() || !chatWindow) return;

  // --- Get current page info ---
  const page = await getActivePageContext();

  // --- Build contextual message ---
  let contextualMessage = message.trim();
  if (page) {
    contextualMessage = `
You are assisting the user while they are viewing the following web page.

Page title: ${page.title}
Page content (excerpt): ${page.content.slice(0, 2000)}

Use this context to answer the user's question.

User's question: ${message.trim()}
    `;
  }

  // --- Retrieve existing thread ID from Chrome storage ---
  const { chatThreadId } = await chrome.storage.local.get('chatThreadId');

  const body = {
    message: contextualMessage,
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
    aiMessageDiv.style.margin = '6px 0';
    aiMessageDiv.style.alignSelf = 'flex-start';
    aiMessageDiv.style.background = '#FFFFFF';
    aiMessageDiv.style.color = '#00003D';
    aiMessageDiv.style.padding = '8px 12px';
    aiMessageDiv.style.border = '1px solid rgba(0,0,61,0.2)';
    aiMessageDiv.style.borderRadius = '12px';
    aiMessageDiv.style.maxWidth = '80%';
    aiMessageDiv.style.fontSize = '14px';
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

      // Render as HTML so markdown works
      aiMessageDiv.innerHTML = markdownToHtml(assistantMsg);
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

    for (const msg of data.messages) {
      const div = document.createElement('div');
      div.style.margin = '6px 0';
      div.style.alignSelf = msg.role === 'user' ? 'flex-end' : 'flex-start';
      div.style.background = msg.role === 'user' ? '#4141FF' : '#FFFFFF';
      div.style.color = msg.role === 'user' ? '#FFFFFF' : '#00003D';
      div.style.padding = '8px 12px';
      div.style.borderRadius = '12px';
      div.style.maxWidth = '80%';
      div.style.fontSize = '14px';
      div.innerHTML = markdownToHtml(msg.content);
      chatWindow.appendChild(div);
    }

    chatWindow.scrollTop = chatWindow.scrollHeight;
  } catch (err) {
    console.error('⚠️ Error fetching chat history:', err);
  }
}
