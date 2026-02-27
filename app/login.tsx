import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { stripCountryCode } from '@/utils/phone';
import { showPhoneNumberHint } from '@shayrn/react-native-android-phone-number-hint';

const { width: W, height: H } = Dimensions.get('window');

type Tab = 'phone' | 'email';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login, register } = useAuth();
  const surface = useThemeColor({}, 'surface');
  const text = useThemeColor({}, 'text');
  const icon = useThemeColor({}, 'icon');

  const [activeTab, setActiveTab] = useState<Tab>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  useEffect(() => {
    if (Platform.OS === 'android') {
      handleAutoDetect();
    }
  }, []); // runs once on screen load

  const tabAnim = useRef(new Animated.Value(0)).current;

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    setError(null);
    Animated.spring(tabAnim, {
      toValue: tab === 'phone' ? 0 : 1,
      useNativeDriver: false,
      tension: 100,
      friction: 12,
    }).start();
  };
  const handleAutoDetect = useCallback(async () => {
    if (Platform.OS !== 'android') return;
    try {
      const phoneNumber = await showPhoneNumberHint();
      //const phoneNumber = '+93 9176543210'; // Simulated phone number for testing
      if (phoneNumber) {
         const final = stripCountryCode(phoneNumber);
        setPhone(final);
      }

    } catch (err) {
      console.log('LOGINHINT-ERROR:', err);
    }
  }, []);

  const handleContinue = useCallback(async () => {
    setError(null);

    if (activeTab === 'phone') {
      if (!phone.trim() || phone.length < 10) {
        setError('Enter a valid 10-digit phone number');
        return;
      }
      // TODO: Integrate OTP service (e.g. Firebase, MSG91)
      setError('Phone OTP login coming soon. Please use email.');
      return;
    }
    // Email flow
    if (!email.trim()) { setError('Email is required'); return; }
    if (!password.trim()) { setError('Password is required'); return; }

    if (isRegister) {
      if (!firstName.trim()) { setError('First name is required'); return; }
    }

    setLoading(true);
    try {
      if (isRegister) {
        await register({
          email,
          password,
          firstName,
          lastName,
        });
      } else {
        await login({ email, password });
      }
      router.replace('/(tabs)');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        (isRegister ? 'Registration failed. Try again.' : 'Invalid email or password.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [activeTab, phone, email, password, firstName, lastName, isRegister, login, register, router]);

  const tabIndicatorLeft = tabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '50%'],
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Hero Image Section ── */}
      <View style={styles.hero}>
        <View style={styles.heroBg} />
        <View style={styles.heroContent}>
          <ThemedText style={styles.heroTagline}>Order food you love</ThemedText>
          <ThemedText style={styles.heroTitle}>Fast Delivery{'\n'}To Your Door</ThemedText>
          {/* Dots */}
          <View style={styles.heroDots}>
            {[0, 1, 2, 3, 4].map((i) => (
              <View
                key={i}
                style={[styles.heroDot, i === 0 && styles.heroDotActive]}
              />
            ))}
          </View>
        </View>
      </View>
      {/* ── Login Sheet ── */}
      <KeyboardAvoidingView
        style={[styles.sheet, { backgroundColor: surface }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
        >
          <ThemedText style={styles.sheetTitle}>Log in or sign up</ThemedText>

          {/* ── Tab switcher ── */}
          <View style={styles.tabBar}>
            <Animated.View
              style={[
                styles.tabIndicator,
                { left: tabIndicatorLeft },
              ]}
            />
            <TouchableOpacity
              style={styles.tab}
              onPress={() => switchTab('phone')}
            >
              <ThemedText
                style={[
                  styles.tabText,
                  activeTab === 'phone' && styles.tabTextActive,
                ]}
              >
                📱 Phone
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => switchTab('email')}
            >
              <ThemedText
                style={[
                  styles.tabText,
                  activeTab === 'email' && styles.tabTextActive,
                ]}
              >
                ✉️ Email
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* ── Phone Tab ── */}
          {activeTab === 'phone' && (
            <View style={styles.inputGroup}>
              <View style={styles.phoneRow}>
                <View style={[styles.countryCode, { borderColor: 'rgba(0,0,0,0.15)' }]}>
                  <ThemedText style={styles.flag}>🇮🇳</ThemedText>
                  <ThemedText style={styles.countryCodeText}>+91</ThemedText>
                  <MaterialIcons name="arrow-drop-down" size={18} color={icon} />
                </View>
                <TextInput
                  style={[styles.phoneInput, { color: text, borderColor: 'rgba(0,0,0,0.15)' }]}
                  placeholder="Enter Phone Number"
                  placeholderTextColor="rgba(150,150,150,0.8)"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
                {/* ✅ Auto detect button HERE inside the tab */}
                {Platform.OS === 'android' && (
                  <TouchableOpacity
                    style={[styles.autoDetectBtn, { borderColor: 'rgba(0,0,0,0.15)' }]}
                    onPress={handleAutoDetect}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="sim-card" size={22} color="#E8445A" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* ── Email Tab ── */}
          {activeTab === 'email' && (
            <View style={styles.inputGroup}>
              {isRegister && (
                <>
                  <TextInput
                    style={[styles.input, { color: text, borderColor: 'rgba(0,0,0,0.15)' }]}
                    placeholder="First Name"
                    placeholderTextColor="rgba(150,150,150,0.8)"
                    value={firstName}
                    onChangeText={setFirstName}
                  />
                  <TextInput
                    style={[styles.input, { color: text, borderColor: 'rgba(0,0,0,0.15)' }]}
                    placeholder="Last Name"
                    placeholderTextColor="rgba(150,150,150,0.8)"
                    value={lastName}
                    onChangeText={setLastName}
                  />
                </>
              )}
              <TextInput
                style={[styles.input, { color: text, borderColor: 'rgba(0,0,0,0.15)' }]}
                placeholder="Email address"
                placeholderTextColor="rgba(150,150,150,0.8)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.passwordInput, { color: text, borderColor: 'rgba(0,0,0,0.15)' }]}
                  placeholder="Password"
                  placeholderTextColor="rgba(150,150,150,0.8)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword((p) => !p)}
                >
                  <MaterialIcons
                    name={showPassword ? 'visibility-off' : 'visibility'}
                    size={20}
                    color={icon}
                  />
                </TouchableOpacity>
              </View>

              {/* Toggle login/register */}
              <TouchableOpacity onPress={() => { setIsRegister((r) => !r); setError(null); }}>
                <ThemedText style={styles.toggleAuth}>
                  {isRegister
                    ? 'Already have an account? Login'
                    : "Don't have an account? Sign up"}
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Remember me ── */}
          <TouchableOpacity
            style={styles.rememberRow}
            onPress={() => setRememberMe((r) => !r)}
          >
            <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
              {rememberMe && (
                <MaterialIcons name="check" size={14} color="#fff" />
              )}
            </View>
            <ThemedText style={styles.rememberText}>
              Remember my login for faster sign-in
            </ThemedText>
          </TouchableOpacity>

          {/* ── Error ── */}
          {error && (
            <View style={styles.errorBox}>
              <MaterialIcons name="error-outline" size={15} color="#E8445A" />
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            </View>
          )}

          {/* ── Continue button ── */}
          <TouchableOpacity
            style={[styles.continueBtn, loading && { opacity: 0.75 }]}
            onPress={handleContinue}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.continueBtnText}>
                {isRegister ? 'Create Account' : 'Continue'}
              </ThemedText>
            )}
          </TouchableOpacity>

          {/* ── Divider ── */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <ThemedText style={styles.dividerText}>or</ThemedText>
            <View style={styles.dividerLine} />
          </View>

          {/* ── Social login ── */}
          <View style={styles.socialRow}>
            {/* Google */}
            <TouchableOpacity
              style={[styles.socialBtn, { borderColor: 'rgba(0,0,0,0.12)' }]}
              onPress={() => setError('Google login coming soon')}
            >
              <ThemedText style={styles.socialIcon}>G</ThemedText>
            </TouchableOpacity>

            {/* Email (if on phone tab, show email shortcut) */}
            {activeTab === 'phone' && (
              <TouchableOpacity
                style={[styles.socialBtn, { borderColor: 'rgba(0,0,0,0.12)' }]}
                onPress={() => switchTab('email')}
              >
                <MaterialIcons name="email" size={22} color="#E8445A" />
              </TouchableOpacity>
            )}
          </View>

          {/* ── Terms ── */}
          <ThemedText style={styles.terms}>
            By continuing, you agree to our{'\n'}
            <ThemedText style={styles.termsLink}>Terms of Service</ThemedText>
            {'  '}
            <ThemedText style={styles.termsLink}>Privacy Policy</ThemedText>
            {'  '}
            <ThemedText style={styles.termsLink}>Content Policy</ThemedText>
          </ThemedText>
        </ScrollView>
      </KeyboardAvoidingView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  // Hero
  hero: {
    height: H * 0.45,
    position: 'relative',
    overflow: 'hidden',
  },
  heroBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1a1a1a',
  },
  heroContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    gap: Spacing.sm,
  },
  heroTagline: {
    fontSize: 14,
    color: '#E8445A',
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 42,
  },
  heroDots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: Spacing.lg,
  },
  heroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  heroDotActive: {
    width: 18,
    backgroundColor: '#fff',
  },
  // Sheet
  sheet: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    marginTop: -28,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  // Tabs
  tabBar: {
    flexDirection: 'row',
    height: 44,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  tabIndicator: {
    position: 'absolute',
    width: '50%',
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.5,
  },
  tabTextActive: {
    opacity: 1,
    fontWeight: '700',
  },
  // Inputs
  inputGroup: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    gap: 4,
    minWidth: 90,
  },
  flag: { fontSize: 20 },
  countryCodeText: { fontSize: 14, fontWeight: '600' },
  phoneInput: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 15,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 15,
  },
  passwordRow: {
    position: 'relative',
  },
  passwordInput: {
    borderWidth: 1.5,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingRight: 50,
    fontSize: 15,
  },
  eyeBtn: {
    position: 'absolute',
    right: Spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  toggleAuth: {
    fontSize: 13,
    color: '#E8445A',
    fontWeight: '600',
    textAlign: 'right',
  },
  // Remember me
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    marginTop: Spacing.xs,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderRadius: 4,
    borderColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#E8445A',
    borderColor: '#E8445A',
  },
  rememberText: {
    fontSize: 13,
    opacity: 0.65,
    flex: 1,
  },
  // Error
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#FFF0F3',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#E8445A',
  },
  // Continue button
  continueBtn: {
    backgroundColor: '#E8445A',
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    shadowColor: '#E8445A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  continueBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  dividerText: {
    fontSize: 13,
    opacity: 0.4,
  },
  // Social
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  socialBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialIcon: {
    fontSize: 20,
    fontWeight: '900',
    color: '#4285F4',
  },
  // Terms
  terms: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.5,
    lineHeight: 20,
  },
  termsLink: {
    opacity: 1,
    fontWeight: '600',
  },
  autoDetectBtn: {
    borderWidth: 1.5,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
