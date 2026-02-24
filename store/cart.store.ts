import { addToCart, getCart } from '@/api/services/cart.service';
import { create } from 'zustand';

type CartItem = {
  id: number;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  cartCount: number;
  loading: boolean;

  fetchCart: () => Promise<void>;
  addItem: (productId: number, quantity?: number) => Promise<void>;
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  cartCount: 0,
  loading: false,

  fetchCart: async () => {
    try {
      set({ loading: true });

      const cart = await getCart();

      const items = cart?.items ?? [];

      const count = items.reduce(
        (sum: number, item: any) => sum + item.quantity,
        0
      );

      set({
        items,
        cartCount: count,
        loading: false,
      });
    } catch (error) {
      console.log('Cart fetch error:', error);
      set({ loading: false });
    }
  },

  addItem: async (productId: number, quantity = 1) => {
    try {
      await addToCart(productId, quantity);

      // refresh after add
      await get().fetchCart();
    } catch (error) {
      console.log('Add to cart error:', error);
    }
  },
}));
