import MessageCollector from './MessageCollector';

export class DefaultCollector extends MessageCollector {
  getChatMessages(): string[] {  
    return [];
  }

}