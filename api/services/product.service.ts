/**
 * Product service. No API logic in UI; use this service only.
 */

import { apiClient } from '@/api/client';
import { Endpoints } from '@/api/endpoints';
import { AppConfig } from '@/config/app.config';
import type {
  ProductListParams,
  WcProduct,
  WcProductsResponse,
} from '@/types/api';

export async function fetchProducts(
  params?: ProductListParams
): Promise<WcProduct[]> {
  const page = params?.page ?? 1;
  const per_page = params?.per_page ?? AppConfig.PAGE_SIZE;

  const trimmedSearch = params?.search?.trim();

  const requestParams: Record<string, string | number | undefined> = {
    page,
    per_page,

    // WooCommerce Store API search
    ...(trimmedSearch ? { search: trimmedSearch } : {}),

    // Category filter (Store API expects "category")
    ...(params?.category != null && params.category > 0
      ? { category: params.category }
      : {}),
  };

  const { data } = await apiClient.get<
    WcProduct[] | WcProductsResponse
  >(Endpoints.PRODUCTS, {
    params: requestParams,
  });

  // console.log("PRODUCTS-RESP: ", data)

  // Store API normally returns array
  if (Array.isArray(data)) {
    return data;
  }

  // Fallback for wrapped response structure
  const response = data as WcProductsResponse;
  return response.products ?? [];
}
