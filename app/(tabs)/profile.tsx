/**
 * Profile screen — loads saved onboarding data, allows editing and updating.
 * Uses same UPDATE_PROFILE endpoint as onboarding.
 * Reads from AsyncStorage (@user_food_prefs) + AuthContext for pre-fill.
 */

import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { getProfile, updateProfile } from '@/api/services/onboarding.service';
import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { WcProductCategory } from '@/types/api';

const PREFS_KEY = '@user_food_prefs';
const COLS = 3;

// ── FSSAI diet icon — defined outside to prevent keyboard dismiss ────
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

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout, loginWithToken } = useAuth();
  const background = useThemeColor({}, 'background');
  const surface = useThemeColor({}, 'surface');
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');

  // ── Form refs (no re-render on keystroke) ────────────────────────
  const nameRef = useRef(
    user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : ''
  );
  const emailRef = useRef(user?.email ?? '');
  const addressRef = useRef('');
  const cityRef = useRef('');
  const postalCodeRef = useRef('');

  // ── State ────────────────────────────────────────────────────────
  const [whatsappUpdates, setWhatsappUpdates] = useState(true);
  const [dietOptions, setDietOptions] = useState<WcProductCategory[]>([]);
  const [selectedDiet, setSelectedDiet] = useState<WcProductCategory | null>(null);
  const [subItems, setSubItems] = useState<WcProductCategory[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [catLoading, setCatLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pageReady, setPageReady] = useState(false); // don't render until prefs loaded
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ── Load categories + saved prefs ────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setCatLoading(true);
      try {
        // Fetch categories + server profile + local cache in parallel
        const [all, savedPrefsRaw, serverProfile] = await Promise.all([
          fetchCategories({ action_key: 'landing_page', per_page: 100 }),
          AsyncStorage.getItem(PREFS_KEY),
          (user?.token
            ? getStoredDeviceData()
                .then(({ recordId }) => getProfile(user.token, recordId ?? ''))
                .catch(() => null)
            : Promise.resolve(null)),
        ]);

        // Merge: server is source of truth, AsyncStorage is fallback
        const local = savedPrefsRaw ? JSON.parse(savedPrefsRaw) : {};
        const sp = serverProfile?.profile ?? {};
        const su = serverProfile?.user ?? {};

        // Pre-fill text refs — server > AsyncStorage > AuthContext
        nameRef.current =
          (su.first_name ? `${su.first_name} ${su.last_name ?? ''}`.trim() : '') ||
          local.name ||
          (user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : '');
        emailRef.current = su.email || local.email || user?.email || '';
        addressRef.current = sp.address || local.address || '';
        cityRef.current = sp.city || local.city || '';
        postalCodeRef.current = sp.postal_code || local.postal_code || '';

        const wa = sp.whatsapp_updates ?? local.whatsapp_updates;
        if (wa !== undefined) setWhatsappUpdates(wa);

        // Build category hierarchy
        const food = all.find((c) => c.slug === 'food' && c.parent === 0)
          ?? all.find((c) => c.parent === 0);
        if (!food) return;

        const diets = all.filter((c) => c.parent === food.id);
        setDietOptions(diets);

        // Pre-select diet — server > local > first option
        const dietSlug = sp.diet_pill || local.dietary;
        const savedDiet = dietSlug ? diets.find((d) => d.slug === dietSlug) : null;
        const defaultDiet = savedDiet ?? diets[0] ?? null;
        setSelectedDiet(defaultDiet);

        if (defaultDiet) {
          const subs = all.filter((c) => c.parent === defaultDiet.id);
          setSubItems(subs);
          // server food_categories > local selectedItems > all
          const saved: number[] =
            (sp.food_categories && sp.food_categories.length > 0)
              ? sp.food_categories
              : (local.selectedItems ?? []);
          setSelectedItems(saved.length > 0 ? saved : subs.map((s) => s.id));
        }
      } catch (e) {
        console.log('[Profile] Load error:', e);
      } finally {
        setCatLoading(false);
        setPageReady(true);
      }
    };
    load();
  }, []);

  // ── Switch diet ──────────────────────────────────────────────────
  const handleDietSwitch = useCallback(async (diet: WcProductCategory) => {
    setSelectedDiet(diet);
    setSelectedItems([]);
    try {
      const all = await fetchCategories({ action_key: 'landing_page', per_page: 100 });
      const subs = all.filter((c) => c.parent === diet.id);
      setSubItems(subs);
      setSelectedItems(subs.map((s) => s.id));
    } catch {}
  }, []);

  // ── Toggle food item ─────────────────────────────────────────────
  const toggleItem = useCallback((id: number) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  // ── Validate ─────────────────────────────────────────────────────
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

  // ── Save profile ─────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setSaveError(null);
    setSaveSuccess(false);
    if (!validate()) return;

    setSaving(true);
    try {
      const { recordId } = await getStoredDeviceData();

      // Save to AsyncStorage
      await AsyncStorage.setItem(PREFS_KEY, JSON.stringify({
        name: nameRef.current.trim(),
        email: emailRef.current.trim(),
        dietary: selectedDiet!.slug,
        dietaryId: selectedDiet!.id,
        selectedItems,
        address: addressRef.current.trim(),
        city: cityRef.current.trim(),
        postal_code: postalCodeRef.current.trim(),
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
        // Update AuthContext with fresh data
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
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setSaveError(response.message ?? 'Update failed. Please try again.');
      }
    } catch (err: any) {
      setSaveError(err?.response?.data?.message ?? 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }, [selectedDiet, selectedItems, whatsappUpdates, user, loginWithToken]);

  // ── Logout ───────────────────────────────────────────────────────
  const handleLogout = useCallback(async () => {
    await logout();
    router.replace('/login');
  }, [logout, router]);

  const displayName = user
    ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.phone || 'User'
    : 'User';

  // Don't render form until AsyncStorage prefs are loaded into refs
  // Otherwise defaultValue reads empty refs and TextInput never shows saved data
  if (!pageReady) {
    return (
      <View style={[styles.root, { backgroundColor: background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#E8445A" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm, backgroundColor: surface }]}>
        <ThemedText style={styles.headerTitle}>My Profile</ThemedText>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <MaterialIcons name="logout" size={20} color="#E8445A" />
          <ThemedText style={styles.logoutText}>Logout</ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
      >
        {/* ── Avatar + name ── */}
        <View style={[styles.avatarSection, { backgroundColor: surface }]}>
          <View style={styles.avatar}>
            <ThemedText style={styles.avatarInitial}>
              {displayName.charAt(0).toUpperCase()}
            </ThemedText>
          </View>
          <ThemedText style={styles.displayName}>{displayName}</ThemedText>
          {!!user?.phone && (
            <ThemedText style={styles.phoneLabel}>+91 {user.phone}</ThemedText>
          )}
        </View>

        <View style={styles.divider} />

        {/* ── Personal details ── */}
        <ThemedText style={styles.sectionTitle}>Personal Details</ThemedText>

        {/* Name */}
        <View style={styles.fieldWrap}>
          <ThemedText style={styles.label}>Full Name</ThemedText>
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

        {/* Email */}
        <View style={styles.fieldWrap}>
          <ThemedText style={styles.label}>Email (optional)</ThemedText>
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

        {/* Address */}
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

        {/* City + Postal */}
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

        {/* ── Dietary preference ── */}
        <ThemedText style={styles.sectionTitle}>Dietary Preference</ThemedText>
        {!!errors.diet_pill && (
          <ThemedText style={[styles.fieldError, { marginBottom: Spacing.sm }]}>{errors.diet_pill}</ThemedText>
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
                      backgroundColor: isActive ? (isVeg ? '#f0fdf4' : '#fff5f5') : surface,
                    },
                  ]}
                  onPress={() => handleDietSwitch(opt)}
                  activeOpacity={0.8}
                >
                  <DietIcon isVeg={isVeg} />
                  <ThemedText style={[styles.dietPillText, isActive && { color: activeColor, fontWeight: '700' }]}>
                    {opt.name}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={styles.divider} />

        {/* ── Food categories ── */}
        <ThemedText style={styles.sectionTitle}>Food Preferences</ThemedText>
        <ThemedText style={styles.sublabel}>Select what you enjoy eating</ThemedText>

        {catLoading ? (
          <ActivityIndicator color="#E8445A" size="large" style={{ marginVertical: Spacing.xl }} />
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

        {/* ── WhatsApp ── */}
        <TouchableOpacity
          style={[styles.waRow, { borderTopColor: 'rgba(0,0,0,0.06)', backgroundColor: surface }]}
          onPress={() => setWhatsappUpdates((w) => !w)}
          activeOpacity={0.8}
        >
          <View style={styles.waLeft}>
            <ThemedText style={{ fontSize: 22 }}>💬</ThemedText>
            <ThemedText style={styles.waText}>Receive updates on WhatsApp</ThemedText>
          </View>
          <View style={[styles.waCheck, whatsappUpdates && styles.waCheckOn]}>
            {whatsappUpdates && <MaterialIcons name="check" size={14} color="#fff" />}
          </View>
        </TouchableOpacity>

        {/* ── Feedback messages ── */}
        {!!saveError && (
          <View style={styles.errorBox}>
            <MaterialIcons name="error-outline" size={15} color="#E8445A" />
            <ThemedText style={styles.errorText}>{saveError}</ThemedText>
          </View>
        )}
        {saveSuccess && (
          <View style={styles.successBox}>
            <MaterialIcons name="check-circle-outline" size={15} color="#22c55e" />
            <ThemedText style={styles.successText}>Profile updated successfully!</ThemedText>
          </View>
        )}
      </ScrollView>

      {/* ── Sticky Save button ── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md, backgroundColor: background, borderTopColor: 'rgba(0,0,0,0.07)' }]}>
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnOff]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <ThemedText style={styles.saveBtnText}>Save Changes</ThemedText>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const ITEM_SIZE = 100;

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  logoutText: { fontSize: 14, fontWeight: '600', color: '#E8445A' },

  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },

  // Avatar
  avatarSection: {
    alignItems: 'center', paddingVertical: Spacing.xl,
    borderRadius: BorderRadius.xl, marginBottom: Spacing.lg,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#E8445A', justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.md,
    shadowColor: '#E8445A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  avatarInitial: { fontSize: 32, fontWeight: '700', color: '#fff' },
  displayName: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  phoneLabel: { fontSize: 14, opacity: 0.5 },

  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.06)', marginVertical: Spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: Spacing.md },
  sublabel: { fontSize: 13, opacity: 0.5, marginBottom: Spacing.md },

  // Fields
  fieldWrap: { marginBottom: Spacing.md },
  label: { fontSize: 13, fontWeight: '600', opacity: 0.6, marginBottom: Spacing.xs },
  fieldError: { fontSize: 12, color: '#E8445A', marginTop: 4 },
  input: {
    borderWidth: 1.5, borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Platform.OS === 'ios' ? Spacing.md : Spacing.sm + 2,
    fontSize: 15,
  },
  inputMulti: {
    borderWidth: 1.5, borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    fontSize: 15, minHeight: 72,
  },
  rowFields: { flexDirection: 'row', gap: Spacing.sm },

  // Diet
  dietRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.sm },
  dietPill: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm + 2,
    borderRadius: 100, borderWidth: 1.5,
  },
  dietPillText: { fontSize: 14, fontWeight: '600' },

  // FSSAI icons
  fssaiBox: {
    width: 16, height: 16, borderWidth: 1.5, borderRadius: 2,
    justifyContent: 'center', alignItems: 'center',
  },
  fssaiCircle: { width: 7, height: 7, borderRadius: 4 },
  fssaiTriangle: {
    width: 0, height: 0,
    borderLeftWidth: 4, borderRightWidth: 4, borderBottomWidth: 7,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
  },

  // Cat grid
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.md },
  catItem: {
    width: ITEM_SIZE, borderRadius: BorderRadius.lg,
    padding: Spacing.sm, alignItems: 'center', gap: Spacing.xs,
    borderWidth: 1.5, position: 'relative',
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
    width: 16, height: 16, borderRadius: 8, backgroundColor: '#E8445A',
    justifyContent: 'center', alignItems: 'center',
  },

  // WhatsApp
  waRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.md,
    borderTopWidth: 1, marginTop: Spacing.md, marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  waLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  waText: { fontSize: 14, fontWeight: '600', flex: 1 },
  waCheck: {
    width: 26, height: 26, borderRadius: 5,
    borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center', alignItems: 'center',
  },
  waCheckOn: { backgroundColor: '#25D366', borderColor: '#25D366' },

  // Feedback
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: '#FFF0F3', padding: Spacing.md,
    borderRadius: BorderRadius.md, marginBottom: Spacing.md,
  },
  errorText: { flex: 1, fontSize: 13, color: '#E8445A' },
  successBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: '#f0fdf4', padding: Spacing.md,
    borderRadius: BorderRadius.md, marginBottom: Spacing.md,
  },
  successText: { flex: 1, fontSize: 13, color: '#22c55e', fontWeight: '600' },

  // Footer
  footer: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: 1 },
  saveBtn: {
    backgroundColor: '#E8445A', borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md + 2, alignItems: 'center',
    shadowColor: '#E8445A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  saveBtnOff: { opacity: 0.5, elevation: 0, shadowOpacity: 0 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
