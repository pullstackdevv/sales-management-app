import api from './axios';
import API from './routes';

/**
 * Login user and store authentication token
 * @param {Object} payload - Login credentials
 * @returns {Promise} API response
 */
export const login = async (payload) => {
  try {
    const response = await api.post(API.auth.login, payload);
    
    // Store token and user data if login successful
    if (response.data.status === 'success' && response.data.data.token) {
      localStorage.setItem('auth_token', response.data.data.token);
      localStorage.setItem('user_data', JSON.stringify(response.data.data.user));
    }
    
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Register new user
 * @param {Object} payload - Registration data
 * @returns {Promise} API response
 */
export const register = async (payload) => {
  try {
    const response = await api.post(API.auth.register, payload);
    
    // Store token and user data if registration successful
    if (response.data.status === 'success' && response.data.data.token) {
      localStorage.setItem('auth_token', response.data.data.token);
      localStorage.setItem('user_data', JSON.stringify(response.data.data.user));
    }
    
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Logout user and clear stored data
 * @returns {Promise} API response
 */
export const logout = async () => {
  try {
    const response = await api.post(API.auth.logout);
    
    // Clear stored data regardless of API response
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    
    return response;
  } catch (error) {
    // Clear stored data even if API call fails
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    throw error;
  }
};

/**
 * Get current authenticated user
 * @returns {Promise} API response
 */
export const me = () => api.get(API.auth.me);

/**
 * Check if user is authenticated
 * @returns {boolean} Authentication status
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('auth_token');
  return !!token;
};

/**
 * Get stored user data
 * @returns {Object|null} User data or null
 */
export const getUser = () => {
  const userData = localStorage.getItem('user_data');
  return userData ? JSON.parse(userData) : null;
};

/**
 * Get stored auth token
 * @returns {string|null} Auth token or null
 */
export const getToken = () => {
  return localStorage.getItem('auth_token');
};