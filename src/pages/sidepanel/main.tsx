import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../../styles/tailwind.css';
import { logger } from '../../lib/logger';
import SettingsModal from './SettingsModal';
import ResultItem from './ResultItem';
import ResultModal from './ResultModal';
import { I18nProvider, useI18n } from '../../lib/i18n';

interface ApiConfig {
  provider: 'grok' | 'chatgpt' | 'gemini' | 'custom';
  model: string;
  apiKey?: string;
  baseUrl?: string;
  currentUsing?: boolean;
}

function SidePanelInner() {
  const { t } = useI18n();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [runningCount, setRunningCount] = useState<number>(0);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [apiConfigs, setApiConfigs] = useState<ApiConfig[]>([]);
  const [currentProvider, setCurrentProvider] = useState<string>('');
  const [showResultModal, setShowResultModal] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

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
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* 顶部导航栏 - 品牌化设计 */}
      <header className="sticky top-0 z-20 bg-gradient-to-r from-primary-600 to-primary-500 text-white px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-8 8z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold">AIChat to Notion</h1>
              <p className="text-xs opacity-90">{t('sidepanel_title')}</p>
            </div>
          </div>
          <button
            className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-all duration-200 ripple"
            onClick={() => setShowSettings(true)}
            aria-label={t('open_settings')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* 控制面板 - 现代化设计 */}
      <section className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50 px-4 py-4">
        <div className="flex flex-col gap-4">
          {/* 选择模型 */}
          {apiConfigs.length > 0 && (
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('api_provider')}
              </label>
              <select
                className="input w-full text-sm"
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
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg">
              <div className="w-3 h-3 bg-status-pending rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('status_pending')}: <span className="text-primary-600 dark:text-primary-400">{pendingCount}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg">
              <div className="w-3 h-3 bg-status-running rounded-full animate-spin-slow"></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('status_running')}: <span className="text-primary-600 dark:text-primary-400">{runningCount}</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 任务列表 - 网格布局 */}
      <main className="flex-1 p-4">
        {tasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks.map((task) => (
              <ResultItem
                key={task.id}
                task={task}
                onDelete={deleteTask}
                onViewResult={handleViewResult}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/20 dark:to-primary-800/20 rounded-2xl flex items-center justify-center">
              <svg className="w-10 h-10 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
              暂无已完成任务
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto leading-relaxed">
              完成的任务将在这里显示。开始使用AI将聊天记录转换为文章并同步到Notion吧！
            </p>
          </div>
        )}
      </main>

      {/* 模态框 */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showResultModal && selectedTask && (
        <ResultModal
          id={selectedTask.id}
          isOpen={showResultModal}
          onClose={handleCloseResultModal}
          title={selectedTask.domain}
        />
      )}
    </div>
  );
}

function SidePanelApp() {
  return (
    <I18nProvider>
      <SidePanelInner />
    </I18nProvider>
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
