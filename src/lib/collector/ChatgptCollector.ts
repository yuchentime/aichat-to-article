import html2md from 'html-to-md';

export class ChatGptCollector implements MessageCollector {

    getAllMessages(): string[] {
        const messages: string[] = [];
        const articleList = document.querySelectorAll("article");
        if (articleList.length === 0) {
            console.warn("No articles found on the page.");
            return messages;
        }
        for (const article of articleList) {
            const content = html2md(article.innerHTML);
            messages.push(content);
        };
        return messages;
    }
}

