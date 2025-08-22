
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
            try {
                const errData = await response.json();
                errorText = errData.error?.message || errData.message || '';
            } catch (e) {
                // ignore json parse error
            }
            const err: any = new Error(errorText || `HTTP error! status: ${response.status}`);
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