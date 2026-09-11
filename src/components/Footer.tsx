import React, { useState, useEffect } from 'react';
import { Compass, ShieldCheck, ExternalLink, Globe, Heart, ArrowUpRight, Lock } from 'lucide-react';
import { useI18n } from '../i18n/context';
import { adminAuth } from '../services/adminAuth';

interface FooterProps {
  onNavigate: (view: string, param?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { t, locale, market, currency } = useI18n();
  const [isAdminAuth, setIsAdminAuth] = useState(() => adminAuth.isAuthenticated());
  const [adminConfig, setAdminConfig] = useState(() => adminAuth.getConfig());

  useEffect(() => {
    const unsub = adminAuth.subscribe(() => {
      setIsAdminAuth(adminAuth.isAuthenticated());
      setAdminConfig(adminAuth.getConfig());
    });
    return unsub;
  }, []);

  return (
    <footer className="bg-neutral-900 text-neutral-300 pt-16 pb-12 border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-neutral-800">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Compass className="w-5 h-5" />
              </div>
              <span className="text-xl font-black tracking-tight text-white">
                OmniDiscover
              </span>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed max-w-sm">
              The independent, global product catalog and verified specification intelligence engine. We empower buyers with objective benchmarks, clear attribute breakdowns, and direct merchant pricing.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> 100% Editorial Independence
              </span>
              <span className="text-xs text-neutral-500">
                Market: <span className="font-semibold text-neutral-300">{market} ({currency})</span>
              </span>
            </div>
          </div>

          {/* Quick Discover Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-200 mb-4">
              Explore Catalog
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => onNavigate('products')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  All Products
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('categories')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Categories Directory
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('deals')}
                  className="hover:text-white transition-colors cursor-pointer text-left flex items-center gap-1.5"
                >
                  <span>Active Deals & Price Drops</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    HOT
                  </span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('compare')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Side-by-Side Compare Tool
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('brands')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Brand Index
                </button>
              </li>
            </ul>
          </div>

          {/* Popular Categories */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-200 mb-4">
              Top Categories
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => onNavigate('products', 'cat-smartphones')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Smartphones & Mobile
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('products', 'cat-audio')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Audio & Headphones
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('products', 'cat-laptops')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Laptops & Ultrabooks
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('products', 'cat-wearables')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Smartwatches & Wearables
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('products', 'cat-gaming')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Gaming & Consoles
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('categories')}
                  className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer text-left text-xs font-semibold flex items-center gap-1"
                >
                  <span>Explore All Taxonomies &rarr;</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Platform & Legal */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-200 mb-4">
              Company & Legal
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => onNavigate('about')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  About OmniDiscover
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('how-it-works')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  How It Works & Methodology
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('contact')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Contact Editorial Team
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('privacy')}
                  className="hover:text-white transition-colors cursor-pointer text-left text-neutral-400 hover:text-neutral-200 text-xs"
                >
                  Privacy Policy & GDPR
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('terms')}
                  className="hover:text-white transition-colors cursor-pointer text-left text-neutral-400 hover:text-neutral-200 text-xs"
                >
                  Terms of Service
                </button>
              </li>
              {(!adminConfig.hideAdminFromPublic || isAdminAuth) && (
                <li className="pt-2 border-t border-neutral-800">
                  <button
                    onClick={() => onNavigate('admin')}
                    className="hover:text-white transition-colors cursor-pointer text-left text-xs text-neutral-400 hover:text-neutral-200 flex items-center gap-1.5"
                  >
                    <Lock className="w-3 h-3 text-neutral-500" />
                    <span>
                      {isAdminAuth ? 'Admin Portal (Active)' : 'Admin Portal'}
                    </span>
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Affiliate Disclosure Box */}
        <div className="mt-8 p-4 rounded-xl bg-neutral-800/60 border border-neutral-700/60 text-xs text-neutral-400 leading-relaxed">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-neutral-200 font-semibold block mb-1">
                Affiliate Transparency & Disclosure
              </strong>
              {t('footer.disclaimer')}
              <p className="mt-1 text-[11px] text-neutral-500">
                {t('product.disclaimer')}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-4">
          <div className="flex items-center gap-2">
            <span>&copy; {new Date().getFullYear()} OmniDiscover. All rights reserved. Built for independent global commerce discovery.</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Powered by Verified Specification Models</span>
            {/* Secret Discreet Admin Entry Trigger */}
            <button
              onClick={() => onNavigate('admin')}
              title="Admin Portal Access (Ctrl+Shift+A)"
              className="text-neutral-700 hover:text-neutral-400 transition-colors p-1 cursor-pointer text-[10px]"
              aria-label="Admin"
            >
              <Lock className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
