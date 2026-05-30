import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    sveltekit(),

VitePWA({
    strategies: 'injectManifest',
    srcDir: 'src',
    filename: 'service-worker.js',
    registerType: 'autoUpdate',
    scope: '/',
    base: '/',

injectManifest: {
    globDirectory: '.svelte-kit/output/client',
    globPatterns: ['**/*.{js,css,ico,png,svg,webp,webmanifest}'],
    injectionPoint: 'self.__WB_MANIFEST',
    
    manifestTransforms: [
        async (manifestEntries) => {
            manifestEntries.push({
                url: '/',
                revision: Date.now().toString(),
                size: 0
            });
            return { manifest: manifestEntries };
        }
    ]
},

    manifest: {
        theme_color: '#f4f93c',
        background_color: '#2EC6FE',
        name: 'Realsy',
        short_name: 'Rsy',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        icons: [
            {
                src: 'icon512_maskable.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable'
            },
            {
                src: 'icon512_rounded.png',
                sizes: '512x512',
                type: 'image/png'
            }
        ],
        screenshots: [
          {
            src: 'screenshot-mobile.png',
            sizes: '1080x1920',
            type: 'image/png',
            form_factor: 'narrow'
          },
          {
            src: 'screenshot-desktop.png',
            sizes: '1920x1080',
            type: 'image/png',
            form_factor: 'wide'
          }
        ]
    }
})
  ],
  base: '/'
})
