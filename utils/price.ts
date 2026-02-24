import { AppConfig } from '@/config/app.config';

/**
 * Format price from WooCommerce minor units or plain string.
 * WooCommerce Store API returns prices in minor units (e.g. 49900 = ₹499.00)
 */
export function formatPrice(value: string | number, minorUnits = true): string {
  const num = typeof value === 'string' ? parseInt(value, 10) : value;
  if (isNaN(num)) return `${AppConfig.CURRENCY}0.00`; // always show 2 decimals
  const amount = minorUnits ? num / 100 : num;
  return `${AppConfig.CURRENCY}${amount.toFixed(2)}`; // 2 decimal places
}
