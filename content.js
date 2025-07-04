let intervalId = null;
let active = true;

const log = (msg) => {
  try {
    console.log(msg);
  } catch { /* ignore */ }
};

const safeSendMessage = (msg) => {
  if (!active) return;

  try {
    chrome.runtime.sendMessage(msg, () => {
      if (chrome.runtime.lastError) {
        log('⚠️ Message failed: ' + chrome.runtime.lastError.message);
        deactivate();
      }
    });
  } catch (err) {
    log('⚠️ Exception sending message: ' + err);
    deactivate();
  }
};

const deactivate = () => {
  if (!active) return;
  active = false;

  try {
    cleanup();
  } catch {
    // ignore
  }
};

// Sends activity ping if still valid
const sendActivity = () => {
  safeSendMessage({ type: 'userActivity' });
};

// Sends video state ping if still valid
const sendVideoState = () => {
  const playing = Array.from(document.querySelectorAll('video')).some(v => !v.paused);
  safeSendMessage({ type: 'videoPlaying', playing });
};

// Clean up timers and listeners
const cleanup = () => {
  try {
    clearInterval(intervalId);
    document.removeEventListener('mousemove', sendActivity);
    document.removeEventListener('keydown', sendActivity);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('beforeunload', cleanup);
    log('✅ Content script cleaned up');
  } catch {
    // already gone
  }
};

const onVisibilityChange = () => {
  if (document.visibilityState === 'hidden') {
    deactivate();
  }
};

// Start tracking
document.addEventListener('mousemove', sendActivity);
document.addEventListener('keydown', sendActivity);
document.addEventListener('visibilitychange', onVisibilityChange);
window.addEventListener('beforeunload', cleanup);

intervalId = setInterval(sendVideoState, 2000);

log('🎯 Content script initialized');
