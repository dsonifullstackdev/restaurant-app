/**
 * Checkout & Payment types for WooCommerce Store API v1.
 */

export type PaymentMethod = {
  id: string;           // e.g. "cod", "razorpay", "stripe"
  title: string;        // e.g. "Cash on Delivery"
  description: string;
  supports: string[];
};

export type BillingAddress = {
  first_name: string;
  last_name: string;
  company: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email: string;
  phone: string;
};

export type ShippingAddress = Omit<BillingAddress, 'email'>;

export type CheckoutPayload = {
  billing_address: BillingAddress;
  shipping_address: ShippingAddress;
  payment_method: string;       // payment method id e.g. "cod"
  payment_data?: {
    key: string;
    value: string;
  }[];
  customer_note?: string;
};

export type CheckoutResponse = {
  order_id: number;
  status: string;
  order_key: string;
  customer_note: string;
  payment_method: string;
  payment_result: {
    payment_status: string;
    payment_details: { key: string; value: string }[];
    redirect_url: string;
  };
};
