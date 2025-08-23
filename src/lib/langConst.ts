
export const getTextByLang = (lang: string, key: string): string => {
    const texts: Record<string, Record<string, string>> = {
        en: {
            taskAdded: 'Task added to the queue.',
            taskStarted: 'Task started.',
            taskFinished: 'Task finished.',
            taskFinishedDesc: 'The article has been generated, please open the SidePanel to view it.',
            taskFailed: 'Task failed.',
            taskFailedDesc: 'The task execution failed.',
            taskCriticalError: 'Critical error occurred during task processing.',
            noTitle: 'No Title',
            tokenInvalid: 'Token is missing or invalid.',
            tokenExhausted: 'Please check if the token quota is exhausted or try again later.',
        },
        'zh-CN': {
            taskAdded: '任务已加入队列。',
            taskStarted: '任务已开始。',
            taskFinished: '任务已完成。',
            taskFinishedDesc: '文章已经生成，请打开SidePanel查看。',
            taskFailed: '任务失败。',
            taskFailedDesc: '任务执行失败。',
            taskCriticalError: '任务处理发生严重错误。',
            noTitle: '无标题',
            tokenInvalid: 'Token不存在或无效。',
            tokenExhausted: '请检查Token用量是否已用尽，或稍后再试。',
        },
        'zh-TW': {
            taskAdded: '任務已加入隊列。',
            taskStarted: '任務已開始。',
            taskFinished: '任務已完成。',
            taskFinishedDesc: '文章已經生成，請打開SidePanel查看。',
            taskFailed: '任務失敗。',
            taskFailedDesc: '任務執行失敗。',
            taskCriticalError: '任務處理發生嚴重錯誤。',
            noTitle: '無標題',
            tokenInvalid: 'Token不存在或無效。',
            tokenExhausted: '請檢查Token用量是否已用盡，或稍後再試。',
        },
    };
    
    return texts[lang]?.[key] || texts['en'][key] || '';
}