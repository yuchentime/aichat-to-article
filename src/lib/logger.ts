/**
 * 日志工具函数
 * 用于统一格式化日志输出，便于追踪数据流向
 */

// 日志级别
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

// 日志来源
export enum LogSource {
  SIDEPANEL = 'SIDEPANEL',
  BACKGROUND = 'BACKGROUND',
  CONTENT = 'CONTENT',
  WORKER = 'WORKER'
}

// 环境检测 - 简单判断是否为开发环境
const isDevelopment = () => {
  try {
    return process.env.NODE_ENV === 'development' || 
           typeof process === 'undefined' || 
           !process.env.NODE_ENV;
  } catch {
    return true; // 默认认为是开发环境
  }
};

/**
 * 格式化日志输出
 * @param source 日志来源
 * @param level 日志级别
 * @param message 日志消息
 * @param data 额外数据
 */
export function log(
  source: LogSource,
  level: LogLevel,
  message: string,
  data?: any
): void {
  // 在生产环境中只记录ERROR和WARN级别日志
  if (!isDevelopment() && (level === LogLevel.DEBUG || level === LogLevel.INFO)) {
    return;
  }
  
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}][${source}][${level}]`;
  
  switch (level) {
    case LogLevel.DEBUG:
      console.debug(`${prefix} ${message}`, data !== undefined ? data : '');
      break;
    case LogLevel.INFO:
      console.info(`${prefix} ${message}`, data !== undefined ? data : '');
      break;
    case LogLevel.WARN:
      console.warn(`${prefix} ${message}`, data !== undefined ? data : '');
      break;
    case LogLevel.ERROR:
      console.error(`${prefix} ${message}`, data !== undefined ? data : '');
      break;
  }
}

// 便捷方法
export const logger = {
  sidepanel: {
    debug: (message: string, data?: any) => log(LogSource.SIDEPANEL, LogLevel.DEBUG, message, data),
    info: (message: string, data?: any) => log(LogSource.SIDEPANEL, LogLevel.INFO, message, data),
    warn: (message: string, data?: any) => log(LogSource.SIDEPANEL, LogLevel.WARN, message, data),
    error: (message: string, data?: any) => log(LogSource.SIDEPANEL, LogLevel.ERROR, message, data)
  },
  background: {
    debug: (message: string, data?: any) => log(LogSource.BACKGROUND, LogLevel.DEBUG, message, data),
    info: (message: string, data?: any) => log(LogSource.BACKGROUND, LogLevel.INFO, message, data),
    warn: (message: string, data?: any) => log(LogSource.BACKGROUND, LogLevel.WARN, message, data),
    error: (message: string, data?: any) => log(LogSource.BACKGROUND, LogLevel.ERROR, message, data)
  },
  content: {
    debug: (message: string, data?: any) => log(LogSource.CONTENT, LogLevel.DEBUG, message, data),
    info: (message: string, data?: any) => log(LogSource.CONTENT, LogLevel.INFO, message, data),
    warn: (message: string, data?: any) => log(LogSource.CONTENT, LogLevel.WARN, message, data),
    error: (message: string, data?: any) => log(LogSource.CONTENT, LogLevel.ERROR, message, data)
  },
  worker: {
    debug: (message: string, data?: any) => log(LogSource.WORKER, LogLevel.DEBUG, message, data),
    info: (message: string, data?: any) => log(LogSource.WORKER, LogLevel.INFO, message, data),
    warn: (message: string, data?: any) => log(LogSource.WORKER, LogLevel.WARN, message, data),
    error: (message: string, data?: any) => log(LogSource.WORKER, LogLevel.ERROR, message, data)
  }
};