import React, { useState, useEffect } from 'react';
import { I18nProvider, useI18n } from './i18n/context';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CompareDrawer } from './components/CompareDrawer';
import { HomeView } from './components/views/HomeView';
import { ProductsView } from './components/views/ProductsView';
import { ProductDetailView } from './components/views/ProductDetailView';
import { CategoriesView } from './components/views/CategoriesView';
import { DealsView } from './components/views/DealsView';
import { CompareView } from './components/views/CompareView';
import { BrandsView } from './components/views/BrandsView';
import { AdminView } from './components/views/AdminView';
import { AboutView } from './components/views/AboutView';
import { HowItWorksView } from './components/views/HowItWorksView';
import { ContactView } from './components/views/ContactView';
import { PrivacyView } from './components/views/PrivacyView';
import { TermsView } from './components/views/TermsView';
import { Product } from './types';
import { db } from './services/db';

export function AppContent() {
  const { direction, locale } = useI18n();
  const [currentView, setCurrentView] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const search = window.location.search.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (search.includes('admin') || hash === '#admin') {
        return 'admin';
      }
    }
    return 'home';
  });
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [catalogFilterParam, setCatalogFilterParam] = useState<string | undefined>(undefined);
  const [compareProducts, setCompareProducts] = useState<Product[]>([]);

  // Listen for URL changes or hash changes (#admin)
  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash.toLowerCase() === '#admin' || window.location.search.toLowerCase().includes('admin')) {
        setCurrentView('admin');
      }
    };
    window.addEventListener('hashchange', checkHash);
    window.addEventListener('popstate', checkHash);
    return () => {
      window.removeEventListener('hashchange', checkHash);
      window.removeEventListener('popstate', checkHash);
    };
  }, []);

  // Global Secret Admin Shortcut: Ctrl + Shift + A (or Cmd + Shift + A)
  useEffect(() => {
    const handleAdminShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setCurrentView('admin');
      }
    };
    window.addEventListener('keydown', handleAdminShortcut);
    return () => window.removeEventListener('keydown', handleAdminShortcut);
  }, []);

  // Update document direction and language for Arabic (RTL) / English (LTR)
  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = locale;
  }, [direction, locale]);

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView, selectedProductId]);

  const handleNavigate = (view: string, param?: string) => {
    if (view === 'product' && param) {
      setSelectedProductId(param);
      setCurrentView('product');
    } else if (view === 'products') {
      setCatalogFilterParam(param);
      setSelectedProductId(null);
      setCurrentView('products');
    } else {
      setSelectedProductId(null);
      setCatalogFilterParam(undefined);
      setCurrentView(view);
    }
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProductId(productId);
    setCurrentView('product');
  };

  const handleToggleCompare = (product: Product) => {
    setCompareProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      } else {
        if (prev.length >= 4) {
          // Replace last if already 4
          return [...prev.slice(1), product];
        }
        return [...prev, product];
      }
    });
  };

  const handleAddCompareProduct = (product: Product) => {
    setCompareProducts((prev) => {
      if (prev.some((p) => p.id === product.id)) return prev;
      if (prev.length >= 4) return [...prev.slice(1), product];
      return [...prev, product];
    });
  };

  const handleRemoveCompareProduct = (productId: string) => {
    setCompareProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const handleClearCompare = () => {
    setCompareProducts([]);
  };

  return (
    <div dir={direction} className="min-h-screen flex flex-col bg-neutral-50/50 text-neutral-900 font-sans selection:bg-blue-500 selection:text-white">
      {/* Header */}
      <Header
        currentView={currentView}
        onNavigate={handleNavigate}
        compareCount={compareProducts.length}
        onOpenCompare={() => setCurrentView('compare')}
      />

      {/* Main View Container */}
      <main className="flex-1">
        {currentView === 'home' && (
          <HomeView
            onNavigate={handleNavigate}
            onSelectProduct={handleSelectProduct}
            compareProducts={compareProducts}
            onToggleCompare={handleToggleCompare}
          />
        )}

        {currentView === 'products' && (
          <ProductsView
            key={catalogFilterParam || 'all'}
            initialSearchOrCategory={catalogFilterParam}
            onSelectProduct={handleSelectProduct}
            compareProducts={compareProducts}
            onToggleCompare={handleToggleCompare}
          />
        )}

        {currentView === 'product' && selectedProductId && (
          <ProductDetailView
            productId={selectedProductId}
            onBack={() => handleNavigate('products')}
            onSelectProduct={handleSelectProduct}
            compareProducts={compareProducts}
            onToggleCompare={handleToggleCompare}
          />
        )}

        {currentView === 'categories' && (
          <CategoriesView
            onSelectCategory={(catId) => handleNavigate('products', catId)}
          />
        )}

        {currentView === 'deals' && (
          <DealsView
            onSelectProduct={handleSelectProduct}
            compareProducts={compareProducts}
            onToggleCompare={handleToggleCompare}
          />
        )}

        {currentView === 'compare' && (
          <CompareView
            compareProducts={compareProducts}
            onAddProduct={handleAddCompareProduct}
            onRemoveProduct={handleRemoveCompareProduct}
            onClearCompare={handleClearCompare}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {currentView === 'brands' && (
          <BrandsView
            onSelectBrand={(brandSlug) => handleNavigate('products', brandSlug)}
          />
        )}

        {currentView === 'about' && <AboutView onNavigate={handleNavigate} />}
        {currentView === 'how-it-works' && <HowItWorksView onNavigate={handleNavigate} />}
        {currentView === 'contact' && <ContactView onNavigate={handleNavigate} />}
        {currentView === 'privacy' && <PrivacyView onNavigate={handleNavigate} />}
        {currentView === 'terms' && <TermsView onNavigate={handleNavigate} />}

        {currentView === 'admin' && <AdminView onNavigate={handleNavigate} />}
      </main>

      {/* Persistent Floating Compare Dock when 1+ products selected */}
      {currentView !== 'compare' && (
        <CompareDrawer
          compareProducts={compareProducts}
          onRemove={handleRemoveCompareProduct}
          onClear={handleClearCompare}
          onCompareNow={() => setCurrentView('compare')}
        />
      )}

      {/* Rich Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
}
