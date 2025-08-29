import { submitOnceRequest, submitMultiRequest } from '@/api/chatApi';

export const generateArticle = async (messages: string[]) => {
    const lang = navigator.language || navigator.languages?.[0] || 'en';
    if (messages.length <= 10) {
        const userInput = messages.join('\n');
        submitOnceRequest(userInput, lang);
        return;
    }

    let offset = 0;
    const page = Math.floor(messages.length / 10) + 1;
    const results: string[] = await handleMessagesChunk(offset, page, messages, []);
    
    console.log("最终结果：", results)
}

const handleMessagesChunk = async (offset: number, page: number, messages: string[], history: string[]): Promise<string[]> => {
    const lang = navigator.language || navigator.languages?.[0] || 'en';

    const end = (messages.length - offset) >= 6 ? offset + 6: messages.length;
    const messagesChunk = messages.slice(offset, end);
    console.log('当前消息块：', messagesChunk)
    const userInput = messagesChunk.join('\n');
    const result = await submitMultiRequest(userInput, lang, history);
    console.log('当前输出结果：', result)
    history.push(result);

    offset = end;

    if (end < messages.length) {
        handleMessagesChunk(offset, page, messages, history);
    }
    return history;
}