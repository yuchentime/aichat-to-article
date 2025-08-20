
interface Message {
  role: "user" | "assistant";
  content: string;
}

interface MessageCollector {
  getAllMessages(): Message[];
}

interface Task {
  id: string;
  action: string;
  domain: string;
  status: string;
  result: string;
}