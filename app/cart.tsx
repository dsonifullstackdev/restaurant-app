import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef } from 'react';
import {
  BackHandler,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BillSummary } from '@/components/cart/BillSummary';
import { CartItemRow } from '@/components/cart/CartItemRow';
import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useCart } from '@/context/CartContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { formatPrice } from '@/utils/price';

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const background = useThemeColor({}, 'background');
  const surface = useThemeColor({}, 'surface');
  const text = useThemeColor({}, 'text');
  const icon = useThemeColor({}, 'icon');

  // loadingKeys = which item keys are currently being updated
  const { items, totals, totalItems, loadingKeys, updateItem } = useCart();
  // ↑ removed: loading, refreshCart
  // ↑ removed: useEffect(() => { refreshCart() }, []) ← this caused full-screen reload

  // ── Auto-go home when last item removed ─────────────────────────
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (items.length === 0) {
      router.replace('/(tabs)');
    }
  }, [items.length]);

  const handleIncrease = useCallback(
    async (key: string) => {
      const item = items.find((i) => i.key === key);
      if (item) await updateItem(key, item.quantity + 1);
    },
    [items, updateItem]
  );

  const handleDecrease = useCallback(
    async (key: string) => {
      const item = items.find((i) => i.key === key);
      if (!item) return;
      await updateItem(key, item.quantity - 1); // 0 = remove, handled in context
    },
    [items, updateItem]
  );

  // ── Back → go to home, not trigger exit dialog ──────────────────
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        router.replace('/(tabs)');
        return true;
      });
      return () => sub.remove();
    }, [router])
  );

  const handlePlaceOrder = useCallback(() => {
    router.push('/checkout');
  }, [router]);

  // ── Empty state ────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <View style={[styles.root, { backgroundColor: background }]}>
        <View style={[styles.header, { backgroundColor: surface, paddingTop: insets.top + Spacing.sm }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/(tabs)')} hitSlop={8}>
            <MaterialIcons name="arrow-back" size={22} color={icon} />
          </TouchableOpacity>
          <ThemedText style={styles.headerText}>Your Cart</ThemedText>
          <View style={styles.backBtn} />
        </View>
        <View style={[styles.centered, { backgroundColor: background }]}>
          <MaterialIcons name="shopping-cart" size={72} color={icon} style={{ opacity: 0.3 }} />
          <ThemedText style={styles.emptyTitle}>Your cart is empty</ThemedText>
          <ThemedText style={styles.emptySubtitle}>Add items to get started</ThemedText>
          <TouchableOpacity style={styles.browseBtn} onPress={() => router.replace('/(tabs)')}>
            <ThemedText style={styles.browseBtnText}>Browse Menu</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const minor = totals?.currency_minor_unit ?? 2;
  const symbol = totals?.currency_symbol ?? '₹';

  return (
    <View style={[styles.root, { backgroundColor: background }]}>

      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: surface, paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/(tabs)')} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={22} color={icon} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <ThemedText style={styles.headerText}>Your Cart</ThemedText>
          <ThemedText style={styles.headerCount}>
            {totalItems} {totalItems === 1 ? 'item' : 'items'}
          </ThemedText>
        </View>
        <TouchableOpacity style={styles.addMoreBtn} onPress={() => router.replace('/(tabs)')}>
          <MaterialIcons name="add" size={16} color="#E8445A" />
          <ThemedText style={styles.addMore}>Add more</ThemedText>
        </TouchableOpacity>
      </View>

      {/* ── ScrollView always visible — never replaced by spinner ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        <View style={[styles.section, { backgroundColor: surface }]}>
          {items.map((item, index) => (
            <View key={item.key}>
              <CartItemRow
                item={item}
                onIncrease={handleIncrease}
                onDecrease={handleDecrease}
                isUpdating={loadingKeys.has(item.key)}
              />
              {index < items.length - 1 && <View style={styles.divider} />}
            </View>
          ))}

          <View style={[styles.noteRow, { borderTopColor: 'rgba(0,0,0,0.06)' }]}>
            <MaterialIcons name="edit-note" size={18} color={icon} />
            <TextInput
              style={[styles.noteInput, { color: text }]}
              placeholder="Add a note for the restaurant"
              placeholderTextColor={icon}
            />
          </View>
        </View>

        <View style={styles.spacer} />
        {totals && <BillSummary totals={totals} />}
      </ScrollView>

      {/* ── Place Order Footer ── */}
      {totals && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md, backgroundColor: surface }]}>
          <View style={styles.footerLeft}>
            <ThemedText style={styles.footerTotal}>
              {formatPrice(totals.total_price, minor, symbol)}
            </ThemedText>
            <ThemedText style={styles.footerLabel}>TOTAL</ThemedText>
          </View>
          <TouchableOpacity style={styles.placeOrderBtn} onPress={handlePlaceOrder} activeOpacity={0.85}>
            <ThemedText style={styles.placeOrderText}>Place Order</ThemedText>
            <MaterialIcons name="chevron-right" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1 },
  centered: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    gap: Spacing.md, padding: Spacing.xl,
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
    gap: Spacing.md, elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 4,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.06)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { flex: 1, alignItems: 'center' },
  headerText: { fontSize: 17, fontWeight: '700' },
  headerCount: { fontSize: 12, opacity: 0.45, marginTop: 1 },
  addMoreBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  addMore: { fontSize: 13, fontWeight: '600', color: '#E8445A' },
  section: {
    borderRadius: BorderRadius.xl, marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg, overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.06)', marginHorizontal: Spacing.lg },
  noteRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.md, borderTopWidth: 1, gap: Spacing.sm,
  },
  noteInput: { flex: 1, fontSize: 13 },
  spacer: { height: Spacing.lg },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md,
    elevation: 10, shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.08, shadowRadius: 8,
  },
  footerLeft: { flex: 1 },
  footerTotal: { fontSize: 18, fontWeight: '800' },
  footerLabel: { fontSize: 11, opacity: 0.5, letterSpacing: 0.5 },
  placeOrderBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8445A',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl, gap: Spacing.xs, elevation: 6,
    shadowColor: '#E8445A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8,
  },
  placeOrderText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700' },
  emptySubtitle: { fontSize: 14, opacity: 0.6 },
  browseBtn: {
    backgroundColor: '#E8445A', paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md, borderRadius: BorderRadius.xl, marginTop: Spacing.sm,
  },
  browseBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
