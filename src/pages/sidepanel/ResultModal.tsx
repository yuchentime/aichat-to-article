import React from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import { useI18n } from '../../lib/i18n';

type ResultModalProps = {
  id: string,
  isOpen: boolean;
  onClose: () => void;
  title: string;
};

const ResultModal: React.FC<ResultModalProps> = ({
  id,
  isOpen,
  onClose,
  title,
}) => {
  const [content, setContent] = React.useState<string>('');
  const { t } = useI18n();

  const syncToNotion = async () => {

  }

    React.useEffect(() => {
        if (isOpen) {
            chrome.runtime.sendMessage({
                type: 'getResultById',
                id
            }).then((response: any) => {
                console.log('获取结果响应:', response);
                if (response?.ok) {
                    setContent(response.result || '');
                } else {
                    console.error('获取结果失败:', response?.error || '未知错误');
                }
            }).catch((error: any) => {
                console.error('发送消息失败:', error);
            });
        }
    }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in">
      <div className="modal-content animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">AI生成内容预览</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 max-h-[calc(90vh-200px)]">
          <MarkdownRenderer
            content={content}
            className="prose prose-sm max-w-none dark:prose-invert"
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="btn btn-secondary px-6"
          >
            关闭
          </button>
          <button
            onClick={syncToNotion}
            className="btn btn-primary px-6"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            {t('sync_notion')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultModal;
