import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    laravel({
      input: ['resources/js/app.jsx'],
      refresh: true,
    }),
    react(),
  ],
  resolve: {
    alias: {
      'tailwindcss/version.js': path.resolve(__dirname, 'resources/js/fake-tailwind-version.js'),
      '@': path.resolve(__dirname, 'resources/js'),
    },
  },
  optimizeDeps: {
    include: ['flowbite-react'],
  },
});
