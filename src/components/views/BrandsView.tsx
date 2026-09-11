import React from 'react';
import { Tag, ArrowRight, ExternalLink } from 'lucide-react';
import { db } from '../../services/db';

interface BrandsViewProps {
  onSelectBrand: (brandSlug: string) => void;
}

export const BrandsView: React.FC<BrandsViewProps> = ({ onSelectBrand }) => {
  const brands = db.getBrands();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-xs">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 mb-3">
          <Tag className="w-3.5 h-3.5" /> Hardware Manufacturers Directory
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-neutral-900 tracking-tight">
          Global Brands & Partners
        </h1>
        <p className="text-sm text-neutral-500 mt-2 max-w-2xl">
          Direct access to certified tech manufacturer catalogs. All product models indexed with standardized specifications.
        </p>
      </div>

      {/* Brands Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {brands.map((brand) => {
          const productCount = db.getProducts({ brandIds: [brand.id] }).length;
          return (
            <div
              key={brand.id}
              className="bg-white rounded-3xl p-6 border border-neutral-200/80 hover:border-blue-400 hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center p-3 border border-neutral-200/60">
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                    {productCount} Products
                  </span>
                </div>

                <h3 className="text-lg font-bold text-neutral-900 mb-1">
                  {brand.name}
                </h3>
                <div className="text-xs text-neutral-400 font-medium mb-3">
                  Origin: {brand.country}
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed line-clamp-3">
                  {brand.description}
                </p>
              </div>

              <div className="pt-6 mt-4 border-t border-neutral-100">
                <button
                  onClick={() => onSelectBrand(brand.slug)}
                  className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-blue-600 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>View {brand.name} Products</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
