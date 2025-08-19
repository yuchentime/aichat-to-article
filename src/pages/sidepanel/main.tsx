import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../../styles/tailwind.css';
import logo from '../../assets/img/logo.svg';
import { logger } from '../../lib/logger';

interface Task {
  id: string;
  action: string;
  domain: string;
  status: string;
  result: string;
}

interface StoredTasks {
  finished: Task[];
  pending: Task[];
  running: Task[];
}

function SidePanelApp() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [runningCount, setRunningCount] = useState<number>(0);

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    const load = async () => {
      logger.sidepanel.info('开始加载任务列表');
      const { tasks: stored = { finished: [], pending: [], running: [] } } = await chrome.storage.local.get('tasks');
      logger.sidepanel.info('从 chrome.storage.local 获取到的任务列表', stored);
      
      // 只显示已完成的任务
      const finishedTasks = stored.finished || [];
      const pendingTasks = stored.pending || [];
      const runningTasks = stored.running || [];
      
      setTasks(finishedTasks);
      setPendingCount(pendingTasks.length);
      setRunningCount(runningTasks.length);
      logger.sidepanel.info('任务列表加载完成', {
        finished: finishedTasks.length,
        pending: pendingTasks.length,
        running: runningTasks.length
      });
    };
    
    const handleStorage = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string,
    ) => {
      logger.sidepanel.info('存储变化事件', { area, changes });
      if (area === 'local' && changes.tasks) {
        const newValue = changes.tasks.newValue || { finished: [], pending: [], running: [] };
        const finishedTasks = newValue.finished || [];
        const pendingTasks = newValue.pending || [];
        const runningTasks = newValue.running || [];
        
        logger.sidepanel.info('任务列表已更新', {
          finished: finishedTasks.length,
          pending: pendingTasks.length,
          running: runningTasks.length
        });
        setTasks(finishedTasks);
        setPendingCount(pendingTasks.length);
        setRunningCount(runningTasks.length);
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
        chrome.storage.local.get('tasks').then(({ tasks: stored = { finished: [], pending: [], running: [] } }) => {
          logger.sidepanel.info('重新加载的任务列表', stored);
          const finishedTasks = stored.finished || [];
          const pendingTasks = stored.pending || [];
          const runningTasks = stored.running || [];
          setTasks(finishedTasks);
          setPendingCount(pendingTasks.length);
          setRunningCount(runningTasks.length);
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

      {/* 任务状态统计 */}
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
          <span className="text-gray-600 dark:text-gray-400">待处理: {pendingCount}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
          <span className="text-gray-600 dark:text-gray-400">进行中: {runningCount}</span>
        </div>
      </div>

      <ul className="space-y-2">
        {tasks.map((task) => (
          <li key={task.id} className="border rounded p-3 space-y-2">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="font-medium">{task.action}</div>
                <div className="text-xs text-gray-500">
                  {task.status} · {task.domain}
                </div>
              </div>
              <button
                className="text-red-600 hover:underline text-sm ml-2"
                onClick={() => cancelTask(task.id)}
              >
                删除
              </button>
            </div>
            
            {task.result && (
              <div className="mt-2">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {expandedTasks.has(task.id) ? (
                    <div className="whitespace-pre-wrap break-words">
                      {task.result}
                    </div>
                  ) : (
                    <div className="line-clamp-3">
                      {task.result.substring(0, 150)}
                      {task.result.length > 150 && '...'}
                    </div>
                  )}
                </div>
                
                {task.result.length > 150 && (
                  <button
                    className="text-blue-600 hover:underline text-xs mt-1"
                    onClick={() => toggleTaskExpansion(task.id)}
                  >
                    {expandedTasks.has(task.id) ? '收起' : '展开'}
                  </button>
                )}
              </div>
            )}
          </li>
        ))}
        {!tasks.length && <li className="text-sm text-gray-500">暂无已完成任务</li>}
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
