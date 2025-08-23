import { generateArticle } from '../api/chatApi';
import { logger } from '../lib/logger';
import { getTasksState as dbGetTasksState, putTasksState as dbPutTasksState, getResultBlob as dbGetResultBlob, putResultBlob as dbPutResultBlob } from '../lib/db';
import { getTextByLang } from '@/lib/langConst';
import { get } from 'http';

// 创建右键菜单，仅在指定域名下显示
const allowedHosts = ['chatgpt.com', 'grok.com'];

const taskQueue: Task[] = [];
const taskState: Record<'pending' | 'running' | 'finished', Task[]> = {
  pending: [],
  running: [],
  finished: []
};

let processing = false;

// Track whether we've hydrated from storage at least once in this SW lifetime
let hydrated = false;

// Merge storage state with in-memory state, preferring in-memory on conflicts.
const hydrateState = async () => {
  try {
    const persisted: Record<'pending' | 'running' | 'finished', Task[]> = (await dbGetTasksState()) || { pending: [], running: [], finished: [] };

    // Build a unified map by id; prefer current (in-memory) snapshot when duplicated
    const allPersisted = [...(persisted.pending || []), ...(persisted.running || []), ...(persisted.finished || [])];
    const allCurrent = [...taskState.pending, ...taskState.running, ...taskState.finished];
    const map = new Map<string, Task>();
    for (const t of allPersisted) map.set(t.id, t);
    for (const t of allCurrent) map.set(t.id, t); // in-memory wins

    const next: Record<'pending' | 'running' | 'finished', Task[]> = { pending: [], running: [], finished: [] };
    for (const t of map.values()) {
      // Trust each task's status to place it in the correct bucket
      if (t.status === 'pending') next.pending.push(t);
      else if (t.status === 'running') next.running.push(t);
      else next.finished.push(t);
    }

    taskState.pending = next.pending;
    taskState.running = next.running;
    taskState.finished = next.finished;
    hydrated = true;
    logger.background.info('hydrate done', {
      pending: taskState.pending.length,
      running: taskState.running.length,
      finished: taskState.finished.length,
    });
  } catch (e) {
    logger.background.error('hydrate failed', { error: String(e) });
  }
};

// todo 后面改用 IndexedDB
const saveState = async () => {
  if (!hydrated) {
    await hydrateState();
  }
  // After ensuring we are merged with persisted state, write back
  logger.background.info('save state', {
    running: taskState.running.length,
    finished: taskState.finished.length,
  });
  await dbPutTasksState(taskState);
  // await chrome.storage.local.set({ tasks: taskState });
  try { await chrome.runtime.sendMessage({ type: 'tasksStateUpdated' }); } catch {}
  logger.background.info('state persisted');
};

// 保存：以变量 id 作为键名；用 try/catch 让调用方�?await/捕获错误
const saveResult = async (id: string, result: string): Promise<void> => {
  logger.background.info('保存任务结果', { id, result });
  try {
    await dbPutResultBlob(id, result);
    logger.background.info('任务结果已保存到存储', { id });
  } catch (error) {
    logger.background.error('保存任务结果失败', { id, error: String(error) });
    throw error; // 让调用方可感知失�?  }
};

// 读取：区分“未找到”和“空字符串”；并捕获异�?
const getResult = async (id: string): Promise<string | null> => {
  logger.background.info('获取任务结果', { id });
  try {
    const blob = await dbGetResultBlob(id);
    if (blob !== null) {
      logger.background.info('result fetched from IndexedDB', { id });
      return blob; // 可能是空字符�?""
    }
    logger.background.warn('result not found (IndexedDB)', { id });
    return null;
  } catch (error) {
    logger.background.error('读取任务结果失败', { id, error: String(error) });
    return null; // 或者选择 throw，让上层处理
  }
};

const sendNotification = (title: string, message: string) => {
  // 检查浏览器通知权限
  chrome.notifications.getPermissionLevel((level) => {
    logger.background.info('通知权限级别', { level });

    if (level === 'denied') {
      logger.background.warn('notifications permission denied');
      return;
    }

    // 使用�?manifest 中一致的打包内资源路�?
    const iconUrl = chrome.runtime.getURL('src/assets/img/icon-128.png');
    const options: chrome.notifications.NotificationOptions = {
      type: 'basic',
      title,
      message,
      priority: 2,
      iconUrl, // 对于 basic 类型，iconUrl 是必�?
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
}

const runGenerateArticleTask = async (task: Task) => {
  logger.background.info('run task', { taskId: task.id, action: task.action, domain: task.domain });
  
  const finalize = async (result?: string, error?: string) => {
    logger.background.info('完成任务处理', { taskId: task.id, hasResult: !!result, hasError: !!error });
    taskState.running = taskState.running.filter(t => t.id !== task.id);
    task.status = 'finished';
    try {
      if (result) {
        const summary = [];
        const originalSummary = result.slice(0, 200).trim();
        const summaryLines = originalSummary.split('\n');
        for (let i=0; i < summaryLines.length; i++) {
          const line = summaryLines[i];
          if(line.trim() === '\n' || line.trim() === '') {
            continue;
          }
          if (line.trim().startsWith('##') || line.trim().startsWith('#')) {
            if (!task.title) task.title = line.trim().replace(/#/g, ' ').trim();
            continue;
          }
          summary.push(line.trim());
        }
        task.summary = summary.join('\n'); // 简单摘要，实际可用更复杂的逻辑
        try {
          await saveResult(task.id, result);
        } catch (e) {
          logger.background.error('保存任务结果失败', { taskId: task.id, error: String(e) });
        }
      }
      if (error) task.error = error;
      taskState.finished.push(task);

      setBadgeText(String(taskState.running.length + taskState.pending.length));

      // 发送浏览器通知
      if (result) {
        sendNotification(getTextByLang(navigator.language, 'taskFinished'), getTextByLang(navigator.language, 'taskFinishedDesc'));
      } else if (error) {
        sendNotification(getTextByLang(navigator.language, 'taskFailed'), error || getTextByLang(navigator.language, 'taskFailed'));
      }

      logger.background.info('任务状态已更新为已完成', { taskId: task.id });
      try {
        await saveState();
      } catch (e) {
        logger.background.error('save state failed', { taskId: task.id, error: String(e) });
      }

      logger.background.info('queue progress', { task });
    } finally {
      processing = false;
      logger.background.info('process next in queue');
      processQueue();
    }
  };

  const lang = navigator.language || navigator.languages?.[0] || 'en';
  try {
    logger.background.info('调用生成函数', { domain: task.domain });
    const userInput = task.messages.join('\n');
    let result = await generateArticle(userInput, lang);
    logger.background.info('生成结果: ', result);
    await finalize(result);
    logger.background.info('任务执行成功', { taskId: task.id });
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    logger.background.error('任务执行错误', { taskId: task.id, error: errMsg });
    await finalize(undefined, errMsg);
  }

};

// 设置badge文本
const setBadgeText = (text: string) => {
  chrome.action.setBadgeText({ text });
  if (text) {
    chrome.action.setBadgeBackgroundColor({ color: '#f25f20ff' });
  } else {
    chrome.action.setBadgeBackgroundColor({ color: '#808080' });
  }
}

const processQueue = async () => {
  logger.background.info('process queue', { queueLength: taskQueue.length, processing });
  if (processing) {
    logger.background.info('already processing, skip');
    return;
  }
  
  const task = taskQueue.shift();
  if (!task) {
    logger.background.info('queue empty');
    return;
  }
  
  logger.background.info('start processing', { taskId: task.id, action: task.action });
  processing = true;

  taskState.pending = taskState.pending.filter(t => t.id !== task.id);
  task.status = 'running';
  taskState.running.push(task);
  
  setBadgeText(String(taskState.running.length + taskState.pending.length));

  logger.background.info('任务状态已更新为运行中', { taskId: task.id });
  try {
    await saveState();
  } catch (e) {
    logger.background.error('保存任务状态失败?', { taskId: task.id, error: String(e) });
  }

  // �?MV3 的扩�?Service Worker 中，创建 Web Worker 存在兼容�?权限限制�?
  // 为保证稳定性，直接�?Service Worker 主线程执行任务�?
  if (task.action === 'generateArticle') {
    runGenerateArticleTask(task)
      .catch(async (e) => {
        const errMsg = e instanceof Error ? e.message : String(e);
        logger.background.error('任务执行过程中出现未捕获的异常?', { taskId: task.id, error: errMsg });
        sendNotification(getTextByLang(navigator.language, 'taskFailed'), errMsg || getTextByLang(navigator.language, 'taskFailedDesc'));
        taskState.running = taskState.running.filter(t => t.id !== task.id);
        task.status = 'finished';
        task.error = errMsg;
        taskState.finished.push(task);
        try {
          await saveState();
        } catch (err) {
          logger.background.error('保存任务状态失败?', { taskId: task.id, error: String(err) });
        }
        processing = false;
        processQueue();
      });
  } else if (task.action === 'directSave') {

  }
};

// 跟踪侧边栏状�?
let sidePanelOpen = false;

chrome.action.onClicked.addListener((tab) => {
  // 切换侧边栏状�?
  if (sidePanelOpen) {
    // 关闭侧边�?
    chrome.sidePanel.setPanelBehavior({openPanelOnActionClick: false});
    sidePanelOpen = false;
  } else {
    // 打开侧边�?
    chrome.sidePanel.setPanelBehavior({openPanelOnActionClick: true});
    sidePanelOpen = true;
  }
});

chrome.runtime.onInstalled.addListener(() => {
  // Try hydrating early on install/update
  void hydrateState();
  const documentUrlPatterns = allowedHosts.map(host => `*://${host}/*`);
  chrome.contextMenus.create({
    id: 'save_to_notion',
    title: 'Generate Post',
    contexts: ['all'],
    documentUrlPatterns,
  });

  // chrome.contextMenus.create({
  //   id: 'save_directly',
  //   parentId: 'save_to_notion',
  //   title: 'Save directly',
  //   contexts: ['all'],
  //   documentUrlPatterns,
  // });
  // chrome.contextMenus.create({
  //   id: 'generate_post',
  //   parentId: 'save_to_notion',
  //   title: 'Generate Post',
  //   contexts: ['all'],
  //   documentUrlPatterns,
  // });
});

// Hydrate on browser startup to reduce first-write races
chrome.runtime.onStartup?.addListener(() => {
  void hydrateState();
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab || typeof tab.id === 'undefined') return;
  if (info.menuItemId === 'save_to_notion') {
    chrome.tabs.sendMessage(tab.id, { type: 'saveToNotion', action: 'generateArticle' });
  } 
  // else if (info.menuItemId === 'save_directly') {
  //   chrome.tabs.sendMessage(tab.id, { type: 'saveToNotion', action: 'directSave' });
  // }
});


chrome.runtime.onMessage.addListener((
  message: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
): boolean => {
  logger.background.info('收到消息', message);
  const respond = (payload?: any) => (sendResponse as unknown as (response?: any) => void)(payload);
  if ((message as any)?.ping) {
    console.log('[background] received ping from', sender?.id, 'at', (message as any).ping);
    respond({ pong: Date.now() });
    return false;
  }
  const action = (message as any)?.action
  if (action === 'generateArticle') {
    const { domain, messages, taskId, url } = (message as any).payload || {};
    if (!domain || !messages || !Array.isArray(messages) || !taskId) {
      respond({ ok: false, error: 'Invalid payload' });
      return false;
    }
    logger.background.info(`收到任务请求�?{taskId}, 域名�?{domain}, 消息数量�?{messages.length}`);
    if (taskQueue.some(t => t.taskId === taskId && (t.status === 'pending' || t.status === 'running'))) {
      logger.background.warn(`任务已存在，跳过添加�?{taskId}`);
      respond({ ok: false, error: 'Task already exists' });
      return false;
    }

    submitTask(domain, url, messages, taskId, 'generateArticle', respond);

    // Return true to indicate we'll respond asynchronously
    return true;
  } else if ((message as any)?.action === 'directSave') {

    return true;
  } else if((message as any)?.type === 'getResultById') {
    getResult((message as any).id).then((result) => {
      if (result) {
        respond({ ok: true, result });
      } else {
        respond({ ok: false, error: 'Result not found' });
      }
    }).catch((error) => {
      logger.background.error('获取结果失败', { id: (message as any).id, error: String(error) });
      respond({ ok: false, error: String(error) });
    });
    return true; // Keep message channel open for async response
  } else if ((message as any)?.type === 'getTasksState') {
    (async () => {
      try {
        if (!hydrated) {
          await hydrateState();
        }
        respond({ ok: true, tasks: taskState });
      } catch (e) {
        logger.background.error('获取任务状态失败?', { error: String(e) });
        respond({ ok: false, error: String(e) });
      }
    })();
    return true;

  }

  return false;
});

const submitTask = async (domain: string, url: string, messages: string[], taskId: string
  , action: 'generateArticle' | 'directSave', respond: any) => {
    try {
      const { apiConfig } = await chrome.storage.local.get('apiConfig');
      logger.background.info('获取API配置', { apiConfig });
      
      if (!apiConfig || (Array.isArray(apiConfig) && apiConfig.length === 0)) {
        logger.background.error('没有可用的API配置');
        respond({ ok: false, error: 'No API configuration available' });
        return;
      }
      
      let configs: any[] = [];
      if (Array.isArray(apiConfig)) configs = apiConfig;
      else if (apiConfig) configs = [apiConfig];
      const current = configs.find((c: any) => c.currentUsing) || configs[0] || {};
      const task: Task = {
        id: `task-${Date.now()}`,
        taskId,
        action,
        domain,
        model: current.model || '',
        status: 'pending',
        messages,
        synced: false,
        url
      };
      taskQueue.push(task);
      taskState.pending.push(task);
      
      await saveState();
      processQueue();
      respond({ ok: true, id: taskId });
    } catch (err) {
      logger.background.error('获取配置失败', err);
      sendNotification(getTextByLang(navigator.language, 'taskFailed'), getTextByLang(navigator.language, 'taskFailedDesc'));
      respond({ ok: false, error: String(err) });
    }
  }
}