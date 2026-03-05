import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  AppState,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/utils/price';

// Screens where the bar should not appear
const HIDE_ON = ['cart', 'checkout', 'order-success', 'login', 'otp', 'onboarding', 'service-unavailable'];

export function FloatingCartBar() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const { items, totals, totalItems, refreshCart } = useCart();

  const slideAnim = useRef(new Animated.Value(80)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  // Current screen — last segment
  const currentScreen = (segments[segments.length - 1] ?? '') as string;
  const shouldHide = HIDE_ON.includes(currentScreen);
  const visible = totalItems > 0 && !shouldHide;

  // Animate whenever visibility changes (items added OR screen changes)
  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: visible ? 0 : 80,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }),
      Animated.timing(opacityAnim, {
        toValue: visible ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible]); // visible = totalItems > 0 && !shouldHide

  // Refresh on app foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshCart();
    });
    return () => sub.remove();
  }, [refreshCart]);

  const previewImages = (items ?? [])
    .slice(0, 2)
    .map((i) => i.images?.[0]?.thumbnail ?? i.images?.[0]?.src)
    .filter(Boolean) as string[];

  const minor = totals?.currency_minor_unit ?? 2;
  const symbol = totals?.currency_symbol ?? '₹';
  const formattedTotal = totals ? formatPrice(totals.total_price, minor, symbol) : '';

  const bottomOffset = insets.bottom;

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        styles.wrapper,
        {
          bottom: bottomOffset,
          opacity: opacityAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.bar}
        onPress={() => router.push('/cart')}
        activeOpacity={0.9}
      >
        {previewImages.length > 0 && (
          <View style={styles.images}>
            {previewImages.map((src, index) => (
              <Image
                key={index}
                source={{ uri: src }}
                style={[styles.previewImage, { marginLeft: index > 0 ? -10 : 0 }]}
              />
            ))}
          </View>
        )}

        <View style={styles.center}>
          <ThemedText style={styles.label}>
            {totalItems} {totalItems === 1 ? 'item' : 'items'} added
          </ThemedText>
          {!!formattedTotal && (
            <ThemedText style={styles.total}>{formattedTotal}</ThemedText>
          )}
        </View>

        <View style={styles.right}>
          <ThemedText style={styles.viewCart}>View cart</ThemedText>
          <MaterialIcons name="chevron-right" size={20} color="#fff" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 9999,
    elevation: 9999,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8445A',
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
  images: { flexDirection: 'row', alignItems: 'center' },
  previewImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#fff',
  },
  center: { flex: 1, gap: 2 },
  label: { color: '#fff', fontWeight: '600', fontSize: 14 },
  total: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '500' },
  right: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewCart: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
