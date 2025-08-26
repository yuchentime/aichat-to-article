import { ensureContextMenus, registerContextMenuClickHandler } from './contextMenus';
import { hydrateState } from './state';
import { loadingTaskQueue } from './queue';
import { routeMessage } from './messageRouter';

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

// 消息路由 - 仅负责接收和转发
chrome.runtime.onMessage.addListener(routeMessage);

