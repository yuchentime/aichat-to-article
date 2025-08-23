import React, { useEffect, useState, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import '../../styles/tailwind.css';
import { logger } from '../../lib/logger';
import ResultItem from './ResultItem';
import { I18nProvider, useI18n, normalizeLang } from '../../lib/i18n';
import { useSidepanelData } from '../../hooks/useSidepanelData';

// 懒加载模态框组件
const SettingsModal = lazy(() => import('./SettingsModal'));
const ResultModal = lazy(() => import('./ResultModal'));

function SidePanelInner() {
  const { t, setLanguage } = useI18n();
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showResultModal, setShowResultModal] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // 使用自定义hook获取数据
  const { 
    tasks, 
    updateTasks,
    pendingCount, 
    runningCount, 
    apiConfigs, 
    currentProvider, 
    isLoading,
    setApiConfigs,
    setCurrentProvider
  } = useSidepanelData();

  const deleteTask = async (id: string) => {
    try {
      chrome.runtime.sendMessage({type: 'deleteTaskById', id}).then(() => {
        updateTasks(tasks.filter(t => t.id !== id));
      });
      
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
    // Set initial language from storage or default to browser language
    (async () => {
      const { language } = await chrome.storage.local.get('language');
      if (language) {
        setLanguage(normalizeLang(language));
      } else {
        const browserLang = chrome.i18n.getUILanguage();
        setLanguage(normalizeLang(browserLang));
        await chrome.storage.local.set({ language: browserLang });
      }
    })();
  }, [setLanguage]);

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
          {/* 选择模型 - 骨架屏 */}
          {isLoading ? (
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            </div>
          ) : apiConfigs.length > 0 && (
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
            {isLoading ? (
              <>
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg">
                  <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                </div>
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg">
                  <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </section>

      {/* 任务列表 - 网格布局 */}
      <main className="flex-1 p-4">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-6"></div>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="flex items-center justify-between mt-4">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        ) : tasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks.map((task) => (
              <ResultItem
                key={task.id}
                task={task}
                onDelete={() => deleteTask(task.id)}
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
              {t('no_task_title')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto leading-relaxed">
              {t('no_task_subtitle')}
            </p>
          </div>
        )}
      </main>

      {/* 模态框 - 使用Suspense包裹懒加载组件 */}
      {showSettings && (
        <Suspense fallback={null}>
          <SettingsModal onClose={() => setShowSettings(false)} />
        </Suspense>
      )}
      {showResultModal && selectedTask && (
        <Suspense fallback={null}>
          <ResultModal
            id={selectedTask.id}
            isOpen={showResultModal}
            onClose={handleCloseResultModal}
            title={selectedTask.title ?? selectedTask.domain}
            domain={selectedTask.domain}
          />
        </Suspense>
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
