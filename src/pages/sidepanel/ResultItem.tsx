import React, { useState } from 'react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SyncIndicator } from '../../components/ui/SyncIndicator';

type ResultItemProps = {
  task: Task;
  onDelete: (taskId: string) => void;
  onViewResult: (task: Task) => void;
};

const ResultItem: React.FC<ResultItemProps> = ({
  task,
  onDelete,
  onViewResult,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleViewResult = () => {
    onViewResult(task);
  };

  const handleCopyResult = async () => {
    try {
      await navigator.clipboard.writeText(task.result || '');
      // 可以添加toast提示
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const formatRelativeTime = (timestamp: string) => {
    // 实现相对时间格式化逻辑
    const now = new Date();
    const taskTime = new Date(timestamp);
    const diffMs = now.getTime() - taskTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return '刚刚';
    if (diffHours < 24) return `${diffHours}小时前`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}天前`;
  };

  return (
    <article
      className={`
        relative group
        bg-white dark:bg-gray-800
        border border-gray-200 dark:border-gray-700
        rounded-lg p-4
        transition-all duration-200 ease-out
        hover:shadow-card-hover dark:hover:shadow-card-hover-dark
        hover:border-gray-300 dark:hover:border-gray-600
        ${isHovered ? 'transform -translate-y-0.5' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="listitem"
      aria-labelledby={`task-title-${task.id}`}
    >
      {/* 头部状态栏 */}
      <header className="flex items-center justify-end mb-3">
        {/* <div className="flex items-center gap-2">

        </div> */}
        
        <div className="flex items-center gap-2">
          <SyncIndicator synced={task.synced} />
          
          {/* 操作菜单 */}
          <div className="relative">
            <button
              className={`
                p-1 rounded-full text-gray-400 hover:text-gray-600
                dark:hover:text-gray-300 transition-colors
                ${showMenu ? 'bg-gray-100 dark:bg-gray-700' : ''}
              `}
              onClick={() => setShowMenu(!showMenu)}
              aria-label="更多操作"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-8 z-10 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                  onClick={handleCopyResult}
                >
                  📋 复制结果
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-red-600 flex items-center gap-2"
                  onClick={() => onDelete(task.id)}
                >
                  🗑️ 删除任务
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="mb-4">
        <h3
          id={`task-title-${task.id}`}
          className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2"
        >
          <span className="text-blue-600 dark:text-blue-400">📄</span>
          {task.domain}
        </h3>
        
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">
          {task.summary || '暂无摘要信息'}
        </p>
      </main>

      {/* 底部操作区域 */}
      <footer className="flex items-center justify-between">
        <button
          className={`
            px-3 py-1.5 text-sm font-medium rounded-md
            bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400
            hover:bg-blue-100 dark:hover:bg-blue-900/30
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
          `}
          onClick={handleViewResult}
          aria-label={`查看 ${task.domain} 的详细结果`}
        >
          查看详情
        </button>
        
        <time
          className="text-xs text-gray-500 dark:text-gray-400"
          dateTime={task.id} // 假设id包含时间戳
        >
          {formatRelativeTime(task.id)}
        </time>
      </footer>

      {/* 点击遮罩层关闭菜单 */}
      {showMenu && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowMenu(false)}
        />
      )}
    </article>
  );
};

export default ResultItem;
