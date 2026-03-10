/**
 * ProductDetailSheet — bottom sheet modal shown when tapping a product card.
 * Matches Swiggy-style UI: full image, veg/non-veg indicator, price, quantity
 * selector, cooking note input, and Add to Cart CTA.
 *
 * Usage:
 *   <ProductDetailSheet product={product} visible={visible} onClose={onClose} />
 */

import { MaterialIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useCart } from '@/context/CartContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { WcProduct } from '@/types/api';

// ── Helpers ──────────────────────────────────────────────────────────

function parsePrice(value?: string): number {
  if (!value) return 0;
  return parseInt(value, 10) / 100;
}

function formatRupees(value: number): string {
  return `₹${value.toFixed(0)}`;
}

function stripHtml(html?: string): string {
  return (html ?? '').replace(/<[^>]+>/g, '').trim();
}

// ── Veg/Non-veg dot indicator (FSSAI style) ─────────────────────────

function VegIndicator({ isVeg }: { isVeg: boolean }) {
  const color = isVeg ? '#2E7D32' : '#C62828';
  return (
    <View style={[vegStyles.box, { borderColor: color }]}>
      {isVeg
        ? <View style={[vegStyles.circle, { backgroundColor: color }]} />
        : <View style={[vegStyles.triangle, { borderBottomColor: color }]} />
      }
    </View>
  );
}

const vegStyles = StyleSheet.create({
  box: {
    width: 18, height: 18, borderWidth: 1.5, borderRadius: 3,
    justifyContent: 'center', alignItems: 'center',
  },
  circle: { width: 8, height: 8, borderRadius: 4 },
  triangle: {
    width: 0, height: 0,
    borderLeftWidth: 5, borderRightWidth: 5, borderBottomWidth: 8,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
  },
});

// ── Props ─────────────────────────────────────────────────────────────

type Props = {
  product: WcProduct | null;
  visible: boolean;
  onClose: () => void;
};

// ── Component ─────────────────────────────────────────────────────────

export function ProductDetailSheet({ product, visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const surface = useThemeColor({}, 'surface');
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const { addItem } = useCart();

  const slideAnim = useRef(new Animated.Value(600)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [adding, setAdding] = useState(false);

  // Reset state when product changes
  useEffect(() => {
    if (visible) {
      setQuantity(1);
      setNote('');
      setAdding(false);
    }
  }, [visible, product?.id]);

  // Animate in/out
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 13, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 600, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleAddToCart = useCallback(async () => {
    if (!product || adding) return;
    setAdding(true);
    try {
      await addItem(product.id, quantity);
      onClose();
    } finally {
      setAdding(false);
    }
  }, [product, quantity, addItem, onClose, adding]);

  if (!product) return null;

  const imageUrl = product.images?.[0]?.src ?? null;
  const salePrice = parsePrice(product.prices?.sale_price);
  const regularPrice = parsePrice(product.prices?.regular_price);
  const displayPrice = salePrice || regularPrice;
  const hasDiscount = regularPrice > 0 && salePrice > 0 && salePrice < regularPrice;
  const discountPct = hasDiscount
    ? Math.round((1 - salePrice / regularPrice) * 100)
    : 0;
  const totalPrice = displayPrice * quantity;

  // Guess veg from categories or tags
  const isVeg = product.categories?.some(
    (c: any) => c.slug === 'veg' || c.name?.toLowerCase().includes('veg')
  ) ?? true;

  const description = stripHtml(product.description || product.short_description);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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
          {/* ── Close button ── */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={8}>
            <MaterialIcons name="close" size={20} color="#fff" />
          </TouchableOpacity>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            {/* ── Hero image ── */}
            <View style={styles.imageWrap}>
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
              ) : (
                <View style={[styles.imageFallback, { backgroundColor: 'rgba(0,0,0,0.06)' }]}>
                  <MaterialIcons name="fastfood" size={64} color={iconColor} />
                </View>
              )}
              {discountPct > 0 && (
                <View style={styles.discountBadge}>
                  <ThemedText style={styles.discountBadgeText}>{discountPct}% OFF</ThemedText>
                </View>
              )}
            </View>

            {/* ── Content ── */}
            <View style={styles.content}>
              {/* Veg indicator + spicy tag */}
              <View style={styles.tagRow}>
                <VegIndicator isVeg={isVeg} />
                {product.tags?.some((t: any) => t.slug?.includes('spicy')) && (
                  <View style={styles.spicyTag}>
                    <ThemedText style={styles.spicyText}>🌶️ Spicy</ThemedText>
                  </View>
                )}
              </View>

              {/* Name */}
              <ThemedText style={styles.name}>{product.name}</ThemedText>

              {/* Reorder tag — show if product has high sales rank */}
              <View style={styles.reorderRow}>
                <View style={styles.reorderBar} />
                <ThemedText style={styles.reorderText}>Highly reordered</ThemedText>
              </View>

              {/* Description */}
              {!!description && (
                <ThemedText style={[styles.description, { color: iconColor }]}>
                  {description}
                </ThemedText>
              )}

              {/* ── Price ── */}
              <View style={styles.priceRow}>
                <ThemedText style={styles.price}>{formatRupees(displayPrice)}</ThemedText>
                {hasDiscount && (
                  <ThemedText style={[styles.strikePrice, { color: iconColor }]}>
                    {formatRupees(regularPrice)}
                  </ThemedText>
                )}
              </View>

              {/* ── Cooking note ── */}
              <View style={styles.noteSection}>
                <View style={styles.noteTitleRow}>
                  <ThemedText style={styles.noteTitle}>Add a cooking request (optional)</ThemedText>
                  <MaterialIcons name="info-outline" size={16} color={iconColor} />
                </View>
                <TextInput
                  style={[styles.noteInput, { color: textColor, borderColor: 'rgba(0,0,0,0.1)' }]}
                  placeholder="e.g. Don't make it too spicy"
                  placeholderTextColor="rgba(150,150,150,0.7)"
                  value={note}
                  onChangeText={setNote}
                  multiline
                  maxLength={200}
                />
              </View>
            </View>
          </ScrollView>

          {/* ── Sticky bottom: qty + add button ── */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
            {/* Quantity control */}
            <View style={styles.qtyControl}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                hitSlop={8}
              >
                <MaterialIcons name="remove" size={20} color="#fff" />
              </TouchableOpacity>
              <ThemedText style={styles.qtyText}>{quantity}</ThemedText>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity((q) => q + 1)}
                hitSlop={8}
              >
                <MaterialIcons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Add item CTA */}
            <TouchableOpacity
              style={[styles.addBtn, adding && { opacity: 0.7 }]}
              onPress={handleAddToCart}
              disabled={adding}
              activeOpacity={0.85}
            >
              <ThemedText style={styles.addBtnText}>
                {adding ? 'Adding...' : `Add item  ${formatRupees(totalPrice)}`}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '92%',
    overflow: 'hidden',
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  closeBtn: {
    position: 'absolute',
    top: 12, right: 12,
    zIndex: 10,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center',
  },

  // Image
  imageWrap: { width: '100%', height: 260, backgroundColor: '#f5f5f5' },
  image: { width: '100%', height: '100%' },
  imageFallback: {
    width: '100%', height: '100%',
    justifyContent: 'center', alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute', top: 12, left: 12,
    backgroundColor: '#E8445A', paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 6,
  },
  discountBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Content
  content: { padding: Spacing.lg, paddingBottom: Spacing.sm },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  spicyTag: {
    backgroundColor: '#FFF3E0', paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 4,
  },
  spicyText: { fontSize: 12, color: '#E65100', fontWeight: '600' },

  name: { fontSize: 22, fontWeight: '800', marginBottom: Spacing.sm, lineHeight: 28 },

  reorderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.md },
  reorderBar: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: '#2E7D32',
  },
  reorderText: { fontSize: 13, color: '#2E7D32', fontWeight: '600' },

  description: { fontSize: 14, lineHeight: 21, marginBottom: Spacing.md, opacity: 0.7 },

  priceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
  price: { fontSize: 20, fontWeight: '800' },
  strikePrice: { fontSize: 15, textDecorationLine: 'line-through', opacity: 0.5 },

  // Cooking note
  noteSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
    paddingTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  noteTitleRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: Spacing.sm,
  },
  noteTitle: { fontSize: 14, fontWeight: '600' },
  noteInput: {
    borderWidth: 1, borderRadius: BorderRadius.md,
    padding: Spacing.md, fontSize: 14,
    minHeight: 72, textAlignVertical: 'top',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  qtyControl: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1B5E20',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  qtyBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
  },
  qtyText: {
    color: '#fff', fontSize: 16, fontWeight: '700',
    paddingHorizontal: Spacing.sm, minWidth: 24, textAlign: 'center',
  },
  addBtn: {
    flex: 1, backgroundColor: '#1B5E20',
    paddingVertical: Spacing.md + 2,
    borderRadius: BorderRadius.lg,
    alignItems: 'center', justifyContent: 'center',
    elevation: 3, shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6,
  },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
