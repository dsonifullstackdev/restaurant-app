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
  record_id: string;    // stable server-assigned ID for this device
  match_score: number;  // 0-100, higher = more likely returning user
  // ── Optional enriched fields ─────────────────────────────────────
  isNewUser?: boolean;
  isReturningUser?: boolean;
  offersEligible: 0 | 1;
  matchedSignals: string;
  message?: string;
};
