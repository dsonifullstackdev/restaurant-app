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

// Match whatever fields your server returns after verify
export type VerifyOtpResponse = {
  success: boolean;
  message?: string;
  // ── Auth fields — used to build AuthUser ──────────────────────
  token?: string;
  user_id?: number;
  email?: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
};

export async function sendOtp(payload: SendOtpPayload): Promise<SendOtpResponse> {
  const { data } = await apiClient.post<SendOtpResponse>('/send_otp', payload);
  return data;
}

export async function verifyOtp(payload: VerifyOtpPayload): Promise<VerifyOtpResponse> {
  const { data } = await apiClient.post<VerifyOtpResponse>('/verify_otp', payload);
  return data;
}
