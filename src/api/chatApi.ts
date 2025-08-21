import { ARTICLE_SYSTEM_PROMPT } from '../prompts/article_prompt';
import commonRequest from '../lib/commonRequest';
import { decrypt } from '../lib/crypto';

interface ApiConfig {
    provider: 'grok' | 'chatgpt' | 'gemini' | 'custom';
    apiKey: string;
    model: string;
    baseUrl?: string;
}

const getConfig = async (): Promise<ApiConfig> => {
    const { apiConfig } = await chrome.storage.local.get('apiConfig');
    if (apiConfig?.apiKey) {
        apiConfig.apiKey = await decrypt(apiConfig.apiKey);
    }
    return apiConfig || { provider: 'grok', apiKey: '', model: 'grok-4-0709', baseUrl: '' };
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
        case 'custom': {
            const base = (config.baseUrl || '').trim();
            apiUrl = base;
            body = JSON.stringify({ model: config.model, messages });
            headers = { Authorization: `Bearer ${config.apiKey}` };
            break;
        }
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

export const generateArticle = async (userInput: string): Promise<string> => {
    const messages = [
        { role: 'system', content: ARTICLE_SYSTEM_PROMPT },
        { role: 'user', content: userInput },
    ];

    return request(messages);
};

