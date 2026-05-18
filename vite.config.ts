import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    sveltekit(),

    VitePWA({
    strategies: 'generateSW',

    registerType: 'autoUpdate',

    includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
        'icon512_maskable.png',
        'icon512_rounded.png'
    ],

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
    },

    workbox: {
        navigateFallback: null,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true
    }
})
  ]
})
