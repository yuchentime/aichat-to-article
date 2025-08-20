
import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import mermaid from 'mermaid';

type ResultItemProps = {
  task: Task;
  isExpanded: boolean;
  isCopied: boolean;
  onToggle: (taskId: string) => void;
  onCopy: (task: Task) => void;
  onDelete: (taskId: string) => void;
};

// Initialize mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  securityLevel: 'loose',
});

// Custom component for Mermaid diagrams
const MermaidDiagram: React.FC<{ chart: string }> = ({ chart }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      mermaid.render(`mermaid-${Date.now()}`, chart).then((result) => {
        if (ref.current) {
          ref.current.innerHTML = result.svg;
        }
      }).catch((error) => {
        console.error('Mermaid rendering error:', error);
        if (ref.current) {
          ref.current.innerHTML = `<pre><code>${chart}</code></pre>`;
        }
      });
    }
  }, [chart]);

  return <div ref={ref} className="mermaid-diagram my-4" />;
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
          <div
            className={`text-sm text-gray-700 dark:text-gray-300 ${isExpanded ? 'markdown-content' : 'markdown-content line-clamp-3'}`}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeSanitize]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const language = match ? match[1] : '';
                  
                  // Handle Mermaid diagrams
                  if (language === 'mermaid') {
                    return <MermaidDiagram chart={String(children).replace(/\n$/, '')} />;
                  }
                  
                  // Handle code blocks with syntax highlighting
                  if (!inline && match) {
                    return (
                      <SyntaxHighlighter
                        style={oneDark}
                        language={language}
                        PreTag="div"
                        className="rounded-md my-2"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    );
                  }
                  
                  // Handle inline code
                  return (
                    <code
                      className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm font-mono"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                // Style other markdown elements
                h1: ({ children }) => (
                  <h1 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-md font-medium mb-1 text-gray-900 dark:text-gray-100">{children}</h3>
                ),
                p: ({ children }) => (
                  <p className="mb-2 leading-relaxed">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="ml-2">{children}</li>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-2 text-gray-600 dark:text-gray-400">
                    {children}
                  </blockquote>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-2">
                    <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 bg-gray-100 dark:bg-gray-700 font-semibold text-left">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">
                    {children}
                  </td>
                ),
                a: ({ children, href }) => (
                  <a
                    href={href}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {children}
                  </a>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-gray-900 dark:text-gray-100">{children}</strong>
                ),
                em: ({ children }) => (
                  <em className="italic">{children}</em>
                ),
              }}
            >
              {task.result}
            </ReactMarkdown>
          </div>
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