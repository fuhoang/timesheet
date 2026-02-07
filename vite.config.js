import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/main.jsx'],
            refresh: true,
        }),
        tailwindcss(),
    ],
    test: {
        environment: 'jsdom',
        setupFiles: 'resources/js/test/setup.js',
    },
    server: {
        host: 'localhost',
        port: 5173,
        strictPort: true,
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});

