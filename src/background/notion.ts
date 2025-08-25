import { updateSyncedState } from './state';

const BACKEND = 'https://www.aichat2notion.com';

export async function ensureAuth() {
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

export async function searchTargets({ type = 'database', query = '' } = {}) {
  const url = new URL(`${BACKEND}/api/notion/search`);
  url.searchParams.set('type', type);
  if (query) url.searchParams.set('query', query);
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`Search failed ${res.status}`);
  return res.json(); // { items, has_more, next_cursor }
}

export async function clearNotionCookie() {
  const url = new URL(`${BACKEND}/api/notion/logout`);
  const res = await fetch(url, { method: 'POST', credentials: 'include' });
  if (!res.ok) throw new Error(`Search failed ${res.status}`);
  return res.json(); // { items, has_more, next_cursor }
}

export async function checkIfHasNotionCookie() {
  const ping = await fetch(`${BACKEND}/api/notion/me`, { credentials: 'include' });
  console.log('notion cookie ping: ', ping)
  return ping.ok;
}

export async function saveToNotion({ parentId, title, blocks, id }: {parentId: string, title: string, blocks: string, id: string}) {
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
  // 更新任务的同步状态
  updateSyncedState(id);

  return res.json();
}
