import { logger } from '@/utils/logger';
import { hydrateState, isHydrated, getTaskState, getResult, deleteTaskById, taskState } from './lib/state';
import { submitGenerateTask, processQueue } from './lib/queue';
import { getTextByLang } from '@/common/i18n/langConst';
import { setBadgeText } from './lib/badge';
import { saveToNotion, checkIfHasNotionCookie, clearNotionCookie, searchTargets, ensureAuth } from '../api/notionApi';
import { encrypt, decrypt } from '@/utils/crypto';

export type MessageHandler = (
  message: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
) => boolean;

// 处理 ping 消息
export const handlePing: MessageHandler = (message, sender, sendResponse) => {
  console.log('[background] received ping from', sender?.id, 'at', message.ping);
  sendResponse({ pong: Date.now() });
  return false;
};

// 处理文章生成任务
export const handleGenerateArticle: MessageHandler = (message, sender, sendResponse) => {
  const { domain, messages, taskId, url } = message?.payload || {};
  if (!domain || !messages || !Array.isArray(messages) || !taskId) {
    sendResponse({ ok: false, error: 'Invalid payload' });
    return false;
  }

  submitGenerateTask(domain, url, messages, taskId, 'generateArticle', sendResponse);
  return true;
};

// 处理直接保存（预留）
export const handleDirectSave: MessageHandler = (message, sender, sendResponse) => {
  // 预留：直接保存逻辑
  return true;
};

// 处理获取结果
export const handleGetResultById: MessageHandler = (message, sender, sendResponse) => {
  getResult(message.id)
    .then((result) => {
      if (result !== null) sendResponse({ ok: true, result });
      else sendResponse({ ok: false, error: 'Result not found' });
    })
    .catch((error) => {
      logger.background.error('获取结果失败', { id: message.id, error: String(error) });
      sendResponse({ ok: false, error: String(error) });
    });
  return true;
};

// 处理获取任务状态
export const handleGetTasksState: MessageHandler = (message, sender, sendResponse) => {
  (async () => {
    try {
      if (!isHydrated()) await hydrateState();
      sendResponse({ ok: true, tasks: await getTaskState() });
    } catch (e) {
      logger.background.error('获取任务状态失败?', { error: String(e) });
      sendResponse({ ok: false, error: String(e) });
    }
  })();

  return true;
};

// 处理 Notion 认证
export const handleEnsureNotionAuth: MessageHandler = (message, sender, sendResponse) => {
  ensureAuth().then(
    me => sendResponse({ok: true, data: me}),
    err => sendResponse({ ok: false, error: String(err) })
  );
  return true;
};

// 处理保存到 Notion
export const handleSaveToNotion: MessageHandler = (message, sender, sendResponse) => {
  saveToNotion(message.payload).then(() => {
    sendResponse({ok: true});
  }).catch(err => {
    sendResponse({ok: false, message: getTextByLang(navigator.language, 'saveFailed')})
  });
  return true;
};

// 处理删除任务
export const handleDeleteTaskById: MessageHandler = (message, sender, sendResponse) => {
  (async () => {
    try {
      await deleteTaskById(message.id);
      taskState.running = taskState.running.filter(task => task.id !== message.id);
      taskState.finished = taskState.finished.filter(task => task.id !== message.id);
      setBadgeText(String(taskState.pending.length + taskState.running.length))
      processQueue();
      sendResponse({ ok: true});
    } catch (e) {
      logger.background.error('获取任务状态失败?', { error: String(e) });
      sendResponse({ ok: false, error: String(e) });
    }
  })();
  return true;
};

// 处理搜索 Notion 目标
export const handleSearchNotionTarget: MessageHandler = (message, sender, sendResponse) => {
  searchTargets(message.payload).then(
    data => sendResponse({ ok: true, data}),
    err => sendResponse({ ok: false, error: String(err) })
  );
  return true;
};

// 处理清除 Notion Cookie
export const handleClearNotionCookie: MessageHandler = (message, sender, sendResponse) => {
  clearNotionCookie().then(
    data => sendResponse({ ok: true, data}),
    err => sendResponse({ ok: false, error: String(err) })
  );
  return true;
};

// 处理检查 Notion Cookie
export const handleCheckIfHasNotionCookie: MessageHandler = (message, sender, sendResponse) => {
  checkIfHasNotionCookie().then(
    data => sendResponse({ ok: data}),
    err => sendResponse({ ok: false, error: String(err) })
  );
  return true;
};

export const handleSaveApiKey: MessageHandler = (message, sender, sendResponse) => {
  const { currentConfig } = message
  encrypt(currentConfig?.apiKey).then((encrypted) => {
      const toSave = { ...currentConfig, apiKey: encrypted };
      (async () => {
        const { apiConfig } = await chrome.storage.local.get('apiConfig');
        let configs: ApiConfig[] = [];
        if (Array.isArray(apiConfig)) configs = apiConfig;
        else if (apiConfig) configs = [apiConfig];
        const index = configs.findIndex((c) => c.provider === message?.apiConfig.provider);
        if (index >= 0) configs[index] = { ...configs[index], ...toSave };
        else configs.push(toSave);
        if (!configs.some((c) => c.currentUsing)) {
            configs[0].currentUsing = true;
        }
        await chrome.storage.local.set({ apiConfig: configs });
        sendResponse({ ok: true });
      })()
  });
  return true;
};

export const handleGetApiKey: MessageHandler = (message, sender, sendResponse) => {
  decrypt(message.encrypted).then(
    data => sendResponse({ ok: true, apiKey: data}),
    err => sendResponse({ ok: false, error: String(err) })
  );
  return true;
};
