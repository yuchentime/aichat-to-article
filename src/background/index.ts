import { generateArticle } from '../api/chatApi';
import { logger } from '../lib/logger';

interface QueueTask {
  id: string;
  action: 'generate' | 'summary';
  domain: string;
  status: 'pending' | 'running' | 'finished';
  result?: string;
  error?: string;
  messages: Message[];
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

const runTask = async (task: QueueTask): Promise<string> => {
  logger.background.info('开始执行任务', { taskId: task.id, action: task.action, domain: task.domain });
  try {
    let result: string;
    if (task.action === 'generate') {
      logger.background.info('调用生成函数', { domain: task.domain });
      result = await generateArticle(JSON.stringify(task.messages));
      logger.background.info('生成函数执行完成', { resultLength: result.length });
      logger.background.info('生成结果: ', result);
      task.result = result;
      task.status = 'finished';
      saveState();
    } else {
      throw new Error(`未知任务类型: ${task.action}`);
    }
    logger.background.info('任务执行成功', { taskId: task.id });
    return result;
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

  // 在 MV3 的扩展 Service Worker 中，创建 Web Worker 存在兼容性/权限限制。
  // 为保证稳定性，直接在 Service Worker 主线程执行任务。
  try {
    const result = await runTask(task);
    await finalize(result);
  } catch (err) {
    logger.background.error('主线程执行任务失败', err);
    await finalize(undefined, String(err));
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

  if (message?.type === 'queueGenerate') {
    const { domain, messages, taskId, action } = message.payload || {};
    if (!domain || !messages || !Array.isArray(messages) || !taskId) {
      sendResponse({ ok: false, error: 'Invalid payload' });
      return true;
    }
    logger.background.info(`收到任务请求：${taskId}, 域名：${domain}, 消息数量：${messages.length}`);
    if (taskQueue.some(t => t.id === taskId)) {
      logger.background.warn(`任务已存在，跳过添加：${taskId}`);
      sendResponse({ ok: false, error: 'Task already exists' });
      return true;
    }
    
    const task: QueueTask = {
      id: taskId || `task-${Date.now()}`,
      action,
      domain,
      status: 'pending',
      messages
    };
    taskQueue.push(task);
    taskState.pending.push(task);
    saveState();
    processQueue();
    sendResponse({ ok: true, id: taskId });
    return true;
  }

  return false;
});
