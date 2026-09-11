import React, { useState } from 'react';
import { X, Store, DollarSign, ExternalLink, ShieldCheck, Check } from 'lucide-react';
import { Product, MerchantOffer, MarketCode, CurrencyCode } from '../../types';
import { db } from '../../services/db';
import { useI18n } from '../../i18n/context';

interface AddOfferModalProps {
  product: Product;
  onClose: () => void;
  onOfferAdded: (updatedProduct: Product) => void;
}

export const AddOfferModal: React.FC<AddOfferModalProps> = ({
  product,
  onClose,
  onOfferAdded,
}) => {
  const { formatPrice } = useI18n();
  const merchants = db.getMerchants();

  const [selectedMerchantId, setSelectedMerchantId] = useState<string>(
    merchants[0]?.id || 'merchant-amazon-us'
  );
  const [customMerchantName, setCustomMerchantName] = useState('');
  const [price, setPrice] = useState<string>('');
  const [originalPrice, setOriginalPrice] = useState<string>('');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [market, setMarket] = useState<MarketCode>('US');
  const [availability, setAvailability] = useState<'in_stock' | 'limited' | 'preorder'>('in_stock');
  const [productUrl, setProductUrl] = useState('');
  const [affiliateUrl, setAffiliateUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const selectedMerchant = merchants.find((m) => m.id === selectedMerchantId);
  const isCustomMerchant = selectedMerchantId === 'custom';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      setError('Please enter a valid offer price.');
      return;
    }

    const merchantName = isCustomMerchant
      ? customMerchantName.trim() || 'Global Store'
      : selectedMerchant?.name || 'Partner Store';

    const merchantLogo = isCustomMerchant
      ? 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=120&h=40&q=80'
      : selectedMerchant?.logo || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=120&h=40&q=80';

    const finalProductUrl = productUrl.trim() || `https://example.com/product/${product.id}`;
    const finalAffiliateUrl = affiliateUrl.trim() || finalProductUrl;

    const newOffer: MerchantOffer = {
      id: `offer-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId: product.id,
      merchantId: isCustomMerchant ? `merchant-custom-${Date.now()}` : selectedMerchantId,
      merchantName,
      merchantLogo,
      productUrl: finalProductUrl,
      affiliateUrl: finalAffiliateUrl,
      price: numPrice,
      originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
      currency,
      availability,
      lastChecked: new Date().toISOString(),
      status: 'active',
      market,
    };

    const updatedOffers = [...product.merchantOffers, newOffer];

    // Recalculate lowest price if this offer is cheaper
    const lowestPrice = Math.min(...updatedOffers.map((o) => o.price));

    const updatedProduct: Product = {
      ...product,
      price: lowestPrice,
      merchantOffers: updatedOffers,
      updatedAt: new Date().toISOString(),
    };

    db.saveProduct(updatedProduct);
    onOfferAdded(updatedProduct);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50 duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-neutral-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">
                Add Multi-Store Offer
              </h3>
              <p className="text-xs text-neutral-500 truncate max-w-xs sm:max-w-sm">
                for: {product.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          {/* Merchant Selector */}
          <div>
            <label className="block font-bold text-neutral-700 mb-1">
              Store / Merchant Partner
            </label>
            <select
              value={selectedMerchantId}
              onChange={(e) => setSelectedMerchantId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100 border border-neutral-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              {merchants.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.domain} - {m.country})
                </option>
              ))}
              <option value="custom">+ Add Custom Merchant / Store</option>
            </select>
          </div>

          {isCustomMerchant && (
            <div>
              <label className="block font-bold text-neutral-700 mb-1">
                Custom Merchant Name
              </label>
              <input
                type="text"
                value={customMerchantName}
                onChange={(e) => setCustomMerchantName(e.target.value)}
                placeholder="e.g. AliExpress, Newegg, Noon, Target..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100 border border-neutral-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                required
              />
            </div>
          )}

          {/* Pricing Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-neutral-700 mb-1">
                Offer Price *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="29.99"
                  className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-neutral-100 border border-neutral-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-bold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-neutral-700 mb-1">
                List / Original Price (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  placeholder="39.99"
                  className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-neutral-100 border border-neutral-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Currency & Market */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-neutral-700 mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full px-3 py-2.5 rounded-xl bg-neutral-100 border border-neutral-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD (CA$)</option>
                <option value="JPY">JPY (¥)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-neutral-700 mb-1">Market</label>
              <select
                value={market}
                onChange={(e) => setMarket(e.target.value as MarketCode)}
                className="w-full px-3 py-2.5 rounded-xl bg-neutral-100 border border-neutral-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="US">US (United States)</option>
                <option value="UK">UK (United Kingdom)</option>
                <option value="DE">DE (Germany / EU)</option>
                <option value="FR">FR (France)</option>
                <option value="CA">CA (Canada)</option>
                <option value="JP">JP (Japan)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-neutral-700 mb-1">Stock</label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl bg-neutral-100 border border-neutral-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="in_stock">In Stock</option>
                <option value="limited">Limited</option>
                <option value="preorder">Pre-Order</option>
              </select>
            </div>
          </div>

          {/* Product URL */}
          <div>
            <label className="block font-bold text-neutral-700 mb-1">
              Store Product URL
            </label>
            <input
              type="url"
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
              placeholder="https://www.walmart.com/ip/..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100 border border-neutral-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Custom Affiliate Link */}
          <div>
            <label className="block font-bold text-neutral-700 mb-1 flex items-center justify-between">
              <span>Your Affiliate Tracking Link *</span>
              <span className="text-[10px] text-emerald-600 font-normal">Impact, CJ, AliExpress, etc.</span>
            </label>
            <input
              type="url"
              value={affiliateUrl}
              onChange={(e) => setAffiliateUrl(e.target.value)}
              placeholder="https://click.linksynergy.com/... or https://s.click.aliexpress.com/..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100 border border-neutral-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono text-[11px]"
              required
            />
            <p className="text-[10px] text-neutral-400 mt-1">
              When users click &ldquo;Buy on {isCustomMerchant ? customMerchantName || 'Merchant' : selectedMerchant?.name}&rdquo;, they will be redirected to this link.
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Save & Publish Offer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
