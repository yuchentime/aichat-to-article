import { SUMMARY_SYSTEM_PROMPT, USER_PROMPT_TEMPLATE } from '../prompts/summary_prompt';
import { ARTICLE_SYSTEM_PROMPT } from '../prompts/article_prompt';
import commonRequest from '../lib/commonRequest';

const model = 'grok-4-0709';
const apiUrl = 'https://api.x.ai/v1/chat/completions';

export const summarize = async (lastSummary: string, userInput: string): Promise<string> => {
    const userPrompt = USER_PROMPT_TEMPLATE
        .replace('{lastSummary}', lastSummary)
        .replace('{currentMessages}', userInput)
        .replace('{language}', '中文'); 
    
    const messages = [
        {
            role: 'system',
            content: SUMMARY_SYSTEM_PROMPT,
        },
        {
            role: 'user',
            content: userPrompt,
        },
    ];
    console.log('Reqsuest body:', JSON.stringify({
                model: model,
                messages: messages,
            }));
    return commonRequest(apiUrl, JSON.stringify({
            model: model,
            messages: messages,
        }));
};

export const generateArticle = async (summary: string) : Promise<string> => {
    
    const messages = [
        {
            role: 'system',
            content: ARTICLE_SYSTEM_PROMPT,
        },
        {
            role: 'user',
            content: summary,
        },
    ];
    // console.log('Reqsuest body:', JSON.stringify({
    //             model: model,
    //             messages: messages,
    //         }));
    return commonRequest(apiUrl, JSON.stringify({
            model: model,
            messages: messages,
        }));
}