/**
 * Global cart event bus — imported by both CartContext and cart-interceptor
 * without creating a circular dependency.
 */
type CartListener = () => void;

class CartEventBus {
  private listeners: CartListener[] = [];

  subscribe(fn: CartListener) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  emit() {
    this.listeners.forEach((fn) => fn());
  }
}

export const cartEventBus = new CartEventBus();
