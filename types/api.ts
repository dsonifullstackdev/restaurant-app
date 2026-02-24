/**
 * WooCommerce REST API response types (v3).
 */

export interface WcProductImage {
  id: number;
  src: string;
  title?: string;
  alt?: string;
  position?: number;
}

export interface WcProductCategoryRef {
  id?: number;
  name?: string;
  slug?: string;
}

export interface WcProduct {
  id: number;
  name?: string;
  title?: string;
  slug: string;
  permalink: string;
  price: string;
  regular_price: string;
  sale_price: string | null;
  type: string;
  status: string;
  description?: string;
  short_description?: string;
  average_rating?: string;
  rating_count?: number;
  images: WcProductImage[];
  categories?: WcProductCategoryRef[] | string[];
  featured_src?: string;
  [key: string]: unknown;
}

export interface WcProductCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
  description?: string;
  display?: string;
  image?: { src?: string } | string | null;
  count?: number;
  [key: string]: unknown;
}

export interface WcProductsResponse {
  products?: WcProduct[];
  product?: WcProduct;
}

export interface WcCategoriesResponse {
  product_categories?: WcProductCategory[];
  product_category?: WcProductCategory;
}

export interface ProductListParams {
  page?: number;
  per_page?: number;
  search?: string;
  category?: number;
}

// banner contents

export type BannerImage =
  | string
  | {
      id?: number;
      src: string;
    };

export type WcBanner = {
  id: number;
  title: string;
  subtitle?: string;
  buttonText?: string;
  image?: BannerImage;
};

export type WcBannersResponse = {
  banners?: WcBanner[];
};
