/**
 * Products from WooCommerce API. No direct API calls in components.
 */

import { useCallback, useEffect, useState } from 'react';

import { fetchProducts } from '@/api/services/product.service';
import type { ProductListParams } from '@/types/api';
import type { WcProduct } from '@/types/api';

export function useProducts(params: {
  categoryId: number | null;
  searchQuery: string;
  page?: number;
}) {
  const [products, setProducts] = useState<WcProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);
      const requestParams: ProductListParams = {
        page,
        per_page: 10,
        ...(params.searchQuery.trim() ? { search: params.searchQuery.trim() } : {}),
        ...(params.categoryId != null && params.categoryId > 0 ? { category: params.categoryId } : {}),
      };
      try {
        const data = await fetchProducts(requestParams);
        setProducts(data);
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
        setProducts([]);
      } finally {
        setLoading(false);
      }
    },
    [params.categoryId, params.searchQuery]
  );

  useEffect(() => {
    load(params.page ?? 1);
  }, [load, params.page]);

  return { products, loading, error, refetch: () => load(params.page ?? 1) };
}
