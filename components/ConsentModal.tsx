/**
 * ConsentModal — shown once on first app launch.
 * Required by GDPR, India DPDP Act, and Play Store policy.
 * Must be shown BEFORE collecting any device signals.
 */

import { MaterialIcons } from '@expo/vector-icons';
import React, { memo } from 'react';
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

type ConsentModalProps = {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
};

const DATA_POINTS = [
  { icon: 'phone-android' as const, label: 'Device model & OS version' },
  { icon: 'fingerprint' as const, label: 'Device identifier (for fraud prevention)' },
  { icon: 'language' as const, label: 'Region, language & timezone' },
  { icon: 'local-offer' as const, label: 'First-time offer eligibility check' },
  { icon: 'notifications' as const, label: 'Push notification token (for offers & updates)' },
];

export const ConsentModal = memo(function ConsentModal({
  visible,
  onAccept,
  onDecline,
}: ConsentModalProps) {
  const surface = useThemeColor({}, 'surface');
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onDecline}
    >
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: surface, paddingBottom: insets.bottom + Spacing.lg }]}>
          <View style={styles.handle} />

          {/* Icon */}
          <View style={styles.iconWrap}>
            <MaterialIcons name="security" size={36} color="#E8445A" />
          </View>

          <ThemedText style={styles.title}>Your Privacy Matters</ThemedText>
          <ThemedText style={styles.subtitle}>
            To personalise your experience and verify first-time offers, we collect the following information from your device:
          </ThemedText>

          {/* Data points */}
          <View style={styles.list}>
            {DATA_POINTS.map((item) => (
              <View key={item.label} style={styles.listRow}>
                <MaterialIcons name={item.icon} size={18} color="#E8445A" />
                <ThemedText style={styles.listText}>{item.label}</ThemedText>
              </View>
            ))}
          </View>

          <ThemedText style={styles.note}>
            We never sell your data. Device info is stored securely and used only to prevent fraud and personalise offers. You can request deletion anytime.
          </ThemedText>

          {/* Accept */}
          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={onAccept}
            activeOpacity={0.85}
          >
            <ThemedText style={styles.acceptText}>I Understand & Accept</ThemedText>
          </TouchableOpacity>

          {/* Decline */}
          <TouchableOpacity
            style={styles.declineBtn}
            onPress={onDecline}
          >
            <ThemedText style={styles.declineText}>
              No thanks, continue without personalisation
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignSelf: 'center',
    marginBottom: Spacing.sm,
  },
  iconWrap: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF0F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.65,
    textAlign: 'center',
    lineHeight: 20,
  },
  list: {
    gap: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  listText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  note: {
    fontSize: 11,
    opacity: 0.45,
    textAlign: 'center',
    lineHeight: 16,
  },
  acceptBtn: {
    backgroundColor: '#E8445A',
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    shadowColor: '#E8445A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  acceptText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  declineBtn: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  declineText: {
    fontSize: 13,
    opacity: 0.5,
  },
});
