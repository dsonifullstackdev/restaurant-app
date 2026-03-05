import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppConfig } from '@/config/app.config';
import { Spacing } from '@/constants/theme';
import { useCart } from '@/context/CartContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { t } from '@/i18n';

export function Header() {
  const primary = useThemeColor({}, 'primary');
  const text = useThemeColor({}, 'text');
  const icon = useThemeColor({}, 'icon');
  const router = useRouter();

  const { totalItems } = useCart();

  return (
    <View style={styles.container}>
      {/* App Name */}
      <ThemedText style={[styles.logo, { color: primary }]} type="defaultSemiBold">
        {AppConfig.APP_NAME}
      </ThemedText>

      {/* Location */}
      <Pressable style={styles.location} onPress={() => {}} accessibilityLabel={t('home.deliveryAddress')}>
        <MaterialIcons name="location-on" size={18} color={icon} />
        <ThemedText style={[styles.locationText, { color: text }]} numberOfLines={1}>
          {t('home.deliveryAddress')}
        </ThemedText>
        <MaterialIcons name="keyboard-arrow-down" size={20} color={icon} />
      </Pressable>

      {/* Right Icons */}
      <View style={styles.rightIcons}>
        {/* Notification */}
        <Pressable style={styles.iconButton} onPress={() => {}} accessibilityLabel="Notifications">
          <MaterialIcons name="notifications-none" size={24} color={icon} />
        </Pressable>

        {/* Cart Icon — disabled when empty */}
        <Pressable
          style={styles.iconButton}
          onPress={() => { if (totalItems > 0) router.push('/cart'); }}
          accessibilityLabel="Cart"
        >
          <MaterialIcons
            name="shopping-cart"
            size={24}
            color={totalItems > 0 ? icon : `${icon}55`} // dimmed when empty
          />
          {totalItems > 0 && (
            <View style={styles.badge}>
              <ThemedText style={styles.badgeText}>{totalItems}</ThemedText>
            </View>
          )}
        </Pressable>
      </View>
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
  logo: { fontSize: 20 },
  location: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    gap: Spacing.xs, minWidth: 0,
  },
  locationText: { fontSize: 14, flex: 1 },
  rightIcons: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  iconButton: { padding: Spacing.xs },
  badge: {
    position: 'absolute', top: -6, right: -8,
    backgroundColor: '#FF3B30', borderRadius: 10,
    minWidth: 16, paddingHorizontal: 4, paddingVertical: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '600' },
});
