import { MarketCode, CurrencyCode, Product, MerchantOffer } from '../types';
import { db, cleanAndSanitizeProduct, toHighResAmazonImageUrl } from './db';

export interface ParsedAmazonProduct {
  asin: string;
  url: string;
  cleanUrl: string;
  affiliateUrl: string;
  market: MarketCode;
  currency: CurrencyCode;
  merchantId: string;
  merchantName: string;
  merchantLogo: string;
  title: string;
  brandName: string;
  brandId: string;
  categoryId: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  galleryImages?: string[];
  features: string[];
  specifications: Record<string, string>;
  isDuplicate: boolean;
  existingProduct?: Product;
}

export interface AmazonScrapedData {
  resolvedUrl: string;
  asin?: string | null;
  realTitle?: string | null;
  realImageUrl?: string | null;
  galleryImages?: string[];
  realPrice?: number | null;
}

// Fetch live scraped data from server-side resolver
export async function fetchAmazonScrapedData(urlOrAsin: string): Promise<AmazonScrapedData | null> {
  const trimmed = urlOrAsin.trim();
  if (!trimmed) return null;

  let target = trimmed;
  if (/^[B0-9][0-9A-Z]{9}$/i.test(trimmed)) {
    target = `https://www.amazon.com/dp/${trimmed.toUpperCase()}`;
  } else if (!target.startsWith('http')) {
    target = `https://${target}`;
  }

  try {
    const endpoint = `/api/resolve-amazon?url=${encodeURIComponent(target)}`;
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (response.ok) {
      const data: AmazonScrapedData = await response.json();
      return data;
    }
  } catch (err) {
    console.warn('Failed to fetch scraped Amazon data:', err);
  }

  return null;
}

// Check if string looks like an Amazon link or ASIN
export function isAmazonLink(input: string): boolean {
  if (!input) return false;
  const trimmed = input.trim();
  // Direct ASIN: 10 chars starting with B (or alphanumeric)
  if (/^[B0-9][0-9A-Z]{9}$/i.test(trimmed)) return true;
  // Amazon domains
  if (/amazon\.(com|co\.uk|de|fr|ca|co\.jp|es|it)/i.test(trimmed)) return true;
  if (/amzn\.(to|eu)/i.test(trimmed)) return true;
  if (/a\.co/i.test(trimmed)) return true;
  return false;
}

// Check if string is a shortened Amazon URL that needs server-side redirect resolution
export function isShortenedAmazonLink(input: string): boolean {
  if (!input) return false;
  const trimmed = input.trim();
  return /amzn\.(to|eu)|a\.co/i.test(trimmed);
}

// Resolve shortened URLs (amzn.to, a.co, amzn.eu) to their final destination
export async function resolveAmazonShortUrl(url: string): Promise<string> {
  const trimmed = url.trim();
  if (!trimmed) return url;
  
  // If not shortened and already contains an ASIN, no resolution needed
  if (!isShortenedAmazonLink(trimmed) && extractAsin(trimmed)) {
    return trimmed;
  }

  try {
    const formattedUrl = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    const endpoint = `/api/resolve-amazon?url=${encodeURIComponent(formattedUrl)}`;
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (response.ok) {
      const data = await response.json();
      if (data?.resolvedUrl && typeof data.resolvedUrl === 'string') {
        return data.resolvedUrl;
      }
    }
  } catch (err) {
    console.warn('Failed to resolve Amazon shortened link via /api/resolve-amazon:', err);
  }

  return trimmed;
}

// Extract 10-character ASIN from various Amazon URL formats
export function extractAsin(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // 1. Direct ASIN (e.g. B08N5WRWNW)
  const directMatch = trimmed.match(/\b([B0-9][0-9A-Z]{9})\b/i);
  if (/^[B0-9][0-9A-Z]{9}$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  // 2. Standard /dp/B0XXXXXXXX or /gp/product/B0XXXXXXXX or /product/B0XXXXXXXX
  const dpMatch = trimmed.match(/(?:\/dp\/|\/gp\/product\/|\/product\/|\/ASIN\/)([B0-9][0-9A-Z]{9})/i);
  if (dpMatch && dpMatch[1]) {
    return dpMatch[1].toUpperCase();
  }

  // 3. Query string param asin=B0XXXXXXXX
  const queryMatch = trimmed.match(/[?&]asin=([B0-9][0-9A-Z]{9})/i);
  if (queryMatch && queryMatch[1]) {
    return queryMatch[1].toUpperCase();
  }

  // 4. Fallback: any 10-character standard Amazon ASIN in path
  if (directMatch && directMatch[1]) {
    return directMatch[1].toUpperCase();
  }

  return null;
}

// Detect market and currency from URL domain
export function detectMarket(url: string): { market: MarketCode; currency: CurrencyCode; merchantId: string; merchantName: string } {
  if (url.includes('.co.uk')) {
    return { market: 'UK', currency: 'GBP', merchantId: 'merchant-amazon-uk', merchantName: 'Amazon UK' };
  }
  if (url.includes('.de')) {
    return { market: 'DE', currency: 'EUR', merchantId: 'merchant-amazon-de', merchantName: 'Amazon DE' };
  }
  if (url.includes('.fr')) {
    return { market: 'FR', currency: 'EUR', merchantId: 'merchant-amazon-us', merchantName: 'Amazon FR' };
  }
  if (url.includes('.co.jp')) {
    return { market: 'JP', currency: 'JPY', merchantId: 'merchant-amazon-us', merchantName: 'Amazon JP' };
  }
  if (url.includes('.ca')) {
    return { market: 'CA', currency: 'CAD', merchantId: 'merchant-amazon-us', merchantName: 'Amazon CA' };
  }
  return { market: 'US', currency: 'USD', merchantId: 'merchant-amazon-us', merchantName: 'Amazon US' };
}

// Clean title from URL slug: amazon.com/Apple-MacBook-Air-13-inch/dp/B08N5WRWNW
export function extractTitleFromSlug(url: string): string {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    const pathname = parsed.pathname;
    const parts = pathname.split('/').filter(Boolean);
    const dpIndex = parts.findIndex(p => p.toLowerCase() === 'dp' || p.toLowerCase() === 'product');

    if (dpIndex > 0) {
      const slug = parts[dpIndex - 1];
      // Convert dashes/underscores to spaces and capitalize words
      const cleaned = decodeURIComponent(slug)
        .replace(/[-_+]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (cleaned.length > 4 && !cleaned.toLowerCase().startsWith('gp')) {
        return cleaned
          .split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      }
    }
  } catch (e) {
    // Ignore URL parse error
  }
  return '';
}

// Detect brand from title
export function detectBrand(text: string): { brandName: string; brandId: string } {
  const brands = db.getBrands();
  const lower = text.toLowerCase();

  for (const b of brands) {
    if (lower.includes(b.name.toLowerCase())) {
      return { brandName: b.name, brandId: b.id };
    }
  }

  // Common popular hardware brands
  const commonBrands: Record<string, string> = {
    apple: 'Apple',
    sony: 'Sony',
    bose: 'Bose',
    samsung: 'Samsung',
    dell: 'Dell',
    lenovo: 'Lenovo',
    asus: 'ASUS',
    hp: 'HP',
    breville: 'Breville',
    wolfbox: 'WOLFBOX',
    delonghi: 'De\'Longhi',
    canon: 'Canon',
    nikon: 'Nikon',
    fujifilm: 'Fujifilm',
    logitech: 'Logitech',
    sennheiser: 'Sennheiser',
    anker: 'Anker',
    google: 'Google',
    microsoft: 'Microsoft',
    surface: 'Microsoft',
    lg: 'LG',
    razer: 'Razer',
    kindle: 'Amazon',
    echo: 'Amazon',
  };

  for (const [key, name] of Object.entries(commonBrands)) {
    if (lower.includes(key)) {
      // Find or create in DB
      const existing = brands.find(b => b.name.toLowerCase() === name.toLowerCase());
      return {
        brandName: name,
        brandId: existing ? existing.id : `brand-${key}`,
      };
    }
  }

  return { brandName: 'Omni Verified Brand', brandId: 'brand-other' };
}

// Detect primary category
export function detectCategory(text: string): { categoryId: string; defaultImage: string } {
  const lower = text.toLowerCase();

  if (/headphone|earphone|earbud|airpod|audio|soundbar|speaker|noise cancel|anc|iem/i.test(lower)) {
    return {
      categoryId: 'cat-audio',
      defaultImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=85',
    };
  }
  if (/smartwatch|watch|apple watch|garmin|fitbit|wrist|galaxy watch/i.test(lower)) {
    return {
      categoryId: 'cat-wearables',
      defaultImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=85',
    };
  }
  if (/iphone|smartphone|galaxy s|pixel|android|mobile phone|5g phone/i.test(lower)) {
    return {
      categoryId: 'cat-smartphones',
      defaultImage: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=85',
    };
  }
  if (/playstation|ps5|xbox|nintendo|switch|steam deck|gaming console|gamepad|joystick/i.test(lower)) {
    return {
      categoryId: 'cat-gaming',
      defaultImage: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=85',
    };
  }
  if (/air fryer|cooker|blender|toaster|microwave|sous vide|ninja foodi|instant pot/i.test(lower)) {
    return {
      categoryId: 'cat-cookware',
      defaultImage: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=85',
    };
  }
  if (/robot vacuum|vacuum|roomba|roborock|dyson vacuum|mop/i.test(lower)) {
    return {
      categoryId: 'cat-cleaning',
      defaultImage: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=800&q=85',
    };
  }
  if (/hair dryer|supersonic|shaver|trimmer|grooming|straightener|curler|skincare/i.test(lower)) {
    return {
      categoryId: 'cat-beauty',
      defaultImage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=85',
    };
  }
  if (/monitor|ultrawide|display|screen|ergonomic chair|standing desk/i.test(lower)) {
    return {
      categoryId: 'cat-office',
      defaultImage: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=85',
    };
  }
  if (/dumbbell|kettlebell|treadmill|exercise bike|gym|fitness|workout|pull up/i.test(lower)) {
    return {
      categoryId: 'cat-fitness',
      defaultImage: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=85',
    };
  }
  if (/laptop|macbook|thinkpad|notebook|computer|pc|ultrabook|chromebook/i.test(lower)) {
    return {
      categoryId: 'cat-laptops',
      defaultImage: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=85',
    };
  }
  if (/camera|mirrorless|dslr|lens|imaging|sensor|fujifilm|alpha|eos|drone|dji/i.test(lower)) {
    return {
      categoryId: 'cat-cameras',
      defaultImage: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=85',
    };
  }
  if (/coffee|espresso|grinder|brewer|latte|cappuccino|barista|portafilter/i.test(lower)) {
    return {
      categoryId: 'cat-coffee',
      defaultImage: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=800&q=85',
    };
  }
  if (/charger|power adapter|adapter|power bank|cable|dock|hub|usb/i.test(lower)) {
    return {
      categoryId: 'cat-power',
      defaultImage: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=85',
    };
  }

  return {
    categoryId: 'cat-electronics',
    defaultImage: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeede?auto=format&fit=crop&w=800&q=85',
  };
}

// Extract user affiliate tag from query parameter if present
export function extractAffiliateTag(url: string): string | null {
  if (!url) return null;
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.searchParams.get('tag');
  } catch {
    const match = url.match(/[?&]tag=([^&#]+)/i);
    return match ? decodeURIComponent(match[1]) : null;
  }
}

// Clean HTML entities and Amazon category noise from product titles
export function cleanProductTitle(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/^(Amazon\.[a-z\.]+|Amazon\.com|Amazon|Buy)\s*:\s*/i, '')
    .replace(/\s*:\s*(Office Products|Electronics|Computers & Accessories|Video Games|Home & Kitchen|Sports & Outdoors|Tools & Home Improvement|Beauty & Personal Care|Automotive|Pet Supplies|Toys & Games|Patio, Lawn & Garden|Health & Household|Clothing, Shoes & Jewelry).*$/i, '')
    .replace(/\s*\|\s*Amazon\.[a-z\.]+$|\s*-\s*Amazon\.[a-z\.]+$|\s*:\s*Amazon\.[a-z\.]+$|\s*:\s*Everything Else.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Realistic price estimator based on product keywords when live price is unavailable
export function estimateProductPrice(title: string): { price: number; originalPrice?: number } {
  const lower = title.toLowerCase();

  // Desk pads, mouse pads, desk mats, blotters, writing pads, desk protectors
  if (/desk pad|mouse pad|desk mat|blotter|writing pad|desk protector|mouse mat|keyboard pad|wrist rest|desk cover|table mat/i.test(lower)) {
    return { price: 12.99 };
  }
  
  // Cables, adapters, phone cases, screen protectors, mounts, stand holders, organizers
  if (/cable|adapter|case|holder|stand|mount|organizer|clip|sleeve|protector|screen protector|strap/i.test(lower)) {
    return { price: 15.99 };
  }

  // Chargers, power banks, USB hubs, wireless charging pads
  if (/charger|power bank|usb hub|dock|docking station|power strip|magsafe/i.test(lower)) {
    return { price: 29.99 };
  }

  // Earbuds, bluetooth speakers, gaming mice, keyboards, webcams
  if (/earbud|speaker|mouse|keyboard|webcam|microphone|mic|headset/i.test(lower)) {
    return { price: 49.99 };
  }

  // Headphones, smartwatches, fitness trackers, robot vacuums, air fryers, coffee grinders
  if (/headphone|noise cancel|anc|smartwatch|watch|fitness tracker|vacuum|air fryer|grinder|blender/i.test(lower)) {
    return { price: 149.99 };
  }

  // Laptops, MacBooks, PCs, 4K TVs, cameras, drones, espresso machines, monitors
  if (/laptop|macbook|desktop|pc|tv|oled|camera|drone|espresso machine|monitor|ultrawide/i.test(lower)) {
    return { price: 899.00 };
  }

  // Default fallback for general items
  return { price: 24.99 };
}

// Main synchronous parser function (when ASIN is directly extractable)
export function parseAmazonLink(rawInput: string, originalUrl?: string): ParsedAmazonProduct | null {
  const trimmed = rawInput.trim();
  if (!trimmed) return null;

  const asin = extractAsin(trimmed);
  if (!asin) return null;

  // Check if already in DB
  const existingProduct = db.getProductByAsin(asin);

  // Market & Currency
  const { market, currency, merchantId, merchantName } = detectMarket(trimmed);

  // Clean canonical Amazon URL
  const domain = market === 'UK' ? 'amazon.co.uk' : market === 'DE' ? 'amazon.de' : market === 'FR' ? 'amazon.fr' : market === 'JP' ? 'amazon.co.jp' : market === 'CA' ? 'amazon.ca' : 'amazon.com';
  const cleanUrl = `https://www.${domain}/dp/${asin}`;

  // Extract affiliate tag from user input
  const inputToInspect = originalUrl || rawInput;
  const userTag = extractAffiliateTag(inputToInspect) || extractAffiliateTag(trimmed);

  // Preserve user's exact affiliate tracking URL if provided, or build canonical affiliate URL
  let affiliateUrl = '';
  if (inputToInspect.startsWith('http') && (userTag || /linkCode|linkId|amzn\.to|a\.co/i.test(inputToInspect))) {
    affiliateUrl = inputToInspect;
  } else {
    const settings = db.getSettings();
    const defaultTag = market === 'UK' ? settings.amazonAffiliateTagUK : market === 'DE' ? settings.amazonAffiliateTagDE : settings.amazonAffiliateTagUS;
    const finalTag = userTag || defaultTag || 'omnidiscover-us-20';
    affiliateUrl = `${cleanUrl}?tag=${finalTag}`;
  }

  // Auto-sync detected custom tag to settings if user provides a specific tag
  if (userTag) {
    const settings = db.getSettings();
    if (market === 'UK' && settings.amazonAffiliateTagUK !== userTag) {
      db.saveSettings({ ...settings, amazonAffiliateTagUK: userTag });
    } else if (market === 'DE' && settings.amazonAffiliateTagDE !== userTag) {
      db.saveSettings({ ...settings, amazonAffiliateTagDE: userTag });
    } else if (market === 'US' && settings.amazonAffiliateTagUS !== userTag) {
      db.saveSettings({ ...settings, amazonAffiliateTagUS: userTag });
    }
  }

  // Title extraction
  const slugTitle = extractTitleFromSlug(trimmed);
  let title = cleanProductTitle(slugTitle);

  if (!title) {
    if (existingProduct) {
      title = cleanProductTitle(existingProduct.name);
    } else {
      title = `Amazon Verified Product (${asin})`;
    }
  }

  // Detect brand and category
  const { brandName, brandId } = detectBrand(title);
  const { categoryId, defaultImage } = detectCategory(title);

  // Base price estimation / existing product price
  const { price: estPrice } = estimateProductPrice(title);

  const price = existingProduct ? existingProduct.price : estPrice;
  const originalPrice = existingProduct?.merchantOffers[0]?.originalPrice;

  return {
    asin,
    url: originalUrl || (trimmed.startsWith('http') ? trimmed : cleanUrl),
    cleanUrl,
    affiliateUrl,
    market,
    currency,
    merchantId,
    merchantName,
    merchantLogo: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=120&h=40&q=80',
    title,
    brandName: existingProduct?.brandName || brandName,
    brandId: existingProduct?.brandId || brandId,
    categoryId: existingProduct?.primaryCategoryId || categoryId,
    price,
    originalPrice,
    imageUrl: existingProduct?.images[0]?.url || defaultImage,
    features: existingProduct?.features || [
      'Genuine manufacturer warranty and verified serial identifier',
      'High efficiency architecture with premium build materials',
      'Fast prime multi-market regional shipping available'
    ],
    specifications: existingProduct?.specifications || {
      'Model Identifier': asin,
      'Warranty': '1 Year Manufacturer Limited',
      'Market Region': market,
      'Packaging': 'Retail Global Box'
    },
    isDuplicate: !!existingProduct,
    existingProduct,
  };
}

// Asynchronous parser that resolves shortened links and scrapes authentic Amazon product media
export async function parseAmazonLinkAsync(rawInput: string): Promise<ParsedAmazonProduct | null> {
  const trimmed = rawInput.trim();
  if (!trimmed) return null;

  // 1. Fetch live scraped data and redirect resolution from our backend API (/api/resolve-amazon)
  const apiData = await fetchAmazonScrapedData(trimmed);

  // Determine the canonical URL to parse from
  const targetUrl = apiData?.resolvedUrl || trimmed;
  let parsed = parseAmazonLink(targetUrl, trimmed);

  // If initial parse couldn't find an ASIN directly from string, but API resolved it:
  if (!parsed && apiData?.asin) {
    parsed = parseAmazonLink(`https://www.amazon.com/dp/${apiData.asin}`, trimmed);
  }

  // If still not parsed, try direct parse fallback
  if (!parsed) {
    parsed = parseAmazonLink(trimmed);
  }

  if (parsed && apiData) {
    // Inject authentic Amazon CDN high-res image
    if (apiData.realImageUrl) {
      parsed.imageUrl = toHighResAmazonImageUrl(apiData.realImageUrl);
    }
    // Inject all extracted authentic Amazon gallery photos
    if (apiData.galleryImages && apiData.galleryImages.length > 0) {
      parsed.galleryImages = apiData.galleryImages.map((u: string) => toHighResAmazonImageUrl(u));
    }
    // Inject real scraped title if available
    if (apiData.realTitle) {
      const cleanTitle = cleanProductTitle(apiData.realTitle);
      parsed.title = cleanTitle;
      const { brandName, brandId } = detectBrand(cleanTitle);
      const { categoryId } = detectCategory(cleanTitle);
      parsed.brandName = brandName;
      parsed.brandId = brandId;
      parsed.categoryId = categoryId;

      // Recalculate price estimation with clean title if real live price was not found
      if (!apiData.realPrice || apiData.realPrice <= 0) {
        const est = estimateProductPrice(cleanTitle);
        parsed.price = est.price;
        parsed.originalPrice = est.originalPrice;
      }
    }
    // Inject real scraped price if available
    if (apiData.realPrice && apiData.realPrice > 0) {
      parsed.price = apiData.realPrice;
      parsed.originalPrice = (apiData as any).realOriginalPrice && (apiData as any).realOriginalPrice > apiData.realPrice
        ? (apiData as any).realOriginalPrice
        : undefined;
    }
  }

  return parsed;
}

// Convert parsed item to a full Product record and save to DB
export function saveAmazonProductToDb(parsed: {
  asin: string;
  title: string;
  brandName: string;
  brandId?: string;
  categoryId: string;
  price: number;
  originalPrice?: number;
  currency: CurrencyCode;
  market: MarketCode;
  imageUrl: string;
  galleryImages?: string[];
  cleanUrl: string;
  affiliateUrl: string;
  features?: string[];
  specifications?: Record<string, string>;
  description?: string;
}): Product {
  const cleanTitle = cleanProductTitle(parsed.title);

  // Price safety check: desk pads / mouse mats / accessories should not carry default high prices
  let finalPrice = parsed.price;
  let finalOrigPrice = (parsed.originalPrice && parsed.originalPrice > finalPrice) ? parsed.originalPrice : undefined;
  if (/desk pad|mouse pad|desk mat|blotter|writing pad|desk protector|mouse mat|keyboard pad|wrist rest/i.test(cleanTitle) && finalPrice > 50) {
    finalPrice = 12.99;
    finalOrigPrice = undefined;
  }

  const slug = `${cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${parsed.asin.toLowerCase()}`;
  
  // Ensure brand exists
  let brandId = parsed.brandId;
  if (!brandId || !db.getBrandById(brandId)) {
    const existing = db.getBrands().find(b => b.name.toLowerCase() === parsed.brandName.toLowerCase());
    if (existing) {
      brandId = existing.id;
    } else {
      const newBrand = {
        id: `brand-${parsed.brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        name: parsed.brandName,
        slug: parsed.brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&h=120&q=80',
        description: `Hardware manufacturer of ${parsed.title}`,
        website: parsed.cleanUrl,
        country: parsed.market,
        seoMetadata: {
          title: `${parsed.brandName} Catalog`,
          description: `All products from ${parsed.brandName}`,
        },
        status: 'active' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.saveBrand(newBrand);
      brandId = newBrand.id;
    }
  }

  const category = db.getCategoryById(parsed.categoryId);
  const categoryIds = category ? (category.parentId ? [category.parentId, category.id] : [category.id]) : ['cat-electronics'];

  // Combine primary image and any authentic gallery images
  const allImageUrls = [
    toHighResAmazonImageUrl(parsed.imageUrl),
    ...(parsed.galleryImages || []).map((u) => toHighResAmazonImageUrl(u)).filter((u) => u !== toHighResAmazonImageUrl(parsed.imageUrl)),
  ];

  const productImages = allImageUrls.map((url, idx) => ({
    id: `img-${parsed.asin}-${idx + 1}`,
    url,
    alt: `View ${idx + 1}`,
    isPrimary: idx === 0,
    sortOrder: idx + 1,
  }));

  // Check if product already exists in database with this ASIN
  const existingProduct = db.getProductByAsin(parsed.asin);
  if (existingProduct) {
    const updatedOffers = existingProduct.merchantOffers.map((offer) => {
      if (offer.merchantId.includes('amazon') || offer.market === parsed.market) {
        return {
          ...offer,
          price: finalPrice,
          originalPrice: finalOrigPrice || offer.originalPrice,
          affiliateUrl: parsed.affiliateUrl,
          productUrl: parsed.cleanUrl,
          currency: parsed.currency,
          lastChecked: new Date().toISOString(),
        };
      }
      return offer;
    });

    if (!updatedOffers.some((o) => o.merchantId.includes('amazon') && o.market === parsed.market)) {
      updatedOffers.push({
        id: `off-${parsed.asin}-${Date.now()}`,
        productId: existingProduct.id,
        merchantId: parsed.market === 'UK' ? 'merchant-amazon-uk' : parsed.market === 'DE' ? 'merchant-amazon-de' : 'merchant-amazon-us',
        merchantName: parsed.market === 'UK' ? 'Amazon UK' : parsed.market === 'DE' ? 'Amazon DE' : 'Amazon US',
        merchantLogo: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=120&h=40&q=80',
        productUrl: parsed.cleanUrl,
        affiliateUrl: parsed.affiliateUrl,
        price: finalPrice,
        originalPrice: finalOrigPrice,
        currency: parsed.currency,
        availability: 'in_stock',
        lastChecked: new Date().toISOString(),
        status: 'active',
        market: parsed.market,
      });
    }

    const lowestPrice = Math.min(...updatedOffers.map((o) => o.price));

    const updatedProduct: Product = {
      ...existingProduct,
      name: cleanTitle || existingProduct.name,
      price: lowestPrice,
      currency: parsed.currency,
      merchantOffers: updatedOffers,
      images: productImages.length > 0 ? productImages : existingProduct.images,
      updatedAt: new Date().toISOString(),
    };

    db.saveProduct(updatedProduct);
    return updatedProduct;
  }

  const newProduct: Product = {
    id: `prod-amz-${parsed.asin.toLowerCase()}-${Date.now()}`,
    slug,
    name: cleanTitle,
    brandId: brandId || 'brand-other',
    brandName: parsed.brandName,
    categoryIds,
    primaryCategoryId: parsed.categoryId,
    description: parsed.description || `Verified technical specifications and multi-merchant offers for ${cleanTitle}. Indexed with standardized attributes for transparent comparison.`,
    shortDescription: `Verified hardware specifications for ${cleanTitle} (ASIN: ${parsed.asin}).`,
    images: productImages,
    identifiers: {
      asin: parsed.asin,
      sku: `AMZ-${parsed.asin}`,
      modelNumber: parsed.asin,
    },
    rating: 4.6,
    reviewCount: 380,
    price: finalPrice,
    currency: parsed.currency,
    availability: 'in_stock',
    specifications: parsed.specifications || {
      'ASIN': parsed.asin,
      'Market Region': parsed.market,
      'Warranty': 'Manufacturer Standard',
    },
    features: parsed.features && parsed.features.length > 0 ? parsed.features : [
      'Official genuine release with verified technical parameters',
      'Global market compatibility and power safety certified',
      'Backed by standard retail return guarantees'
    ],
    attributes: [],
    tags: ['amazon', parsed.market.toLowerCase(), parsed.brandName.toLowerCase()],
    merchantOffers: [
      {
        id: `off-${parsed.asin}-${Date.now()}`,
        productId: `prod-amz-${parsed.asin.toLowerCase()}`,
        merchantId: parsed.market === 'UK' ? 'merchant-amazon-uk' : parsed.market === 'DE' ? 'merchant-amazon-de' : 'merchant-amazon-us',
        merchantName: parsed.market === 'UK' ? 'Amazon UK' : parsed.market === 'DE' ? 'Amazon DE' : 'Amazon US',
        merchantLogo: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=120&h=40&q=80',
        productUrl: parsed.cleanUrl,
        affiliateUrl: parsed.affiliateUrl,
        price: finalPrice,
        originalPrice: finalOrigPrice,
        currency: parsed.currency,
        availability: 'in_stock',
        lastChecked: new Date().toISOString(),
        status: 'active',
        market: parsed.market,
      }
    ],
    seoMetadata: {
      title: `${parsed.title} Specs & Best Offers | OmniDiscover`,
      description: `Compare technical specs, price trends, and verified merchant deals for ${parsed.title}.`,
    },
    status: 'published',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
  };

  db.saveProduct(newProduct);
  return newProduct;
}
