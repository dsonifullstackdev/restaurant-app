/**
 * Device service — sends fingerprint to server.
 * Stores match_score and record_id from server response.
 * Follows same pattern as category.service.ts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { apiClient } from '@/api/client';
import { Endpoints } from '@/api/endpoints';
import type { DeviceFingerprint, DeviceInitResponse } from '@/types/device';

// ── Storage keys ─────────────────────────────────────────────────────
const KEYS = {
  RECORD_ID: '@device_record_id',
  MATCH_SCORE: '@device_match_score',
  OFFERS_ELIGIBLE: '@device_offers_eligible',
} as const;

// ── API call ──────────────────────────────────────────────────────────

/**
 * POST /init_device
 * Sends fingerprint and stores record_id + match_score from response.
 */
export async function initDevice(
  fingerprint: DeviceFingerprint
): Promise<DeviceInitResponse> {
  const { data } = await apiClient.post<DeviceInitResponse>(
    Endpoints.INIT_DEVICE,
    fingerprint
  );

  // Persist to AsyncStorage (SharedPreferences equivalent in RN)
  await AsyncStorage.multiSet([
    [KEYS.RECORD_ID, data.record_id ?? ''],
    [KEYS.MATCH_SCORE, String(data.match_score ?? 0)],
    [KEYS.OFFERS_ELIGIBLE, JSON.stringify(Boolean(data.offersEligible))], // converts 1→true, 0→false
  ]);

  console.log('[Device stored] record_id:', data.record_id, '| match_score:', data.match_score);

  return data;
}

// ── Getters — use anywhere in the app ────────────────────────────────

/**
 * Get server-assigned record ID for this device.
 * Use this to attach to orders, analytics, support tickets.
 */
export async function getRecordId(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.RECORD_ID);
}

/**
 * Get match score from last init_request.
 * 0  = brand new device, never seen
 * 100 = exact match, definitely returning user
 */
export async function getMatchScore(): Promise<number> {
  const raw = await AsyncStorage.getItem(KEYS.MATCH_SCORE);
  return raw ? parseInt(raw, 10) : 0;
}

/**
 * Check if this device is eligible for first-time offers.
 * Based on match_score: score >= 35 means returning user → not eligible.
 * Server can also override via offersEligible field.
 */
export async function isOffersEligible(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(KEYS.OFFERS_ELIGIBLE);
  if (raw !== null) {
    try { return JSON.parse(raw); } catch { /* fall through */ }
  }
  // Fallback if not stored yet
  const score = await getMatchScore();
  return score < 35;
}

/**
 * Get all stored device data in one call.
 * Useful for attaching to checkout or support requests.
 */
export async function getStoredDeviceData(): Promise<{
  recordId: string | null;
  matchScore: number;
  offersEligible: boolean;
}> {
  const [recordId, matchScore, offersEligible] = await Promise.all([
    getRecordId(),
    getMatchScore(),
    isOffersEligible(),
  ]);
  return { recordId, matchScore, offersEligible };
}
