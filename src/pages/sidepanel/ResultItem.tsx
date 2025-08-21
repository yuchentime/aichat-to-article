import React from 'react';
import MarkdownRenderer from './MarkdownRenderer';

type ResultItemProps = {
  task: Task;
  isExpanded: boolean;
  isCopied: boolean;
  onToggle: (taskId: string) => void;
  onCopy: (task: Task) => void;
  onDelete: (taskId: string) => void;
};

const ResultItem: React.FC<ResultItemProps> = ({
  task,
  isExpanded,
  isCopied,
  onToggle,
  onCopy,
  onDelete,
}) => {
  return (
    <li className="border rounded-lg p-4 space-y-2 bg-white dark:bg-gray-800 shadow-sm hover:shadow transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="text-xs text-gray-500">
            {task.status} · {task.domain}
          </div>
        </div>
        <div className="flex items-center gap-2 ml-2">
          {!!task.result && (
            <button
              className="text-blue-600 hover:underline text-sm"
              onClick={() => onCopy(task)}
            >
              {isCopied ? '已复制' : '复制'}
            </button>
          )}
          <button
            className="text-red-600 hover:underline text-sm"
            onClick={() => onDelete(task.id)}
          >
            删除
          </button>
        </div>
      </div>

      {!!task.result && (
        <div className="mt-2">
          <MarkdownRenderer
            content={task.result}
            className={`text-sm text-gray-700 dark:text-gray-300 ${isExpanded ? 'markdown-content' : 'markdown-content line-clamp-3'} p-3`}
          />
          {task.result.length > 150 && (
            <button
              className="text-blue-600 hover:underline text-xs mt-1"
              onClick={() => onToggle(task.id)}
            >
              {isExpanded ? '收起' : '展开'}
            </button>
          )}
        </div>
      )}
    </li>
  );
};

export default ResultItem;
