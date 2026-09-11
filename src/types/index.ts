export type LanguageCode = 'en' | 'ar' | 'es' | 'fr' | 'de';
export type TextDirection = 'ltr' | 'rtl';
export type MarketCode = 'US' | 'UK' | 'DE' | 'FR' | 'JP' | 'CA';
export type CurrencyCode = 'USD' | 'GBP' | 'EUR' | 'JPY' | 'CAD';

export interface LocaleConfig {
  code: LanguageCode;
  name: string;
  nativeName: string;
  direction: TextDirection;
  defaultMarket: MarketCode;
  defaultCurrency: CurrencyCode;
}

export interface SEOMetadata {
  title: string;
  description: string;
  canonicalUrl?: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: 'website' | 'product';
  noIndex?: boolean;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string;
  description: string;
  website: string;
  country: string;
  seoMetadata: SEOMetadata;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  description: string;
  image?: string;
  icon?: string;
  sortOrder: number;
  featured: boolean;
  status: 'published' | 'draft' | 'archived';
  seoMetadata: SEOMetadata;
  localizedNames?: Partial<Record<LanguageCode, string>>;
  localizedDescriptions?: Partial<Record<LanguageCode, string>>;
  attributeIds?: string[];
  indexableFilterSlugs?: string[]; // Curated combinations e.g. ["wireless", "noise-cancelling"]
}

export interface AttributeDefinition {
  id: string;
  name: string;
  slug: string;
  type: 'select' | 'boolean' | 'number' | 'text';
  unit?: string;
  categoryIds: string[]; // Association with categories
  options?: string[]; // For 'select' type
  isFilterable: boolean;
  isComparable: boolean;
  labelKey?: string;
}

export interface ProductAttributeValue {
  attributeId: string;
  attributeSlug: string;
  name: string;
  value: string | number | boolean;
  displayValue: string;
  unit?: string;
}

export interface Merchant {
  id: string;
  name: string;
  slug: string;
  domain: string;
  logo: string;
  country: MarketCode;
  defaultCurrency: CurrencyCode;
  affiliateParamKey: string;
  defaultAffiliateId: string;
  status: 'active' | 'inactive';
}

export interface MerchantOffer {
  id: string;
  productId: string;
  merchantId: string;
  merchantName: string;
  merchantLogo: string;
  productUrl: string;
  affiliateUrl: string;
  price: number;
  originalPrice?: number;
  currency: CurrencyCode;
  availability: 'in_stock' | 'out_of_stock' | 'preorder' | 'limited';
  lastChecked: string;
  trackingParams?: Record<string, string>;
  status: 'active' | 'inactive';
  market: MarketCode;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku?: string;
  priceDelta?: number;
  attributes: Record<string, string>;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brandId: string;
  brandName: string;
  categoryIds: string[]; // Can belong to multiple categories
  primaryCategoryId: string;
  description: string;
  shortDescription: string;
  images: ProductImage[];
  identifiers: {
    asin?: string;
    sku?: string;
    upc?: string;
    ean?: string;
    gtin?: string;
    modelNumber?: string;
  };
  rating: number; // Genuine rating aggregated from verified sources
  reviewCount: number;
  price: number; // Primary lowest active offer price
  currency: CurrencyCode;
  availability: 'in_stock' | 'out_of_stock' | 'preorder';
  specifications: Record<string, string>;
  features: string[];
  attributes: ProductAttributeValue[];
  variants?: ProductVariant[];
  tags: string[];
  merchantOffers: MerchantOffer[];
  seoMetadata: SEOMetadata;
  status: 'published' | 'draft' | 'archived';
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface Comparison {
  id: string;
  slug: string;
  title: string;
  description: string;
  productIds: string[];
  featured: boolean;
  seoMetadata: SEOMetadata;
  createdAt: string;
}

export interface ImportJob {
  id: string;
  sourceUrl: string;
  merchantSlug: string;
  productIdentifier?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'requires_review';
  logs: string[];
  suggestedData?: Partial<Product>;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsEvent {
  id: string;
  eventType: 'product_view' | 'search' | 'category_view' | 'brand_view' | 'comparison_view' | 'affiliate_click' | 'filter_used';
  entityId?: string;
  entityName?: string;
  merchantId?: string;
  market: MarketCode;
  locale: LanguageCode;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface FilterState {
  categoryId?: string;
  brandIds: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStockOnly?: boolean;
  attributes: Record<string, string[]>;
  sortBy: 'relevance' | 'price_asc' | 'price_desc' | 'rating_desc' | 'popularity' | 'newest';
  searchQuery?: string;
}

export interface PlatformSettings {
  siteName: string;
  siteUrl: string;
  logo: string;
  defaultLanguage: LanguageCode;
  availableLanguages: LanguageCode[];
  defaultCurrency: CurrencyCode;
  defaultMarket: MarketCode;
  amazonAffiliateTagUS: string;
  amazonAffiliateTagUK: string;
  amazonAffiliateTagDE: string;
  affiliateDisclosureText: string;
  enableDuplicateCheck: boolean;
  autoPublishImports: boolean;
}

export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'replied' | 'archived';
  createdAt: string;
}
