export class GrokCollector extends MessageCollector {

  getChatMessages(): string[] {
    const articleList = document.querySelectorAll("#last-reply-container > .items-center");
    if (articleList.length === 0) {
      console.warn("No messages found on the page.");
      return [];
    }
    return this.convertToJsonList(articleList);
  }
}