import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { CheckoutData, ShippingPackage } from '@/api/services/checkout.service';
import {
  getCheckout,
  getCheckoutTotals,
  getPaymentMethods,
  getShippingPackages,
  placeOrder,
  updateCheckout,
} from '@/api/services/checkout.service';
import { getStoredDeviceData } from '@/api/services/device.service';
import { getProfile } from '@/api/services/onboarding.service';
import { BillSummary } from '@/components/cart/BillSummary';
import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useThemeColor } from '@/hooks/use-theme-color';

import { formatPrice } from '@/utils/price';

const PREFS_KEY = '@user_food_prefs';

// Human-readable labels for payment method IDs from cart API
const PAYMENT_LABELS: Record<string, string> = {
  cod: 'Cash on Delivery',
  razorpay: 'Razorpay (UPI / Card)',
  stripe: 'Stripe',
  paypal: 'PayPal',
};

// Short descriptions
const PAYMENT_DESCS: Record<string, string> = {
  cod: 'Pay when your order arrives',
  razorpay: 'UPI, Cards, Net Banking & Wallets',
  stripe: 'Pay securely with card',
  paypal: 'Pay via PayPal',
};

const PAYMENT_ICONS: Record<string, React.ComponentProps<typeof MaterialIcons>['name']> = {
  cod: 'payments',
  razorpay: 'credit-card',
  stripe: 'credit-card',
  paypal: 'account-balance-wallet',
  default: 'payment',
};

type SavedAddress = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
};

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const background = useThemeColor({}, 'background');
  const surface = useThemeColor({}, 'surface');
  const text = useThemeColor({}, 'text');
  const icon = useThemeColor({}, 'icon');
  const border = useThemeColor({}, 'border');

  const { user } = useAuth();
  const { items, totals, totalItems, refreshCart, paymentMethods } = useCart();
  const cartPaymentMethods = (checkoutData?.payment_methods as string[] | undefined) ?? paymentMethods ?? [];

  const [address, setAddress] = useState<SavedAddress | null>(null);
  const [addressLoading, setAddressLoading] = useState(true);
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(true);
  const [shippingPackages, setShippingPackages] = useState<ShippingPackage[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Load address — server first, AsyncStorage fallback ───────────
  useEffect(() => {
    const load = async () => {
      setAddressLoading(true);
      try {
        const [savedRaw, serverProfile] = await Promise.all([
          AsyncStorage.getItem(PREFS_KEY),
          user?.token
            ? getStoredDeviceData()
                .then(({ recordId }) => getProfile(user.token, recordId ?? ''))
                .catch(() => null)
            : Promise.resolve(null),
        ]);

        const local = savedRaw ? JSON.parse(savedRaw) : {};
        const sp = serverProfile?.profile ?? {};
        const su = serverProfile?.user ?? {};

        const fullName =
          (su.first_name ? `${su.first_name} ${su.last_name ?? ''}`.trim() : '') ||
          local.name ||
          (user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : '');

        setAddress({
          name: fullName,
          email: su.email || local.email || user?.email || '',
          phone: su.phone || user?.phone || '',
          address: sp.address || local.address || '',
          city: sp.city || local.city || '',
          postal_code: sp.postal_code || local.postal_code || '',
        });
      } catch (e) {
        console.log('[Checkout] Address load error:', e);
      } finally {
        setAddressLoading(false);
      }
    };
    load();
  }, [user]);

  // ── GET /checkout on mount ───────────────────────────────────────
  useEffect(() => {
    setCheckoutLoading(true);
    getCheckout()
      .then((data) => {
        setCheckoutData(data);
        if (data.payment_method) setSelectedMethod(data.payment_method);
        // Payment methods available even from GET (via __experimentalCart)
        const methods = getPaymentMethods(data);
        if (methods.length > 0 && !selectedMethod) setSelectedMethod(methods[0]);
      })
      .catch((e) => console.log('[Checkout] GET error:', e))
      .finally(() => setCheckoutLoading(false));
  }, []);

  // ── PUT /checkout when address is ready — get shipping + totals ──
  useEffect(() => {
    if (!address?.address || addressLoading) return;
    const nameParts = (address.name || '').split(' ');
    const billing = {
      first_name: nameParts[0] ?? '',
      last_name: nameParts.slice(1).join(' '),
      company: '',
      address_1: address.address,
      address_2: '',
      city: address.city,
      state: '',
      postcode: address.postal_code,
      country: 'IN',
      email: address.email,
      phone: address.phone,
    };
    const shipping = { ...billing };
    delete (shipping as any).email;

    updateCheckout({ billing_address: billing, shipping_address: shipping })
      .then((data) => {
        setCheckoutData(data);
        const pkgs = getShippingPackages(data);
        setShippingPackages(pkgs);
        // Auto-select pre-selected shipping rate
        for (const pkg of pkgs) {
          const sel = pkg.shipping_rates?.find((r) => r.selected);
          if (sel) { setSelectedShipping(sel.rate_id); break; }
        }
        // Update payment methods from live response
        const methods = getPaymentMethods(data);
        if (methods.length > 0) setSelectedMethod((prev) => prev || methods[0]);
      })
      .catch((e) => console.log('[Checkout] PUT error:', e));
  }, [address, addressLoading]);

  // ── Place order ──────────────────────────────────────────────────
  const handlePlaceOrder = useCallback(async () => {
    setError(null);
    if (!address?.address?.trim()) {
      setError('Please add your delivery address before placing order.');
      return;
    }
    if (!selectedMethod) {
      setError('Please select a payment method.');
      return;
    }
    setPlacingOrder(true);
    try {
      const nameParts = (address.name || '').split(' ');
      const firstName = nameParts[0] ?? '';
      const lastName = nameParts.slice(1).join(' ');

      const response = await placeOrder({
        billing_address: {
          first_name: firstName,
          last_name: lastName,
          company: '',
          address_1: address.address,
          address_2: '',
          city: address.city,
          state: '',
          postcode: address.postal_code,
          country: 'IN',
          email: address.email,
          phone: address.phone,
        },
        shipping_address: {
          first_name: firstName,
          last_name: lastName,
          company: '',
          address_1: address.address,
          address_2: '',
          city: address.city,
          state: '',
          postcode: address.postal_code,
          country: 'IN',
          phone: address.phone,
        },
        payment_method: selectedMethod,
        customer_note: customerNote,
      });
      await refreshCart();
      router.replace({
        pathname: '/order-success',
        params: { orderId: response.order_id.toString() },
      });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to place order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  }, [address, selectedMethod, customerNote, router, refreshCart]);

  const liveTotals = checkoutData ? getCheckoutTotals(checkoutData) : null;
  const minor = liveTotals?.currency_minor_unit ?? 2;
  const symbol = liveTotals?.currency_symbol ?? '₹';

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: surface, paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={22} color={icon} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <ThemedText style={styles.headerText}>Checkout</ThemedText>
          <ThemedText style={styles.headerCount}>
            {totalItems} {totalItems === 1 ? 'item' : 'items'}
          </ThemedText>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
      >
        {/* ── Delivery Address — READ ONLY ── */}
        <SectionHeader title="Delivery Address" icon="location-on" />
        <View style={[styles.section, { backgroundColor: surface }]}>
          {addressLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#E8445A" />
              <ThemedText style={styles.loadingText}>Loading address...</ThemedText>
            </View>
          ) : !address?.address ? (
            /* No address */
            <View style={styles.noAddressWrap}>
              <MaterialIcons name="location-off" size={40} color={icon} style={{ opacity: 0.25 }} />
              <ThemedText style={styles.noAddressTitle}>No address saved</ThemedText>
              <ThemedText style={styles.noAddressSubtitle}>
                Add your delivery address in profile to continue
              </ThemedText>
            </View>
          ) : (
            /* Address card */
            <View style={styles.addressCard}>
              <View style={styles.addressIconWrap}>
                <MaterialIcons name="home" size={22} color="#E8445A" />
              </View>
              <View style={styles.addressInfo}>
                {!!address.name && (
                  <ThemedText style={styles.addressName}>{address.name}</ThemedText>
                )}
                {!!address.phone && (
                  <ThemedText style={[styles.addressMeta, { color: icon }]}>
                    📞 {address.phone}
                  </ThemedText>
                )}
                <ThemedText style={[styles.addressText, { color: text }]}>
                  {[address.address, address.city, address.postal_code]
                    .filter(Boolean).join(', ')}
                </ThemedText>
              </View>
            </View>
          )}

          {/* Change / Add address button */}
          {!addressLoading && (
            <TouchableOpacity
              style={[styles.changeBtn, { borderTopColor: 'rgba(0,0,0,0.06)' }]}
              onPress={() => router.push('/(tabs)/profile')}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name={address?.address ? 'edit-location-alt' : 'add-location-alt'}
                size={16}
                color="#E8445A"
              />
              <ThemedText style={styles.changeBtnText}>
                {address?.address ? 'Change Address' : 'Add Address'}
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Order Items (from __experimentalCart) ── */}
        {(checkoutData?.__experimentalCart?.items?.length ?? 0) > 0 && (
          <>
            <SectionHeader title="Your Order" icon="receipt-long" />
            <View style={[styles.section, { backgroundColor: surface }]}>
              {checkoutData!.__experimentalCart!.items.map((item: any, index: number) => {
                const price = parseInt(item.totals?.line_total ?? '0', 10) /
                  Math.pow(10, item.totals?.currency_minor_unit ?? 2);
                const isLast = index === checkoutData!.__experimentalCart!.items.length - 1;
                return (
                  <View
                    key={item.key}
                    style={[styles.orderItem, !isLast && styles.paymentDivider]}
                  >
                    <ThemedText style={styles.orderItemQty}>{item.quantity}×</ThemedText>
                    <ThemedText style={[styles.orderItemName, { color: text }]} numberOfLines={1}>
                      {item.name}
                    </ThemedText>
                    <ThemedText style={styles.orderItemPrice}>
                      {item.totals?.currency_symbol ?? '₹'}{price.toFixed(0)}
                    </ThemedText>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* ── Shipping Method ── */}
        {shippingPackages.length > 0 && (
          <>
            <SectionHeader title="Delivery Method" icon="local-shipping" />
            <View style={[styles.section, { backgroundColor: surface }]}>
              {shippingPackages.map((pkg) =>
                (pkg.shipping_rates ?? []).map((rate, index) => {
                  const isSelected = selectedShipping === rate.rate_id;
                  const price = parseInt(rate.price, 10) / Math.pow(10, rate.currency_minor_unit);
                  const isFree = price === 0;
                  return (
                    <TouchableOpacity
                      key={rate.rate_id}
                      style={[
                        styles.paymentRow,
                        index < pkg.shipping_rates.length - 1 && styles.paymentDivider,
                        isSelected && styles.paymentRowSelected,
                      ]}
                      onPress={() => setSelectedShipping(rate.rate_id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.paymentIcon, { backgroundColor: isSelected ? '#FFF0F3' : '#f5f5f5' }]}>
                        <MaterialIcons name="delivery-dining" size={22} color={isSelected ? '#E8445A' : icon} />
                      </View>
                      <View style={styles.paymentInfo}>
                        <ThemedText style={[styles.paymentTitle, isSelected && { color: '#E8445A' }]}>
                          {rate.name}
                        </ThemedText>
                        {!!rate.description && (
                          <ThemedText style={styles.paymentDesc}>{rate.description}</ThemedText>
                        )}
                        {!!rate.delivery_time && (
                          <ThemedText style={styles.paymentDesc}>🕐 {rate.delivery_time}</ThemedText>
                        )}
                      </View>
                      <ThemedText style={[styles.shippingPrice, isSelected && { color: '#E8445A' }]}>
                        {isFree ? 'FREE' : `${rate.currency_symbol}${price.toFixed(0)}`}
                      </ThemedText>
                      <View style={[styles.radio, { borderColor: isSelected ? '#E8445A' : border }]}>
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </>
        )}

        {/* ── Payment Methods ── */}
        <SectionHeader title="Payment Method" icon="payment" />
        <View style={[styles.section, { backgroundColor: surface }]}>
          {(checkoutData ? getPaymentMethods(checkoutData) : []).length === 0 ? (
            <View style={styles.loadingRow}>
              <MaterialIcons name="error-outline" size={20} color={icon} />
              <ThemedText style={styles.loadingText}>No payment methods available</ThemedText>
            </View>
          ) : (
            (checkoutData ? getPaymentMethods(checkoutData) : ['cod']).map((methodId, index) => {
              const allMethods = checkoutData ? getPaymentMethods(checkoutData) : ['cod'];
              const isSelected = selectedMethod === methodId;
              const iconName = PAYMENT_ICONS[methodId] ?? PAYMENT_ICONS.default;
              const label = PAYMENT_LABELS[methodId] ?? methodId.toUpperCase();
              const desc = PAYMENT_DESCS[methodId] ?? null;
              return (
                <TouchableOpacity
                  key={methodId}
                  style={[
                    styles.paymentRow,
                    index < allMethods.length - 1 && styles.paymentDivider,
                    isSelected && styles.paymentRowSelected,
                  ]}
                  onPress={() => setSelectedMethod(methodId)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.paymentIcon, { backgroundColor: isSelected ? '#FFF0F3' : '#f5f5f5' }]}>
                    <MaterialIcons name={iconName} size={22} color={isSelected ? '#E8445A' : icon} />
                  </View>
                  <View style={styles.paymentInfo}>
                    <ThemedText style={[styles.paymentTitle, isSelected && { color: '#E8445A' }]}>
                      {label}
                    </ThemedText>
                    {!!desc && (
                      <ThemedText style={styles.paymentDesc} numberOfLines={1}>
                        {desc}
                      </ThemedText>
                    )}
                  </View>
                  <View style={[styles.radio, { borderColor: isSelected ? '#E8445A' : border }]}>
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* ── Order Note ── */}
        <SectionHeader title="Order Note" icon="edit-note" />
        <View style={[styles.section, { backgroundColor: surface }]}>
          <TextInput
            style={[styles.noteInput, { color: text, borderColor: border }]}
            placeholder="Any special instructions for your order..."
            placeholderTextColor={icon}
            value={customerNote}
            onChangeText={setCustomerNote}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* ── Bill Summary ── */}
        {liveTotals && (
          <>
            <SectionHeader title="Bill Summary" icon="receipt" />
            <BillSummary totals={liveTotals} />
          </>
        )}

        {/* ── Error ── */}
        {!!error && (
          <View style={styles.errorBox}>
            <MaterialIcons name="error-outline" size={16} color="#E8445A" />
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </View>
        )}
      </ScrollView>

      {/* ── Footer ── */}
      <View style={[styles.footer, { backgroundColor: surface, paddingBottom: insets.bottom + Spacing.md }]}>
        <View style={styles.footerLeft}>
          {liveTotals && (
            <>
              <ThemedText style={styles.footerTotal}>
                {formatPrice(liveTotals.total_price, minor, symbol)}
              </ThemedText>
              <ThemedText style={styles.footerLabel}>TOTAL</ThemedText>
            </>
          )}
        </View>
        <TouchableOpacity
          style={[styles.placeOrderBtn, placingOrder && { opacity: 0.7 }]}
          onPress={handlePlaceOrder}
          disabled={placingOrder}
          activeOpacity={0.85}
        >
          {placingOrder ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <ThemedText style={styles.placeOrderText}>Place Order</ThemedText>
              <MaterialIcons name="chevron-right" size={22} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function SectionHeader({
  title, icon,
}: {
  title: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
}) {
  return (
    <View style={styles.sectionHeader}>
      <MaterialIcons name={icon} size={18} color="#E8445A" />
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  headerTitle: { flex: 1 },
  headerText: { fontSize: 17, fontWeight: '700' },
  headerCount: { fontSize: 13, opacity: 0.55 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  section: { borderRadius: BorderRadius.xl, marginHorizontal: Spacing.lg, overflow: 'hidden' },

  // Address card
  addressCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    padding: Spacing.lg, gap: Spacing.md,
  },
  addressIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#FFF0F3',
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  addressInfo: { flex: 1, gap: 4 },
  addressName: { fontSize: 15, fontWeight: '700' },
  addressMeta: { fontSize: 13 },
  addressText: { fontSize: 14, lineHeight: 20, opacity: 0.75 },

  // No address
  noAddressWrap: {
    alignItems: 'center', paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg, gap: Spacing.sm,
  },
  noAddressTitle: { fontSize: 16, fontWeight: '700', marginTop: Spacing.sm },
  noAddressSubtitle: { fontSize: 13, opacity: 0.5, textAlign: 'center', lineHeight: 20 },

  // Change address
  changeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderTopWidth: 1, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  changeBtnText: { fontSize: 13, color: '#E8445A', fontWeight: '600' },

  // Loading
  loadingRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.lg,
  },
  loadingText: { fontSize: 14, opacity: 0.6 },

  // Payment
  paymentRow: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: Spacing.md,
  },
  paymentDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  shippingPrice: { fontSize: 14, fontWeight: '700', marginRight: Spacing.sm },
  orderItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.sm,
  },
  orderItemQty: { fontSize: 13, fontWeight: '700', color: '#E8445A', minWidth: 24 },
  orderItemName: { flex: 1, fontSize: 14 },
  orderItemPrice: { fontSize: 14, fontWeight: '600' },
  paymentRowSelected: { backgroundColor: 'rgba(232,68,90,0.04)' },
  paymentIcon: {
    width: 44, height: 44, borderRadius: BorderRadius.md,
    justifyContent: 'center', alignItems: 'center',
  },
  paymentInfo: { flex: 1 },
  paymentTitle: { fontSize: 15, fontWeight: '600' },
  paymentDesc: { fontSize: 12, opacity: 0.55, marginTop: 2 },
  radio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2,
    justifyContent: 'center', alignItems: 'center',
  },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E8445A' },

  // Note
  noteInput: {
    margin: Spacing.md, padding: Spacing.md, borderWidth: 1,
    borderRadius: BorderRadius.md, fontSize: 14,
    minHeight: 80, textAlignVertical: 'top',
  },

  // Error
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginHorizontal: Spacing.lg, marginTop: Spacing.sm,
    padding: Spacing.md, backgroundColor: '#FFF0F3', borderRadius: BorderRadius.md,
  },
  errorText: { flex: 1, fontSize: 13, color: '#E8445A' },

  // Footer
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
});
