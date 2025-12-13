import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  server: {
    host: '0.0.0.0',       // agar dapat diakses dari luar (bukan hanya localhost)
    port: 19068,           // pastikan sama dengan yang kamu buka di firewall aaPanel
    strictPort: true,
    cors: true,
    hmr: {
      host: 'app.pullstack.cloud', // domain kamu
      protocol: 'wss',             // gunakan 'wss' karena situs kamu pakai HTTPS
      port: 19068,
    },
  },
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
