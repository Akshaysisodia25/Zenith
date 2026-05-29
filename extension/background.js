async function getZenithTabId() {
  const data = await chrome.storage.session.get('zenithTabId');
  return data ? data.zenithTabId : null;
}

async function setZenithTabId(id) {
  await chrome.storage.session.set({ zenithTabId: id });
}

function isZenithFocusTab(url) {
  return url && url.includes('session.html');
}

// On startup, detect any already-open Zenith session tab
async function initializeZenithTab() {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (isZenithFocusTab(tab.url)) {
      await setZenithTabId(tab.id);
      return;
    }
  }
}

chrome.runtime.onInstalled.addListener(initializeZenithTab);
chrome.runtime.onStartup.addListener(initializeZenithTab);

// Track when user enters or leaves the Zenith session page
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return;

  if (isZenithFocusTab(tab.url)) {
    await setZenithTabId(tabId);
    return;
  }

  // Non-Zenith tab loaded while active — maybe inject warning
  const zenithTabId = await getZenithTabId();
  if (zenithTabId && tabId !== zenithTabId && tab.active) {
    await maybeInjectWarning(tabId);
  }
});

// User switched to a different tab
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const zenithTabId = await getZenithTabId();
  if (zenithTabId && activeInfo.tabId !== zenithTabId) {
    await maybeInjectWarning(activeInfo.tabId);
  }
});

// Zenith tab closed — clear session tracking
chrome.tabs.onRemoved.addListener(async (tabId) => {
  const zenithTabId = await getZenithTabId();
  if (tabId === zenithTabId) {
    await chrome.storage.session.remove('zenithTabId');
  }
});

// Return user to Zenith tab
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'returnToZenith') {
    (async () => {
      const zenithTabId = await getZenithTabId();
      if (zenithTabId) {
        try {
          const zTab = await chrome.tabs.get(zenithTabId);
          await chrome.windows.update(zTab.windowId, { focused: true });
          await chrome.tabs.update(zenithTabId, { active: true });
        } catch {
          await chrome.storage.session.remove('zenithTabId');
        }
      }
    })();
    return true;
  }
});

// Check session state before injecting — don't warn if paused/stopped/complete
async function maybeInjectWarning(tabId) {
  const zenithTabId = await getZenithTabId();
  if (!zenithTabId) return;

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: zenithTabId },
      func: () => localStorage.getItem('zenith_session_active')
    });
    const state = results && results[0] && results[0].result;
    // Only enforce focus when session is explicitly active
    if (state !== 'active') return;
  } catch {
    // Can't read Zenith tab — skip injection
    return;
  }

  await injectWarning(tabId);
}

async function injectWarning(tabId) {
  try {
    await chrome.scripting.insertCSS({ target: { tabId }, files: ['content.css'] });
    await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
  } catch {
    // Cannot inject into chrome:// or other restricted pages
  }
}
