import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../styles/tailwind.css';
import logo from '../../assets/img/logo.svg';

function SidePanelApp() {
  return (
    <div className="w-[360px] min-h-screen p-4 space-y-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="flex items-center gap-3">
        <img src={logo} alt="Logo" className="w-8 h-8" />
        <h1 className="text-xl font-bold">Side Panel</h1>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-300">
        This is the extension side panel (HMR enabled).
      </p>

      <div className="flex gap-2">
        <button
          className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          onClick={() => chrome.runtime.sendMessage({ ping: Date.now(), source: 'sidepanel' })}
        >
          Ping Background
        </button>
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400">
        Tip: You can open this side panel via the background API or programmatically from the popup.
      </div>
    </div>
  );
}

const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <SidePanelApp />
  </React.StrictMode>
);