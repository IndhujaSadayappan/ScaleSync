import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://scalesync.onrender.com/api';
const BASE_URL = API_URL.endsWith('/api') ? API_URL.replace(/\/$/, '') : API_URL.replace(/\/$/, '') + '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authService = {
  login: (email, password) => api.post('/login', { email, password }),
  register: (email, password) => api.post('/register', { email, password }),
};

export const productService = {
  getProducts: () => api.get('/products'),
  updateProduct: (id, price_per_litre) => api.put(`/products/${id}`, { price_per_litre }),
  createProduct: (name, price_per_litre) => api.post('/products', { name, price_per_litre }),
};

export const salesService = {
  createSale: (product_id, weight, deviceToken) =>
    api.post('/sales', { product_id, weight, deviceToken }),
  getSales: (params) => api.get('/sales', { params }),
  getNotifications: () => api.get('/notifications'),
};

export default api;
