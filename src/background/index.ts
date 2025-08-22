import { generateArticle } from '../api/chatApi';
import { logger } from '../lib/logger';

// 创建右键菜单，仅在指定域名下显示
const allowedHosts = ['chatgpt.com', 'grok.com'];

interface QueueTask {
  id: string;
  taskId: string;
  action: 'generateArticle' | 'directSave';
  domain: string;
  model: string;
  status: 'pending' | 'running' | 'finished';
  result?: string;
  summary?: string;
  error?: string;
  messages: string[];
  synced: boolean;
  url?: string;
}

const taskQueue: QueueTask[] = [];
const taskState: Record<'pending' | 'running' | 'finished', QueueTask[]> = {
  pending: [],
  running: [],
  finished: []
};

let processing = false;
// todo 后面改用 IndexedDB
const saveState = async () => {
  logger.background.info('保存任务状态', { taskState });
  await chrome.storage.local.set({ tasks: taskState });
  logger.background.info('任务状态已保存到存储');
};

// 保存：以变量 id 作为键名；用 try/catch 让调用方能 await/捕获错误
const saveResult = async (id: string, result: string): Promise<void> => {
  logger.background.info('保存任务结果', { id, result });
  try {
    await chrome.storage.local.set({ [id]: result });
    logger.background.info('任务结果已保存到存储', { id });
  } catch (error) {
    logger.background.error('保存任务结果失败', { id, error: String(error) });
    throw error; // 让调用方可感知失败
  }
};

// 读取：区分“未找到”和“空字符串”；并捕获异常
const getResult = async (id: string): Promise<string | null> => {
  logger.background.info('获取任务结果', { id });
  try {
    const stored = await chrome.storage.local.get(id); // 形如 { [id]: value } 或 {}
    if (Object.prototype.hasOwnProperty.call(stored, id)) {
      logger.background.info('任务结果已从存储中获取', { id });
      return stored[id] as string; // 可能是空字符串 ""
    }
    logger.background.warn('未找到任务结果', { id });
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
        logger.background.warn('浏览器通知权限被拒绝');
        return;
      }
      
      // 尝试使用不同的图标路径
      const iconUrl = chrome.runtime.getURL("icon-128.png");
      logger.background.info('创建通知', { title, message, iconUrl });
      
      // 也尝试不使用图标的情况
      const notificationOptions: chrome.notifications.NotificationOptions = {
        type: "basic",
        title,
        message,
        priority: 2
      };
      
      // 只有在能找到图标时才添加图标
      if (iconUrl && iconUrl !== chrome.runtime.getURL("")) {
        notificationOptions.iconUrl = iconUrl;
      }
      
      chrome.notifications.create(notificationOptions, (notificationId) => {
        if (notificationId) {
          logger.background.info('通知发送成功', {
            notificationId,
            title,
            message
          });
        } else {
          logger.background.error('通知发送失败', {
            title,
            message
          });
        }
      });
    });
}

const runGenerateArticleTask = async (task: QueueTask) => {
  logger.background.info('开始执行任务', { taskId: task.id, action: task.action, domain: task.domain });
  
  const finalize = async (result?: string, error?: string) => {
    logger.background.info('完成任务处理', { taskId: task.id, hasResult: !!result, hasError: !!error });
    taskState.running = taskState.running.filter(t => t.id !== task.id);
    task.status = 'finished';
    try {
      if (result) {
        const summary = [];
        const originalSummary = result.slice(0, 200);
        const summaryLines = originalSummary.split('\n');
        for (const line of summaryLines) {
          if (line.trim().startsWith('##') || line.trim().startsWith('#') || line.trim() === '\n') {
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
        sendNotification('任务完成', '文章已经生成，请打开SidePanel查看。');
      } else if (error) {
        sendNotification('任务失败', error || '任务执行失败。');
      }

      logger.background.info('任务状态已更新为已完成', { taskId: task.id });
      try {
        await saveState();
      } catch (e) {
        logger.background.error('保存任务状态失败', { taskId: task.id, error: String(e) });
      }

      logger.background.info('发送队列进度消息', { task });
    } finally {
      processing = false;
      logger.background.info('继续处理队列中的下一个任务');
      processQueue();
    }
  };

  try {
    logger.background.info('调用生成函数', { domain: task.domain });
    const userInput = task.messages.join('\n');
    let result = await generateArticle(userInput);
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
  
  setBadgeText(String(taskState.running.length + taskState.pending.length));

  logger.background.info('任务状态已更新为运行中', { taskId: task.id });
  try {
    await saveState();
  } catch (e) {
    logger.background.error('保存任务状态失败', { taskId: task.id, error: String(e) });
  }

  logger.background.info('发送队列进度消息', { task });

  // 在 MV3 的扩展 Service Worker 中，创建 Web Worker 存在兼容性/权限限制。
  // 为保证稳定性，直接在 Service Worker 主线程执行任务。
  if (task.action === 'generateArticle') {
    runGenerateArticleTask(task)
      .catch(async (e) => {
        const errMsg = e instanceof Error ? e.message : String(e);
        logger.background.error('任务执行过程中出现未捕获的异常', { taskId: task.id, error: errMsg });
        sendNotification('任务失败', '任务执行失败。');
        taskState.running = taskState.running.filter(t => t.id !== task.id);
        task.status = 'finished';
        task.error = errMsg;
        taskState.finished.push(task);
        try {
          await saveState();
        } catch (err) {
          logger.background.error('保存任务状态失败', { taskId: task.id, error: String(err) });
        }
        processing = false;
        processQueue();
      });
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

chrome.runtime.onInstalled.addListener(() => {
  const documentUrlPatterns = allowedHosts.map(host => `*://${host}/*`);
  chrome.contextMenus.create({
    id: 'save_to_notion',
    title: 'Save to Notion',
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
    logger.background.info(`收到任务请求：${taskId}, 域名：${domain}, 消息数量：${messages.length}`);
    if (taskQueue.some(t => t.taskId === taskId && (t.status === 'pending' || t.status === 'running'))) {
      logger.background.warn(`任务已存在，跳过添加：${taskId}`);
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
  }

  return false;
});

const submitTask = async (domain: string, url: string, messages: string[], taskId: string
  , action: 'generateArticle' | 'directSave', respond: any) => {
    chrome.storage.local.get('apiConfig')
      .then(({ apiConfig }) => {
        logger.background.info('获取API配置', { apiConfig });
        if (!apiConfig || (Array.isArray(apiConfig) && apiConfig.length === 0)) {
          logger.background.error('没有可用的API配置');
          respond({ ok: false, error: 'No API configuration available' });
          return;
        }
        
        // 测试通知功能
        const testNotification = () => {
          logger.background.info('测试通知功能');
          sendNotification('测试通知', '这是一个测试通知，用于验证通知功能是否正常工作');
        };
        
        // 添加测试命令到消息监听器
        chrome.runtime.onMessage.addListener((message: any) => {
          // ... 现有的消息处理代码 ...
          
          // 添加测试通知的命令
          if (message.type === 'testNotification') {
            testNotification();
            return true;
          }
          
          return false;
        });
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
          url
        };
        taskQueue.push(task);
        taskState.pending.push(task);
        saveState();
        processQueue();
        respond({ ok: true, id: taskId });
      })
      .catch((err) => {
        logger.background.error('获取配置失败', err);
        sendNotification('任务失败', '任务执行失败。');
        respond({ ok: false, error: String(err) });
      });
}
