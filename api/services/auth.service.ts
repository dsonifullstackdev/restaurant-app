/**
 * Auth service — no API logic in UI, use this service only.
 * Follows same pattern as category.service.ts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

import { AppConfig } from '@/config/app.config';
import type { AuthResponse, AuthUser, LoginWithEmailPayload, RegisterPayload } from '@/types/auth';

const AUTH_TOKEN_KEY = '@auth_token';
const AUTH_USER_KEY = '@auth_user';

const wpClient = axios.create({
  baseURL: AppConfig.API_BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

/**
 * Login with email + password via WordPress JWT.
 * POST /wp-json/jwt-auth/v1/token
 */
export async function loginWithEmail(
  payload: LoginWithEmailPayload
): Promise<AuthUser> {
  const { data } = await wpClient.post<AuthResponse>(
    '/wp-json/jwt-auth/v1/token',
    {
      username: payload.email,
      password: payload.password,
    }
  );

  const user: AuthUser = {
    id: 0,
    email: data.user_email,
    firstName: data.user_nicename,
    lastName: '',
    displayName: data.user_display_name,
    token: data.token,
  };

  await persistAuth(user);
  return user;
}

/**
 * Register new user via WooCommerce Customers API.
 * POST /wp-json/wc/v3/customers
 */
export async function registerUser(
  payload: RegisterPayload
): Promise<AuthUser> {
  await wpClient.post('/wp-json/wc/v3/customers', {
    email: payload.email,
    password: payload.password,
    first_name: payload.firstName,
    last_name: payload.lastName,
    username: payload.email,
  });

  // Auto-login after register
  return loginWithEmail({
    email: payload.email,
    password: payload.password,
  });
}

/**
 * Get stored auth token from AsyncStorage.
 */
export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * Get stored auth user from AsyncStorage.
 */
export async function getStoredUser(): Promise<AuthUser | null> {
  const raw = await AsyncStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

/**
 * Validate stored token is still valid.
 * POST /wp-json/jwt-auth/v1/token/validate
 */
export async function validateToken(token: string): Promise<boolean> {
  try {
    await wpClient.post(
      '/wp-json/jwt-auth/v1/token/validate',
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Clear auth from storage (logout).
 */
export async function clearAuth(): Promise<void> {
  await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, AUTH_USER_KEY]);
}

/**
 * Persist auth user and token to AsyncStorage.
 * Exported so AuthContext.loginWithToken can call it directly.
 */
export async function persistAuth(user: AuthUser): Promise<void> {
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, user.token);
  await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}
