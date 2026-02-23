/**
 * Product service. No API logic in UI; use this service only.
 */

import { apiClient } from '@/api/client';
import { AppConfig } from '@/config/app.config';
import type { ProductListParams, WcProduct, WcProductsResponse } from '@/types/api';
import { Endpoints } from '@/api/endpoints';

export async function fetchProducts(params?: ProductListParams): Promise<WcProduct[]> {
  const page = params?.page ?? 1;
  const per_page = params?.per_page ?? AppConfig.PAGE_SIZE;

  const requestParams: Record<string, string | number | undefined> = {
    page,
    per_page,
    ...(params?.search && params.search.trim() ? { search: params.search.trim() } : {}),
    ...(params?.category != null && params.category > 0 ? { category: params.category } : {}),
  };

  const { data } = await apiClient.get<WcProduct[] | WcProductsResponse>(Endpoints.PRODUCTS, {
    params: requestParams,
  });

  if (Array.isArray(data)) {
    return data;
  }
  const response = data as WcProductsResponse;
  return response.products ?? [];
}
