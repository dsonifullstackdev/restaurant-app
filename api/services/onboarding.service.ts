/**
 * Onboarding / profile update service.
 * No API logic in UI; use this service only.
 */

import { apiClient } from '@/api/client';
import { Endpoints } from '@/api/endpoints';

export type UpdateProfilePayload = {
  record_id: string;
  token: string;
  name: string;
  email: string;
  address: string;
  city: string;
  postal_code: string;
  diet_pill: string;       // slug of selected dietary node e.g. "veg", "non-veg"
  food_categories: number[]; // selected sub-item IDs
  dietary_category_id: number;
  whatsapp_updates: boolean;
};

export type UpdateProfileUser = {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
};

export type UpdateProfileResponse = {
  success: boolean;
  message: string;
  service_available?: boolean;
  user?: UpdateProfileUser;
};

export async function updateProfile(
  payload: UpdateProfilePayload
): Promise<UpdateProfileResponse> {
  const { data } = await apiClient.post<UpdateProfileResponse>(
    Endpoints.UPDATE_PROFILE,
    payload
  );
  return data;
}
