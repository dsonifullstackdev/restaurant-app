/**
 * Call this once in your apiClient setup (client.ts) to auto-refresh
 * CartContext after any cart mutation, regardless of who calls it.
 *
 * Usage in client.ts:
 *   import { setupCartInterceptor } from '@/api/cart-interceptor';
 *   setupCartInterceptor(apiClient);
 */

import { cartEventBus } from '@/api/cart-event-bus';
import type { AxiosInstance } from 'axios';

// Endpoints that mutate the cart
const CART_MUTATION_ENDPOINTS = [
  '/cart/add-item',
  '/cart/update-item',
  '/cart/remove-item',
  '/cart/apply-coupon',
  '/cart/remove-coupon',
];

export function setupCartInterceptor(client: AxiosInstance) {
  client.interceptors.response.use(
    (response) => {
      const url = response.config?.url ?? '';
      const isMutation = CART_MUTATION_ENDPOINTS.some((e) => url.includes(e));
      if (isMutation) {
        // Notify CartContext to refresh — works even if caller used service directly
        cartEventBus.emit();
      }
      return response;
    },
    (error) => Promise.reject(error)
  );
}
