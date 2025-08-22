import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  manifest_version: 3,
  default_locale: 'en',
  name: '__MSG_ext_name__',
  description: '__MSG_ext_desc__',
  version: '0.1.0',
  icons: {
    128: 'src/assets/img/icon-128.png',
    34: 'src/assets/img/icon-34.png'
  },
  action: {
    // default_title: 'Vite React TS',
    // default_popup: 'src/pages/popup/index.html',
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
      matches: ['https://chatgpt.com/*', 'https://grok.com/*', 'https://gemini.google.com/*', 'http://localhost:5173/*'],
      js: ['src/content/index.tsx']
    }
  ],
  permissions: ['sidePanel', 'storage', 'contextMenus', 'notifications', 'badge'],
  host_permissions: ['https://chatgpt.com/*', 'https://grok.com/*', 'https://gemini.google.com/*', 'http://localhost:5173/*']
} as any);
