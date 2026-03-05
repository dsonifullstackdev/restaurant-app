/**
 * Onboarding screen — collect user profile after OTP login.
 *
 * Category hierarchy:
 *   Food (parent=0)
 *     └─ Veg (parent=food.id)       ← diet_pill options
 *     └─ Non Veg (parent=food.id)
 *           └─ Pizza, Burgers...    ← food_categories (sub-items)
 *
 * On Done → POST UPDATE_PROFILE
 *   success → /(tabs)
 *   error   → show message
 */

import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fetchCategories } from '@/api/services/category.service';
import { getStoredDeviceData } from '@/api/services/device.service';
import { updateProfile } from '@/api/services/onboarding.service';
import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { WcProductCategory } from '@/types/api';

const { width: W } = Dimensions.get('window');
const COLS = 3;
const ITEM_SIZE = (W - Spacing.lg * 2 - Spacing.md * (COLS - 1)) / COLS;
const PREFS_KEY = '@user_food_prefs';

// ── Defined outside component — never causes keyboard dismiss ────
const DietIcon = ({ isVeg }: { isVeg: boolean }) => {
  const color = isVeg ? '#22c55e' : '#E8445A';
  return (
    <View style={[styles.fssaiBox, { borderColor: color }]}>
      {isVeg
        ? <View style={[styles.fssaiCircle, { backgroundColor: color }]} />
        : <View style={[styles.fssaiTriangle, { borderBottomColor: color }]} />
      }
    </View>
  );
};

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // Pre-fill params passed from OTP screen (existing user's saved profile)
  const params = useLocalSearchParams<{
    address?: string;
    city?: string;
    postal_code?: string;
    diet_pill?: string;
    food_categories?: string;
    dietary_category_id?: string;
    whatsapp_updates?: string;
  }>();
  const { user, loginWithToken } = useAuth();
  const surface = useThemeColor({}, 'surface');
  const background = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  // ── Form fields — useRef so typing never triggers re-render ────────
  // This is the fix for keyboard dismissing on every keystroke.
  const nameRef = useRef(user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : '');
  const emailRef = useRef(user?.email ?? '');
  const addressRef = useRef(params.address ?? '');
  const cityRef = useRef(params.city ?? '');
  const postalCodeRef = useRef(params.postal_code ?? '');
  const [whatsappUpdates, setWhatsappUpdates] = useState(params.whatsapp_updates !== 'false');

  // ── Category state ───────────────────────────────────────────────
  const [dietOptions, setDietOptions] = useState<WcProductCategory[]>([]); // Veg, Non Veg
  const [selectedDiet, setSelectedDiet] = useState<WcProductCategory | null>(null);
  const [subItems, setSubItems] = useState<WcProductCategory[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [catLoading, setCatLoading] = useState(true);

  // ── Validation errors ────────────────────────────────────────────
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Submit state ─────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // ── Load categories on mount ─────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setCatLoading(true);
      try {
        const all = await fetchCategories({ action_key: 'landing_page', per_page: 100 });

        // Find Food root (slug='food', parent=0) or fallback to any root
        const food = all.find((c) => c.slug === 'food' && c.parent === 0)
          ?? all.find((c) => c.parent === 0);
        if (!food) return;

        // Diet options = direct children of Food
        const diets = all.filter((c) => c.parent === food.id);
        setDietOptions(diets);

        // Use saved diet_pill from profile params, else default to first option
        const savedDietSlug = params.diet_pill;
        const defaultDiet = (savedDietSlug
          ? diets.find((d) => d.slug === savedDietSlug)
          : null) ?? diets[0] ?? null;
        setSelectedDiet(defaultDiet);

        if (defaultDiet) {
          const subs = all.filter((c) => c.parent === defaultDiet.id);
          setSubItems(subs);

          // Pre-select saved food_categories if available, else select all
          const savedItems = params.food_categories
            ? JSON.parse(params.food_categories) as number[]
            : [];
          setSelectedItems(savedItems.length > 0 ? savedItems : subs.map((s) => s.id));
        }
      } catch (e) {
        console.log('[Onboarding] Category load error:', e);
      } finally {
        setCatLoading(false);
      }
    };
    load();
  }, []);

  // ── Switch dietary option ────────────────────────────────────────
  const handleDietSwitch = useCallback(async (diet: WcProductCategory) => {
    setSelectedDiet(diet);
    setSelectedItems([]);
    setErrors((prev) => ({ ...prev, diet_pill: '' }));
    try {
      const all = await fetchCategories({ action_key: 'landing_page', per_page: 100 });
      const subs = all.filter((c) => c.parent === diet.id);
      setSubItems(subs);
      setSelectedItems(subs.map((s) => s.id));
    } catch {}
  }, []);

  // ── Toggle sub-item ──────────────────────────────────────────────
  const toggleItem = useCallback((id: number) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  // ── Validate fields ──────────────────────────────────────────────
  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!nameRef.current.trim()) e.name = 'Name is required';
    if (!addressRef.current.trim()) e.address = 'Address is required';
    if (!cityRef.current.trim()) e.city = 'City is required';
    if (!postalCodeRef.current.trim()) e.postalCode = 'Postal code is required';
    if (!selectedDiet) e.diet_pill = 'Please select a dietary preference';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ───────────────────────────────────────────────────────
  const handleDone = useCallback(async () => {
    setApiError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      const { recordId } = await getStoredDeviceData();

      // Persist prefs locally (SharedPreferences equivalent)
      await AsyncStorage.setItem(PREFS_KEY, JSON.stringify({
        name: nameRef.current.trim(),
        email: emailRef.current.trim(),
        address: addressRef.current.trim(),
        city: cityRef.current.trim(),
        postal_code: postalCodeRef.current.trim(),
        dietary: selectedDiet!.slug,
        dietaryId: selectedDiet!.id,
        selectedItems,
        whatsapp_updates: whatsappUpdates,
      }));

      const response = await updateProfile({
        record_id: recordId ?? '',
        token: user?.token ?? '',
        name: nameRef.current.trim(),
        email: emailRef.current.trim(),
        address: addressRef.current.trim(),
        city: cityRef.current.trim(),
        postal_code: postalCodeRef.current.trim(),
        diet_pill: selectedDiet!.slug,
        food_categories: selectedItems,
        dietary_category_id: selectedDiet!.id,
        whatsapp_updates: whatsappUpdates,
      });

      if (response.success) {
        // Update AuthContext with fresh user data from server
        if (response.user && user) {
          await loginWithToken({
            ...user,
            id: response.user.user_id,
            firstName: response.user.first_name,
            lastName: response.user.last_name,
            email: response.user.email,
            displayName: `${response.user.first_name} ${response.user.last_name}`.trim(),
            phone: response.user.phone,
          });
        }

        if (response.service_available === false) {
          router.replace('/service-unavailable');
        } else {
          router.replace('/(tabs)');
        }
      } else {
        setApiError(response.message ?? 'Something went wrong. Please try again.');
      }
    } catch (err: any) {
      setApiError(err?.response?.data?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedDiet, selectedItems, whatsappUpdates, user, router, loginWithToken]);

  // ── FSSAI-style diet indicator icon ─────────────────────────────

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.xs, backgroundColor: background }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <MaterialIcons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Personal Details</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 96 }]}
      >

        {/* ══ Name ══ */}
        <View style={styles.fieldWrap}>
          <ThemedText style={styles.label}>What's your name?</ThemedText>
          <TextInput
            style={[styles.input, { color: textColor, backgroundColor: surface, borderColor: errors.name ? '#E8445A' : 'rgba(0,0,0,0.1)' }]}
            placeholder="Enter full name"
            placeholderTextColor="rgba(150,150,150,0.7)"
            defaultValue={nameRef.current}
            onChangeText={(t) => { nameRef.current = t; if (errors.name) setErrors((p) => ({ ...p, name: '' })); }}
            autoCapitalize="words"
          />
          {!!errors.name && <ThemedText style={styles.fieldError}>{errors.name}</ThemedText>}
        </View>

        {/* ══ Email (optional) ══ */}
        <View style={styles.fieldWrap}>
          <ThemedText style={styles.label}>Email address (optional)</ThemedText>
          <TextInput
            style={[styles.input, { color: textColor, backgroundColor: surface, borderColor: 'rgba(0,0,0,0.1)' }]}
            placeholder="Enter email"
            placeholderTextColor="rgba(150,150,150,0.7)"
            defaultValue={emailRef.current}
            onChangeText={(t) => { emailRef.current = t; }}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* ══ Address ══ */}
        <View style={styles.fieldWrap}>
          <ThemedText style={styles.label}>Full Address</ThemedText>
          <TextInput
            style={[styles.inputMulti, { color: textColor, backgroundColor: surface, borderColor: errors.address ? '#E8445A' : 'rgba(0,0,0,0.1)' }]}
            placeholder="House no., Street, Area..."
            placeholderTextColor="rgba(150,150,150,0.7)"
            defaultValue={addressRef.current}
            onChangeText={(t) => { addressRef.current = t; if (errors.address) setErrors((p) => ({ ...p, address: '' })); }}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
          />
          {!!errors.address && <ThemedText style={styles.fieldError}>{errors.address}</ThemedText>}
        </View>

        {/* ══ City + Postal ══ */}
        <View style={styles.rowFields}>
          <View style={{ flex: 1 }}>
            <View style={styles.fieldWrap}>
              <ThemedText style={styles.label}>City</ThemedText>
              <TextInput
                style={[styles.input, { color: textColor, backgroundColor: surface, borderColor: errors.city ? '#E8445A' : 'rgba(0,0,0,0.1)' }]}
                placeholder="City"
                placeholderTextColor="rgba(150,150,150,0.7)"
                defaultValue={cityRef.current}
                onChangeText={(t) => { cityRef.current = t; if (errors.city) setErrors((p) => ({ ...p, city: '' })); }}
                autoCapitalize="words"
              />
              {!!errors.city && <ThemedText style={styles.fieldError}>{errors.city}</ThemedText>}
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.fieldWrap}>
              <ThemedText style={styles.label}>Postal Code</ThemedText>
              <TextInput
                style={[styles.input, { color: textColor, backgroundColor: surface, borderColor: errors.postalCode ? '#E8445A' : 'rgba(0,0,0,0.1)' }]}
                placeholder="Postal Code"
                placeholderTextColor="rgba(150,150,150,0.7)"
                defaultValue={postalCodeRef.current}
                onChangeText={(t) => { postalCodeRef.current = t; if (errors.postalCode) setErrors((p) => ({ ...p, postalCode: '' })); }}
                keyboardType="number-pad"
                maxLength={6}
              />
              {!!errors.postalCode && <ThemedText style={styles.fieldError}>{errors.postalCode}</ThemedText>}
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ══ Dietary preference ══ */}
        <ThemedText style={styles.label}>What is your dietary preference?</ThemedText>
        {!!errors.diet_pill && (
          <ThemedText style={[styles.fieldError, { marginTop: -Spacing.xs, marginBottom: Spacing.sm }]}>
            {errors.diet_pill}
          </ThemedText>
        )}

        {catLoading ? (
          <ActivityIndicator color="#E8445A" style={{ marginBottom: Spacing.lg }} />
        ) : (
          <View style={styles.dietRow}>
            {dietOptions.map((opt) => {
              const isVeg = opt.slug === 'veg';
              const isActive = selectedDiet?.id === opt.id;
              const activeColor = isVeg ? '#22c55e' : '#E8445A';
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.dietPill,
                    {
                      borderColor: isActive ? activeColor : 'rgba(0,0,0,0.12)',
                      backgroundColor: isActive
                        ? (isVeg ? '#f0fdf4' : '#fff5f5')
                        : surface,
                    },
                  ]}
                  onPress={() => handleDietSwitch(opt)}
                  activeOpacity={0.8}
                >
                  <DietIcon isVeg={isVeg} />
                  <ThemedText style={[
                    styles.dietPillText,
                    isActive && { color: activeColor, fontWeight: '700' },
                  ]}>
                    {opt.name}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={styles.divider} />

        {/* ══ Sub-items (food categories under selected diet) ══ */}
        <ThemedText style={styles.label}>Tell us what you like?</ThemedText>
        <ThemedText style={styles.sublabel}>
          We'll recommend the best deals & offers for you
        </ThemedText>

        {catLoading ? (
          <ActivityIndicator color="#E8445A" size="large" style={{ marginVertical: Spacing.xl }} />
        ) : subItems.length === 0 ? (
          <ThemedText style={[styles.sublabel, { textAlign: 'center' }]}>
            No items available yet.
          </ThemedText>
        ) : (
          <View style={styles.catGrid}>
            {subItems.map((item) => {
              const sel = selectedItems.includes(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.catItem,
                    {
                      width: ITEM_SIZE,
                      backgroundColor: sel ? '#fff0f3' : surface,
                      borderColor: sel ? '#E8445A' : 'rgba(0,0,0,0.08)',
                    },
                  ]}
                  onPress={() => toggleItem(item.id)}
                  activeOpacity={0.75}
                >
                  {item.image?.src ? (
                    <Image
                      source={{ uri: item.image.thumbnail ?? item.image.src }}
                      style={styles.catImg}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.catImgFallback, { backgroundColor: 'rgba(0,0,0,0.06)' }]}>
                      <ThemedText style={{ fontSize: 26 }}>🍽️</ThemedText>
                    </View>
                  )}
                  <ThemedText
                    style={[styles.catLabel, sel && { color: '#E8445A', fontWeight: '700' }]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </ThemedText>
                  {sel && (
                    <View style={styles.selBadge}>
                      <MaterialIcons name="check" size={9} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ══ WhatsApp ══ */}
        <TouchableOpacity
          style={[styles.waRow, { borderTopColor: 'rgba(0,0,0,0.06)' }]}
          onPress={() => setWhatsappUpdates((w) => !w)}
          activeOpacity={0.8}
        >
          <View style={styles.waLeft}>
            <ThemedText style={{ fontSize: 22 }}>💬</ThemedText>
            <ThemedText style={styles.waText}>Send me updates on WhatsApp</ThemedText>
          </View>
          <View style={[styles.waCheck, whatsappUpdates && styles.waCheckOn]}>
            {whatsappUpdates && <MaterialIcons name="check" size={14} color="#fff" />}
          </View>
        </TouchableOpacity>

        {/* ══ API Error ══ */}
        {!!apiError && (
          <View style={styles.errorBox}>
            <MaterialIcons name="error-outline" size={15} color="#E8445A" />
            <ThemedText style={styles.errorText}>{apiError}</ThemedText>
          </View>
        )}

      </ScrollView>

      {/* ── Sticky Done button ── */}
      <View style={[styles.footer, {
        paddingBottom: insets.bottom + Spacing.md,
        backgroundColor: background,
        borderTopColor: 'rgba(0,0,0,0.07)',
      }]}>
        <TouchableOpacity
          style={[styles.doneBtn, loading && styles.doneBtnOff]}
          onPress={handleDone}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <ThemedText style={styles.doneBtnText}>Done</ThemedText>
          }
        </TouchableOpacity>
      </View>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },

  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },

  // Field wrapper
  fieldWrap: { marginBottom: Spacing.md },
  label: { fontSize: 16, fontWeight: '700', marginBottom: Spacing.sm },
  sublabel: { fontSize: 13, opacity: 0.5, marginBottom: Spacing.md, lineHeight: 18 },
  fieldError: { fontSize: 12, color: '#E8445A', marginTop: 4 },

  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.06)', marginVertical: Spacing.xl },

  // Inputs
  input: {
    borderWidth: 1.5,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Platform.OS === 'ios' ? Spacing.md : Spacing.sm + 2,
    fontSize: 15,
  },
  inputMulti: {
    borderWidth: 1.5,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 15,
    minHeight: 72,
  },
  rowFields: { flexDirection: 'row', gap: Spacing.sm },

  // Dietary
  dietRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.sm },
  dietPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: 100,
    borderWidth: 1.5,
  },
  dietPillText: { fontSize: 14, fontWeight: '600' },

  // FSSAI icons
  fssaiBox: {
    width: 16, height: 16,
    borderWidth: 1.5, borderRadius: 2,
    justifyContent: 'center', alignItems: 'center',
  },
  fssaiCircle: { width: 7, height: 7, borderRadius: 4 },
  fssaiTriangle: {
    width: 0, height: 0,
    borderLeftWidth: 4, borderRightWidth: 4, borderBottomWidth: 7,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
  },

  // Category grid
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.md },
  catItem: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1.5,
    position: 'relative',
  },
  catImg: {
    width: ITEM_SIZE - Spacing.sm * 2 - 4,
    height: ITEM_SIZE - Spacing.sm * 2 - 4,
    borderRadius: (ITEM_SIZE - Spacing.sm * 2 - 4) / 2,
  },
  catImgFallback: {
    width: ITEM_SIZE - Spacing.sm * 2 - 4,
    height: ITEM_SIZE - Spacing.sm * 2 - 4,
    borderRadius: (ITEM_SIZE - Spacing.sm * 2 - 4) / 2,
    justifyContent: 'center', alignItems: 'center',
  },
  catLabel: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  selBadge: {
    position: 'absolute', top: 5, right: 5,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#E8445A',
    justifyContent: 'center', alignItems: 'center',
  },

  // WhatsApp
  waRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderTopWidth: 1, marginTop: Spacing.md, marginBottom: Spacing.md,
  },
  waLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  waText: { fontSize: 14, fontWeight: '600', flex: 1 },
  waCheck: {
    width: 26, height: 26, borderRadius: 5,
    borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center', alignItems: 'center',
  },
  waCheckOn: { backgroundColor: '#25D366', borderColor: '#25D366' },

  // API error
  errorBox: {
    flexDirection: 'row', alignItems: 'center',
    gap: Spacing.sm, backgroundColor: '#FFF0F3',
    padding: Spacing.md, borderRadius: BorderRadius.md, marginBottom: Spacing.md,
  },
  errorText: { flex: 1, fontSize: 13, color: '#E8445A' },

  // Footer
  footer: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: 1 },
  doneBtn: {
    backgroundColor: '#E8445A',
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    shadowColor: '#E8445A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  doneBtnOff: { opacity: 0.5, elevation: 0, shadowOpacity: 0 },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
