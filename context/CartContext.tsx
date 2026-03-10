import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  addToCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from '@/api/services/cart.service';

// cartEventBus lives in its own file to avoid circular deps
import { cartEventBus } from '@/api/cart-event-bus';
export { cartEventBus };

// ── Types ────────────────────────────────────────────────────────────

export type CartItemImage = {
  id: number;
  src: string;
  thumbnail: string;
};

export type CartItemPrices = {
  price: string;
  regular_price: string;
  sale_price: string;
  currency_symbol: string;
  currency_minor_unit: number;
};

export type CartItemTotals = {
  line_subtotal: string;
  line_total: string;
  currency_symbol: string;
  currency_minor_unit: number;
};

export type CartItem = {
  key: string;
  id: number;
  name: string;
  short_description: string;
  quantity: number;
  images: CartItemImage[];
  prices: CartItemPrices;
  totals: CartItemTotals;
};

export type CartTotals = {
  total_items: string;
  total_discount: string;
  total_shipping: string | null;
  total_price: string;
  total_tax: string;
  currency_symbol: string;
  currency_minor_unit: number;
};

// ── Context type ─────────────────────────────────────────────────────

type CartContextType = {
  items: CartItem[];
  totals: CartTotals | null;
  totalItems: number;
  loading: boolean;           // true only on initial load
  loadingKeys: Set<string>;   // keys of items currently being updated
  paymentMethods: string[];   // e.g. ["cod", "razorpay"] from cart response
  addItem: (productId: number, quantity?: number) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  updateItem: (key: string, quantity: number) => Promise<void>;
  refreshCart: () => Promise<void>;
};

const CartContext = createContext<CartContextType | null>(null);

// ── Provider ─────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [totals, setTotals] = useState<CartTotals | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);  // initial load only
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set());
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);

  // ── Helpers for per-item loading state ───────────────────────────
  const addLoadingKey = useCallback((key: string) => {
    setLoadingKeys((prev) => new Set(prev).add(key));
  }, []);

  const removeLoadingKey = useCallback((key: string) => {
    setLoadingKeys((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  // ── Refresh from server ──────────────────────────────────────────
  const refreshCart = useCallback(async () => {
    try {
      const data = await getCart();
      const cartItems = data?.items ?? [];
      setItems(cartItems);
      setTotals(data?.totals ?? null);
      setTotalItems(cartItems.reduce((sum: number, i: CartItem) => sum + i.quantity, 0));
      setPaymentMethods(data?.payment_methods ?? []);
    } catch (err) {
      console.log('Cart refresh error:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    setLoading(true);
    refreshCart().finally(() => setLoading(false));
  }, []);

  // Global event bus subscription
  useEffect(() => {
    const unsub = cartEventBus.subscribe(refreshCart);
    return unsub;
  }, [refreshCart]);

  // ── Add item ─────────────────────────────────────────────────────
  const addItem = useCallback(async (productId: number, quantity = 1) => {
    // Use product id as temp key for loading state
    const tempKey = `add-${productId}`;
    addLoadingKey(tempKey);
    try {
      await addToCart(productId, quantity);
      await refreshCart();
    } finally {
      removeLoadingKey(tempKey);
    }
  }, [refreshCart, addLoadingKey, removeLoadingKey]);

  // ── Remove item — optimistic: remove from UI immediately ─────────
  const removeItem = useCallback(async (key: string) => {
    // Optimistically remove from local state right away
    setItems((prev) => {
      const next = prev.filter((i) => i.key !== key);
      setTotalItems(next.reduce((sum, i) => sum + i.quantity, 0));
      return next;
    });
    addLoadingKey(key);
    try {
      await removeCartItem(key);
      await refreshCart(); // sync with server
    } catch {
      await refreshCart(); // revert on error
    } finally {
      removeLoadingKey(key);
    }
  }, [refreshCart, addLoadingKey, removeLoadingKey]);

  // ── Update item — optimistic: update count in UI immediately ─────
  const updateItem = useCallback(async (key: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(key);
      return;
    }
    // Optimistically update quantity in local state
    setItems((prev) => {
      const next = prev.map((i) => i.key === key ? { ...i, quantity } : i);
      setTotalItems(next.reduce((sum, i) => sum + i.quantity, 0));
      return next;
    });
    addLoadingKey(key);
    try {
      await updateCartItem(key, quantity);
      await refreshCart(); // sync totals/prices with server
    } catch {
      await refreshCart(); // revert on error
    } finally {
      removeLoadingKey(key);
    }
  }, [refreshCart, removeItem, addLoadingKey, removeLoadingKey]);

  return (
    <CartContext.Provider
      value={{
        items,
        totals,
        totalItems,
        loading,
        loadingKeys,
        paymentMethods,
        addItem,
        removeItem,
        updateItem,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
