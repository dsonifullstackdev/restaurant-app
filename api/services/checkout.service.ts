/**
 * Checkout service — wraps WooCommerce Store API /checkout endpoint.
 *
 * GET  /checkout  → fetch draft order (status, payment_method, billing/shipping)
 * PUT  /checkout  → update billing/shipping → returns live totals + shipping rates
 * POST /checkout  → place order → returns order_id + payment result
 */

import { apiClient } from '@/api/client';
import { Endpoints } from '@/api/endpoints';

// ── Types ─────────────────────────────────────────────────────────────

export type CheckoutAddress = {
  first_name: string;
  last_name: string;
  company: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email?: string; // billing only
  phone: string;
};

export type ShippingRate = {
  rate_id: string;
  name: string;
  description: string;
  delivery_time: string;
  price: string; // minor units e.g. "5000" = ₹50
  taxes: string;
  instance_id: number;
  method_id: string;
  meta_data: { key: string; value: string }[];
  selected: boolean;
  currency_code: string;
  currency_symbol: string;
  currency_minor_unit: number;
};

export type ShippingPackage = {
  package_id: number | string;
  name: string;
  destination: {
    address_1: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  items: { key: string; name: string; quantity: number }[];
  shipping_rates: ShippingRate[];
};

export type CheckoutTotals = {
  total_items: string;
  total_items_tax: string;
  total_fees: string;
  total_discount: string;
  total_shipping: string | null;
  total_shipping_tax: string | null;
  total_price: string;
  total_tax: string;
  currency_code: string;
  currency_symbol: string;
  currency_minor_unit: number;
  currency_decimal_separator: string;
  currency_thousand_separator: string;
  currency_prefix: string;
  currency_suffix: string;
};

export type ExperimentalCart = {
  items: any[];
  payment_methods: string[];
  shipping_rates: ShippingPackage[];
  totals: CheckoutTotals;
  needs_payment: boolean;
  needs_shipping: boolean;
  has_calculated_shipping: boolean;
};

export type CheckoutData = {
  order_id: number;
  status: string;
  order_key: string;
  order_number: string;
  customer_note: string;
  billing_address: CheckoutAddress;
  shipping_address: Omit<CheckoutAddress, 'email'>;
  payment_method: string;
  // Top-level fields (not always present)
  payment_methods?: string[];
  shipping_rates?: ShippingPackage[];
  totals?: CheckoutTotals;
  // Real data lives here after PUT/POST
  __experimentalCart?: ExperimentalCart;
  payment_result?: {
    payment_status: string;
    payment_details: { key: string; value: string }[];
    redirect_url: string;
  };
};

// ── Helpers to extract data from response ────────────────────────────

/** Payment methods: from __experimentalCart (reliable) or top-level fallback */
export function getPaymentMethods(data: CheckoutData): string[] {
  return data.__experimentalCart?.payment_methods
    ?? data.payment_methods
    ?? ['cod'];
}

/** Totals: from __experimentalCart (live, recalculated) or top-level fallback */
export function getCheckoutTotals(data: CheckoutData): CheckoutTotals | null {
  return data.__experimentalCart?.totals ?? data.totals ?? null;
}

/** Shipping packages with rates */
export function getShippingPackages(data: CheckoutData): ShippingPackage[] {
  return data.__experimentalCart?.shipping_rates
    ?? data.shipping_rates
    ?? [];
}

export type PlaceOrderPayload = {
  billing_address: CheckoutAddress;
  shipping_address: Omit<CheckoutAddress, 'email'>;
  payment_method: string;
  customer_note?: string;
};

// ── API ───────────────────────────────────────────────────────────────

/** GET /checkout — fetch current draft order */
export async function getCheckout(): Promise<CheckoutData> {
  const res = await apiClient.get<CheckoutData>(Endpoints.CHECKOUT);
  console.log('[Checkout] GET response:', JSON.stringify(res.data, null, 2));
  return res.data;
}

/**
 * PUT /checkout — update billing/shipping address.
 * WooCommerce recalculates shipping rates + totals and returns them.
 */
export async function updateCheckout(
  payload: Partial<PlaceOrderPayload>
): Promise<CheckoutData> {
  const res = await apiClient.put<CheckoutData>(Endpoints.CHECKOUT, payload);
  console.log('[Checkout] PUT response:', JSON.stringify(res.data, null, 2));
  return res.data;
}

/**
 * POST /checkout — place the order.
 * Returns order_id and payment_result (with redirect_url for online payments).
 */
export async function placeOrder(
  payload: PlaceOrderPayload
): Promise<CheckoutData> {
  const res = await apiClient.post<CheckoutData>(Endpoints.CHECKOUT, payload);
  console.log('[Checkout] POST response:', JSON.stringify(res.data, null, 2));
  return res.data;
}
