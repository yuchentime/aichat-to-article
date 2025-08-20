import { generateArticle } from "@/api/chatApi";

interface WorkerTask {
  id: string;
  action: 'generate' | 'summarize';
  domain: string;
  messages: Message[];
}

self.onmessage = async (e: MessageEvent<WorkerTask>) => {
  const task = e.data;
  try {
    let result = '';
    if (task.action === 'generate') {
      result = await generateArticle(JSON.stringify(task.messages));
    }
    (self as any).postMessage({ id: task.id, result });
  } catch (err) {
    (self as any).postMessage({ id: task.id, error: String(err) });
  }
};
