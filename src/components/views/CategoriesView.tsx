import React, { useState } from 'react';
import {
  Layers,
  Headphones,
  Laptop,
  Coffee,
  Camera,
  ArrowRight,
  ShoppingBag,
  Smartphone,
  Watch,
  Gamepad2,
  Utensils,
  Dumbbell,
  Monitor,
  Flame,
  Sparkle,
  Sparkles,
  Zap,
  Home,
  Search,
  Filter,
  Tv,
  Car,
  Luggage,
  Music,
  Tablet,
  Glasses
} from 'lucide-react';
import { db } from '../../services/db';
import { useI18n } from '../../i18n/context';

interface CategoriesViewProps {
  onSelectCategory: (categoryId: string) => void;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({ onSelectCategory }) => {
  const { t, locale } = useI18n();
  const [searchTerm, setSearchTerm] = useState('');
  const categories = db.getCategories();
  const topLevelCategories = categories.filter(c => !c.parentId);

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'audio':
        return Headphones;
      case 'laptops':
      case 'computing':
      case 'electronics':
        return Laptop;
      case 'smartphones':
        return Smartphone;
      case 'tablets-ereaders':
        return Tablet;
      case 'power-chargers':
      case 'pc-components':
        return Zap;
      case 'tv-home-cinema':
      case 'oled-4k-tvs':
      case 'soundbars-surround':
      case 'projectors-streaming':
        return Tv;
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
      case 'smart-home':
        return Home;
      case 'wearables':
      case 'smartwatches-gps':
      case 'smart-rings':
        return Watch;
      case 'gaming':
      case 'gaming-consoles':
      case 'gaming-peripherals':
        return Gamepad2;
      case 'vr-mixed-reality':
        return Glasses;
      case 'cameras':
      case 'camera-drones':
      case 'action-cameras':
        return Camera;
      case 'fitness-outdoors':
      case 'home-gym-equipment':
      case 'electric-bikes-scooters':
        return Dumbbell;
      case 'beauty-grooming':
      case 'hair-styling-tech':
      case 'electric-shavers':
        return Sparkle;
      case 'office-workspace':
      case 'pro-monitors-ultrawide':
      case 'ergonomic-chairs-desks':
        return Monitor;
      case 'automotive-ev':
      case 'dash-cams':
        return Car;
      case 'travel-luggage':
        return Luggage;
      case 'musical-studio':
        return Music;
      default:
        return ShoppingBag;
    }
  };

  const filteredCategories = topLevelCategories.filter((cat) => {
    const name = cat.localizedNames?.[locale] || cat.name;
    const subcats = db.getSubcategories(cat.id);
    const matchesCat = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSub = subcats.some(s => {
      const sName = s.localizedNames?.[locale] || s.name;
      return sName.toLowerCase().includes(searchTerm.toLowerCase());
    });
    return matchesCat || matchesSub;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 mb-3">
            <Layers className="w-3.5 h-3.5" /> Structured Catalog Taxonomy
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-neutral-900 tracking-tight">
            {t('section.popular_categories') || 'Product Categories & Taxonomies'}
          </h1>
          <p className="text-sm text-neutral-500 mt-2">
            Browse through our standardized global catalog. Every product is normalized into standardized technical attributes for transparent evaluation.
          </p>
        </div>

        {/* Quick Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter categories or departments..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs font-medium text-neutral-800 placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
          />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((category) => {
          const Icon = getCategoryIcon(category.slug);
          const subcategories = db.getSubcategories(category.id);
          const productsInCat = db.getProducts({ categoryId: category.id });
          const catName = category.localizedNames?.[locale] || category.name;

          return (
            <div
              key={category.id}
              className="bg-white rounded-3xl p-6 border border-neutral-200/80 hover:border-blue-400 hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-neutral-100 text-neutral-600">
                    {productsInCat.length} Products
                  </span>
                </div>

                <h3 className="text-lg font-bold text-neutral-900 mb-1">
                  {catName}
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed mb-4">
                  {category.description}
                </p>

                {/* Subcategories list */}
                {subcategories.length > 0 && (
                  <div className="space-y-1.5 pt-3 border-t border-neutral-100">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                      Subcategories
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {subcategories.map((sub) => {
                        const subName = sub.localizedNames?.[locale] || sub.name;
                        return (
                          <button
                            key={sub.id}
                            onClick={() => onSelectCategory(sub.id)}
                            className="px-2.5 py-1 rounded-lg bg-neutral-50 hover:bg-blue-50 text-neutral-700 hover:text-blue-700 text-xs font-semibold transition-colors cursor-pointer border border-neutral-200/60"
                          >
                            {subName}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-6 mt-4 border-t border-neutral-100">
                <button
                  onClick={() => onSelectCategory(category.id)}
                  className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-blue-600 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>Explore {catName}</span>
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
