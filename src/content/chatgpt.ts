import html2md from 'html-to-md';
import {
  isWithinTokenLimit,
} from 'gpt-tokenizer';
import { chat } from '../api/chatApi';

const userPrefix = "##### You said:";
const tokenLimit = 3 * 1024; // 64k tokens

export const getAllMessages = (): Message[] => {
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
        role: content.startsWith(userPrefix) ? "user" : "assistant",
        content,
    }
    messages.push(message);
  };
  return messages;
}

export const summarizeMessages = async (): Promise<string> => {
  const messages = getAllMessages();
  if (messages.length === 0) {
    console.warn("No messages to summarize.");
    return "";
  }
  console.log('Total messages:', messages);
  let lastSummary = "";
  let lastContextMessages: Message[] = [];
  let currentContextMessages: Message[] = [];
  for (const message of messages) {
    currentContextMessages.push(message);
    const withinTokenLimit = isWithinTokenLimit(JSON.stringify(currentContextMessages), tokenLimit)
    console.log('Content within token limit:', withinTokenLimit);
    if (!withinTokenLimit) {
      console.warn("Content exceeds token limit, skipping");
        currentContextMessages = currentContextMessages.slice(0, -1); // Remove the last message
        // 添加overlay
        if (lastContextMessages.length > 0) {
            const overlayMessages: Message[] = lastContextMessages.slice(0, lastContextMessages.length > 2 ? -2: -1);
            console.log('Overlay messages:', overlayMessages);
            currentContextMessages = [...overlayMessages, ...currentContextMessages];
        }

    //   执行摘要处理
        lastSummary = await chat(lastSummary, JSON.stringify(currentContextMessages));

        lastContextMessages = currentContextMessages;
        currentContextMessages = [];
    }
  }
  lastSummary = await chat(lastSummary, JSON.stringify(currentContextMessages));
  console.log('Final Summary:', lastSummary);
  return lastSummary;
}
