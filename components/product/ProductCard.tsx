import { Image } from 'expo-image';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useCart } from '@/context/CartContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { WcProduct } from '@/types/api';

type ProductCardProps = {
  product: WcProduct;
  onPress?: () => void;
};

function getProductImageUrl(product: WcProduct): string | null {
  if (product.images?.length && product.images[0]?.src) {
    return product.images[0].src;
  }
  return null;
}

function formatPrice(value?: string) {
  if (!value) return '';
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) return '';
  return `₹${(parsed / 100).toFixed(0)}`;
}

export function ProductCard({ product, onPress }: ProductCardProps) {
  const surface = useThemeColor({}, 'surface');
  const text = useThemeColor({}, 'text');
  const primary = useThemeColor({}, 'primary');
  const icon = useThemeColor({}, 'icon');

  const { addItem } = useCart();

  const imageUrl = getProductImageUrl(product);
  const salePrice = formatPrice(product.prices?.sale_price);
  const regularPrice = formatPrice(product.prices?.regular_price);

  const discount =
    product.prices?.regular_price && product.prices?.sale_price
      ? Math.round(
          (1 -
            parseInt(product.prices.sale_price) /
              parseInt(product.prices.regular_price)) *
            100
        )
      : null;

  const handleAddToCart = async () => {
    await addItem(product.id, 1);
  };

  return (
    <Pressable style={[styles.card, { backgroundColor: surface }]} onPress={onPress}>
      {/* LEFT CONTENT */}
      <View style={styles.body}>
        <ThemedText style={[styles.name, { color: text }]} type="defaultSemiBold" numberOfLines={1}>
          {product.name}
        </ThemedText>

        <View style={styles.priceRow}>
          {salePrice ? (
            <>
              <ThemedText style={[styles.salePrice, { color: text }]}>{salePrice}</ThemedText>
              {regularPrice && (
                <ThemedText style={[styles.regularPrice, { color: icon }]}>{regularPrice}</ThemedText>
              )}
            </>
          ) : regularPrice ? (
            <ThemedText style={[styles.salePrice, { color: text }]}>{regularPrice}</ThemedText>
          ) : null}
        </View>

        {discount ? (
          <ThemedText style={styles.discount}>{discount}% OFF</ThemedText>
        ) : null}

        {product.short_description ? (
          <ThemedText style={[styles.description, { color: icon }]} numberOfLines={2}>
            {product.short_description.replace(/<[^>]+>/g, '')}
          </ThemedText>
        ) : null}
      </View>

      {/* IMAGE */}
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: icon }]} />
        )}

        {/* ADD BUTTON */}
        <Pressable style={[styles.addButton, { borderColor: primary }]} onPress={handleAddToCart}>
          <ThemedText style={[styles.addText, { color: primary }]}>ADD</ThemedText>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.lg,
  },
  body: { flex: 1, justifyContent: 'center' },
  name: { fontSize: 16, marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  salePrice: { fontSize: 15, fontWeight: '600' },
  regularPrice: { fontSize: 13, textDecorationLine: 'line-through' },
  discount: { color: '#2979FF', fontSize: 13, fontWeight: '600', marginVertical: 4 },
  description: { fontSize: 13, marginTop: 4 },
  imageContainer: { width: 110, height: 110, borderRadius: BorderRadius.lg, overflow: 'visible' },
  image: { width: '100%', height: '100%', borderRadius: BorderRadius.lg },
  imagePlaceholder: { width: '100%', height: '100%', borderRadius: BorderRadius.lg, opacity: 0.2 },
  addButton: {
    position: 'absolute',
    bottom: -10,
    alignSelf: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  addText: { fontSize: 12, fontWeight: '600' },
});
