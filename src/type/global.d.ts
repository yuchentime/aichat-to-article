
interface Message {
  role: "user" | "assistant";
  content: string;
}

interface MessageCollector {
  getAllMessages(): string[];
}

interface Task {
  id: string;
  action: string;
  domain: string;
  status: string;
  result: string;
  model?: string;
  synced: boolean;
}