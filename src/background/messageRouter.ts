import { logger } from '@/lib/logger';
import {
  MessageHandler,
  handlePing,
  handleGenerateArticle,
  handleDirectSave,
  handleGetResultById,
  handleGetTasksState,
  handleEnsureNotionAuth,
  handleSaveToNotion,
  handleDeleteTaskById,
  handleSearchNotionTarget,
  handleClearNotionCookie,
  handleCheckIfHasNotionCookie
} from './messageHandlers';

// 消息路由映射
const messageRoutes: Map<string, MessageHandler> = new Map([
  // 基于 message.ping 的路由
  ['ping', handlePing],
  
  // 基于 message.action 的路由
  ['generateArticle', handleGenerateArticle],
  ['directSave', handleDirectSave],
  
  // 基于 message.type 的路由
  ['getResultById', handleGetResultById],
  ['getTasksState', handleGetTasksState],
  ['ensureNotionAuth', handleEnsureNotionAuth],
  ['saveToNotion', handleSaveToNotion],
  ['deleteTaskById', handleDeleteTaskById],
  ['searchNotionTarget', handleSearchNotionTarget],
  ['clearNotionCookie', handleClearNotionCookie],
  ['checkIfHasNotionCookie', handleCheckIfHasNotionCookie]
]);

// 路由器函数 - 只负责识别消息类型并转发
export function routeMessage(
  message: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
): boolean {
  logger.background.info('收到消息', message);

  // 检查 ping 消息
  if (message?.ping) {
    const handler = messageRoutes.get('ping');
    return handler ? handler(message, sender, sendResponse) : false;
  }

  // 检查 action 类型消息
  if (message?.action) {
    const handler = messageRoutes.get(message.action);
    return handler ? handler(message, sender, sendResponse) : false;
  }

  // 检查 type 类型消息
  if (message?.type) {
    const handler = messageRoutes.get(message.type);
    return handler ? handler(message, sender, sendResponse) : false;
  }

  // 未知消息类型
  logger.background.warn('未知消息类型', message);
  return false;
}