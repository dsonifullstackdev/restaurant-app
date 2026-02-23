import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { t } from '@/i18n';

export default function OrdersScreen() {
  return (
    <View style={styles.container}>
      <ThemedText type="title">{t('tabs.orders')}</ThemedText>
      <ThemedText style={styles.subtitle}>{t('orders.emptyMessage')}</ThemedText>
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
