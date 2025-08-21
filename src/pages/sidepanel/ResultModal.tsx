import React from 'react';
import MarkdownRenderer from './MarkdownRenderer';

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

  const handleCopy = async () => {
      navigator.clipboard.writeText(content || '').then(() => {
          alert('已复制到剪贴板');
      }).catch((error) => {
          console.error('复制失败:', error);
          alert('复制失败: ' + (error.message || '未知错误'));
      });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <MarkdownRenderer
            content={content}
            className="prose prose-sm max-w-none dark:prose-invert"
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            复制
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultModal;