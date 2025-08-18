import React from 'react';
import { createRoot } from 'react-dom/client';

// Minimal content script UI mounted via Shadow DOM to avoid site CSS conflicts
const hostId = 'vite-react-ts-extension-content-root';

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

  const App = () => {
    return (
      <div className="__badge" onClick={() => chrome.runtime.sendMessage({ ping: Date.now() })}>
        Extension Active
      </div>
    );
  };

  const root = createRoot(mountPoint);
  root.render(<App />);
}

try {
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
} catch (e) {
  // ignore
}