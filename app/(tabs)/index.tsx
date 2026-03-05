import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Header } from '@/components/common/Header';
import { SearchBar } from '@/components/common/SearchBar';
import { ExitAppDialog } from '@/components/ExitAppDialog';
import { CategoryMenu } from '@/components/home/CategoryMenu';
import { PromoBanner } from '@/components/home/PromoBanner';
import { ProductCard } from '@/components/product/ProductCard';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useBanners } from '@/hooks/use-banners';
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
  const [showExitDialog, setShowExitDialog] = useState(false);

  const { banners, refetch: refetchBanners } = useBanners();
  const { categories, error: categoriesError, refetch: refetchCategories } = useCategories();
  const { products, loading: productsLoading, error: productsError, refetch: refetchProducts } = useProducts({
    categoryId: selectedCategoryId,
    searchQuery,
  });

  // ── Block hardware back ONLY when home is focused ────────────────
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        setShowExitDialog(true);
        return true;
      });
      return () => sub.remove();
    }, [])
  );

  const handleExitConfirm = useCallback(() => {
    BackHandler.exitApp();
  }, []);

  const handleExitCancel = useCallback(() => {
    setShowExitDialog(false);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchCategories(), refetchProducts(), refetchBanners()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchCategories, refetchProducts, refetchBanners]);

  const handleSearchSubmit = useCallback((text: string) => {
    setSearchInputValue(text);
    setSearchQuery(text.trim());
  }, []);

  const handleSelectCategory = useCallback((categoryId: number | null) => {
    setSelectedCategoryId(categoryId);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: background }]} edges={['top']}>
      <Header />

      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={primary} />
        }
        ListHeaderComponent={
          <>
            <SearchBar
              value={searchInputValue}
              onChangeText={setSearchInputValue}
              onSubmit={handleSearchSubmit}
            />
            <PromoBanner banners={banners} />
            {categoriesError ? (
              <ThemedText style={[styles.error, { color: text }]}>{categoriesError.message}</ThemedText>
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
            </View>
          </>
        }
        renderItem={({ item }) => <ProductCard product={item} onPress={() => {}} />}
        ListEmptyComponent={
          productsLoading ? (
            <ActivityIndicator size="large" style={styles.loader} />
          ) : productsError ? (
            <ThemedText style={[styles.error, { color: text }]}>{productsError.message}</ThemedText>
          ) : (
            <ThemedText style={[styles.empty, { color: text }]}>{t('products.empty')}</ThemedText>
          )
        }
        contentContainerStyle={{ paddingBottom: Spacing.xxxl }}
      />

      <ExitAppDialog
        visible={showExitDialog}
        onClose={handleExitCancel}
        onExit={handleExitConfirm}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: { paddingTop: Spacing.xs },
  sectionTitle: { fontSize: 18, marginHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  loader: { marginVertical: Spacing.xxl },
  error: { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  empty: { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg },
});
