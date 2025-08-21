import { ChatGptCollector } from './ChatgptCollector';
import { logger } from '@/lib/logger';

// Domains where the content script should respond
const allowedHosts = ['chatgpt.com', 'www.chatgpt.com'];

if (allowedHosts.includes(location.hostname)) {
  // Listen for messages from the background script triggered by context menu
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse: (response?: any) => void) => {
    console.log('Content script received message:', message);
    if (message?.type === 'saveToNotion') {
      const taskId = window.location.href.replace(/\/$/, '').split('/').pop();
      const messages: string[] = new ChatGptCollector().getAllMessages();
      logger.content.info('Collected messages', messages);

      chrome.runtime.sendMessage({
        action: message.action,
        payload: {
          domain: location.hostname,
          messages,
          taskId
        },
      }).then((result) => {
        logger.content.info('Message sent to background script', result);
        if (result?.ok) {
          alert('Task added to queue');
        } else {
          alert(result?.error || 'Failed to add task to queue');
        }
      }).catch(error => {
        logger.content.error('Error sending message to background script', error);
        alert('Failed to add task to queue: ' + (error.message || 'Unknown error'));
      });
      sendResponse({ ok: true });
      return true; // Keep message channel open for async response
    }
    return false;
  });
}


