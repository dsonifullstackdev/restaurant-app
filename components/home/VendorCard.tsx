import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { t } from '@/i18n';

export type VendorCardData = {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  deliveryTimeMin: number;
  priceForOne: number;
  imageUri?: string | null;
};

type VendorCardProps = {
  data: VendorCardData;
  onPress?: () => void;
};

export function VendorCard({ data, onPress }: VendorCardProps) {
  const surface = useThemeColor({}, 'surface');
  const text = useThemeColor({}, 'text');
  const icon = useThemeColor({}, 'icon');

  const priceStr = `₹${data.priceForOne} ${t('home.forOne')}`;
  const timeStr = `${data.deliveryTimeMin}-${data.deliveryTimeMin + 5} ${t('common.min')}`;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, { backgroundColor: surface }, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.imageWrap}>
        <View style={[styles.imagePlaceholder, { backgroundColor: icon }]} />
      </View>
      <View style={styles.body}>
        <ThemedText style={[styles.name, { color: text }]} type="defaultSemiBold" numberOfLines={1}>
          {data.name}
        </ThemedText>
        <ThemedText style={[styles.cuisine, { color: icon }]} numberOfLines={1}>
          {data.cuisine}
        </ThemedText>
        <View style={styles.meta}>
          <View style={styles.ratingRow}>
            <MaterialIcons name="star" size={14} color="#FFB800" />
            <ThemedText style={[styles.ratingText, { color: text }]}>
              {t('common.rating', { value: data.rating })}
            </ThemedText>
          </View>
          <ThemedText style={[styles.time, { color: icon }]}>{timeStr}</ThemedText>
        </View>
        <ThemedText style={[styles.price, { color: text }]} type="defaultSemiBold">
          {priceStr}
        </ThemedText>
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
  cuisine: {
    fontSize: 12,
    marginBottom: Spacing.sm,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 12,
  },
  time: {
    fontSize: 12,
  },
  price: {
    fontSize: 14,
  },
});
