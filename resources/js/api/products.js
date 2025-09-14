import axios from 'axios';

// Base API configuration
const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Products API
export const productsAPI = {
    // Get all products with pagination and filters
    getProducts: async (params = {}) => {
        try {
            const response = await api.get('/products/storefront', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching products:', error);
            throw error;
        }
    },

    // Get single product by ID
    getProduct: async (id) => {
        try {
            const response = await api.get(`/products/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching product:', error);
            throw error;
        }
    },

    // Search products
    searchProducts: async (query, params = {}) => {
        try {
            const response = await api.get('/products', {
                params: {
                    search: query,
                    ...params
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error searching products:', error);
            throw error;
        }
    },

    // Get products by category
    getProductsByCategory: async (category, params = {}) => {
        try {
            const response = await api.get('/products', {
                params: {
                    category: category,
                    ...params
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching products by category:', error);
            throw error;
        }
    },
};

export default api;