import api from './axios';
import API from './routes';

export const login = (payload) => api.post(API.auth.login, payload);