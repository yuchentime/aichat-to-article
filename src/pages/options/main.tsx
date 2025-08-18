import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../../styles/tailwind.css';
import logo from '../../assets/img/logo.svg';
import { get, set, watch } from '../../lib/storage';

function OptionsApp() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Load initial value
    get<boolean>('sample:toggle', false).then((v) => {
      if (mounted) setEnabled(!!v);
    });

    // React to external changes
    const un = watch((changes) => {
      if (Object.prototype.hasOwnProperty.call(changes, 'sample:toggle')) {
        // newValue may be undefined on remove()
        const nv = (changes as any)['sample:toggle']?.newValue;
        setEnabled(!!nv);
      }
    });

    return () => {
      mounted = false;
      un();
    };
  }, []);

  const onToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.checked;
    setEnabled(next);
    await set('sample:toggle', next);
  };

  return (
    <div className="max-w-md p-6 space-y-4">
      <div className="flex items-center gap-3">
        <img src={logo} alt="Logo" className="w-8 h-8" />
        <h1 className="text-2xl font-bold">Extension Options</h1>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Configure your preferences here. This page supports HMR.
      </p>
      <div className="space-y-2">
        <label className="block text-sm">
          <span className="mr-2">Sample toggle</span>
          <input
            type="checkbox"
            className="align-middle"
            checked={enabled}
            onChange={onToggle}
          />
        </label>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Current: {enabled ? 'ON' : 'OFF'}
        </div>
      </div>
    </div>
  );
}

const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <OptionsApp />
  </React.StrictMode>
);