import { MaterialIcons } from '@expo/vector-icons';
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

import {
  fetchPaymentMethods,
  placeOrder,
} from '@/api/services/checkout.service';
import { BillSummary } from '@/components/cart/BillSummary';
import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useCart } from '@/context/CartContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import type {
  BillingAddress,
  CheckoutPayload,
  PaymentMethod,
} from '@/types/checkout';
import { formatPrice } from '@/utils/price';

// ── Payment method icons map ─────────────────────────────────────────
const PAYMENT_ICONS: Record<string, React.ComponentProps<typeof MaterialIcons>['name']> = {
  cod: 'payments',
  razorpay: 'credit-card',
  stripe: 'credit-card',
  paypal: 'account-balance-wallet',
  default: 'payment',
};

// ── Empty billing address ────────────────────────────────────────────
const EMPTY_BILLING: BillingAddress = {
  first_name: '',
  last_name: '',
  company: '',
  address_1: '',
  address_2: '',
  city: '',
  state: '',
  postcode: '',
  country: 'IN',
  email: '',
  phone: '',
};

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const background = useThemeColor({}, 'background');
  const surface = useThemeColor({}, 'surface');
  const text = useThemeColor({}, 'text');
  const icon = useThemeColor({}, 'icon');
  const border = useThemeColor({}, 'border');

  const { items, totals, totalItems, refreshCart } = useCart();

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [billing, setBilling] = useState<BillingAddress>(EMPTY_BILLING);
  const [customerNote, setCustomerNote] = useState('');
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Load payment methods ─────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingMethods(true);
        const methods = await fetchPaymentMethods();
        setPaymentMethods(methods);
        if (methods.length > 0) setSelectedMethod(methods[0].id);
      } catch (err) {
        console.log('Payment methods error:', err);
        setError('Failed to load payment methods.');
      } finally {
        setLoadingMethods(false);
      }
    };
    load();
  }, []);

  // ── Field updater ────────────────────────────────────────────────
  const updateBilling = useCallback(
    (field: keyof BillingAddress, value: string) => {
      setBilling((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // ── Validate ─────────────────────────────────────────────────────
  const validate = (): string | null => {
    if (!billing.first_name.trim()) return 'First name is required';
    if (!billing.last_name.trim()) return 'Last name is required';
    if (!billing.email.trim()) return 'Email is required';
    if (!billing.phone.trim()) return 'Phone is required';
    if (!billing.address_1.trim()) return 'Address is required';
    if (!billing.city.trim()) return 'City is required';
    if (!billing.postcode.trim()) return 'Postcode is required';
    if (!selectedMethod) return 'Please select a payment method';
    return null;
  };

  // ── Place order ──────────────────────────────────────────────────
  const handlePlaceOrder = useCallback(async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setPlacingOrder(true);

    const payload: CheckoutPayload = {
      billing_address: billing,
      shipping_address: {
        first_name: billing.first_name,
        last_name: billing.last_name,
        company: billing.company,
        address_1: billing.address_1,
        address_2: billing.address_2,
        city: billing.city,
        state: billing.state,
        postcode: billing.postcode,
        country: billing.country,
        phone: billing.phone,
      },
      payment_method: selectedMethod,
      customer_note: customerNote,
    };

    try {
      const response = await placeOrder(payload);
      await refreshCart();
      router.replace({
        pathname: '/order-success',
        params: { orderId: response.order_id.toString() },
      });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? 'Failed to place order. Please try again.';
      setError(msg);
      console.log('Place order error:', err);
    } finally {
      setPlacingOrder(false);
    }
  }, [billing, selectedMethod, customerNote, router, refreshCart]);

  const minor = totals?.currency_minor_unit ?? 2;
  const symbol = totals?.currency_symbol ?? '₹';

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Header ── */}
      <View
        style={[
          styles.header,
          { backgroundColor: surface, paddingTop: insets.top + Spacing.sm },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={24} color={icon} />
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
        {/* ── Delivery Address ── */}
        <SectionHeader title="Delivery Address" icon="location-on" />
        <View style={[styles.section, { backgroundColor: surface }]}>
          <InputRow
            label="First Name *"
            value={billing.first_name}
            onChangeText={(v) => updateBilling('first_name', v)}
            textColor={text}
            borderColor={border}
            placeholder="John"
          />
          <InputRow
            label="Last Name *"
            value={billing.last_name}
            onChangeText={(v) => updateBilling('last_name', v)}
            textColor={text}
            borderColor={border}
            placeholder="Doe"
          />
          <InputRow
            label="Email *"
            value={billing.email}
            onChangeText={(v) => updateBilling('email', v)}
            textColor={text}
            borderColor={border}
            placeholder="john@example.com"
            keyboardType="email-address"
          />
          <InputRow
            label="Phone *"
            value={billing.phone}
            onChangeText={(v) => updateBilling('phone', v)}
            textColor={text}
            borderColor={border}
            placeholder="+91 9876543210"
            keyboardType="phone-pad"
          />
          <InputRow
            label="Address *"
            value={billing.address_1}
            onChangeText={(v) => updateBilling('address_1', v)}
            textColor={text}
            borderColor={border}
            placeholder="Street, Building, Floor"
          />
          <InputRow
            label="City *"
            value={billing.city}
            onChangeText={(v) => updateBilling('city', v)}
            textColor={text}
            borderColor={border}
            placeholder="Jodhpur"
          />
          <InputRow
            label="State"
            value={billing.state}
            onChangeText={(v) => updateBilling('state', v)}
            textColor={text}
            borderColor={border}
            placeholder="Rajasthan"
          />
          <InputRow
            label="Postcode *"
            value={billing.postcode}
            onChangeText={(v) => updateBilling('postcode', v)}
            textColor={text}
            borderColor={border}
            placeholder="342001"
            keyboardType="number-pad"
            last
          />
        </View>

        {/* ── Payment Methods ── */}
        <SectionHeader title="Payment Method" icon="payment" />
        <View style={[styles.section, { backgroundColor: surface }]}>
          {loadingMethods ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#E8445A" />
              <ThemedText style={styles.loadingText}>
                Loading payment methods...
              </ThemedText>
            </View>
          ) : paymentMethods.length === 0 ? (
            <View style={styles.loadingRow}>
              <MaterialIcons name="error-outline" size={20} color={icon} />
              <ThemedText style={styles.loadingText}>
                No payment methods available
              </ThemedText>
            </View>
          ) : (
            paymentMethods.map((method, index) => {
              const isSelected = selectedMethod === method.id;
              const iconName =
                PAYMENT_ICONS[method.id] ?? PAYMENT_ICONS.default;
              return (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.paymentRow,
                    index < paymentMethods.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: 'rgba(0,0,0,0.06)',
                    },
                    isSelected && styles.paymentRowSelected,
                  ]}
                  onPress={() => setSelectedMethod(method.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.paymentIcon,
                      { backgroundColor: isSelected ? '#FFF0F3' : '#f5f5f5' },
                    ]}
                  >
                    <MaterialIcons
                      name={iconName}
                      size={22}
                      color={isSelected ? '#E8445A' : icon}
                    />
                  </View>

                  <View style={styles.paymentInfo}>
                    <ThemedText
                      style={[
                        styles.paymentTitle,
                        isSelected && { color: '#E8445A' },
                      ]}
                    >
                      {method.title}
                    </ThemedText>
                    {method.description ? (
                      <ThemedText style={styles.paymentDesc} numberOfLines={1}>
                        {method.description}
                      </ThemedText>
                    ) : null}
                  </View>

                  <View
                    style={[
                      styles.radio,
                      {
                        borderColor: isSelected ? '#E8445A' : border,
                      },
                    ]}
                  >
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
        {totals && (
          <>
            <SectionHeader title="Bill Summary" icon="receipt" />
            <BillSummary totals={totals} />
          </>
        )}

        {/* ── Error ── */}
        {error && (
          <View style={styles.errorBox}>
            <MaterialIcons name="error-outline" size={16} color="#E8445A" />
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </View>
        )}
      </ScrollView>

      {/* ── Place Order Footer ── */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: surface,
            paddingBottom: insets.bottom + Spacing.md,
          },
        ]}
      >
        <View style={styles.footerLeft}>
          {totals && (
            <>
              <ThemedText style={styles.footerTotal}>
                {formatPrice(totals.total_price, minor, symbol)}
              </ThemedText>
              <ThemedText style={styles.footerLabel}>TOTAL</ThemedText>
            </>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.placeOrderBtn,
            placingOrder && { opacity: 0.7 },
          ]}
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

// ── Sub-components ───────────────────────────────────────────────────

function SectionHeader({
  title,
  icon,
}: {
  title: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
}) {
  const iconColor = useThemeColor({}, 'icon');
  return (
    <View style={styles.sectionHeader}>
      <MaterialIcons name={icon} size={18} color="#E8445A" />
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
    </View>
  );
}

type InputRowProps = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'number-pad';
  textColor: string;
  borderColor: string;
  last?: boolean;
};

function InputRow({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  textColor,
  borderColor,
  last,
}: InputRowProps) {
  return (
    <View
      style={[
        styles.inputRow,
        !last && { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
      ]}
    >
      <ThemedText style={styles.inputLabel}>{label}</ThemedText>
      <TextInput
        style={[styles.textInput, { color: textColor }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(150,150,150,0.7)"
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
      />
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  headerTitle: { flex: 1 },
  headerText: { fontSize: 17, fontWeight: '700' },
  headerCount: { fontSize: 13, opacity: 0.55 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  section: {
    borderRadius: BorderRadius.xl,
    marginHorizontal: Spacing.lg,
    overflow: 'hidden',
  },
  inputRow: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  inputLabel: {
    fontSize: 11,
    opacity: 0.5,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    fontSize: 15,
    paddingVertical: Spacing.xs,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  paymentRowSelected: {
    backgroundColor: 'rgba(232,68,90,0.04)',
  },
  paymentIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentInfo: { flex: 1 },
  paymentTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  paymentDesc: {
    fontSize: 12,
    opacity: 0.55,
    marginTop: 2,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E8445A',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.lg,
  },
  loadingText: {
    fontSize: 14,
    opacity: 0.6,
  },
  noteInput: {
    margin: Spacing.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: '#FFF0F3',
    borderRadius: BorderRadius.md,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#E8445A',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  footerLeft: { flex: 1 },
  footerTotal: { fontSize: 18, fontWeight: '800' },
  footerLabel: { fontSize: 11, opacity: 0.5, letterSpacing: 0.5 },
  placeOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8445A',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    gap: Spacing.xs,
    elevation: 6,
    shadowColor: '#E8445A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  placeOrderText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
