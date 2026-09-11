import React, { useState } from 'react';
import {
  Scale,
  Plus,
  Trash2,
  X,
  Check,
  Star,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Layers,
  ArrowRight,
  Search,
  ShoppingCart
} from 'lucide-react';
import { Product } from '../../types';
import { useI18n } from '../../i18n/context';
import { db } from '../../services/db';

interface CompareViewProps {
  compareProducts: Product[];
  onAddProduct: (product: Product) => void;
  onRemoveProduct: (productId: string) => void;
  onClearCompare: () => void;
  onSelectProduct: (productId: string) => void;
}

export const CompareView: React.FC<CompareViewProps> = ({
  compareProducts,
  onAddProduct,
  onRemoveProduct,
  onClearCompare,
  onSelectProduct,
}) => {
  const { formatPrice, t, market, locale } = useI18n();
  const [highlightDifferences, setHighlightDifferences] = useState(false);
  const [searchPickerQuery, setSearchPickerQuery] = useState('');
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const allProducts = db.getProducts({});
  const availableToAdd = allProducts.filter(
    (p) => !compareProducts.some((cp) => cp.id === p.id)
  );

  const filteredPickerProducts = searchPickerQuery.trim()
    ? availableToAdd.filter(
        (p) =>
          p.name.toLowerCase().includes(searchPickerQuery.toLowerCase()) ||
          p.brandName.toLowerCase().includes(searchPickerQuery.toLowerCase())
      )
    : availableToAdd;

  // Gather all unique specification keys across selected products
  const allSpecKeys: string[] = Array.from(
    new Set<string>(
      compareProducts.flatMap((p) => Object.keys(p.specifications))
    )
  );

  const handleAffiliateClick = (product: Product) => {
    const offer = product.merchantOffers.find(o => o.market === market) || product.merchantOffers[0];
    if (!offer) return;

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

    window.open(offer.affiliateUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 mb-2">
            <Scale className="w-3.5 h-3.5" /> Technical Matrix Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
            {t('compare.title')}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            {t('compare.subtitle')} — compare up to 4 devices simultaneously
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {compareProducts.length > 1 && (
            <button
              onClick={() => setHighlightDifferences(!highlightDifferences)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                highlightDifferences
                  ? 'bg-amber-50 text-amber-900 border-amber-300 ring-2 ring-amber-200'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border-neutral-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Highlight Differences</span>
            </button>
          )}

          {compareProducts.length < 4 && (
            <button
              onClick={() => setIsPickerOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t('compare.add_product')}</span>
            </button>
          )}

          {compareProducts.length > 0 && (
            <button
              onClick={onClearCompare}
              className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              title="Clear Matrix"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Comparison Grid or Empty State */}
      {compareProducts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-neutral-200/80 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Scale className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-neutral-900">
            No devices selected for comparison
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto">
            {t('compare.empty')}
          </p>
          <div className="pt-2">
            <button
              onClick={() => setIsPickerOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Select Products to Compare
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/50">
                  <th className="p-4 sm:p-6 w-48 sm:w-64 text-xs font-black text-neutral-400 uppercase tracking-wider align-top">
                    Device Overview
                  </th>
                  {compareProducts.map((p) => (
                    <th key={p.id} className="p-4 sm:p-6 min-w-[220px] max-w-[280px] align-top relative">
                      <button
                        onClick={() => onRemoveProduct(p.id)}
                        className="absolute top-3 right-3 p-1 text-neutral-400 hover:text-rose-600 rounded-md hover:bg-neutral-100 transition-colors"
                        title="Remove"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      {/* Product Header Card */}
                      <div className="space-y-3">
                        <div className="h-32 bg-white rounded-xl p-2 border border-neutral-100 flex items-center justify-center">
                          <img
                            src={p.images[0]?.url}
                            alt={p.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            {p.brandName}
                          </span>
                          <h4
                            onClick={() => onSelectProduct(p.id)}
                            className="text-sm font-bold text-neutral-900 line-clamp-2 mt-1 hover:text-blue-600 cursor-pointer"
                          >
                            {p.name}
                          </h4>
                          <div className="text-lg font-black text-neutral-900 mt-1">
                            {formatPrice(p.price)}
                          </div>
                        </div>

                        {(() => {
                          const offer = p.merchantOffers.find(o => o.market === market) || p.merchantOffers[0];
                          const affiliateUrl = offer?.affiliateUrl || `https://www.amazon.com/dp/${p.identifiers.asin || ''}`;
                          const merchantName = offer?.merchantName || 'Amazon';
                          const isAmazon = merchantName.toLowerCase().includes('amazon');
                          return (
                            <a
                              href={affiliateUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => handleAffiliateClick(p)}
                              className={`w-full py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-xs border cursor-pointer ${
                                isAmazon
                                  ? 'bg-amber-400 hover:bg-amber-500 text-neutral-950 border-amber-500/50'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700'
                              }`}
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span>Buy on {merchantName}</span>
                              <ExternalLink className="w-3 h-3 opacity-70" />
                            </a>
                          );
                        })()}
                      </div>
                    </th>
                  ))}

                  {/* Placeholder column if less than 4 */}
                  {compareProducts.length < 4 && (
                    <th className="p-6 min-w-[180px] align-middle text-center bg-neutral-50/30 border-l border-neutral-100">
                      <button
                        onClick={() => setIsPickerOpen(true)}
                        className="p-4 rounded-2xl border-2 border-dashed border-neutral-300 hover:border-blue-500 hover:bg-blue-50/50 text-neutral-500 hover:text-blue-600 text-xs font-bold flex flex-col items-center gap-2 w-full transition-all cursor-pointer"
                      >
                        <Plus className="w-6 h-6" />
                        <span>Add Device</span>
                      </button>
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-neutral-100 text-xs">
                {/* Rating Row */}
                <tr className="hover:bg-neutral-50/40">
                  <td className="p-4 sm:p-5 font-bold text-neutral-500 bg-neutral-50/30">
                    Rating & Reviews
                  </td>
                  {compareProducts.map((p) => (
                    <td key={p.id} className="p-4 sm:p-5 text-neutral-900">
                      <div className="flex items-center gap-1 text-amber-600 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{p.rating} / 5</span>
                        <span className="text-neutral-400 font-normal">({p.reviewCount})</span>
                      </div>
                    </td>
                  ))}
                  {compareProducts.length < 4 && <td />}
                </tr>

                {/* Technical Specifications Rows */}
                {allSpecKeys.map((specKey) => {
                  const values = compareProducts.map((p) => p.specifications[specKey]);
                  const isDifferent = new Set(values.map((v) => String(v || ''))).size > 1;

                  return (
                    <tr
                      key={specKey}
                      className={`hover:bg-neutral-50/40 transition-colors ${
                        highlightDifferences && isDifferent ? 'bg-amber-50/60 font-semibold' : ''
                      }`}
                    >
                      <td className="p-4 sm:p-5 font-bold text-neutral-600 bg-neutral-50/30">
                        {specKey}
                      </td>
                      {compareProducts.map((p) => (
                        <td key={p.id} className="p-4 sm:p-5 text-neutral-900">
                          {p.specifications[specKey] ? (
                            <span>{p.specifications[specKey]}</span>
                          ) : (
                            <span className="text-neutral-300 font-mono">-</span>
                          )}
                        </td>
                      ))}
                      {compareProducts.length < 4 && <td />}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product Picker Modal */}
      {isPickerOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-neutral-200 space-y-4 max-h-[85vh] flex flex-col animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-base font-bold text-neutral-900">
                Add Product to Compare Matrix
              </h3>
              <button
                onClick={() => setIsPickerOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={searchPickerQuery}
                onChange={(e) => setSearchPickerQuery(e.target.value)}
                placeholder="Search by brand or product name..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-neutral-100 rounded-xl text-neutral-900 border border-neutral-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 pr-1 max-h-80">
              {filteredPickerProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-neutral-50 px-2 rounded-xl"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={prod.images[0]?.url}
                      alt={prod.name}
                      className="w-10 h-10 object-contain bg-white rounded-lg border border-neutral-200 p-1 flex-shrink-0"
                    />
                    <div className="truncate">
                      <div className="text-xs font-bold text-neutral-900 truncate">
                        {prod.name}
                      </div>
                      <div className="text-[11px] text-neutral-500 flex items-center gap-2">
                        <span>{prod.brandName}</span>
                        <span>•</span>
                        <span className="font-semibold text-neutral-800">{formatPrice(prod.price)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onAddProduct(prod);
                      setIsPickerOpen(false);
                      setSearchPickerQuery('');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shrink-0 cursor-pointer"
                  >
                    Select
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
