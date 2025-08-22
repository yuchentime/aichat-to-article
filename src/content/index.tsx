import {CollectorFactory} from '@/lib/collector/CollectorFactory';
import { logger } from '@/lib/logger';
import { showToast } from '@/lib/toast';

// Domains where the content script should respond
const allowedHosts = ['chatgpt.com', 'grok.com'];
const collectorFactory = new CollectorFactory();

if (allowedHosts.includes(location.hostname)) {
  // Listen for messages from the background script triggered by context menu
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse: (response?: any) => void) => {
    console.log('Content script received message:', message);
    if (message?.type === 'saveToNotion') {
      const taskId = window.location.href.replace(/\/$/, '').split('/').pop();
      const messages: string[] = collectorFactory.getCollectorInstance(location.hostname).getAllMessages();
      logger.content.info('Collected messages', messages);
      if (messages.length === 0) {
        showToast('warn', 'No messages found to save');
        sendResponse({ ok: false, error: 'No messages found' });
        return true; // Keep message channel open for async response
      }

      chrome.runtime.sendMessage({
        action: message.action,
        payload: {
          domain: location.hostname,
          messages,
          taskId,
          url: window.location.href,
        },
      }).then((result) => {
        logger.content.info('Message sent to background script', result);
        if (result?.ok) {
          showToast('info', 'Task added to queue');
        } else {
          showToast('error', 'Failed to add task to queue');
        }
      }).catch(error => {
        logger.content.error('Error sending message to background script', error);
        showToast('error', 'Failed to add task to queue: ' + (error.message || 'Unknown error'));
      });
      sendResponse({ ok: true });
      return true; // Keep message channel open for async response
    }
    return false;
  });
}


