import React from 'react';
import { Scale, X, ArrowRight, Trash2 } from 'lucide-react';
import { Product } from '../types';
import { useI18n } from '../i18n/context';

interface CompareDrawerProps {
  compareProducts: Product[];
  onRemove: (productId: string) => void;
  onClear: () => void;
  onCompareNow: () => void;
}

export const CompareDrawer: React.FC<CompareDrawerProps> = ({
  compareProducts,
  onRemove,
  onClear,
  onCompareNow,
}) => {
  const { formatPrice, t } = useI18n();

  if (compareProducts.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-4 animate-in slide-in-from-bottom-5 duration-200">
      <div className="bg-neutral-900/95 text-white backdrop-blur-md rounded-2xl shadow-2xl border border-neutral-700/80 p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Indicator & counter */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-500/30">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold flex items-center gap-2">
              <span>{t('compare.title')}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-blue-500 text-white">
                {compareProducts.length}/4
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              {compareProducts.length === 1
                ? 'Select at least 1 more product to compare side-by-side'
                : 'Ready to analyze side-by-side technical specs'}
            </p>
          </div>
        </div>

        {/* Middle: Selected product thumbnails */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0">
          {compareProducts.map((p) => (
            <div
              key={p.id}
              className="group relative w-12 h-12 rounded-xl bg-white p-1 border border-neutral-600 flex items-center justify-center shrink-0"
            >
              <img
                src={p.images[0]?.url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=100&q=80'}
                alt={p.name}
                className="max-h-full max-w-full object-contain"
              />
              <button
                onClick={() => onRemove(p.id)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center text-xs shadow-xs transition-colors cursor-pointer"
                title="Remove"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {/* Empty slot placeholders */}
          {Array.from({ length: Math.max(0, 4 - compareProducts.length) }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="w-12 h-12 rounded-xl border border-dashed border-neutral-700 flex items-center justify-center text-neutral-600 text-xs font-medium shrink-0"
            >
              +
            </div>
          ))}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={onClear}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl text-xs transition-colors cursor-pointer"
            title="Clear all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onCompareNow}
            disabled={compareProducts.length < 2}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              compareProducts.length >= 2
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30'
                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
            }`}
          >
            <span>Compare ({compareProducts.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
