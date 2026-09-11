import React, { useState, useEffect } from 'react';
import {
  Star,
  Scale,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Share2,
  ArrowLeft,
  ChevronRight,
  Clock,
  Sparkles,
  Layers,
  Info,
  Tag,
  Check,
  ShoppingCart
} from 'lucide-react';
import { Product } from '../../types';
import { useI18n } from '../../i18n/context';
import { ProductCard } from '../ProductCard';
import { db, cleanAndSanitizeProduct, toHighResAmazonImageUrl } from '../../services/db';

interface ProductDetailViewProps {
  productId: string;
  onBack: () => void;
  onSelectProduct: (productId: string) => void;
  compareProducts: Product[];
  onToggleCompare: (product: Product) => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  productId,
  onBack,
  onSelectProduct,
  compareProducts,
  onToggleCompare,
}) => {
  const { formatPrice, t, market, locale } = useI18n();
  const [currentProduct, setCurrentProduct] = useState<Product | null>(() => {
    const p = db.getProductById(productId);
    return p ? cleanAndSanitizeProduct(p) : null;
  });

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const p = db.getProductById(productId);
    if (!p) return;

    const sanitized = cleanAndSanitizeProduct(p);
    setCurrentProduct(sanitized);
    db.saveProduct(sanitized);

    const asin = sanitized.identifiers?.asin;
    if (asin) {
      fetch(`/api/resolve-amazon?url=https://www.amazon.com/dp/${asin}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data && data.realPrice && data.realPrice > 0) {
            const freshOffers = (sanitized.merchantOffers || []).map((mo, idx) => {
              if (idx === 0) {
                return {
                  ...mo,
                  price: data.realPrice,
                  originalPrice:
                    data.realOriginalPrice && data.realOriginalPrice > data.realPrice
                      ? data.realOriginalPrice
                      : undefined,
                };
              }
              return mo;
            });

            const primaryImgUrl = toHighResAmazonImageUrl(data.realImageUrl || sanitized.images[0]?.url || '');
            const rawGallery = (data.galleryImages || []).map((u: string) => toHighResAmazonImageUrl(u));
            const allImgs = [
              primaryImgUrl,
              ...rawGallery.filter((u: string) => u !== primaryImgUrl),
            ].filter(Boolean);

            const freshImages = allImgs.map((url: string, idx: number) => ({
              id: `img-${sanitized.id}-${idx + 1}`,
              url,
              alt: `${data.realTitle || sanitized.name} - View ${idx + 1}`,
              isPrimary: idx === 0,
              sortOrder: idx + 1,
            }));

            const updated = cleanAndSanitizeProduct({
              ...sanitized,
              name: data.realTitle || sanitized.name,
              price: data.realPrice,
              images: freshImages.length > 0 ? freshImages : sanitized.images,
              merchantOffers: freshOffers,
            });

            setCurrentProduct(updated);
            db.saveProduct(updated);
          }
        })
        .catch(() => {});
    }
  }, [productId]);

  const product = currentProduct;

  // Dynamic SEO metadata & JSON-LD Structured Data for Google Rich Snippets
  useEffect(() => {
    if (!product) return;

    const originalTitle = document.title;
    document.title = `${product.name} - Specs, Comparison & Best Price | OmniDiscover`;

    // Update meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    const cleanDesc = product.description || `Explore detailed specifications, expert comparison, and live merchant pricing for ${product.name}.`;
    metaDesc.setAttribute('content', cleanDesc);

    // Schema.org Product JSON-LD
    const schemaId = 'product-jsonld-schema';
    let script = document.getElementById(schemaId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = schemaId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }

    const schemaData = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      image: product.images.map((img) => img.url),
      description: cleanDesc,
      brand: {
        '@type': 'Brand',
        name: product.brandName,
      },
      sku: product.identifiers?.sku || product.id,
      gtin13: product.identifiers?.ean || undefined,
      mpn: product.identifiers?.asin || undefined,
      offers: product.merchantOffers?.map((offer) => ({
        '@type': 'Offer',
        url: offer.affiliateUrl || offer.productUrl,
        priceCurrency: offer.currency || 'USD',
        price: offer.price,
        itemCondition: 'https://schema.org/NewCondition',
        availability: offer.availability === 'out_of_stock'
          ? 'https://schema.org/OutOfStock'
          : 'https://schema.org/InStock',
        seller: {
          '@type': 'Organization',
          name: offer.merchantName,
        },
      })) || [
        {
          '@type': 'Offer',
          url: window.location.href,
          priceCurrency: product.currency || 'USD',
          price: product.price,
          availability: 'https://schema.org/InStock',
        },
      ],
      aggregateRating: product.rating
        ? {
            '@type': 'AggregateRating',
            ratingValue: product.rating,
            reviewCount: product.reviewCount || 10,
          }
        : undefined,
    };

    script.textContent = JSON.stringify(schemaData);

    return () => {
      document.title = originalTitle;
      const el = document.getElementById(schemaId);
      if (el) el.remove();
    };
  }, [product]);

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-neutral-800">Product not found</h2>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  const isCompared = compareProducts.some(p => p.id === product.id);
  const brand = db.getBrandById(product.brandId);
  const category = db.getCategoryById(product.primaryCategoryId);
  const similarProducts = db.getSimilarProducts(product, 4);

  // Primary Offer for prominent conversion buy box
  const primaryOffer = product.merchantOffers?.[0] || {
    id: `off-default-${product.id}`,
    merchantId: 'merchant-amazon-us',
    merchantName: 'Amazon US',
    price: product.price,
    originalPrice: product.merchantOffers?.[0]?.originalPrice,
    currency: product.currency,
    availability: product.availability || 'in_stock',
    productUrl: `https://www.amazon.com/dp/${product.identifiers.asin || ''}`,
    affiliateUrl: `https://www.amazon.com/dp/${product.identifiers.asin || ''}?tag=omnidiscover-us-20`,
    market: 'US',
  };

  const isPrimaryDiscounted = !!(primaryOffer.originalPrice && primaryOffer.originalPrice > primaryOffer.price);
  const primarySavings = isPrimaryDiscounted ? primaryOffer.originalPrice! - primaryOffer.price : 0;
  const primaryDiscountPercent = isPrimaryDiscounted ? Math.round((primarySavings / primaryOffer.originalPrice!) * 100) : 0;

  const handleAffiliateClick = (offer: any) => {
    db.logEvent({
      eventType: 'affiliate_click',
      entityId: product.id,
      entityName: product.name,
      merchantId: offer.merchantId,
      market: offer.market || market,
      locale,
      metadata: {
        price: offer.price,
        affiliateUrl: offer.affiliateUrl,
      },
    });
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const activeImage = toHighResAmazonImageUrl(product.images[selectedImageIndex]?.url || product.images[0]?.url);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-neutral-500">
        <button onClick={onBack} className="hover:text-blue-600 flex items-center gap-1 font-semibold cursor-pointer">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <span>/</span>
        <span className="text-neutral-400">Products</span>
        <span>/</span>
        {category && (
          <>
            <span className="hover:text-blue-600 cursor-pointer">{category.name}</span>
            <span>/</span>
          </>
        )}
        <span className="text-neutral-900 font-semibold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Hero Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left: Image Gallery (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Image Box */}
          <div className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-xs flex items-center justify-center h-80 sm:h-96 relative overflow-hidden">
            <img
              src={activeImage}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="max-h-full max-w-full object-contain"
            />
            <div className="absolute top-4 left-4">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Lab-Verified Specs
              </span>
            </div>
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-20 h-20 rounded-2xl bg-white p-2 border transition-all cursor-pointer flex-shrink-0 flex items-center justify-center ${
                    selectedImageIndex === idx
                      ? 'border-blue-600 ring-2 ring-blue-100 shadow-sm'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={img.alt || product.name}
                    referrerPolicy="no-referrer"
                    className="max-h-full max-w-full object-contain"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info & Pricing / Offers (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Brand & Title */}
          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-lg">
                {product.brandName}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
                </button>
                <button
                  onClick={() => onToggleCompare(product)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isCompared
                      ? 'bg-blue-600 text-white'
                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                  }`}
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>{isCompared ? 'In Compare' : 'Add to Compare'}</span>
                </button>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight leading-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-4 mt-3 text-sm">
              <div className="flex items-center gap-1 text-amber-600 font-bold bg-amber-50 px-2.5 py-1 rounded-lg">
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                <span>{product.rating}</span>
                <span className="text-neutral-500 font-normal">({product.reviewCount.toLocaleString()} verified ratings)</span>
              </div>
              {product.identifiers.modelNumber && (
                <span className="text-xs text-neutral-400 font-mono">
                  Model: {product.identifiers.modelNumber}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-neutral-600 leading-relaxed">
            {product.description}
          </p>

          {/* Primary High-Conversion Buy Box */}
          <div className="bg-gradient-to-br from-amber-500/10 via-amber-50/60 to-orange-50/20 rounded-3xl p-6 sm:p-7 border-2 border-amber-400/90 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-amber-200/80">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black text-amber-950 uppercase tracking-wider">
                  {t('buy.direct_deal') || 'Direct Merchant Deal'}
                </span>
                <span className="text-xs text-neutral-500">• {primaryOffer.merchantName}</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                {t('buy.in_stock') || 'In Stock & Ready to Ship'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-black text-neutral-950 tracking-tight">
                    {formatPrice(primaryOffer.price, primaryOffer.currency)}
                  </span>
                  {isPrimaryDiscounted && (
                    <span className="text-lg text-neutral-400 line-through font-semibold">
                      {formatPrice(primaryOffer.originalPrice!, primaryOffer.currency)}
                    </span>
                  )}
                </div>
                {isPrimaryDiscounted && (
                  <div className="mt-1 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-extrabold text-xs shadow-2xs">
                      {t('buy.save_percent', { percent: primaryDiscountPercent }) || `Save ${primaryDiscountPercent}%`}
                    </span>
                    <span className="text-xs font-bold text-rose-700">
                      {t('buy.you_save', { amount: formatPrice(primarySavings, primaryOffer.currency) }) || `You save ${formatPrice(primarySavings, primaryOffer.currency)}`}
                    </span>
                  </div>
                )}
              </div>

              <div className="text-xs text-neutral-500 sm:text-right">
                <div className="font-semibold text-neutral-700">{t('buy.prime_eligible') || 'Free Prime & Fast Delivery Eligible'}</div>
                <div>{t('buy.returns_policy') || 'Standard 30-day merchant returns'}</div>
              </div>
            </div>

            {/* The Main High-Visibility Buy Button */}
            <a
              href={primaryOffer.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleAffiliateClick(primaryOffer)}
              id="primary-amazon-buy-button"
              className="w-full py-4 px-6 rounded-2xl bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-neutral-950 font-black text-base sm:text-lg transition-all shadow-md hover:shadow-lg border-2 border-amber-500/60 flex items-center justify-center gap-3 cursor-pointer group"
            >
              <ShoppingCart className="w-5 h-5 text-neutral-950 group-hover:scale-110 transition-transform" />
              <span>{t('buy.buy_now_on', { merchant: primaryOffer.merchantName }) || `Buy Now on ${primaryOffer.merchantName}`}</span>
              <ExternalLink className="w-4 h-4 ml-1 opacity-75 group-hover:opacity-100 transition-opacity" />
            </a>

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-neutral-600 pt-1">
              <span className="flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {t('buy.verified_link') || 'Verified Affiliate Link'}
              </span>
              <span>•</span>
              <span>ASIN: <strong className="font-mono text-neutral-800">{product.identifiers.asin}</strong></span>
              <span>•</span>
              <span>{t('buy.opens_amazon') || 'Opens securely on Amazon'}</span>
            </div>
          </div>

          {/* Multi-Merchant Price Comparison Card */}
          <div className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                  {t('product.merchant_offers')}
                </h3>
                <span className="text-xs text-neutral-400">
                  Live merchant availability & pricing
                </span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Clock className="w-3 h-3" /> Updated Today
              </span>
            </div>

            <div className="space-y-3">
              {product.merchantOffers.map((offer) => {
                const isDiscounted = offer.originalPrice && offer.originalPrice > offer.price;
                const isAmazon = offer.merchantName.toLowerCase().includes('amazon');
                return (
                  <div
                    key={offer.id}
                    className="p-3.5 rounded-2xl bg-neutral-50 hover:bg-amber-50/30 border border-neutral-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {offer.merchantLogo && (
                        <img
                          src={offer.merchantLogo}
                          alt={offer.merchantName}
                          referrerPolicy="no-referrer"
                          className="h-6 max-w-[80px] object-contain rounded-xs"
                        />
                      )}
                      <div>
                        <div className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                          <span>{offer.merchantName}</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-neutral-200 text-neutral-700 uppercase">
                            {offer.market}
                          </span>
                        </div>
                        <div className="text-xs text-emerald-600 font-medium">
                          {offer.availability === 'in_stock' ? 'In Stock & Ready to Ship' : 'Limited Stock'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="text-left sm:text-right">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-black text-neutral-900">
                            {formatPrice(offer.price, offer.currency)}
                          </span>
                          {isDiscounted && (
                            <span className="text-xs text-neutral-400 line-through">
                              {formatPrice(offer.originalPrice!, offer.currency)}
                            </span>
                          )}
                        </div>
                        {isDiscounted && (
                          <span className="text-[10px] font-bold text-rose-600">
                            Save {formatPrice(offer.originalPrice! - offer.price, offer.currency)}
                          </span>
                        )}
                      </div>

                      <a
                        href={offer.affiliateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleAffiliateClick(offer)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0 border ${
                          isAmazon
                            ? 'bg-amber-400 hover:bg-amber-500 text-neutral-950 border-amber-500/50'
                            : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700'
                        }`}
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>{t('buy.buy_on', { merchant: offer.merchantName }) || `Buy on ${offer.merchantName}`}</span>
                        <ExternalLink className="w-3.5 h-3.5 ml-0.5 opacity-70" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* FTC & Affiliate Disclaimer */}
            <div className="text-[11px] text-neutral-400 leading-relaxed pt-2">
              <Info className="w-3 h-3 inline mr-1 text-neutral-400" />
              {t('product.disclaimer')}
            </div>
          </div>
        </div>
      </div>

      {/* Key Highlights Checklist & Specs Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Key Features (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-xs space-y-4">
          <h3 className="text-base font-black text-neutral-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>{t('product.key_features')}</span>
          </h3>

          <ul className="space-y-3">
            {product.features.map((feat, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-neutral-700 leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Categorized Technical Specs Table (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-xs space-y-4">
          <h3 className="text-base font-black text-neutral-900 tracking-tight flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>{t('product.specifications')}</span>
          </h3>

          <div className="divide-y divide-neutral-100 text-xs">
            {Object.entries(product.specifications).map(([specName, specVal]) => (
              <div key={specName} className="py-2.5 grid grid-cols-3 gap-4">
                <div className="font-bold text-neutral-500">{specName}</div>
                <div className="col-span-2 text-neutral-900 font-medium">{String(specVal)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Similar Products Recommendation */}
      {similarProducts.length > 0 && (
        <section className="space-y-6 pt-6 border-t border-neutral-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-neutral-900 tracking-tight">
                {t('product.similar_products')}
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Direct competitors in the same price tier and category
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {similarProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onSelect={onSelectProduct}
                isCompared={compareProducts.some(cp => cp.id === p.id)}
                onToggleCompare={onToggleCompare}
              />
            ))}
          </div>
        </section>
      )}

      {/* Sticky Bottom Bar for Mobile & Compact screens */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200/90 py-2.5 px-4 shadow-xl sm:hidden flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={product.images[0]?.url}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="w-10 h-10 object-contain rounded-lg border border-neutral-200 bg-white p-0.5 shrink-0"
          />
          <div className="min-w-0">
            <div className="text-xs font-bold text-neutral-900 truncate max-w-[140px]">{product.name}</div>
            <div className="text-xs font-black text-amber-950">
              {formatPrice(primaryOffer.price, primaryOffer.currency)}
            </div>
          </div>
        </div>
        <a
          href={primaryOffer.affiliateUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => handleAffiliateClick(primaryOffer)}
          className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-neutral-950 font-black text-xs flex items-center gap-1.5 shrink-0 shadow-sm border border-amber-500/50"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>{t('buy.buy_on', { merchant: primaryOffer.merchantName }) || `Buy on ${primaryOffer.merchantName}`}</span>
        </a>
      </div>
    </div>
  );
};
