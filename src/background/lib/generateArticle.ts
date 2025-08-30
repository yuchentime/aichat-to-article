import { submitOnceRequest, submitMultiRequest, clarification, request } from '@/api/chatApi';
import { MAPREDUCE_SYSTEM_PROMPT, MAPREDUCE_USER_PROMPT, DISCUSS_SYSTEM_PROMPT,ITERATION_SYSTEM_PROMPT,ITERATION_INIT_USER_PROMPT,ITERATION_NEW_USER_PROMPT,PS_SYSTEM_PROMPT } from '@/prompts/article_prompt';

const size = 4;

export const generateArticle = async (messages: string[]) => {
    const lang = navigator.language || navigator.languages?.[0] || 'en';
    if (messages.length <= size) {
        submitOnceRequest(JSON.stringify(messages), lang);
        return;
    }

    const input = JSON.stringify(messages.slice(0,4));
    const classResult = await clarification(input);
    console.log('分类结果: ', classResult);
    let finalResult = await iterative(messages);

    // let finalResult = '';
    // if (classResult.includes("问题解决型")) {
    //   let offset = 0;
    //   const page = Math.floor(messages.length / size) + 1;
    //   const results: string[] = [];
    //   await iterativeMessagesChunk(offset, page, messages, "", results);
    // } else {
    //   await mapReduce(messages);
    // }
    
    console.log("最终结果：", finalResult)
}

const iterative = async (messages: string[]) => {
    const messageGroups: any[] = [];
    for (let i = 0; i < messages.length; i += size) {
      messageGroups.push({index: i+1, chunks: messages.slice(i, i + size)});
    }

    let currentSummary = '';
    for (let i=0; i < messageGroups.length; i++) {
      const messageGroup = messageGroups[i];
      let messages;
      if (i === 0) {
        messages = [
            { role: 'system', content: ITERATION_SYSTEM_PROMPT },
            { role: 'user', content: ITERATION_INIT_USER_PROMPT
              .replace('{messageChunks}', JSON.stringify(messageGroup.chunks)) },
        ];
      } else {
        messages = [
            { role: 'system', content: ITERATION_SYSTEM_PROMPT },
            { role: 'user', content: ITERATION_NEW_USER_PROMPT
              .replace('{turnId}', String(i+1))
              .replace('{lastSummary}', currentSummary)
              .replace('{messageChunks}', JSON.stringify(messageGroup.chunks)) },
        ];
      }
      currentSummary = await request(messages);
      console.log('当前摘要内容: ', currentSummary)
    }
    const summary = currentSummary.replace('```json', '').replace('```', '').replace(/\n/g, '');
    
    const articleMessage = [
      { role: 'system', content: DISCUSS_SYSTEM_PROMPT },
      { role: 'user', content: `## User Input:\n---\n${summary}\n---` },
    ];
    return await request(articleMessage);
}

const mapReduce = async (messages: string[]) => {
    const messageGroups: any[] = [];
    for (let i = 0; i < messages.length; i += size) {
      messageGroups.push({index: i+1, chunks: messages.slice(i, i + size)});
    }

    const results = await Promise.allSettled(messageGroups.map(messageGroup => {
      const messages = [
          { role: 'system', content: MAPREDUCE_SYSTEM_PROMPT },
          { role: 'user', content: MAPREDUCE_USER_PROMPT
            .replace('{index}', messageGroup.index)
            .replace('{messageChunks}', JSON.stringify(messageGroup.chunks)) },
      ];
      return request(messages);
    }));

    const resultList = results.map(result => {
      if (result.status === 'fulfilled') {
        return JSON.parse(result.value.replace('```json', '').replace('```', '').replace(/\n/g, ''));
      } 
      console.warn('请求出错')
      return {index: 999};
    }).sort((a, b) => Number(a.index) - Number(b.index));
    console.log('mapReduce results: ', resultList);

    const articleMessage = [
      { role: 'system', content: DISCUSS_SYSTEM_PROMPT },
      { role: 'user', content: JSON.stringify(resultList) },
    ];
    return await request(articleMessage);

}