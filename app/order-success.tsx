import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Spacing } from '@/constants/theme';

export default function OrderSuccessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + Spacing.xl }]}>
      <ThemedText style={styles.emoji}>🎉</ThemedText>
      <ThemedText style={styles.title}>Order Placed!</ThemedText>
      <ThemedText style={styles.subtitle}>
        Your order has been placed successfully.
      </ThemedText>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => router.replace('/(tabs)')}
      >
        <ThemedText style={styles.btnText}>Back to Home</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: Spacing.xl, gap: Spacing.lg,
  },
  emoji: { fontSize: 72 },
  title: { fontSize: 26, fontWeight: '800' },
  subtitle: { fontSize: 15, opacity: 0.55, textAlign: 'center' },
  btn: {
    backgroundColor: '#E8445A', paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md, borderRadius: BorderRadius.xl, marginTop: Spacing.md,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
