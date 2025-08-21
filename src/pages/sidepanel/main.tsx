import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../../styles/tailwind.css';
import logo from '../../assets/img/logo.svg';
import { logger } from '../../lib/logger';
import SettingsModal from './SettingsModal';
import ResultItem from './ResultItem';
import ResultModal from './ResultModal';

interface ApiConfig {
  provider: 'grok' | 'chatgpt' | 'gemini' | 'custom';
  model: string;
  apiKey?: string;
  baseUrl?: string;
  currentUsing?: boolean;
}

function SidePanelApp() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [runningCount, setRunningCount] = useState<number>(0);
  const [copiedTaskId, setCopiedTaskId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [apiConfigs, setApiConfigs] = useState<ApiConfig[]>([]);
  const [currentProvider, setCurrentProvider] = useState<string>('');
  const [showResultModal, setShowResultModal] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

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

  const copyResult = async (task: Task) => {
    try {
      await navigator.clipboard.writeText(task.result || '');
      setCopiedTaskId(task.id);
      setTimeout(() => setCopiedTaskId(null), 2000);
      logger.sidepanel.info('复制任务结果', { id: task.id });
    } catch (err) {
      logger.sidepanel.error('复制失败', err);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      logger.sidepanel.info('删除任务', { id });
      const { tasks: stored = { finished: [], pending: [], running: [] } } = await chrome.storage.local.get('tasks');
      const updatedFinished = (stored.finished || []).filter((t: Task) => t.id !== id);
      const updatedState = { ...stored, finished: updatedFinished };
      await chrome.storage.local.set({ tasks: updatedState });
      setTasks(prev => prev.filter(t => t.id !== id));
      logger.sidepanel.info('任务已从存储中删除', { id });
    } catch (err) {
      logger.sidepanel.error('删除任务失败', err);
    }
  };

  const handleProviderChange = async (provider: string) => {
    const updated = apiConfigs.map(c => ({ ...c, currentUsing: c.provider === provider }));
    setApiConfigs(updated);
    setCurrentProvider(provider);
    await chrome.storage.local.set({ apiConfig: updated });
  };

  const handleViewResult = (task: Task) => {
    setSelectedTask(task);
    setShowResultModal(true);
  };

  const handleCloseResultModal = () => {
    setShowResultModal(false);
    setSelectedTask(null);
  };

  useEffect(() => {
    const load = async () => {
      logger.sidepanel.info('开始加载任务列表');

      let stored = { finished: [], pending: [], running: [] };
      let configs: ApiConfig[] = [];

      // Handle Chrome API availability
      try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          const result = await chrome.storage.local.get(['tasks', 'apiConfig']);
          stored = result.tasks || stored;
          if (Array.isArray(result.apiConfig)) configs = result.apiConfig;
          else if (result.apiConfig) configs = [result.apiConfig];
        }
      } catch (error) {
        logger.sidepanel.info('Chrome storage not available, using sample data');
      }

      logger.sidepanel.info('从 chrome.storage.local 获取到的任务列表', stored);
      setApiConfigs(configs);
      const current = configs.find(c => c.currentUsing) || configs[0];
      setCurrentProvider(current ? current.provider : '');
      
      // 只显示已完成的任务
      const finishedTasks = stored.finished || [];
      const pendingTasks = stored.pending || [];
      const runningTasks = stored.running || [];
      
      // Add sample markdown data for testing if no tasks exist
      if (finishedTasks.length === 0) {
        setTasks([]);
      } else {
        setTasks(finishedTasks);
      }
      
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
      if (area === 'local') {
        if (changes.tasks) {
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
        if (changes.apiConfig) {
          const list = changes.apiConfig.newValue || [];
          setApiConfigs(list);
          const current = list.find((c: ApiConfig) => c.currentUsing) || list[0];
          setCurrentProvider(current ? current.provider : '');
        }
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

  return (
    <div className="w-full min-h-screen p-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="flex items-center gap-3 my-2">
        <img src={logo} alt="Logo" className="w-8 h-8" />
        <h1 className="text-xl font-bold">任务列表</h1>
        <button
          className="ml-auto text-sm text-blue-600 hover:underline"
          onClick={() => setShowSettings(true)}
        >
          设置
        </button>
      </div>

      {apiConfigs.length > 0 && (
        <div className="space-y-2 text-sm my-2">
          <label className="block">API Provider</label>
          <select
            className="w-full border p-1 dark:bg-gray-700"
            value={currentProvider}
            onChange={(e) => handleProviderChange(e.target.value)}
          >
            {apiConfigs.map((c) => (
              <option key={c.provider} value={c.provider}>
                {c.provider}{c.model ? ` (${c.model})` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 任务状态统计 */}
      <div className="flex gap-4 text-sm my-2">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
          <span className="text-gray-600 dark:text-gray-400">待处理: {pendingCount}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
          <span className="text-gray-600 dark:text-gray-400">进行中: {runningCount}</span>
        </div>
      </div>

     <ul className="space-y-2 my-2">
       {tasks.map((task) => (
         <ResultItem
           key={task.id}
           task={task}
           onDelete={deleteTask}
           onViewResult={handleViewResult}
         />
       ))}
       {!tasks.length && <li className="text-sm text-gray-500">暂无已完成任务</li>}
     </ul>
     {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
     {showResultModal && selectedTask && (
       <ResultModal
         id={selectedTask.id}
         isOpen={showResultModal}
         onClose={handleCloseResultModal}
         title={`${selectedTask.domain}`}
       />
     )}
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
