import React, { useState } from 'react';
import {
  Compass,
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  Percent,
  Scale,
  Sparkles,
  Headphones,
  Laptop,
  Coffee,
  Camera,
  Star,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Layers,
  Search,
  Check,
  Smartphone,
  Watch,
  Gamepad2,
  Utensils,
  Dumbbell,
  Monitor,
  Flame,
  Sparkle,
  Tv,
  Car,
  Luggage,
  Music,
  Tablet,
  Glasses
} from 'lucide-react';
import { Product, Category, Brand, Comparison } from '../../types';
import { useI18n } from '../../i18n/context';
import { ProductCard } from '../ProductCard';
import { db } from '../../services/db';

interface HomeViewProps {
  onNavigate: (view: string, param?: string) => void;
  onSelectProduct: (productId: string) => void;
  compareProducts: Product[];
  onToggleCompare: (product: Product) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  onSelectProduct,
  compareProducts,
  onToggleCompare,
}) => {
  const { t, formatPrice, market, locale } = useI18n();
  const [heroSearch, setHeroSearch] = useState('');

  const categories = db.getCategories().filter(c => !c.parentId);
  const featuredProducts = db.getProducts({}).slice(0, 8);
  const brands = db.getBrands().slice(0, 6);
  const comparisons = db.getComparisons().slice(0, 4);

  // Deals: products with discounted offers
  const dealProducts = db.getProducts({}).filter(p => {
    return p.merchantOffers.some(o => o.originalPrice && o.originalPrice > o.price);
  }).slice(0, 4);

  const handleHeroSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      onNavigate('products', heroSearch.trim());
    }
  };

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'audio':
        return Headphones;
      case 'laptops':
      case 'computing':
        return Laptop;
      case 'smartphones':
        return Smartphone;
      case 'power-chargers':
        return Zap;
      case 'home-kitchen':
      case 'kitchen':
        return Utensils;
      case 'coffee-espresso':
      case 'coffee-appliances':
        return Coffee;
      case 'smart-cookware':
        return Flame;
      case 'robot-vacuums':
        return Sparkles;
      case 'wearables':
      case 'smartwatches-gps':
        return Watch;
      case 'gaming':
      case 'gaming-consoles':
        return Gamepad2;
      case 'cameras':
        return Camera;
      case 'fitness-outdoors':
        return Dumbbell;
      case 'beauty-grooming':
        return Sparkle;
      case 'office-workspace':
      case 'pro-monitors-ultrawide':
      case 'ergonomic-chairs-desks':
        return Monitor;
      case 'tv-home-cinema':
      case 'oled-4k-tvs':
      case 'soundbars-surround':
      case 'projectors-streaming':
        return Tv;
      case 'tablets-ereaders':
        return Tablet;
      case 'smart-rings':
        return Watch;
      case 'vr-mixed-reality':
        return Glasses;
      case 'camera-drones':
      case 'action-cameras':
        return Camera;
      case 'home-gym-equipment':
      case 'electric-bikes-scooters':
        return Dumbbell;
      case 'hair-styling-tech':
      case 'electric-shavers':
        return Sparkle;
      case 'automotive-ev':
      case 'dash-cams':
        return Car;
      case 'travel-luggage':
        return Luggage;
      case 'musical-studio':
        return Music;
      default:
        return Layers;
    }
  };

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section with High-Contrast Clear Layout */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-900 via-indigo-950 to-neutral-900 text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8 rounded-3xl mx-2 sm:mx-6 mt-4 shadow-2xl">
        {/* Subtle background mesh glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-blue-200 backdrop-blur-xs border border-white/15">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span>{t('hero.badge')}</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight sm:leading-none">
            {t('hero.title')}
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-neutral-300 max-w-3xl mx-auto font-normal leading-relaxed">
            {t('hero.subtitle')}
          </p>

          {/* Hero Instant Search */}
          <div className="max-w-2xl mx-auto pt-4">
            <form onSubmit={handleHeroSearchSubmit} className="relative flex items-center">
              <Search className="absolute left-4.5 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                placeholder="Search Sony WH-1000XM5, M3 Max MacBook, Breville Barista..."
                className="w-full pl-12 pr-32 py-4 rounded-2xl bg-white text-neutral-900 placeholder-neutral-400 text-sm sm:text-base font-medium shadow-2xl focus:outline-hidden focus:ring-4 focus:ring-blue-500/30"
              />
              <button
                type="submit"
                className="absolute right-2.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <span>Discover</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick popular search tags */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs text-neutral-400">
              <span className="font-semibold text-neutral-300">Popular:</span>
              {['Noise Cancelling', 'OLED', 'Spatial Audio', 'Apple M3 Max', 'Espresso', '4K Video'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => onNavigate('products', tag)}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-200 transition-colors cursor-pointer text-xs"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Key Value Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-white/10 max-w-4xl mx-auto text-left">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-white">Verified Benchmarks</div>
                <div className="text-[11px] text-neutral-400">Lab-tested specs only</div>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Scale className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-white">Side-by-Side Matrix</div>
                <div className="text-[11px] text-neutral-400">Direct parameter diffs</div>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <TrendingUp className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-white">Multi-Merchant Prices</div>
                <div className="text-[11px] text-neutral-400">Live stock & offers</div>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-white">Zero Sponsored Bias</div>
                <div className="text-[11px] text-neutral-400">100% independent</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-neutral-900 tracking-tight">
              {t('section.popular_categories')}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1">
              Explore curated product categories with verified technical attributes
            </p>
          </div>
          <button
            onClick={() => onNavigate('categories')}
            className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            <span>View All Categories</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((category) => {
            const Icon = getCategoryIcon(category.slug);
            const count = db.getProducts({ categoryId: category.id }).length;
            return (
              <button
                key={category.id}
                onClick={() => onNavigate('products', category.id)}
                className="group text-left p-5 rounded-2xl bg-white border border-neutral-200/80 hover:border-blue-500 hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center mb-4 transition-colors">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-neutral-900 group-hover:text-blue-600 transition-colors">
                  {category.localizedNames?.[locale] || category.name}
                </h3>
                <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                  {category.description}
                </p>
                <div className="mt-4 flex items-center justify-between text-xs font-semibold text-neutral-400 group-hover:text-blue-600">
                  <span>{count} Products</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Featured Discoveries */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500 fill-amber-400" />
              <h2 className="text-2xl font-black text-neutral-900 tracking-tight">
                {t('section.featured_products')}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1">
              Top-rated consumer electronics and audio gear reviewed by specifications
            </p>
          </div>
          <button
            onClick={() => onNavigate('products')}
            className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            <span>Explore Catalog</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
              isCompared={compareProducts.some(p => p.id === product.id)}
              onToggleCompare={onToggleCompare}
            />
          ))}
        </div>
      </section>

      {/* Today's Best Deals & Price Drops */}
      {dealProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 rounded-3xl p-6 sm:p-8 border border-rose-200/80 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white mb-2">
                  <Percent className="w-3.5 h-3.5" /> TODAY&apos;S PRICE DROPS
                </div>
                <h2 className="text-2xl font-black text-neutral-900 tracking-tight">
                  Verified Merchant Discounts & Deals
                </h2>
                <p className="text-xs sm:text-sm text-neutral-600 mt-1">
                  Real-time price comparisons with confirmed stock availability
                </p>
              </div>
              <button
                onClick={() => onNavigate('deals')}
                className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
              >
                View All Deals
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {dealProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={onSelectProduct}
                  isCompared={compareProducts.some(p => p.id === product.id)}
                  onToggleCompare={onToggleCompare}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Head-to-Head Comparisons */}
      {comparisons.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-blue-600" />
                <h2 className="text-2xl font-black text-neutral-900 tracking-tight">
                  {t('section.popular_comparisons')}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                Objective specification battles between flagship products
              </p>
            </div>
            <button
              onClick={() => onNavigate('compare')}
              className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Build Custom Compare</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {comparisons.map((comp) => {
              const p1 = db.getProductById(comp.productIds[0]);
              const p2 = db.getProductById(comp.productIds[1]);
              if (!p1 || !p2) return null;

              return (
                <div
                  key={comp.id}
                  onClick={() => {
                    // Set compare items and navigate
                    onToggleCompare(p1);
                    onToggleCompare(p2);
                    onNavigate('compare');
                  }}
                  className="group bg-white rounded-2xl border border-neutral-200/80 hover:border-blue-500 p-5 transition-all duration-200 hover:shadow-lg cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                      Head-to-Head
                    </span>
                    <span className="text-xs font-semibold text-neutral-400">
                      Verified Side-by-Side Analysis
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-neutral-900 group-hover:text-blue-600 transition-colors mb-4">
                    {comp.title}
                  </h3>

                  {/* Products VS Row */}
                  <div className="grid grid-cols-2 gap-4 items-center bg-neutral-50 p-4 rounded-xl relative border border-neutral-100">
                    <div className="text-center space-y-1">
                      <div className="h-20 flex items-center justify-center">
                        <img
                          src={p1.images[0]?.url}
                          alt={p1.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div className="text-xs font-bold text-neutral-900 line-clamp-1">{p1.name}</div>
                      <div className="text-xs font-extrabold text-blue-600">{formatPrice(p1.price)}</div>
                    </div>

                    {/* VS Badge */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-neutral-900 text-white text-[11px] font-black flex items-center justify-center shadow-md">
                      VS
                    </div>

                    <div className="text-center space-y-1">
                      <div className="h-20 flex items-center justify-center">
                        <img
                          src={p2.images[0]?.url}
                          alt={p2.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div className="text-xs font-bold text-neutral-900 line-clamp-1">{p2.name}</div>
                      <div className="text-xs font-extrabold text-blue-600">{formatPrice(p2.price)}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs font-bold text-blue-600">
                    <span>Explore Full Specs Comparison</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Top Global Brands */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-neutral-900 tracking-tight">
              {t('section.popular_brands')}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1">
              Direct access to premium brand hardware specifications
            </p>
          </div>
          <button
            onClick={() => onNavigate('brands')}
            className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            <span>All Brands</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {brands.map((brand) => (
            <button
              key={brand.id}
              onClick={() => onNavigate('products', brand.slug)}
              className="group p-4 bg-white rounded-2xl border border-neutral-200/80 hover:border-blue-400 text-center transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col items-center justify-center space-y-2"
            >
              <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center p-2 group-hover:scale-105 transition-transform">
                <img
                  src={brand.logo}
                  alt={brand.name}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="text-sm font-bold text-neutral-900 group-hover:text-blue-600 transition-colors">
                {brand.name}
              </div>
              <div className="text-[11px] text-neutral-400">
                {brand.country}
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
