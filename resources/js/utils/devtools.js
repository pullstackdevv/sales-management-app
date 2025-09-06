// Development tools and debugging utilities

/**
 * Enable React DevTools in development
 * This function should be called in development mode only
 */
export const enableReactDevTools = () => {
  if (process.env.NODE_ENV === 'development') {
    // Enable React DevTools
    if (typeof window !== 'undefined') {
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = window.__REACT_DEVTOOLS_GLOBAL_HOOK__ || {};
      
      // Add debugging helpers to window object
      window.debugReact = {
        // Helper to log component props
        logProps: (component) => {
          console.log('Component Props:', component.props);
        },
        
        // Helper to log component state
        logState: (state) => {
          console.log('Component State:', state);
        },
        
        // Helper to log API responses
        logApiResponse: (response) => {
          console.log('API Response:', response);
        },
        
        // Helper to log errors
        logError: (error) => {
          console.error('Debug Error:', error);
        }
      };
      
      console.log('🔧 React DevTools enabled! Use window.debugReact for debugging helpers.');
    }
  }
};

/**
 * Debug component wrapper for development
 * @param {string} componentName - Name of the component
 * @param {Object} props - Component props
 * @param {Object} state - Component state (optional)
 */
export const debugComponent = (componentName, props, state = null) => {
  if (process.env.NODE_ENV === 'development') {
    console.group(`🔍 Debug: ${componentName}`);
    console.log('Props:', props);
    if (state) {
      console.log('State:', state);
    }
    console.groupEnd();
  }
};

/**
 * Debug API calls
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request/Response data
 * @param {string} method - HTTP method
 */
export const debugApi = (endpoint, data, method = 'GET') => {
  if (process.env.NODE_ENV === 'development') {
    console.group(`🌐 API Debug: ${method} ${endpoint}`);
    console.log('Data:', data);
    console.log('Timestamp:', new Date().toISOString());
    console.groupEnd();
  }
};

/**
 * Performance debugging
 * @param {string} label - Performance label
 * @param {Function} fn - Function to measure
 */
export const debugPerformance = async (label, fn) => {
  if (process.env.NODE_ENV === 'development') {
    console.time(`⚡ Performance: ${label}`);
    const result = await fn();
    console.timeEnd(`⚡ Performance: ${label}`);
    return result;
  }
  return await fn();
};

export default {
  enableReactDevTools,
  debugComponent,
  debugApi,
  debugPerformance
};