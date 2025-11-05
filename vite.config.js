import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
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
      buildDirectory: 'build',
    }),
    react({
      include: "**/*.{jsx,tsx}",
      jsxRuntime: 'automatic'
    }),
  ],
  build: {
    manifest: 'manifest.json',
    outDir: 'public/build',
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
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
