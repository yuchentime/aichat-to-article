import { generate, summarizeMessages } from '../content/generator';

interface WorkerTask {
  id: string;
  action: 'generate' | 'summarize';
  domain: string;
}

self.onmessage = async (e: MessageEvent<WorkerTask>) => {
  const task = e.data;
  try {
    let result = '';
    if (task.action === 'generate') {
      result = await generate(task.domain);
    } else {
      result = await summarizeMessages(task.domain);
    }
    (self as any).postMessage({ id: task.id, result });
  } catch (err) {
    (self as any).postMessage({ id: task.id, error: String(err) });
  }
};
