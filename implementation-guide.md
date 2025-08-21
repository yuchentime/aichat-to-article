# Sidepanel UI 改造实施指南

## 🚀 实施路线图

### 阶段一：核心组件重构（优先级：高）

#### 1. 更新 Tailwind 配置
```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx,html}'
  ],
  theme: {
    extend: {
      colors: {
        // 状态颜色系统
        status: {
          completed: '#10B981',
          running: '#3B82F6', 
          pending: '#F59E0B',
          error: '#EF4444'
        },
        sync: {
          success: '#10B981',
          pending: '#6B7280'
        }
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem'
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.15)',
        'card-dark': '0 1px 3px rgba(0, 0, 0, 0.3)',
        'card-hover-dark': '0 4px 12px rgba(0, 0, 0, 0.4)'
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out'
      }
    },
  },
  plugins: [],
} satisfies Config;
```

#### 2. 创建设计系统组件

**StatusBadge 组件**
```typescript
// src/components/ui/StatusBadge.tsx
import React from 'react';

type StatusType = 'completed' | 'running' | 'pending' | 'error';

interface StatusBadgeProps {
  status: StatusType;
  children: React.ReactNode;
}

const statusConfig = {
  completed: {
    bg: 'bg-status-completed/10',
    text: 'text-status-completed',
    icon: '✅'
  },
  running: {
    bg: 'bg-status-running/10', 
    text: 'text-status-running',
    icon: '🔄'
  },
  pending: {
    bg: 'bg-status-pending/10',
    text: 'text-status-pending', 
    icon: '⏳'
  },
  error: {
    bg: 'bg-status-error/10',
    text: 'text-status-error',
    icon: '❌'
  }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, children }) => {
  const config = statusConfig[status];
  
  return (
    <span className={`
      inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
      ${config.bg} ${config.text}
    `}>
      <span className="text-xs">{config.icon}</span>
      {children}
    </span>
  );
};
```

**SyncIndicator 组件**
```typescript
// src/components/ui/SyncIndicator.tsx
import React from 'react';

interface SyncIndicatorProps {
  synced: boolean;
  className?: string;
}

export const SyncIndicator: React.FC<SyncIndicatorProps> = ({ synced, className = '' }) => {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className={`
        w-2 h-2 rounded-full
        ${synced ? 'bg-sync-success' : 'bg-sync-pending'}
      `} />
      <span className={`
        text-xs
        ${synced ? 'text-sync-success' : 'text-sync-pending'}
      `}>
        {synced ? '已同步' : '未同步'}
      </span>
    </div>
  );
};
```

#### 3. 重构 ResultItem 组件

```typescript
// src/pages/sidepanel/ResultItem.tsx
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
      <header className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <StatusBadge status="completed">
            已完成
          </StatusBadge>
        </div>
        
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
```

#### 4. 优化主界面布局

```typescript
// src/pages/sidepanel/main.tsx (关键部分修改)
return (
  <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900">
    {/* 顶部导航栏 */}
    <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Logo" className="w-8 h-8" />
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            任务列表
          </h1>
        </div>
        <button
          className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          onClick={() => setShowSettings(true)}
          aria-label="打开设置"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </header>

    {/* 控制面板 */}
    <section className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      {/* API Provider 选择器 */}
      {apiConfigs.length > 0 && (
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            API Provider
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={currentProvider}
            onChange={(e) => handleProviderChange(e.target.value)}
          >
            {apiConfigs.map((c) => (
              <option key={c.provider} value={c.provider}>
                {c.provider}{c.model ? ` (${c.model})` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 任务状态统计 */}
      <div className="flex gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-status-pending rounded-full"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            待处理: <span className="font-medium">{pendingCount}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-status-running rounded-full"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            进行中: <span className="font-medium">{runningCount}</span>
          </span>
        </div>
      </div>
    </section>

    {/* 任务列表 */}
    <main className="flex-1 p-4">
      {tasks.length > 0 ? (
        <div className="space-y-4">
          {tasks.map((task) => (
            <ResultItem
              key={task.id}
              task={task}
              onDelete={deleteTask}
              onViewResult={handleViewResult}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            暂无已完成任务
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            完成的任务将在这里显示
          </p>
        </div>
      )}
    </main>

    {/* 模态框 */}
    {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    {showResultModal && selectedTask && (
      <ResultModal
        id={selectedTask.id}
        isOpen={showResultModal}
        onClose={handleCloseResultModal}
        title={selectedTask.domain}
      />
    )}
  </div>
);
```

### 阶段二：样式系统优化

#### 5. 更新全局样式

```css
/* src/styles/tailwind.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* CSS 变量定义 */
:root {
  color-scheme: light dark;
  
  /* 状态颜色 */
  --color-status-completed: 16 185 129;
  --color-status-running: 59 130 246;
  --color-status-pending: 245 158 11;
  --color-status-error: 239 68 68;
  
  /* 同步状态 */
  --color-sync-success: 16 185 129;
  --color-sync-pending: 107 114 128;
}

/* 基础样式 */
html, body, #root {
  height: 100%;
}

body {
  @apply bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100;
  margin: 0;
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
}

/* 自定义工具类 */
@layer utilities {
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .text-status-completed {
    color: rgb(var(--color-status-completed));
  }
  
  .text-status-running {
    color: rgb(var(--color-status-running));
  }
  
  .text-status-pending {
    color: rgb(var(--color-status-pending));
  }
  
  .text-status-error {
    color: rgb(var(--color-status-error));
  }
  
  .bg-status-completed\/10 {
    background-color: rgb(var(--color-status-completed) / 0.1);
  }
  
  .bg-status-running\/10 {
    background-color: rgb(var(--color-status-running) / 0.1);
  }
  
  .bg-status-pending\/10 {
    background-color: rgb(var(--color-status-pending) / 0.1);
  }
  
  .bg-status-error\/10 {
    background-color: rgb(var(--color-status-error) / 0.1);
  }
}

/* 动画定义 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(10px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  @apply bg-gray-100 dark:bg-gray-800;
}

::-webkit-scrollbar-thumb {
  @apply bg-gray-300 dark:bg-gray-600 rounded-full;
}

::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-400 dark:bg-gray-500;
}
```

### 阶段三：测试和优化

#### 6. 创建测试用例

```typescript
// src/components/__tests__/ResultItem.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import ResultItem from '../sidepanel/ResultItem';

const mockTask: Task = {
  id: '1',
  action: 'test',
  domain: 'example.com',
  status: 'completed',
  result: 'Test result',
  summary: 'Test summary',
  synced: true
};

describe('ResultItem', () => {
  it('renders task information correctly', () => {
    render(
      <ResultItem 
        task={mockTask}
        onDelete={jest.fn()}
        onViewResult={jest.fn()}
      />
    );
    
    expect(screen.getByText('example.com')).toBeInTheDocument();
    expect(screen.getByText('Test summary')).toBeInTheDocument();
    expect(screen.getByText('已同步')).toBeInTheDocument();
  });

  it('calls onViewResult when view button is clicked', () => {
    const mockOnViewResult = jest.fn();
    render(
      <ResultItem 
        task={mockTask}
        onDelete={jest.fn()}
        onViewResult={mockOnViewResult}
      />
    );
    
    fireEvent.click(screen.getByText('查看详情'));
    expect(mockOnViewResult).toHaveBeenCalledWith(mockTask);
  });
});
```

## 📋 实施检查清单

### 开发阶段
- [ ] 更新 Tailwind 配置文件
- [ ] 创建 UI 组件库（StatusBadge, SyncIndicator）
- [ ] 重构 ResultItem 组件
- [ ] 优化主界面布局
- [ ] 更新全局样式文件
- [ ] 添加响应式断点
- [ ] 实现暗色模式优化

### 测试阶段
- [ ] 单元测试覆盖
- [ ] 视觉回归测试
- [ ] 可访问性测试
- [ ] 不同屏幕尺寸测试
- [ ] 暗色/亮色模式切换测试

### 优化阶段
- [ ] 性能监控和优化
- [ ] 动画流畅度调优
- [ ] 用户反馈收集
- [ ] 迭代改进

## 🔧 开发工具推荐

1. **Storybook** - 组件开发和文档
2. **Chromatic** - 视觉回归测试
3. **axe-core** - 可访问性测试
4. **Lighthouse** - 性能测试

这个实施指南提供了详细的代码示例和步骤，确保您能够顺利完成Sidepanel界面的改造工作。