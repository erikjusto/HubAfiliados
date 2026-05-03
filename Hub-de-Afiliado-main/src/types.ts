
export interface ProductData {
  name: string;
  price: string;
  originalPrice?: string;
  currency: string;
  installmentInfo: string;
  description: string;
  longDescription?: string;
  imageUrl: string;
  affiliateUrl: string;
  category?: string;
  subcategory?: string;
  tags?: string[];
}

export interface ImportRecord extends ProductData {
  id: string;
  importedAt: string;
  status: 'published' | 'draft';
}

export interface WooCommerceConfig {
  url: string;
  consumerKey: string;
  consumerSecret: string;
}

export enum AppTab {
  AFFILIATE = 'affiliate',
  FILTERED_PRODUCTS = 'filtered_products',
  PRODUCTS = 'products',
  STOREFRONT = 'storefront',
  SETTINGS = 'settings'
}

export interface MLCategory {
  id: string;
  name: string;
}

export interface MLProduct {
  id: string;
  title: string;
  price: number;
  currency_id: string;
  thumbnail: string;
  permalink: string;
  condition: string;
}
