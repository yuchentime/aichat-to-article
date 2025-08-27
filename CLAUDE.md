# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Product Description
A Chrome Extension for converting AI chats to organized articles and syncing them to Notion. Supports ChatGPT and Grok platforms.

## Development Commands
- `npm run dev` - Start development server with HMR (creates `.output/chrome-mv3` for loading unpacked extension)
- `npm run build` - Production build (outputs to `dist/`)
- `npm run preview` - Preview build

## Architecture Overview
This is a Chrome Extension MV3 built with React + TypeScript + Vite + Tailwind CSS.

### Core Components
- **Background Service Worker** (`src/background/`): Handles extension lifecycle, context menus, notifications, and message routing
- **Content Scripts** (`src/content/`): Injected into ChatGPT/Grok pages for data collection
- **Side Panel** (`src/pages/sidepanel/`): Main UI for managing tasks and viewing results
- **Options Page** (`src/pages/options/`): Extension configuration
- **Collectors** (`src/lib/collector/`): Platform-specific data extraction (ChatGPT, Grok)

### Key Architecture Patterns
- **Message Router** (`src/background/messageRouter.ts`): Centralized message handling between extension parts
- **Collector Factory** (`src/lib/collector/CollectorFactory.ts`): Factory pattern for platform-specific data collection
- **Task Queue System** (`src/background/queue.ts`): Manages processing tasks with state persistence
- **Storage Management** (`src/lib/storage.ts`, `src/lib/db.ts`): Chrome storage and IndexedDB for data persistence

### Data Flow
1. Content scripts collect chat data using platform-specific collectors
2. Background worker processes tasks via queue system  
3. Side panel displays task status and results
4. Notion API integration for article synchronization

## Code Structure & Modularity
- Never create a file longer than 500 lines of code. If a file approaches this limit, refactor by splitting it into modules or helper files.
- Organize code into clearly separated modules, grouped by feature or responsibility.
- Use clear, consistent imports (prefer relative imports within packages).

## Notifiaction
- **Broswer notification**(`src/background/notification`): Sending notification from background tasks
- **Page notification**(`src/lib/toast/index`): Sending notification from pages

## i18n
- For pages, Getting differrent language text from `public\_locales` using useI18n() 
- For background, Getting differrent language text from `src/lib/langConst`

## Technology Stack
- React 18 + TypeScript
- Vite + CRXJS (Chrome Extension support)
- Tailwind CSS
- Chrome Extensions MV3
- IndexedDB (via Dexie)
- Notion API integration