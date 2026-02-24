import { fetchProducts } from '@/api/services/product.service';
import type { WcProduct } from '@/types/api';
import { useEffect, useState } from 'react';

export function useProductAutocomplete(search: string) {
  const [results, setResults] = useState<WcProduct[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (!search || search.length < 3) {
        setResults([]);
        return;
      }

      setLoading(true);

      try {
        const data = await fetchProducts({
          search,
          per_page: 5,
        });

        if (active) {
          setResults(data);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      active = false;
    };
  }, [search]);

  return { results, loading };
}
