import { logger } from '@/lib/logger';
import { ensureContextMenus, registerContextMenuClickHandler } from './contextMenus';
import { hydrateState, isHydrated, getTaskState, getResult, deleteTaskById } from './state';
import { submitGenerateTask } from './queue';

const allowedHosts = ['chatgpt.com', 'grok.com'];
const BACKEND = 'https://www.aichat2notion.com';

async function ensureAuth() {
  // 先探活：已有 HttpOnly Cookie 就直接返回“已授权”
  const ping = await fetch(`${BACKEND}/api/notion/me`, { credentials: 'include' });
  // console.log('auth info: ', ping)
  if (ping.ok) {
     // { authed:true, workspace_name, workspace_id }
    const info = await ping.json();
    console.log('auth info json: ', info)
    return info;
  }

  // {
  //     "ok": true,
  //     "data": {
  //         "items": [
  //             {
  //                 "kind": "database",
  //                 "id": "2529705c-4e93-804d-a88f-f9956a671441",
  //                 "title": "Academic Dashboard",
  //                 "icon": "https://www.notion.so/icons/calendar_blue.svg",
  //                 "url": "https://www.notion.so/2529705c4e93804da88ff9956a671441"
  //             }
  //         ],
  //         "has_more": false,
  //         "next_cursor": null
  //     }
  // }

  // 未授权 → 拉起 OAuth
  const redirectUrl = chrome.identity.getRedirectURL('oauth2');
  const startUrl = `${BACKEND}/api/notion/oauth/start?redirect=${encodeURIComponent(redirectUrl)}`;

  const responseUrl = await chrome.identity.launchWebAuthFlow({
    url: startUrl,
    interactive: true
  });

  if (!responseUrl) throw Error('Notion 授权失败');

  // 这是服务端回跳到扩展的最终 URL，只包含你设计的轻量标志，不含 Notion token
  const final = new URL(responseUrl);
  const ok = final.searchParams.get('ok');
  if (ok !== '1') throw new Error('Notion 授权未完成');

  // 授权已完成（服务端已把 Notion token 加密写进 HttpOnly Cookie）
  // 再次调用 /me 拿到“授权页面信息”（工作区名称/ID等）
  const me = await fetch(`${BACKEND}/api/notion/me`, { credentials: 'include' }).then(r => r.json());
  console.log('re auth info: ', me)
  return me; // { authed:true, workspace_name, workspace_id }
}

async function searchTargets({ type = 'database', query = '' } = {}) {
  const url = new URL(`${BACKEND}/api/notion/search`);
  url.searchParams.set('type', type);
  if (query) url.searchParams.set('query', query);
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`Search failed ${res.status}`);
  return res.json(); // { items, has_more, next_cursor }
}

export async function saveToNotion({ parentId, title, blocks }: {parentId: string, title: string, blocks: string}) {
  // 确保已经授权（Cookie 已写入）
  // 你可以在失败时自动触发 ensureAuth()
  const res = await fetch(`${BACKEND}/api/notion/create-article`, {
    method: 'POST',
    credentials: 'include', // 关键：让 ntkn Cookie 附带
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      parentId,
      title,
      blocks
    })
  });
  if (!res.ok) {
    throw new Error(`Save failed: ${res.status}`)
  };
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
      respond({ok: false, message: '保存至Notion失败'})
    });
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

  if (message.type === 'searchNotionTarget') {
    searchTargets(message.payload).then(
      data => respond({ ok: true, data}),
      err => respond({ ok: false, error: String(err) })
    );
    return true;
  }

  return false;
});

