/**
 * Safe wrapper for @shayrn/react-native-android-phone-number-hint
 *
 * Prevents crash when native module isn't built yet (Expo Go / before prebuild).
 * Once you run `npx expo prebuild` and rebuild, this works normally.
 */

import { Platform } from 'react-native';

// Import the module at the top level — Metro needs static imports
// The try/catch around the actual CALL (not import) is what prevents crash
import * as PhoneHintModule from '@shayrn/react-native-android-phone-number-hint';

/**
 * Show Android phone number picker.
 * Returns selected number string, or null if unavailable/dismissed/not Android.
 */
export async function safeShowPhoneNumberHint(): Promise<string | null> {
  if (Platform.OS !== 'android') return null;

  try {
    const result = await PhoneHintModule.showPhoneNumberHint();
    return result ?? null;
  } catch (err: any) {
    // Native module not found (Expo Go / needs prebuild) — silent fail
    if (
      err?.message?.includes('TurboModuleRegistry') ||
      err?.message?.includes('could not be found') ||
      err?.message?.includes('AndroidPhoneNumberHint')
    ) {
      console.log('[PhoneHint] Native module not available — run expo prebuild to enable');
    }
    return null;
  }
}
