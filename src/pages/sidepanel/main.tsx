import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../../styles/tailwind.css';
import logo from '../../assets/img/logo.svg';

interface Task {
  id: string;
  name: string;
  status: string;
  time: number;
}

function SidePanelApp() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const load = async () => {
      const { tasks: stored = [] } = await chrome.storage.local.get('tasks');
      setTasks(stored);
    };
    const handleStorage = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string,
    ) => {
      if (area === 'local' && changes.tasks) {
        setTasks(changes.tasks.newValue || []);
      }
    };
    load();
    chrome.storage.onChanged.addListener(handleStorage);
    return () => chrome.storage.onChanged.removeListener(handleStorage);
  }, []);

  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message?.type === 'taskStatusChanged') {
        chrome.storage.local.get('tasks').then(({ tasks: stored = [] }) => setTasks(stored));
      }
    };
    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  const cancelTask = (id: string) => {
    chrome.runtime.sendMessage({ type: 'cancelTask', id });
  };

  return (
    <div className="w-[360px] min-h-screen p-4 space-y-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="flex items-center gap-3">
        <img src={logo} alt="Logo" className="w-8 h-8" />
        <h1 className="text-xl font-bold">Side Panel</h1>
      </div>

      <ul className="space-y-2">
        {tasks.map((task) => (
          <li key={task.id} className="flex justify-between items-center p-2 border rounded">
            <div>
              <div className="font-medium">{task.name}</div>
              <div className="text-xs text-gray-500">
                {task.status} · {new Date(task.time).toLocaleString()}
              </div>
            </div>
            <button
              className="text-red-600 hover:underline"
              onClick={() => cancelTask(task.id)}
            >
              取消
            </button>
          </li>
        ))}
        {!tasks.length && <li className="text-sm text-gray-500">暂无任务</li>}
      </ul>
    </div>
  );
}

const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <SidePanelApp />
  </React.StrictMode>,
);
