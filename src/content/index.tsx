import React from 'react';
import { createRoot } from 'react-dom/client';
import { summarizeMessages } from './chatgpt'

// Minimal content script UI mounted via Shadow DOM to avoid site CSS conflicts
const hostId = 'vite-react-ts-extension-content-root';

// 仅在允许的域名上注入（例如：https://chatgpt.com/）
const allowedHosts = ['chatgpt.com', 'www.chatgpt.com'];

// mount 函数负责创建 Shadow DOM 宿主元素，将样式注入其中，并挂载 React 应用程序。
// 它确保内容脚本的 UI 在页面上是隔离的，避免与现有页面样式和脚本冲突。
function mount() {
  if (document.getElementById(hostId)) return;

  const host = document.createElement('div');
  host.id = hostId;
  const shadow = host.attachShadow({ mode: 'open' });

  const mountPoint = document.createElement('div');
  shadow.appendChild(mountPoint);

  // Optional: inject minimal styles scoped to shadow root
  const style = document.createElement('style');
  style.textContent = `
    .__badge {
      position: fixed;
      z-index: 2147483647;
      right: 12px;
      bottom: 12px;
      background: #2563eb;
      color: #fff;
      font: 12px/1.2 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
      padding: 6px 8px;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,.15);
      cursor: pointer;
      opacity: .9;
    }
    .__badge:hover { opacity: 1; }
  `;
  shadow.appendChild(style);

  document.documentElement.appendChild(host);

  // App 组件是一个简单的 React 函数组件，它渲染一个可点击的徽章。
  // 点击徽章会向扩展的后台脚本发送一条消息。
  const App = () => {

    const loadingCurrentMessages = () => {
      summarizeMessages().then((summary) => {
        if (summary) {
          console.log('Summary generated:', summary);
          // You can handle the summary here, e.g., send it to a background script or display it
        } else {
          console.warn('No summary generated.');
        }
      }).catch((error) => {
        console.error('Error generating summary:', error);
      });
    }

    return (
      <div className="__badge" onClick={loadingCurrentMessages}>
        Generate Post
      </div>
    );
  };

  const root = createRoot(mountPoint);
  root.render(<App />);
}

try {
  // 仅当访问允许的域名时才注入按钮
  const isAllowed = allowedHosts.includes(location.hostname);
  if (!isAllowed) {
    console.log('[content] skipped - domain not allowed:', location.hostname);
  } else {
    mount();
    // HMR friendly: re-mount on updates
    if (import.meta.hot) {
      import.meta.hot.accept(() => {
        const existing = document.getElementById(hostId);
        if (existing) existing.remove();
        mount();
        console.log('[content] HMR update applied');
      });
    }
    console.log('[content] injected');
  }
} catch (e) {
  // ignore
}