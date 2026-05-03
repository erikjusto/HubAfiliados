
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
  productUrl?: string;
  category?: string;
  subcategory?: string;
  segment?: string;
  tags?: string[];
  path_from_root?: string[];
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
  LINK_PRODUCT = 'link_product',
  LINK_URL = 'link_url',
  PRODUCTS = 'products',
  STOREFRONT = 'storefront',
  STOREFRONT_PET = 'storefront_pet',
  SETTINGS = 'settings',
  DASHBOARD_IA = 'dashboard_ia',
  AI_PROMPTS = 'ai_prompts'
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
