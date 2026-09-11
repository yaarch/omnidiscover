import React from 'react';
import { Star, Scale, ExternalLink, ShieldCheck, Check, Sparkles, ShoppingBag } from 'lucide-react';
import { Product } from '../types';
import { useI18n } from '../i18n/context';
import { db, toHighResAmazonImageUrl } from '../services/db';

interface ProductCardProps {
  product: Product;
  onSelect: (productId: string) => void;
  isCompared: boolean;
  onToggleCompare: (product: Product) => void;
  layout?: 'grid' | 'list';
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  isCompared,
  onToggleCompare,
  layout = 'grid',
}) => {
  const { formatPrice, t, market, locale } = useI18n();

  // Find relevant offer for current market or default first offer
  const primaryOffer = product.merchantOffers.find(o => o.market === market && o.status === 'active') || product.merchantOffers[0];
  const hasDiscount = primaryOffer?.originalPrice && primaryOffer.originalPrice > primaryOffer.price;
  const discountPercent = hasDiscount
    ? Math.round(((primaryOffer.originalPrice! - primaryOffer.price) / primaryOffer.originalPrice!) * 100)
    : 0;

  const handleAffiliateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Log affiliate click event
    db.logEvent({
      eventType: 'affiliate_click',
      entityId: product.id,
      entityName: product.name,
      merchantId: primaryOffer?.merchantId || 'direct',
      market,
      locale,
      metadata: {
        price: primaryOffer?.price || product.price,
        affiliateUrl: primaryOffer?.affiliateUrl || product.merchantOffers[0]?.affiliateUrl,
      },
    });

    if (primaryOffer?.affiliateUrl) {
      window.open(primaryOffer.affiliateUrl, '_blank', 'noopener,noreferrer');
    } else {
      onSelect(product.id);
    }
  };

  const rawPrimary = product.images.find(img => img.isPrimary)?.url || product.images[0]?.url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80';
  const primaryImage = toHighResAmazonImageUrl(rawPrimary);

  if (layout === 'list') {
    return (
      <div
        onClick={() => onSelect(product.id)}
        className="group bg-white rounded-2xl border border-neutral-200/80 hover:border-blue-400/80 p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-5 transition-all duration-200 hover:shadow-lg cursor-pointer relative"
      >
        {/* Product Image */}
        <div className="w-full sm:w-48 h-40 bg-neutral-50 rounded-xl p-3 flex items-center justify-center relative flex-shrink-0 border border-neutral-100 overflow-hidden">
          <img
            src={primaryImage}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {hasDiscount && (
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-rose-600 text-white shadow-xs">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Content Details */}
        <div className="flex-1 min-w-0 space-y-2 text-left w-full">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
              {product.brandName}
            </span>
            <div className="flex items-center gap-1 text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-md">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span>{product.rating}</span>
              <span className="text-neutral-400 font-normal">({product.reviewCount.toLocaleString()})</span>
            </div>
          </div>

          <h3 className="text-base font-bold text-neutral-900 group-hover:text-blue-600 transition-colors line-clamp-2">
            {product.name}
          </h3>

          <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
            {product.shortDescription || product.description}
          </p>

          {/* Quick specs pills */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {product.attributes.slice(0, 3).map((attr) => (
              <span
                key={attr.attributeSlug}
                className="text-[11px] font-medium text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-200/60"
              >
                {attr.name}: <strong className="text-neutral-800 font-semibold">{attr.displayValue}</strong>
              </span>
            ))}
          </div>
        </div>

        {/* Price & Actions */}
        <div className="w-full sm:w-48 flex sm:flex-col justify-between items-end sm:items-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-neutral-100 flex-shrink-0">
          <div className="text-left sm:text-right">
            <div className="text-xs text-neutral-400 font-medium">Best Offer</div>
            <div className="flex items-baseline gap-1.5 sm:justify-end">
              <span className="text-xl font-extrabold text-neutral-900">
                {formatPrice(primaryOffer?.price || product.price)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-neutral-400 line-through">
                  {formatPrice(primaryOffer!.originalPrice!)}
                </span>
              )}
            </div>
            {primaryOffer && (
              <div className="text-[11px] text-neutral-500">
                via <span className="font-semibold text-neutral-700">{primaryOffer.merchantName}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleCompare(product);
              }}
              title="Add to compare matrix"
              className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-center border transition-all cursor-pointer ${
                isCompared
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200'
              }`}
            >
              <Scale className="w-4 h-4" />
            </button>
            <a
              href={primaryOffer?.affiliateUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleAffiliateClick}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-black bg-amber-400 hover:bg-amber-500 text-neutral-950 transition-colors flex items-center justify-center gap-1.5 shadow-xs border border-amber-500/40 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Buy on {primaryOffer?.merchantName || 'Amazon'}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onSelect(product.id)}
      className="group bg-white rounded-2xl border border-neutral-200/80 hover:border-blue-400/80 p-4 flex flex-col justify-between transition-all duration-200 hover:shadow-lg cursor-pointer relative"
    >
      <div>
        {/* Top bar: Brand & Rating */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
            {product.brandName}
          </span>
          <div className="flex items-center gap-1 text-xs text-amber-600 font-semibold bg-amber-50/80 px-2 py-0.5 rounded-md">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            <span>{product.rating}</span>
            <span className="text-neutral-400 font-normal text-[11px]">({product.reviewCount.toLocaleString()})</span>
          </div>
        </div>

        {/* Product Image Area */}
        <div className="w-full h-44 bg-neutral-50/80 rounded-xl p-3 flex items-center justify-center relative mb-4 border border-neutral-100 overflow-hidden">
          <img
            src={primaryImage}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {hasDiscount && (
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-rose-600 text-white shadow-xs">
              -{discountPercent}%
            </span>
          )}

          {/* Quick Compare Button on Top Right */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleCompare(product);
            }}
            title={isCompared ? 'Remove from compare' : 'Add to compare'}
            className={`absolute top-2 right-2 p-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer ${
              isCompared
                ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                : 'bg-white/90 hover:bg-white text-neutral-600 hover:text-neutral-900 border border-neutral-200'
            }`}
          >
            {isCompared ? <Check className="w-4 h-4" /> : <Scale className="w-4 h-4" />}
          </button>
        </div>

        {/* Title & Short description */}
        <h3 className="text-sm font-bold text-neutral-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-1.5 leading-snug">
          {product.name}
        </h3>
        <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed mb-3">
          {product.shortDescription || product.description}
        </p>

        {/* Attributes Tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {product.attributes.slice(0, 2).map((attr) => (
            <span
              key={attr.attributeSlug}
              className="text-[10px] font-medium text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200/50"
            >
              {attr.name}: <strong className="text-neutral-800">{attr.displayValue}</strong>
            </span>
          ))}
        </div>
      </div>

      {/* Footer / Price & CTA */}
      <div className="pt-3 border-t border-neutral-100 mt-auto">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
              From
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-neutral-900">
                {formatPrice(primaryOffer?.price || product.price)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-neutral-400 line-through">
                  {formatPrice(primaryOffer!.originalPrice!)}
                </span>
              )}
            </div>
          </div>
          {primaryOffer && (
            <span className="text-[11px] text-neutral-500 font-medium bg-neutral-50 px-2 py-1 rounded-md border border-neutral-200/50">
              {primaryOffer.merchantName}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onSelect(product.id)}
            className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-colors flex items-center justify-center cursor-pointer"
          >
            {t('card.view_details')}
          </button>
          <a
            href={primaryOffer?.affiliateUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleAffiliateClick}
            className="w-full py-2 px-2.5 rounded-xl text-xs font-black bg-amber-400 hover:bg-amber-500 text-neutral-950 transition-colors flex items-center justify-center gap-1 shadow-xs border border-amber-500/40 cursor-pointer text-center truncate"
          >
            <span className="truncate">Buy on {primaryOffer?.merchantName || 'Amazon'}</span>
            <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
          </a>
        </div>
      </div>
    </div>
  );
};
