import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  manifest_version: 3,
  name: 'Vite React TS Chrome Extension',
  version: '0.1.0',
  icons: {
    128: 'src/assets/img/icon-128.png',
    34: 'src/assets/img/icon-34.png'
  },
  action: {
    default_title: 'Vite React TS',
    default_popup: 'src/pages/popup/index.html',
    default_icon: {
      34: 'src/assets/img/icon-34.png',
      128: 'src/assets/img/icon-128.png'
    }
  },
  side_panel: {
    default_path: 'src/pages/sidepanel/index.html'
  },
  options_page: 'src/pages/options/index.html',
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module'
  },
  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self';"
  },
  content_scripts: [
    {
      matches: ['https://chatgpt.com/*', 'https://www.chatgpt.com/*'],
      js: ['src/content/index.tsx']
    }
  ],
  permissions: ['sidePanel', 'storage'],
  host_permissions: ['https://chatgpt.com/*', 'https://www.chatgpt.com/*']
} as any);
