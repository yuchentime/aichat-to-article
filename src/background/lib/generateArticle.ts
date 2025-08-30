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
    const results: string[] = [];
    await iterativeMessagesChunk(offset, page, messages, "", results);
    
    console.log("最终结果：", results)
}

const iterativeMessagesChunk = async (offset: number, page: number, messages: string[], lastResult: string, results: string[]) => {
    const lang = navigator.language || navigator.languages?.[0] || 'en';

    const end = (messages.length - offset) >= 6 ? offset + 6: messages.length;
    const messagesChunk = messages.slice(offset, end);
    if (messages?.[end]) {
        messagesChunk.push(messages?.[end])
    }
    console.log('当前消息块：', messagesChunk)
    const userInput = messagesChunk.join('\n');
    const result = await submitMultiRequest(userInput, lang, lastResult);
    console.log('当前输出结果：', result)
    results.push(result);

    offset = end;

    if (end < messages.length) {
        iterativeMessagesChunk(offset, page, messages, result, results);
    }
    return;
}

const mapReduce = async () => {
    
}