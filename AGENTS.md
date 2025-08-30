# Repository Guidelines

## Project Structure & Modules
- src/background: service worker entry (`src/background/index.ts`), helpers in `src/background/lib/*` (context menus, notifications, queue, storage).
- src/content: content script (`src/content/index.tsx`) that runs on ChatGPT/Grok pages.
- src/pages/sidepanel: UI (`index.html`, `containers/main.tsx`); also `src/pages/popup`, `src/pages/options`.
- public/_locales/*/messages.json: web UI i18n; shared i18n in `src/common/i18n` and `langConst.ts`.
- Shared modules: `src/common` (db, toast), `src/components`, `src/utils`, `src/types`, `src/styles`.
- Config: `manifest.config.ts`, `vite.config.ts`, `tsconfig.json`.

## Build, Test, and Development
- npm run dev: start Vite + CRX dev server for local development.
- npm run build: create production build in `dist/` for Chrome “Load unpacked”.
- npm run preview: preview the built assets where applicable.
Tip: For manual testing, build and load `dist/` in Chrome: chrome://extensions → Developer mode → Load unpacked.

## Coding Style & Naming
- Language: TypeScript (strict mode), ESNext modules, React JSX.
- Indentation: 2 spaces; line width 100–120; use semicolons.
- Components: PascalCase (`ResultItem.tsx`); functions/variables: camelCase; utilities: camelCase filenames (e.g., `notionUtil.ts`).
- Imports: prefer `@/*` alias; avoid default exports for shared modules.

## Testing Guidelines
- No automated test runner configured yet. For new modules, prefer adding unit tests with Vitest; colocate tests as `<name>.test.ts[x]`.
- Manual flows to verify: context menu “Save to Notion”, background queue/notifications, sidepanel rendering, Notion sync.

## Commit & Pull Request Guidelines
- Commit style: follow Conventional Commits (e.g., `feat: add Grok collector`, `fix: handle Notion rate limits`, `refactor: extract queue`).
- PRs: include clear description, linked issues, before/after screenshots for UI, i18n updates (mention locales touched), and reproduction/testing steps. Ensure `npm run build` passes and the unpacked extension loads.

## Security & Configuration
- Do not commit secrets. `.env` is ignored; prefer storing API keys/tokens via extension settings or secure storage.
- Be mindful of permissions in `manifest.config.ts`; request only what is needed.
- When adding user-facing text, update `public/_locales/*/messages.json` and `src/common/i18n/langConst.ts` consistently.
