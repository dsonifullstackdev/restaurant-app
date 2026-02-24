import { MaterialIcons } from '@expo/vector-icons';
import React, { memo, useCallback } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Spacing } from '@/constants/theme';
import type { CartItem } from '@/context/CartContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { formatPrice } from '@/utils/price';

type CartItemRowProps = {
  item: CartItem;
  onIncrease: (key: string) => void;
  onDecrease: (key: string) => void;
};

export const CartItemRow = memo(function CartItemRow({
  item,
  onIncrease,
  onDecrease,
}: CartItemRowProps) {
  const icon = useThemeColor({}, 'icon');
  const surface = useThemeColor({}, 'surface');
  const primary = '#E8445A';

  const handleIncrease = useCallback(() => onIncrease(item.key), [item.key, onIncrease]);
  const handleDecrease = useCallback(() => onDecrease(item.key), [item.key, onDecrease]);

  const imageUrl = item.images?.[0]?.thumbnail ?? item.images?.[0]?.src;

  // Price from API: "19000" with currency_minor_unit: 2 → ₹190
  const price = formatPrice(
    item.prices?.price,
    item.prices?.currency_minor_unit ?? 2,
    item.prices?.currency_symbol ?? '₹'
  );

  // Show strikethrough if on sale
  const isOnSale = item.prices?.sale_price !== item.prices?.regular_price;
  const regularPrice = formatPrice(
    item.prices?.regular_price,
    item.prices?.currency_minor_unit ?? 2,
    item.prices?.currency_symbol ?? '₹'
  );

  return (
    <View style={[styles.container, { backgroundColor: surface }]}>
      {/* Veg indicator */}
      <View style={styles.vegIndicator}>
        <View style={styles.vegDot} />
      </View>

      {/* Info */}
      <View style={styles.info}>
        <ThemedText style={styles.name} numberOfLines={2}>
          {item.name}
        </ThemedText>

        <View style={styles.priceRow}>
          <ThemedText style={[styles.price, { color: primary }]}>
            {price}
          </ThemedText>
          {isOnSale && (
            <ThemedText style={styles.regularPrice}>
              {regularPrice}
            </ThemedText>
          )}
        </View>
      </View>

      {/* Quantity controls */}
      <View style={[styles.qtyControl, { borderColor: primary }]}>
        <TouchableOpacity
          onPress={handleDecrease}
          style={styles.qtyBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons
            name={item.quantity <= 1 ? 'delete-outline' : 'remove'}
            size={16}
            color={primary}
          />
        </TouchableOpacity>

        <ThemedText style={[styles.qtyText, { color: primary }]}>
          {item.quantity}
        </ThemedText>

        <TouchableOpacity
          onPress={handleIncrease}
          style={styles.qtyBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name="add" size={16} color={primary} />
        </TouchableOpacity>
      </View>

      {/* Product image */}
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} />
      ) : (
        <View style={[styles.imagePlaceholder, { backgroundColor: '#f0f0f0' }]}>
          <MaterialIcons name="fastfood" size={24} color={icon} />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  vegIndicator: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: '#2E7D32',
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  vegDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2E7D32',
  },
  info: {
    flex: 1,
    gap: Spacing.xs,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
  },
  regularPrice: {
    fontSize: 12,
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    minWidth: 88,
    flexShrink: 0,
  },
  qtyBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  qtyText: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 15,
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
    flexShrink: 0,
  },
  imagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
});
