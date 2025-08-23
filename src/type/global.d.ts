
interface Message {
  role: "user" | "assistant";
  content: string;
}

interface MessageCollector {
  getAllMessages(): string[];
}

interface Task {
  id: string;
  taskId: string;
  action: 'generateArticle' | 'directSave';
  domain: string;
  model: string;
  status: 'pending' | 'running' | 'finished';
  result?: string;
  title?: string;
  summary?: string;
  error?: string;
  messages: string[];
  synced: boolean;
  url?: string;
  notionUrl?: string;
}