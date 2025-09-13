# AI Chat to Notion - Chrome Extension

A Chrome Extension for converting AI chats to organized articles and syncing them to Notion. Supports ChatGPT and Grok platforms.

## 项目结构 / Project Structure

```
aichat-to-notion/
├── 📁 config/                    # Configuration files
├── 📁 public/                    # Static assets and localization
│   └── _locales/                # Chrome extension localization files
├── 📁 scripts/                  # Build and utility scripts
├── 📁 src/                      # Source code
│   ├── 📁 api/                  # API integrations
│   │   ├── chatApi.ts           # AI chat platform APIs
│   │   ├── commonRequest.ts     # HTTP request utilities
│   │   └── notionApi.ts         # Notion API integration
│   ├── 📁 assets/               # Static assets
│   │   └── img/                 # Images and icons
│   ├── 📁 background/           # Background service worker (MV3)
│   │   ├── lib/                 # Background utilities
│   │   │   ├── badge.ts         # Extension badge management
│   │   │   ├── contextMenus.ts  # Context menu handlers
│   │   │   ├── notifications.ts # Browser notifications
│   │   │   ├── state.ts         # Background state management
│   │   │   └── storage.ts       # Chrome storage utilities
│   │   ├── index.ts             # Background script entry
│   │   ├── messageHandlers.ts   # Message handling logic
│   │   └── messageRouter.ts     # Central message routing
│   ├── 📁 collectors/           # Data collection from AI platforms
│   │   ├── ChatgptCollector.ts  # ChatGPT-specific collector
│   │   ├── CollectorFactory.ts  # Factory pattern implementation
│   │   ├── DefaultCollector.ts  # Base collector implementation
│   │   ├── GeminiCollector.ts   # Gemini-specific collector
│   │   ├── GrokCollector.ts     # Grok-specific collector
│   │   └── MessageCollector.ts  # Message collection interface
│   ├── 📁 common/               # Shared utilities and services
│   │   ├── db.ts                # IndexedDB management (Dexie)
│   │   ├── i18n/                # Internationalization
│   │   │   ├── i18n.tsx         # React i18n hooks
│   │   │   └── langConst.ts     # Language constants
│   │   └── toast/               # Notification system
│   │       ├── index.ts         # Toast utilities
│   │       ├── ToastManager.ts  # Toast management
│   │       └── types.ts         # Toast type definitions
│   ├── 📁 components/           # React components
│   │   ├── common/              # Shared components
│   │   │   ├── Loading.tsx      # Loading spinner
│   │   │   ├── ModeSelector.tsx # UI mode selection
│   │   │   ├── ResultItem.tsx   # Task result display
│   │   │   └── ResultModal.tsx  # Result modal dialog
│   │   ├── markdown/            # Markdown rendering
│   │   │   ├── MarkdownRenderer.tsx # Main markdown renderer
│   │   │   └── MermaidDiagram.tsx   # Mermaid diagram support
│   │   ├── notion/              # Notion-related components
│   │   │   └── NotionLocationPicker.tsx # Notion page picker
│   │   ├── settings/            # Settings components
│   │   └── ui/                  # UI components
│   ├── 📁 content/              # Content scripts
│   │   └── index.ts             # Content script entry
│   ├── 📁 core/                 # Core business logic
│   ├── 📁 hooks/                # React custom hooks
│   ├── 📁 pages/                # Extension pages
│   │   ├── options/             # Options page
│   │   ├── popup/               # Extension popup
│   │   └── sidepanel/           # Main sidepanel UI
│   │       └── containers/      # Sidepanel containers
│   ├── 📁 prompts/              # AI prompt templates
│   ├── 📁 styles/               # Global styles
│   ├── 📁 types/                # TypeScript type definitions
│   └── 📁 utils/                # Utility functions
├── manifest.config.ts           # Chrome extension manifest
├── package.json                 # Dependencies and scripts
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── vite.config.ts               # Vite build configuration
```

## 核心架构 / Core Architecture

### Extension Components
- **Background Service Worker** (`src/background/`): Extension lifecycle, message routing, task queue
- **Content Scripts** (`src/content/`): Injected into AI chat platforms for data collection
- **Side Panel** (`src/pages/sidepanel/`): Main UI for task management and results
- **Options Page** (`src/pages/options/`): Extension configuration interface

### Data Collection System
- **Collector Factory** (`src/collectors/CollectorFactory.ts`): Platform-specific data extraction
- **Platform Collectors**: ChatGPT, Grok, Gemini specialized collectors
- **Message Router** (`src/background/messageRouter.ts`): Centralized communication

### Storage & State Management
- **Chrome Storage** (`src/background/lib/storage.ts`): Extension settings and state
- **IndexedDB** (`src/common/db.ts`): Local data persistence with Dexie
- **Task Queue System**: Background processing with state persistence

### UI & Components
- **React 18 + TypeScript**: Modern component architecture
- **Tailwind CSS**: Utility-first styling
- **Internationalization**: Multi-language support via `_locales`
- **Toast Notifications**: User feedback system

## 技术栈 / Technology Stack

| Category | Technology |
|----------|------------|
| **Framework** | React 18 + TypeScript |
| **Build Tool** | Vite + CRXJS |
| **Styling** | Tailwind CSS |
| **Extension API** | Chrome Extensions MV3 |
| **Database** | IndexedDB (Dexie) |
| **Integration** | Notion API |
| **Markdown** | react-markdown + Mermaid |

## 开发命令 / Development Commands

```bash
npm run dev     # Start development server with HMR
npm run build   # Production build
npm run preview # Preview build
```

## Project Architecture
