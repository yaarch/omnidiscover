import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  Search,
  Layers,
  Scale,
  Percent,
  SlidersHorizontal,
  Globe,
  Menu,
  X,
  ChevronDown,
  ExternalLink,
  ShieldCheck,
  Tag,
  Sparkles,
  Laptop,
  Headphones,
  Coffee,
  Camera,
  ShoppingBag,
  ArrowRight,
  Lock,
  Shield,
  Info
} from 'lucide-react';
import { useI18n, SUPPORTED_LOCALES } from '../i18n/context';
import { LanguageCode, MarketCode, CurrencyCode, Product } from '../types';
import { db } from '../services/db';
import { isAmazonLink } from '../services/amazonParser';
import { AmazonImportModal } from './AmazonImportModal';
import { adminAuth } from '../services/adminAuth';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
  compareCount: number;
  onOpenCompare: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  compareCount,
  onOpenCompare,
}) => {
  const { locale, setLocale, market, setMarket, currency, setCurrency, formatPrice, t, direction } = useI18n();
  const [isAdminAuth, setIsAdminAuth] = useState(() => adminAuth.isAuthenticated());
  const [adminConfig, setAdminConfig] = useState(() => adminAuth.getConfig());

  useEffect(() => {
    const unsub = adminAuth.subscribe(() => {
      setIsAdminAuth(adminAuth.isAuthenticated());
      setAdminConfig(adminAuth.getConfig());
    });
    return unsub;
  }, []);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isLocaleDropdownOpen, setIsLocaleDropdownOpen] = useState(false);
  const [isMarketDropdownOpen, setIsMarketDropdownOpen] = useState(false);
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importInitialUrl, setImportInitialUrl] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const localeRef = useRef<HTMLDivElement>(null);
  const marketRef = useRef<HTMLDivElement>(null);
  const deptDropdownRef = useRef<HTMLDivElement>(null);

  // Secret Triple-click on logo to open admin
  const logoClickCountRef = useRef(0);
  const logoClickTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogoClick = (e: React.MouseEvent) => {
    logoClickCountRef.current += 1;
    if (logoClickTimerRef.current) clearTimeout(logoClickTimerRef.current);

    if (logoClickCountRef.current >= 3) {
      logoClickCountRef.current = 0;
      onNavigate('admin');
      return;
    }

    logoClickTimerRef.current = setTimeout(() => {
      if (logoClickCountRef.current === 1) {
        onNavigate('home');
      }
      logoClickCountRef.current = 0;
    }, 400);
  };

  // Global search shortcut '/'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsLocaleDropdownOpen(false);
        setIsMarketDropdownOpen(false);
        setIsDeptDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Search autocomplete query
  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const results = db.getProducts({ searchQuery: searchQuery.trim() });
      setSearchResults(results.slice(0, 6));
      setIsSearchOpen(true);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (localeRef.current && !localeRef.current.contains(e.target as Node)) {
        setIsLocaleDropdownOpen(false);
      }
      if (marketRef.current && !marketRef.current.contains(e.target as Node)) {
        setIsMarketDropdownOpen(false);
      }
      if (deptDropdownRef.current && !deptDropdownRef.current.contains(e.target as Node)) {
        setIsDeptDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchResultClick = (productId: string) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    onNavigate('product', productId);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      onNavigate('products', searchQuery.trim());
    }
  };

  const navLinks = [
    { id: 'home', label: t('nav.home') || 'Home', icon: Compass },
    { id: 'products', label: t('nav.products') || 'Products', icon: Layers },
    { id: 'categories', label: t('nav.categories') || 'Categories', icon: ShoppingBag },
    { id: 'deals', label: t('nav.deals') || 'Deals', icon: Percent, badge: 'HOT' },
    { id: 'compare', label: t('nav.compare') || 'Compare', icon: Scale, count: compareCount },
    { id: 'brands', label: t('nav.brands') || 'Brands', icon: Tag },
    { id: 'about', label: 'About', icon: Info },
  ];

  const marketOptions: { market: MarketCode; currency: CurrencyCode; label: string; flag: string }[] = [
    { market: 'US', currency: 'USD', label: 'United States', flag: '🇺🇸' },
    { market: 'UK', currency: 'GBP', label: 'United Kingdom', flag: '🇬🇧' },
    { market: 'DE', currency: 'EUR', label: 'Deutschland (EU)', flag: '🇩🇪' },
    { market: 'FR', currency: 'EUR', label: 'France (EU)', flag: '🇫🇷' },
    { market: 'JP', currency: 'JPY', label: 'Japan (日本)', flag: '🇯🇵' },
    { market: 'CA', currency: 'CAD', label: 'Canada', flag: '🇨🇦' },
  ];

  const topDepartments = db.getCategories().filter((c) => !c.parentId);

  const quickDepartmentChips = [
    { id: 'audio', label: 'Audio & Sound', emoji: '🎧' },
    { id: 'laptops', label: 'Laptops & PCs', emoji: '💻' },
    { id: 'smartphones', label: 'Smartphones', emoji: '📱' },
    { id: 'tv-home-cinema', label: '4K OLED TVs', emoji: '📺' },
    { id: 'home-kitchen', label: 'Kitchen & Home', emoji: '☕' },
    { id: 'wearables', label: 'Wearables & Rings', emoji: '⌚' },
    { id: 'gaming', label: 'Gaming & VR', emoji: '🎮' },
    { id: 'cameras', label: 'Cameras & Drones', emoji: '📷' },
    { id: 'fitness-outdoors', label: 'Fitness & Gym', emoji: '🏋️' },
    { id: 'beauty-grooming', label: 'Beauty Tech', emoji: '✨' },
    { id: 'office-workspace', label: 'Pro Monitors', emoji: '🖥️' },
    { id: 'automotive-ev', label: 'Auto & EV', emoji: '🚗' },
    { id: 'travel-luggage', label: 'Smart Travel', emoji: '✈️' },
    { id: 'musical-studio', label: 'Pro Audio', emoji: '🎵' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 shadow-xs">
      {/* Top Banner: Transparency & Disclaimer Announcement */}
      <div className="bg-neutral-900 text-neutral-300 text-xs py-1.5 px-4 hidden md:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-3 h-3 mr-1 inline" /> Verified Specs
            </span>
            <span className="text-neutral-400">
              {t('affiliate.disclosure_short')}
            </span>
          </div>
          <div className="flex items-center space-x-4 rtl:space-x-reverse text-neutral-400">
            {(!adminConfig.hideAdminFromPublic || isAdminAuth) ? (
              <button
                onClick={() => onNavigate('admin')}
                className={`hover:text-white transition-colors cursor-pointer text-xs font-medium flex items-center gap-1.5 px-2 py-0.5 rounded-lg ${
                  isAdminAuth
                    ? 'bg-neutral-800 text-emerald-400 border border-neutral-700/80'
                    : currentView === 'admin'
                    ? 'text-blue-400 font-semibold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {isAdminAuth ? (
                  <>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="font-semibold text-emerald-300">Admin (Unlocked)</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3 text-neutral-400" />
                    <span>{t('nav.admin') || 'Admin Portal'}</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => onNavigate('admin')}
                title="Admin Access"
                className="opacity-20 hover:opacity-100 transition-opacity cursor-pointer text-neutral-500 hover:text-neutral-300 p-1"
              >
                <Lock className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo */}
          <div className="flex items-center">
            <button
              id="header-brand-logo"
              onClick={handleLogoClick}
              className="flex items-center gap-2.5 text-left group focus:outline-hidden cursor-pointer"
              title="OmniDiscover"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
                <Compass className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-neutral-900 via-neutral-800 to-blue-900 bg-clip-text text-transparent">
                  OmniDiscover
                </span>
                <span className="block text-[10px] font-semibold tracking-wider uppercase text-blue-600">
                  Global Catalog & Specs
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Search Bar with Instant Results */}
          <div className="hidden lg:flex flex-1 max-w-lg mx-2 relative" ref={searchContainerRef}>
            <form onSubmit={handleSearchSubmit} className="w-full relative">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  id="header-global-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchQuery.trim().length > 0) setIsSearchOpen(true);
                  }}
                  placeholder={t('nav.search_placeholder')}
                  className="w-full pl-10 pr-12 py-2 text-sm bg-neutral-100 hover:bg-neutral-100/80 focus:bg-white text-neutral-900 placeholder-neutral-400 border border-transparent focus:border-blue-500 rounded-full focus:outline-hidden transition-all duration-150 focus:ring-3 focus:ring-blue-100"
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-medium text-neutral-500 bg-white border border-neutral-300 rounded-sm shadow-2xs">
                  /
                </kbd>
              </div>
            </form>

            {/* Instant Search Dropdown */}
            {isSearchOpen && (
              <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-2xl border border-neutral-200/90 py-2 z-50 overflow-hidden animate-in fade-in-50 duration-150">
                {/* Amazon Link Quick Detection Card (Strictly for Authenticated Admin Only) */}
                {isAdminAuth && isAmazonLink(searchQuery) && (
                  <div className="p-3 mx-2 mb-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-neutral-900 truncate">Admin: Amazon Product Link Detected</div>
                        <div className="text-[11px] text-amber-900 truncate">Extract ASIN, specifications, and add to catalog</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setImportInitialUrl(searchQuery);
                        setIsImportModalOpen(true);
                        setIsSearchOpen(false);
                      }}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shrink-0 flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                    >
                      <span>Import Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {searchResults.length > 0 ? (
                  <div>
                    <div className="px-3.5 py-1.5 text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center justify-between border-b border-neutral-100">
                      <span>Products & Specs</span>
                      <span className="text-[11px] text-blue-600 font-normal">
                        Press Enter to see all
                      </span>
                    </div>
                    <div className="divide-y divide-neutral-100">
                      {searchResults.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => handleSearchResultClick(product.id)}
                          className="w-full px-3.5 py-2.5 text-left flex items-center gap-3 hover:bg-blue-50/70 transition-colors group cursor-pointer"
                        >
                          <img
                            src={product.images[0]?.url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=100&q=80'}
                            alt={product.name}
                            className="w-10 h-10 object-contain rounded-lg bg-neutral-50 border border-neutral-200 p-1 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-neutral-900 truncate group-hover:text-blue-600">
                              {product.name}
                            </div>
                            <div className="text-[11px] text-neutral-500 flex items-center gap-2 mt-0.5">
                              <span className="font-medium text-neutral-700">{product.brandName}</span>
                              <span>•</span>
                              <span className="text-emerald-700 font-bold">{formatPrice(product.price)}</span>
                              <span>•</span>
                              <span>★ {product.rating}</span>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                    <div className="p-2 border-t border-neutral-100 bg-neutral-50">
                      <button
                        onClick={(e) => handleSearchSubmit(e)}
                        className="w-full py-1.5 text-center text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        View all results for &ldquo;{searchQuery}&rdquo;
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-neutral-500">
                    <p className="font-medium">No direct matches found</p>
                    <p className="text-xs text-neutral-400 mt-1">
                      Try searching by brand (&ldquo;Sony&rdquo;, &ldquo;Apple&rdquo;), category (&ldquo;Audio&rdquo;), or spec (&ldquo;OLED&rdquo;).
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Desktop Primary Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = currentView === link.id;
              return (
                <button
                  key={link.id}
                  id={`nav-link-${link.id}`}
                  onClick={() => {
                    if (link.id === 'compare' && compareCount > 0) {
                      onOpenCompare();
                    } else {
                      onNavigate(link.id);
                    }
                  }}
                  className={`relative px-3 py-2 text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'text-blue-700 bg-blue-50/90 shadow-2xs font-bold'
                      : 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-neutral-500'}`} />
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white tracking-wide uppercase">
                      {link.badge}
                    </span>
                  )}
                  {link.count !== undefined && link.count > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                      {link.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Market & Currency Selector + Language Selector */}
          <div className="hidden sm:flex items-center gap-2">
            {/* Market & Currency Dropdown */}
            <div className="relative" ref={marketRef}>
              <button
                id="header-market-btn"
                onClick={() => setIsMarketDropdownOpen(!isMarketDropdownOpen)}
                className="px-2.5 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200/80 rounded-lg flex items-center gap-1.5 border border-neutral-200 transition-colors cursor-pointer"
                title="Select Country & Default Currency"
              >
                <span>{marketOptions.find((m) => m.market === market)?.flag || '🌐'}</span>
                <span>{market}</span>
                <span className="text-neutral-400">|</span>
                <span className="font-bold text-neutral-900">{currency}</span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
              </button>

              {isMarketDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-neutral-200 py-1.5 z-50 animate-in fade-in-50 duration-100">
                  <div className="px-3 py-1 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                    Select Global Market
                  </div>
                  {marketOptions.map((opt) => (
                    <button
                      key={opt.market}
                      onClick={() => {
                        setMarket(opt.market);
                        setCurrency(opt.currency);
                        setIsMarketDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-neutral-100 transition-colors cursor-pointer ${
                        market === opt.market ? 'bg-blue-50/80 font-bold text-blue-700' : 'text-neutral-700'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{opt.flag}</span>
                        <span>{opt.label}</span>
                      </span>
                      <span className="font-mono text-[11px] text-neutral-500">{opt.currency}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Language Selector Dropdown */}
            <div className="relative" ref={localeRef}>
              <button
                id="header-locale-btn"
                onClick={() => setIsLocaleDropdownOpen(!isLocaleDropdownOpen)}
                className="px-2.5 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200/80 rounded-lg flex items-center gap-1.5 border border-neutral-200 transition-colors cursor-pointer"
                title="Select Language"
              >
                <Globe className="w-3.5 h-3.5 text-neutral-500" />
                <span>{SUPPORTED_LOCALES[locale]?.nativeName || locale.toUpperCase()}</span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
              </button>

              {isLocaleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-neutral-200 py-1.5 z-50 animate-in fade-in-50 duration-100">
                  <div className="px-3 py-1 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                    Interface Language
                  </div>
                  {(Object.keys(SUPPORTED_LOCALES) as LanguageCode[]).map((locCode) => {
                    const loc = SUPPORTED_LOCALES[locCode];
                    return (
                      <button
                        key={locCode}
                        onClick={() => {
                          setLocale(locCode);
                          setIsLocaleDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-neutral-100 transition-colors cursor-pointer ${
                          locale === locCode ? 'bg-blue-50/80 font-bold text-blue-700' : 'text-neutral-700'
                        }`}
                      >
                        <span>{loc.nativeName}</span>
                        <span className="text-[11px] text-neutral-400">{loc.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => onNavigate('compare')}
              className="p-2 text-neutral-700 hover:bg-neutral-100 rounded-lg relative"
              title="Compare"
            >
              <Scale className="w-5 h-5" />
              {compareCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {compareCount}
                </span>
              )}
            </button>
            <button
              id="header-mobile-menu-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-neutral-700 hover:bg-neutral-100 rounded-lg focus:outline-hidden"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="lg:hidden pb-3 pt-1">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('nav.search_placeholder')}
              className="w-full pl-10 pr-4 py-2 text-sm bg-neutral-100 rounded-xl text-neutral-900 placeholder-neutral-400 border border-neutral-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </form>
        </div>
      </div>

      {/* Secondary Header Bar: Shop by Department Mega Navigation */}
      <div className="bg-neutral-50/90 border-t border-neutral-200/80 hidden md:block relative z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-10 text-xs">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 w-full">
            {/* Shop by Department Dropdown Trigger */}
            <div className="relative shrink-0" ref={deptDropdownRef}>
              <button
                onClick={() => setIsDeptDropdownOpen(!isDeptDropdownOpen)}
                className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isDeptDropdownOpen
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-neutral-200/80 hover:bg-neutral-300/80 text-neutral-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Shop by Department</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-800 font-extrabold ml-0.5">
                  12
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${isDeptDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Mega Menu Dropdown Panel */}
              {isDeptDropdownOpen && (
                <div className="absolute left-0 mt-2 w-[760px] bg-white rounded-2xl shadow-2xl border border-neutral-200 p-6 z-50 animate-in fade-in-50 slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-4">
                    <div>
                      <h3 className="font-extrabold text-sm text-neutral-900 flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-blue-600" />
                        Explore All Departments & Subcategories
                      </h3>
                      <p className="text-[11px] text-neutral-500">
                        Select a major department to view lab-verified specification tables and merchant pricing
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setIsDeptDropdownOpen(false);
                        onNavigate('categories');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>View All Categories</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-6 max-h-[400px] overflow-y-auto pr-2">
                    {topDepartments.map((dept) => {
                      const subcats = db.getSubcategories(dept.id);
                      return (
                        <div key={dept.id} className="space-y-1.5">
                          <button
                            onClick={() => {
                              setIsDeptDropdownOpen(false);
                              onNavigate('products', dept.id);
                            }}
                            className="font-bold text-xs text-neutral-900 hover:text-blue-600 flex items-center gap-1.5 group cursor-pointer text-left w-full"
                          >
                            <span className="w-2 h-2 rounded-full bg-blue-500 group-hover:scale-125 transition-transform" />
                            <span className="truncate">{dept.localizedNames?.[locale] || dept.name}</span>
                          </button>
                          {subcats.length > 0 && (
                            <ul className="space-y-1 pl-3.5 border-l border-neutral-200/80">
                              {subcats.map((sub) => (
                                <li key={sub.id}>
                                  <button
                                    onClick={() => {
                                      setIsDeptDropdownOpen(false);
                                      onNavigate('products', sub.id);
                                    }}
                                    className="text-[11px] text-neutral-600 hover:text-blue-600 transition-colors cursor-pointer block truncate text-left w-full"
                                  >
                                    {sub.localizedNames?.[locale] || sub.name}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Links Chips for Popular Departments */}
            <div className="flex items-center gap-1 pl-2 border-l border-neutral-200/80 overflow-x-auto no-scrollbar">
              {quickDepartmentChips.map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => onNavigate('products', chip.id)}
                  className="px-2.5 py-1 rounded-md text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/70 font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <span className="text-xs">{chip.emoji}</span>
                  <span>{chip.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <div className="grid grid-cols-2 gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = currentView === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onNavigate(link.id);
                  }}
                  className={`p-3 rounded-xl flex items-center gap-2.5 text-sm font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                      : 'bg-neutral-50 text-neutral-800 hover:bg-neutral-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-neutral-500'}`} />
                  <span>{link.label}</span>
                  {link.count !== undefined && link.count > 0 && (
                    <span className="ml-auto px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                      {link.count}
                    </span>
                  )}
                  {link.badge && (
                    <span className="ml-auto px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                      {link.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-neutral-200 flex flex-col gap-2">
            {(!adminConfig.hideAdminFromPublic || isAdminAuth) && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onNavigate('admin');
                }}
                className="w-full py-2 px-3 bg-neutral-100 text-neutral-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {t('nav.admin')}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <select
              value={market}
              onChange={(e) => {
                const opt = marketOptions.find((m) => m.market === e.target.value);
                if (opt) {
                  setMarket(opt.market);
                  setCurrency(opt.currency);
                }
              }}
              className="flex-1 py-2 px-3 bg-neutral-100 text-neutral-800 rounded-lg text-xs font-medium border border-neutral-200"
            >
              {marketOptions.map((opt) => (
                <option key={opt.market} value={opt.market}>
                  {opt.flag} {opt.label} ({opt.currency})
                </option>
              ))}
            </select>

            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as LanguageCode)}
              className="flex-1 py-2 px-3 bg-neutral-100 text-neutral-800 rounded-lg text-xs font-medium border border-neutral-200"
            >
              {(Object.keys(SUPPORTED_LOCALES) as LanguageCode[]).map((locCode) => (
                <option key={locCode} value={locCode}>
                  {SUPPORTED_LOCALES[locCode].nativeName}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Global Amazon Import Modal (Admin Only) */}
      {isAdminAuth && (
        <AmazonImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          initialUrl={importInitialUrl}
          onProductAdded={(product) => {
            setIsImportModalOpen(false);
            onNavigate('product', product.id);
          }}
        />
      )}
    </header>
  );
};
