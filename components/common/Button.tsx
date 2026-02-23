import React from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'outline';
  style?: ViewStyle;
};

export function Button({ title, onPress, variant = 'primary', style }: ButtonProps) {
  const primary = useThemeColor({}, 'primary');
  const primaryDark = useThemeColor({}, 'primaryDark');

  const bg = variant === 'primary' ? primary : 'transparent';
  const textColor = variant === 'primary' ? '#fff' : primary;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg, opacity: pressed ? 0.9 : 1 },
        variant === 'outline' && { borderWidth: 1, borderColor: primary },
        style,
      ]}
    >
      <ThemedText style={[styles.text, { color: textColor }]} type="defaultSemiBold">
        {title}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 14,
  },
});
