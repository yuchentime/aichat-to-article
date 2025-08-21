import { generateArticle } from '../api/chatApi';
import { logger } from '../lib/logger';

interface QueueTask {
  id: string;
  taskId: string;
  action: 'generateArticle' | 'directSave';
  domain: string;
  model: string;
  status: 'pending' | 'running' | 'finished';
  result?: string;
  error?: string;
  messages: string[];
  synced: boolean;
}

const taskQueue: QueueTask[] = [];
const taskState: Record<'pending' | 'running' | 'finished', QueueTask[]> = {
  pending: [],
  running: [],
  finished: []
};

let processing = false;

const saveState = async () => {
  logger.background.info('保存任务状态', { taskState });
  await chrome.storage.local.set({ tasks: taskState });
  logger.background.info('任务状态已保存到存储');
};

// const check

const runGenerateArticleTask = async (task: QueueTask) => {
  logger.background.info('开始执行任务', { taskId: task.id, action: task.action, domain: task.domain });
  
  const finalize = async (result?: string, error?: string) => {
    logger.background.info('完成任务处理', { taskId: task.id, hasResult: !!result, hasError: !!error });
    taskState.running = taskState.running.filter(t => t.id !== task.id);
    task.status = 'finished';
    if (result) task.result = result;
    if (error) task.error = error;
    taskState.finished.push(task);
    
    logger.background.info('任务状态已更新为已完成', { taskId: task.id });
    await saveState();
    
    logger.background.info('发送队列进度消息', { task });
    chrome.runtime.sendMessage({ type: 'queueProgress', task });
    
    processing = false;
    logger.background.info('继续处理队列中的下一个任务');
    processQueue();
  };

  try {
    logger.background.info('调用生成函数', { domain: task.domain });
    const userInput = task.messages.join('\n');
    let result = await generateArticle(userInput);
    logger.background.info('生成结果: ', result);
    finalize(result);
    logger.background.info('任务执行成功', { taskId: task.id });
  } catch (e) {
    logger.background.error('任务执行错误', { taskId: task.id, error: e });
    throw e;
  }

};

const processQueue = async () => {
  logger.background.info('处理任务队列', { queueLength: taskQueue.length, processing });
  if (processing) {
    logger.background.info('已有任务正在处理，跳过');
    return;
  }
  
  const task = taskQueue.shift();
  if (!task) {
    logger.background.info('队列为空，无任务可处理');
    return;
  }
  
  logger.background.info('开始处理任务', { taskId: task.id, action: task.action });
  processing = true;

  taskState.pending = taskState.pending.filter(t => t.id !== task.id);
  task.status = 'running';
  taskState.running.push(task);
  logger.background.info('任务状态已更新为运行中', { taskId: task.id });
  await saveState();
  
  logger.background.info('发送队列进度消息', { task });
  chrome.runtime.sendMessage({ type: 'queueProgress', task });

  // 在 MV3 的扩展 Service Worker 中，创建 Web Worker 存在兼容性/权限限制。
  // 为保证稳定性，直接在 Service Worker 主线程执行任务。
  if (task.action === 'generateArticle') {
    runGenerateArticleTask(task);
  } else if (task.action === 'directSave') {

  }
};

// 跟踪侧边栏状态
let sidePanelOpen = false;

chrome.action.onClicked.addListener((tab) => {
  // 切换侧边栏状态
  if (sidePanelOpen) {
    // 关闭侧边栏
    chrome.sidePanel.setPanelBehavior({openPanelOnActionClick: false});
    sidePanelOpen = false;
  } else {
    // 打开侧边栏
    chrome.sidePanel.setPanelBehavior({openPanelOnActionClick: true});
    sidePanelOpen = true;
  }
});

// 创建右键菜单，仅在指定域名下显示
const allowedHosts = ['chatgpt.com', 'www.chatgpt.com'];
chrome.runtime.onInstalled.addListener(() => {
  const documentUrlPatterns = allowedHosts.map(host => `*://${host}/*`);
  chrome.contextMenus.create({
    id: 'save_to_notion',
    title: 'Save to Notion',
    contexts: ['all'],
    documentUrlPatterns,
  });
  chrome.contextMenus.create({
    id: 'save_directly',
    parentId: 'save_to_notion',
    title: 'Save directly',
    contexts: ['all'],
    documentUrlPatterns,
  });
  chrome.contextMenus.create({
    id: 'generate_post',
    parentId: 'save_to_notion',
    title: 'Generate Post',
    contexts: ['all'],
    documentUrlPatterns,
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab || typeof tab.id === 'undefined') return;
  if (info.menuItemId === 'generate_post') {
    chrome.tabs.sendMessage(tab.id, { type: 'saveToNotion', action: 'generateArticle' });
  } else if (info.menuItemId === 'save_directly') {
    chrome.tabs.sendMessage(tab.id, { type: 'saveToNotion', action: 'directSave' });
  }
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
    const { domain, messages, taskId } = (message as any).payload || {};
    if (!domain || !messages || !Array.isArray(messages) || !taskId) {
      respond({ ok: false, error: 'Invalid payload' });
      return false;
    }
    logger.background.info(`收到任务请求：${taskId}, 域名：${domain}, 消息数量：${messages.length}`);
    if (taskQueue.some(t => t.taskId === taskId)) {
      logger.background.warn(`任务已存在，跳过添加：${taskId}`);
      respond({ ok: false, error: 'Task already exists' });
      return false;
    }

    chrome.storage.local.get('apiConfig')
      .then(({ apiConfig }) => {
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
        const task: QueueTask = {
          id: `task-${Date.now()}`,
          taskId,
          action,
          domain,
          model: current.model || '',
          status: 'pending',
          messages,
          synced: false,
        };
        taskQueue.push(task);
        taskState.pending.push(task);
        saveState();
        processQueue();
        respond({ ok: true, id: taskId });
      })
      .catch((err) => {
        logger.background.error('获取配置失败', err);
        respond({ ok: false, error: String(err) });
      });

    // Return true to indicate we'll respond asynchronously
    return true;
  } else if ((message as any)?.type === 'directSave') {

    return true;
  }

  return false;
});
