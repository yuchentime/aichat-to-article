import html2md from 'html-to-md'

abstract class MessageCollector {
  abstract getChatMessages(): string[];

  convertToJsonList(chatList: NodeListOf<Element>): string[] {
    const messages: string[] = [];
    for (let i = 0; i < chatList.length; i++) {
      const chat = chatList[i];
      const content = html2md(chat.innerHTML);
      if (i % 2 === 0) {
        messages.push(JSON.stringify({role: 'user', content}));
      } else {
        messages.push(JSON.stringify({role: 'ai', content}));
      }
  }
    return messages;
  }
}

export default MessageCollector;