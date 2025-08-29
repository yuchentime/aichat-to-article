import { ChatGptCollector } from './ChatgptCollector';
import { GrokCollector } from './GrokCollector';
import { DefaultCollector } from './DefaultCollector';
import MessageCollector from './MessageCollector';

export class CollectorFactory {
  constructor() {}

  public getCollectorInstance(domain: string): MessageCollector {
    if (domain.includes('chatgpt.com')) {
        return new ChatGptCollector();
    } else if (domain.includes('grok.com')) {
        return new GrokCollector(); // Assuming GrokCollector is defined similarly
    }
    return new DefaultCollector();
  }
}
