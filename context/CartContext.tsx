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

// ── Types matching exact WooCommerce Store API response ──────────────

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
  loading: boolean;
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
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    try {
      const data = await getCart();
      setItems(data?.items ?? []);
      setTotals(data?.totals ?? null);
    } catch (err) {
      console.log('Cart refresh error:', err);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, []);

  const addItem = useCallback(async (productId: number, quantity = 1) => {
    setLoading(true);
    try {
      await addToCart(productId, quantity);
      await refreshCart();
    } finally {
      setLoading(false);
    }
  }, [refreshCart]);

  const removeItem = useCallback(async (key: string) => {
    setLoading(true);
    try {
      await removeCartItem(key);
      await refreshCart();
    } finally {
      setLoading(false);
    }
  }, [refreshCart]);

  const updateItem = useCallback(async (key: string, quantity: number) => {
    setLoading(true);
    try {
      if (quantity <= 0) {
        await removeCartItem(key);
      } else {
        await updateCartItem(key, quantity);
      }
      await refreshCart();
    } finally {
      setLoading(false);
    }
  }, [refreshCart]);

  return (
    <CartContext.Provider
      value={{
        items,
        totals,
        totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
        loading,
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
