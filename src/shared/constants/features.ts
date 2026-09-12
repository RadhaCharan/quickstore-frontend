export const FEATURES = {
  PRODUCTS: 'PRODUCTS',
  CATEGORIES: 'CATEGORIES',
  ORDERS: 'ORDERS',
  SEARCH: 'SEARCH',
  CUSTOMER_ACCOUNTS: 'CUSTOMER_ACCOUNTS',
  SAVED_ADDRESSES: 'SAVED_ADDRESSES',
  DISCOUNTS: 'DISCOUNTS',
  DELIVERY_TRACKING: 'DELIVERY_TRACKING',
  ANALYTICS: 'ANALYTICS',
  CUSTOM_DOMAIN: 'CUSTOM_DOMAIN',
  MULTI_THEME: 'MULTI_THEME',
} as const;

export type FeatureKey = keyof typeof FEATURES;

export const PLAN_FEATURES: Record<string, FeatureKey[]> = {
  STARTER: ['PRODUCTS', 'CATEGORIES', 'ORDERS', 'SEARCH'],
  GROWTH: [
    'PRODUCTS', 'CATEGORIES', 'ORDERS', 'SEARCH',
    'CUSTOMER_ACCOUNTS', 'SAVED_ADDRESSES',
    'DISCOUNTS', 'DELIVERY_TRACKING', 'MULTI_THEME',
  ],
  PRO: [
    'PRODUCTS', 'CATEGORIES', 'ORDERS', 'SEARCH',
    'CUSTOMER_ACCOUNTS', 'SAVED_ADDRESSES',
    'DISCOUNTS', 'DELIVERY_TRACKING', 'MULTI_THEME',
    'ANALYTICS', 'CUSTOM_DOMAIN',
  ],
};

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  PRODUCTS: 'Product Listing & Management',
  CATEGORIES: 'Product Categories',
  ORDERS: 'Order Management',
  SEARCH: 'Search Bar',
  CUSTOMER_ACCOUNTS: 'Customer Accounts',
  SAVED_ADDRESSES: 'Saved Addresses',
  DISCOUNTS: 'Discounts & Coupons',
  DELIVERY_TRACKING: 'Delivery Tracking',
  ANALYTICS: 'Analytics Dashboard',
  CUSTOM_DOMAIN: 'Custom Domain',
  MULTI_THEME: 'Multiple Themes',
};
