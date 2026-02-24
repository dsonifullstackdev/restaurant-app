import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  type NativeSyntheticEvent,
  type TextInputSubmitEditingEventData,
} from 'react-native';

import { fetchProducts } from '@/api/services/product.service';
import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { t } from '@/i18n';

type SearchBarProps = {
  value?: string;
  onChangeText?: (text: string) => void;
  onSubmit?: (text: string) => void;
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
  const textColor = useThemeColor({}, 'text');

  const displayPlaceholder = placeholder ?? t('home.searchPlaceholder');

  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  // 🔥 Autocomplete Logic
  useEffect(() => {
    if (query.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const products = await fetchProducts({
          search: query.trim(),
          per_page: 5,
        });

        setSuggestions(products);
      } catch (err) {
        console.log('Autocomplete error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleChange = (text: string) => {
    setQuery(text);
    onChangeText?.(text);
  };

  const handleSubmit = (
    e?: NativeSyntheticEvent<TextInputSubmitEditingEventData>
  ) => {
    e?.preventDefault();
    setSuggestions([]);
    onSubmit?.(query);
  };

  const handleSelect = (item: any) => {
    setQuery(item.name);
    setSuggestions([]);
    onSubmit?.(item.name);
  };

  return (
    <View style={{ marginHorizontal: Spacing.lg }}>
      <View style={[styles.container, { backgroundColor: surface }]}>
        <MaterialIcons
          name="search"
          size={22}
          color={icon}
          style={styles.icon}
        />
        <TextInput
          style={[styles.input, { color: textColor }]}
          placeholder={displayPlaceholder}
          placeholderTextColor={icon}
          value={query}
          onChangeText={handleChange}
          onSubmitEditing={handleSubmit}
          returnKeyType="search"
        />
      </View>

      {/* 🔥 Suggestions Dropdown */}
      {suggestions.length > 0 && (
        <View style={[styles.dropdown, { backgroundColor: surface }]}>
          <FlatList
            keyboardShouldPersistTaps="handled"
            data={suggestions}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => handleSelect(item)}
              >
                <ThemedText numberOfLines={1}>{item.name}</ThemedText>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
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
  dropdown: {
    marginTop: 4,
    borderRadius: BorderRadius.lg,
    maxHeight: 250,
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
  },
});
