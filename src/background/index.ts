import { generate, summarizeMessages } from '../content/generator';

interface QueueTask {
  id: string;
  action: 'generate' | 'summarize';
  domain: string;
  status: 'pending' | 'running' | 'finished';
  result?: string;
  error?: string;
}

const taskQueue: QueueTask[] = [];
const taskState: Record<'pending' | 'running' | 'finished', QueueTask[]> = {
  pending: [],
  running: [],
  finished: []
};

let processing = false;

const saveState = async () => {
  await chrome.storage.local.set({ taskState });
};

const runTask = async (task: QueueTask): Promise<string> => {
  try {
    if (task.action === 'generate') {
      return await generate(task.domain);
    }
    return await summarizeMessages(task.domain);
  } catch (e) {
    console.error('task error', e);
    throw e;
  }
};

const processQueue = async () => {
  if (processing) return;
  const task = taskQueue.shift();
  if (!task) return;
  processing = true;

  taskState.pending = taskState.pending.filter(t => t.id !== task.id);
  task.status = 'running';
  taskState.running.push(task);
  await saveState();
  chrome.runtime.sendMessage({ type: 'queueProgress', task });

  const finalize = async (result?: string, error?: string) => {
    taskState.running = taskState.running.filter(t => t.id !== task.id);
    task.status = 'finished';
    if (result) task.result = result;
    if (error) task.error = error;
    taskState.finished.push(task);
    await saveState();
    chrome.runtime.sendMessage({ type: 'queueProgress', task });
    processing = false;
    processQueue();
  };

  if (typeof Worker !== 'undefined') {
    try {
      const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = async (e: MessageEvent<any>) => {
        await finalize(e.data.result, e.data.error);
        worker.terminate();
      };
      worker.onerror = async (e) => {
        console.error('worker error', e);
        await finalize(undefined, String(e));
        worker.terminate();
      };
      worker.postMessage(task);
    } catch (e) {
      console.error('worker spawn failed', e);
      try {
        const result = await runTask(task);
        await finalize(result);
      } catch (err) {
        await finalize(undefined, String(err));
      }
    }
  } else {
    try {
      const result = await runTask(task);
      await finalize(result);
    } catch (err) {
      await finalize(undefined, String(err));
    }
  }
};

chrome.runtime.onInstalled.addListener(async () => {
  console.log('[background] installed');

  // Enable side panel on action click if available
  try {
    await chrome.sidePanel?.setPanelBehavior?.({ openPanelOnActionClick: true });
  } catch {}

  // Ensure side panel is enabled for all existing tabs
  try {
    const tabs = await chrome.tabs?.query?.({});
    for (const tab of tabs || []) {
      if (tab.id) {
        await chrome.sidePanel?.setOptions?.({
          tabId: tab.id,
          enabled: true,
          path: 'src/pages/sidepanel/index.html'
        });
      }
    }
  } catch {}
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
    const id = (globalThis.crypto?.randomUUID?.() ?? Date.now().toString());
    const task: QueueTask = {
      id,
      action: message.action || 'generate',
      domain: message.domain || '',
      status: 'pending'
    };
    taskQueue.push(task);
    taskState.pending.push(task);
    saveState();
    processQueue();
    sendResponse({ ok: true, id });
    return true;
  }

  if ((message as any)?.openSidePanel) {
    (async () => {
      try {
        const windowId = sender.tab?.windowId;
        if (windowId !== undefined && chrome.sidePanel?.open) {
          await chrome.sidePanel.open({ windowId });
        } else if (sender.tab?.id && chrome.sidePanel?.setOptions) {
          // Fallback: ensure enabled on the tab
          await chrome.sidePanel.setOptions({
            tabId: sender.tab.id,
            enabled: true,
            path: 'src/pages/sidepanel/index.html'
          });
        }
        sendResponse({ ok: true });
      } catch (e) {
        console.error('[background] openSidePanel error', e);
        sendResponse({ ok: false, error: String(e) });
      }
    })();
    return true; // keep channel open for async response
  }

  return false;
});

// Keep side panel enabled as tabs change
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
 try {
   await chrome.sidePanel?.setOptions?.({
     tabId,
     enabled: true,
     path: 'src/pages/sidepanel/index.html'
   });
 } catch {}
});

chrome.tabs.onUpdated.addListener(async (tabId, info) => {
 if (info.status === 'complete') {
   try {
     await chrome.sidePanel?.setOptions?.({
       tabId,
       enabled: true,
       path: 'src/pages/sidepanel/index.html'
     });
   } catch {}
 }
});

// Example: context menu (can be enabled by adding "contextMenus" permission to manifest if needed)
try {
 chrome.contextMenus?.create({
   id: 'vite-react-ts-example',
   title: 'Vite React TS Example',
   contexts: ['page']
 });
} catch (e) {
 // ignore during reloads
}