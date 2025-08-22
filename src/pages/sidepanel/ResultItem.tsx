import React, { useState } from 'react';
import { SyncIndicator } from '../../components/ui/SyncIndicator';
import { showToast } from '@/lib/toast';

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
     chrome.runtime.sendMessage({
                type: 'getResultById',
                id: task.id
      }).then((response: any) => {
        navigator.clipboard.writeText(response.result).then(() => {
          setShowMenu(false)
          showToast('info', '结果已复制到剪贴板');
        }).catch((err) => {
          showToast('error', '复制失败，请手动复制');
          console.error('复制失败:', err);
        });
      }).catch((error: any) => {
          console.error('发送消息失败:', error);
          showToast('error', '复制失败，请手动复制');
          console.error('复制失败:', error);
      });
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
      <header className="flex items-center justify-end boreder-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <SyncIndicator synced={task.synced} />
          {/* 分隔线 */}
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
        
        <a
          href={task.url}
          target='_blank'
          className={`
            px-1 py-1.5 text-sm font-medium rounded-md
            bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300
            hover:bg-gray-100 dark:hover:bg-gray-700
            border border-gray-200 dark:border-gray-600
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1
            inline-flex items-center gap-1.5
          `}
          aria-label={`跳转到 ${task.domain} 原始页面`}
        >
          跳转
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
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
