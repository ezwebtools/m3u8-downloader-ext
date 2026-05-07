import { defineConfig } from 'wxt';
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  modules: ['@wxt-dev/module-vue'],
  manifest: ({ browser }) => ({
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    default_locale: 'en',
    permissions: [
      'storage', 'tabs', 'webRequest', 'downloads',
      ...(browser !== 'firefox' ? ['sidePanel'] : []),
    ],
    host_permissions: ['<all_urls>'],
    web_accessible_resources: [
      {
        resources: ['/injected.js', '/MediaInfoModule.wasm'],
        matches: ['<all_urls>'],
      },
    ],
    homepage_url: 'https://github.com/ezwebtools/flowpick',
    minimum_chrome_version: browser === 'firefox' ? undefined : '102',
    ...(browser !== 'firefox' ? {
      side_panel: {
        default_path: 'sidepanel.html',
        open_at_install: false,
      },
    } : {}),
  }),
});
