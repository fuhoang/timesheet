import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
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
            include: ['resources/js/**/*.{test,spec}.{js,jsx,ts,tsx}'],
            exclude: ['e2e/**', 'node_modules/**'],
            coverage: {
                reporter: ['text', 'lcov'],
                reportsDirectory: 'coverage',
            },
        },
        server: {
            host: env.VITE_HOST || '127.0.0.1',
            port: Number(env.VITE_PORT || 5173),
            strictPort: true,
            hmr: {
                host: env.VITE_HOST || '127.0.0.1',
                port: Number(env.VITE_PORT || 5173),
                protocol: 'ws',
            },
            watch: {
                ignored: ['**/storage/framework/views/**'],
            },
        },
    };
});
