import html2md from 'html-to-md';

export class GrokCollector implements MessageCollector {

  getAllMessages(): string[] {
    const messages: string[] = [];
    const articleList = document.querySelectorAll("#last-reply-container > .items-center");
    if (articleList.length === 0) {
      console.warn("No messages found on the page.");
      return messages;
    }
    let whoSaid = '#### You said:';
    for (const article of articleList) {
        const content = html2md(article.innerHTML);
        messages.push(whoSaid + " " + content);
        if (whoSaid === '#### You said:') {
            whoSaid = '#### AI said:';
        } else {
            whoSaid = '#### You said:';
        }
    };
    return messages;
  }
}