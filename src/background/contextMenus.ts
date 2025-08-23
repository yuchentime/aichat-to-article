import { logger } from '@/lib/logger';

export const ensureContextMenus = (allowedHosts: string[]) => {
  const documentUrlPatterns = allowedHosts.map((host) => `*://${host}/*`);
  try {
    chrome.contextMenus.removeAll(() => {
      void chrome.contextMenus.create({
        id: 'save_to_notion',
        title: 'Generate Post',
        contexts: ['all'],
        documentUrlPatterns,
      });
    });
  } catch (e) {
    try {
      chrome.contextMenus.create({
        id: 'save_to_notion',
        title: 'Generate Post',
        contexts: ['all'],
        documentUrlPatterns,
      });
    } catch (err) {
      logger.background.error('ensureContextMenus failed', { error: String(err) });
    }
  }
};

export const registerContextMenuClickHandler = () => {
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (!tab || typeof tab.id === 'undefined') return;
    if (info.menuItemId === 'save_to_notion') {
      chrome.tabs.sendMessage(tab.id, { type: 'saveToNotion', action: 'generateArticle' });
    }
  });
};

