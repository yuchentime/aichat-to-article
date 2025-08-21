// vite.config.ts
import { defineConfig } from "file:///D:/projects/aichat-to-notion/node_modules/vite/dist/node/index.js";
import react from "file:///D:/projects/aichat-to-notion/node_modules/@vitejs/plugin-react/dist/index.js";
import { crx } from "file:///D:/projects/aichat-to-notion/node_modules/@crxjs/vite-plugin/dist/index.mjs";

// manifest.config.ts
import { defineManifest } from "file:///D:/projects/aichat-to-notion/node_modules/@crxjs/vite-plugin/dist/index.mjs";
var manifest_config_default = defineManifest({
  manifest_version: 3,
  name: "Vite React TS Chrome Extension",
  version: "0.1.0",
  icons: {
    128: "src/assets/img/icon-128.png",
    34: "src/assets/img/icon-34.png"
  },
  action: {
    default_title: "Vite React TS",
    default_popup: "src/pages/popup/index.html",
    default_icon: {
      34: "src/assets/img/icon-34.png",
      128: "src/assets/img/icon-128.png"
    }
  },
  side_panel: {
    default_path: "src/pages/sidepanel/index.html"
  },
  options_page: "src/pages/options/index.html",
  background: {
    service_worker: "src/background/index.ts",
    type: "module"
  },
  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self';"
  },
  content_scripts: [
    {
      matches: ["https://chatgpt.com/*", "https://www.chatgpt.com/*"],
      js: ["src/content/index.tsx"]
    }
  ],
  permissions: ["sidePanel", "storage", "contextMenus"],
  host_permissions: ["https://chatgpt.com/*", "https://www.chatgpt.com/*"]
});

// vite.config.ts
import { fileURLToPath, URL } from "node:url";
var __vite_injected_original_import_meta_url = "file:///D:/projects/aichat-to-notion/vite.config.ts";
var vite_config_default = defineConfig(({ mode }) => ({
  plugins: [
    react(),
    crx({ manifest: manifest_config_default })
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url))
    }
  },
  build: {
    outDir: "dist",
    sourcemap: mode !== "production"
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAibWFuaWZlc3QuY29uZmlnLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRDpcXFxccHJvamVjdHNcXFxcYWljaGF0LXRvLW5vdGlvblwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxccHJvamVjdHNcXFxcYWljaGF0LXRvLW5vdGlvblxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovcHJvamVjdHMvYWljaGF0LXRvLW5vdGlvbi92aXRlLmNvbmZpZy50c1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnO1xyXG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xyXG5pbXBvcnQgeyBjcnggfSBmcm9tICdAY3J4anMvdml0ZS1wbHVnaW4nO1xyXG5pbXBvcnQgbWFuaWZlc3QgZnJvbSAnLi9tYW5pZmVzdC5jb25maWcnO1xyXG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoLCBVUkwgfSBmcm9tICdub2RlOnVybCc7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xyXG4gIHBsdWdpbnM6IFtcclxuICAgIHJlYWN0KCksXHJcbiAgICBjcngoeyBtYW5pZmVzdCB9KVxyXG4gIF0sXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IHtcclxuICAgICAgJ0AnOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vc3JjJywgaW1wb3J0Lm1ldGEudXJsKSlcclxuICAgIH1cclxuICB9LFxyXG4gIGJ1aWxkOiB7XHJcbiAgICBvdXREaXI6ICdkaXN0JyxcclxuICAgIHNvdXJjZW1hcDogbW9kZSAhPT0gJ3Byb2R1Y3Rpb24nXHJcbiAgfVxyXG59KSk7IiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxwcm9qZWN0c1xcXFxhaWNoYXQtdG8tbm90aW9uXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxwcm9qZWN0c1xcXFxhaWNoYXQtdG8tbm90aW9uXFxcXG1hbmlmZXN0LmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovcHJvamVjdHMvYWljaGF0LXRvLW5vdGlvbi9tYW5pZmVzdC5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVNYW5pZmVzdCB9IGZyb20gJ0Bjcnhqcy92aXRlLXBsdWdpbic7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVNYW5pZmVzdCh7XHJcbiAgbWFuaWZlc3RfdmVyc2lvbjogMyxcclxuICBuYW1lOiAnVml0ZSBSZWFjdCBUUyBDaHJvbWUgRXh0ZW5zaW9uJyxcclxuICB2ZXJzaW9uOiAnMC4xLjAnLFxyXG4gIGljb25zOiB7XHJcbiAgICAxMjg6ICdzcmMvYXNzZXRzL2ltZy9pY29uLTEyOC5wbmcnLFxyXG4gICAgMzQ6ICdzcmMvYXNzZXRzL2ltZy9pY29uLTM0LnBuZydcclxuICB9LFxyXG4gIGFjdGlvbjoge1xyXG4gICAgZGVmYXVsdF90aXRsZTogJ1ZpdGUgUmVhY3QgVFMnLFxyXG4gICAgZGVmYXVsdF9wb3B1cDogJ3NyYy9wYWdlcy9wb3B1cC9pbmRleC5odG1sJyxcclxuICAgIGRlZmF1bHRfaWNvbjoge1xyXG4gICAgICAzNDogJ3NyYy9hc3NldHMvaW1nL2ljb24tMzQucG5nJyxcclxuICAgICAgMTI4OiAnc3JjL2Fzc2V0cy9pbWcvaWNvbi0xMjgucG5nJ1xyXG4gICAgfVxyXG4gIH0sXHJcbiAgc2lkZV9wYW5lbDoge1xyXG4gICAgZGVmYXVsdF9wYXRoOiAnc3JjL3BhZ2VzL3NpZGVwYW5lbC9pbmRleC5odG1sJ1xyXG4gIH0sXHJcbiAgb3B0aW9uc19wYWdlOiAnc3JjL3BhZ2VzL29wdGlvbnMvaW5kZXguaHRtbCcsXHJcbiAgYmFja2dyb3VuZDoge1xyXG4gICAgc2VydmljZV93b3JrZXI6ICdzcmMvYmFja2dyb3VuZC9pbmRleC50cycsXHJcbiAgICB0eXBlOiAnbW9kdWxlJ1xyXG4gIH0sXHJcbiAgY29udGVudF9zZWN1cml0eV9wb2xpY3k6IHtcclxuICAgIGV4dGVuc2lvbl9wYWdlczogXCJzY3JpcHQtc3JjICdzZWxmJzsgb2JqZWN0LXNyYyAnc2VsZic7XCJcclxuICB9LFxyXG4gIGNvbnRlbnRfc2NyaXB0czogW1xyXG4gICAge1xyXG4gICAgICBtYXRjaGVzOiBbJ2h0dHBzOi8vY2hhdGdwdC5jb20vKicsICdodHRwczovL3d3dy5jaGF0Z3B0LmNvbS8qJ10sXHJcbiAgICAgIGpzOiBbJ3NyYy9jb250ZW50L2luZGV4LnRzeCddXHJcbiAgICB9XHJcbiAgXSxcclxuICBwZXJtaXNzaW9uczogWydzaWRlUGFuZWwnLCAnc3RvcmFnZScsICdjb250ZXh0TWVudXMnXSxcclxuICBob3N0X3Blcm1pc3Npb25zOiBbJ2h0dHBzOi8vY2hhdGdwdC5jb20vKicsICdodHRwczovL3d3dy5jaGF0Z3B0LmNvbS8qJ11cclxufSBhcyBhbnkpO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTRRLFNBQVMsb0JBQW9CO0FBQ3pTLE9BQU8sV0FBVztBQUNsQixTQUFTLFdBQVc7OztBQ0ZnUSxTQUFTLHNCQUFzQjtBQUVuVCxJQUFPLDBCQUFRLGVBQWU7QUFBQSxFQUM1QixrQkFBa0I7QUFBQSxFQUNsQixNQUFNO0FBQUEsRUFDTixTQUFTO0FBQUEsRUFDVCxPQUFPO0FBQUEsSUFDTCxLQUFLO0FBQUEsSUFDTCxJQUFJO0FBQUEsRUFDTjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sZUFBZTtBQUFBLElBQ2YsZUFBZTtBQUFBLElBQ2YsY0FBYztBQUFBLE1BQ1osSUFBSTtBQUFBLE1BQ0osS0FBSztBQUFBLElBQ1A7QUFBQSxFQUNGO0FBQUEsRUFDQSxZQUFZO0FBQUEsSUFDVixjQUFjO0FBQUEsRUFDaEI7QUFBQSxFQUNBLGNBQWM7QUFBQSxFQUNkLFlBQVk7QUFBQSxJQUNWLGdCQUFnQjtBQUFBLElBQ2hCLE1BQU07QUFBQSxFQUNSO0FBQUEsRUFDQSx5QkFBeUI7QUFBQSxJQUN2QixpQkFBaUI7QUFBQSxFQUNuQjtBQUFBLEVBQ0EsaUJBQWlCO0FBQUEsSUFDZjtBQUFBLE1BQ0UsU0FBUyxDQUFDLHlCQUF5QiwyQkFBMkI7QUFBQSxNQUM5RCxJQUFJLENBQUMsdUJBQXVCO0FBQUEsSUFDOUI7QUFBQSxFQUNGO0FBQUEsRUFDQSxhQUFhLENBQUMsYUFBYSxXQUFXLGNBQWM7QUFBQSxFQUNwRCxrQkFBa0IsQ0FBQyx5QkFBeUIsMkJBQTJCO0FBQ3pFLENBQVE7OztBRGpDUixTQUFTLGVBQWUsV0FBVztBQUprSSxJQUFNLDJDQUEyQztBQU10TixJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssT0FBTztBQUFBLEVBQ3pDLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLElBQUksRUFBRSxrQ0FBUyxDQUFDO0FBQUEsRUFDbEI7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssY0FBYyxJQUFJLElBQUksU0FBUyx3Q0FBZSxDQUFDO0FBQUEsSUFDdEQ7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsSUFDUixXQUFXLFNBQVM7QUFBQSxFQUN0QjtBQUNGLEVBQUU7IiwKICAibmFtZXMiOiBbXQp9Cg==
