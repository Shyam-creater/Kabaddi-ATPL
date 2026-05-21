import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = 'http://192.168.31.253:6899/api';
// const BASE_URL = 'http://localhost:6899/api'; // Live Server
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

const getStoredToken = async () => {
  let token = await AsyncStorage.getItem('token');
  if (!token) {
    try {
      token = await SecureStore.getItemAsync('token');
    } catch (err) {
      console.warn('Failed to read token from SecureStore:', err);
    }
  }
  return token;
};

// Add token to headers
api.interceptors.request.use(async config => {
  const token = await getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error?.response?.status === 401) {
      console.warn('API request failed with 401 Unauthorized');
    }
    return Promise.reject(error);
  }
);

export { userService } from './userService';
export default api;
