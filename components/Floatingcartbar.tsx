import { t } from '@/i18n';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useCart } from '@/context/CartContext';

export function FloatingCartBar() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items, totalItems, totalPrice } = useCart();
  const slideAnim = useRef(new Animated.Value(100)).current;

  const hasItems = totalItems > 0;

  // Slide up when items added, slide down when cart empty
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: hasItems ? 0 : 100,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [hasItems]);

  if (!hasItems) return null;

  // Show max 2 product images
  const previewImages = items.slice(0, 2).map((i) => i.images?.[0]?.src).filter(Boolean);

  // Format price (WooCommerce returns price in minor units e.g. 49900 = ₹499)
  const formattedPrice = `₹${(parseInt(totalPrice) / 100).toFixed(0)}`;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          bottom: insets.bottom + Spacing.lg,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.bar}
        onPress={() => router.push('/cart')}
        activeOpacity={0.9}
      >
        {/* Left — product image previews */}
        <View style={styles.images}>
          {previewImages.map((src, index) => (
            <Image
              key={index}
              source={{ uri: src }}
              style={[
                styles.previewImage,
                { marginLeft: index > 0 ? -10 : 0 },
              ]}
            />
          ))}
        </View>

        {/* Center — item count */}
        <ThemedText style={styles.label}>
          {totalItems} {totalItems === 1 ? 'item' : 'items'} added
        </ThemedText>

        {/* Right — view cart */}
        <View style={styles.right}>
          <ThemedText style={styles.viewCart}>{t('cart.view_cart')}</ThemedText>
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
    zIndex: 999,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8445A',
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    shadowColor: '#E8445A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  images: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#fff',
  },
  label: {
    flex: 1,
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewCart: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
