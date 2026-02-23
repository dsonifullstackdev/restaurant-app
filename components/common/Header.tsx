import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppConfig } from '@/config/app.config';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { t } from '@/i18n';

export function Header() {
  const primary = useThemeColor({}, 'primary');
  const text = useThemeColor({}, 'text');
  const icon = useThemeColor({}, 'icon');
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ThemedText style={[styles.logo, { color: primary }]} type="defaultSemiBold">
        {AppConfig.APP_NAME}
      </ThemedText>
      <Pressable style={styles.location} onPress={() => {}} accessibilityLabel={t('home.deliveryAddress')}>
        <MaterialIcons name="location-on" size={18} color={icon} />
        <ThemedText style={[styles.locationText, { color: text }]} numberOfLines={1}>
          {t('home.deliveryAddress')}
        </ThemedText>
        <MaterialIcons name="keyboard-arrow-down" size={20} color={icon} />
      </Pressable>
      <Pressable
        style={styles.notification}
        onPress={() => {}}
        accessibilityLabel="Notifications"
      >
        <MaterialIcons name="notifications-none" size={24} color={icon} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  logo: {
    fontSize: 20,
  },
  location: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    minWidth: 0,
  },
  locationText: {
    fontSize: 14,
    flex: 1,
  },
  notification: {
    padding: Spacing.xs,
  },
});
