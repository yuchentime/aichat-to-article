import html2md from 'html-to-md';

export class ChatGptCollector implements MessageCollector {
 
    userPrefix = "##### You said:";

    getAllMessages(): Message[] {
        const messages: Message[] = [];
        const articleList = document.querySelectorAll("article");
        if (articleList.length === 0) {
            console.warn("No articles found on the page.");
            return messages;
        }
        for (const article of articleList) {
            const content = html2md(article.innerHTML);
            // console.log(content);
            const message: Message = {
                role: content.startsWith(this.userPrefix) ? "user" : "assistant",
                content,
            }
            messages.push(message);
        };
        return messages;
    }
}

