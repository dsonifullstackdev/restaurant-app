/**
 * OTP service. No API logic in UI; use this service only.
 * Follows same pattern as category.service.ts
 */

import { apiClient } from '@/api/client';

export type SendOtpPayload = {
  mobile: string;
  record_id: string;
  screen_resolution: string;
  android_id: string;
};

export type SendOtpResponse = {
  success: boolean;
  message?: string;
};

export type VerifyOtpPayload = {
  mobile: string;
  otp: string;
  record_id: string;
};

export type VerifyOtpUser = {
  user_id: string;  // server returns user_id not user_id
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
};

export type VerifyOtpProfile = {
  address?: string;
  city?: string;
  postal_code?: string;
  diet_pill?: string;
  food_categories?: number[];
  dietary_category_id?: string;
  whatsapp_updates?: boolean;
};

export type VerifyOtpResponse = {
  success: boolean;
  message?: string;
  token?: string;
  record_id?: string;
  user?: VerifyOtpUser;
  profile?: VerifyOtpProfile;  // present if user already completed onboarding
};

export async function sendOtp(payload: SendOtpPayload): Promise<SendOtpResponse> {
  const { data } = await apiClient.post<SendOtpResponse>('/send_otp', payload);
  return data;
}

export async function verifyOtp(payload: VerifyOtpPayload): Promise<VerifyOtpResponse> {
  const { data } = await apiClient.post<VerifyOtpResponse>('/verify_otp', payload);
  return data;
}
