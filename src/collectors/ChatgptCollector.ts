import MessageCollector from './MessageCollector';

export class ChatGptCollector extends MessageCollector {

    getChatMessages(): string[] {
        const articleList = document.querySelectorAll("article");
        if (articleList.length === 0) {
            console.warn("No messages found on the page.");
            return [];
        }
        return this.convertToJsonList(articleList);
    }
}

