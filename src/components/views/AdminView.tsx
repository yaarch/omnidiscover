import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  Plus,
  TrendingUp,
  ExternalLink,
  Layers,
  Tag,
  ShieldCheck,
  Percent,
  Search,
  Check,
  X,
  FileSpreadsheet,
  BarChart3,
  RotateCcw,
  Sparkles,
  MousePointerClick,
  Loader2,
  Trash2,
  AlertTriangle,
  Info,
  Lock,
  LogOut,
  KeyRound,
  Shield,
  Eye,
  EyeOff,
  DollarSign,
  Edit3,
  MessageSquare,
  Mail,
  Inbox,
  CheckCircle2,
  Send
} from 'lucide-react';
import { Product, MerchantOffer, AnalyticsEvent, ContactInquiry } from '../../types';
import { useI18n } from '../../i18n/context';
import { db, cleanAndSanitizeProduct, toHighResAmazonImageUrl } from '../../services/db';
import { adminAuth, AdminSecurityConfig } from '../../services/adminAuth';
import { AdminLoginGate } from '../admin/AdminLoginGate';
import {
  parseAmazonLink,
  parseAmazonLinkAsync,
  saveAmazonProductToDb,
  extractAffiliateTag,
  ParsedAmazonProduct
} from '../../services/amazonParser';
import { AddProductForm } from '../admin/AddProductForm';
import { AddOfferModal } from '../admin/AddOfferModal';

interface AdminViewProps {
  onNavigate?: (view: string, param?: string) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onNavigate }) => {
  const { formatPrice, t } = useI18n();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => adminAuth.isAuthenticated());
  const [adminConfig, setAdminConfig] = useState<AdminSecurityConfig>(() => adminAuth.getConfig());

  // Subscribe to auth changes
  useEffect(() => {
    const unsubscribe = adminAuth.subscribe(() => {
      setIsAuthenticated(adminAuth.isAuthenticated());
      setAdminConfig(adminAuth.getConfig());
    });
    return unsubscribe;
  }, []);

  const [activeTab, setActiveTab] = useState<'analytics' | 'products' | 'create' | 'import' | 'inquiries' | 'settings' | 'security'>('analytics');
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [inquirySearch, setInquirySearch] = useState('');
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState<'all' | 'unread' | 'read' | 'replied'>('all');

  const reloadInquiries = () => {
    setInquiries(db.getContactInquiries());
  };

  useEffect(() => {
    reloadInquiries();
  }, [activeTab]);

  const handleMarkInquiryStatus = (id: string, status: ContactInquiry['status']) => {
    db.updateContactInquiryStatus(id, status);
    reloadInquiries();
  };

  const handleDeleteInquiry = (id: string) => {
    db.deleteContactInquiry(id);
    reloadInquiries();
  };

  const [replyingTo, setReplyingTo] = useState<ContactInquiry | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replySuccess, setReplySuccess] = useState<string | null>(null);

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingTo || !replyText.trim()) return;
    
    // Open the user's default email client with the pre-filled text
    const subject = encodeURIComponent(`Re: [OmniDiscover] ${replyingTo.subject.toUpperCase()} Inquiry`);
    const body = encodeURIComponent(replyText);
    const mailtoLink = `mailto:${replyingTo.email}?subject=${subject}&body=${body}`;
    
    window.open(mailtoLink, '_blank');
    
    // Mark as replied
    handleMarkInquiryStatus(replyingTo.id, 'replied');
    setReplySuccess('Reply staged! Check your email client.');
    setTimeout(() => setReplySuccess(null), 3000);
    setReplyingTo(null);
    setReplyText('');
  };

  const [searchFilter, setSearchFilter] = useState('');
  const [importUrl, setImportUrl] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [lastImportedProduct, setLastImportedProduct] = useState<Product | null>(null);
  const [duplicateNotice, setDuplicateNotice] = useState<{ isDuplicate: boolean; previousName?: string; asin: string; tag?: string | null } | null>(null);
  const [productForNewOffer, setProductForNewOffer] = useState<Product | null>(null);

  // Deletion state
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleteSuccessNotice, setDeleteSuccessNotice] = useState<string | null>(null);

  // Quick Price Edit State
  // Full Edit State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({ 
    name: '',
    brandName: '',
    imageUrl: '',
    price: '', 
    originalPrice: '' 
  });
  const [editSaveNotice, setEditSaveNotice] = useState<string | null>(null);

  const handleStartEdit = (p: Product) => {
    setEditingProduct(p);
    setEditForm({
      name: p.name,
      brandName: p.brandName,
      imageUrl: p.images[0]?.url || '',
      price: p.price.toString(),
      originalPrice: p.merchantOffers[0]?.originalPrice?.toString() || '',
    });
    setEditSaveNotice(null);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const numPrice = parseFloat(editForm.price);
    if (isNaN(numPrice) || numPrice <= 0) return;

    const numOrig = parseFloat(editForm.originalPrice) || undefined;

    const updatedOffers = (editingProduct.merchantOffers || []).map((mo, idx) => {
      if (idx === 0) {
        return {
          ...mo,
          price: numPrice,
          originalPrice: numOrig,
          lastChecked: new Date().toISOString(),
        };
      }
      return mo;
    });

    // Handle image update
    let updatedImages = [...editingProduct.images];
    if (updatedImages.length > 0) {
      updatedImages[0] = { ...updatedImages[0], url: editForm.imageUrl };
    } else {
      updatedImages = [{ id: 'img-1', url: editForm.imageUrl, alt: editForm.name, isPrimary: true, sortOrder: 1 }];
    }

    const updatedProduct: Product = {
      ...editingProduct,
      name: editForm.name,
      brandName: editForm.brandName,
      images: updatedImages,
      price: numPrice,
      merchantOffers: updatedOffers.length > 0 ? updatedOffers : [
        {
          id: `offer-${editingProduct.id}-default`,
          productId: editingProduct.id,
          merchantId: 'merchant-amazon-us',
          merchantName: 'Amazon',
          merchantLogo: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=120&h=40&q=80',
          productUrl: editingProduct.identifiers.asin ? `https://www.amazon.com/dp/${editingProduct.identifiers.asin}` : '#',
          affiliateUrl: editingProduct.identifiers.asin ? `https://www.amazon.com/dp/${editingProduct.identifiers.asin}?tag=omnidiscover-20` : '#',
          price: numPrice,
          originalPrice: numOrig,
          currency: editingProduct.currency || 'USD',
          availability: 'in_stock',
          lastChecked: new Date().toISOString(),
          status: 'active',
          market: 'US',
        }
      ],
      updatedAt: new Date().toISOString(),
    };

    db.saveProduct(updatedProduct);
    setProducts(db.getProducts({}));
    
    setEditSaveNotice('Product details updated successfully!');
    
    setTimeout(() => {
      setEditingProduct(null);
      setEditSaveNotice(null);
    }, 1000);
  };

  // Settings
  const [settings, setSettings] = useState(db.getSettings());
  const [savedSettingsSuccess, setSavedSettingsSuccess] = useState(false);

  // Security Credentials Form State
  const [securityForm, setSecurityForm] = useState({
    adminEmail: adminConfig.adminEmail,
    newPassword: '',
    confirmPassword: '',
    adminPin: adminConfig.adminPin,
    hideAdminFromPublic: adminConfig.hideAdminFromPublic,
  });
  const [showSecPassword, setShowSecPassword] = useState(false);
  const [securityNotice, setSecurityNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Reactive products list
  const [products, setProducts] = useState<Product[]>(() => db.getProducts({}));
  const [isSyncingAllPrices, setIsSyncingAllPrices] = useState(false);
  const [syncProgressMsg, setSyncProgressMsg] = useState<string | null>(null);

  const analytics = db.getAnalyticsEvents();
  const merchants = db.getMerchants();

  const handleSyncAllPrices = async () => {
    setIsSyncingAllPrices(true);
    setSyncProgressMsg('Sanitizing and refreshing catalog pricing...');

    try {
      const currentProds = db.getAllProductsAdmin();
      let updatedCount = 0;

      for (let i = 0; i < currentProds.length; i++) {
        const p = currentProds[i];
        setSyncProgressMsg(`Syncing ${i + 1}/${currentProds.length}: ${p.name.slice(0, 25)}...`);

        const asin = p.identifiers?.asin;
        let freshPrice = p.price;
        let freshOriginalPrice: number | undefined = undefined;
        let freshTitle = p.name;
        let freshImage = p.images[0]?.url || '';
        let freshGallery = p.images.map((img) => img.url);

        if (asin) {
          try {
            const res = await fetch(`/api/resolve-amazon?url=https://www.amazon.com/dp/${asin}`);
            if (res.ok) {
              const data = await res.json();
              if (data.realPrice && data.realPrice > 0) {
                freshPrice = data.realPrice;
              }
              if (data.realOriginalPrice && data.realOriginalPrice > freshPrice) {
                freshOriginalPrice = data.realOriginalPrice;
              }
              if (data.realTitle) {
                freshTitle = data.realTitle;
              }
              if (data.realImageUrl) {
                freshImage = data.realImageUrl;
              }
              if (data.galleryImages && data.galleryImages.length > 0) {
                freshGallery = data.galleryImages;
              }
            }
          } catch (e) {
            console.warn('Failed to scrape live price for', asin, e);
          }
        }

        const primaryImgUrl = freshImage || p.images[0]?.url || '';
        const allImgs = [
          primaryImgUrl,
          ...(freshGallery.filter((u) => u !== primaryImgUrl)),
        ].filter(Boolean);

        const freshImages = allImgs.map((url, idx) => ({
          id: `img-${p.id}-${idx + 1}`,
          url: toHighResAmazonImageUrl(url),
          alt: `View ${idx + 1}`,
          isPrimary: idx === 0,
          sortOrder: idx + 1,
        }));

        const freshOffers = (p.merchantOffers || []).map((mo, idx) => {
          if (idx === 0) {
            return {
              ...mo,
              price: freshPrice,
              originalPrice: freshOriginalPrice,
            };
          }
          return mo;
        });

        const sanitized = cleanAndSanitizeProduct({
          ...p,
          name: freshTitle,
          price: freshPrice,
          merchantOffers: freshOffers,
          images: freshImages.length > 0 ? freshImages : p.images,
        });

        db.saveProduct(sanitized);
        updatedCount++;
      }

      const allFresh = db.getAllProductsAdmin();
      setProducts(allFresh);
      setDeleteSuccessNotice(`Successfully re-synced and sanitized pricing for ${updatedCount} products!`);
    } catch (err) {
      console.error('Error syncing prices:', err);
    } finally {
      setIsSyncingAllPrices(false);
      setSyncProgressMsg(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <AdminLoginGate
        onSuccess={() => setIsAuthenticated(true)}
        onCancel={() => onNavigate?.('home')}
      />
    );
  }

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.brandName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (p.identifiers.asin && p.identifiers.asin.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  const handleSimulateImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportError(null);
    setLastImportedProduct(null);
    setDuplicateNotice(null);

    const trimmed = importUrl.trim();
    if (!trimmed) return;

    setIsImporting(true);
    try {
      const parsed = await parseAmazonLinkAsync(trimmed);
      if (!parsed) {
        setImportError('Invalid Amazon link or ASIN. Please provide an Amazon URL (e.g., amazon.com/dp/B08N5WRWNW, https://amzn.to/...) or a 10-character ASIN.');
        setIsImporting(false);
        return;
      }

      // Check if this ASIN already existed in the catalog
      const existingProduct = db.getProductByAsin(parsed.asin);
      const userTag = extractAffiliateTag(trimmed) || extractAffiliateTag(parsed.affiliateUrl);

      const savedProd = saveAmazonProductToDb({
        asin: parsed.asin,
        title: parsed.title,
        brandName: parsed.brandName,
        brandId: parsed.brandId,
        categoryId: parsed.categoryId,
        price: parsed.price,
        originalPrice: parsed.originalPrice,
        currency: parsed.currency,
        market: parsed.market,
        imageUrl: parsed.imageUrl,
        galleryImages: parsed.galleryImages,
        cleanUrl: parsed.cleanUrl,
        affiliateUrl: parsed.affiliateUrl,
        features: parsed.features,
        specifications: parsed.specifications,
      });

      if (existingProduct) {
        setDuplicateNotice({
          isDuplicate: true,
          previousName: existingProduct.name,
          asin: parsed.asin,
          tag: userTag,
        });
      } else {
        setDuplicateNotice(null);
      }

      setProducts(db.getProducts({}));
      setLastImportedProduct(savedProd);
      setImportUrl('');
    } catch (err) {
      setImportError('An unexpected error occurred while parsing the Amazon link.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleDeleteConfirmed = () => {
    if (!productToDelete) return;
    const name = productToDelete.name;
    const success = db.deleteProduct(productToDelete.id);
    if (success) {
      setProducts(db.getProducts({}));
      setDeleteSuccessNotice(`Product "${name}" was successfully removed from the catalog.`);
      setTimeout(() => setDeleteSuccessNotice(null), 4000);
    }
    setProductToDelete(null);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    db.saveSettings(settings);
    setSavedSettingsSuccess(true);
    setTimeout(() => setSavedSettingsSuccess(false), 3000);
  };

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityNotice(null);

    const emailTrimmed = securityForm.adminEmail.trim();
    if (!emailTrimmed) {
      setSecurityNotice({ type: 'error', message: 'Admin email cannot be empty.' });
      return;
    }

    if (securityForm.newPassword) {
      if (securityForm.newPassword.length < 4) {
        setSecurityNotice({ type: 'error', message: 'Password must be at least 4 characters.' });
        return;
      }
      if (securityForm.newPassword !== securityForm.confirmPassword) {
        setSecurityNotice({ type: 'error', message: 'Passwords do not match.' });
        return;
      }
    }

    const pinTrimmed = securityForm.adminPin.trim();
    if (!pinTrimmed || pinTrimmed.length < 3) {
      setSecurityNotice({ type: 'error', message: 'Master PIN must be at least 3 digits.' });
      return;
    }

    adminAuth.updateConfig({
      adminEmail: emailTrimmed,
      ...(securityForm.newPassword ? { adminPassword: securityForm.newPassword } : {}),
      adminPin: pinTrimmed,
      hideAdminFromPublic: securityForm.hideAdminFromPublic,
    });

    setSecurityNotice({ type: 'success', message: 'Admin security credentials and protection rules successfully updated!' });
    setSecurityForm((prev) => ({ ...prev, newPassword: '', confirmPassword: '' }));
    setTimeout(() => setSecurityNotice(null), 4000);
  };

  const handleLogout = () => {
    adminAuth.logout();
    setIsAuthenticated(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Admin Security Status & Quick Logout Bar */}
      <div className="bg-neutral-900 text-white rounded-2xl px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md border border-neutral-800">
        <div className="flex items-center gap-2.5 text-xs">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-neutral-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Authenticated Session:
            </span>
            <span className="font-mono bg-neutral-800 px-2.5 py-0.5 rounded text-blue-300 font-semibold border border-neutral-700">
              System Administrator
            </span>
            <span className="text-[11px] text-neutral-400">
              (Private Access Only)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-neutral-700"
          >
            <KeyRound className="w-3.5 h-3.5 text-blue-400" />
            <span>Change Password</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock & Logout</span>
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-neutral-900 text-white mb-2">
            <SlidersHorizontal className="w-3.5 h-3.5" /> PLATFORM CONTROL CENTER
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
            OmniDiscover Operations & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Manage product feeds, affiliate tracking configurations, and monitor click performance
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center flex-wrap bg-neutral-100 p-1.5 rounded-2xl border border-neutral-200/60 gap-1">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Analytics & Clicks
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'products'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Products ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'create'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'import'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Amazon Importer
          </button>
          <button
            onClick={() => setActiveTab('inquiries')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'inquiries'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
            <span>Inquiries</span>
            {inquiries.filter(i => i.status === 'unread').length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
                {inquiries.filter(i => i.status === 'unread').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Affiliate Tags
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            <span>Security & Access</span>
          </button>
        </div>
      </div>

      {/* Tab: Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-xs">
              <div className="flex items-center justify-between text-neutral-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Total Outbound Clicks</span>
                <MousePointerClick className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-3xl font-black text-neutral-900">
                {analytics.filter((e) => e.eventType === 'affiliate_click').length}
              </div>
              <p className="text-xs text-emerald-600 font-medium mt-1">
                Verified outbound affiliate referrals
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-xs">
              <div className="flex items-center justify-between text-neutral-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Active Indexed Products</span>
                <Layers className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-3xl font-black text-neutral-900">
                {products.length}
              </div>
              <p className="text-xs text-neutral-400 mt-1">Across 6 primary categories</p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-xs">
              <div className="flex items-center justify-between text-neutral-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Partner Merchants</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-black text-neutral-900">
                {merchants.length}
              </div>
              <p className="text-xs text-neutral-400 mt-1">Amazon US, UK, DE, Best Buy, etc.</p>
            </div>
          </div>

          {/* Click Stream Log */}
          <div className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-neutral-900">
              Live Affiliate Click & Outbound Stream
            </h3>

            {analytics.length > 0 ? (
              <div className="divide-y divide-neutral-100 text-xs">
                {analytics.map((evt) => (
                  <div key={evt.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        <ExternalLink className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-neutral-900">{evt.entityName}</div>
                        <div className="text-neutral-400 text-[11px]">
                          Target: <span className="font-semibold text-neutral-700">{evt.merchantId}</span> • Market: {evt.market}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-[11px] text-neutral-400">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-neutral-400 text-xs py-4 text-center">
                No outbound affiliate clicks registered yet. Browse products and click &ldquo;Visit Store&rdquo; or &ldquo;Buy Offer&rdquo; to simulate real click events.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tab: Products */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-xs space-y-6">
          {deleteSuccessNotice && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between animate-in fade-in-50">
              <div className="flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{deleteSuccessNotice}</span>
              </div>
              <button
                onClick={() => setDeleteSuccessNotice(null)}
                className="text-emerald-700 hover:text-emerald-900 p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {syncProgressMsg && (
            <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-3 animate-in fade-in-50">
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
              <span className="font-medium">{syncProgressMsg}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-neutral-900">
                Indexed Hardware Products ({products.length})
              </h3>
              <p className="text-xs text-neutral-500">
                Manage catalog items, sanitize titles, delete discontinued products, and edit prices.
              </p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleSyncAllPrices}
                disabled={isSyncingAllPrices}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 disabled:opacity-50 transition-colors shrink-0 cursor-pointer"
                title="Fetch live US prices & images from Amazon for all ASIN items and sanitize titles"
              >
                {isSyncingAllPrices ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>Re-Sync All Prices</span>
              </button>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search by name, brand, or ASIN..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-100 rounded-xl border border-transparent focus:bg-white focus:border-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-500 font-bold uppercase tracking-wider border-b border-neutral-200">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3">Brand</th>
                  <th className="p-3">Base Price</th>
                  <th className="p-3">Offers</th>
                  <th className="p-3">Rating</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50">
                    <td className="p-3 font-semibold text-neutral-900 flex items-center gap-2">
                      <img
                        src={p.images[0]?.url}
                        alt={p.name}
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 object-contain rounded bg-white border border-neutral-200 p-0.5 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="truncate max-w-xs block">{p.name}</span>
                        {p.identifiers.asin && (
                          <span className="text-[10px] text-neutral-400 font-mono">ASIN: {p.identifiers.asin}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-neutral-600">{p.brandName}</td>
                    <td className="p-3 font-bold text-neutral-900">
                      <button
                        onClick={() => handleStartEdit(p)}
                        title="Click to edit product details"
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-colors cursor-pointer group"
                      >
                        <span>{formatPrice(p.price)}</span>
                        <Edit3 className="w-3 h-3 text-amber-600 opacity-60 group-hover:opacity-100" />
                      </button>
                    </td>
                    <td className="p-3 text-neutral-500">{p.merchantOffers.length} Offers</td>
                    <td className="p-3 text-amber-600 font-bold">★ {p.rating}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleStartEdit(p)}
                          title="Quick edit product details"
                          className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer border border-amber-200"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => setProductForNewOffer(p)}
                          title="Add store competitor offer (Walmart, Best Buy, AliExpress, etc.)"
                          className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer border border-blue-200"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Offer</span>
                        </button>
                        {onNavigate && (
                          <button
                            onClick={() => onNavigate('product', p.id)}
                            title="View product live page"
                            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => setProductToDelete(p)}
                          title="Delete product from catalog"
                          className="p-1 rounded-lg text-rose-400 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Product Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white rounded-3xl shadow-2xl border border-neutral-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-neutral-900 text-sm">Delete Product from Catalog?</h3>
                <p className="text-xs text-neutral-500 truncate max-w-xs">{productToDelete.name}</p>
              </div>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Are you sure you want to delete <strong className="text-neutral-900">{productToDelete.name}</strong>? This action will permanently remove it from the product listings and spec comparison matrix.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 rounded-xl text-neutral-600 hover:bg-neutral-100 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirmed}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Add Global Product */}
      {activeTab === 'create' && (
        <AddProductForm
          onProductCreated={() => {
            setProducts(db.getProducts({}));
          }}
          onNavigateToProduct={(prodId) => onNavigate?.('product', prodId)}
        />
      )}

      {/* Tab: Import Tool */}
      {activeTab === 'import' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-xs space-y-6 max-w-2xl mx-auto">
          <div>
            <h3 className="text-lg font-bold text-neutral-900">
              Product Normalization & Scraper Importer
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              Paste an Amazon ASIN or product URL to test standardized attribute extraction and live merchant link creation.
            </p>
          </div>

          <form onSubmit={handleSimulateImport} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Merchant Product URL or ASIN
              </label>
              <input
                type="text"
                value={importUrl}
                onChange={(e) => {
                  setImportUrl(e.target.value);
                  setImportError(null);
                }}
                placeholder="https://www.amazon.com/dp/B08N5WRWNW or B08N5WRWNW"
                className="w-full px-4 py-2.5 text-xs sm:text-sm bg-neutral-100 rounded-xl border border-neutral-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Quick Sample Links */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-500">
              <span>Try with sample:</span>
              <button
                type="button"
                onClick={() => setImportUrl('https://amzn.to/4gMKIMK')}
                className="px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-medium cursor-pointer"
              >
                Surface Charger (amzn.to/4gMKIMK)
              </button>
              <button
                type="button"
                onClick={() => setImportUrl('https://www.amazon.com/Apple-MacBook-13-inch-256GB-Storage/dp/B08N5WRWNW')}
                className="px-2 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 text-blue-600 font-medium cursor-pointer"
              >
                MacBook Air (B08N5WRWNW)
              </button>
              <button
                type="button"
                onClick={() => setImportUrl('https://www.amazon.com/Bose-QuietComfort-Wireless-Cancelling-Headphones/dp/B0CCZ26B5V')}
                className="px-2 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 text-blue-600 font-medium cursor-pointer"
              >
                Bose QC (B0CCZ26B5V)
              </button>
            </div>

            {importError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {importError}
              </div>
            )}

            <button
              type="submit"
              disabled={isImporting}
              className={`w-full py-3 rounded-xl text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2 ${
                isImporting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Resolving & Normalizing Product...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Import & Normalize Specifications</span>
                </>
              )}
            </button>
          </form>

          {duplicateNotice?.isDuplicate && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2 animate-in fade-in-50">
              <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Existing Product Detected in Catalog!</span>
              </div>
              <p className="leading-relaxed">
                ASIN <strong className="font-mono">{duplicateNotice.asin}</strong> was already indexed in your catalog as <em>"{duplicateNotice.previousName}"</em>.
                Instead of creating an unwanted duplicate, the system has <strong>updated the existing product entry</strong> with the latest prices, image gallery, and your preserved affiliate tracking tag.
              </p>
            </div>
          )}

          {lastImportedProduct && (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-3">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {duplicateNotice?.isDuplicate
                    ? 'Product Specifications & Affiliate Link Successfully Updated!'
                    : 'Product Successfully Extracted and Added to Database!'}
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-emerald-200/80 space-y-2.5">
                <div className="flex items-center gap-3">
                  <img
                    src={lastImportedProduct.images[0]?.url}
                    alt={lastImportedProduct.name}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 object-contain rounded-lg border border-neutral-200 p-1 bg-white shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-neutral-900 truncate">{lastImportedProduct.name}</div>
                    <div className="text-[11px] text-neutral-500 mt-0.5">
                      ASIN: {lastImportedProduct.identifiers.asin} • Brand: {lastImportedProduct.brandName} • Price:{' '}
                      {formatPrice(lastImportedProduct.price, lastImportedProduct.currency)}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                        ✓ Authentic Amazon Media ({lastImportedProduct.images.length} photos)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Affiliate tracking link verification */}
                <div className="pt-2 border-t border-neutral-100 text-[11px] text-neutral-600 flex flex-col gap-1">
                  <span className="font-bold text-neutral-700">Active Affiliate Tracking Destination:</span>
                  <div className="p-2 bg-neutral-50 rounded-lg border border-neutral-200 font-mono text-[10px] break-all text-neutral-800 select-all">
                    {lastImportedProduct.merchantOffers.find((o) => o.merchantId.includes('amazon'))?.affiliateUrl ||
                      lastImportedProduct.merchantOffers[0]?.affiliateUrl}
                  </div>
                </div>

                {lastImportedProduct.images.length > 1 && (
                  <div className="pt-2 border-t border-neutral-100 flex items-center gap-1.5 overflow-x-auto pb-1">
                    {lastImportedProduct.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img.url}
                        alt={`Photo ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 object-contain rounded-md border border-neutral-200 p-0.5 bg-white shrink-0"
                      />
                    ))}
                  </div>
                )}
              </div>

              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('product', lastImportedProduct.id)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>View in Storefront Catalog</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab: Settings */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-xs space-y-6 max-w-2xl mx-auto">
          <div>
            <h3 className="text-lg font-bold text-neutral-900">
              Global Affiliate Partner Tags
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              Configure tracking tags for Amazon Associates and regional affiliate networks.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Amazon Associates Tag (US Market)
              </label>
              <input
                type="text"
                value={settings.amazonAffiliateTagUS || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    amazonAffiliateTagUS: e.target.value,
                  })
                }
                className="w-full px-3 py-2 text-xs bg-neutral-100 rounded-xl border border-neutral-200 focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Amazon Associates Tag (UK Market)
              </label>
              <input
                type="text"
                value={settings.amazonAffiliateTagUK || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    amazonAffiliateTagUK: e.target.value,
                  })
                }
                className="w-full px-3 py-2 text-xs bg-neutral-100 rounded-xl border border-neutral-200 focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Amazon Associates Tag (DE / EU Market)
              </label>
              <input
                type="text"
                value={settings.amazonAffiliateTagDE || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    amazonAffiliateTagDE: e.target.value,
                  })
                }
                className="w-full px-3 py-2 text-xs bg-neutral-100 rounded-xl border border-neutral-200 focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Save Settings
              </button>
            </div>
          </form>

          {savedSettingsSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Affiliate settings saved successfully!</span>
            </div>
          )}
        </div>
      )}

      {/* Tab: Inquiries */}
      {activeTab === 'inquiries' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
            <div>
              <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <span>Contact Inquiries & Submissions</span>
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                View and manage messages submitted via the Contact form
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear all inquiries?')) {
                    inquiries.forEach(inq => db.deleteContactInquiry(inq.id));
                    reloadInquiries();
                  }
                }}
                className="px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={inquirySearch}
                onChange={(e) => setInquirySearch(e.target.value)}
                placeholder="Search sender, email, subject..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-neutral-100 rounded-xl border border-neutral-200 focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-xl w-full sm:w-auto">
              {(['all', 'unread', 'read', 'replied'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setInquiryStatusFilter(status)}
                  className={`flex-1 sm:flex-initial px-3 py-1 rounded-lg text-[11px] font-bold transition-all capitalize cursor-pointer ${
                    inquiryStatusFilter === status
                      ? 'bg-white text-blue-700 shadow-3xs'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* List of Inquiries */}
          {(() => {
            const filteredInquiries = inquiries.filter(inq => {
              const matchesStatus = inquiryStatusFilter === 'all' || inq.status === inquiryStatusFilter;
              const term = inquirySearch.toLowerCase().trim();
              const matchesSearch = !term || 
                inq.name.toLowerCase().includes(term) ||
                inq.email.toLowerCase().includes(term) ||
                inq.subject.toLowerCase().includes(term) ||
                inq.message.toLowerCase().includes(term);
              return matchesStatus && matchesSearch;
            });

            if (filteredInquiries.length === 0) {
              return (
                <div className="py-16 text-center space-y-3 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
                  <Inbox className="w-12 h-12 text-neutral-300 mx-auto" />
                  <p className="text-xs font-bold text-neutral-500">No contact inquiries found</p>
                  <p className="text-[11px] text-neutral-400">When users send messages via the Contact page, they will show up here.</p>
                </div>
              );
            }

            return (
              <div className="space-y-4">
                {filteredInquiries.map((inq) => (
                  <div
                    key={inq.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      inq.status === 'unread'
                        ? 'bg-blue-50/30 border-blue-100 shadow-2xs'
                        : 'bg-white border-neutral-200/80'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3 pb-3 border-b border-neutral-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-neutral-900 text-sm">{inq.name}</span>
                          <span className="text-xs text-neutral-400 font-mono">({inq.email})</span>
                        </div>
                        <p className="text-xs text-neutral-500 font-medium mt-0.5">
                          Subject: <span className="text-neutral-700 font-semibold uppercase text-[10px] bg-neutral-100 px-1.5 py-0.5 rounded">{inq.subject.replace('_', ' ')}</span>
                          <span className="mx-2">&bull;</span>
                          Received: <span className="text-neutral-400">{new Date(inq.createdAt).toLocaleString()}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Status chip */}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            inq.status === 'unread'
                              ? 'bg-blue-100 text-blue-700'
                              : inq.status === 'read'
                              ? 'bg-neutral-100 text-neutral-600'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {inq.status}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-neutral-700 whitespace-pre-wrap leading-relaxed font-normal bg-neutral-50 p-3 rounded-xl border border-neutral-100 mb-4">
                      {inq.message}
                    </p>

                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-1.5">
                        {inq.status === 'unread' ? (
                          <button
                            onClick={() => handleMarkInquiryStatus(inq.id, 'read')}
                            className="px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-[10px] font-bold transition-all cursor-pointer"
                          >
                            Mark Read
                          </button>
                        ) : inq.status === 'read' ? (
                          <button
                            onClick={() => handleMarkInquiryStatus(inq.id, 'unread')}
                            className="px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-[10px] font-bold transition-all cursor-pointer"
                          >
                            Mark Unread
                          </button>
                        ) : null}

                        {inq.status !== 'replied' && (
                          <button
                            onClick={() => handleMarkInquiryStatus(inq.id, 'replied')}
                            className="px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-50 text-emerald-700 text-[10px] font-bold transition-all cursor-pointer"
                          >
                            Mark Replied
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setReplyingTo(inq)}
                          className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Mail className="w-3 h-3" />
                          <span>Reply</span>
                        </button>

                        <button
                          onClick={() => handleDeleteInquiry(inq.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                          title="Delete inquiry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Reply Success Toast */}
          {replySuccess && (
            <div className="fixed bottom-6 right-6 p-4 bg-neutral-900 text-white rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-5">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4" />
              </div>
              <p className="text-sm font-bold">{replySuccess}</p>
            </div>
          )}

          {/* Reply Modal */}
          {replyingTo && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-2xl w-full max-w-lg space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-neutral-900">Reply to Inquiry</h3>
                  <button 
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyText('');
                    }}
                    className="p-2 rounded-full hover:bg-neutral-100 text-neutral-500 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex gap-2">
                    <span className="font-bold text-neutral-500 w-16">To:</span>
                    <span className="font-medium text-neutral-900">{replyingTo.email} ({replyingTo.name})</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-neutral-500 w-16">Subject:</span>
                    <span className="font-medium text-neutral-900">Re: [OmniDiscover] {replyingTo.subject.replace('_', ' ').toUpperCase()} Inquiry</span>
                  </div>
                </div>

                <form onSubmit={handleSendReply} className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs flex gap-2">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Note:</span> This app operates purely on the front-end without a backend email server. Clicking <b>Send</b> will open your device's default email client (e.g. Gmail/Outlook) with your message pre-filled. If you are using the AI Studio preview, you may need to open this app in a <b>new tab</b> for the mail client to launch correctly.
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-2">Message</label>
                    <textarea
                      required
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={6}
                      className="w-full p-4 text-sm bg-neutral-50 rounded-2xl border border-neutral-200 focus:bg-white focus:outline-hidden resize-none"
                      placeholder={`Type your reply to ${replyingTo.name}...`}
                    />
                  </div>
                  
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={!replyText.trim()}
                      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>Send via Email App</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Security & Access Control */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-xs space-y-6 max-w-2xl mx-auto">
          <div className="flex items-center gap-3 pb-4 border-b border-neutral-100">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900">
                Admin Security & Protection
              </h3>
              <p className="text-xs text-neutral-500">
                Configure your administrator credentials, master PIN, and public visibility rules.
              </p>
            </div>
          </div>

          {securityNotice && (
            <div
              className={`p-4 rounded-2xl border text-xs flex items-start gap-2.5 animate-in fade-in-50 ${
                securityNotice.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {securityNotice.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="font-medium">{securityNotice.message}</div>
            </div>
          )}

          <form onSubmit={handleSaveSecurity} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Authorized Administrator Username or Email
              </label>
              <input
                type="text"
                required
                value={securityForm.adminEmail}
                onChange={(e) => setSecurityForm({ ...securityForm, adminEmail: e.target.value })}
                placeholder="admin"
                className="w-full px-3 py-2 text-xs bg-neutral-100 rounded-xl border border-neutral-200 focus:bg-white focus:outline-hidden"
              />
              <p className="text-[11px] text-neutral-400 mt-1">
                This credential is used to authenticate platform admin access.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  New Admin Password (Optional)
                </label>
                <div className="relative">
                  <input
                    type={showSecPassword ? 'text' : 'password'}
                    value={securityForm.newPassword}
                    onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                    placeholder="Leave blank to keep current"
                    className="w-full px-3 py-2 text-xs bg-neutral-100 rounded-xl border border-neutral-200 focus:bg-white focus:outline-hidden pr-8 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecPassword(!showSecPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-0.5 cursor-pointer"
                  >
                    {showSecPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type={showSecPassword ? 'text' : 'password'}
                  value={securityForm.confirmPassword}
                  onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                  placeholder="Repeat new password"
                  className="w-full px-3 py-2 text-xs bg-neutral-100 rounded-xl border border-neutral-200 focus:bg-white focus:outline-hidden font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                25-Digit Master Security PIN
              </label>
              <input
                type="text"
                required
                maxLength={30}
                value={securityForm.adminPin}
                onChange={(e) => setSecurityForm({ ...securityForm, adminPin: e.target.value })}
                placeholder="2026123456789012345678901"
                className="w-full sm:w-80 px-3 py-2 text-xs font-mono tracking-widest bg-neutral-100 rounded-xl border border-neutral-200 focus:bg-white focus:outline-hidden"
              />
              <p className="text-[11px] text-neutral-400 mt-1">
                Used for instant 25-digit master PIN unlock from any device.
              </p>
            </div>

            <div className="pt-2 border-t border-neutral-100">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-neutral-700 select-none">
                <input
                  type="checkbox"
                  checked={securityForm.hideAdminFromPublic}
                  onChange={(e) => setSecurityForm({ ...securityForm, hideAdminFromPublic: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-neutral-300 mt-0.5"
                />
                <div>
                  <span className="font-bold block text-neutral-900">
                    Discreet Public Mode (Hide Admin Links)
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    Hides the "Admin Portal" link from the header & footer for regular visitors. You can still access it directly or when logged in.
                  </span>
                </div>
              </label>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Save Security & Access Rules</span>
              </button>
            </div>
          </form>

          {/* Active Session Info */}
          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs space-y-2">
            <div className="font-bold text-neutral-800 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-neutral-500" />
              <span>Current Session Status</span>
            </div>
            <div className="text-[11px] text-neutral-600 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <span className="text-neutral-400">Session Role:</span>{' '}
                <strong className="text-neutral-800">System Administrator</strong>
              </div>
              <div>
                <span className="text-neutral-400">Lock Protection:</span>{' '}
                <strong className="text-emerald-700 font-bold">Active & Enforced</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Competitor Store Offer Modal */}
      {productForNewOffer && (
        <AddOfferModal
          product={productForNewOffer}
          onClose={() => setProductForNewOffer(null)}
          onOfferAdded={() => {
            setProducts(db.getProducts({}));
          }}
        />
      )}

      {/* Full Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-neutral-900 text-base">
                    Edit Product Details
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Fix missing information or update prices
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 border border-neutral-200">
              <img
                src={editForm.imageUrl || editingProduct.images[0]?.url}
                alt={editForm.name}
                referrerPolicy="no-referrer"
                className="w-12 h-12 object-contain rounded-lg bg-white border border-neutral-200 p-1 shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80';
                }}
              />
              <div className="min-w-0">
                <h4 className="font-bold text-xs text-neutral-900 truncate">
                  {editForm.name}
                </h4>
                {editingProduct.identifiers.asin && (
                  <p className="text-[11px] font-mono text-neutral-500">
                    ASIN: {editingProduct.identifiers.asin}
                  </p>
                )}
              </div>
            </div>

            {editSaveNotice && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{editSaveNotice}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Product Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-neutral-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Brand Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.brandName}
                  onChange={(e) => setEditForm({ ...editForm, brandName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-neutral-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Primary Image URL <span className="text-rose-600">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={editForm.imageUrl}
                  onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-neutral-900 text-sm font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Sale Price (USD) <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-neutral-400 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={editForm.price}
                      onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-bold text-neutral-900 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Original Price (Optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-neutral-400 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={editForm.originalPrice}
                      onChange={(e) => setEditForm({ ...editForm, originalPrice: e.target.value })}
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-neutral-900 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-xl border border-neutral-300 text-neutral-700 font-bold text-xs hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
