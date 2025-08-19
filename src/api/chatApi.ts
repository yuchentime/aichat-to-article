import { SUMMARY_SYSTEM_PROMPT, USER_PROMPT_TEMPLATE } from '../prompts/summary_prompt';
import { ARTICLE_SYSTEM_PROMPT } from '../prompts/article_prompt';
import commonRequest from '../lib/commonRequest';

interface ApiConfig {
    provider: 'grok' | 'chatgpt' | 'gemini';
    apiKey: string;
    model: string;
}

const getConfig = async (): Promise<ApiConfig> => {
    const { apiConfig } = await chrome.storage.local.get('apiConfig');
    return apiConfig || { provider: 'grok', apiKey: '', model: 'grok-4-0709' };
};

const request = async (messages: any[]): Promise<string> => {
    const config = await getConfig();

    let apiUrl = '';
    let body = '';
    let headers: Record<string, string> = {};

    switch (config.provider) {
        case 'chatgpt':
            apiUrl = 'https://api.openai.com/v1/chat/completions';
            body = JSON.stringify({ model: config.model, messages });
            headers = { Authorization: `Bearer ${config.apiKey}` };
            break;
        case 'gemini':
            apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;
            const geminiMessages = messages.map((m: any) => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }],
            }));
            body = JSON.stringify({ contents: geminiMessages });
            break;
        case 'grok':
        default:
            apiUrl = 'https://api.x.ai/v1/chat/completions';
            body = JSON.stringify({ model: config.model, messages });
            headers = { Authorization: `Bearer ${config.apiKey}` };
            break;
    }

    const data = await commonRequest(apiUrl, body, headers);
    if (!data) return '';

    switch (config.provider) {
        case 'gemini':
            return (
                data.candidates?.[0]?.content?.parts?.[0]?.text || ''
            );
        default:
            return data.choices?.[0]?.message?.content || '';
    }
};

export const summarize = async (
    lastSummary: string,
    userInput: string,
): Promise<string> => {
    const userPrompt = USER_PROMPT_TEMPLATE
        .replace('{lastSummary}', lastSummary)
        .replace('{currentMessages}', userInput)
        .replace('{language}', '中文');

    const messages = [
        { role: 'system', content: SUMMARY_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
    ];

    return request(messages);
};

export const generateArticle = async (summary: string): Promise<string> => {
    const messages = [
        { role: 'system', content: ARTICLE_SYSTEM_PROMPT },
        { role: 'user', content: summary },
    ];

    return request(messages);
};

