import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../../styles/tailwind.css';
import logo from '../../assets/img/logo.svg';
import { logger } from '../../lib/logger';

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
      logger.sidepanel.info('开始加载任务列表');
      const { tasks: stored = [] } = await chrome.storage.local.get('tasks');
      logger.sidepanel.info('从 chrome.storage.local 获取到的任务列表', stored);
      setTasks(stored);
      logger.sidepanel.info('任务列表加载完成', { count: stored.length });
    };
    
    const handleStorage = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string,
    ) => {
      logger.sidepanel.info('存储变化事件', { area, changes });
      if (area === 'local' && changes.tasks) {
        logger.sidepanel.info('任务列表已更新', {
          oldCount: changes.tasks.oldValue?.length || 0,
          newCount: changes.tasks.newValue?.length || 0
        });
        setTasks(changes.tasks.newValue || []);
      }
    };
    
    load();
    logger.sidepanel.info('添加存储变化监听器');
    chrome.storage.onChanged.addListener(handleStorage);
    return () => {
      logger.sidepanel.info('移除存储变化监听器');
      chrome.storage.onChanged.removeListener(handleStorage);
    };
  }, []);

  useEffect(() => {
    const handleMessage = (
      message: any,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ) => {
      logger.sidepanel.info('收到消息', { message, sender });
      if (message?.type === 'taskStatusChanged') {
        logger.sidepanel.info('任务状态变化，重新加载任务列表');
        chrome.storage.local.get('tasks').then(({ tasks: stored = [] }) => {
          logger.sidepanel.info('重新加载的任务列表', stored);
          setTasks(stored);
        });
      }
      return false; // 不保持消息通道开放
    };
    
    logger.sidepanel.info('添加消息监听器');
    chrome.runtime.onMessage.addListener(handleMessage);
    return () => {
      logger.sidepanel.info('移除消息监听器');
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  const cancelTask = (id: string) => {
    logger.sidepanel.info('取消任务', { id });
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

logger.sidepanel.info('侧边栏应用初始化');
root.render(
  <React.StrictMode>
    <SidePanelApp />
  </React.StrictMode>,
);
logger.sidepanel.info('侧边栏应用渲染完成');
