import Dexie, { Table } from 'dexie';

type TaskBuckets = Record<'pending' | 'running' | 'finished', Task[]>;

type KvRecord = { key: string; value: any };
type ResultRecord = { id: string; result: string };

class AichatDB extends Dexie {
  kv!: Table<KvRecord, string>;
  results!: Table<ResultRecord, string>;
  constructor() {
    super('aichat_to_notion');
    this.version(1).stores({
      kv: 'key',
      results: 'id',
    });
  }
}

const db = new AichatDB();

export async function putTasksState(state: TaskBuckets): Promise<void> {
  await db.kv.put({ key: 'tasksState', value: state });
}

export async function getTasksState(): Promise<TaskBuckets | null> {
  const rec = await db.kv.get('tasksState');
  return (rec?.value as TaskBuckets) ?? null;
}

export async function putResultBlob(id: string, result: string): Promise<void> {
  await db.results.put({ id, result });
}

export async function getResultBlob(id: string): Promise<string | null> {
  const rec = await db.results.get(id);
  return rec?.result ?? null;
}

export async function deleteTask(id: string) {
  await db.results.delete(id);
  const persisted: TaskBuckets = (await getTasksState()) || { pending: [], running: [], finished: [] };
  const updatedFinishedTasks = persisted.finished.filter(task => task.id !== id);
  const updatedRunningTasks = persisted.running.filter(task => task.id !== id);
  await putTasksState({
    pending: persisted.pending,
    running: updatedRunningTasks,
    finished: updatedFinishedTasks
  })
}