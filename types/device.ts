/**
 * Device fingerprint types.
 * Play Store compliant — no sensitive permissions required.
 */

export type DeviceFingerprint = {
  action_key: 'init_request' | 'login_complete' | 'register_complete';
  phone?: string;
  email?: string;
  androidId: string;
  deviceModel: string;
  deviceBrand: string;
  deviceManufacturer: string;
  osVersion: string;
  sdkVersion: number;
  screenResolution: string;
  deviceType: string;
  appVersion: string;
  bundleId: string;
  firstInstallTime: number;
  lastUpdateTime: number;
  timezone: string;
  locale: string;
  region: string;
  fcmToken?: string;
};

export type DeviceInitResponse = {
  // ── Core fields returned by server ──────────────────────────────
  record_id: string | number;  // server returns number, stringified on store
  match_score: number;
  offersEligible?: number | boolean;  // server returns 1/0
  // ── Optional enriched fields ─────────────────────────────────────
  isNewUser?: boolean;
  isReturningUser?: boolean;
  matchedSignals?: string[];
  message?: string;
};
