import { ARTICLE_SYSTEM_PROMPT, ARTICLE_SYSTEM_PROMPT_EN, ARTICLE_SYSTEM_PROMPT_ZH_TW } from '../prompts/article_prompt';
import commonRequest from '../lib/commonRequest';
import { decrypt } from '../lib/crypto';

interface ApiConfig {
    provider: 'grok' | 'chatgpt' | 'gemini' | 'custom';
    apiKey: string;
    model: string;
    baseUrl?: string;
    currentUsing?: boolean;
}

const getConfig = async (): Promise<ApiConfig> => {
    const { apiConfig } = await chrome.storage.local.get('apiConfig');
    let configs: ApiConfig[] = [];
    if (Array.isArray(apiConfig)) configs = apiConfig;
    else if (apiConfig) configs = [apiConfig];
    const current = configs.find((c) => c.currentUsing) || configs[0];
    if (current?.apiKey) {
        current.apiKey = await decrypt(current.apiKey);
    }
    return (
        current || {
            provider: 'grok',
            apiKey: '',
            model: 'grok-4-0709',
            baseUrl: '',
            currentUsing: true,
        }
    );
};

const request = async (messages: any[]): Promise<string> => {
    const config = await getConfig();

    if (!config.apiKey) {
        throw new Error('未配置API Token');
    }

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

    try {
        console.log('请求API:', apiUrl)
        const data = await commonRequest(apiUrl, body, headers);

        switch (config.provider) {
            case 'gemini':
                return (
                    data.candidates?.[0]?.content?.parts?.[0]?.text || ''
                );
            default:
                return data.choices?.[0]?.message?.content || '';
        }
    } catch (error: any) {
        console.error('API请求失败:', error);
        if (error.status === 401) {
            throw new Error('Token不存在或无效');
        }
        if (error.status === 403) {
            throw new Error('Token额度不足');
        }
        const msg = error instanceof Error ? error.message : String(error);
        throw new Error(msg || '调用AI服务失败');
    }
};

export const generateArticle = async (userInput: string, lang: string): Promise<string> => {
    const messages = [
        { role: 'system', content: getSystemPrompt(lang) },
        { role: 'user', content: userInput },
    ];

    return request(messages);
};

const getSystemPrompt = (lang: string): string => {
    switch (lang) {
        case 'zh-CN':
            return ARTICLE_SYSTEM_PROMPT;
        case 'zh-TW':
            return ARTICLE_SYSTEM_PROMPT_ZH_TW;
        case 'zh-HK':
            return ARTICLE_SYSTEM_PROMPT_ZH_TW;
        case 'en':
        default:
            return ARTICLE_SYSTEM_PROMPT_EN;
    }
}

