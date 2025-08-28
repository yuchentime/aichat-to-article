import { getTextByLang } from '@/common/i18n/langConst';

const commonRequest = async (
    apiUrl: string,
    body: string,
    headers: Record<string, string> = {},
) => {
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            },
            body,
        });
        console.log('API请求响应:', response);
        if (!response.ok) {
            let errorText = '';
            if (errorText === '' && response.status === 401) {
               errorText = getTextByLang(navigator.language, 'tokenInvalid') || 'Token is missing or invalid';
            } else if (errorText === '') {
               errorText = getTextByLang(navigator.language, 'tokenExhausted') || 'Please check if the token quota is exhausted or try again later';
            }
            const err: any = new Error(errorText);
            err.status = response.status;
            throw err;
        }

        return await response.json();
    } catch (error) {
        console.error('Error during chat API call:', error);
        throw error;
    }
};

export default commonRequest;