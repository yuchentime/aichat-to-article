import { submitOnceRequest, clarification, submitRequest } from '@/api/chatApi';
import { KNOWLEDGE_SYSTEM_PROMPT, KNOWLEDGE_USER_PROMPT, FINAL_ARTICLE_SYSTEM_PROMPT,PROBELM_SOLVE_SYSTEM_PROMPT,PROBELM_SOLVE_INIT_USER_PROMPT,PROBELM_SOLVE_NEW_USER_PROMPT,FINAL_PROBELM_SOLVE_SYSTEM_PROMPT } from '@/prompts/article_prompt';

const size = 8;
const iterationSize = 6;

export const generateArticle = async (messages: string[]) => {
    if (messages.length <= size) {
        return submitOnceRequest(JSON.stringify(messages));
    }

    const input = JSON.stringify(messages.slice(0,4));
    const classResult = await clarification(input);
    console.log('分类结果: ', classResult);

    let finalResult = '';
    if (classResult.includes("问题解决型")) {
      finalResult = await problemSolve(messages);
    } else {
      finalResult = await knowledgeDiscussion(messages);
    }
    
    console.log("最终结果：", finalResult)
    return finalResult;
}

const problemSolve = async (messages: string[]) => {
    const messageGroups: any[] = [];
    for (let i = 0; i < messages.length; i += iterationSize) {
      messageGroups.push({index: i+1, chunks: messages.slice(i, i + iterationSize)});
    }

    let currentSummary = '';
    for (let i=0; i < messageGroups.length; i++) {
      const messageGroup = messageGroups[i];
      let messages;
      if (i === 0) {
        messages = [
            { role: 'system', content: PROBELM_SOLVE_SYSTEM_PROMPT },
            { role: 'user', content: PROBELM_SOLVE_INIT_USER_PROMPT
              .replace('{messageChunks}', JSON.stringify(messageGroup.chunks)) },
        ];
      } else {
        messages = [
            { role: 'system', content: PROBELM_SOLVE_SYSTEM_PROMPT },
            { role: 'user', content: PROBELM_SOLVE_NEW_USER_PROMPT
              .replace('{turnId}', String(i+1))
              .replace('{lastSummary}', currentSummary)
              .replace('{messageChunks}', JSON.stringify(messageGroup.chunks)) },
        ];
      }
      currentSummary = await submitRequest(messages);
      console.log('当前摘要内容: ', currentSummary)
    }
    const summary = currentSummary.replace('```json', '').replace('```', '').replace(/\n/g, '');
    
    const articleMessage = [
      { role: 'system', content: FINAL_ARTICLE_SYSTEM_PROMPT.replace("{article_type}", "知识探讨型") },
      { role: 'user', content: `## User Input:\n---\n${summary}\n---` },
    ];
    return await submitRequest(articleMessage);
}

const knowledgeDiscussion = async (messages: string[]) => {
    const messageGroups: any[] = [];
    for (let i = 0; i < messages.length; i += size) {
      messageGroups.push({index: i+1, chunks: messages.slice(i, i + size)});
    }

    const results = await Promise.allSettled(messageGroups.map(messageGroup => {
      const messages = [
          { role: 'system', content: KNOWLEDGE_SYSTEM_PROMPT },
          { role: 'user', content: KNOWLEDGE_USER_PROMPT
            .replace('{index}', messageGroup.index)
            .replace('{messageChunks}', JSON.stringify(messageGroup.chunks)) },
      ];
      return submitRequest(messages);
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
      { role: 'system', content: FINAL_ARTICLE_SYSTEM_PROMPT.replace("{article_type}", "知识探讨型") },
      { role: 'user', content: JSON.stringify(resultList) },
    ];
    return await submitRequest(articleMessage);

}