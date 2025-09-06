import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? process.env.VITE_APP_URL + '/' : '/',
  //  server: {
  //   host: '0.0.0.0',
  //   port: 5173,
  //   strictPort: true,
  //   hmr: {
  //     host: '192.168.19.165',
  //     port: 5173,
  //   }
  // },
  plugins: [
    laravel({
      input: ['resources/js/app.jsx'],
      refresh: true,
    }),
    react({
      include: "**/*.{jsx,tsx}",
      jsxRuntime: 'automatic'
    }),
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
