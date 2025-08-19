
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

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error during chat API call:', error);
        return null;
    }
};

export default commonRequest;