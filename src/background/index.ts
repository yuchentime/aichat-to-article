chrome.runtime.onInstalled.addListener(async () => {
  console.log('[background] installed');

  // Enable side panel on action click if available
  try {
    await chrome.sidePanel?.setPanelBehavior?.({ openPanelOnActionClick: true });
  } catch {}

  // Ensure side panel is enabled for all existing tabs
  try {
    const tabs = await chrome.tabs?.query?.({});
    for (const tab of tabs || []) {
      if (tab.id) {
        await chrome.sidePanel?.setOptions?.({
          tabId: tab.id,
          enabled: true,
          path: 'src/pages/sidepanel/index.html'
        });
      }
    }
  } catch {}
});

chrome.runtime.onMessage.addListener((
  message: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: any) => void
) => {
  if ((message as any)?.ping) {
    console.log('[background] received ping from', sender.id, 'at', (message as any).ping);
    sendResponse({ pong: Date.now() });
    return true;
  }

  if ((message as any)?.openSidePanel) {
    (async () => {
      try {
        const windowId = sender.tab?.windowId;
        if (windowId !== undefined && chrome.sidePanel?.open) {
          await chrome.sidePanel.open({ windowId });
        } else if (sender.tab?.id && chrome.sidePanel?.setOptions) {
          // Fallback: ensure enabled on the tab
          await chrome.sidePanel.setOptions({
            tabId: sender.tab.id,
            enabled: true,
            path: 'src/pages/sidepanel/index.html'
          });
        }
        sendResponse({ ok: true });
      } catch (e) {
        console.error('[background] openSidePanel error', e);
        sendResponse({ ok: false, error: String(e) });
      }
    })();
    return true; // keep channel open for async response
  }

  return false;
});

// Keep side panel enabled as tabs change
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
 try {
   await chrome.sidePanel?.setOptions?.({
     tabId,
     enabled: true,
     path: 'src/pages/sidepanel/index.html'
   });
 } catch {}
});

chrome.tabs.onUpdated.addListener(async (tabId, info) => {
 if (info.status === 'complete') {
   try {
     await chrome.sidePanel?.setOptions?.({
       tabId,
       enabled: true,
       path: 'src/pages/sidepanel/index.html'
     });
   } catch {}
 }
});

// Example: context menu (can be enabled by adding "contextMenus" permission to manifest if needed)
try {
 chrome.contextMenus?.create({
   id: 'vite-react-ts-example',
   title: 'Vite React TS Example',
   contexts: ['page']
 });
} catch (e) {
 // ignore during reloads
}