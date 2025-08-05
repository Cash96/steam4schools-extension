export function initChatWindow(containerId = 'chatWindow') {
  const chatWindow = document.getElementById(containerId);
  if (!chatWindow) return;

  chatWindow.innerHTML = ''; // clear on load
  chatWindow.style.height = '250px';
  chatWindow.style.overflowY = 'auto';
  chatWindow.style.border = '1px solid #00003D';
  chatWindow.style.background = '#FFFFFF';
  chatWindow.style.padding = '8px';
  chatWindow.style.borderRadius = '6px';
}

export function addUserMessage(content) {
  const chatWindow = document.getElementById('chatWindow');
  const div = document.createElement('div');
  div.style.margin = '6px 0';
  div.style.padding = '6px 8px';
  div.style.background = '#4141FF';
  div.style.color = '#FFFFFF';
  div.style.borderRadius = '6px';
  div.style.alignSelf = 'flex-end';
  div.style.maxWidth = '80%';
  div.innerHTML = `<strong>You:</strong> ${escapeHtml(content)}`;
  chatWindow.appendChild(div);
  scrollToBottom();
}

export function addAIMessageStream() {
  const chatWindow = document.getElementById('chatWindow');
  const div = document.createElement('div');
  div.style.margin = '6px 0';
  div.style.padding = '6px 8px';
  div.style.background = '#E1FFFF';
  div.style.color = '#00003D';
  div.style.border = '1px solid #00003D';
  div.style.borderRadius = '6px';
  div.style.maxWidth = '80%';
  div.innerHTML = `<strong>AI:</strong> `;
  chatWindow.appendChild(div);
  scrollToBottom();
  return div; // for live streaming
}

export function updateAIMessage(div, newContent) {
  div.innerHTML = `<strong>AI:</strong> ${escapeHtml(newContent)}`;
  scrollToBottom();
}

function scrollToBottom() {
  const chatWindow = document.getElementById('chatWindow');
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Prevent HTML injection
function escapeHtml(unsafe) {
  return unsafe.replace(/[&<"'>]/g, function (match) {
    const escapeChars = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return escapeChars[match];
  });
}
