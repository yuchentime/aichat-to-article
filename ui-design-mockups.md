# Sidepanel UI 设计原型和交互流程

## 🎨 视觉设计原型

### 主界面布局设计

```
┌─────────────────────────────────────────────────────┐
│  🔷 任务列表                                    ⚙️  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  📊 API Provider: [Grok (grok-beta)        ▼]     │
│                                                     │
│  🟡 待处理: 2    🔵 进行中: 1                      │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │                              🟢 已同步  ⋮   │   │
│  │                                             │   │
│  │ 📄 example.com                             │   │
│  │ 这是一个任务摘要的预览内容，展示了主要...    │   │
│  │                                             │   │
│  │ [查看详情]                        2小时前   │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │                                      ⋮   │   │
│  │                                             │   │
│  │ 📄 github.com                              │   │
│  │ 另一个任务的摘要内容，包含了重要的信息...    │   │
│  │                                             │   │
│  │ [查看详情]                        5小时前   │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │                              🟢 已同步  ⋮   │   │
│  │                                             │   │
│  │ 📄 stackoverflow.com                       │   │
│  │ 第三个任务的摘要，展示了处理结果的概要...    │   │
│  │                                             │   │
│  │ [查看详情]                        1天前    │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 卡片详细设计

#### 标准卡片状态
```
┌─────────────────────────────────────────────────────┐
│                               [🟢 已同步]    [⋮]  │  ← 状态栏
│                                                     │
│ 📄 example.com                                     │  ← 域名标题
│ 这是一个任务摘要的预览内容，展示了主要的处理结果和   │  ← 摘要内容
│ 关键信息点，帮助用户快速了解任务的执行情况...       │
│                                                     │
│ [查看详情]                              2小时前     │  ← 操作区域
└─────────────────────────────────────────────────────┘
```

#### 悬停状态
```
┌─────────────────────────────────────────────────────┐  ← 阴影加深
│                                 [🟢 已同步]    [⋮]  │  ← 颜色加深
│                                                     │
│ 📄 example.com                                     │  ← 标题高亮
│ 这是一个任务摘要的预览内容，展示了主要的处理结果和   │
│ 关键信息点，帮助用户快速了解任务的执行情况...       │
│                                                     │
│ [查看详情] ← 按钮高亮                    2小时前     │
└─────────────────────────────────────────────────────┘
```

### 操作菜单设计
```
点击 [⋮] 后展开：
┌─────────────────┐
│ 📋 复制结果     │
│ 🗑️ 删除任务     │
│ 📤 导出内容     │
└─────────────────┘
```

## 🎨 颜色规范

### 主色调系统
```css
/* 状态颜色 */
--status-completed: #10B981;    /* 绿色 - 已完成 */
--status-running: #3B82F6;      /* 蓝色 - 进行中 */
--status-pending: #F59E0B;      /* 黄色 - 待处理 */
--status-error: #EF4444;        /* 红色 - 错误 */

/* 同步状态 */
--sync-success: #10B981;        /* 绿色 - 已同步 */
--sync-pending: #6B7280;        /* 灰色 - 未同步 */

/* 背景色 */
--bg-primary: #FFFFFF;          /* 主背景 */
--bg-card: #FFFFFF;             /* 卡片背景 */
--bg-hover: #F9FAFB;            /* 悬停背景 */

/* 文字颜色 */
--text-primary: #111827;        /* 主要文字 */
--text-secondary: #6B7280;      /* 次要文字 */
--text-muted: #9CA3AF;          /* 辅助文字 */

/* 边框和阴影 */
--border-light: #E5E7EB;        /* 浅边框 */
--shadow-card: 0 1px 3px rgba(0,0,0,0.1);
--shadow-hover: 0 4px 12px rgba(0,0,0,0.15);
```

### 暗色模式
```css
/* 暗色模式覆盖 */
@media (prefers-color-scheme: dark) {
  --bg-primary: #111827;
  --bg-card: #1F2937;
  --bg-hover: #374151;
  
  --text-primary: #F9FAFB;
  --text-secondary: #D1D5DB;
  --text-muted: #9CA3AF;
  
  --border-light: #374151;
  --shadow-card: 0 1px 3px rgba(0,0,0,0.3);
  --shadow-hover: 0 4px 12px rgba(0,0,0,0.4);
}
```

## 📐 间距和尺寸规范

### 间距系统
```css
/* 间距变量 */
--space-xs: 4px;    /* 极小间距 */
--space-sm: 8px;    /* 小间距 */
--space-md: 12px;   /* 中等间距 */
--space-lg: 16px;   /* 大间距 */
--space-xl: 24px;   /* 超大间距 */

/* 卡片规范 */
--card-padding: var(--space-lg);
--card-gap: var(--space-lg);
--card-radius: 8px;

/* 按钮规范 */
--button-padding-x: var(--space-md);
--button-padding-y: var(--space-sm);
--button-radius: 6px;
```

### 字体系统
```css
/* 字体大小 */
--text-xs: 12px;    /* 辅助文字 */
--text-sm: 14px;    /* 正文 */
--text-base: 16px;  /* 标题 */
--text-lg: 18px;    /* 大标题 */

/* 字体粗细 */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* 行高 */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
```

## 🔄 交互状态设计

### 卡片状态变化
```
默认状态 → 悬停状态 → 点击状态
   ↓           ↓          ↓
基础样式    阴影提升    轻微缩放
```

### 按钮状态
```css
/* 主要按钮 */
.btn-primary {
  background: #3B82F6;
  color: white;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: #2563EB;
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: translateY(0);
}

/* 次要按钮 */
.btn-secondary {
  background: transparent;
  color: #6B7280;
  border: 1px solid #E5E7EB;
}

.btn-secondary:hover {
  background: #F9FAFB;
  color: #374151;
}
```

## 📱 响应式设计

### 断点系统
```css
/* Chrome Extension 侧边栏宽度范围 */
@media (max-width: 360px) {
  /* 最小宽度优化 */
  --card-padding: var(--space-md);
  --text-base: 14px;
}

@media (min-width: 400px) {
  /* 标准宽度 */
  --card-padding: var(--space-lg);
  --text-base: 16px;
}

@media (min-width: 480px) {
  /* 最大宽度优化 */
  --card-padding: var(--space-xl);
}
```

### 自适应布局
```css
/* 卡片容器 */
.card-container {
  display: flex;
  flex-direction: column;
  gap: var(--card-gap);
  padding: var(--space-lg);
}

/* 卡片内部布局 */
.card {
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: var(--space-md);
  padding: var(--card-padding);
}
```

## 🎯 微交互设计

### 动画时长
```css
/* 动画变量 */
--duration-fast: 0.15s;     /* 快速交互 */
--duration-normal: 0.2s;    /* 标准交互 */
--duration-slow: 0.3s;      /* 慢速交互 */

/* 缓动函数 */
--ease-out: cubic-bezier(0.25, 0.46, 0.45, 0.94);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### 关键动画
1. **卡片悬停**：阴影提升 + 轻微位移
2. **按钮点击**：缩放反馈
3. **状态变化**：颜色渐变
4. **内容加载**：骨架屏动画

## 🔍 可访问性考虑

### 键盘导航
- Tab键顺序：设置按钮 → API选择器 → 卡片列表 → 操作按钮
- Enter键：激活按钮和链接
- 空格键：选择下拉选项

### 屏幕阅读器
```html
<!-- 卡片结构 -->
<article role="listitem" aria-labelledby="task-title-{id}">
  <header>
    <span class="sync-indicator" aria-label="同步状态：已同步">🟢</span>
  </header>
  
  <h3 id="task-title-{id}">{domain}</h3>
  <p class="summary">{summary}</p>
  
  <footer>
    <button aria-label="查看 {domain} 的详细结果">查看详情</button>
    <time datetime="{timestamp}">{relativeTime}</time>
  </footer>
</article>
```

### 颜色对比度
- 所有文字与背景的对比度 ≥ 4.5:1
- 状态指示器使用图标+颜色双重标识
- 暗色模式下的对比度优化

---

这个详细的设计原型为您的Sidepanel界面改造提供了完整的视觉和交互指导，确保实现卡片式设计的同时提升可读性和视觉层次。