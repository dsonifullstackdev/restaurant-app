/**
 * Checkout / Payment service.
 * No API logic in UI — use this service only.
 * Follows same pattern as category.service.ts
 */

import { apiClient } from '@/api/client';
import { Endpoints } from '@/api/endpoints';
import type {
  CheckoutPayload,
  CheckoutResponse,
  PaymentMethod,
} from '@/types/checkout';

/**
 * Fetch available payment methods from WooCommerce Store API.
 * GET /wc/store/v1/checkout — payment_methods field
 */
export async function fetchPaymentMethods(): Promise<PaymentMethod[]> {
  const { data } = await apiClient.get<{ payment_methods: PaymentMethod[] }>(
    Endpoints.CHECKOUT
  );
  return data?.payment_methods ?? [];
}

/**
 * Place order via WooCommerce Store API.
 * POST /wc/store/v1/checkout
 */
export async function placeOrder(
  payload: CheckoutPayload
): Promise<CheckoutResponse> {
  const { data } = await apiClient.post<CheckoutResponse>(
    Endpoints.CHECKOUT,
    payload
  );
  return data;
}
