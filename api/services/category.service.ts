/**
 * Category service. No API logic in UI; use this service only.
 */

import { apiClient } from '@/api/client';
import { Endpoints } from '@/api/endpoints';
import type { WcCategoriesResponse, WcProductCategory } from '@/types/api';

export async function fetchCategories(params?: {
  per_page?: number;
  page?: number;
  hide_empty?: boolean;
}): Promise<WcProductCategory[]> {
  const { data } = await apiClient.get<WcProductCategory[] | WcCategoriesResponse>(
    Endpoints.PRODUCTS_CATEGORIES,
    {
      params: {
        per_page: params?.per_page ?? 100,
        page: params?.page ?? 1,
        hide_empty: params?.hide_empty ?? true,
      },
    }
  );
  if (Array.isArray(data)) {
    return data;
  }
  const response = data as WcCategoriesResponse;
  return response.product_categories ?? [];
}
