import React, { useState, useMemo, useEffect } from 'react';
import {
  Filter,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Search,
  X,
  Star,
  Check,
  ChevronDown,
  RotateCcw,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Product, Category, Brand } from '../../types';
import { useI18n } from '../../i18n/context';
import { ProductCard } from '../ProductCard';
import { db } from '../../services/db';
import { isAmazonLink } from '../../services/amazonParser';
import { AmazonImportModal } from '../AmazonImportModal';
import { adminAuth } from '../../services/adminAuth';

interface ProductsViewProps {
  initialSearchOrCategory?: string;
  onSelectProduct: (productId: string) => void;
  compareProducts: Product[];
  onToggleCompare: (product: Product) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  initialSearchOrCategory,
  onSelectProduct,
  compareProducts,
  onToggleCompare,
}) => {
  const { t, formatPrice, locale } = useI18n();

  // Admin authorization state
  const [isAdminAuth, setIsAdminAuth] = useState(() => adminAuth.isAuthenticated());

  useEffect(() => {
    const unsub = adminAuth.subscribe(() => {
      setIsAdminAuth(adminAuth.isAuthenticated());
    });
    return unsub;
  }, []);

  // Check if initial param is a category ID, brand slug, or search term
  const categories = db.getCategories();
  const brands = db.getBrands();

  const isInitialCat = categories.find(c => c.id === initialSearchOrCategory || c.slug === initialSearchOrCategory);
  const isInitialBrand = brands.find(b => b.slug === initialSearchOrCategory || b.name.toLowerCase() === initialSearchOrCategory?.toLowerCase());

  const [searchQuery, setSearchQuery] = useState(
    !isInitialCat && !isInitialBrand ? (initialSearchOrCategory || '') : ''
  );
  const [selectedCategory, setSelectedCategory] = useState<string>(isInitialCat ? isInitialCat.id : '');
  const [selectedBrand, setSelectedBrand] = useState<string>(isInitialBrand ? isInitialBrand.id : '');
  const [minRating, setMinRating] = useState<number>(0);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 4000]);
  const [sortBy, setSortBy] = useState<'relevance' | 'price_asc' | 'price_desc' | 'rating_desc' | 'newest'>('relevance');
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch all products with current filters
  const filteredProducts = useMemo(() => {
    let result = db.getProducts({
      categoryId: selectedCategory || undefined,
      brandIds: selectedBrand ? [selectedBrand] : undefined,
      searchQuery: isAmazonLink(searchQuery) ? undefined : (searchQuery || undefined),
      minRating: minRating > 0 ? minRating : undefined,
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < 4000 ? priceRange[1] : undefined,
      inStockOnly: inStockOnly ? true : undefined,
      sortBy: sortBy,
    });
    return result;
  }, [searchQuery, selectedCategory, selectedBrand, minRating, inStockOnly, priceRange, sortBy, refreshTrigger]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedBrand('');
    setMinRating(0);
    setInStockOnly(false);
    setPriceRange([0, 4000]);
    setSortBy('relevance');
  };

  const hasActiveFilters = searchQuery || selectedCategory || selectedBrand || minRating > 0 || inStockOnly || priceRange[0] > 0 || priceRange[1] < 4000;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header & Search Bar */}
      <div className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
              {selectedCategory
                ? categories.find(c => c.id === selectedCategory)?.name || 'Products Catalog'
                : selectedBrand
                ? `${brands.find(b => b.id === selectedBrand)?.name} Hardware Catalog`
                : 'Verified Product Catalog'}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1">
              Showing <span className="font-bold text-neutral-800">{filteredProducts.length}</span> lab-verified products with multi-merchant live pricing
            </p>
          </div>

          {/* Controls: Search in catalog & View toggles */}
          <div className="flex items-center gap-3">
            {isAdminAuth && (
              <button
                onClick={() => {
                  setImportUrl('');
                  setIsImportModalOpen(true);
                }}
                className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300/90 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs"
                title="Admin: Import Product from Amazon"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">+ Import Amazon</span>
                <span className="sm:hidden">+ Import</span>
              </button>
            )}

            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAdminAuth ? "Filter catalog or paste Amazon URL..." : "Search products, models, or brands..."}
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-neutral-100 rounded-xl text-neutral-900 border border-transparent focus:bg-white focus:border-blue-500 focus:outline-hidden"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="hidden sm:flex items-center bg-neutral-100 p-1 rounded-xl border border-neutral-200/60">
              <button
                onClick={() => setLayout('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  layout === 'grid' ? 'bg-white text-blue-600 shadow-2xs font-bold' : 'text-neutral-500 hover:text-neutral-800'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setLayout('list')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  layout === 'list' ? 'bg-white text-blue-600 shadow-2xs font-bold' : 'text-neutral-500 hover:text-neutral-800'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
              className="md:hidden px-3 py-2 bg-neutral-100 text-neutral-800 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-neutral-200"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Amazon Link Quick Detection Alert in Products Catalog (Admin Only) */}
        {isAdminAuth && isAmazonLink(searchQuery) && (
          <div className="mt-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-neutral-900">Admin: Amazon Product Link Detected</div>
                <div className="text-[11px] text-amber-900">
                  Click to extract ASIN & specs, attach affiliate tags, and add to the catalog.
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setImportUrl(searchQuery);
                setIsImportModalOpen(true);
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <span>Import This Product</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Active Filters Row & Sort */}
        <div className="mt-4 pt-4 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-neutral-400">Active Filters:</span>
            {selectedCategory && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                Category: {categories.find(c => c.id === selectedCategory)?.localizedNames?.[locale] || categories.find(c => c.id === selectedCategory)?.name}
                <button onClick={() => setSelectedCategory('')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {selectedBrand && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Brand: {brands.find(b => b.id === selectedBrand)?.name}
                <button onClick={() => setSelectedBrand('')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {minRating > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                Rating: {minRating}+ Stars
                <button onClick={() => setMinRating(0)}><X className="w-3 h-3" /></button>
              </span>
            )}
            {inStockOnly && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                In-Stock Only
                <button onClick={() => setInStockOnly(false)}><X className="w-3 h-3" /></button>
              </span>
            )}
            {(priceRange[0] > 0 || priceRange[1] < 4000) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-neutral-100 text-neutral-800 border border-neutral-200">
                Price: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                <button onClick={() => setPriceRange([0, 4000])}><X className="w-3 h-3" /></button>
              </span>
            )}

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 ml-2 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                {t('filter.clear_all')}
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 font-medium">{t('filter.sort_by')}:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 py-1.5 px-3 rounded-xl border border-neutral-200 cursor-pointer focus:outline-hidden"
            >
              <option value="relevance">{t('filter.sort.relevance')}</option>
              <option value="price_asc">{t('filter.sort.price_asc')}</option>
              <option value="price_desc">{t('filter.sort.price_desc')}</option>
              <option value="rating_desc">{t('filter.sort.rating_desc')}</option>
              <option value="newest">{t('filter.sort.newest')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid with Sidebar Filter Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Desktop Sidebar Filter */}
        <aside className="hidden md:block md:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2 font-bold text-sm text-neutral-900">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                <span>Filters & Facets</span>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Categories */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">
                {t('filter.all_categories')}
              </h4>
              <div className="space-y-1.5">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-between ${
                    selectedCategory === '' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  <span>All Categories</span>
                  <span className="text-[11px] text-neutral-400">{db.getProducts({}).length}</span>
                </button>
                {categories.map((cat) => {
                  const count = db.getProducts({ categoryId: cat.id }).length;
                  const catDisplayName = cat.localizedNames?.[locale] || cat.name;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id === selectedCategory ? '' : cat.id)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center justify-between ${
                        selectedCategory === cat.id ? 'bg-blue-50 text-blue-700 font-bold' : 'text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      <span className="truncate">{catDisplayName}</span>
                      <span className="text-[11px] text-neutral-400">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Brands */}
            <div className="pt-4 border-t border-neutral-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">
                {t('filter.brands')}
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {brands.map((b) => (
                  <label
                    key={b.id}
                    className="flex items-center justify-between text-xs text-neutral-700 hover:bg-neutral-50 p-1 rounded-md cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="brandFilter"
                        checked={selectedBrand === b.id}
                        onChange={() => setSelectedBrand(selectedBrand === b.id ? '' : b.id)}
                        className="text-blue-600 rounded-sm"
                      />
                      <span>{b.name}</span>
                    </div>
                    <span className="text-[11px] text-neutral-400">
                      {db.getProducts({ brandIds: [b.id] }).length}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Slider */}
            <div className="pt-4 border-t border-neutral-100">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  {t('filter.price_range')}
                </h4>
                <span className="text-xs font-bold text-neutral-800">
                  Up to {formatPrice(priceRange[1])}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="4000"
                step="50"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value, 10)])}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-neutral-400 mt-1 font-mono">
                <span>{formatPrice(0)}</span>
                <span>{formatPrice(4000)}</span>
              </div>
            </div>

            {/* Rating Filter */}
            <div className="pt-4 border-t border-neutral-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                {t('filter.min_rating')}
              </h4>
              <div className="space-y-1">
                {[4.5, 4.0, 3.5].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setMinRating(minRating === rate ? 0 : rate)}
                    className={`w-full text-left px-2 py-1 rounded-md text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      minRating === rate ? 'bg-amber-50 text-amber-900 font-bold' : 'text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{rate} & above</span>
                    </div>
                    {minRating === rate && <Check className="w-3.5 h-3.5 text-amber-600" />}
                  </button>
                ))}
              </div>
            </div>

            {/* In-Stock Toggle */}
            <div className="pt-4 border-t border-neutral-100">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-bold text-neutral-700">{t('filter.in_stock_only')}</span>
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded-sm cursor-pointer"
                />
              </label>
            </div>
          </div>
        </aside>

        {/* Product Results */}
        <main className="md:col-span-3">
          {filteredProducts.length > 0 ? (
            <div className={layout === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={onSelectProduct}
                  isCompared={compareProducts.some(p => p.id === product.id)}
                  onToggleCompare={onToggleCompare}
                  layout={layout}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-neutral-200/80 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
                <Search className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-neutral-800">
                No products match your specific filter criteria
              </h3>
              <p className="text-sm text-neutral-500 max-w-md mx-auto">
                Try clearing selected categories, expanding the price range slider, or searching for broader terms.
              </p>
              <button
                onClick={clearAllFilters}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Catalog Amazon Import Modal (Admin Only) */}
      {isAdminAuth && (
        <AmazonImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          initialUrl={importUrl}
          onProductAdded={(newProd) => {
            setIsImportModalOpen(false);
            setRefreshTrigger((c) => c + 1);
            onSelectProduct(newProd.id);
          }}
        />
      )}
    </div>
  );
};
