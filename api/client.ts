/**
 * Centralized Axios client for WooCommerce Store API.
 * Handles Store API Nonce automatically.
 */

import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';

import { setupCartInterceptor } from '@/api/cart-interceptor';
import { AppConfig } from '@/config/app.config';

const baseURL = `${AppConfig.API_BASE_URL.replace(/\/$/, '')}${AppConfig.WC_API_PATH}`;

let cartToken: string | null = null;
let authToken: string | null = null;

export const setCartToken = (token: string | null) => {
  cartToken = token;
};

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

function createClient(): AxiosInstance {
  const client = axios.create({
    baseURL,
    timeout: 20000,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'ngrok-skip-browser-warning': 'true',
    },
  });

  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      if (cartToken && config.headers) {
        config.headers.set('Cart-Token', cartToken);
      }
      if (authToken && config.headers) {
        // Only send if it looks like a real JWT (3 dot-separated segments)
        const isJwt = authToken.split('.').length === 3;
        if (isJwt) {
          config.headers.set('Authorization', `Bearer ${authToken}`);
        } else {
          console.warn('[apiClient] Token is not a valid JWT — skipping Authorization header. Segments:', authToken.split('.').length);
        }
      }
      return config;
    }
  );

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      return Promise.reject(error);
    }
  );

  // Auto-refresh CartContext after any cart mutation
  setupCartInterceptor(client);

  return client;
}

export const apiClient = createClient();
