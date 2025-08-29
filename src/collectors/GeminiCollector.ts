import MessageCollector from './MessageCollector';

export class GeminiCollector extends MessageCollector {
  getChatMessages(): string[] {  
    const articleList = document.querySelectorAll("#chat-history > .chat-history > .conversation-container");
    if (articleList.length === 0) {
        console.warn("No messages found on the page.");
        return [];
    }
    return this.convertToJsonList(articleList);
  }

}