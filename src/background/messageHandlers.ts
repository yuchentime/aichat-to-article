import { logger } from '@/utils/logger';
import { hydrateState, isHydrated, getTaskState, getResult, deleteTaskById, taskState } from './lib/state';
import { submitGenerateTask, processTaskQueue } from '../core/taskQueue';
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
      processTaskQueue();
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

export const handleSaveApiKey: MessageHandler = (message, _sender, sendResponse) => {
  (async () => {
    try {
      const { currentConfig } = message; // 期望包含 { provider, apiKey, ... }
      if (!currentConfig?.provider) {
        sendResponse({ ok: false, error: 'provider 缺失' });
        return;
      }

      const encrypted = await encrypt(currentConfig.apiKey ?? '');
      const toSave: ApiConfig = { ...currentConfig, apiKey: encrypted };

      // 读取存储
      const { apiConfig } = await chrome.storage.local.get('apiConfig');
      let configs: ApiConfig[] = Array.isArray(apiConfig)
        ? apiConfig
        : apiConfig
        ? [apiConfig]
        : [];

      const norm = (s: unknown) =>
        typeof s === 'string' ? s.toLowerCase() : String(s ?? '');

      // 用 currentConfig.provider 对比
      const idx = configs.findIndex(c => norm(c.provider) === norm(toSave.provider));

      if (idx >= 0) {
        // 覆盖同 provider 的项；默认保留原来的 currentUsing（除非 toSave 显式给了）
        const keepCurrentUsing = configs[idx].currentUsing && toSave.currentUsing == null;
        configs[idx] = { ...configs[idx], ...toSave, ...(keepCurrentUsing ? { currentUsing: true } : {}) };
      } else {
        // 新 provider：若当前没有任何 currentUsing，则把这个设为当前
        const anyUsing = configs.some(c => c.currentUsing);
        configs.push({ ...toSave, ...(anyUsing ? {} : { currentUsing: true }) });
      }

      // 兜底：确保最多只有一个 currentUsing（保留最后一次更新/新增的那一个）
      const activeIndices = configs.reduce<number[]>((acc, c, i) => (c.currentUsing ? acc.concat(i) : acc), []);
      if (activeIndices.length > 1) {
        const keep = idx >= 0 ? idx : configs.length - 1;
        configs = configs.map((c, i) => ({ ...c, currentUsing: i === keep }));
      }

      await chrome.storage.local.set({ apiConfig: configs });
      sendResponse({ ok: true });
    } catch (err) {
      console.error(err);
      sendResponse({ ok: false, error: String(err) });
    }
  })();

  // 告诉 Chrome 这是异步响应
  return true;
};

export const handleGetApiKey: MessageHandler = (message, sender, sendResponse) => {
  decrypt(message.encrypted).then(
    data => sendResponse({ ok: true, apiKey: data}),
    err => sendResponse({ ok: false, error: String(err) })
  );
  return true;
};
