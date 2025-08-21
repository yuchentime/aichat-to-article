import React from 'react';

type ResultItemProps = {
  task: Task;
  isExpanded: boolean;
  isCopied: boolean;
  onToggle: (taskId: string) => void;
  onCopy: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onViewResult: (task: Task) => void;
};

const ResultItem: React.FC<ResultItemProps> = ({
  task,
  isExpanded,
  isCopied,
  onToggle,
  onCopy,
  onDelete,
  onViewResult,
}) => {
  const handleViewResult = () => {
    onViewResult(task);
  };
  return (
    <li className="relative border rounded-lg p-4 space-y-2 bg-white dark:bg-gray-800 shadow-sm hover:shadow transition-shadow">
      {task.synced && (
        <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></span>
      )}
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

      <div className="mt-2">
        <div className="text-sm text-gray-700 dark:text-gray-300 p-3 bg-gray-50 dark:bg-gray-700 rounded">
          {task.summary}
        </div>
        {task.result && (
          <button
            className="text-blue-600 hover:underline text-xs mt-1"
            onClick={handleViewResult}
          >
            查看
          </button>
        )}
      </div>
    </li>
  );
};

export default ResultItem;
