/**
 * ExitAppDialog — shown when user presses back on home screen.
 * Clean animated bottom sheet style popup.
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

type Props = {
  visible: boolean;
  onClose: () => void;   // "Stay" / cancel
  onExit: () => void;    // "Close app"
};

export function ExitAppDialog({ visible, onClose, onExit }: Props) {
  const surface = useThemeColor({}, 'surface');
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 300, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
      </TouchableWithoutFeedback>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          { backgroundColor: surface, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Handle bar */}
        <View style={styles.handle} />

        {/* Icon */}
        <ThemedText style={styles.emoji}>👋</ThemedText>

        {/* Text */}
        <ThemedText style={styles.title}>Leaving so soon?</ThemedText>
        <ThemedText style={styles.subtitle}>
          Your cart and favourites are waiting for you. Are you sure you want to close the app?
        </ThemedText>

        {/* Buttons */}
        <TouchableOpacity style={styles.exitBtn} onPress={onExit} activeOpacity={0.85}>
          <ThemedText style={styles.exitBtnText}>Close App</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.stayBtn} onPress={onClose} activeOpacity={0.85}>
          <ThemedText style={styles.stayBtnText}>Stay Here</ThemedText>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl ?? 48,
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.12)', marginBottom: Spacing.lg,
  },
  emoji: { fontSize: 48, marginBottom: Spacing.md },
  title: { fontSize: 22, fontWeight: '800', marginBottom: Spacing.sm, textAlign: 'center' },
  subtitle: {
    fontSize: 14, opacity: 0.55, textAlign: 'center',
    lineHeight: 22, marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  exitBtn: {
    width: '100%', backgroundColor: '#E8445A',
    paddingVertical: Spacing.md + 2, borderRadius: BorderRadius.xl,
    alignItems: 'center', marginBottom: Spacing.md,
    elevation: 4, shadowColor: '#E8445A',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  exitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  stayBtn: {
    width: '100%', borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.12)',
    paddingVertical: Spacing.md + 2, borderRadius: BorderRadius.xl, alignItems: 'center',
  },
  stayBtnText: { fontSize: 16, fontWeight: '600' },
});
