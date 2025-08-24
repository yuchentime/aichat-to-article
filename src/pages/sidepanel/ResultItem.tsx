import React, { useState } from 'react';
import { SyncIndicator } from '../../components/ui/SyncIndicator';
import { showToast } from '@/lib/toast';
import { useI18n } from '../../lib/i18n';
import MarkdownRenderer from './MarkdownRenderer';
import chatgptLogo from '@/assets/img/chatgpt.png';
import grokLogo from '@/assets/img/grok.png';

type ResultItemProps = {
  task: Task;
  onDelete: (taskId: string) => void;
  onViewResult: (task: Task) => void;
};

const ResultItem: React.FC<ResultItemProps> = React.memo(({
  task,
  onDelete,
  onViewResult,
}) => {
  const { t } = useI18n();
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
          showToast('info', t('copy_success'));
        }).catch((err) => {
          showToast('error', t('copy_failed'));
          console.error('复制失败:', err);
        });
      }).catch((error: any) => {
          console.error(t('send_failed') + ':', error);
          showToast('error', t('copy_failed'));
          console.error('复制失败:', error);
      });
  };

  return (
    <article
      className={`
        p-4
        card group relative
        transition-all duration-300 ease-out
        hover:transform hover:-translate-y-1
        ${isHovered ? 'shadow-lg' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="listitem"
      aria-labelledby={`task-title-${task.id}`}
    >
      {/* 头部状态栏 */}
      <header className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
        {
          task.status === 'finished' ? (
            <SyncIndicator synced={task.synced} className="text-xs" />
          ) : (
            <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              {t('status_running') + '...'}
            </span>
          )
        }
        
        {/* 操作菜单 */}
        <div className="relative">
          <button
            className={`
              p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
              transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700
              ${showMenu ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300' : ''}
            `}
            onClick={() => setShowMenu(!showMenu)}
            aria-label={t('more_actions')}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-10 z-20 w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden animate-slide-up">
              <button
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors duration-150"
                onClick={handleCopyResult}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {t('copy_result')}
              </button>
              <button
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-3 transition-colors duration-150"
                onClick={() => {
                  onDelete(task.id);
                  setShowMenu(false);
                } }
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {t('delete_task')}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="my-4">
        <h3
          id={`task-title-${task.id}`}
          className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-3"
        >
          <div className="w-8 h-8 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
            {task.domain === 'chatgpt.com' ? (
              <img src={chatgptLogo} alt="ChatGPT" className="w-5 h-5" />
            ) : task.domain === 'grok.com' ? (
              <img src={grokLogo} alt="Grok" className="w-5 h-5" />
            ) : (
              <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
              </svg>
            )}
          </div>
          <span className="truncate">{task.title ?? task.domain}</span>
        </h3>
        
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3 text-sm">
          <MarkdownRenderer
            content={task.summary || t('no_summary')}
            className="prose prose-sm max-w-none dark:prose-invert"
          />
        </p>
      </main>

      {/* 底部操作区域 */}
      <footer className="flex items-center gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <button
          className="btn btn-primary flex-1 text-sm py-2"
          onClick={handleViewResult}
          disabled={task.status !== 'finished'}
          aria-label={t('aria_view_details', task.domain)}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {t('view_details')}
        </button>
        
        <a
          href={task.url}
          target='_blank'
          rel='noopener noreferrer'
          className="btn btn-secondary text-sm py-2 px-3"
          aria-label={t('aria_go_to_original', task.domain)}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </footer>

      {/* 点击遮罩层关闭菜单 */}
      {showMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowMenu(false)}
        />
      )}
    </article>
  );
}, (prevProps, nextProps) => {
  // 只有当task对象发生变化时才重新渲染
  return prevProps.task.id === nextProps.task.id && 
         prevProps.task.status === nextProps.task.status &&
         prevProps.task.synced === nextProps.task.synced &&
         prevProps.task.summary === nextProps.task.summary;
});

export default ResultItem;
