/**
 * Auth types — used across auth store, service, and screens.
 */

export type AuthUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatarUrl?: string;
  phone?: string;
  token: string;
};

export type LoginWithPhonePayload = {
  phone: string;
  otp?: string;
};

export type LoginWithEmailPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
};

export type AuthResponse = {
  token: string;
  user_email: string;
  user_nicename: string;
  user_display_name: string;
};
