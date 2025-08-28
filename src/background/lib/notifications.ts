import { logger } from '@/utils/logger';

export const sendNotification = (title: string, message: string) => {
  chrome.notifications.getPermissionLevel((level) => {
    logger.background.info('通知权限级别', { level });
    if (level === 'denied') {
      logger.background.warn('notifications permission denied');
      return;
    }

    const iconUrl = chrome.runtime.getURL('src/assets/img/icon-128.png');
    const options: chrome.notifications.NotificationOptions = {
      type: 'basic',
      title,
      message,
      priority: 2,
      iconUrl,
    } as any;

    logger.background.info('创建通知', { title, message, iconUrl });

    chrome.notifications.create(options, (notificationId) => {
      const lastError = chrome.runtime.lastError?.message;
      if (lastError) {
        logger.background.error('notification send failed', { error: lastError, title, message, iconUrl });
        return;
      }
      if (notificationId) {
        logger.background.info('notification sent', { notificationId, title, message });
      } else {
        logger.background.error('notification send failed (unknown)', { title, message });
      }
    });
  });
};

