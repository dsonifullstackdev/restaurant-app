/**
 * Banner service. No API logic in UI; use this service only.
 */

import { apiClient } from '@/api/client';
import { Endpoints } from '@/api/endpoints';
import type { WcBanner, WcBannersResponse } from '@/types/api';

export async function fetchBanners(params?: {
  per_page?: number;
  page?: number;
  banner_pos?: string;
}): Promise<WcBanner[]> {
  const { data } = await apiClient.get<WcBanner[] | WcBannersResponse>(
    Endpoints.BANNERS,
    {
       params: {
        per_page: params?.per_page ?? 10,
        page: params?.page ?? 1,
        ...(params?.banner_pos ? { banner_pos: params.banner_pos } : {}),
      },
    }
  );

  if (Array.isArray(data)) {
    return data;
  }

  const response = data as WcBannersResponse;
  return response.banners ?? [];
}


