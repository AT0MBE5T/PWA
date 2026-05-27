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

    injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
    },

    manifest: {
        theme_color: '#f4f93c',
        background_color: '#2EC6FE',
        name: 'Realsy',
        short_name: 'Rsy',
        start_url: '/',
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
        ]
    }
})
  ],
  base: '/'
})
