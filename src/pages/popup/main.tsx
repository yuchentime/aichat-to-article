import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../styles/tailwind.css';
import logo128 from '../../assets/img/icon-128.png';

function PopupApp() {
  const openSidePanel = () => {
    chrome.runtime.sendMessage({ openSidePanel: true });
  };

  return (
    <div className="w-80 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <img src={logo128} alt="Logo" className="w-8 h-8 rounded" />
        <h1 className="text-xl font-bold">Vite React TS</h1>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Simple Chrome Extension Popup (HMR enabled)
      </p>
      <div className="flex gap-2">
        <button
          className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          onClick={() => chrome.runtime.sendMessage({ ping: Date.now() })}
        >
          Send Message
        </button>
        <button
          className="px-3 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700"
          onClick={openSidePanel}
          title="Open Side Panel"
        >
          Open Side Panel
        </button>
      </div>
    </div>
  );
}

const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <PopupApp />
  </React.StrictMode>
);