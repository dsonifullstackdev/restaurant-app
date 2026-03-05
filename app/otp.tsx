import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getStoredDeviceData } from '@/api/services/device.service';
import { sendOtp, verifyOtp } from '@/api/services/otp.service';
import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { AuthUser } from '@/types/auth';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

export default function OtpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mobile } = useLocalSearchParams<{ mobile: string }>();
  const { loginWithToken } = useAuth();

  const surface = useThemeColor({}, 'surface');
  const text = useThemeColor({}, 'text');
  const background = useThemeColor({}, 'background');

  // ── OTP digits ────────────────────────────────────────────────────
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // ── UI state ──────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ── Resend timer ──────────────────────────────────────────────────
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Start countdown ───────────────────────────────────────────────
  const startTimer = useCallback(() => {
    setResendTimer(RESEND_COOLDOWN);
    setCanResend(false);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    startTimer();
    setTimeout(() => inputRefs.current[0]?.focus(), 300);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // ── Format timer mm:ss or Xs ──────────────────────────────────────
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`;
  };

  // ── Handle digit input ────────────────────────────────────────────
  const handleChange = (value: string, index: number) => {
    // Handle paste of full OTP
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
      const newOtp = Array(OTP_LENGTH).fill('');
      digits.forEach((d, i) => { newOtp[i] = d; });
      setOtp(newOtp);
      const nextIndex = Math.min(digits.length, OTP_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
      if (digits.length === OTP_LENGTH) {
        Keyboard.dismiss();
        handleVerify(newOtp.join(''));
      }
      return;
    }

    const digit = value.replace(/\D/g, '');
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError(null);

    // Auto-advance to next box
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when last digit entered
    if (digit && index === OTP_LENGTH - 1) {
      const fullOtp = newOtp.join('');
      if (fullOtp.length === OTP_LENGTH) {
        Keyboard.dismiss();
        handleVerify(fullOtp);
      }
    }
  };

  // ── Backspace — go to previous box ───────────────────────────────
  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
    }
  };

  // ── Verify OTP ────────────────────────────────────────────────────
  const handleVerify = useCallback(async (otpCode?: string) => {
    const code = otpCode ?? otp.join('');
    if (code.length < OTP_LENGTH) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { recordId } = await getStoredDeviceData();
      const response = await verifyOtp({
        mobile: mobile ?? '',
        otp: code,
        record_id: recordId ?? '',
      });

      if (response.success && response.token) {
        const u = response.user;
        const p = response.profile;

        // wp_user_id present & non-empty = existing user
        const isExistingUser = !!(u?.user_id && u.user_id !== '');

        // Build AuthUser from response
        const authUser: AuthUser = {
          id: isExistingUser ? parseInt(u!.user_id, 10) : 0,
          email: u?.email ?? '',
          firstName: u?.first_name ?? '',
          lastName: u?.last_name ?? '',
          displayName: u ? `${u.first_name} ${u.last_name}`.trim() || `+91-${mobile}` : `+91-${mobile}`,
          token: response.token,
          phone: u?.phone ?? mobile,
        };

        // Persist to AsyncStorage + set in AuthContext
        await loginWithToken(authUser);

        // Existing user with completed profile → go to app
        // New user OR profile incomplete → go to onboarding (pre-fill if profile exists)
        const hasProfile = !!(p?.address && p?.city && p?.postal_code && p?.diet_pill);

        if (isExistingUser && hasProfile) {
          setTimeout(() => router.replace('/(tabs)'), 100);
        } else {
          // Pass profile data to onboarding so fields are pre-filled
          const params = p ? `?address=${encodeURIComponent(p.address ?? '')}&city=${encodeURIComponent(p.city ?? '')}&postal_code=${encodeURIComponent(p.postal_code ?? '')}&diet_pill=${encodeURIComponent(p.diet_pill ?? '')}&food_categories=${encodeURIComponent(JSON.stringify(p.food_categories ?? []))}&dietary_category_id=${encodeURIComponent(p.dietary_category_id ?? '')}&whatsapp_updates=${p.whatsapp_updates ?? true}` : '';
          setTimeout(() => router.replace(`/onboarding${params}` as any), 100);
        }
      } else {
        setError(response.message ?? 'Invalid OTP. Please try again.');
        setOtp(Array(OTP_LENGTH).fill(''));
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Verification failed. Try again.');
      setOtp(Array(OTP_LENGTH).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } finally {
      setLoading(false);
    }
  }, [otp, mobile, router, loginWithToken]);

  // ── Resend OTP ────────────────────────────────────────────────────
  const handleResend = useCallback(async () => {
    if (!canResend) return;
    setError(null);
    setSuccess(null);
    setOtp(Array(OTP_LENGTH).fill(''));

    try {
      const { recordId } = await getStoredDeviceData();
      const fingerprint = await import('@/utils/fingerprint').then(m =>
        m.collectFingerprint({ action_key: 'init_request' })
      );
      await sendOtp({
        mobile: mobile ?? '',
        record_id: recordId ?? '',
        screen_resolution: fingerprint.screenResolution,
        android_id: fingerprint.androidId,
      });
      setSuccess('OTP resent successfully');
      startTimer();
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to resend OTP.');
    }
  }, [canResend, mobile, startTimer]);

  const filledCount = otp.filter(Boolean).length;

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="arrow-back" size={24} color={text} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>OTP Verification</ThemedText>
      </View>

      <View style={styles.content}>
        {/* ── Subtitle ── */}
        <ThemedText style={styles.subtitle}>
          We have sent a verification code to
        </ThemedText>
        <ThemedText style={styles.phoneNumber}>
          +91-{mobile}
        </ThemedText>

        {/* ── OTP Boxes ── */}
        <View style={styles.otpRow}>
          {Array(OTP_LENGTH).fill(0).map((_, i) => (
            <TextInput
              key={i}
              ref={(ref) => { inputRefs.current[i] = ref; }}
              style={[
                styles.otpBox,
                {
                  borderColor: otp[i]
                    ? '#E8445A'
                    : i === filledCount
                      ? text
                      : 'rgba(0,0,0,0.15)',
                  color: text,
                  backgroundColor: surface,
                },
              ]}
              value={otp[i]}
              onChangeText={(val) => handleChange(val, i)}
              onKeyPress={(e) => handleKeyPress(e, i)}
              keyboardType="number-pad"
              maxLength={6}
              textAlign="center"
              selectTextOnFocus
            />
          ))}
        </View>

        {/* ── Hint ── */}
        <ThemedText style={styles.hint}>
          Check text messages for your OTP
        </ThemedText>

        {/* ── Error ── */}
        {error && (
          <View style={styles.errorBox}>
            <MaterialIcons name="error-outline" size={15} color="#E8445A" />
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </View>
        )}

        {/* ── Success ── */}
        {success && (
          <View style={styles.successBox}>
            <MaterialIcons name="check-circle-outline" size={15} color="#22c55e" />
            <ThemedText style={styles.successText}>{success}</ThemedText>
          </View>
        )}

        {/* ── Resend ── */}
        <View style={styles.resendRow}>
          <ThemedText style={styles.resendLabel}>Didn't get the OTP? </ThemedText>
          {canResend ? (
            <TouchableOpacity onPress={handleResend}>
              <ThemedText style={styles.resendLink}>Resend SMS</ThemedText>
            </TouchableOpacity>
          ) : (
            <ThemedText style={styles.resendTimer}>
              Resend SMS in {formatTime(resendTimer)}
            </ThemedText>
          )}
        </View>

        {/* ── Verify button ── */}
        <TouchableOpacity
          style={[
            styles.verifyBtn,
            (filledCount < OTP_LENGTH || loading) && styles.verifyBtnDisabled,
          ]}
          onPress={() => handleVerify()}
          disabled={filledCount < OTP_LENGTH || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.verifyBtnText}>Verify & Continue</ThemedText>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  backBtn: { padding: Spacing.xs },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl,
    alignItems: 'center',
  },
  subtitle: { fontSize: 15, opacity: 0.65, textAlign: 'center' },
  phoneNumber: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: Spacing.xs,
    marginBottom: Spacing.xxxl,
  },
  otpRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  otpBox: {
    width: 50,
    height: 58,
    borderWidth: 2,
    borderRadius: BorderRadius.lg,
    fontSize: 22,
    fontWeight: '700',
  },
  hint: { fontSize: 13, color: '#3b82f6', marginBottom: Spacing.lg },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#FFF0F3',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    width: '100%',
  },
  errorText: { flex: 1, fontSize: 13, color: '#E8445A' },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#f0fdf4',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    width: '100%',
  },
  successText: { flex: 1, fontSize: 13, color: '#22c55e' },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  resendLabel: { fontSize: 14, fontWeight: '700' },
  resendLink: { fontSize: 14, color: '#E8445A', fontWeight: '700' },
  resendTimer: { fontSize: 14, opacity: 0.45, fontWeight: '600' },
  verifyBtn: {
    backgroundColor: '#E8445A',
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#E8445A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  verifyBtnDisabled: {
    backgroundColor: '#E8445A',
    opacity: 0.4,
    elevation: 0,
    shadowOpacity: 0,
  },
  verifyBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
