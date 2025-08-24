import { logger } from '@/lib/logger';
import { generateArticle } from '@/api/chatApi';
import { getTextByLang } from '@/lib/langConst';
import { taskState, saveState, saveResult } from './state';
import { setBadgeText } from './badge';
import { sendNotification } from './notifications';

const taskQueue: Task[] = [];
let processing = false;

const runGenerateArticleTask = async (task: Task) => {
  logger.background.info('run task', { taskId: task.id, action: task.action, domain: task.domain });

  const finalize = async (result?: string, error?: string) => {
    logger.background.info('完成任务处理', { taskId: task.id, hasResult: !!result, hasError: !!error });
    
    try {
      // 确保任务从running状态移除，即使后续操作失败
      taskState.running = taskState.running.filter((t) => t.id !== task.id);
      task.status = 'finished';
      task.messages = [];

      if (result) {
        const summary: string[] = [];
        const originalSummary = result.slice(0, 200).trim();
        const summaryLines = originalSummary.split('\n');
        for (let i = 0; i < summaryLines.length; i++) {
          const line = summaryLines[i];
          if (line.trim() === '\n' || line.trim() === '') continue;
          if (line.trim().startsWith('##') || line.trim().startsWith('#')) {
            if (!task.title) task.title = line.trim().replace(/#/g, ' ').trim();
            continue;
          }
          summary.push(line.trim());
        }
        task.summary = summary.join('\n');
        try {
          await saveResult(task.id, result);
        } catch (e) {
          logger.background.error('保存任务结果失败', { taskId: task.id, error: String(e) });
        }
      }
      if (error) task.error = error;

      taskState.finished.unshift(task);
      setBadgeText(String(taskState.running.length + taskState.pending.length));

      if (result) {
        sendNotification(getTextByLang(navigator.language, 'taskFinished'), getTextByLang(navigator.language, 'taskFinishedDesc'));
      } else if (error) {
        sendNotification(getTextByLang(navigator.language, 'taskFailed'), error || getTextByLang(navigator.language, 'taskFailed'));
      }

      logger.background.info('任务状态已更新为已完成', { taskId: task.id });
      try {
        await saveState();
      } catch (e) {
        logger.background.error('save state failed', { taskId: task.id, error: String(e) });
      }

      logger.background.info('queue progress', { task });
    } catch (finalizeError) {
      // finalize函数本身的错误处理
      logger.background.error('finalize函数执行失败', { 
        taskId: task.id, 
        error: String(finalizeError),
        originalError: error,
        hasResult: !!result 
      });
      
      // 发送紧急通知
      sendNotification(
        getTextByLang(navigator.language, 'taskFailed'),
        getTextByLang(navigator.language, 'taskCriticalError') || '任务处理发生严重错误'
      );
    } finally {
      processing = false;
      logger.background.info('process next in queue');
      processQueue();
    }
  };

  const lang = navigator.language || navigator.languages?.[0] || 'en';
  
  // 添加超时机制
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(getTextByLang(lang, "taskTimeout")));
    }, 60000); // 30秒超时
  });

  try {
    logger.background.info('调用生成函数', { domain: task.domain });
    const userInput = task.messages.join('\n');
    
    // 使用Promise.race添加超时控制
    const result = await Promise.race([
      generateArticle(userInput, lang),
      timeoutPromise
    ]);
    
    logger.background.info('生成结果: ', result);
    await finalize(result);
    logger.background.info('任务执行成功', { taskId: task.id });
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    logger.background.error('任务执行错误', { taskId: task.id, error: errMsg });
    
    // 确保即使finalize失败也能记录错误状态
    try {
      await finalize(undefined, errMsg);
    } catch (finalizeError) {
      logger.background.error('错误处理过程中发生异常', { 
        taskId: task.id, 
        originalError: errMsg,
        finalizeError: String(finalizeError) 
      });
      
      // 强制更新状态，避免任务卡在running
      taskState.running = taskState.running.filter((t) => t.id !== task.id);
      task.status = 'finished';
      task.error = `${errMsg}`;
      taskState.finished.unshift(task);
      
      try {
        await saveState();
      } catch (saveError) {
        logger.background.error('无法保存错误状态', { 
          taskId: task.id, 
          error: String(saveError) 
        });
      }
      
      setBadgeText(String(taskState.running.length + taskState.pending.length));
      sendNotification(
        getTextByLang(navigator.language, 'taskFailed'),
        getTextByLang(navigator.language, 'taskCriticalError') || '任务处理发生严重错误'
      );
    }
  }
};

export const processQueue = async () => {
  logger.background.info('process queue', { queueLength: taskQueue.length, processing });
  if (processing) {
    logger.background.info('already processing, skip');
    return;
  }

  const task = taskQueue.shift();
  if (!task) {
    logger.background.info('queue empty');
    return;
  }

  logger.background.info('start processing', { taskId: task.id, action: task.action });
  processing = true;

  taskState.pending = taskState.pending.filter((t) => t.id !== task.id);
  task.status = 'running';
  taskState.running.unshift(task);

  setBadgeText(String(taskState.running.length + taskState.pending.length));

  logger.background.info('任务状态已更新为运行中', { taskId: task.id });
  try {
    await saveState();
  } catch (e) {
    logger.background.error('保存任务状态失败?', { taskId: task.id, error: String(e) });
  }

  await runGenerateArticleTask(task);
};

export const submitGenerateTask = async (
  domain: string,
  url: string,
  messages: string[],
  taskId: string,
  action: 'generateArticle' | 'directSave',
  respond: (payload: any) => void,
) => {
  try {
    if (
      taskState.pending.some((t) => t.taskId === taskId) ||
      taskState.running.some((t) => t.taskId === taskId)
    ) {
      logger.background.warn(`任务已存在，跳过添加 ${taskId}`);
      respond({ ok: false, error: getTextByLang(navigator.language, 'taskAlreadyExists') });
      return;
    }

    const { apiConfig } = await chrome.storage.local.get('apiConfig');
    logger.background.info('获取API配置', { apiConfig });

    if (!apiConfig || (Array.isArray(apiConfig) && apiConfig.length === 0)) {
      logger.background.error('没有可用的API配置');
      respond({ ok: false, error: getTextByLang(navigator.language, 'noApi') });
      return;
    }

    let configs: any[] = [];
    if (Array.isArray(apiConfig)) configs = apiConfig;
    else if (apiConfig) configs = [apiConfig];
    const current = configs.find((c: any) => c.currentUsing) || configs[0] || {};

    const id = (crypto as any)?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const task: Task = {
      id,
      taskId,
      action,
      domain,
      model: current?.model || 'default',
      status: 'pending',
      messages,
      synced: false,
      url,
    };

    taskQueue.unshift(task);
    taskState.pending.unshift(task);
    setBadgeText(String(taskState.running.length + taskState.pending.length));
    try {
      await saveState();
    } catch (e) {
      logger.background.error('保存任务状态失败?', { taskId: task.id, error: String(e) });
    }

    processQueue();
    respond({ ok: true, id: task.id });
  } catch (e) {
    logger.background.error('submitTask failed', { error: String(e) });
    respond({ ok: false, error: String(e) });
  }
};
