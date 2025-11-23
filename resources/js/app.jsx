import { createInertiaApp } from '@inertiajs/react'
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers'
import ReactDOM from 'react-dom/client'
import '../css/app.css'; // <--- WAJIB!
import { enableReactDevTools } from './utils/devtools';
import { AuthProvider } from './contexts/AuthContext';

// Enable React DevTools in development
if (import.meta.env.DEV) {
  enableReactDevTools();
}

createInertiaApp({
  resolve: (name) => {
    const page = resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx'));
    page.then((module) => {
      module.default.layout = module.default.layout || ((page) => <AuthProvider>{page}</AuthProvider>);
    });
    return page;
  },
  setup({ el, App, props }) {
    ReactDOM.createRoot(el).render(<App {...props} />)
  },
})
