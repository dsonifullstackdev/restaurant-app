import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputSubmitEditingEventData,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { t } from '@/i18n';

type SearchBarProps = {
  value?: string;
  onChangeText?: (text: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
};

export function SearchBar({
  value = '',
  onChangeText,
  onSubmit,
  placeholder,
}: SearchBarProps) {
  const icon = useThemeColor({}, 'icon');
  const surface = useThemeColor({}, 'surface');
  const text = useThemeColor({}, 'text');
  const displayPlaceholder = placeholder ?? t('home.searchPlaceholder');

  const handleSubmit = (e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
    e.preventDefault();
    onSubmit?.();
  };

  if (onChangeText !== undefined) {
    return (
      <View style={[styles.container, { backgroundColor: surface }]}>
        <MaterialIcons name="search" size={22} color={icon} style={styles.icon} />
        <TextInput
          style={[styles.input, { color: text }]}
          placeholder={displayPlaceholder}
          placeholderTextColor={icon}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={handleSubmit}
          returnKeyType="search"
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: surface }]}>
      <MaterialIcons name="search" size={22} color={icon} style={styles.icon} />
      <ThemedText style={[styles.placeholder, { color: icon }]} numberOfLines={1}>
        {displayPlaceholder}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
    minHeight: 48,
  },
  icon: {
    marginLeft: Spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: Spacing.sm,
  },
  placeholder: {
    flex: 1,
    fontSize: 14,
  },
});
