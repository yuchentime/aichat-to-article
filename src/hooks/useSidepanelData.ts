import { useState, useEffect, useCallback } from 'react';
import { logger } from '../lib/logger';

export interface ApiConfig {
  provider: 'grok' | 'chatgpt' | 'gemini' | 'custom';
  model: string;
  apiKey?: string;
  baseUrl?: string;
  currentUsing?: boolean;
}

export interface SidepanelData {
  tasks: Task[];
  pendingCount: number;
  runningCount: number;
  apiConfigs: ApiConfig[];
  currentProvider: string;
  isLoading: boolean;
  setApiConfigs: React.Dispatch<React.SetStateAction<ApiConfig[]>>;
  setCurrentProvider: React.Dispatch<React.SetStateAction<string>>;
}

export const useSidepanelData = (): SidepanelData => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [runningCount, setRunningCount] = useState<number>(0);
  const [apiConfigs, setApiConfigs] = useState<ApiConfig[]>([]);
  const [currentProvider, setCurrentProvider] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = useCallback(async () => {
    logger.sidepanel.info('开始加载任务列表');
    setIsLoading(true);

    let stored = { finished: [], pending: [], running: [] };
    let configs: ApiConfig[] = [];

    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        // 并行加载API配置和任务状态
        const [configResult, tasksStateResult] = await Promise.all([
          chrome.storage.local.get(['apiConfig']),
          chrome.runtime.sendMessage({type: 'getTasksState'})
        ]);

        if (Array.isArray(configResult.apiConfig)) configs = configResult.apiConfig;
        else if (configResult.apiConfig) configs = [configResult.apiConfig];

        if (tasksStateResult?.tasks) {
          stored = tasksStateResult.tasks;
        }
      }
    } catch (error) {
      logger.sidepanel.info('Chrome storage not available, using sample data');
    }

    // 批量更新状态
    setApiConfigs(configs);
    const current = configs.find(c => c.currentUsing) || configs[0];
    setCurrentProvider(current ? current.provider : '');
    
    const finishedTasks = stored.finished || [];
    const pendingTasks = stored.pending || [];
    const runningTasks = stored.running || [];
    
    setTasks(finishedTasks.length === 0 ? [] : [...runningTasks, ...finishedTasks]);
    setPendingCount(pendingTasks.length);
    setRunningCount(runningTasks.length);
    
    logger.sidepanel.info('任务列表加载完成', {
      finished: finishedTasks.length,
      pending: pendingTasks.length,
      running: runningTasks.length
    });
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();

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
          setTasks([...runningTasks, ...finishedTasks]);
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

    logger.sidepanel.info('添加存储变化监听器');
    chrome.storage.onChanged.addListener(handleStorage);

    return () => {
      logger.sidepanel.info('移除存储变化监听器');
      chrome.storage.onChanged.removeListener(handleStorage);
    };
  }, [loadData]);

  useEffect(() => {
    const handleMessage = (
      message: any,
      sender: chrome.runtime.MessageSender,
      _sendResponse: (response?: any) => void
    ) => {
      logger.sidepanel.info('收到消息', { message, sender });
      if (message?.type === 'tasksStateUpdated') {
        logger.sidepanel.info('任务状态变化，重新加载任务列表（从后台）');
        chrome.runtime
          .sendMessage({ type: 'getTasksState' })
          .then((result) => {
            const stored = (result?.tasks || { finished: [], pending: [], running: [] });
            logger.sidepanel.info('重新加载的任务列表', stored);
            const finishedTasks = stored.finished || [];
            const pendingTasks = stored.pending || [];
            const runningTasks = stored.running || [];
            setTasks([...runningTasks, ...finishedTasks]);
            setPendingCount(pendingTasks.length);
            setRunningCount(runningTasks.length);
          })
          .catch((err) => logger.sidepanel.error('获取任务状态失败', err));
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

  return {
    tasks,
    pendingCount,
    runningCount,
    apiConfigs,
    currentProvider,
    isLoading,
    setApiConfigs,
    setCurrentProvider
  };
};