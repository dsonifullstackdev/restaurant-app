import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/common/Button';
import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { t } from '@/i18n';

export function PromoBanner() {
  const primary = useThemeColor({}, 'primary');
  const border = useThemeColor({}, 'border');

  return (
    <View style={styles.wrapper}>
      <View style={[styles.banner, { backgroundColor: primary }]}>
        <View style={styles.content}>
          <View style={styles.textBlock}>
            <ThemedText style={styles.promoTitle}>{t('home.promoTitle')}</ThemedText>
            <ThemedText style={styles.promoSubtitle}>{t('home.promoSubtitle')}</ThemedText>
            <Button title={t('home.promoCta')} onPress={() => {}} style={styles.cta} />
          </View>
          <View style={styles.imageBlock}>
            <View style={styles.imagePlaceholder} />
          </View>
        </View>
      </View>
      <View style={styles.dots}>
        <View style={[styles.dot, styles.dotActive, { backgroundColor: primary }]} />
        <View style={[styles.dot, { backgroundColor: border }]} />
        <View style={[styles.dot, { backgroundColor: border }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  banner: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    minHeight: 140,
  },
  content: {
    flexDirection: 'row',
    padding: Spacing.lg,
    alignItems: 'center',
    flex: 1,
  },
  textBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  promoTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: Spacing.xs,
  },
  promoSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: Spacing.md,
  },
  cta: {
    alignSelf: 'flex-start',
  },
  imageBlock: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {},
});
