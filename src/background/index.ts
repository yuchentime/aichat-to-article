import { logger } from '@/lib/logger';
import { ensureContextMenus, registerContextMenuClickHandler } from './contextMenus';
import { hydrateState, isHydrated, getTaskState, getResult, deleteTaskById } from './state';
import { submitGenerateTask } from './queue';

// 创建右键菜单，仅在指定域名下显示
const allowedHosts = ['chatgpt.com', 'grok.com'];
const BACKEND = 'https://www.aichat2notion.com';

async function ensureAuth() {
  const redirectUrl = chrome.identity.getRedirectURL('oauth2');
  const startUrl = `${BACKEND}/api/notion/oauth/start?redirect=${encodeURIComponent(redirectUrl)}`;
  const responseUrl = await chrome.identity.launchWebAuthFlow({ url: startUrl, interactive: true });
  if (!responseUrl) return null;
  const ok = new URL(responseUrl).searchParams.get('ok');
  if (ok !== '1') throw new Error('Auth failed');
}

export async function saveToNotion({ parentId, meta, blocks }: {parentId: string, meta: any, blocks: string}) {
  // 确保已经授权（Cookie 已写入）
  // 你可以在失败时自动触发 ensureAuth()
  const res = await fetch(`${BACKEND}/api/notion/create-article`, {
    method: 'POST',
    credentials: 'include', // 关键：让 ntkn Cookie 附带
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      parentId,
      title: meta.title,
      url: meta.url,
      description: meta.description,
      blocks
    })
  });
  if (!res.ok) throw new Error(`Save failed: ${res.status}`);
  return res.json();
}

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
  void hydrateState();
  ensureContextMenus(allowedHosts);
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
    (async () => {
      try {
        // const resp = await fetch(`${BACKEND}/api/notion/me`, {
        //   method: 'GET',
        //   credentials: 'include', // 关键：让 ntkn Cookie 附带
        //   headers: { 'Content-Type': 'application/json' },
        // });
        // console.log('Notion权限验证结果: ', resp);
        // if (resp.ok) {

        // } else {
        //   ensureAuth();
        // }

        await ensureAuth();
      } catch (error) {
        console.error('Failed to ensure notion: ', error)
        respond({ ok: false, error: 'Notion权限验证失败' });
      }
    })();
    return true;
  }

  if (message?.type === 'saveToNotion') {
    saveToNotion(message.payload);
    return true;
  }

  if (message?.type === 'deleteTaskById') {
    (async () => {
      try {
        deleteTaskById(message.id);
        respond({ ok: true});
      } catch (e) {
        logger.background.error('获取任务状态失败?', { error: String(e) });
        respond({ ok: false, error: String(e) });
      }
    })();
    return true;
  }

  return false;
});

