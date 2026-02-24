import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import React, { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { t } from '@/i18n';
import type { WcProductCategory } from '@/types/api';

type CategoryMenuProps = {
  categories: WcProductCategory[];
  selectedId: number | null;
  onSelectCategory: (categoryId: number | null) => void;
};

/* 🔥 Increased size by 15% */
const CATEGORY_ICON_SIZE = 80; // was 48

function getCategoryImageUrl(cat: WcProductCategory): string | null {
  if (!cat.image) return null;
  if (typeof cat.image === 'string') return cat.image;
  if (typeof cat.image === 'object' && cat.image?.src) return cat.image.src;
  return null;
}

export function CategoryMenu({
  categories,
  selectedId,
  onSelectCategory,
}: CategoryMenuProps) {
  const primary = useThemeColor({}, 'primary');
  const icon = useThemeColor({}, 'icon');
  const surface = useThemeColor({}, 'surface');

  const renderAll = useCallback(() => {
    const isSelected = selectedId === null;

    return (
      <Pressable
        key="all"
        style={[
          styles.item,
          { backgroundColor: isSelected ? primary : surface },

        ]}
        onPress={() => onSelectCategory(null)}
      >
        <View style={styles.iconWrap}>
          <MaterialIcons
            name="apps"
            size={32}
            color={isSelected ? '#fff' : primary}
          />
        </View>

        <ThemedText
          style={[styles.label, { color: isSelected ? '#fff' : icon }]}
          numberOfLines={1}
        >
          {t('home.allCategories')}
        </ThemedText>
      </Pressable>
    );
  }, [selectedId, primary, surface, icon, onSelectCategory]);

  const renderItem = useCallback(
    (cat: WcProductCategory) => {
      const isSelected = selectedId === cat.id;
      const imageUrl = getCategoryImageUrl(cat);

      return (
        <Pressable
          key={cat.id}
          style={[
            styles.item,
            { backgroundColor: isSelected ? primary : surface },
          ]}
          onPress={() => onSelectCategory(cat.id)}
        >
          <View style={styles.iconWrap}>
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={styles.categoryImage}
                contentFit="cover"
              />
            ) : (
              <MaterialIcons
                name="category"
                size={32}
                color={isSelected ? '#fff' : primary}
              />
            )}
          </View>

          <ThemedText
            style={[styles.label, { color: isSelected ? '#fff' : icon }]}
            numberOfLines={1}
          >
            {cat.name}
          </ThemedText>
        </Pressable>
      );
    },
    [selectedId, primary, surface, icon, onSelectCategory]
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={styles.scroll}
    >
      {renderAll()}
      {categories.map(renderItem)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    marginBottom: Spacing.xl,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
    paddingRight: Spacing.xxl,
  },
  item: {
    alignItems: 'center',
    minWidth: 100, // 🔥 increased container width (important)
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  iconWrap: {
    width: CATEGORY_ICON_SIZE,
    height: CATEGORY_ICON_SIZE,
    borderRadius: CATEGORY_ICON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
    overflow: 'hidden',
  },
  categoryImage: {
    width: CATEGORY_ICON_SIZE,
    height: CATEGORY_ICON_SIZE,
    borderRadius: CATEGORY_ICON_SIZE / 2,
  },
  label: {
    fontSize: 13,
    textAlign: 'center',
  },
});
