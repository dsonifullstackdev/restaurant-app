/**
 * Banners from API. No direct API calls in components.
 */

import { useCallback, useEffect, useState } from 'react';

import { fetchBanners } from '@/api/services/banner.service';
import type { WcBanner } from '@/types/api';

export function useBanners() {
  const [banners, setBanners] = useState<WcBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBanners({ per_page: 10 });
      console.log("BANNER-RESP-DAT", data)
      setBanners(data);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setBanners([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { banners, loading, error, refetch: load };
}
