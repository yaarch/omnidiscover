import React, { useState } from 'react';
import { Percent, Sparkles, Filter, ShieldCheck, Tag, ArrowRight } from 'lucide-react';
import { Product } from '../../types';
import { useI18n } from '../../i18n/context';
import { ProductCard } from '../ProductCard';
import { db } from '../../services/db';

interface DealsViewProps {
  onSelectProduct: (productId: string) => void;
  compareProducts: Product[];
  onToggleCompare: (product: Product) => void;
}

export const DealsView: React.FC<DealsViewProps> = ({
  onSelectProduct,
  compareProducts,
  onToggleCompare,
}) => {
  const { formatPrice, t, market } = useI18n();
  const [selectedMerchant, setSelectedMerchant] = useState<string>('all');

  const allProducts = db.getProducts({});

  // Filter products with active price drops / discounts
  const dealProducts = allProducts.filter((product) => {
    return product.merchantOffers.some((offer) => {
      const isDiscounted = offer.originalPrice && offer.originalPrice > offer.price;
      const matchesMerchant = selectedMerchant === 'all' || offer.merchantId === selectedMerchant;
      return isDiscounted && matchesMerchant;
    });
  });

  const merchants = db.getMerchants();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Deals Hero */}
      <div className="bg-gradient-to-r from-rose-900 via-neutral-900 to-amber-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500 text-white">
            <Percent className="w-3.5 h-3.5" /> LIVE PRICE DROPS
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            Verified Deals & Multi-Merchant Discounts
          </h1>
          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
            Real-time price tracking across Amazon US, UK, DE, Best Buy, and major retail partners. We filter out fake inflated markdowns to highlight genuine savings.
          </p>
        </div>
      </div>

      {/* Filter by Merchant Bar */}
      <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-neutral-400" />
          <span className="text-xs font-bold text-neutral-700">Filter by Merchant:</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedMerchant('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedMerchant === 'all'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              All Stores
            </button>
            {merchants.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMerchant(m.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  selectedMerchant === m.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs font-semibold text-neutral-500">
          Showing <strong className="text-neutral-900">{dealProducts.length}</strong> active offers
        </div>
      </div>

      {/* Product Deals Grid */}
      {dealProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {dealProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
              isCompared={compareProducts.some((p) => p.id === product.id)}
              onToggleCompare={onToggleCompare}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-neutral-200/80">
          <p className="text-neutral-500 text-sm">
            No active discounts found for the selected merchant filter.
          </p>
        </div>
      )}
    </div>
  );
};
