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
  summary?: string;
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
    chrome.notifications.create({
      type: "basic",
      // iconUrl: "icon.png",
      title,
      message,
      priority: 2
    });
}

const runGenerateArticleTask = async (task: QueueTask) => {
  logger.background.info('开始执行任务', { taskId: task.id, action: task.action, domain: task.domain });
  
  const finalize = async (result?: string, error?: string) => {
    logger.background.info('完成任务处理', { taskId: task.id, hasResult: !!result, hasError: !!error });
    taskState.running = taskState.running.filter(t => t.id !== task.id);
    task.status = 'finished';
    if (result) {
      task.summary = result.slice(0, 200); // 简单摘要，实际可用更复杂的逻辑
      saveResult(task.id, result);
    }
    if (error) task.error = error;
    taskState.finished.push(task);

    // 发送浏览器通知
    if (result) {
      sendNotification('任务完成', '文章已经生成，请打开SidePanel查看。');
    } else if (error) {
      sendNotification('任务失败', '任务执行失败。');
    }

    logger.background.info('任务状态已更新为已完成', { taskId: task.id });
    await saveState();
    
    logger.background.info('发送队列进度消息', { task });
    
    processing = false;
    logger.background.info('继续处理队列中的下一个任务');
    processQueue();
  };

  try {
    logger.background.info('调用生成函数', { domain: task.domain });
    const userInput = task.messages.join('\n');
    // let result = await generateArticle(userInput);
    const result = `
    HubSpot是一个全面的客户平台，它将营销、销售、客户服务、内容管理、运营和商务工具整合到一个统一的系统中。该平台由Brian Halligan和Dharmesh Shah于2006年创立，最初是一个专注于入站营销的工具，现已发展成为一个强大的AI驱动平台，为全球超过25.8万客户提供服务。

### HubSpot的核心组件

HubSpot平台由多个紧密集成且相互协作的“中心”（Hub）组成，旨在覆盖企业运营的各个方面：

*   **Smart CRM：** 作为HubSpot产品体系的核心，智能CRM提供了一个集中的数据库，用于管理跨部门的客户互动。它包含联系人管理、电子邮件跟踪、销售管道可视化等功能，并能与Gmail和Office 365等工具无缝集成。
*   **Marketing Hub：** 该模块提供了一系列工具，用于潜在客户开发、电子邮件营销、SEO优化和营销活动自动化。它支持创建着陆页、管理社交媒体以及分析营销绩效。
*   **Sales Hub：** 旨在提升销售流程效率，包含交易跟踪、销售自动化、邮件序列以及报告仪表板等功能。
*   **Service Hub：** 此组件专注于客户支持，提供工单系统、知识库创建、实时聊天和客户反馈工具等。
*   **Content Hub：** 一个AI驱动的内容管理系统，协助企业在博客、播客和社交媒体等各种渠道创建、个性化和分发内容。
*   **Operations Hub：** 提供数据同步、工作流自动化和数据质量管理工具，确保系统间数据的一致性和清洁度。
*   **Commerce Hub：** 于2024年推出，该模块使企业能够管理发票、报价、订阅和支付，并与Stripe等支付平台无缝集成。

### AI集成

HubSpot已通过其“Breeze”AI引擎将人工智能深度整合到平台中，该引擎在INBOUND大会上首次亮相。Breeze提供了任务自动化、客户参与度评分和AI驱动的内容生成等功能。

### HubSpot Academy

为支持用户学习，HubSpot提供了HubSpot Academy，这是一个在线培训平台，提供数字营销、销售和客户服务方面的课程和认证。这一资源旨在帮助用户最大限度地发挥平台潜力。

欲了解更多详细信息或探索HubSpot的产品，可访问其官方网站：[hubspot.com](https://www.hubspot.com)。
    `
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
    if (taskQueue.some(t => t.taskId === taskId && (t.status === 'pending' || t.status === 'running'))) {
      logger.background.warn(`任务已存在，跳过添加：${taskId}`);
      respond({ ok: false, error: 'Task already exists' });
      return false;
    }

    submitTask(domain, messages, taskId, 'generateArticle', respond);

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

const submitTask = async (domain: string, messages: string[], taskId: string
  , action: 'generateArticle' | 'directSave', respond: any) => {
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
}
