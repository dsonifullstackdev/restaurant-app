import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Spacing } from '@/constants/theme';
import type { CartTotals } from '@/context/CartContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { formatPrice } from '@/utils/price';

type BillSummaryProps = {
  totals: CartTotals;
};

type BillRowProps = {
  label: string;
  value: string;
  bold?: boolean;
  color?: string;
  strikeValue?: string;
};

const BillRow = memo(function BillRow({
  label,
  value,
  bold,
  color,
  strikeValue,
}: BillRowProps) {
  return (
    <View style={styles.row}>
      <ThemedText style={[styles.label, bold && styles.bold]}>
        {label}
      </ThemedText>
      <View style={styles.valueRow}>
        {strikeValue && (
          <ThemedText style={styles.strikeValue}>{strikeValue}</ThemedText>
        )}
        <ThemedText
          style={[styles.value, bold && styles.bold, color ? { color } : {}]}
        >
          {value}
        </ThemedText>
      </View>
    </View>
  );
});

export const BillSummary = memo(function BillSummary({ totals }: BillSummaryProps) {
  const surface = useThemeColor({}, 'surface');
  const minor = totals.currency_minor_unit ?? 2;
  const symbol = totals.currency_symbol ?? '₹';
  console.log("ITEM-TOTALS", totals)

  const fmt = (val: string | null) =>
    val ? formatPrice(val, minor, symbol) : 'FREE';

  const hasDiscount =
    totals.total_discount && parseInt(totals.total_discount) > 0;

  return (
    <View style={[styles.container, { backgroundColor: surface }]}>
      <ThemedText style={styles.heading}>Bill Summary</ThemedText>

      <BillRow
        label="Item Total"
        value={fmt(totals.total_items)}
        strikeValue={
          hasDiscount
            ? fmt(
                String(
                  parseInt(totals.total_items) +
                    parseInt(totals.total_discount)
                )
              )
            : undefined
        }
      />

      {hasDiscount && (
        <BillRow
          label="Discount"
          value={`- ${fmt(totals.total_discount)}`}
          color="#2E7D32"
        />
      )}

      <BillRow
        label="Delivery Fee"
        value={totals.total_shipping ? fmt(totals.total_shipping) : 'FREE'}
        color={!totals.total_shipping ? '#2E7D32' : undefined}
      />

      {parseInt(totals.total_tax) > 0 && (
        <BillRow label="Taxes & Charges" value={fmt(totals.total_tax)} />
      )}

      <View style={styles.divider} />

      <BillRow
        label="To Pay"
        value={fmt(totals.total_price)}
        bold
        color="#E8445A"
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.xs,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  heading: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  label: {
    fontSize: 14,
    opacity: 0.65,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
  strikeValue: {
    fontSize: 12,
    textDecorationLine: 'line-through',
    opacity: 0.4,
  },
  bold: {
    fontWeight: '700',
    fontSize: 15,
    opacity: 1,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginVertical: Spacing.sm,
  },
});
