import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Header } from '@/components/common/Header';
import { SearchBar } from '@/components/common/SearchBar';
import { CategoryMenu } from '@/components/home/CategoryMenu';
import { PromoBanner } from '@/components/home/PromoBanner';
import { ProductCard } from '@/components/product/ProductCard';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useCategories } from '@/hooks/useCategories';
import { useProducts } from '@/hooks/useProducts';
import { t } from '@/i18n';

export default function HomeScreen() {
  const background = useThemeColor({}, 'background');
  const text = useThemeColor({}, 'text');
  const primary = useThemeColor({}, 'primary');

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchInputValue, setSearchInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { categories, error: categoriesError, refetch: refetchCategories } = useCategories();
  const { products, loading: productsLoading, error: productsError, refetch: refetchProducts } =
    useProducts({
      categoryId: selectedCategoryId,
      searchQuery,
    });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchCategories(), refetchProducts()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchCategories, refetchProducts]);

  const handleSearchSubmit = useCallback(() => {
    setSearchQuery(searchInputValue.trim());
  }, [searchInputValue]);

  const handleSelectCategory = useCallback((categoryId: number | null) => {
    setSelectedCategoryId(categoryId);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: background }]} edges={['top']}>
      <Header />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={primary} />
        }
      >
        <SearchBar
          value={searchInputValue}
          onChangeText={setSearchInputValue}
          onSubmit={handleSearchSubmit}
        />
        <PromoBanner />
        {categoriesError ? (
          <ThemedText style={[styles.error, { color: text }]}>
            {categoriesError.message}
          </ThemedText>
        ) : (
          <CategoryMenu
            categories={categories}
            selectedId={selectedCategoryId}
            onSelectCategory={handleSelectCategory}
          />
        )}
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            {t('home.popularNearYou')}
          </ThemedText>
          {productsError ? (
            <ThemedText style={[styles.error, { color: text }]}>
              {productsError.message}
            </ThemedText>
          ) : productsLoading ? (
            <ActivityIndicator size="large" style={styles.loader} />
          ) : products.length === 0 ? (
            <ThemedText style={[styles.empty, { color: text }]}>
              {t('products.empty')}
            </ThemedText>
          ) : (
            products.map((product) => (
              <ProductCard key={product.id} product={product} onPress={() => {}} />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },
  section: {
    paddingTop: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 18,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  loader: {
    marginVertical: Spacing.xxl,
  },
  error: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  empty: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
});
