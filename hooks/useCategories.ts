/**
 * Categories from WooCommerce API. No direct API calls in components.
 */

import { useCallback, useEffect, useState } from 'react';

import { fetchCategories } from '@/api/services/category.service';
import type { WcProductCategory } from '@/types/api';

export function useCategories() {
  const [categories, setCategories] = useState<WcProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCategories({ per_page: 100, hide_empty: true });
      console.log("CATEGORY-DAT", data)
      setCategories(data);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { categories, loading, error, refetch: load };
}
