import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { generate } from './generator'

// Minimal content script UI mounted via Shadow DOM to avoid site CSS conflicts
const hostId = 'vite-react-ts-extension-content-root';

// 仅在允许的域名上注入（例如：https://chatgpt.com/）
const allowedHosts = ['chatgpt.com', 'www.chatgpt.com'];

// mount 函数负责创建 Shadow DOM 宿主元素，将样式注入其中，并挂载 React 应用程序。
// 它确保内容脚本的 UI 在页面上是隔离的，避免与现有页面样式和脚本冲突。
function mount(domain: string) {
  console.log('[content] mounting on domain:', domain);

  if (document.getElementById(hostId)) return;

  const host = document.createElement('div');
  host.id = hostId;
  const shadow = host.attachShadow({ mode: 'open' });

  const mountPoint = document.createElement('div');
  shadow.appendChild(mountPoint);

  // Optional: inject minimal styles scoped to shadow root
  const style = document.createElement('style');
  style.textContent = `
    .__badge {
      position: fixed;
      z-index: 2147483647;
      right: 12px;
      bottom: 12px;
      background: #2563eb;
      color: #fff;
      font: 12px/1.2 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
      padding: 6px 8px;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,.15);
      cursor: pointer;
      opacity: .9;
    }
    .__badge:hover { opacity: 1; }
    
    .__modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 2147483648;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .__modal {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      width: 33vw;
      height: 63vh;
      max-width: 600px;
      max-height: 800px;
      min-width: 400px;
      min-height: 800px;
      display: flex;
      flex-direction: column;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
    }
    
    .__modal-header {
      padding: 20px 24px 16px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .__modal-title {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }
    
    .__modal-close {
      background: none;
      border: none;
      font-size: 24px;
      color: #6b7280;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      line-height: 1;
    }
    
    .__modal-close:hover {
      background: #f3f4f6;
      color: #374151;
    }
    
    .__modal-content {
      flex: 1;
      padding: 20px 24px;
      overflow-y: auto;
      color: #374151;
      line-height: 1.6;
    }
    
    .__loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #6b7280;
    }
    
    .__loading-spinner {
      width: 20px;
      height: 20px;
      border: 2px solid #e5e7eb;
      border-top: 2px solid #2563eb;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-right: 12px;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .__markdown h1, .__markdown h2, .__markdown h3 {
      font-weight: 600;
      margin: 16px 0 8px 0;
      color: #111827;
    }
    
    .__markdown h1 { font-size: 24px; }
    .__markdown h2 { font-size: 20px; }
    .__markdown h3 { font-size: 18px; }
    
    .__markdown p {
      margin: 12px 0;
    }
    
    .__markdown ul, .__markdown ol {
      margin: 12px 0;
      padding-left: 24px;
    }
    
    .__markdown li {
      margin: 4px 0;
    }
    
    .__markdown code {
      background: #f3f4f6;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
      font-size: 14px;
    }
    
    .__markdown pre {
      background: #f3f4f6;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 12px 0;
    }
    
    .__markdown blockquote {
      border-left: 4px solid #e5e7eb;
      padding-left: 16px;
      margin: 12px 0;
      color: #6b7280;
      font-style: italic;
    }
    
    .__markdown strong {
      font-weight: 600;
    }
    
    .__markdown em {
      font-style: italic;
    }
  `;
  shadow.appendChild(style);

  document.documentElement.appendChild(host);

  // App 组件是一个简单的 React 函数组件，它渲染一个可点击的徽章。
  // 点击徽章会向扩展的后台脚本发送一条消息。
  const ExecutionButton = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [articleContent, setArticleContent] = useState('');

    // Simple Markdown to HTML converter
    const parseMarkdown = (markdown: string) => {
      return markdown
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/gim, '<em>$1</em>')
        .replace(/`(.*?)`/gim, '<code>$1</code>')
        .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
        .replace(/^\* (.*$)/gim, '<li>$1</li>')
        .replace(/^- (.*$)/gim, '<li>$1</li>')
        .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
        .replace(/\n\n/gim, '</p><p>')
        .replace(/\n/gim, '<br>')
        .replace(/(<li>.*<\/li>)/gims, '<ul>$1</ul>')
        .replace(/<\/ul>\s*<ul>/gim, '')
        .replace(/^(.*)$/gim, '<p>$1</p>')
        .replace(/<p><h/gim, '<h')
        .replace(/<\/h([1-6])><\/p>/gim, '</h$1>')
        .replace(/<p><blockquote>/gim, '<blockquote>')
        .replace(/<\/blockquote><\/p>/gim, '</blockquote>')
        .replace(/<p><ul>/gim, '<ul>')
        .replace(/<\/ul><\/p>/gim, '</ul>');
    };

    const loadingCurrentMessages = () => {
      // 展示弹窗。弹窗宽高约占屏幕的 1/3，因为要容纳百字文本量
      setIsModalOpen(true);
      setIsLoading(true);
      setArticleContent('');

      generate(domain).then((article) => {
        if (article) {
          console.log('Article generated:', article);
          // 将生成的文章内容展示到弹窗内。注意Markdown格式
          setArticleContent(article);
        } else {
          console.warn('No article generated.');
          setArticleContent('No article was generated. Please try again.');
        }
      }).catch((error) => {
        console.error('Error generating summary:', error);
        setArticleContent('Error generating article. Please try again.');
      }).finally(() => {
        setIsLoading(false);
      });
    };

    const closeModal = () => {
      setIsModalOpen(false);
      setArticleContent('');
      setIsLoading(false);
    };

    return (
      <>
        <div className="__badge" onClick={loadingCurrentMessages}>
          Generate Post
        </div>
        
        {isModalOpen && (
          <div className="__modal-overlay" onClick={closeModal}>
            <div className="__modal" onClick={(e) => e.stopPropagation()}>
              <div className="__modal-header">
                <h2 className="__modal-title">Generated Article</h2>
                <button className="__modal-close" onClick={closeModal}>
                  ×
                </button>
              </div>
              <div className="__modal-content">
                {isLoading ? (
                  <div className="__loading">
                    <div className="__loading-spinner"></div>
                    Generating article...
                  </div>
                ) : (
                  <div
                    className="__markdown"
                    dangerouslySetInnerHTML={{
                      __html: parseMarkdown(articleContent)
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  const root = createRoot(mountPoint);
  root.render(<ExecutionButton />);
}

try {
  // 仅当访问允许的域名时才注入按钮
  const isAllowed = allowedHosts.includes(location.hostname);
  if (!isAllowed) {
    console.log('[content] skipped - domain not allowed:', location.hostname);
  } else {
    mount(location.hostname);
    // HMR friendly: re-mount on updates
    if (import.meta.hot) {
      import.meta.hot.accept(() => {
        const existing = document.getElementById(hostId);
        if (existing) existing.remove();
        mount(location.hostname);
        console.log('[content] HMR update applied');
      });
    }
    console.log('[content] injected');
  }
} catch (e) {
  // ignore
}