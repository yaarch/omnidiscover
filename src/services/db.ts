import {
  Product,
  Category,
  Brand,
  AttributeDefinition,
  Merchant,
  Comparison,
  PlatformSettings,
  AnalyticsEvent,
  ImportJob,
  FilterState,
  LanguageCode,
  MarketCode,
  ContactInquiry
} from '../types';

export function toHighResAmazonImageUrl(url: string): string {
  if (!url || typeof url !== 'string') return url;
  if (!url.includes('media-amazon.com') && !url.includes('ssl-images-amazon.com')) return url;
  
  if (/\._[A-Za-z0-9_,\-]+\.(jpg|jpeg|png|webp)$/i.test(url)) {
    return url.replace(/\._[A-Za-z0-9_,\-]+\.(jpg|jpeg|png|webp)$/i, '._AC_SL1500_.$1');
  }
  return url.replace(/\.(jpg|jpeg|png|webp)$/i, '._AC_SL1500_.$1');
}

export function cleanAndSanitizeProduct(p: Product): Product {
  let name = (p.name || '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/^(Amazon\.[a-z\.]+|Amazon\.com|Amazon|Buy)\s*:\s*/i, '')
    .replace(/\s*:\s*(Office Products|Electronics|Computers & Accessories|Video Games|Home & Kitchen|Sports & Outdoors|Tools & Home Improvement|Beauty & Personal Care|Automotive|Pet Supplies|Toys & Games|Patio, Lawn & Garden|Health & Household|Clothing, Shoes & Jewelry).*$/i, '')
    .replace(/\s*\|\s*Amazon\.[a-z\.]+$|\s*-\s*Amazon\.[a-z\.]+$|\s*:\s*Amazon\.[a-z\.]+$|\s*:\s*Everything Else.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  let price = p.price;
  let currency = p.currency || 'USD';
  let merchantOffers = p.merchantOffers || [];

  const asin = p.identifiers?.asin?.toUpperCase();

  // Price & Currency rules for known ASINs or categories
  if (asin === 'B0DSW7R4VN' || /wolfbox megaflow 50/i.test(name)) {
    price = 39.99;
    currency = 'USD';
  } else if (asin === 'B0GH6YBP54') { // WOLFBOX MF70
    price = 49.99;
    currency = 'USD';
  } else if (asin === 'B09XS7JWHH') { // Sony WH-1000XM5
    price = 398.00;
    currency = 'USD';
  } else if (asin === 'B0CCZ1L489' || asin === 'B0CCZ26B5V') { // Bose QC Ultra
    price = 379.00;
    currency = 'USD';
  } else if (asin === 'B0B6GHW1X8') { // Sennheiser Momentum 4
    price = 299.95;
    currency = 'USD';
  } else if (asin === 'B0C7J8XZKL') { // Breville Barista Touch Impress
    price = 1499.95;
    currency = 'USD';
  } else if (asin === 'B0CVN788QW') { // Dell XPS 16
    price = 2749.99;
    currency = 'USD';
  } else if (asin === 'B0CM5JVV64') { // MacBook Pro
    price = 3499.00;
    currency = 'USD';
  }

  // Category heuristics for accessory items that might have received inflated scrapers
  const isDeskPadOrAccessory = /desk pad|mouse pad|desk mat|blotter|writing pad|desk protector|mouse mat|keyboard pad|wrist rest/i.test(name);
  if (isDeskPadOrAccessory && price > 50) {
    price = 12.99;
  }

  const isCableOrCase = /cable|charging cable|phone case|laptop sleeve|screen protector|adapter/i.test(name);
  if (isCableOrCase && price > 75) {
    price = 15.99;
  }

  // Update merchant offers to stay aligned with product price and USD currency
  if (merchantOffers.length > 0) {
    merchantOffers = merchantOffers.map((mo, idx) => {
      let origPrice = mo.originalPrice;
      if (origPrice) {
        const ratio = origPrice / (mo.price || price || 1);
        if (
          origPrice <= price ||
          (ratio >= 1.05 && ratio <= 1.35) ||
          origPrice === 57.49 ||
          origPrice === 449.99 ||
          origPrice === 2899.99 ||
          origPrice === 379.95 ||
          origPrice === 429.00 ||
          origPrice === 3499.00
        ) {
          origPrice = undefined;
        }
      }

      if (idx === 0) {
        return {
          ...mo,
          price: price,
          originalPrice: origPrice,
          currency: currency,
          lastChecked: new Date().toISOString(),
        };
      }
      return {
        ...mo,
        originalPrice: origPrice,
        currency: currency,
      };
    });
  } else {
    merchantOffers = [
      {
        id: `offer-${p.id}-default`,
        productId: p.id,
        merchantId: 'merchant-amazon-us',
        merchantName: 'Amazon US',
        merchantLogo: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=120&h=40&q=80',
        productUrl: asin ? `https://www.amazon.com/dp/${asin}` : '#',
        affiliateUrl: asin ? `https://www.amazon.com/dp/${asin}?tag=omnidiscover-20` : '#',
        price: price,
        originalPrice: undefined,
        currency: currency,
        availability: 'in_stock',
        lastChecked: new Date().toISOString(),
        status: 'active',
        market: 'US',
      }
    ];
  }

  const images = (p.images || []).map((img) => ({
    ...img,
    url: toHighResAmazonImageUrl(img.url),
  }));

  return {
    ...p,
    name,
    price,
    currency,
    merchantOffers,
    images,
  };
}

const INITIAL_BRANDS: Brand[] = [
  {
    id: 'brand-sony',
    name: 'Sony',
    slug: 'sony',
    logo: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=200&h=100&q=80',
    description: 'Pioneering global electronics and audio equipment manufacturer renowned for industry-leading noise cancellation and imaging sensor innovation.',
    website: 'https://electronics.sony.com',
    country: 'JP',
    seoMetadata: {
      title: 'Sony Products, Audio, Cameras & Specs | OmniDiscover',
      description: 'Explore the full catalog of Sony consumer technology, headphones, cameras, and display electronics with verified specifications and merchant pricing.',
    },
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'brand-bose',
    name: 'Bose',
    slug: 'bose',
    logo: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=200&h=100&q=80',
    description: 'American audio company known for premium consumer audio systems, immersive sound technologies, and world-class active noise cancelling.',
    website: 'https://www.bose.com',
    country: 'US',
    seoMetadata: {
      title: 'Bose Headphones, Soundbars & Audio Gear | OmniDiscover',
      description: 'Discover Bose audio systems, QuietComfort noise cancelling headphones, and portable speakers with live merchant availability.',
    },
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'brand-apple',
    name: 'Apple',
    slug: 'apple',
    logo: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=200&h=100&q=80',
    description: 'Global technology giant designing premium personal computers, portable audio, smartphones, and unified hardware-software ecosystems.',
    website: 'https://www.apple.com',
    country: 'US',
    seoMetadata: {
      title: 'Apple MacBooks, AirPods & Hardware Catalog | OmniDiscover',
      description: 'Browse Apple silicon laptops, AirPods wireless audio, and premium accessories with verified specs and affiliate merchant pricing.',
    },
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'brand-dell',
    name: 'Dell',
    slug: 'dell',
    logo: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=200&h=100&q=80',
    description: 'Global leader in computing hardware, creator of the XPS and Alienware performance laptop lines.',
    website: 'https://www.dell.com',
    country: 'US',
    seoMetadata: {
      title: 'Dell Laptops, Monitors & Workstations | OmniDiscover',
      description: 'Compare Dell XPS Ultrabooks and high-resolution monitors with full hardware metrics.',
    },
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'brand-sennheiser',
    name: 'Sennheiser',
    slug: 'sennheiser',
    logo: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=200&h=100&q=80',
    description: 'Renowned German audio manufacturer celebrated for audiophile-grade acoustic fidelity and wireless sound engineering.',
    website: 'https://www.sennheiser-hearing.com',
    country: 'DE',
    seoMetadata: {
      title: 'Sennheiser Audiophile & Wireless Headphones | OmniDiscover',
      description: 'Explore Sennheiser Momentum and HD series audio equipment.',
    },
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'brand-breville',
    name: 'Breville',
    slug: 'breville',
    logo: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=200&h=100&q=80',
    description: 'Iconic kitchen appliance brand known for precision espresso machines, smart ovens, and culinary innovation.',
    website: 'https://www.breville.com',
    country: 'AU',
    seoMetadata: {
      title: 'Breville Espresso Machines & Kitchen Appliances | OmniDiscover',
      description: 'Discover Breville Barista series espresso machines and precision kitchen technology.',
    },
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'brand-samsung',
    name: 'Samsung',
    slug: 'samsung',
    logo: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=200&h=100&q=80',
    description: 'Pioneering global electronics leader in OLED/QLED displays, Galaxy smartphones, and smart home appliances.',
    website: 'https://www.samsung.com',
    country: 'KR',
    seoMetadata: {
      title: 'Samsung Smart TVs, Galaxy Phones & Displays | OmniDiscover',
      description: 'Compare Samsung OLED TVs, Galaxy smartphones, and soundbars.',
    },
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'brand-lg',
    name: 'LG Electronics',
    slug: 'lg',
    logo: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=200&h=100&q=80',
    description: 'Pioneer of self-lit OLED television displays, gaming monitors, and high-efficiency home appliances.',
    website: 'https://www.lg.com',
    country: 'KR',
    seoMetadata: {
      title: 'LG OLED Smart TVs & UltraGear Monitors | OmniDiscover',
      description: 'Explore LG C-series OLED TVs and high-refresh gaming displays.',
    },
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'brand-dji',
    name: 'DJI',
    slug: 'dji',
    logo: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=200&h=100&q=80',
    description: 'World leader in aerial photography drones, handheld camera gimbals, and action imaging systems.',
    website: 'https://www.dji.com',
    country: 'CN',
    seoMetadata: {
      title: 'DJI Camera Drones & Handheld Gimbals | OmniDiscover',
      description: 'Compare DJI Mini, Mavic, and Osmo series camera drones and gimbals.',
    },
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'brand-dyson',
    name: 'Dyson',
    slug: 'dyson',
    logo: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=200&h=100&q=80',
    description: 'British technology enterprise renowned for high-velocity digital motors, Supersonic hair care, and cordless vacuums.',
    website: 'https://www.dyson.com',
    country: 'GB',
    seoMetadata: {
      title: 'Dyson Hair Care, Cordless Vacuums & Air Tech | OmniDiscover',
      description: 'Discover Dyson Supersonic dryers, Airwrap stylers, and V15 Detect vacuums.',
    },
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'brand-garmin',
    name: 'Garmin',
    slug: 'garmin',
    logo: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=200&h=100&q=80',
    description: 'Global leader in multi-band GPS navigation, multisport outdoor smartwatches, and aviation technology.',
    website: 'https://www.garmin.com',
    country: 'US',
    seoMetadata: {
      title: 'Garmin Fenix, Forerunner & GPS Smartwatches | OmniDiscover',
      description: 'Compare Garmin multisport GPS smartwatches, battery endurance, and topo maps.',
    },
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

const INITIAL_CATEGORIES: Category[] = [
  // 1. Electronics & Computing (Department)
  {
    id: 'cat-electronics',
    name: 'Electronics & Computing',
    slug: 'electronics',
    parentId: null,
    description: 'Cutting-edge consumer technology, computing, personal audio, smartphones, tablets, and hardware.',
    sortOrder: 1,
    featured: true,
    status: 'published',
    seoMetadata: {
      title: 'Consumer Electronics & Smart Tech | OmniDiscover Catalog',
      description: 'Comprehensive specs and price comparisons for top-rated consumer electronics and computing gear.',
    },
    localizedNames: {
      ar: 'إلكترونيات وحوسبة',
      es: 'Electrónica e Informática',
      fr: 'Électronique & Informatique',
      de: 'Elektronik & Computer',
    },
  },
  {
    id: 'cat-audio',
    name: 'Audio & Headphones',
    slug: 'audio',
    parentId: 'cat-electronics',
    description: 'High-fidelity wireless headphones, noise-cancelling earbuds, and audiophile sound systems.',
    sortOrder: 1,
    featured: true,
    status: 'published',
    seoMetadata: {
      title: 'Wireless Headphones & Audiophile Gear | OmniDiscover',
      description: 'Compare specs, battery life, codec support, and noise cancellation across top headphones.',
    },
    localizedNames: {
      ar: 'الصوتيات والسماعات',
      es: 'Audio y Auriculares',
      fr: 'Audio & Casques',
      de: 'Audio & Kopfhörer',
    },
    attributeIds: ['attr-wireless', 'attr-anc', 'attr-battery', 'attr-weight', 'attr-driver-size', 'attr-connectivity'],
    indexableFilterSlugs: ['wireless', 'noise-cancelling', 'over-ear'],
  },
  {
    id: 'cat-laptops',
    name: 'Laptops & Computers',
    slug: 'laptops',
    parentId: 'cat-electronics',
    description: 'High-performance ultrabooks, creator laptops, desktops, and portable workstations.',
    sortOrder: 2,
    featured: true,
    status: 'published',
    seoMetadata: {
      title: 'Performance Laptops & Ultrabooks | OmniDiscover Catalog',
      description: 'In-depth benchmark specifications, battery runtimes, and RAM/SSD options across modern laptops.',
    },
    localizedNames: {
      ar: 'الحواسيب المحمولة والمكتبية',
      es: 'Portátiles y Ordenadores',
      fr: 'Ordinateurs Portables & Fixes',
      de: 'Laptops & Computer',
    },
    attributeIds: ['attr-processor', 'attr-ram', 'attr-storage', 'attr-screen-size', 'attr-display-type', 'attr-battery'],
    indexableFilterSlugs: ['apple-silicon', 'oled', 'lightweight'],
  },
  {
    id: 'cat-smartphones',
    name: 'Smartphones & Mobile Tech',
    slug: 'smartphones',
    parentId: 'cat-electronics',
    description: 'Flagship smartphones, 5G mobile devices, and foldable screen technology.',
    sortOrder: 3,
    featured: true,
    status: 'published',
    seoMetadata: {
      title: 'Flagship Smartphones & 5G Devices | OmniDiscover',
      description: 'Compare smartphone camera sensors, benchmark speeds, display refresh rates, and fast charging.',
    },
    localizedNames: {
      ar: 'الهواتف الذكية والأجهزة المحمولة',
      es: 'Smartphones y Móviles',
      fr: 'Smartphones & Mobiles',
      de: 'Smartphones & Handys',
    },
  },
  {
    id: 'cat-tablets',
    name: 'Tablets, iPads & E-Readers',
    slug: 'tablets-ereaders',
    parentId: 'cat-electronics',
    description: 'Productivity tablets, digital paper e-ink readers, stylus pens, and keyboard folios.',
    sortOrder: 4,
    featured: true,
    status: 'published',
    seoMetadata: {
      title: 'Tablets, iPads & E-Ink Readers | OmniDiscover',
      description: 'Compare tablet stylus response latency, OLED screens, battery endurance, and chipsets.',
    },
    localizedNames: {
      ar: 'الأجهزة اللوحية والقارئات الإلكترونية',
      es: 'Tablets y Lectores de Libros',
      fr: 'Tablettes & Liseuses',
      de: 'Tablets & E-Reader',
    },
  },
  {
    id: 'cat-power',
    name: 'Chargers, Docks & Power Banks',
    slug: 'power-chargers',
    parentId: 'cat-electronics',
    description: 'GaN fast chargers, magnetic power banks, USB-C docks, and multi-device power hubs.',
    sortOrder: 5,
    featured: false,
    status: 'published',
    seoMetadata: {
      title: 'Fast Chargers, GaN Power Adapters & Docks | OmniDiscover',
      description: 'Explore high-wattage GaN chargers, wireless charging stations, and portable power banks.',
    },
    localizedNames: {
      ar: 'الشواحن وبطاريات الطاقة والموزعات',
      es: 'Cargadores y Baterías Externas',
      fr: 'Chargeurs & Batteries Externes',
      de: 'Ladegeräte & Powerbanks',
    },
  },
  {
    id: 'cat-pc-components',
    name: 'PC Components & Fast Storage',
    slug: 'pc-components',
    parentId: 'cat-electronics',
    description: 'PCIe 4.0/5.0 NVMe SSDs, external Thunderbolt drives, DDR5 memory, and graphics cards.',
    sortOrder: 6,
    featured: false,
    status: 'published',
    seoMetadata: {
      title: 'PC Components, NVMe SSDs & RAM | OmniDiscover',
      description: 'Compare SSD read/write IOPS, memory latencies, and cooling solutions.',
    },
    localizedNames: {
      ar: 'مكونات الكمبيوتر ووحدات التخزين السريعة',
      es: 'Componentes de PC y Almacenamiento',
      fr: 'Composants PC & Stockage SSD',
      de: 'PC-Komponenten & Speicher',
    },
  },

  // 2. TV, Home Cinema & Soundbars (Department)
  {
    id: 'cat-tv-audio',
    name: 'TV, Home Cinema & Sound',
    slug: 'tv-home-cinema',
    parentId: null,
    description: 'Flagship 4K/8K OLED televisions, Dolby Atmos soundbars, AV receivers, and laser projectors.',
    sortOrder: 2,
    featured: true,
    status: 'published',
    seoMetadata: {
      title: '4K OLED Smart TVs, Soundbars & Projectors | OmniDiscover',
      description: 'Compare television panel types, peak nits brightness, Dolby Vision, and surround audio.',
    },
    localizedNames: {
      ar: 'التلفزيونات والسينما المنزلية والمسارح الصوتية',
      es: 'Televisores, Cine en Casa y Barras de Sonido',
      fr: 'TV, Home Cinéma & Barres de Son',
      de: 'Fernseher, Heimkino & Soundbars',
    },
  },
  {
    id: 'cat-tvs',
    name: 'OLED & Mini-LED 4K TVs',
    slug: 'oled-4k-tvs',
    parentId: 'cat-tv-audio',
    description: 'Self-lit QD-OLED and Mini-LED 120Hz/144Hz 4K televisions with gaming VRR support.',
    sortOrder: 1,
    featured: true,
    status: 'published',
    seoMetadata: {
      title: 'OLED & Mini-LED Smart 4K TVs | OmniDiscover',
      description: 'Compare contrast ratios, HDMI 2.1 ports, input lag, and HDR brightness across top televisions.',
    },
    localizedNames: {
      ar: 'تلفزيونات OLED و Mini-LED بدقة 4K',
      es: 'Televisores OLED y Mini-LED 4K',
      fr: 'Téléviseurs OLED & Mini-LED 4K',
      de: 'OLED & Mini-LED 4K Fernseher',
    },
  },
  {
    id: 'cat-soundbars',
    name: 'Soundbars & Surround Audio',
    slug: 'soundbars-surround',
    parentId: 'cat-tv-audio',
    description: 'Wireless Dolby Atmos soundbars, multi-channel rear satellite systems, and powered subwoofers.',
    sortOrder: 2,
    featured: true,
    status: 'published',
    seoMetadata: {
      title: 'Dolby Atmos Soundbars & Subwoofers | OmniDiscover',
      description: 'Compare eARC connectivity, channel configurations (e.g. 9.1.4), and spatial audio room tuning.',
    },
    localizedNames: {
      ar: 'مكبرات الصوت Soundbars والصوت المحيطي',
      es: 'Barras de Sonido y Audio Envolvente',
      fr: 'Barres de Son & Audio Surround',
      de: 'Soundbars & Surround-Systeme',
    },
  },
  {
    id: 'cat-projectors',
    name: '4K Laser Projectors & Streaming',
    slug: 'projectors-streaming',
    parentId: 'cat-tv-audio',
    description: 'Ultra-short throw 4K laser projectors, portable cinema beamers, and 4K streaming sticks.',
    sortOrder: 3,
    featured: false,
    status: 'published',
    seoMetadata: {
      title: '4K Laser Projectors & Streaming Boxes | OmniDiscover',
      description: 'Compare ANSI lumens brightness, throw ratios, HDR10+, and built-in streaming platforms.',
    },
    localizedNames: {
      ar: 'أجهزة العرض الليزرية وأجهزة البث',
      es: 'Proyectores Láser 4K y Reproductores',
      fr: 'Vidéoprojecteurs Laser & Passerelles',
      de: '4K Laser-Beamer & Streaming',
    },
  },

  // 3. Home, Kitchen & Appliances (Department)
  {
    id: 'cat-kitchen',
    name: 'Home & Kitchen Tech',
    slug: 'home-kitchen',
    parentId: null,
    description: 'Artisan espresso makers, smart culinary appliances, air fryers, and automated home essentials.',
    sortOrder: 3,
    featured: true,
    status: 'published',
    seoMetadata: {
      title: 'Premium Home & Kitchen Tech | OmniDiscover',
      description: 'Discover precision espresso machines, culinary appliances, and smart home equipment.',
    },
    localizedNames: {
      ar: 'المنزل وتكنولوجيا المطبخ',
      es: 'Hogar y Cocina',
      fr: 'Maison & Cuisine',
      de: 'Küche & Haushalt',
    },
  },
  {
    id: 'cat-coffee',
    name: 'Espresso & Coffee Machines',
    slug: 'coffee-espresso',
    parentId: 'cat-kitchen',
    description: 'Manual and semi-automatic espresso machines, burr grinders, and specialty brewers.',
    sortOrder: 1,
    featured: true,
    status: 'published',
    seoMetadata: {
      title: 'Espresso Machines & Coffee Tech | OmniDiscover',
      description: 'Compare pump pressures, heating systems, and portafilter sizes for espresso machines.',
    },
    localizedNames: {
      ar: 'آلات القهوة والإسبريسو',
      es: 'Café y Máquinas de Espresso',
      fr: 'Machines à Café & Espresso',
      de: 'Kaffee & Espressomaschinen',
    },
    attributeIds: ['attr-pump-pressure', 'attr-boiler-type', 'attr-water-capacity', 'attr-grinder-included'],
  },
  {
    id: 'cat-cookware',
    name: 'Smart Kitchen & Air Fryers',
    slug: 'smart-cookware',
    parentId: 'cat-kitchen',
    description: 'Dual-zone air fryers, smart pressure cookers, precision sous vide, and blenders.',
    sortOrder: 2,
    featured: true,
    status: 'published',
    seoMetadata: {
      title: 'Air Fryers & Smart Kitchen Cookware | OmniDiscover',
      description: 'Compare air fryer capacities, heating presets, wattage, and dishwasher-safe components.',
    },
    localizedNames: {
      ar: 'القلايات الهوائية وأجهزة المطبخ الذكية',
      es: 'Freidoras de Aire y Cocina Inteligente',
      fr: 'Friteuses sans Huile & Cuiseurs',
      de: 'Heißluftfritteusen & Küchengeräte',
    },
  },
  {
    id: 'cat-cleaning',
    name: 'Robot Vacuums & Floor Care',
    slug: 'robot-vacuums',
    parentId: 'cat-kitchen',
    description: 'Autonomous LiDAR robot vacuums, self-emptying docks, sonic mops, and cordless stick vacuums.',
    sortOrder: 3,
    featured: true,
    status: 'published',
    seoMetadata: {
      title: 'Robot Vacuums & Smart Floor Cleaners | OmniDiscover',
      description: 'Compare suction power (Pa), obstacle avoidance, obstacle navigation, and auto-empty stations.',
    },
    localizedNames: {
      ar: 'مكانس الروبوت والعناية بالأرضيات',
      es: 'Robots Aspiradores y Limpieza',
      fr: 'Robots Aspirateurs & Nettoyeurs',
      de: 'Saugroboter & Bodenpflege',
    },
  },
  {
    id: 'cat-smart-home',
    name: 'Smart Home Automation & IoT',
    slug: 'smart-home',
    parentId: 'cat-kitchen',
    description: 'Smart thermostats, Matter/Zigbee hubs, video doorbells, and automated lighting systems.',
    sortOrder: 4,
    featured: false,
    status: 'published',
    seoMetadata: {
      title: 'Smart Home Hubs & IoT Automation | OmniDiscover',
      description: 'Compare Matter-compatible smart thermostats, surveillance security cameras, and smart hubs.',
    },
    localizedNames: {
      ar: 'أجهزة المنزل الذكي والأتمتة',
      es: 'Hogar Inteligente y Domótica',
      fr: 'Maison Connectée & Domotique',
      de: 'Smart Home & Hausautomation',
    },
  },

  // 4. Wearables & Smartwatches (Department)
  {
    id: 'cat-wearables',
    name: 'Wearables & Smartwatches',
    slug: 'wearables',
    parentId: null,
    description: 'Advanced GPS fitness smartwatches, luxury connected timepieces, health sensors, and smart rings.',
    sortOrder: 4,
    featured: true,
    status: 'published',
    seoMetadata: {
      title: 'Smartwatches, Fitness Bands & Health Wearables | OmniDiscover',
      description: 'Compare biometric sensors, battery life, titanium builds, and water resistance for top smartwatches.',
    },
    localizedNames: {
      ar: 'الساعات الذكية والأجهزة القابلة للارتداء',
      es: 'Smartwatches y Dispositivos Vestibles',
      fr: 'Montres Connectées & Wearables',
      de: 'Smartwatches & Wearables',
    },
  },
  {
    id: 'cat-smartwatches',
    name: 'Smartwatches & Sport GPS',
    slug: 'smartwatches-gps',
    parentId: 'cat-wearables',
    description: 'Multi-band GNSS outdoor watches, sapphire display smartwatches, and ECG monitors.',
    sortOrder: 1,
    featured: true,
    status: 'published',
    seoMetadata: {
      title: 'GPS Multisport Smartwatches | OmniDiscover',
      description: 'Compare titanium casings, dual-frequency GPS accuracy, heart rate variance, and AMOLED screens.',
    },
    localizedNames: {
      ar: 'الساعات الذكية والرياضية GPS',
      es: 'Relojes Inteligentes y Deportivos',
      fr: 'Montres GPS & Sport',
      de: 'GPS-Sportuhren & Smartwatches',
    },
  },
  {
    id: 'cat-smart-rings',
    name: 'Smart Rings & Health Bands',
    slug: 'smart-rings',
    parentId: 'cat-wearables',
    description: 'Lightweight biometric smart rings, continuous sleep stage tracking, and recovery readiness sensors.',
    sortOrder: 2,
    featured: true,
    status: 'published',
    seoMetadata: {
      title: 'Biometric Smart Rings & Sleep Trackers | OmniDiscover',
      description: 'Compare titanium ring weights, battery life, HRV sensors, and water ratings.',
    },
    localizedNames: {
      ar: 'الخواتم الذكية وأساور تتبع النوم',
      es: 'Anillos Inteligentes y Monitores de Salud',
      fr: 'Bagues Connectées & Sommeil',
      de: 'Smart Rings & Gesundheitssensoren',
    },
  },

  // 5. Gaming & Virtual Reality (Department)
  {
    id: 'cat-gaming',
    name: 'Gaming & Virtual Reality',
    slug: 'gaming',
    parentId: null,
    description: 'Next-gen gaming consoles, handheld gaming PCs, VR/AR headsets, and pro esports peripherals.',
    sortOrder: 5,
    featured: true,
    status: 'published',
    seoMetadata: {
      title: 'Gaming Consoles, Handhelds & VR Tech | OmniDiscover',
      description: 'Compare GPU benchmarks, frame rates, optical display resolutions, and esports gear.',
    },
    localizedNames: {
      ar: 'الألعاب والواقع الافتراضي',
      es: 'Gaming y Realidad Virtual',
      fr: 'Jeux Vidéo & Réalité Virtuelle',
      de: 'Gaming & Virtual Reality',
    },
  },
  {
    id: 'cat-consoles',
    name: 'Consoles & Handheld PCs',
    slug: 'gaming-consoles',
    parentId: 'cat-gaming',
    description: '4K/8K living room consoles, portable OLED gaming devices, and retro gaming handhelds.',
    sortOrder: 1,
    featured: true,
    status: 'published',
    seoMetadata: {
      title: 'Next-Gen Consoles & OLED Handhelds | OmniDiscover',
      description: 'Compare ray-tracing performance, storage expansion, portable battery runtimes, and game libraries.',
    },
    localizedNames: {
      ar: 'أجهزة الألعاب ووحدات التحكم المحمولة',
      es: 'Consolas y PC Portátiles',
      fr: 'Consoles & PC Portables de Jeu',
      de: 'Spielkonsolen & Gaming-Handhelds',
    },
  },
  {
    id: 'cat-vr-headsets',
    name: 'VR & Mixed Reality Headsets',
    slug: 'vr-mixed-reality',
    parentId: 'cat-gaming',
    description: 'Standalone wireless mixed reality headsets, high-density pancake optics, and hand tracking.',
    sortOrder: 2,
    featured: true,
    status: 'published',
    seoMetadata: {
      title: 'VR & Spatial Computing Headsets | OmniDiscover',
      description: 'Compare per-eye resolutions, refresh rates, spatial pass-through, and field of view.',
    },
    localizedNames: {
      ar: 'نظارات الواقع الافتراضي والمعزز',
      es: 'Gafas de Realidad Virtual y Mixta',
      fr: 'Casques VR & Réalité Mixte',
      de: 'VR-Brillen & Mixed Reality',
    },
  },
  {
    id: 'cat-gaming-accessories',
    name: 'Gaming Mice, Keyboards & Wheels',
    slug: 'gaming-peripherals',
    parentId: 'cat-gaming',
    description: 'Ultra-lightweight wireless gaming mice, rapid-trigger magnetic keyboards, and force feedback wheels.',
    sortOrder: 3,
    featured: false,
    status: 'published',
    seoMetadata: {
      title: 'Pro Gaming Mice, Keyboards & Controllers | OmniDiscover',
      description: 'Compare polling rates (up to 8000Hz), optical switches, and tactile response.',
    },
    localizedNames: {
      ar: 'ملحقات الألعاب ولوحات المفاتيح الاحترافية',
      es: 'Periféricos de Gaming y Teclados',
      fr: 'Souris & Claviers Gamer',
      de: 'Gaming-Mäuse & Tastaturen',
    },
  },

  // 6. Cameras, Drones & Imaging (Department)
  {
    id: 'cat-cameras',
    name: 'Cameras, Drones & Imaging',
    slug: 'cameras',
    parentId: null,
    description: 'Mirrorless cameras, 4K/8K aerial camera drones, gimbal stabilizers, and creator equipment.',
    sortOrder: 6,
    featured: true,
    status: 'published',
    seoMetadata: {
      title: 'Mirrorless Cameras & 4K Camera Drones | OmniDiscover',
      description: 'Compare camera sensors, video resolutions, gimbal stabilization, and obstacle sensing.',
    },
    localizedNames: {
      ar: 'الكاميرات والتصوير والدرونز',
      es: 'Cámaras, Drones y Fotografía',
      fr: 'Appareils Photo & Drones',
      de: 'Kameras & Drohnen',
    },
    attributeIds: ['attr-sensor-type', 'attr-resolution', 'attr-video-res', 'attr-lens-mount'],
  },
  {
    id: 'cat-drones',
    name: 'Camera Drones & Aerial Video',
    slug: 'camera-drones',
    parentId: 'cat-cameras',
    description: 'Sub-249g travel drones, omnidirectional obstacle avoidance, 4K/60fps HDR, and pro cinema drones.',
    sortOrder: 1,
    featured: true,
    status: 'published',
    seoMetadata: {
      title: '4K Camera Drones & Quadcopters | OmniDiscover',
      description: 'Compare flight times, sensor dimensions, transmission ranges, and wind resistance.',
    },
    localizedNames: {
      ar: 'طائرات الدرون وكاميرات التصوير الجوي',
      es: 'Drones con Cámara y Grabación Aérea',
      fr: 'Drones Caméra & Prises de Vue',
      de: 'Kameradrohnen & Luftaufnahmen',
    },
  },
  {
    id: 'cat-action-cameras',
    name: 'Action Cameras & 360 Video',
    slug: 'action-cameras',
    parentId: 'cat-cameras',
    description: 'Waterproof 5.3K action cams, 360-degree dual-lens cameras, and horizon-locking gimbals.',
    sortOrder: 2,
    featured: false,
    status: 'published',
    seoMetadata: {
      title: 'Action Cameras & 360 Dual-Lens Cams | OmniDiscover',
      description: 'Compare stabilization algorithms, underwater depth ratings, and frame rates.',
    },
    localizedNames: {
      ar: 'كاميرات الحركة والتصوير الرياضي 360',
      es: 'Cámaras de Acción y 360 Grados',
      fr: 'Caméras d\'Action & 360',
      de: 'Action-Cams & 360-Grad-Kameras',
    },
  },

  // 7. Sports, Fitness & Outdoors (Department)
  {
    id: 'cat-fitness',
    name: 'Sports, Fitness & Outdoors',
    slug: 'fitness-outdoors',
    parentId: null,
    description: 'Smart home gyms, adjustable dumbbells, electric bikes, and adventure camping equipment.',
    sortOrder: 7,
    featured: true,
    status: 'published',
    seoMetadata: {
      title: 'Home Fitness, Gym Tech & Outdoor Gear | OmniDiscover',
      description: 'Compare adjustable weights, cardio workout tracking, battery ranges on e-bikes, and camping gear.',
    },
    localizedNames: {
      ar: 'الرياضة واللياقة والأنشطة الخارجية',
      es: 'Deportes, Fitness y Aire Libre',
      fr: 'Sport, Fitness & Plein Air',
      de: 'Sport, Fitness & Outdoor',
    },
  },
  {
    id: 'cat-gym-equipment',
    name: 'Smart Home Gym & Dumbbells',
    slug: 'home-gym-equipment',
    parentId: 'cat-fitness',
    description: 'Digital motorized resistance gyms, dial-select adjustable dumbbells, and folding rowers.',
    sortOrder: 1,
    featured: true,
    status: 'published',
    seoMetadata: {
      title: 'Adjustable Dumbbells & Smart Home Gyms | OmniDiscover',
      description: 'Compare max weight capacity, space footprints, workout telemetry, and build materials.',
    },
    localizedNames: {
      ar: 'أجهزة الجيم المنزلي والأثقال الذكية',
      es: 'Gimnasio en Casa y Mancuernas Ajustables',
      fr: 'Appareils de Musculation & Haltères',
      de: 'Home-Gym & Verstellbare Hanteln',
    },
  },
  {
    id: 'cat-ebikes',
    name: 'Electric Bikes & Commuter Scooters',
    slug: 'electric-bikes-scooters',
    parentId: 'cat-fitness',
    description: 'Torque-sensor class 3 e-bikes, lightweight folding commuter bikes, and dual-motor scooters.',
    sortOrder: 2,
    featured: false,
    status: 'published',
    seoMetadata: {
      title: 'Electric Commuter Bikes & Scooters | OmniDiscover',
      description: 'Compare watt-hour battery capacities, real-world range, motor torque (Nm), and disc brakes.',
    },
    localizedNames: {
      ar: 'الدراجات الكهربائية والسكوتر الذكي',
      es: 'Bicicletas Eléctricas y Patinetes',
      fr: 'Vélos Électriques & Trottinettes',
      de: 'E-Bikes & E-Scooter',
    },
  },

  // 8. Beauty, Grooming & Wellness (Department)
  {
    id: 'cat-beauty',
    name: 'Beauty & Personal Care Tech',
    slug: 'beauty-grooming',
    parentId: null,
    description: 'Intelligent high-velocity hair dryers, sonic styling wands, electric shavers, and skincare devices.',
    sortOrder: 8,
    featured: true,
    status: 'published',
    seoMetadata: {
      title: 'Personal Grooming & Hair Care Technology | OmniDiscover',
      description: 'Compare heat control sensors, brushless motor RPMs, rotary shaving foils, and wet/dry durability.',
    },
    localizedNames: {
      ar: 'الجمال والعناية الشخصية والتصفيف',
      es: 'Belleza y Cuidado Personal',
      fr: 'Beauté & Soins Personnels',
      de: 'Schönheit & Körperpflege',
    },
  },
  {
    id: 'cat-hair-care',
    name: 'High-Velocity Hair Care & Styling',
    slug: 'hair-styling-tech',
    parentId: 'cat-beauty',
    description: 'Intelligent heat-regulated hair dryers, multi-styler air wands, and titanium ceramic straighteners.',
    sortOrder: 1,
    featured: true,
    status: 'published',
    seoMetadata: {
      title: 'Ionic Hair Dryers & Airwrap Multi-Stylers | OmniDiscover',
      description: 'Compare thermal sensor checks per second, airflow speeds, and styling attachments.',
    },
    localizedNames: {
      ar: 'مجففات الشعر وأجهزة التصفيف الذكية',
      es: 'Secadores Iónicos y Moldeadores',
      fr: 'Sèche-Cheveux & Coiffage',
      de: 'Haartrockner & Styling-Geräte',
    },
  },
  {
    id: 'cat-shavers',
    name: 'Electric Shavers & Precision Trimmers',
    slug: 'electric-shavers',
    parentId: 'cat-beauty',
    description: 'Wet/dry rotary shavers, foil shaving systems with sonic vibration, and beard detailers.',
    sortOrder: 2,
    featured: false,
    status: 'published',
    seoMetadata: {
      title: 'Wet & Dry Electric Shavers | OmniDiscover',
      description: 'Compare cuts-per-minute, flexible head contours, and self-cleaning station tech.',
    },
    localizedNames: {
      ar: 'ماكينات الحلاقة الكهربائية وتشذيب اللحية',
      es: 'Afeitadoras Eléctricas y Recortadoras',
      fr: 'Rasoirs Électriques & Tondeuses',
      de: 'Elektrische Rasierer & Trimmer',
    },
  },

  // 9. Office & Workspace Productivity (Department)
  {
    id: 'cat-office',
    name: 'Office & Workspace Setup',
    slug: 'office-workspace',
    parentId: null,
    description: 'Color-calibrated 4K/5K displays, ergonomic executive mesh chairs, and motorized standing desks.',
    sortOrder: 9,
    featured: true,
    status: 'published',
    seoMetadata: {
      title: 'Ergonomic Workspace, 4K Monitors & Productivity Tech | OmniDiscover',
      description: 'Compare monitor color gamuts, USB-C 90W charging, lumbar posture supports, and standing desks.',
    },
    localizedNames: {
      ar: 'المكتب ومساحات العمل الاحترافية',
      es: 'Oficina y Espacios de Trabajo',
      fr: 'Bureau & Productivité',
      de: 'Büro & Arbeitsplatz',
    },
  },
  {
    id: 'cat-monitors',
    name: '4K/5K Pro Monitors & Ultrawides',
    slug: 'pro-monitors-ultrawide',
    parentId: 'cat-office',
    description: 'Color-accurate IPS Black and OLED creator displays with USB-C single-cable dock support.',
    sortOrder: 1,
    featured: true,
    status: 'published',
    seoMetadata: {
      title: '4K & 5K Ultrawide Professional Monitors | OmniDiscover',
      description: 'Compare DCI-P3 color accuracy, Delta-E calibration, Thunderbolt 4 pass-through, and stand ergonomics.',
    },
    localizedNames: {
      ar: 'شاشات العرض الاحترافية 4K و 5K فائقة العرض',
      es: 'Monitores Profesionales 4K y Ultrawide',
      fr: 'Écrans Pro 4K & Ultrawide',
      de: '4K/5K Monitore & Ultrawide',
    },
  },
  {
    id: 'cat-ergonomic-furniture',
    name: 'Ergonomic Chairs & Motorized Desks',
    slug: 'ergonomic-chairs-desks',
    parentId: 'cat-office',
    description: 'Harmonic tilt mesh ergonomic task chairs and dual-motor electric height-adjustable standing desks.',
    sortOrder: 2,
    featured: true,
    status: 'published',
    seoMetadata: {
      title: 'Ergonomic Office Chairs & Standing Desks | OmniDiscover',
      description: 'Compare posture lumbar mechanics, weight ratings, motor lift speeds, and anti-collision safety.',
    },
    localizedNames: {
      ar: 'الكراسي المريحة والمكاتب الكهربائية القابلة للرفع',
      es: 'Sillas Ergonómicas y Escritorios Elevables',
      fr: 'Chaises Ergonomiques & Bureaux Assis-Debout',
      de: 'Ergonomische Stühle & Stehschreibtische',
    },
  },

  // 10. Automotive & EV Tech (Department)
  {
    id: 'cat-automotive',
    name: 'Automotive & EV Tech',
    slug: 'automotive-ev',
    parentId: null,
    description: 'Dual 4K HDR dash cams with parking surveillance, Level 2 EV home charging stations, and jump starters.',
    sortOrder: 10,
    featured: false,
    status: 'published',
    seoMetadata: {
      title: '4K Dash Cams, Level 2 EV Chargers & Auto Tech | OmniDiscover',
      description: 'Compare night-vision Starvis 2 sensors, EV charging amperage, and Wi-Fi fleet telemetry.',
    },
    localizedNames: {
      ar: 'تكنولوجيا السيارات والمركبات الكهربائية',
      es: 'Tecnología para Automóviles y VE',
      fr: 'High-Tech Auto & Véhicules Électriques',
      de: 'Auto & E-Mobilität',
    },
  },
  {
    id: 'cat-dashcams',
    name: '4K Dash Cams & Parking Monitors',
    slug: 'dash-cams',
    parentId: 'cat-automotive',
    description: 'Front and rear 4K HDR dash cameras, Sony Starvis 2 night vision, and cloud emergency backup.',
    sortOrder: 1,
    featured: false,
    status: 'published',
    seoMetadata: {
      title: '4K Front & Rear Dash Cameras | OmniDiscover',
      description: 'Compare frame rates, G-sensor collision locks, GPS speed logging, and parking modes.',
    },
    localizedNames: {
      ar: 'كاميرات المراقبة للسيارات Dash Cam 4K',
      es: 'Cámaras para Coche 4K Dashcam',
      fr: 'Dashcams 4K & Surveillance',
      de: '4K Dashcams & Parküberwachung',
    },
  },

  // 11. Travel, Bags & Smart Luggage (Department)
  {
    id: 'cat-travel',
    name: 'Travel & Smart Luggage',
    slug: 'travel-luggage',
    parentId: null,
    description: 'Polycarbonate spinner luggage with built-in battery ports, TSA compression packs, and tech bags.',
    sortOrder: 11,
    featured: false,
    status: 'published',
    seoMetadata: {
      title: 'Smart Carry-On Luggage & Travel Tech | OmniDiscover',
      description: 'Compare polycarbonate shell durability, 360 Japanese Hinomoto wheels, and internal packing capacity.',
    },
    localizedNames: {
      ar: 'السفر والحقائب الذكية',
      es: 'Equipaje Inteligente y Viajes',
      fr: 'Bagages Intelligents & Voyage',
      de: 'Reisegepäck & Smart Luggage',
    },
  },

  // 12. Musical Instruments & Pro Audio (Department)
  {
    id: 'cat-musical',
    name: 'Musical Instruments & Studio Gear',
    slug: 'musical-studio',
    parentId: null,
    description: 'Studio condenser microphones, USB audio interfaces, analog synthesizers, and studio monitors.',
    sortOrder: 12,
    featured: false,
    status: 'published',
    seoMetadata: {
      title: 'Studio Microphones, Interfaces & Synths | OmniDiscover',
      description: 'Compare preamp gain, DAC sampling rates (192kHz/24-bit), analog filters, and keybeds.',
    },
    localizedNames: {
      ar: 'الآلات الموسيقية ومعدات الأستوديو',
      es: 'Instrumentos Musicales y Estudio',
      fr: 'Instruments & Équipement Studio',
      de: 'Musikinstrumente & Studio-Equipment',
    },
  },
];

const INITIAL_ATTRIBUTES: AttributeDefinition[] = [
  {
    id: 'attr-wireless',
    name: 'Wireless Connectivity',
    slug: 'wireless',
    type: 'boolean',
    categoryIds: ['cat-audio'],
    isFilterable: true,
    isComparable: true,
  },
  {
    id: 'attr-anc',
    name: 'Active Noise Cancellation',
    slug: 'noise-cancellation',
    type: 'boolean',
    categoryIds: ['cat-audio'],
    isFilterable: true,
    isComparable: true,
  },
  {
    id: 'attr-battery',
    name: 'Battery Life',
    slug: 'battery-life',
    type: 'number',
    unit: 'Hours',
    categoryIds: ['cat-audio', 'cat-laptops'],
    isFilterable: true,
    isComparable: true,
  },
  {
    id: 'attr-weight',
    name: 'Weight',
    slug: 'weight',
    type: 'number',
    unit: 'g',
    categoryIds: ['cat-audio', 'cat-laptops', 'cat-cameras'],
    isFilterable: false,
    isComparable: true,
  },
  {
    id: 'attr-connectivity',
    name: 'Bluetooth Version',
    slug: 'bluetooth-version',
    type: 'select',
    options: ['5.0', '5.2', '5.3', '5.4'],
    categoryIds: ['cat-audio'],
    isFilterable: true,
    isComparable: true,
  },
  {
    id: 'attr-processor',
    name: 'Processor Model',
    slug: 'processor',
    type: 'select',
    options: ['Apple M3 Pro', 'Apple M3 Max', 'Intel Core Ultra 7', 'Intel Core i9-14900HX', 'AMD Ryzen 9 8945HS'],
    categoryIds: ['cat-laptops'],
    isFilterable: true,
    isComparable: true,
  },
  {
    id: 'attr-ram',
    name: 'System RAM',
    slug: 'ram',
    type: 'select',
    options: ['16GB', '32GB', '64GB', '128GB'],
    unit: 'GB',
    categoryIds: ['cat-laptops'],
    isFilterable: true,
    isComparable: true,
  },
  {
    id: 'attr-storage',
    name: 'Storage Capacity',
    slug: 'storage',
    type: 'select',
    options: ['512GB SSD', '1TB NVMe SSD', '2TB NVMe SSD', '4TB NVMe SSD'],
    categoryIds: ['cat-laptops'],
    isFilterable: true,
    isComparable: true,
  },
  {
    id: 'attr-screen-size',
    name: 'Screen Size',
    slug: 'screen-size',
    type: 'number',
    unit: 'Inches',
    categoryIds: ['cat-laptops'],
    isFilterable: true,
    isComparable: true,
  },
  {
    id: 'attr-pump-pressure',
    name: 'Pump Pressure',
    slug: 'pump-pressure',
    type: 'number',
    unit: 'Bar',
    categoryIds: ['cat-coffee'],
    isFilterable: true,
    isComparable: true,
  },
  {
    id: 'attr-grinder-included',
    name: 'Integrated Burr Grinder',
    slug: 'integrated-grinder',
    type: 'boolean',
    categoryIds: ['cat-coffee'],
    isFilterable: true,
    isComparable: true,
  }
];

const INITIAL_MERCHANTS: Merchant[] = [
  {
    id: 'merchant-amazon-us',
    name: 'Amazon US',
    slug: 'amazon-us',
    domain: 'amazon.com',
    logo: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=120&h=40&q=80',
    country: 'US',
    defaultCurrency: 'USD',
    affiliateParamKey: 'tag',
    defaultAffiliateId: 'omnidiscover-us-20',
    status: 'active',
  },
  {
    id: 'merchant-amazon-uk',
    name: 'Amazon UK',
    slug: 'amazon-uk',
    domain: 'amazon.co.uk',
    logo: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=120&h=40&q=80',
    country: 'UK',
    defaultCurrency: 'GBP',
    affiliateParamKey: 'tag',
    defaultAffiliateId: 'omnidiscover-uk-21',
    status: 'active',
  },
  {
    id: 'merchant-amazon-de',
    name: 'Amazon DE',
    slug: 'amazon-de',
    domain: 'amazon.de',
    logo: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=120&h=40&q=80',
    country: 'DE',
    defaultCurrency: 'EUR',
    affiliateParamKey: 'tag',
    defaultAffiliateId: 'omnidiscover-de-21',
    status: 'active',
  },
  {
    id: 'merchant-walmart',
    name: 'Walmart',
    slug: 'walmart',
    domain: 'walmart.com',
    logo: 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?auto=format&fit=crop&w=120&h=40&q=80',
    country: 'US',
    defaultCurrency: 'USD',
    affiliateParamKey: 'affp',
    defaultAffiliateId: 'omni_walmart_aff',
    status: 'active',
  },
  {
    id: 'merchant-bestbuy',
    name: 'Best Buy',
    slug: 'bestbuy',
    domain: 'bestbuy.com',
    logo: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=120&h=40&q=80',
    country: 'US',
    defaultCurrency: 'USD',
    affiliateParamKey: 'affId',
    defaultAffiliateId: 'omni_bby_aff',
    status: 'active',
  },
  {
    id: 'merchant-aliexpress',
    name: 'AliExpress',
    slug: 'aliexpress',
    domain: 'aliexpress.com',
    logo: 'https://images.unsplash.com/photo-1555421689-491a97ff2040?auto=format&fit=crop&w=120&h=40&q=80',
    country: 'US',
    defaultCurrency: 'USD',
    affiliateParamKey: 'aff_platform',
    defaultAffiliateId: 'omni_aliexpress_aff',
    status: 'active',
  },
  {
    id: 'merchant-ebay',
    name: 'eBay',
    slug: 'ebay',
    domain: 'ebay.com',
    logo: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=120&h=40&q=80',
    country: 'US',
    defaultCurrency: 'USD',
    affiliateParamKey: 'campid',
    defaultAffiliateId: 'omni_ebay_aff',
    status: 'active',
  },
  {
    id: 'merchant-target',
    name: 'Target',
    slug: 'target',
    domain: 'target.com',
    logo: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=120&h=40&q=80',
    country: 'US',
    defaultCurrency: 'USD',
    affiliateParamKey: 'afid',
    defaultAffiliateId: 'omni_target_aff',
    status: 'active',
  },
  {
    id: 'merchant-noon',
    name: 'Noon',
    slug: 'noon',
    domain: 'noon.com',
    logo: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=120&h=40&q=80',
    country: 'US',
    defaultCurrency: 'USD',
    affiliateParamKey: 'ref',
    defaultAffiliateId: 'omni_noon_aff',
    status: 'active',
  },
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-sony-wh1000xm5',
    slug: 'sony-wh-1000xm5-wireless-noise-cancelling-headphones',
    name: 'Sony WH-1000XM5 Wireless Noise-Cancelling Headphones',
    brandId: 'brand-sony',
    brandName: 'Sony',
    categoryIds: ['cat-electronics', 'cat-audio'],
    primaryCategoryId: 'cat-audio',
    description: 'The Sony WH-1000XM5 wireless headphones rewrite the rules for distraction-free listening. Equipped with two processors controlling eight microphones, Auto NC Optimizer for automatically optimizing noise cancelling based on wearing conditions, and a specially designed 30mm carbon fiber composite driver unit for refined acoustic performance.',
    shortDescription: 'Flagship wireless over-ear headphones featuring dual processor noise cancellation, 30-hour battery runtime, and high-resolution LDAC audio.',
    images: [
      {
        id: 'img-xm5-1',
        url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=85',
        alt: 'Sony WH-1000XM5 Black over-ear headphones',
        isPrimary: true,
        sortOrder: 1,
      },
      {
        id: 'img-xm5-2',
        url: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=85',
        alt: 'Sony WH-1000XM5 side profile and earcups',
        isPrimary: false,
        sortOrder: 2,
      },
    ],
    identifiers: {
      asin: 'B09XS7JWHH',
      sku: 'WH1000XM5/B',
      upc: '027242923515',
      modelNumber: 'WH-1000XM5',
    },
    rating: 4.6,
    reviewCount: 14820,
    price: 398.00,
    currency: 'USD',
    availability: 'in_stock',
    specifications: {
      'Headphone Type': 'Closed, dynamic',
      'Driver Unit': '30mm, dome type (CCAW Voice coil)',
      'Frequency Response': '4 Hz - 40,000 Hz',
      'Battery Charge Time': 'Approx. 3.5 Hours (USB PD fast charge)',
      'Weight': 'Approx. 250g',
      'Bluetooth': 'Version 5.2 (LDAC, AAC, SBC)',
    },
    features: [
      'Dual-processor Integrated Processor V1 and HD Noise Cancelling Processor QN1',
      'Magnificent sound with new 30mm driver with soft TPU edge',
      'Crystal clear hands-free calling with 4 beamforming microphones and AI noise reduction algorithm',
      'Up to 30-hour battery life with quick charging (3 min charge for 3 hours of playback)',
      'Multi-point Bluetooth pairing connects seamlessly to two devices simultaneously',
    ],
    attributes: [
      { attributeId: 'attr-wireless', attributeSlug: 'wireless', name: 'Wireless Connectivity', value: true, displayValue: 'Yes' },
      { attributeId: 'attr-anc', attributeSlug: 'noise-cancellation', name: 'Active Noise Cancellation', value: true, displayValue: 'Advanced Auto-NC' },
      { attributeId: 'attr-battery', attributeSlug: 'battery-life', name: 'Battery Life', value: 30, displayValue: '30 Hours', unit: 'Hours' },
      { attributeId: 'attr-weight', attributeSlug: 'weight', name: 'Weight', value: 250, displayValue: '250 g', unit: 'g' },
      { attributeId: 'attr-connectivity', attributeSlug: 'bluetooth-version', name: 'Bluetooth Version', value: '5.2', displayValue: 'Bluetooth 5.2' },
    ],
    tags: ['wireless', 'noise-cancelling', 'over-ear', 'travel', 'audiophile', 'bluetooth'],
    merchantOffers: [
      {
        id: 'offer-xm5-amz-us',
        productId: 'prod-sony-wh1000xm5',
        merchantId: 'merchant-amazon-us',
        merchantName: 'Amazon US',
        merchantLogo: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=120&h=40&q=80',
        productUrl: 'https://www.amazon.com/dp/B09XS7JWHH',
        affiliateUrl: 'https://www.amazon.com/dp/B09XS7JWHH?tag=omnidiscover-us-20',
        price: 398.00,
        currency: 'USD',
        availability: 'in_stock',
        lastChecked: '2025-05-10T12:00:00Z',
        status: 'active',
        market: 'US',
      },
      {
        id: 'offer-xm5-bby',
        productId: 'prod-sony-wh1000xm5',
        merchantId: 'merchant-bestbuy',
        merchantName: 'Best Buy',
        merchantLogo: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=120&h=40&q=80',
        productUrl: 'https://www.bestbuy.com/site/sony-wh-1000xm5/6505727.p',
        affiliateUrl: 'https://www.bestbuy.com/site/sony-wh-1000xm5/6505727.p?affId=omni_bby_aff',
        price: 399.99,
        currency: 'USD',
        availability: 'in_stock',
        lastChecked: '2025-05-10T12:00:00Z',
        status: 'active',
        market: 'US',
      },
    ],
    seoMetadata: {
      title: 'Sony WH-1000XM5 Specs, Best Price & Review Breakdown | OmniDiscover',
      description: 'Discover full technical specifications, verified noise-cancelling metrics, battery runtime, and compare current Amazon & merchant pricing on Sony WH-1000XM5.',
    },
    status: 'published',
    createdAt: '2025-01-10T00:00:00Z',
    updatedAt: '2025-05-01T00:00:00Z',
    publishedAt: '2025-01-10T00:00:00Z',
  },
  {
    id: 'prod-bose-qc-ultra',
    slug: 'bose-quietcomfort-ultra-wireless-noise-cancelling-headphones',
    name: 'Bose QuietComfort Ultra Wireless Noise-Cancelling Headphones',
    brandId: 'brand-bose',
    brandName: 'Bose',
    categoryIds: ['cat-electronics', 'cat-audio'],
    primaryCategoryId: 'cat-audio',
    description: 'Bose QuietComfort Ultra headphones offer world-class active noise cancellation with breakthrough Bose Immersive Audio spatialized sound. Crafted with plush synthetic leather cushions and CustomTune technology that personalizes acoustic performance specifically to the user ear shape.',
    shortDescription: 'Premium wireless headphones with breakthrough Bose Immersive Audio, CustomTune calibration, and 24-hour battery playback.',
    images: [
      {
        id: 'img-bose-1',
        url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=85',
        alt: 'Bose QuietComfort Ultra wireless headphones in smoke white',
        isPrimary: true,
        sortOrder: 1,
      },
      {
        id: 'img-bose-2',
        url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=85',
        alt: 'Bose QuietComfort Ultra earcup hinge detail',
        isPrimary: false,
        sortOrder: 2,
      },
    ],
    identifiers: {
      asin: 'B0CCZ1L489',
      sku: '880066-0100',
      upc: '017817845786',
      modelNumber: 'QC-ULTRA-HP',
    },
    rating: 4.5,
    reviewCount: 8940,
    price: 429.00,
    currency: 'USD',
    availability: 'in_stock',
    specifications: {
      'Headphone Fit': 'Around-Ear / Over-Ear',
      'Microphones': 'Built-in microphone array for noise cancelling & clear calls',
      'Battery Life': 'Up to 24 hours (up to 18 hours with Immersive Audio)',
      'Charging Port': 'USB-C (15 min charge = up to 2.5 hours)',
      'Weight': '254 g',
      'Bluetooth': 'Version 5.3 (aptX Adaptive, AAC, SBC)',
    },
    features: [
      'Bose Immersive Audio pushes sound outside your head for hyper-realistic spatial presentation',
      'World-class Quiet Mode, Aware Mode with ActiveSense, and Immersion Mode',
      'CustomTune technology analyzes ear geometry and customizes sound & ANC accordingly',
      'Ultra-plush protein leather earcups with cast aluminum yokes',
      'Advanced wind-block mic array ensures pristine voice capture',
    ],
    attributes: [
      { attributeId: 'attr-wireless', attributeSlug: 'wireless', name: 'Wireless Connectivity', value: true, displayValue: 'Yes' },
      { attributeId: 'attr-anc', attributeSlug: 'noise-cancellation', name: 'Active Noise Cancellation', value: true, displayValue: 'Bose CustomTune ANC' },
      { attributeId: 'attr-battery', attributeSlug: 'battery-life', name: 'Battery Life', value: 24, displayValue: '24 Hours', unit: 'Hours' },
      { attributeId: 'attr-weight', attributeSlug: 'weight', name: 'Weight', value: 254, displayValue: '254 g', unit: 'g' },
      { attributeId: 'attr-connectivity', attributeSlug: 'bluetooth-version', name: 'Bluetooth Version', value: '5.3', displayValue: 'Bluetooth 5.3' },
    ],
    tags: ['wireless', 'noise-cancelling', 'over-ear', 'travel', 'spatial-audio', 'bluetooth'],
    merchantOffers: [
      {
        id: 'offer-bose-amz-us',
        productId: 'prod-bose-qc-ultra',
        merchantId: 'merchant-amazon-us',
        merchantName: 'Amazon US',
        merchantLogo: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=120&h=40&q=80',
        productUrl: 'https://www.amazon.com/dp/B0CCZ1L489',
        affiliateUrl: 'https://www.amazon.com/dp/B0CCZ1L489?tag=omnidiscover-us-20',
        price: 429.00,
        currency: 'USD',
        availability: 'in_stock',
        lastChecked: '2025-05-10T12:00:00Z',
        status: 'active',
        market: 'US',
      },
    ],
    seoMetadata: {
      title: 'Bose QuietComfort Ultra Specs, Price Comparison & Audio Metrics | OmniDiscover',
      description: 'Explore Bose QuietComfort Ultra spatial audio specs, battery runtime benchmarks, and live merchant pricing.',
    },
    status: 'published',
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-05-02T00:00:00Z',
    publishedAt: '2025-01-15T00:00:00Z',
  },
  {
    id: 'prod-apple-macbook-pro-16-m3-max',
    slug: 'apple-macbook-pro-16-inch-m3-max',
    name: 'Apple MacBook Pro 16-inch (M3 Max, 36GB RAM, 1TB SSD)',
    brandId: 'brand-apple',
    brandName: 'Apple',
    categoryIds: ['cat-electronics', 'cat-laptops'],
    primaryCategoryId: 'cat-laptops',
    description: 'The 16-inch MacBook Pro blasts forward with M3 Max, an extraordinarily advanced chip for demanding pro workflows. Featuring up to 16 CPU cores, up to 40 GPU cores, hardware-accelerated ray tracing, Liquid Retina XDR display with 1600 nits peak HDR brightness, and up to 22 hours of battery life.',
    shortDescription: 'Ultimate pro creator laptop with Apple M3 Max 16-core CPU, 40-core GPU, Liquid Retina XDR screen, and 22h battery.',
    images: [
      {
        id: 'img-mbp-1',
        url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=85',
        alt: 'Apple MacBook Pro 16 inch Space Black display and keyboard',
        isPrimary: true,
        sortOrder: 1,
      },
      {
        id: 'img-mbp-2',
        url: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=800&q=85',
        alt: 'Apple MacBook Pro aluminum chassis and MagSafe ports',
        isPrimary: false,
        sortOrder: 2,
      },
    ],
    identifiers: {
      asin: 'B0CM5JVV64',
      sku: 'MUW63LL/A',
      upc: '195949033484',
      modelNumber: 'A2991',
    },
    rating: 4.8,
    reviewCount: 3290,
    price: 3499.00,
    currency: 'USD',
    availability: 'in_stock',
    specifications: {
      'Processor': 'Apple M3 Max (16-core CPU with 12 performance and 4 efficiency cores)',
      'Graphics': '40-core GPU with hardware-accelerated ray tracing',
      'Unified Memory': '36GB Unified Memory (Configurable up to 128GB)',
      'Storage': '1TB PCIe 4.0 NVMe SSD',
      'Display': '16.2-inch Liquid Retina XDR (3456x2234, 120Hz ProMotion, 1600 nits peak)',
      'Ports': '3x Thunderbolt 4 / USB-C, HDMI 2.1, SDXC slot, MagSafe 3, 3.5mm headphone',
      'Weight': '2.16 kg (4.8 lbs)',
    },
    features: [
      'Mind-blowing speed with Apple M3 Max architecture built on 3nm process',
      'Stunning Liquid Retina XDR with Extreme Dynamic Range and 1,000,000:1 contrast ratio',
      'Studio-quality three-mic array and six-speaker sound system with Spatial Audio',
      'Industry-leading efficiency delivers up to 22 hours of continuous power unplugged',
    ],
    attributes: [
      { attributeId: 'attr-processor', attributeSlug: 'processor', name: 'Processor Model', value: 'Apple M3 Max', displayValue: 'Apple M3 Max 16-Core' },
      { attributeId: 'attr-ram', attributeSlug: 'ram', name: 'System RAM', value: '36GB', displayValue: '36GB Unified', unit: 'GB' },
      { attributeId: 'attr-storage', attributeSlug: 'storage', name: 'Storage Capacity', value: '1TB NVMe SSD', displayValue: '1TB NVMe SSD' },
      { attributeId: 'attr-screen-size', attributeSlug: 'screen-size', name: 'Screen Size', value: 16.2, displayValue: '16.2"', unit: 'Inches' },
      { attributeId: 'attr-battery', attributeSlug: 'battery-life', name: 'Battery Life', value: 22, displayValue: '22 Hours', unit: 'Hours' },
      { attributeId: 'attr-weight', attributeSlug: 'weight', name: 'Weight', value: 2160, displayValue: '2160 g', unit: 'g' },
    ],
    tags: ['laptop', 'apple-silicon', 'creator', '4k-editing', 'ultrabook', 'pro-workstation'],
    merchantOffers: [
      {
        id: 'offer-mbp-amz-us',
        productId: 'prod-apple-macbook-pro-16-m3-max',
        merchantId: 'merchant-amazon-us',
        merchantName: 'Amazon US',
        merchantLogo: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=120&h=40&q=80',
        productUrl: 'https://www.amazon.com/dp/B0CM5JVV64',
        affiliateUrl: 'https://www.amazon.com/dp/B0CM5JVV64?tag=omnidiscover-us-20',
        price: 3499.00,
        currency: 'USD',
        availability: 'in_stock',
        lastChecked: '2025-05-10T12:00:00Z',
        status: 'active',
        market: 'US',
      },
      {
        id: 'offer-mbp-bby',
        productId: 'prod-apple-macbook-pro-16-m3-max',
        merchantId: 'merchant-bestbuy',
        merchantName: 'Best Buy',
        merchantLogo: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=120&h=40&q=80',
        productUrl: 'https://www.bestbuy.com/site/apple-macbook-pro-16-m3-max/6534645.p',
        affiliateUrl: 'https://www.bestbuy.com/site/apple-macbook-pro-16-m3-max/6534645.p?affId=omni_bby_aff',
        price: 3499.00,
        currency: 'USD',
        availability: 'in_stock',
        lastChecked: '2025-05-10T12:00:00Z',
        status: 'active',
        market: 'US',
      },
    ],
    seoMetadata: {
      title: 'Apple MacBook Pro 16 M3 Max Hardware Specs & Pricing | OmniDiscover',
      description: 'Detailed benchmarks, 16-core CPU/40-core GPU specs, Liquid Retina XDR screen metrics, and multi-merchant pricing for Apple MacBook Pro 16.',
    },
    status: 'published',
    createdAt: '2025-01-20T00:00:00Z',
    updatedAt: '2025-05-01T00:00:00Z',
    publishedAt: '2025-01-20T00:00:00Z',
  },
  {
    id: 'prod-dell-xps-16',
    slug: 'dell-xps-16-oled-intel-core-ultra-7',
    name: 'Dell XPS 16 9640 (Intel Core Ultra 7 155H, 32GB RAM, 1TB SSD, RTX 4070)',
    brandId: 'brand-dell',
    brandName: 'Dell',
    categoryIds: ['cat-electronics', 'cat-laptops'],
    primaryCategoryId: 'cat-laptops',
    description: 'Dell XPS 16 combines futuristic CNC machined aluminum design with high-end generative AI hardware acceleration. Featuring a 16.3-inch 4K+ OLED InfinityEdge touch screen, Intel Core Ultra 7 processor with dedicated NPU, NVIDIA GeForce RTX 4070 graphics, and invisible seamless glass touchpad.',
    shortDescription: 'Futuristic Windows flagship laptop with 4K+ OLED touch display, Intel Core Ultra 7, and NVIDIA RTX 4070 power.',
    images: [
      {
        id: 'img-xps-1',
        url: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=85',
        alt: 'Dell XPS 16 laptop open on clean modern desk',
        isPrimary: true,
        sortOrder: 1,
      },
    ],
    identifiers: {
      asin: 'B0CVN788QW',
      sku: 'XPS9640-7981SLV-PUS',
      upc: '884116462712',
      modelNumber: 'XPS 9640',
    },
    rating: 4.4,
    reviewCount: 1140,
    price: 2749.99,
    currency: 'USD',
    availability: 'in_stock',
    specifications: {
      'Processor': 'Intel Core Ultra 7 155H (16 cores, 22 threads, up to 4.8 GHz)',
      'Graphics': 'NVIDIA GeForce RTX 4070 (8GB GDDR6)',
      'Memory': '32GB LPDDR5x 7467MHz Dual Channel',
      'Storage': '1TB M.2 PCIe NVMe SSD',
      'Display': '16.3" 4K+ (3840 x 2400) OLED Touch, 400-nit, 100% DCI-P3',
      'Weight': '2.13 kg (4.7 lbs)',
    },
    features: [
      'Edge-to-edge glass palm rest with hidden haptic touchpad and seamless zero-lattice keyboard',
      'Vibrant 4K+ OLED panel with 100% DCI-P3 color gamut and Eyesafe low blue light hardware',
      'NVIDIA Studio validated for real-time 3D rendering and video production workflows',
    ],
    attributes: [
      { attributeId: 'attr-processor', attributeSlug: 'processor', name: 'Processor Model', value: 'Intel Core Ultra 7', displayValue: 'Intel Core Ultra 7 155H' },
      { attributeId: 'attr-ram', attributeSlug: 'ram', name: 'System RAM', value: '32GB', displayValue: '32GB LPDDR5x', unit: 'GB' },
      { attributeId: 'attr-storage', attributeSlug: 'storage', name: 'Storage Capacity', value: '1TB NVMe SSD', displayValue: '1TB NVMe SSD' },
      { attributeId: 'attr-screen-size', attributeSlug: 'screen-size', name: 'Screen Size', value: 16.3, displayValue: '16.3"', unit: 'Inches' },
      { attributeId: 'attr-battery', attributeSlug: 'battery-life', name: 'Battery Life', value: 14, displayValue: '14 Hours', unit: 'Hours' },
      { attributeId: 'attr-weight', attributeSlug: 'weight', name: 'Weight', value: 2130, displayValue: '2130 g', unit: 'g' },
    ],
    tags: ['laptop', 'oled', 'rtx-4070', 'creator', 'windows', 'touchscreen'],
    merchantOffers: [
      {
        id: 'offer-xps-amz-us',
        productId: 'prod-dell-xps-16',
        merchantId: 'merchant-amazon-us',
        merchantName: 'Amazon US',
        merchantLogo: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=120&h=40&q=80',
        productUrl: 'https://www.amazon.com/dp/B0CVN788QW',
        affiliateUrl: 'https://www.amazon.com/dp/B0CVN788QW?tag=omnidiscover-us-20',
        price: 2749.99,
        currency: 'USD',
        availability: 'in_stock',
        lastChecked: '2025-05-10T12:00:00Z',
        status: 'active',
        market: 'US',
      },
    ],
    seoMetadata: {
      title: 'Dell XPS 16 OLED Specs, RTX 4070 Benchmarks & Pricing | OmniDiscover',
      description: 'Review full technical specifications for Dell XPS 16 with Intel Core Ultra 7 and 4K OLED display.',
    },
    status: 'published',
    createdAt: '2025-02-01T00:00:00Z',
    updatedAt: '2025-05-01T00:00:00Z',
    publishedAt: '2025-02-01T00:00:00Z',
  },
  {
    id: 'prod-breville-barista-touch-impress',
    slug: 'breville-barista-touch-impress-espresso-machine',
    name: 'Breville Barista Touch Impress Espresso Machine',
    brandId: 'brand-breville',
    brandName: 'Breville',
    categoryIds: ['cat-kitchen', 'cat-coffee'],
    primaryCategoryId: 'cat-coffee',
    description: 'The Breville Barista Touch Impress delivers step-by-step barista guidance in real time with intuitive touchscreen assistance. Featuring the Impress Puck System for intelligent dosing and precision assisted tamping with a 7-degree barista twist, ThermoJet 3-second heating system, and Auto MilQ microfoam textured for dairy, oat, almond, and soy milks.',
    shortDescription: 'Smart touchscreen espresso machine with automated puck dosing, assisted 10kg tamping, and ThermoJet 3-second heat-up.',
    images: [
      {
        id: 'img-breville-1',
        url: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=800&q=85',
        alt: 'Breville Barista Touch Impress stainless steel espresso maker',
        isPrimary: true,
        sortOrder: 1,
      },
    ],
    identifiers: {
      asin: 'B0C7J8XZKL',
      sku: 'BES881BSS1BNA1',
      upc: '021614804368',
      modelNumber: 'BES881BSS',
    },
    rating: 4.7,
    reviewCount: 2850,
    price: 1499.95,
    currency: 'USD',
    availability: 'in_stock',
    specifications: {
      'Heating System': 'ThermoJet heating system (3 seconds to brewing temp)',
      'Pump Pressure': '15 Bar Italian Pump (9 bar extraction pressure)',
      'Water Tank Capacity': '2.0 Liters (67.6 fl oz)',
      'Bean Hopper Capacity': '340g (12 oz)',
      'Portafilter': '54mm stainless steel portafilter',
      'Steam Wand': 'Auto MilQ hands-free microfoam with dairy & plant milk calibration',
    },
    features: [
      'Barista Touch interactive touchscreen displays step-by-step beverage preparation',
      'Impress Puck System provides intelligent dosing and calibrated 10kg tamp with 7-degree twist',
      'Auto MilQ optimizes air injection and temperature specifically for oat, almond, and whole milks',
      'Precision conical burr grinder with 30 grind size settings',
    ],
    attributes: [
      { attributeId: 'attr-pump-pressure', attributeSlug: 'pump-pressure', name: 'Pump Pressure', value: 15, displayValue: '15 Bar', unit: 'Bar' },
      { attributeId: 'attr-grinder-included', attributeSlug: 'integrated-grinder', name: 'Integrated Burr Grinder', value: true, displayValue: 'Yes (Conical Burr 30 Settings)' },
    ],
    tags: ['espresso', 'coffee-maker', 'barista', 'kitchen-appliances', 'touchscreen', 'auto-milq'],
    merchantOffers: [
      {
        id: 'offer-brev-amz-us',
        productId: 'prod-breville-barista-touch-impress',
        merchantId: 'merchant-amazon-us',
        merchantName: 'Amazon US',
        merchantLogo: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=120&h=40&q=80',
        productUrl: 'https://www.amazon.com/dp/B0C7J8XZKL',
        affiliateUrl: 'https://www.amazon.com/dp/B0C7J8XZKL?tag=omnidiscover-us-20',
        price: 1499.95,
        currency: 'USD',
        availability: 'in_stock',
        lastChecked: '2025-05-10T12:00:00Z',
        status: 'active',
        market: 'US',
      },
    ],
    seoMetadata: {
      title: 'Breville Barista Touch Impress Espresso Machine Specs & Price | OmniDiscover',
      description: 'Discover full specs, automated puck system details, and verified pricing for Breville Barista Touch Impress.',
    },
    status: 'published',
    createdAt: '2025-02-15T00:00:00Z',
    updatedAt: '2025-05-01T00:00:00Z',
    publishedAt: '2025-02-15T00:00:00Z',
  },
  {
    id: 'prod-sennheiser-momentum-4',
    slug: 'sennheiser-momentum-4-wireless-headphones',
    name: 'Sennheiser Momentum 4 Wireless Headphones',
    brandId: 'brand-sennheiser',
    brandName: 'Sennheiser',
    categoryIds: ['cat-electronics', 'cat-audio'],
    primaryCategoryId: 'cat-audio',
    description: 'Sennheiser Momentum 4 Wireless sets the gold standard for audio quality and monster battery life. Boasting an astounding 60 hours of playtime on a single charge with active noise cancellation enabled, 42mm audiophile-inspired transducer system, and personalized sound profiling.',
    shortDescription: 'Audiophile acoustic tuning with exceptional 60-hour battery life and adaptive hybrid noise cancellation.',
    images: [
      {
        id: 'img-sen-1',
        url: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=85',
        alt: 'Sennheiser Momentum 4 Wireless headphones in graphite black',
        isPrimary: true,
        sortOrder: 1,
      },
    ],
    identifiers: {
      asin: 'B0B6GHW1X8',
      sku: '509266',
      upc: '810091270516',
      modelNumber: 'M4AEBT',
    },
    rating: 4.5,
    reviewCount: 6320,
    price: 299.95,
    currency: 'USD',
    availability: 'in_stock',
    specifications: {
      'Transducer Principle': 'Dynamic, 42mm diameter',
      'Frequency Response': '6 Hz to 22,000 Hz',
      'Battery Runtime': 'Up to 60 hours music playback via Bluetooth and ANC',
      'Charging Time': 'Approx. 2 hrs for full charge (10 min charge = 6 hrs playback)',
      'Weight': '293 g',
      'Bluetooth': '5.2 compliant (aptX Adaptive, aptX, AAC, SBC)',
    },
    features: [
      'Industry-leading 60-hour battery runtime beats nearly every competitor on the market',
      'Sennheiser Signature Sound powered by 42mm transducer system for musical dynamics and detail',
      'Adaptive Noise Cancellation automatically adjusts to environmental noise',
      'Smart Pause automatically halts playback when headphones are removed',
    ],
    attributes: [
      { attributeId: 'attr-wireless', attributeSlug: 'wireless', name: 'Wireless Connectivity', value: true, displayValue: 'Yes' },
      { attributeId: 'attr-anc', attributeSlug: 'noise-cancellation', name: 'Active Noise Cancellation', value: true, displayValue: 'Adaptive Hybrid ANC' },
      { attributeId: 'attr-battery', attributeSlug: 'battery-life', name: 'Battery Life', value: 60, displayValue: '60 Hours', unit: 'Hours' },
      { attributeId: 'attr-weight', attributeSlug: 'weight', name: 'Weight', value: 293, displayValue: '293 g', unit: 'g' },
      { attributeId: 'attr-connectivity', attributeSlug: 'bluetooth-version', name: 'Bluetooth Version', value: '5.2', displayValue: 'Bluetooth 5.2' },
    ],
    tags: ['wireless', 'noise-cancelling', 'over-ear', '60-hour-battery', 'audiophile', 'bluetooth'],
    merchantOffers: [
      {
        id: 'offer-sen-amz-us',
        productId: 'prod-sennheiser-momentum-4',
        merchantId: 'merchant-amazon-us',
        merchantName: 'Amazon US',
        merchantLogo: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=120&h=40&q=80',
        productUrl: 'https://www.amazon.com/dp/B0B6GHW1X8',
        affiliateUrl: 'https://www.amazon.com/dp/B0B6GHW1X8?tag=omnidiscover-us-20',
        price: 299.95,
        currency: 'USD',
        availability: 'in_stock',
        lastChecked: '2025-05-10T12:00:00Z',
        status: 'active',
        market: 'US',
      },
    ],
    seoMetadata: {
      title: 'Sennheiser Momentum 4 Specs, 60H Battery & Pricing | OmniDiscover',
      description: 'Comprehensive specs and price breakdown for Sennheiser Momentum 4 Wireless with 60-hour battery life.',
    },
    status: 'published',
    createdAt: '2025-02-18T00:00:00Z',
    updatedAt: '2025-05-01T00:00:00Z',
    publishedAt: '2025-02-18T00:00:00Z',
  },
];

const INITIAL_COMPARISONS: Comparison[] = [
  {
    id: 'comp-xm5-vs-bose-ultra',
    slug: 'sony-wh-1000xm5-vs-bose-quietcomfort-ultra',
    title: 'Sony WH-1000XM5 vs. Bose QuietComfort Ultra',
    description: 'Head-to-head comparison of two leading flagship noise-cancelling headphones evaluating sound quality, spatial immersion, battery life, weight, and price.',
    productIds: ['prod-sony-wh1000xm5', 'prod-bose-qc-ultra', 'prod-sennheiser-momentum-4'],
    featured: true,
    seoMetadata: {
      title: 'Sony WH-1000XM5 vs Bose QC Ultra: Specs Comparison | OmniDiscover',
      description: 'Direct technical specs comparison between Sony WH-1000XM5 and Bose QuietComfort Ultra. See differences in ANC, battery, Bluetooth codecs, and price.',
    },
    createdAt: '2025-02-20T00:00:00Z',
  },
  {
    id: 'comp-mbp-vs-dell-xps',
    slug: 'apple-macbook-pro-16-m3-max-vs-dell-xps-16',
    title: 'Apple MacBook Pro 16 (M3 Max) vs. Dell XPS 16',
    description: 'Battle of the premier 16-inch creator laptops: Apple Silicon efficiency versus Windows 4K OLED RTX power.',
    productIds: ['prod-apple-macbook-pro-16-m3-max', 'prod-dell-xps-16'],
    featured: true,
    seoMetadata: {
      title: 'MacBook Pro 16 M3 Max vs Dell XPS 16 OLED Comparison | OmniDiscover',
      description: 'Compare CPU benchmarks, GPU capabilities, display metrics, battery life, and thermals for MacBook Pro 16 and Dell XPS 16.',
    },
    createdAt: '2025-02-22T00:00:00Z',
  },
];

const INITIAL_SETTINGS: PlatformSettings = {
  siteName: 'OmniDiscover',
  siteUrl: 'https://omnidiscover.app',
  logo: '/logo.svg',
  defaultLanguage: 'en',
  availableLanguages: ['en', 'ar', 'es', 'fr', 'de'],
  defaultCurrency: 'USD',
  defaultMarket: 'US',
  amazonAffiliateTagUS: 'omnidiscover-us-20',
  amazonAffiliateTagUK: 'omnidiscover-uk-21',
  amazonAffiliateTagDE: 'omnidiscover-de-21',
  affiliateDisclosureText: 'OmniDiscover participates in various affiliate marketing programs. We may earn a commission on qualifying purchases made through our links to merchant sites at no extra cost to you.',
  enableDuplicateCheck: true,
  autoPublishImports: false,
};

// Unified in-memory and localStorage DB Layer
class DatabaseService {
  private products: Product[] = [];
  private categories: Category[] = [];
  private brands: Brand[] = [];
  private attributes: AttributeDefinition[] = [];
  private merchants: Merchant[] = [];
  private comparisons: Comparison[] = [];
  private settings: PlatformSettings = INITIAL_SETTINGS;
  private analyticsEvents: AnalyticsEvent[] = [];
  private importJobs: ImportJob[] = [];
  private contactInquiries: ContactInquiry[] = [];

  constructor() {
    this.init();
  }

  private init() {
    try {
      const savedProducts = localStorage.getItem('omni_db_products');
      const loadedProducts: Product[] = savedProducts ? JSON.parse(savedProducts) : [];
      const mergedProducts = [...loadedProducts];
      INITIAL_PRODUCTS.forEach(ip => {
        if (!mergedProducts.some(p => p.id === ip.id || (p.identifiers?.asin && p.identifiers?.asin === ip.identifiers?.asin))) {
          mergedProducts.push(ip);
        }
      });
      this.products = (mergedProducts.length > 0 ? mergedProducts : INITIAL_PRODUCTS).map(p => cleanAndSanitizeProduct(p));
      this.save('products', this.products);

      const savedCategories = localStorage.getItem('omni_db_categories');
      const loadedCategories: Category[] = savedCategories ? JSON.parse(savedCategories) : [];
      const mergedCategories = [...loadedCategories];
      INITIAL_CATEGORIES.forEach(ic => {
        const existingIdx = mergedCategories.findIndex(c => c.id === ic.id);
        if (existingIdx >= 0) {
          mergedCategories[existingIdx] = { ...ic, ...mergedCategories[existingIdx] };
        } else {
          mergedCategories.push(ic);
        }
      });
      this.categories = mergedCategories.length > 0 ? mergedCategories : INITIAL_CATEGORIES;

      const savedBrands = localStorage.getItem('omni_db_brands');
      const loadedBrands: Brand[] = savedBrands ? JSON.parse(savedBrands) : [];
      const mergedBrands = [...loadedBrands];
      INITIAL_BRANDS.forEach(ib => {
        if (!mergedBrands.some(b => b.id === ib.id)) {
          mergedBrands.push(ib);
        }
      });
      this.brands = mergedBrands.length > 0 ? mergedBrands : INITIAL_BRANDS;

      const savedAttributes = localStorage.getItem('omni_db_attributes');
      this.attributes = savedAttributes ? JSON.parse(savedAttributes) : INITIAL_ATTRIBUTES;

      const savedMerchants = localStorage.getItem('omni_db_merchants');
      const loadedMerchants: Merchant[] = savedMerchants ? JSON.parse(savedMerchants) : [];
      const mergedMerchants = [...loadedMerchants];
      INITIAL_MERCHANTS.forEach(im => {
        if (!mergedMerchants.some(m => m.id === im.id)) {
          mergedMerchants.push(im);
        }
      });
      this.merchants = mergedMerchants.length > 0 ? mergedMerchants : INITIAL_MERCHANTS;

      const savedComparisons = localStorage.getItem('omni_db_comparisons');
      this.comparisons = savedComparisons ? JSON.parse(savedComparisons) : INITIAL_COMPARISONS;

      const savedSettings = localStorage.getItem('omni_db_settings');
      this.settings = savedSettings ? JSON.parse(savedSettings) : INITIAL_SETTINGS;

      const savedAnalytics = localStorage.getItem('omni_db_analytics');
      this.analyticsEvents = savedAnalytics ? JSON.parse(savedAnalytics) : [];

      const savedImports = localStorage.getItem('omni_db_imports');
      this.importJobs = savedImports ? JSON.parse(savedImports) : [];

      const savedInquiries = localStorage.getItem('omni_db_inquiries');
      this.contactInquiries = savedInquiries ? JSON.parse(savedInquiries) : [];
    } catch (e) {
      console.warn('LocalStorage not available, running in-memory', e);
      this.products = [...INITIAL_PRODUCTS];
      this.categories = [...INITIAL_CATEGORIES];
      this.brands = [...INITIAL_BRANDS];
      this.attributes = [...INITIAL_ATTRIBUTES];
      this.merchants = [...INITIAL_MERCHANTS];
      this.comparisons = [...INITIAL_COMPARISONS];
    }
  }

  private save(key: string, data: any) {
    try {
      localStorage.setItem(`omni_db_${key}`, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }
  }

  // --- PRODUCTS ---
  getProducts(filter?: Partial<FilterState>): Product[] {
    let result = this.products.filter(p => p.status === 'published' || filter?.sortBy === 'newest');

    if (filter?.searchQuery && filter.searchQuery.trim()) {
      const q = filter.searchQuery.toLowerCase().trim();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.brandName.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q)) ||
        (p.identifiers.asin && p.identifiers.asin.toLowerCase().includes(q)) ||
        (p.identifiers.modelNumber && p.identifiers.modelNumber.toLowerCase().includes(q))
      );
    }

    if (filter?.categoryId) {
      result = result.filter(p => p.categoryIds.includes(filter.categoryId!));
    }

    if (filter?.brandIds && filter.brandIds.length > 0) {
      result = result.filter(p => filter.brandIds.includes(p.brandId));
    }

    if (filter?.minPrice !== undefined) {
      result = result.filter(p => p.price >= filter.minPrice!);
    }

    if (filter?.maxPrice !== undefined) {
      result = result.filter(p => p.price <= filter.maxPrice!);
    }

    if (filter?.minRating !== undefined) {
      result = result.filter(p => p.rating >= filter.minRating!);
    }

    if (filter?.inStockOnly) {
      result = result.filter(p => p.availability === 'in_stock');
    }

    if (filter?.attributes && Object.keys(filter.attributes).length > 0) {
      Object.entries(filter.attributes).forEach(([attrSlug, allowedValues]) => {
        if (allowedValues.length > 0) {
          result = result.filter(p => {
            const attrVal = p.attributes.find(a => a.attributeSlug === attrSlug);
            if (!attrVal) return false;
            return allowedValues.includes(String(attrVal.value));
          });
        }
      });
    }

    // Sorting
    switch (filter?.sortBy) {
      case 'price_asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating_desc':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'popularity':
        result.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'relevance':
      default:
        // Default ranking: verified review count * rating score
        result.sort((a, b) => (b.rating * Math.log10(b.reviewCount + 10)) - (a.rating * Math.log10(a.reviewCount + 10)));
        break;
    }

    return result;
  }

  getAllProductsAdmin(): Product[] {
    return this.products;
  }

  getProductById(id: string): Product | undefined {
    return this.products.find(p => p.id === id);
  }

  getProductBySlug(slug: string): Product | undefined {
    return this.products.find(p => p.slug === slug);
  }

  getProductByAsin(asin: string): Product | undefined {
    return this.products.find(p => p.identifiers.asin?.toUpperCase() === asin.toUpperCase());
  }

  saveProduct(product: Product): Product {
    const sanitized = cleanAndSanitizeProduct(product);
    const existingIndex = this.products.findIndex(p => p.id === sanitized.id);
    sanitized.updatedAt = new Date().toISOString();
    if (existingIndex >= 0) {
      this.products[existingIndex] = sanitized;
    } else {
      this.products.unshift(sanitized);
    }
    this.save('products', this.products);
    return sanitized;
  }

  deleteProduct(id: string): boolean {
    const prevLen = this.products.length;
    this.products = this.products.filter(p => p.id !== id);
    if (this.products.length !== prevLen) {
      this.save('products', this.products);
      return true;
    }
    return false;
  }

  // --- DETERMINISTIC RECOMMENDATION ENGINE ---
  getRelatedProducts(product: Product, limit: number = 4): Product[] {
    return this.products
      .filter(p => p.id !== product.id && p.status === 'published')
      .map(candidate => {
        let score = 0;
        // Same primary category (+5 points)
        if (candidate.primaryCategoryId === product.primaryCategoryId) score += 5;
        // Same brand (+4 points)
        if (candidate.brandId === product.brandId) score += 4;
        // Shared tags (+2 points each)
        const commonTags = candidate.tags.filter(t => product.tags.includes(t));
        score += commonTags.length * 2;
        // Similar price range (within 30%) (+3 points)
        const priceDiffRatio = Math.abs(candidate.price - product.price) / product.price;
        if (priceDiffRatio < 0.3) score += 3;

        return { product: candidate, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.product);
  }

  getSimilarProducts(product: Product, limit: number = 4): Product[] {
    // Similar = Direct alternatives in the same category from DIFFERENT brands
    return this.products
      .filter(p => p.id !== product.id && p.status === 'published' && p.primaryCategoryId === product.primaryCategoryId && p.brandId !== product.brandId)
      .sort((a, b) => {
        const diffA = Math.abs(a.price - product.price);
        const diffB = Math.abs(b.price - product.price);
        return diffA - diffB;
      })
      .slice(0, limit);
  }

  // --- CATEGORIES ---
  getCategories(): Category[] {
    return [...this.categories].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  getCategoryBySlug(slug: string): Category | undefined {
    return this.categories.find(c => c.slug === slug);
  }

  getCategoryById(id: string): Category | undefined {
    return this.categories.find(c => c.id === id);
  }

  getSubcategories(parentId: string): Category[] {
    return this.categories.filter(c => c.parentId === parentId);
  }

  saveCategory(cat: Category): Category {
    const idx = this.categories.findIndex(c => c.id === cat.id);
    if (idx >= 0) {
      this.categories[idx] = cat;
    } else {
      this.categories.push(cat);
    }
    this.save('categories', this.categories);
    return cat;
  }

  deleteCategory(id: string): boolean {
    this.categories = this.categories.filter(c => c.id !== id);
    this.save('categories', this.categories);
    return true;
  }

  // --- BRANDS ---
  getBrands(): Brand[] {
    return [...this.brands].sort((a, b) => a.name.localeCompare(b.name));
  }

  getBrandBySlug(slug: string): Brand | undefined {
    return this.brands.find(b => b.slug === slug);
  }

  getBrandById(id: string): Brand | undefined {
    return this.brands.find(b => b.id === id);
  }

  saveBrand(brand: Brand): Brand {
    const idx = this.brands.findIndex(b => b.id === brand.id);
    if (idx >= 0) {
      this.brands[idx] = brand;
    } else {
      this.brands.push(brand);
    }
    this.save('brands', this.brands);
    return brand;
  }

  // --- ATTRIBUTES ---
  getAttributes(): AttributeDefinition[] {
    return this.attributes;
  }

  getAttributesForCategory(categoryId: string): AttributeDefinition[] {
    return this.attributes.filter(a => a.categoryIds.includes(categoryId));
  }

  saveAttribute(attr: AttributeDefinition): AttributeDefinition {
    const idx = this.attributes.findIndex(a => a.id === attr.id);
    if (idx >= 0) {
      this.attributes[idx] = attr;
    } else {
      this.attributes.push(attr);
    }
    this.save('attributes', this.attributes);
    return attr;
  }

  // --- MERCHANTS ---
  getMerchants(): Merchant[] {
    return this.merchants;
  }

  getMerchantById(id: string): Merchant | undefined {
    return this.merchants.find(m => m.id === id);
  }

  saveMerchant(merchant: Merchant): Merchant {
    const idx = this.merchants.findIndex(m => m.id === merchant.id);
    if (idx >= 0) {
      this.merchants[idx] = merchant;
    } else {
      this.merchants.push(merchant);
    }
    this.save('merchants', this.merchants);
    return merchant;
  }

  // --- COMPARISONS ---
  getComparisons(): Comparison[] {
    return this.comparisons;
  }

  getComparisonBySlug(slug: string): Comparison | undefined {
    return this.comparisons.find(c => c.slug === slug);
  }

  saveComparison(comp: Comparison): Comparison {
    const idx = this.comparisons.findIndex(c => c.id === comp.id);
    if (idx >= 0) {
      this.comparisons[idx] = comp;
    } else {
      this.comparisons.unshift(comp);
    }
    this.save('comparisons', this.comparisons);
    return comp;
  }

  // --- SETTINGS ---
  getSettings(): PlatformSettings {
    return this.settings;
  }

  saveSettings(s: PlatformSettings): PlatformSettings {
    this.settings = s;
    this.save('settings', this.settings);
    return s;
  }

  // --- ANALYTICS ---
  logEvent(event: Omit<AnalyticsEvent, 'id' | 'timestamp'>): void {
    const newEvent: AnalyticsEvent = {
      ...event,
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    this.analyticsEvents.unshift(newEvent);
    // Keep max 1000 events in client storage
    if (this.analyticsEvents.length > 1000) {
      this.analyticsEvents = this.analyticsEvents.slice(0, 1000);
    }
    this.save('analytics', this.analyticsEvents);
  }

  getAnalyticsEvents(): AnalyticsEvent[] {
    return this.analyticsEvents;
  }

  // --- IMPORT JOBS ---
  getImportJobs(): ImportJob[] {
    return this.importJobs;
  }

  saveImportJob(job: ImportJob): ImportJob {
    const idx = this.importJobs.findIndex(j => j.id === job.id);
    if (idx >= 0) {
      this.importJobs[idx] = job;
    } else {
      this.importJobs.unshift(job);
    }
    this.save('imports', this.importJobs);
    return job;
  }

  // --- CONTACT INQUIRIES ---
  getContactInquiries(): ContactInquiry[] {
    return this.contactInquiries;
  }

  saveContactInquiry(inquiry: Omit<ContactInquiry, 'id' | 'status' | 'createdAt'>): ContactInquiry {
    const newInquiry: ContactInquiry = {
      ...inquiry,
      id: `inq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      status: 'unread',
      createdAt: new Date().toISOString(),
    };
    this.contactInquiries.unshift(newInquiry);
    this.save('inquiries', this.contactInquiries);
    return newInquiry;
  }

  updateContactInquiryStatus(id: string, status: ContactInquiry['status']): void {
    const item = this.contactInquiries.find(i => i.id === id);
    if (item) {
      item.status = status;
      this.save('inquiries', this.contactInquiries);
    }
  }

  deleteContactInquiry(id: string): void {
    this.contactInquiries = this.contactInquiries.filter(i => i.id !== id);
    this.save('inquiries', this.contactInquiries);
  }
}

export const db = new DatabaseService();
