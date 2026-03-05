/**
 * Centralized app configuration. No API URLs or app names elsewhere.
 */

export const AppConfig = {
  APP_NAME: 'FoodHub',
  API_BASE_URL: 'https://2644-122-168-85-112.ngrok-free.app/websites/soniestore.com',
  /** WooCommerce Store API (public, no API keys required for products/categories). */
  WC_API_PATH: '/wp-json/wc/store/v1',
  DEFAULT_LANGUAGE: 'en',
  CURRENCY: 'INR',
  PAGE_SIZE: 10,
  IS_DEV: __DEV__,
} as const;
