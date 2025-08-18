import { SYSTEM_PROMPT, USER_PROMPT_TEMPLATE } from '../prompts/summary_prompt';

const model = 'grok-4-0709';
const apiUrl = 'https://api.x.ai/v1/chat/completions';

export const chat = async (lastSummary: string, userInput: string): Promise<string> => {
    const userPrompt = USER_PROMPT_TEMPLATE
        .replace('{lastSummary}', lastSummary)
        .replace('{currentMessages}', userInput)
        .replace('{language}', '中文'); 
    
    const messages = [
        {
            role: 'system',
            content: SYSTEM_PROMPT,
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
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_GROK_API_KEY}`,
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('Error during chat API call:', error);
        return 'Error: Unable to get a response from the chat API.';
    }
};