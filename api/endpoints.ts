/**
 * WooCommerce Store API v1 endpoint paths. Base URL from AppConfig (wc/store/v1).
 */

export const Endpoints = {
  PRODUCTS: '/products',
  PRODUCTS_CATEGORIES: '/products/categories',
  BANNERS: '/banners',
  CART: '/cart',
  ADD_TO_CART: '/cart/add-item',
  UPDATE_ITEM: '/cart/update-item',
  REMOVE_ITEM: '/cart/remove-item',
  CHECKOUT: '/checkout',
  INIT_DEVICE: '/device',
} as const;
