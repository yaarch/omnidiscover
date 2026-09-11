import React, { createContext, useContext, useState, useEffect } from 'react';
import { LanguageCode, LocaleConfig, MarketCode, CurrencyCode, TextDirection } from '../types';

export const SUPPORTED_LOCALES: Record<LanguageCode, LocaleConfig> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    defaultMarket: 'US',
    defaultCurrency: 'USD',
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    direction: 'rtl',
    defaultMarket: 'US',
    defaultCurrency: 'USD',
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    direction: 'ltr',
    defaultMarket: 'US',
    defaultCurrency: 'USD',
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    direction: 'ltr',
    defaultMarket: 'FR',
    defaultCurrency: 'EUR',
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    direction: 'ltr',
    defaultMarket: 'DE',
    defaultCurrency: 'EUR',
  },
};

export const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  en: {
    'nav.home': 'Home',
    'nav.discover': 'Discover',
    'nav.products': 'Products',
    'nav.categories': 'Categories',
    'nav.deals': 'Deals',
    'nav.brands': 'Brands',
    'nav.compare': 'Compare',
    'nav.admin': 'Admin Portal',
    'nav.search_placeholder': 'Search products, brands, specs (e.g. Sony, OLED, ANC)...',
    'hero.title': 'Intelligent Global Product Discovery',
    'hero.subtitle': 'Objective specifications, verified data models, and transparent multi-merchant price comparison.',
    'hero.badge': '100% Independent Catalog & Affiliate Platform',
    'section.popular_categories': 'Browse Categories',
    'section.featured_products': 'Trending Discoveries',
    'section.popular_brands': 'Top Global Brands',
    'section.popular_comparisons': 'Head-to-Head Comparisons',
    'section.recently_added': 'Recently Indexed',
    'card.view_details': 'View Product',
    'card.compare': 'Compare',
    'card.compared': 'In Compare',
    'card.in_stock': 'In Stock',
    'card.check_price': 'Check Price on {merchant}',
    'card.rating': '{rating} ({count} verified reviews)',
    'filter.all_categories': 'All Categories',
    'filter.brands': 'Brands',
    'filter.price_range': 'Price Range',
    'filter.min_rating': 'Minimum Rating',
    'filter.in_stock_only': 'In-Stock Only',
    'filter.clear_all': 'Clear Filters',
    'filter.sort_by': 'Sort By',
    'filter.sort.relevance': 'Best Match',
    'filter.sort.price_asc': 'Price: Low to High',
    'filter.sort.price_desc': 'Price: High to Low',
    'filter.sort.rating_desc': 'Highest Rated',
    'filter.sort.newest': 'Newest Additions',
    'product.specifications': 'Technical Specifications',
    'product.key_features': 'Key Features & Highlights',
    'product.merchant_offers': 'Available Merchant Offers',
    'product.similar_products': 'Similar Products',
    'product.related_products': 'Related in Category',
    'product.disclaimer': 'Prices and availability are accurate as of the date/time indicated and are subject to change. Any price and availability information displayed on the merchant site at the time of purchase will apply to the purchase of this product.',
    'compare.title': 'Product Comparison',
    'compare.subtitle': 'Side-by-side technical specification breakdown',
    'compare.add_product': 'Add product to compare',
    'compare.empty': 'No products selected for comparison. Browse products and click "Compare" to evaluate them side-by-side.',
    'affiliate.disclosure_short': 'As an affiliate, we may earn commissions from qualifying purchases made through our links at no additional cost to you.',
    'footer.disclaimer': 'OmniDiscover is an independent product discovery catalog. We do not sell items directly, process payments, or fulfill orders. All purchases take place on external merchant websites such as Amazon.',
    'admin.dashboard': 'Dashboard',
    'admin.products': 'Products',
    'admin.add_product': 'Add / Import Product',
    'admin.categories': 'Categories',
    'admin.brands': 'Brands',
    'admin.attributes': 'Attributes',
    'admin.merchants': 'Merchants & Offers',
    'admin.comparisons': 'Comparisons',
    'admin.seo': 'SEO Rules & Sitemap',
    'admin.analytics': 'Affiliate Analytics',
    'admin.settings': 'Settings',
    'import.url_placeholder': 'Paste supported product URL (e.g. Amazon US, UK, DE or Walmart)...',
    'import.btn': 'Import Product',
    'import.step_review': 'Review & Confirm Normalized Product Data',
    'buy.buy_now_on': 'Buy Now on {merchant}',
    'buy.buy_on': 'Buy on {merchant}',
    'buy.in_stock': 'In Stock & Ready to Ship',
    'buy.direct_deal': 'Direct Merchant Deal',
    'buy.verified_link': 'Verified Affiliate Link',
    'buy.prime_eligible': 'Free Prime & Fast Delivery Eligible',
    'buy.returns_policy': 'Standard 30-day merchant returns',
    'buy.opens_amazon': 'Opens securely on Amazon',
    'buy.save_percent': 'Save {percent}%',
    'buy.you_save': 'You save {amount}',
  },
  ar: {
    'nav.home': 'الرئيسية',
    'nav.discover': 'استكشف',
    'nav.products': 'المنتجات',
    'nav.categories': 'الفئات',
    'nav.deals': 'العروض والتخفيضات',
    'nav.brands': 'العلامات التجارية',
    'nav.compare': 'المقارنة',
    'nav.admin': 'لوحة الإدارة',
    'nav.search_placeholder': 'ابحث عن المنتجات والعلامات التجارية والمواصفات...',
    'hero.title': 'منصة استكشاف المنتجات العالمية الذكية',
    'hero.subtitle': 'مواصفات دقيقة ونماذج بيانات موثوقة ومقارنة أسعار شفافة عبر المتاجر العالمية.',
    'hero.badge': 'منصة مستقلة لاكتشاف المنتجات والتسويق بالعمولة',
    'section.popular_categories': 'تصفح الفئات',
    'section.featured_products': 'أبرز المنتجات الرائجة',
    'section.popular_brands': 'أفضل العلامات التجارية',
    'section.popular_comparisons': 'مقارنات مباشرة وجهاً لوجه',
    'section.recently_added': 'أحدث المنتجات المضافة',
    'card.view_details': 'عرض المنتج',
    'card.compare': 'مقارنة',
    'card.compared': 'في المقارنة',
    'card.in_stock': 'متوفر',
    'card.check_price': 'تحقق من السعر لدى {merchant}',
    'card.rating': '{rating} ({count} تقييم موثق)',
    'filter.all_categories': 'جميع الفئات',
    'filter.brands': 'العلامات التجارية',
    'filter.price_range': 'نطاق السعر',
    'filter.min_rating': 'أدنى تقييم',
    'filter.in_stock_only': 'المتوفر فقط',
    'filter.clear_all': 'مسح التصفية',
    'filter.sort_by': 'ترتيب حسب',
    'filter.sort.relevance': 'الأكثر صلة',
    'filter.sort.price_asc': 'السعر: من الأقل للأعلى',
    'filter.sort.price_desc': 'السعر: من الأعلى للأقل',
    'filter.sort.rating_desc': 'الأعلى تقييماً',
    'filter.sort.newest': 'الأحدث',
    'product.specifications': 'المواصفات الفنية',
    'product.key_features': 'أبرز المزايا والخصائص',
    'product.merchant_offers': 'عروض المتاجر المتاحة',
    'product.similar_products': 'منتجات مماثلة',
    'product.related_products': 'منتجات ذات صلة في الفئة',
    'product.disclaimer': 'الأسعار والتوفر دقيقة وفقاً لتاريخ ووقت التحديث وخاضعة للتغيير على موقع التاجر.',
    'compare.title': 'مقارنة المنتجات',
    'compare.subtitle': 'مقارنة فنية دقيقة جنباً إلى جنب',
    'compare.add_product': 'أضف منتجاً للمقارنة',
    'compare.empty': 'لم تختر منتجات للمقارنة بعد. تصفح المنتجات وانقر على "مقارنة".',
    'affiliate.disclosure_short': 'كموقع مستقل للتسويق بالعمولة، قد نحصل على عمولة عند الشراء عبر روابطنا دون أي تكلفة إضافية عليك.',
    'footer.disclaimer': 'أومني ديسكفر منصة مستقلة لاكتشاف المنتجات. نحن لا نبيع المنتجات مباشرة ولا نعالج الدفع. جميع عمليات الشراء تتم على مواقع المتاجر المعتمدة مثل أمازون.',
    'admin.dashboard': 'لوحة القيادة',
    'admin.products': 'المنتجات',
    'admin.add_product': 'إضافة / استيراد منتج',
    'admin.categories': 'الفئات',
    'admin.brands': 'العلامات التجارية',
    'admin.attributes': 'الخصائص والمواصفات',
    'admin.merchants': 'المتاجر والعروض',
    'admin.comparisons': 'المقارنات',
    'admin.seo': 'قواعد السيو وخريطة الموقع',
    'admin.analytics': 'إحصائيات النقرات والعمولات',
    'admin.settings': 'الإعدادات',
    'import.url_placeholder': 'الصق رابط المنتج المعتمد (أمازون أو وول مارت)...',
    'import.btn': 'استيراد المنتج',
    'import.step_review': 'مراجعة وتأكيد بيانات المنتج',
    'buy.buy_now_on': 'شراء الآن من {merchant}',
    'buy.buy_on': 'الشراء من {merchant}',
    'buy.in_stock': 'متوفر وجاهز للشحن السريع',
    'buy.direct_deal': 'عرض مباشر معتمد',
    'buy.verified_link': 'رابط تسويق بالعمولة موثق',
    'buy.prime_eligible': 'مؤهل للشحن السريع وخدمة برايم',
    'buy.returns_policy': 'إمكانية الإرجاع القياسية خلال 30 يوماً',
    'buy.opens_amazon': 'يفتح بأمان على موقع المتجر',
    'buy.save_percent': 'وفر {percent}٪',
    'buy.you_save': 'توفير {amount}',
  },
  es: {
    'nav.home': 'Inicio',
    'nav.discover': 'Descubrir',
    'nav.products': 'Productos',
    'nav.categories': 'Categorías',
    'nav.deals': 'Ofertas',
    'nav.brands': 'Marcas',
    'nav.compare': 'Comparar',
    'nav.admin': 'Panel Admin',
    'nav.search_placeholder': 'Buscar productos, marcas, especificaciones...',
    'hero.title': 'Descubrimiento Global Inteligente de Productos',
    'hero.subtitle': 'Especificaciones objetivas, datos verificados y comparativa transparente de precios.',
    'hero.badge': 'Catálogo 100% Independiente y Afiliación Global',
    'section.popular_categories': 'Explorar Categorías',
    'section.featured_products': 'Productos Destacados',
    'section.popular_brands': 'Marcas Globales',
    'section.popular_comparisons': 'Comparativas Directas',
    'section.recently_added': 'Agregados Recientemente',
    'card.view_details': 'Ver Producto',
    'card.compare': 'Comparar',
    'card.compared': 'En Comparación',
    'card.in_stock': 'En Stock',
    'card.check_price': 'Ver Precio en {merchant}',
    'card.rating': '{rating} ({count} reseñas verificadas)',
    'filter.all_categories': 'Todas las Categorías',
    'filter.brands': 'Marcas',
    'filter.price_range': 'Rango de Precio',
    'filter.min_rating': 'Calificación Mínima',
    'filter.in_stock_only': 'Solo en Stock',
    'filter.clear_all': 'Limpiar Filtros',
    'filter.sort_by': 'Ordenar Por',
    'filter.sort.relevance': 'Más Relevante',
    'filter.sort.price_asc': 'Precio: Menor a Mayor',
    'filter.sort.price_desc': 'Precio: Mayor a Menor',
    'filter.sort.rating_desc': 'Mejor Calificados',
    'filter.sort.newest': 'Más Recientes',
    'product.specifications': 'Especificaciones Técnicas',
    'product.key_features': 'Características Destacadas',
    'product.merchant_offers': 'Ofertas Disponibles',
    'product.similar_products': 'Productos Similares',
    'product.related_products': 'Relacionados en la Categoría',
    'product.disclaimer': 'Los precios y la disponibilidad están actualizados a la fecha indicada y sujetos a cambios en la web del vendedor.',
    'compare.title': 'Comparativa de Productos',
    'compare.subtitle': 'Desglose técnico comparativo lado a lado',
    'compare.add_product': 'Añadir producto a comparar',
    'compare.empty': 'No hay productos seleccionados para comparar. Explora y pulsa "Comparar".',
    'affiliate.disclosure_short': 'Como afiliados podemos ganar comisiones por compras válidas a través de nuestros enlaces sin coste adicional.',
    'footer.disclaimer': 'OmniDiscover es un catálogo de descubrimiento independiente. No procesamos pagos ni gestionamos envíos. La compra final se realiza en la tienda externa como Amazon.',
    'admin.dashboard': 'Panel Principal',
    'admin.products': 'Productos',
    'admin.add_product': 'Importar Producto',
    'admin.categories': 'Categorías',
    'admin.brands': 'Marcas',
    'admin.attributes': 'Atributos',
    'admin.merchants': 'Comercios y Ofertas',
    'admin.comparisons': 'Comparativas',
    'admin.seo': 'Reglas SEO',
    'admin.analytics': 'Analíticas de Clics',
    'admin.settings': 'Configuración',
    'import.url_placeholder': 'Pega la URL del producto compatible...',
    'import.btn': 'Importar Producto',
    'import.step_review': 'Revisar y Confirmar Datos',
  },
  fr: {
    'nav.home': 'Accueil',
    'nav.discover': 'Découvrir',
    'nav.products': 'Produits',
    'nav.categories': 'Catégories',
    'nav.deals': 'Bons Plans',
    'nav.brands': 'Marques',
    'nav.compare': 'Comparer',
    'nav.admin': 'Admin',
    'nav.search_placeholder': 'Rechercher des produits, marques, fiches techniques...',
    'hero.title': 'Plateforme Globale de Découverte de Produits',
    'hero.subtitle': 'Spécifications objectives, données certifiées et comparaison tarifaire multi-marchands.',
    'hero.badge': 'Catalogue Indépendant & Plateforme d\'Affiliation',
    'section.popular_categories': 'Parcourir les Catégories',
    'section.featured_products': 'Sélections Tendance',
    'section.popular_brands': 'Grandes Marques',
    'section.popular_comparisons': 'Comparatifs Face-à-Face',
    'section.recently_added': 'Récemment Indexés',
    'card.view_details': 'Voir le Produit',
    'card.compare': 'Comparer',
    'card.compared': 'Sélectionné',
    'card.in_stock': 'En Stock',
    'card.check_price': 'Voir l\'offre sur {merchant}',
    'card.rating': '{rating} ({count} avis vérifiés)',
    'filter.all_categories': 'Toutes les Catégories',
    'filter.brands': 'Marques',
    'filter.price_range': 'Fourchette de Prix',
    'filter.min_rating': 'Note Minimale',
    'filter.in_stock_only': 'En Stock Uniquement',
    'filter.clear_all': 'Réinitialiser',
    'filter.sort_by': 'Trier par',
    'filter.sort.relevance': 'Pertinence',
    'filter.sort.price_asc': 'Prix Croissant',
    'filter.sort.price_desc': 'Prix Décroissant',
    'filter.sort.rating_desc': 'Mieux Notés',
    'filter.sort.newest': 'Plus Récents',
    'product.specifications': 'Fiche Technique',
    'product.key_features': 'Points Forts',
    'product.merchant_offers': 'Offres Disponibles',
    'product.similar_products': 'Produits Similaires',
    'product.related_products': 'Produits Liés',
    'product.disclaimer': 'Les prix et disponibilités sont sujets à variations sur le site du marchand partenaire.',
    'compare.title': 'Comparatif Produits',
    'compare.subtitle': 'Tableau technique comparatif côte à côte',
    'compare.add_product': 'Ajouter un produit',
    'compare.empty': 'Aucun produit sélectionné pour comparaison.',
    'affiliate.disclosure_short': 'En tant que partenaire affilié, nous pouvons percevoir une commission sur les achats éligibles, sans surcoût.',
    'footer.disclaimer': 'OmniDiscover est un portail indépendant de découverte. Nous ne gérons ni la commande ni le paiement. L\'achat final s\'effectue chez le marchand (ex: Amazon).',
    'admin.dashboard': 'Tableau de bord',
    'admin.products': 'Produits',
    'admin.add_product': 'Importer Produit',
    'admin.categories': 'Catégories',
    'admin.brands': 'Marques',
    'admin.attributes': 'Attributs',
    'admin.merchants': 'Marchands',
    'admin.comparisons': 'Comparaisons',
    'admin.seo': 'SEO & Sitemap',
    'admin.analytics': 'Statistiques',
    'admin.settings': 'Paramètres',
    'import.url_placeholder': 'Coller une URL de produit supportée...',
    'import.btn': 'Importer',
    'import.step_review': 'Vérifier et Valider',
  },
  de: {
    'nav.home': 'Startseite',
    'nav.discover': 'Entdecken',
    'nav.products': 'Produkte',
    'nav.categories': 'Kategorien',
    'nav.deals': 'Angebote',
    'nav.brands': 'Marken',
    'nav.compare': 'Vergleichen',
    'nav.admin': 'Admin-Bereich',
    'nav.search_placeholder': 'Produkte, Marken und Datenblätter durchsuchen...',
    'hero.title': 'Intelligente Globale Produktentdeckung',
    'hero.subtitle': 'Objektive Spezifikationen, strukturierte Daten und transparenter Händler-Preisvergleich.',
    'hero.badge': '100% Unabhängiger Katalog & Affiliate-Plattform',
    'section.popular_categories': 'Kategorien Durchsuchen',
    'section.featured_products': 'Aktuelle Highlights',
    'section.popular_brands': 'Top-Marken',
    'section.popular_comparisons': 'Direkte Produktvergleiche',
    'section.recently_added': 'Neu Hinzugefügt',
    'card.view_details': 'Produkt ansehen',
    'card.compare': 'Vergleichen',
    'card.compared': 'Im Vergleich',
    'card.in_stock': 'Vorrätig',
    'card.check_price': 'Preis prüfen bei {merchant}',
    'card.rating': '{rating} ({count} verifizierte Bewertungen)',
    'filter.all_categories': 'Alle Kategorien',
    'filter.brands': 'Marken',
    'filter.price_range': 'Preisspanne',
    'filter.min_rating': 'Mindestbewertung',
    'filter.in_stock_only': 'Nur auf Lager',
    'filter.clear_all': 'Filter zurücksetzen',
    'filter.sort_by': 'Sortierung',
    'filter.sort.relevance': 'Beste Treffer',
    'filter.sort.price_asc': 'Preis: Aufsteigend',
    'filter.sort.price_desc': 'Preis: Absteigend',
    'filter.sort.rating_desc': 'Bestbewertet',
    'filter.sort.newest': 'Neueste',
    'product.specifications': 'Technische Daten',
    'product.key_features': 'Haupteigenschaften',
    'product.merchant_offers': 'Verfügbare Händlerangebote',
    'product.similar_products': 'Ähnliche Produkte',
    'product.related_products': 'Verwandte Artikel in der Kategorie',
    'product.disclaimer': 'Preise und Verfügbarkeit können sich seit der letzten Erfassung geändert haben. Gültig ist das Angebot beim jeweiligen Händler.',
    'compare.title': 'Produktvergleich',
    'compare.subtitle': 'Detaillierter direkter Spezifikationsvergleich',
    'compare.add_product': 'Produkt hinzufügen',
    'compare.empty': 'Keine Produkte für den Vergleich ausgewählt.',
    'affiliate.disclosure_short': 'Als Affiliate-Plattform können wir bei qualifizierten Käufen über Partnerlinks eine Provision erhalten – für Sie ohne Mehrkosten.',
    'footer.disclaimer': 'OmniDiscover ist eine unabhängige Produktplattform. Wir führen keine Verkäufe oder Zahlungen selbst durch. Der Kauf findet direkt beim Händler statt.',
    'admin.dashboard': 'Dashboard',
    'admin.products': 'Produkte',
    'admin.add_product': 'Produkt importieren',
    'admin.categories': 'Kategorien',
    'admin.brands': 'Marken',
    'admin.attributes': 'Attribute',
    'admin.merchants': 'Händler & Angebote',
    'admin.comparisons': 'Vergleiche',
    'admin.seo': 'SEO-Regeln & Sitemap',
    'admin.analytics': 'Klick-Statistiken',
    'admin.settings': 'Einstellungen',
    'import.url_placeholder': 'Unterstützte Produkt-URL einfügen...',
    'import.btn': 'Importieren',
    'import.step_review': 'Daten prüfen und bestätigen',
  },
};

interface I18nContextType {
  locale: LanguageCode;
  config: LocaleConfig;
  direction: TextDirection;
  market: MarketCode;
  currency: CurrencyCode;
  setLocale: (code: LanguageCode) => void;
  setMarket: (market: MarketCode) => void;
  setCurrency: (currency: CurrencyCode) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatPrice: (amount: number, overrideCurrency?: CurrencyCode) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('omni_locale') as LanguageCode;
    return saved && SUPPORTED_LOCALES[saved] ? saved : 'en';
  });

  const config = SUPPORTED_LOCALES[locale] || SUPPORTED_LOCALES.en;

  const [market, setMarketState] = useState<MarketCode>(() => {
    const saved = localStorage.getItem('omni_market') as MarketCode;
    return saved || config.defaultMarket;
  });

  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    const saved = localStorage.getItem('omni_currency') as CurrencyCode;
    return saved || config.defaultCurrency;
  });

  const setLocale = (code: LanguageCode) => {
    if (SUPPORTED_LOCALES[code]) {
      setLocaleState(code);
      localStorage.setItem('omni_locale', code);
    }
  };

  const setMarket = (m: MarketCode) => {
    setMarketState(m);
    localStorage.setItem('omni_market', m);
  };

  const setCurrency = (c: CurrencyCode) => {
    setCurrencyState(c);
    localStorage.setItem('omni_currency', c);
  };

  // Sync HTML lang and dir attributes for accessibility and SEO
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = config.direction;
    if (config.direction === 'rtl') {
      document.body.classList.add('rtl');
    } else {
      document.body.classList.remove('rtl');
    }
  }, [locale, config.direction]);

  const t = (key: string, params?: Record<string, string | number>): string => {
    const localeDict = TRANSLATIONS[locale] || TRANSLATIONS.en;
    let text = localeDict[key] || TRANSLATIONS.en[key] || key;

    if (params) {
      Object.entries(params).forEach(([paramKey, val]) => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(val));
      });
    }
    return text;
  };

  const formatPrice = (amount: number, overrideCurrency?: CurrencyCode): string => {
    const curr = overrideCurrency || currency;
    const currencySymbols: Record<CurrencyCode, string> = {
      USD: '$',
      GBP: '£',
      EUR: '€',
      JPY: '¥',
      CAD: 'CA$',
    };
    const symbol = currencySymbols[curr] || '$';
    if (curr === 'JPY') {
      return `${symbol}${Math.round(amount).toLocaleString()}`;
    }
    return `${symbol}${amount.toFixed(2)}`;
  };

  return (
    <I18nContext.Provider
      value={{
        locale,
        config,
        direction: config.direction,
        market,
        currency,
        setLocale,
        setMarket,
        setCurrency,
        t,
        formatPrice,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
