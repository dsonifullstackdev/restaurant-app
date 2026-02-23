import { Image } from 'expo-image';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { t } from '@/i18n';
import type { WcProduct } from '@/types/api';

type ProductCardProps = {
  product: WcProduct;
  onPress?: () => void;
};

function getProductImageUrl(product: WcProduct): string | null {
  if (product.featured_src) return product.featured_src;
  const images = product.images;
  if (Array.isArray(images) && images.length > 0 && images[0].src) {
    return images[0].src;
  }
  return null;
}

function getProductName(product: WcProduct): string {
  return (product.name ?? product.title ?? '').trim() || 'Product';
}

function getPrice(product: WcProduct): string {
  const raw = product.price ?? product.regular_price ?? '';
  if (typeof raw !== 'string') return '';
  return raw;
}

export function ProductCard({ product, onPress }: ProductCardProps) {
  const surface = useThemeColor({}, 'surface');
  const text = useThemeColor({}, 'text');
  const icon = useThemeColor({}, 'icon');

  const imageUrl = getProductImageUrl(product);
  const name = getProductName(product);
  const priceStr = getPrice(product);
  const priceLabel = priceStr ? `₹${priceStr} ${t('home.forOne')}` : '';

  return (
    <Pressable
      style={({ pressed }) => [styles.card, { backgroundColor: surface }, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.imageWrap}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: icon }]} />
        )}
      </View>
      <View style={styles.body}>
        <ThemedText style={[styles.name, { color: text }]} type="defaultSemiBold" numberOfLines={2}>
          {name}
        </ThemedText>
        {priceLabel ? (
          <ThemedText style={[styles.price, { color: text }]} type="defaultSemiBold">
            {priceLabel}
          </ThemedText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.lg,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.9,
  },
  imageWrap: {
    width: 88,
    height: 88,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    opacity: 0.25,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 16,
    marginBottom: Spacing.xs,
  },
  price: {
    fontSize: 14,
  },
});
