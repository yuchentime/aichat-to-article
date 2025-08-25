import { logger } from '@/lib/logger';
import { ensureContextMenus, registerContextMenuClickHandler } from './contextMenus';
import { hydrateState, isHydrated, getTaskState, getResult, deleteTaskById, taskState } from './state';
import { submitGenerateTask, processQueue, loadingTaskQueue } from './queue';
import { getTextByLang } from '@/lib/langConst';
import { setBadgeText } from './badge';
import { saveToNotion, checkIfHasNotionCookie, clearNotionCookie, searchTargets, ensureAuth } from './notion'

const allowedHosts = ['chatgpt.com', 'grok.com'];
// 跟踪侧边栏状态
let sidePanelOpen = false;

// 动作按钮点击：切换侧边栏
chrome.action.onClicked.addListener((_tab) => {
  if (sidePanelOpen) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
    sidePanelOpen = false;
  } else {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
    sidePanelOpen = true;
  }
});

// 安装/更新时初始化
chrome.runtime.onInstalled.addListener(() => {
  void hydrateState();
  ensureContextMenus(allowedHosts);
});

// 浏览器启动时初始化
chrome.runtime.onStartup?.addListener(() => {
  ensureContextMenus(allowedHosts);
  // 加载未处理完的任务
  void hydrateState().then(() => {
    loadingTaskQueue();
  })
});

// SW 冷启动时也兜底注册一次菜单，并注册点击处理
ensureContextMenus(allowedHosts);
registerContextMenuClickHandler();

// 消息路由
chrome.runtime.onMessage.addListener((
  message: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
): boolean => {
  logger.background.info('收到消息', message);

  const respond = (payload?: any) => (sendResponse as unknown as (response?: any) => void)(payload);

  if (message?.ping) {
    console.log('[background] received ping from', sender?.id, 'at', message.ping);
    respond({ pong: Date.now() });
    return false;
  }

  const action = message?.action;
  if (action === 'generateArticle') {
    const { domain, messages, taskId, url } = message?.payload || {};
    if (!domain || !messages || !Array.isArray(messages) || !taskId) {
      respond({ ok: false, error: 'Invalid payload' });
      return false;
    }

    submitGenerateTask(domain, url, messages, taskId, 'generateArticle', respond);
    return true;
  }

  if (action === 'directSave') {
    // 预留：直接保存逻辑
    return true;
  }

  if (message?.type === 'getResultById') {
    getResult(message.id)
      .then((result) => {
        if (result !== null) respond({ ok: true, result });
        else respond({ ok: false, error: 'Result not found' });
      })
      .catch((error) => {
        logger.background.error('获取结果失败', { id: message.id, error: String(error) });
        respond({ ok: false, error: String(error) });
      });
    return true;
  }

  if (message?.type === 'getTasksState') {
    (async () => {
      try {
        if (!isHydrated()) await hydrateState();
        respond({ ok: true, tasks: await getTaskState() });
      } catch (e) {
        logger.background.error('获取任务状态失败?', { error: String(e) });
        respond({ ok: false, error: String(e) });
      }
    })();

    return true;
  }

  if (message?.type === 'ensureNotionAuth') {
    ensureAuth().then(
      me => respond({ok: true, data: me}),
      err => respond({ ok: false, error: String(err) })
    );
    return true;
  }

  if (message?.type === 'saveToNotion') {
    saveToNotion(message.payload).then(() => {
      respond({ok: true});
    }).catch(err => {
      respond({ok: false, message: getTextByLang(navigator.language, 'saveFailed')})
    });
    return true;
  }

  if (message?.type === 'deleteTaskById') {
    (async () => {
      try {
        await deleteTaskById(message.id);
        setBadgeText(String(taskState.pending.length + taskState.running.length))
        processQueue();
        respond({ ok: true});
      } catch (e) {
        logger.background.error('获取任务状态失败?', { error: String(e) });
        respond({ ok: false, error: String(e) });
      }
    })();
    return true;
  }

  if (message.type === 'searchNotionTarget') {
    searchTargets(message.payload).then(
      data => respond({ ok: true, data}),
      err => respond({ ok: false, error: String(err) })
    );
    return true;
  }

  if (message?.type === 'clearNotionCookie') {
    clearNotionCookie().then(
      data => respond({ ok: true, data}),
      err => respond({ ok: false, error: String(err) })
    );
    return true;
  }

  if (message?.type === 'checkIfHasNotionCookie') {
    checkIfHasNotionCookie().then(
      data => respond({ ok: data}),
      err => respond({ ok: false, error: String(err) })
    );
    return true;
  }

  return false;
});

