import { apiClient, setCartToken } from '@/api/client';
import { Endpoints } from '@/api/endpoints';

/**
 * Initialize cart session and save Cart-Token.
 */
export const initializeCart = async () => {
  try {
    const response = await apiClient.get(Endpoints.CART);

    const token =
      response.headers['cart-token'] ||
      response.headers['Cart-Token'];

    if (token) {
      setCartToken(token as string);
      console.log('Cart Token:', token);
    } else {
      console.warn('Cart-Token header not found');
    }

    return response.data;
  } catch (error) {
    console.log('Initialize cart error:', error);
    throw error;
  }
};

/**
 * Get current cart state
 */
export const getCart = async () => {
  try {
    const response = await apiClient.get(Endpoints.CART);
    return response.data;
  } catch (error) {
    console.log('Get cart error:', error);
    throw error;
  }
};

/**
 * Add item with Cart Token
 */
export const addToCart = async (
  productId: number,
  quantity = 1
) => {
  try {
    const response = await apiClient.post(
      Endpoints.ADD_TO_CART,
      { id: productId, quantity }
    );

    return response.data;
  } catch (error) {
    console.log('Add to cart error:', error);
    throw error;
  }
};

/**
 * Update item
 */
export const updateCartItem = async (
  key: string,
  quantity: number
) => {
  try {
    const response = await apiClient.post(
      Endpoints.UPDATE_ITEM,
      { key, quantity }
    );
    return response.data;
  } catch (error) {
    console.log('Update cart error:', error);
    throw error;
  }
};

/**
 * Remove item
 */
export const removeCartItem = async (key: string) => {
  try {
    const response = await apiClient.post(
      Endpoints.REMOVE_ITEM,
      { key }
    );
    return response.data;
  } catch (error) {
    console.log('Remove cart error:', error);
    throw error;
  }
};
