import { logger } from '@/lib/logger';
import { getTasksState as dbGetTasksState, putTasksState as dbPutTasksState, getResultBlob as dbGetResultBlob, putResultBlob as dbPutResultBlob } from '@/lib/db';

export type TaskBuckets = Record<'pending' | 'running' | 'finished', Task[]>;

export const taskState: TaskBuckets = {
  pending: [],
  running: [],
  finished: [],
};

let hydrated = false;

export const isHydrated = () => hydrated;

export const getTaskState = () => taskState;

// Merge storage state with in-memory state, preferring in-memory on conflicts
export const hydrateState = async (): Promise<void> => {
  try {
    const persisted: TaskBuckets = (await dbGetTasksState()) || { pending: [], running: [], finished: [] };

    const allPersisted = [...(persisted.pending || []), ...(persisted.running || []), ...(persisted.finished || [])];
    const allCurrent = [...taskState.pending, ...taskState.running, ...taskState.finished];
    const map = new Map<string, Task>();
    for (const t of allPersisted) map.set(t.id, t);
    for (const t of allCurrent) map.set(t.id, t); // in-memory wins

    const next: TaskBuckets = { pending: [], running: [], finished: [] };
    for (const t of map.values()) {
      if (t.status === 'pending') next.pending.push(t);
      else if (t.status === 'running') next.running.push(t);
      else next.finished.push(t);
    }

    taskState.pending = next.pending;
    taskState.running = next.running;
    taskState.finished = next.finished;
    hydrated = true;
    logger.background.info('hydrate done', {
      pending: taskState.pending.length,
      running: taskState.running.length,
      finished: taskState.finished.length,
    });
  } catch (e) {
    logger.background.error('hydrate failed', { error: String(e) });
  }
};

export const saveState = async (): Promise<void> => {
  if (!hydrated) {
    await hydrateState();
  }
  logger.background.info('save state', {
    running: taskState.running.length,
    finished: taskState.finished.length,
  });
  await dbPutTasksState(taskState);
  try { await chrome.runtime.sendMessage({ type: 'tasksStateUpdated' }); } catch {}
  logger.background.info('state persisted');
};

export const saveResult = async (id: string, result: string): Promise<void> => {
  logger.background.info('保存任务结果', { id, result });
  try {
    await dbPutResultBlob(id, result);
    logger.background.info('任务结果已保存到存储', { id });
  } catch (error) {
    logger.background.error('保存任务结果失败', { id, error: String(error) });
    throw error;
  }
};

export const getResult = async (id: string): Promise<string | null> => {
  logger.background.info('获取任务结果', { id });
  try {
    const blob = await dbGetResultBlob(id);
    if (blob !== null) {
      logger.background.info('result fetched from IndexedDB', { id });
      return blob; // may be empty string
    }
    logger.background.warn('result not found (IndexedDB)', { id });
    return null;
  } catch (error) {
    logger.background.error('读取任务结果失败', { id, error: String(error) });
    return null;
  }
};

