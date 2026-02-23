/**
 * Centralized Axios client for WooCommerce Store API.
 * Store API (wc/store/v1) is public and does not require API keys for product/category listing.
 */

import axios, { type AxiosInstance } from 'axios';

import { AppConfig } from '@/config/app.config';

const baseURL = `${AppConfig.API_BASE_URL.replace(/\/$/, '')}${AppConfig.WC_API_PATH}`;

function createClient(): AxiosInstance {
  const client = axios.create({
    baseURL,
    timeout: 20000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    },
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Optional: trigger logout or auth flow
      }
      return Promise.reject(error);
    }
  );

  return client;
}

export const apiClient = createClient();
