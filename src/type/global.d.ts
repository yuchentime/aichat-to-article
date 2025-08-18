
interface Message {
  role: "user" | "assistant";
  content: string;
}

interface MessageCollector {
  getAllMessages(): Message[];
}