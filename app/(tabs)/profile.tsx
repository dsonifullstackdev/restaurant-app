import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { t } from '@/i18n';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <ThemedText type="title">{t('tabs.profile')}</ThemedText>
      <ThemedText style={styles.subtitle}>{t('profile.emptyMessage')}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    marginTop: Spacing.sm,
  },
});
