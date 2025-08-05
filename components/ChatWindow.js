export function initChatWindow(containerId = "chatWindow") {
  const chatWindow = document.getElementById(containerId);
  if (!chatWindow) return;

  chatWindow.innerHTML = "";
  chatWindow.style.flex = "1";
  chatWindow.style.minHeight = "0";
  chatWindow.style.overflowY = "auto";
  chatWindow.style.display = "flex";
  chatWindow.style.flexDirection = "column";
  chatWindow.style.gap = "8px";
  chatWindow.style.padding = "12px";
  chatWindow.style.background = "#E1FFFF";
}

export function addUserMessage(content) {
  const chatWindow = document.getElementById("chatWindow");
  const div = document.createElement("div");
  div.className = "chat-bubble user";
  div.innerHTML = `${escapeHtml(content)}`;
  styleUserBubble(div);
  animateFadeUp(div);
  chatWindow.appendChild(div);
  scrollToBottom();
}

export function addAIMessageStream() {
  const chatWindow = document.getElementById("chatWindow");
  const div = document.createElement("div");
  div.className = "chat-bubble ai";
  div.innerHTML = ``;
  styleAIBubble(div);
  animateFadeIn(div);
  chatWindow.appendChild(div);
  scrollToBottom();
  return div;
}

export function updateAIMessage(div, newContent) {
  div.innerHTML = `${escapeHtml(newContent)}`;
  scrollToBottom();
}

// === Styles ===
function styleUserBubble(div) {
  div.style.alignSelf = "flex-end";
  div.style.background = "#4141FF";
  div.style.color = "#FFFFFF";
  div.style.padding = "8px 12px";
  div.style.borderRadius = "12px";
  div.style.maxWidth = "80%";
  div.style.fontSize = "14px";
  div.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
}

function styleAIBubble(div) {
  div.style.alignSelf = "flex-start";
  div.style.background = "#FFFFFF";
  div.style.color = "#00003D";
  div.style.padding = "8px 12px";
  div.style.border = "1px solid rgba(0,0,61,0.2)";
  div.style.borderRadius = "12px";
  div.style.maxWidth = "80%";
  div.style.fontSize = "14px";
  div.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";
}

// === Utility ===
function scrollToBottom() {
  const chatWindow = document.getElementById("chatWindow");
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function animateFadeUp(el) {
  el.style.opacity = "0";
  el.style.transform = "translateY(20px)";
  requestAnimationFrame(() => {
    el.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    el.style.opacity = "1";
    el.style.transform = "translateY(0)";
  });
}

function animateFadeIn(el) {
  el.style.opacity = "0";
  requestAnimationFrame(() => {
    el.style.transition = "opacity 0.3s ease";
    el.style.opacity = "1";
  });
}

function escapeHtml(unsafe) {
  return unsafe.replace(
    /[&<"'>]/g,
    (match) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      }[match])
  );
}
