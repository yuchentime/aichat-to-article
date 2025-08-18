import {
  isWithinTokenLimit,
} from 'gpt-tokenizer';
import { summarize, generateArticle } from '../api/chatApi';
import {ChatGptCollector} from './ChatgptCollector';

const tokenLimit = 3 * 1024; // 64k tokens

const getCollector = (domain: string): MessageCollector => {
  switch (domain) {
    case 'chatgpt.com':
      return new ChatGptCollector();
    default:
      console.warn(`No collector found for domain: ${domain}`);
      return {
        getAllMessages: () => []
      };
  }
}

export const generate = async (domain: string): Promise<string> => {
  const summary = await summarizeMessages(domain);
  if (!summary) {
    console.warn("No summary generated.");
    return "";
  }
  return await generateArticle(summary);
}

export const summarizeMessages = async (domain: string): Promise<string> => {
  const messages = getCollector(domain).getAllMessages();
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
        lastSummary = await summarize(lastSummary, JSON.stringify(currentContextMessages));

        lastContextMessages = currentContextMessages;
        currentContextMessages = [];
    }
  }
  lastSummary = await summarize(lastSummary, JSON.stringify(currentContextMessages));
  console.log('Final Summary:', lastSummary);
  return lastSummary;
}
