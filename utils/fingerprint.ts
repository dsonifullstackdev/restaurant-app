/**
 * Device fingerprint collector.
 * All signals are Play Store compliant — no sensitive permissions needed.
 */

import * as Application from 'expo-application';
import * as Device from 'expo-device';
import * as Localization from 'expo-localization';
import { Dimensions, Platform } from 'react-native';

import type { DeviceFingerprint } from '@/types/device';

/**
 * Collect device fingerprint with action_key.
 *
 * action_key values:
 *  - 'init_request'      → first load, may or may not have phone yet
 *  - 'login_complete'    → after successful login, has email + phone
 *  - 'register_complete' → after successful register, has email + phone
 */
export async function collectFingerprint(params: {
  action_key: DeviceFingerprint['action_key'];
  phone?: string;
  email?: string;
  fcmToken?: string;
}): Promise<DeviceFingerprint> {
  const { width, height } = Dimensions.get('screen');

  const androidId =
    Platform.OS === 'android'
      ? (await Application.getAndroidId()) ?? 'unknown'
      : 'ios-not-applicable';

  const firstInstallTime =
    (await Application.getInstallationTimeAsync())?.getTime() ?? 0;

  const lastUpdateTime =
    (await Application.getLastUpdateTimeAsync())?.getTime() ?? 0;

  const locales = Localization.getLocales();
  const locale = locales[0]?.languageTag ?? 'en-IN';
  const region = locales[0]?.regionCode ?? 'IN';
  const timezone = Localization.getCalendars()[0]?.timeZone ?? 'Asia/Kolkata';

  return {
    action_key: params.action_key,

    // Identity — only included when available
    ...(params.phone ? { phone: params.phone } : {}),
    ...(params.email ? { email: params.email } : {}),
    ...(params.fcmToken ? { fcmToken: params.fcmToken } : {}),

    // Hardware
    androidId,
    deviceModel: Device.modelName ?? 'unknown',
    deviceBrand: Device.brand ?? 'unknown',
    deviceManufacturer: Device.manufacturer ?? 'unknown',
    osVersion: Device.osVersion ?? 'unknown',
    sdkVersion: typeof Device.platformApiLevel === 'number'
      ? Device.platformApiLevel : 0,
    screenResolution: `${Math.round(width)}x${Math.round(height)}`,
    deviceType: Device.deviceType === Device.DeviceType.TABLET ? 'tablet' : 'phone',

    // App
    appVersion: Application.nativeApplicationVersion ?? '1.0.0',
    bundleId: Application.applicationId ?? 'unknown',
    firstInstallTime,
    lastUpdateTime,

    // Locale
    timezone,
    locale,
    region,
  };
}
