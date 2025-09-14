import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/public/build/' : '/build/',
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
    outDir: 'public/build',
    manifest: true,
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
    // Ensure manifest is in the correct location
    manifestPath: 'manifest.json',
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
