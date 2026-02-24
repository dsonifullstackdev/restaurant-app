import { apiClient, setStoreNonce } from '@/api/client';
import { Endpoints } from '@/api/endpoints';

/**
 * Initialize cart session
 * MUST be called once when app starts
 */
export const initializeCart = async () => {
  try {
    const response = await apiClient.get(Endpoints.ADD_TO_CART);

    const nonce =
      response.headers['x-wc-store-api-nonce'] ||
      response.headers['X-WC-Store-API-Nonce'];

    if (nonce) {
      setStoreNonce(nonce);
      console.log('Store API Nonce stored:', nonce);
    } else {
      console.log('Nonce not found in headers');
    }

    return response.data;
  } catch (error) {
    console.log('Initialize cart error:', error);
    throw error;
  }
};

/**
 * Get Cart
 */
export const getCart = async () => {
  try {
    const response = await apiClient.get(Endpoints.ADD_TO_CART);
    return response.data;
  } catch (error) {
    console.log('Get cart error:', error);
    throw error;
  }
};

/**
 * Add Item to Cart
 */
export const addToCart = async (
  productId: number,
  quantity: number = 1
) => {
  try {
    const response = await apiClient.post(
      Endpoints.ADD_TO_CART,
      {
        id: productId,
        quantity,
      }
    );

    return response.data;
  } catch (error: any) {
    console.log(
      'Add to cart error:',
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Update Cart Item Quantity
 */
export const updateCartItem = async (
  cartItemKey: string,
  quantity: number
) => {
  try {
    const response = await apiClient.post(
      Endpoints.UPDATE_ITEM,
      {
        key: cartItemKey,
        quantity,
      }
    );

    return response.data;
  } catch (error) {
    console.log('Update cart error:', error);
    throw error;
  }
};

/**
 * Remove Item from Cart
 */
export const removeCartItem = async (cartItemKey: string) => {
  try {
    const response = await apiClient.post(
      Endpoints.REMOVE_ITEM,
      {
        key: cartItemKey,
      }
    );

    return response.data;
  } catch (error) {
    console.log('Remove cart error:', error);
    throw error;
  }
};
