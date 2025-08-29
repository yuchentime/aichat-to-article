
interface Message {
  role: "user" | "ai";
  content: string;
}

abstract class MessageCollector {
  getChatMessages(): string[];

  convertToJsonList(chatList: NodeListOf<Element>): string[] {
    const messages: Message[] = [];
    for (let i=0; i < chatList.length; i++) {
      const chat = chatList[i];
      const content = html2md(chat.innerHTML);
      if (i%2 === 1) {
        messages.push(JSON.stringify({role: 'user', content}));
      } else {
        messages.push(JSON.stringify({role: 'ai', content}));
      }
    };
    return messages;
  }

}

interface Task {
  id: string;
  taskId: string;
  action: 'generateArticle' | 'directSave';
  domain: string;
  model: string;
  status: 'pending' | 'running' | 'finished' | 'error';
  result?: string;
  title?: string;
  summary?: string;
  error?: string;
  messages: string[];
  synced: boolean;
  url?: string;
  notionUrl?: string;
}

interface ApiConfig {
    provider: 'grok' | 'chatgpt' | 'gemini' | 'custom';
    apiKey: string;
    model: string;
    baseUrl: string;
    currentUsing?: boolean;
}