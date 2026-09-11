import React, { useState } from 'react';
import { Plus, Check, Sparkles, Image as ImageIcon, Store, ExternalLink } from 'lucide-react';
import { Product, MerchantOffer, CurrencyCode, MarketCode } from '../../types';
import { db } from '../../services/db';
import { useI18n } from '../../i18n/context';

interface AddProductFormProps {
  onProductCreated: (newProduct: Product) => void;
  onNavigateToProduct?: (productId: string) => void;
}

export const AddProductForm: React.FC<AddProductFormProps> = ({
  onProductCreated,
  onNavigateToProduct,
}) => {
  const { formatPrice } = useI18n();
  const merchants = db.getMerchants();
  const categories = db.getCategories();
  const brands = db.getBrands();

  // Form State
  const [name, setName] = useState('');
  const [selectedMerchantId, setSelectedMerchantId] = useState(merchants[0]?.id || 'merchant-amazon-us');
  const [customMerchantName, setCustomMerchantName] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState(brands[0]?.id || 'brand-apple');
  const [customBrandName, setCustomBrandName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id || 'cat-electronics');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [market, setMarket] = useState<MarketCode>('US');
  const [imageUrl, setImageUrl] = useState('');
  const [galleryUrls, setGalleryUrls] = useState('');
  const [affiliateUrl, setAffiliateUrl] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [features, setFeatures] = useState('');
  const [specs, setSpecs] = useState('');
  const [sku, setSku] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [createdProduct, setCreatedProduct] = useState<Product | null>(null);

  const isCustomMerchant = selectedMerchantId === 'custom';
  const isCustomBrand = selectedBrandId === 'custom';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreatedProduct(null);

    const numPrice = parseFloat(price);
    if (!name.trim()) {
      setError('Please provide a product title.');
      return;
    }
    if (isNaN(numPrice) || numPrice <= 0) {
      setError('Please provide a valid price.');
      return;
    }

    const brandName = isCustomBrand
      ? customBrandName.trim() || 'Generic'
      : brands.find((b) => b.id === selectedBrandId)?.name || 'Generic';

    const merchantName = isCustomMerchant
      ? customMerchantName.trim() || 'Global Store'
      : merchants.find((m) => m.id === selectedMerchantId)?.name || 'Partner Store';

    const merchantLogo = isCustomMerchant
      ? 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=120&h=40&q=80'
      : merchants.find((m) => m.id === selectedMerchantId)?.logo || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=120&h=40&q=80';

    const prodId = `prod-manual-${Date.now()}`;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const finalImageUrl = imageUrl.trim() || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=85';
    const otherImages = galleryUrls
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u.length > 0)
      .map((url, idx) => ({
        id: `img-${prodId}-${idx + 2}`,
        url,
        alt: `${name} image ${idx + 2}`,
        isPrimary: false,
        sortOrder: idx + 2,
      }));

    const images = [
      {
        id: `img-${prodId}-1`,
        url: finalImageUrl,
        alt: name,
        isPrimary: true,
        sortOrder: 1,
      },
      ...otherImages,
    ];

    const featureList = features
      .split('\n')
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    const specMap: Record<string, string> = {};
    specs.split('\n').forEach((line) => {
      const parts = line.split(':');
      if (parts.length >= 2) {
        const k = parts[0].trim();
        const v = parts.slice(1).join(':').trim();
        if (k && v) specMap[k] = v;
      }
    });

    const finalProductUrl = productUrl.trim() || `https://example.com/${slug}`;
    const finalAffiliateUrl = affiliateUrl.trim() || finalProductUrl;

    const initialOffer: MerchantOffer = {
      id: `offer-${Date.now()}`,
      productId: prodId,
      merchantId: isCustomMerchant ? `merchant-custom-${Date.now()}` : selectedMerchantId,
      merchantName,
      merchantLogo,
      productUrl: finalProductUrl,
      affiliateUrl: finalAffiliateUrl,
      price: numPrice,
      originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
      currency,
      availability: 'in_stock',
      lastChecked: new Date().toISOString(),
      status: 'active',
      market,
    };

    const newProduct: Product = {
      id: prodId,
      slug,
      name: name.trim(),
      brandId: isCustomBrand ? `brand-custom-${Date.now()}` : selectedBrandId,
      brandName,
      categoryIds: [selectedCategoryId],
      primaryCategoryId: selectedCategoryId,
      description: shortDescription.trim() || `${name.trim()} by ${brandName}. Verified specifications and live pricing available.`,
      shortDescription: shortDescription.trim() || `${name.trim()} by ${brandName}.`,
      images,
      identifiers: {
        sku: sku.trim() || undefined,
        asin: sku.trim().startsWith('B0') ? sku.trim() : undefined,
      },
      rating: 4.8,
      reviewCount: 142,
      price: numPrice,
      currency,
      availability: 'in_stock',
      specifications: specMap,
      features: featureList.length > 0 ? featureList : ['Authentic manufacturer build', 'Direct verified affiliate offer'],
      attributes: [],
      tags: [brandName.toLowerCase(), 'global-market', 'new-addition'],
      merchantOffers: [initialOffer],
      seoMetadata: {
        title: `${name.trim()} - Best Price, Specs & Reviews | OmniDiscover`,
        description: `Compare prices for ${name.trim()} across global merchants.`,
      },
      status: 'published',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
    };

    db.saveProduct(newProduct);
    onProductCreated(newProduct);
    setCreatedProduct(newProduct);

    // Reset fields
    setName('');
    setPrice('');
    setOriginalPrice('');
    setImageUrl('');
    setGalleryUrls('');
    setAffiliateUrl('');
    setProductUrl('');
    setShortDescription('');
    setFeatures('');
    setSpecs('');
    setSku('');
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-xs space-y-6 max-w-3xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 mb-2 border border-blue-200">
          <Store className="w-3.5 h-3.5" /> MULTI-STORE DIRECT PUBLISHING
        </div>
        <h3 className="text-xl font-bold text-neutral-900">
          Add Product From Any Global Store
        </h3>
        <p className="text-xs text-neutral-500 mt-1">
          Publish products from AliExpress, Walmart, eBay, Best Buy, Target, Noon, or any international affiliate partner without affecting existing catalog items.
        </p>
      </div>

      {createdProduct && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between gap-4 animate-in fade-in-50">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="text-xs">
              <span className="font-bold">{createdProduct.name}</span> was published successfully!
            </div>
          </div>
          {onNavigateToProduct && (
            <button
              onClick={() => onNavigateToProduct(createdProduct.id)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
            >
              <span>View Product Page</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 text-xs">
        {/* Product Title */}
        <div>
          <label className="block font-bold text-neutral-700 mb-1">
            Product Title / Model Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Baseus 65W GaN Fast Charger USB-C 3-Port Desktop Station"
            className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 border border-neutral-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium text-sm"
            required
          />
        </div>

        {/* Merchant & Store Source */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-neutral-700 mb-1">
              Store / Marketplace *
            </label>
            <select
              value={selectedMerchantId}
              onChange={(e) => setSelectedMerchantId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100 border border-neutral-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              {merchants.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.domain})
                </option>
              ))}
              <option value="custom">+ Other / Custom Marketplace</option>
            </select>
          </div>

          {isCustomMerchant ? (
            <div>
              <label className="block font-bold text-neutral-700 mb-1">
                Custom Store Name *
              </label>
              <input
                type="text"
                value={customMerchantName}
                onChange={(e) => setCustomMerchantName(e.target.value)}
                placeholder="e.g. AliExpress, Newegg, Noon..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100 border border-neutral-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                required
              />
            </div>
          ) : (
            <div>
              <label className="block font-bold text-neutral-700 mb-1">
                Category *
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100 border border-neutral-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Brand & Category (if custom merchant was active) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-neutral-700 mb-1">
              Brand *
            </label>
            <select
              value={selectedBrandId}
              onChange={(e) => setSelectedBrandId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100 border border-neutral-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
              <option value="custom">+ Other / Custom Brand</option>
            </select>
          </div>

          {isCustomBrand && (
            <div>
              <label className="block font-bold text-neutral-700 mb-1">
                Custom Brand Name *
              </label>
              <input
                type="text"
                value={customBrandName}
                onChange={(e) => setCustomBrandName(e.target.value)}
                placeholder="e.g. Anker, Baseus, Ugreen..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100 border border-neutral-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                required
              />
            </div>
          )}
        </div>

        {/* Pricing, Currency & Market */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block font-bold text-neutral-700 mb-1">
              Price *
            </label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="39.99"
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100 border border-neutral-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-bold"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-neutral-700 mb-1">
              Original Price
            </label>
            <input
              type="number"
              step="0.01"
              value={originalPrice}
              onChange={(e) => setOriginalPrice(e.target.value)}
              placeholder="59.99"
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100 border border-neutral-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-bold text-neutral-700 mb-1">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100 border border-neutral-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CAD">CAD (CA$)</option>
              <option value="JPY">JPY (¥)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-neutral-700 mb-1">
              Market
            </label>
            <select
              value={market}
              onChange={(e) => setMarket(e.target.value as MarketCode)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100 border border-neutral-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="US">US</option>
              <option value="UK">UK</option>
              <option value="DE">DE</option>
              <option value="FR">FR</option>
              <option value="CA">CA</option>
              <option value="JP">JP</option>
            </select>
          </div>
        </div>

        {/* Affiliate Link & Store Product URL */}
        <div className="space-y-3 p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80">
          <div>
            <label className="block font-bold text-neutral-800 mb-1 flex items-center justify-between">
              <span>Direct Affiliate Tracking Link *</span>
              <span className="text-[10px] text-amber-700 font-normal">This is where the user goes when clicking &ldquo;Buy&rdquo;</span>
            </label>
            <input
              type="url"
              value={affiliateUrl}
              onChange={(e) => setAffiliateUrl(e.target.value)}
              placeholder="https://s.click.aliexpress.com/e/... or https://goto.walmart.com/c/..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-300 focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-mono text-[11px]"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-neutral-700 mb-1">
              Original Store Product Page URL (Optional)
            </label>
            <input
              type="url"
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
              placeholder="https://www.aliexpress.com/item/1005006..."
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-neutral-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-[11px]"
            />
          </div>
        </div>

        {/* Product Image URL */}
        <div>
          <label className="block font-bold text-neutral-700 mb-1">
            Primary Product Image URL
          </label>
          <div className="flex gap-3 items-center">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/... or CDN image URL"
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-neutral-100 border border-neutral-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Preview"
                referrerPolicy="no-referrer"
                className="w-10 h-10 object-contain rounded-lg border border-neutral-200 bg-white p-0.5 shrink-0"
              />
            )}
          </div>
        </div>

        {/* Gallery Image URLs */}
        <div>
          <label className="block font-bold text-neutral-700 mb-1">
            Additional Gallery Image URLs (One URL per line)
          </label>
          <textarea
            rows={2}
            value={galleryUrls}
            onChange={(e) => setGalleryUrls(e.target.value)}
            placeholder="https://...&#10;https://..."
            className="w-full px-3.5 py-2 rounded-xl bg-neutral-100 border border-neutral-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono text-[11px]"
          />
        </div>

        {/* Features (line by line) */}
        <div>
          <label className="block font-bold text-neutral-700 mb-1">
            Key Highlights / Features (One feature per line)
          </label>
          <textarea
            rows={3}
            value={features}
            onChange={(e) => setFeatures(e.target.value)}
            placeholder="65W fast charging with GaN III technology&#10;Dual USB-C and USB-A ports&#10;Universal 100-240V input worldwide"
            className="w-full px-3.5 py-2 rounded-xl bg-neutral-100 border border-neutral-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>

        {/* Technical Specifications */}
        <div>
          <label className="block font-bold text-neutral-700 mb-1">
            Technical Specifications (Format: Key: Value, one per line)
          </label>
          <textarea
            rows={3}
            value={specs}
            onChange={(e) => setSpecs(e.target.value)}
            placeholder="Power Output: 65W Max&#10;Ports: 2x USB-C, 1x USB-A&#10;Weight: 140g&#10;Warranty: 18 Months"
            className="w-full px-3.5 py-2 rounded-xl bg-neutral-100 border border-neutral-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono text-[11px]"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Publish Global Product to Catalog</span>
          </button>
        </div>
      </form>
    </div>
  );
};
