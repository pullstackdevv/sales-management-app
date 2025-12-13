import { createInertiaApp } from '@inertiajs/react'
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers'
import ReactDOM from 'react-dom/client'
import '../css/app.css'; // <--- WAJIB!
import { enableReactDevTools } from './utils/devtools';

// Enable React DevTools in development
if (import.meta.env.DEV) {
  enableReactDevTools();
}

createInertiaApp({
  resolve: name =>
    resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
  setup({ el, App, props }) {
    ReactDOM.createRoot(el).render(<App {...props} />)
  },
})
