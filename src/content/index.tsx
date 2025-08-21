import { ChatGptCollector } from './ChatgptCollector';
import { logger } from '@/lib/logger';

// Domains where the content script should respond
const allowedHosts = ['chatgpt.com', 'www.chatgpt.com'];

if (allowedHosts.includes(location.hostname)) {
  // Listen for messages from the background script triggered by context menu
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === 'saveToNotion') {
      const taskId = window.location.href.replace(/\/$/, '').split('/').pop();
      const messages = new ChatGptCollector().getAllMessages();
      logger.content.info('Collected messages', messages);

      chrome.runtime.sendMessage({
        type: 'queueGenerate',
        payload: {
          domain: location.hostname,
          messages,
          taskId,
          action: message.action || 'generate',
        },
      });
      alert('Task added to queue');
      sendResponse({ ok: true });
    }
  });
}

