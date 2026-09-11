import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Tag,
  Layers,
  Image as ImageIcon,
  DollarSign,
  Copy,
  Check,
  Loader2
} from 'lucide-react';
import { useI18n } from '../i18n/context';
import {
  parseAmazonLink,
  parseAmazonLinkAsync,
  saveAmazonProductToDb,
  cleanProductTitle,
  isAmazonLink,
  isShortenedAmazonLink,
  ParsedAmazonProduct
} from '../services/amazonParser';
import { db } from '../services/db';
import { Product, MarketCode, CurrencyCode } from '../types';

interface AmazonImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: (product: Product) => void;
  initialUrl?: string;
}

export const AmazonImportModal: React.FC<AmazonImportModalProps> = ({
  isOpen,
  onClose,
  onProductAdded,
  initialUrl = '',
}) => {
  const { formatPrice, market, currency } = useI18n();
  const [urlInput, setUrlInput] = useState(initialUrl);
  const [parsed, setParsed] = useState<ParsedAmazonProduct | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  // Editable fields
  const [title, setTitle] = useState('');
  const [brandName, setBrandName] = useState('');
  const [categoryId, setCategoryId] = useState('cat-audio');
  const [price, setPrice] = useState('149.99');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedMarket, setSelectedMarket] = useState<MarketCode>('US');

  // Success state
  const [addedProduct, setAddedProduct] = useState<Product | null>(null);

  const categories = db.getCategories();
  const brands = db.getBrands();

  // Handle URL change and real-time parsing
  useEffect(() => {
    if (initialUrl) {
      setUrlInput(initialUrl);
      processUrl(initialUrl);
    }
  }, [initialUrl]);

  const processUrl = async (input: string) => {
    setParseError(null);
    setAddedProduct(null);

    const trimmed = input.trim();
    if (!trimmed) {
      setParsed(null);
      setIsResolving(false);
      return;
    }

    // 1. Initial quick synchronous parse for immediate feedback (if ASIN is directly in text)
    const syncResult = parseAmazonLink(trimmed);
    if (syncResult && !isShortenedAmazonLink(trimmed)) {
      setParsed(syncResult);
      setTitle(syncResult.title);
      setBrandName(syncResult.brandName);
      setCategoryId(syncResult.categoryId);
      setPrice(syncResult.price.toString());
      setImageUrl(syncResult.imageUrl);
      setSelectedMarket(syncResult.market);
    }

    // 2. Asynchronously scrape authentic real product image, title, price, and gallery from Amazon
    setIsResolving(true);
    try {
      const asyncResult = await parseAmazonLinkAsync(trimmed);
      if (asyncResult) {
        setParsed(asyncResult);
        setTitle(asyncResult.title);
        setBrandName(asyncResult.brandName);
        setCategoryId(asyncResult.categoryId);
        setPrice(asyncResult.price.toString());
        setImageUrl(asyncResult.imageUrl);
        setSelectedMarket(asyncResult.market);
        setParseError(null);
        setIsResolving(false);
        return;
      }
    } catch (err) {
      console.warn('Error resolving authentic Amazon data:', err);
    } finally {
      setIsResolving(false);
    }

    if (!syncResult) {
      setParsed(null);
      if (trimmed.length > 5) {
        setParseError(
          'Could not find a valid 10-character Amazon ASIN (e.g., /dp/B0XXXXXXXX, amzn.to/..., or 10-digit ASIN). Please verify the link or try one of the samples.'
        );
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUrlInput(val);
    processUrl(val);
  };

  const handleApplySample = (sampleUrl: string) => {
    setUrlInput(sampleUrl);
    processUrl(sampleUrl);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsed) return;

    const numPrice = parseFloat(price) || 12.99;
    const curr: CurrencyCode =
      selectedMarket === 'UK'
        ? 'GBP'
        : selectedMarket === 'DE' || selectedMarket === 'FR'
        ? 'EUR'
        : selectedMarket === 'JP'
        ? 'JPY'
        : selectedMarket === 'CA'
        ? 'CAD'
        : 'USD';

    const cleanTitle = cleanProductTitle(title) || parsed.title;

    const saved = saveAmazonProductToDb({
      asin: parsed.asin,
      title: cleanTitle,
      brandName: brandName.trim() || parsed.brandName,
      brandId: parsed.brandId,
      categoryId: categoryId || parsed.categoryId,
      price: numPrice,
      originalPrice: undefined,
      currency: curr,
      market: selectedMarket,
      imageUrl: imageUrl.trim() || parsed.imageUrl,
      galleryImages: parsed.galleryImages,
      cleanUrl: parsed.cleanUrl,
      affiliateUrl: parsed.affiliateUrl,
      features: parsed.features,
      specifications: parsed.specifications,
    });

    setAddedProduct(saved);
    onProductAdded(saved);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 space-y-6 animate-in fade-in-50 zoom-in-95 duration-150 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-black text-neutral-900 tracking-tight">
                Import Product from Amazon
              </h2>
              <p className="text-xs text-neutral-500">
                Extracts ASIN, marketplace, specifications, and creates affiliate tracking links
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-700 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Screen if Product was just added */}
        {addedProduct ? (
          <div className="py-6 text-center space-y-6 animate-in fade-in-50 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
              <CheckCircle2 className="w-9 h-9 text-emerald-600" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                Successfully Indexed & Added!
              </span>
              <h3 className="text-xl font-black text-neutral-900">
                {addedProduct.name}
              </h3>
              <p className="text-xs text-neutral-500">
                ASIN: <strong className="text-neutral-700">{addedProduct.identifiers.asin}</strong> • Price: <strong className="text-neutral-900">{formatPrice(addedProduct.price, addedProduct.currency)}</strong> • Affiliate tracking tag attached
              </p>
            </div>

            {/* Product Card Preview */}
            <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/80 max-w-sm mx-auto flex items-center gap-4 text-left">
              <img
                src={addedProduct.images[0]?.url}
                alt={addedProduct.name}
                className="w-16 h-16 object-contain bg-white rounded-xl border border-neutral-200 p-1"
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-blue-700 uppercase">{addedProduct.brandName}</div>
                <div className="text-xs font-semibold text-neutral-900 truncate">{addedProduct.name}</div>
                <div className="text-xs font-bold text-neutral-800 mt-1">{formatPrice(addedProduct.price, addedProduct.currency)}</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  onClose();
                  onProductAdded(addedProduct);
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <span>View Product in Catalog</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setUrlInput('');
                  setParsed(null);
                  setAddedProduct(null);
                }}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Import Another Link
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5">
            {/* Amazon URL / ASIN Input */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                Paste Amazon Product Link or ASIN
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={urlInput}
                  onChange={handleInputChange}
                  placeholder="https://www.amazon.com/dp/B08N5WRWNW or https://amzn.to/..."
                  className="w-full pl-4 pr-10 py-3 text-xs sm:text-sm bg-neutral-50 rounded-xl border border-neutral-300 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-hidden transition-all font-mono"
                  autoFocus
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {isResolving && (
                    <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
                  )}
                  {urlInput && !isResolving && (
                    <button
                      type="button"
                      onClick={() => {
                        setUrlInput('');
                        setParsed(null);
                        setParseError(null);
                        setIsResolving(false);
                      }}
                      className="text-neutral-400 hover:text-neutral-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Resolving indicator message */}
              {isResolving && (
                <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600 shrink-0" />
                  <span className="font-medium">
                    Resolving shortened Amazon link (amzn.to)... following redirect and extracting ASIN & specifications.
                  </span>
                </div>
              )}

              {/* Sample Links for Quick One-Click Testing */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-[11px] text-neutral-400 font-medium">Test with sample:</span>
                <button
                  type="button"
                  onClick={() => handleApplySample('https://amzn.to/4gMKIMK')}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-medium transition-colors cursor-pointer"
                >
                  Surface Charger (amzn.to/4gMKIMK)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplySample('https://www.amazon.com/Apple-MacBook-13-inch-256GB-Storage/dp/B08N5WRWNW')}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-neutral-100 hover:bg-blue-50 text-neutral-600 hover:text-blue-700 border border-neutral-200 transition-colors cursor-pointer"
                >
                  MacBook Air (B08N5WRWNW)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplySample('https://www.amazon.com/Bose-QuietComfort-Wireless-Cancelling-Headphones/dp/B0CCZ26B5V')}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-neutral-100 hover:bg-blue-50 text-neutral-600 hover:text-blue-700 border border-neutral-200 transition-colors cursor-pointer"
                >
                  Bose QC (B0CCZ26B5V)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplySample('https://www.amazon.co.uk/dp/B09XS7JWHH')}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-neutral-100 hover:bg-blue-50 text-neutral-600 hover:text-blue-700 border border-neutral-200 transition-colors cursor-pointer"
                >
                  Amazon UK Link
                </button>
              </div>

              {/* Validation Feedback */}
              {parseError && (
                <div className="mt-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{parseError}</span>
                </div>
              )}
            </div>

            {/* Parsed Preview Card & Editable Fields */}
            {parsed && (
              <div className="p-4 rounded-2xl bg-neutral-50/80 border border-neutral-200 space-y-4">
                {/* Status Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-200/80">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Valid ASIN: {parsed.asin}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                      Amazon {selectedMarket}
                    </span>
                  </div>

                  {parsed.isDuplicate && (
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Already in catalog (Will update)
                    </span>
                  )}
                </div>

                {/* Editable Title */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                    Product Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-neutral-300 focus:border-blue-500 focus:outline-hidden font-medium"
                    placeholder="Product Title"
                  />
                </div>

                {/* Brand & Category Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                      Brand
                    </label>
                    <input
                      type="text"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-neutral-300 focus:border-blue-500 focus:outline-hidden"
                      placeholder="e.g. Apple, Sony, Bose"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                      Category
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-neutral-300 focus:border-blue-500 focus:outline-hidden"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Price Row */}
                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-extrabold text-amber-950">
                      Live Market Sale Price ({selectedMarket})
                    </label>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                      Editable — Verify real Amazon price
                    </span>
                  </div>
                  <div className="relative max-w-xs">
                    <span className="absolute left-3 top-2 text-xs font-bold text-amber-800">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 text-xs bg-white rounded-lg border border-amber-300 focus:border-amber-600 focus:ring-2 focus:ring-amber-200 font-extrabold text-neutral-900"
                      placeholder="e.g. 12.99"
                    />
                  </div>
                  <p className="text-[10px] text-amber-800/80 mt-1">
                    Ensure this matches the live listing price on Amazon. You can also update it anytime via Quick Edit Price in the Admin tab.
                  </p>
                </div>

                {/* Real Product Image & Gallery Selection */}
                <div className="p-3.5 rounded-xl bg-white border border-neutral-200/90 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600">
                      Product Media Preview
                    </label>
                    {parsed.galleryImages && parsed.galleryImages.length > 0 ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Real Amazon Images ({parsed.galleryImages.length} found)
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-neutral-400">
                        Primary Image
                      </span>
                    )}
                  </div>

                  <div className="flex items-start gap-3.5">
                    {imageUrl && (
                      <div className="relative group shrink-0">
                        <img
                          src={imageUrl}
                          alt="Product preview"
                          referrerPolicy="no-referrer"
                          className="w-20 h-20 object-contain rounded-xl bg-neutral-50 border border-neutral-200/90 p-1 shadow-xs"
                          onError={(e) => {
                            // Fallback if blocked
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80';
                          }}
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0 space-y-2">
                      <input
                        type="text"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="Image URL"
                        className="w-full px-3 py-1.5 text-xs bg-neutral-50 rounded-lg border border-neutral-200 focus:bg-white focus:border-blue-500 focus:outline-hidden font-mono text-neutral-600 truncate"
                      />

                      {/* Gallery thumbnails from authentic Amazon scraping */}
                      {parsed.galleryImages && parsed.galleryImages.length > 1 && (
                        <div className="space-y-1">
                          <span className="text-[10px] text-neutral-500 font-medium">Click to select primary image:</span>
                          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                            {parsed.galleryImages.map((imgUrl, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setImageUrl(imgUrl)}
                                className={`shrink-0 w-9 h-9 rounded-lg border p-0.5 bg-white transition-all cursor-pointer ${
                                  imageUrl === imgUrl
                                    ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
                                    : 'border-neutral-200 opacity-70 hover:opacity-100 hover:border-neutral-400'
                                }`}
                              >
                                <img
                                  src={imgUrl}
                                  alt={`Thumb ${idx + 1}`}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-contain"
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Affiliate Link Preview */}
                <div className="pt-2 border-t border-neutral-200/60 text-[11px] text-neutral-500 flex items-center justify-between">
                  <span className="truncate max-w-sm">
                    Affiliate Tag Attached: <strong className="text-neutral-800">{parsed.affiliateUrl}</strong>
                  </span>
                  <span className="shrink-0 text-emerald-700 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Monitored Feed
                  </span>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-neutral-600 hover:text-neutral-900 text-xs font-bold hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!parsed}
                className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer ${
                  parsed
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                    : 'bg-neutral-300 cursor-not-allowed text-neutral-500'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>{parsed?.isDuplicate ? 'Update Product in Catalog' : 'Add Product to OmniDiscover'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
