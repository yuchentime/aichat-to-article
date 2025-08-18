# Vite React TS Chrome Extension (MV3) with Tailwind & HMR

A Chrome Extension boilerplate using React + TypeScript, bundled by Vite, styled with Tailwind CSS, and powered by crxjs for MV3 + HMR.

## Features

- MV3 manifest via crxjs
- React 18 + TypeScript
- Vite 5 for fast dev/build
- Tailwind CSS (JIT)
- HMR for popup, options, background, and content script (via CRXJS)

## Scripts

- Dev server: `npm run dev`
- Production build: `npm run build`
- Preview (generic Vite): `npm run preview`

## Development (HMR)

1) Install dependencies
- `npm install`

2) Start dev build
- `npm run dev`

3) Load the extension into Chrome
- Open `chrome://extensions`
- Enable "Developer mode"
- Click "Load unpacked"
- Select the folder `.output/chrome-mv3` (created by the dev server)

4) Test changes
- Open the extension popup to see React + Tailwind UI
- Open Options Page via chrome://extensions → Details → Options
- HMR will live-update popup/options/content/background when you edit files

Notes:
- Content script is injected on https://*/* and http://*/* (see manifest)
- HMR for content script is supported by CRXJS; updates will be hot-applied or trigger reloads as needed

## Production Build

- `npm run build`
- Output directory: `dist/`
- To load production build, use "Load unpacked" and choose `dist/`

## Project Structure

- `manifest.config.ts`: MV3 manifest source (crxjs)
- `vite.config.ts`: Vite + React + CRX plugin config
- `src/pages/popup/`: Popup page (HTML + TSX)
- `src/pages/options/`: Options page (HTML + TSX)
- `src/background/`: Background service worker (TS)
- `src/content/`: Content script (TSX)
- `src/styles/tailwind.css`: Tailwind base styles
- Tailwind/PostCSS configs: `tailwind.config.ts`, `postcss.config.js`
- TS configs: `tsconfig.json`, `tsconfig.node.json`

## Files of Interest

- Popup HTML: `src/pages/popup/index.html`
- Popup entry: `src/pages/popup/main.tsx`
- Options HTML: `src/pages/options/index.html`
- Options entry: `src/pages/options/main.tsx`
- Content script: `src/content/index.tsx`
- Background SW: `src/background/index.ts`
- Manifest (source): `manifest.config.ts`
- Vite config: `vite.config.ts`

## Troubleshooting

- If VSCode shows "Cannot find name 'chrome'":
  - We include `chrome-types`; ensure `tsconfig.json` has `"types": ["chrome-types", "vite/client"]` and VSCode TypeScript server has reloaded.
- If Tailwind classes don't apply:
  - Ensure `src/styles/tailwind.css` is imported in each page entry (popup/options).
- If HMR doesn’t seem active:
  - Confirm `.output/chrome-mv3` is loaded (dev build), not the `dist` folder.
  - Check the terminal and DevTools console for CRXJS logs."# browser-extesion-boilerplate-react" 
