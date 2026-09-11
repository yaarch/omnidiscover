import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

// Helper to sanitize Amazon titles
function toHighResAmazonImageUrl(url: string): string {
  if (!url || typeof url !== 'string') return url;
  if (!url.includes('media-amazon.com') && !url.includes('ssl-images-amazon.com')) return url;
  
  if (/\._[A-Za-z0-9_,\-]+\.(jpg|jpeg|png|webp)$/i.test(url)) {
    return url.replace(/\._[A-Za-z0-9_,\-]+\.(jpg|jpeg|png|webp)$/i, '._AC_SL1500_.$1');
  }
  return url.replace(/\.(jpg|jpeg|png|webp)$/i, '._AC_SL1500_.$1');
}

function sanitizeAmazonTitle(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/^(Amazon\.[a-z\.]+|Amazon\.com|Amazon|Buy)\s*:\s*/i, '')
    .replace(/\s*:\s*(Office Products|Electronics|Computers & Accessories|Video Games|Home & Kitchen|Sports & Outdoors|Tools & Home Improvement|Beauty & Personal Care|Automotive|Pet Supplies|Toys & Games|Patio, Lawn & Garden|Health & Household|Clothing, Shoes & Jewelry).*$/i, '')
    .replace(/\s*\|\s*Amazon\.[a-z\.]+$|\s*-\s*Amazon\.[a-z\.]+$|\s*:\s*Amazon\.[a-z\.]+$|\s*:\s*Everything Else.*$/i, '')
    .trim();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes FIRST
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Robots.txt
  app.get('/robots.txt', (req, res) => {
    const robotsPath = path.join(process.cwd(), 'public', 'robots.txt');
    res.type('text/plain');
    res.sendFile(robotsPath);
  });

  // Sitemap.xml
  app.get('/sitemap.xml', (req, res) => {
    const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
    res.type('application/xml');
    res.sendFile(sitemapPath);
  });

  // Amazon Shortened Link & ASIN Resolver + Real Product Scraper
  app.get('/api/resolve-amazon', async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).json({ error: 'Missing url parameter' });
    }

    let current = targetUrl.trim();
    for (let i = 0; i < 6; i++) {
      try {
        const headRes = await fetch(current, {
          method: 'HEAD',
          redirect: 'manual',
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        });
        const location = headRes.headers.get('location');
        if (location && headRes.status >= 300 && headRes.status < 400) {
          current = new URL(location, current).toString();
        } else {
          break;
        }
      } catch {
        break;
      }
    }

    // Extract ASIN and Domain
    const asinMatch =
      current.match(/(?:\/dp\/|\/gp\/product\/|\/product\/|\/ASIN\/|\/d\/)([B0-9][0-9A-Z]{9})/i) ||
      current.match(/\b([B0-9][0-9A-Z]{9})\b/i);
    const asin = asinMatch ? asinMatch[1].toUpperCase() : null;

    let domain = 'amazon.com';
    try {
      const parsedUrl = new URL(current);
      domain = parsedUrl.hostname.replace(/^www\./, '');
    } catch {}

    let realTitle: string | null = null;
    let realImageUrl: string | null = null;
    let galleryImages: string[] = [];
    let realPrice: number | null = null;
    let realOriginalPrice: number | null = null;

    if (asin) {
      const desktopUrl = `https://www.${domain}/dp/${asin}`;
      const mobileUrl = `https://www.${domain}/gp/aw/d/${asin}`;

      let cookieStr = 'lc-main=en_US; i18n-prefs=USD; session-id=140-0000000-0000000';
      if (domain.includes('.co.uk')) {
        cookieStr = 'lc-main=en_GB; i18n-prefs=GBP; session-id=250-0000000-0000000';
      } else if (domain.includes('.de') || domain.includes('.fr') || domain.includes('.it') || domain.includes('.es')) {
        cookieStr = 'lc-main=de_DE; i18n-prefs=EUR';
      } else if (domain.includes('.ca')) {
        cookieStr = 'lc-main=en_CA; i18n-prefs=CAD';
      }

      const desktopHeaders = {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cookie': cookieStr,
      };

      try {
        let pageRes = await fetch(desktopUrl, { headers: desktopHeaders });
        if (!pageRes.ok) {
          pageRes = await fetch(mobileUrl, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9',
              'Cookie': cookieStr,
            },
          });
        }

        if (pageRes.ok) {
          const html = await pageRes.text();

          // Real Product Title
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          if (titleMatch) {
            const sanitized = sanitizeAmazonTitle(titleMatch[1]);
            if (
              sanitized &&
              !sanitized.toLowerCase().includes('page not found') &&
              !sanitized.toLowerCase().includes('robot check')
            ) {
              realTitle = sanitized;
            }
          }

          // Real Authentic Amazon CDN Images
          const allImgs = [
            ...new Set(
              html.match(/https:\/\/m\.media-amazon\.com\/images\/I\/[A-Za-z0-9_\-\.]+\.(?:jpg|jpeg)/gi) || []
            ),
          ];

          const validImgs = allImgs.filter(
            (u) =>
              !u.includes('_SS') &&
              !u.includes('play-button') &&
              !u.includes('logo') &&
              !u.includes('sprite') &&
              !u.includes('icon') &&
              !u.includes('_QL50_')
          );

          const highResImgs = [
            ...new Set(
              validImgs.map((u) => toHighResAmazonImageUrl(u))
            ),
          ];
          galleryImages = highResImgs.slice(0, 8);
          realImageUrl = galleryImages[0] || null;

          // Real Live Price (JSON-LD + Multi-pattern extraction)
          const jsonLdMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
          if (jsonLdMatches) {
            for (const scriptTag of jsonLdMatches) {
              try {
                const jsonStr = scriptTag.replace(/<script[^>]*>|<\/script>/gi, '');
                const data = JSON.parse(jsonStr);
                const offer = Array.isArray(data?.offers) ? data.offers[0] : (data?.offers || data);
                const p = offer?.price || offer?.lowPrice || offer?.priceSpecification?.price;
                if (p) {
                  const val = parseFloat(String(p).replace(/[^0-9\.]/g, ''));
                  if (!isNaN(val) && val > 0 && val < 50000) {
                    realPrice = val;
                    break;
                  }
                }
              } catch (e) {
                // JSON parse fallback
              }
            }
          }

          if (!realPrice) {
            // First check offscreen dollar price directly: class="a-offscreen">$39.99</span>
            const offscreenDollarMatch = html.match(/class="a-offscreen">\s*\$\s*([0-9\.,]+)<\/span>/i);
            if (offscreenDollarMatch) {
              const val = parseFloat(offscreenDollarMatch[1].replace(/,/g, ''));
              if (!isNaN(val) && val > 0 && val < 50000) {
                realPrice = val;
              }
            }
          }

          if (!realPrice) {
            const pricePatterns = [
              /class="a-offscreen">([$£€¥]\s*[0-9\.,]+)<\/span>/i,
              /"priceAmount"\s*:\s*([0-9\.]+)/i,
              /"displayPrice"\s*:\s*"[$£€¥]?\s*([0-9\.,]+)"/i,
              /class="a-price-whole">([^<]+)<\/span><span class="a-price-fraction[^"]*">([^<]+)/i,
              /id="(?:priceblock_ourprice|priceblock_dealprice|price_inside_buybox)">([$£€¥]\s*[0-9\.,]+)/i,
              /[$£€¥]\s*([0-9]{1,4}\.[0-9]{2})\b/
            ];

            for (const pattern of pricePatterns) {
              const match = html.match(pattern);
              if (match) {
                let rawStr = '';
                if (match[2]) {
                  rawStr = match[1].replace(/[^0-9\.]/g, '') + '.' + match[2].replace(/[^0-9]/g, '');
                } else {
                  rawStr = match[1].replace(/[^0-9\.]/g, '');
                }
                const val = parseFloat(rawStr);
                if (!isNaN(val) && val > 0 && val < 50000) {
                  realPrice = val;
                  break;
                }
              }
            }
          }

          // Real Strike-through / List Price extraction (if Amazon displays a true Was / List Price)
          const listPriceMatch =
            html.match(/class="a-price a-text-price"[^>]*><span class="a-offscreen">\s*\$\s*([0-9\.,]+)<\/span>/i) ||
            html.match(/"listPrice"\s*:\s*{\s*"amount"\s*:\s*([0-9\.]+)/i) ||
            html.match(/"basisPrice"\s*:\s*{\s*"amount"\s*:\s*([0-9\.]+)/i);

          if (listPriceMatch) {
            const val = parseFloat(listPriceMatch[1].replace(/,/g, ''));
            if (!isNaN(val) && realPrice && val > realPrice && val < 50000) {
              realOriginalPrice = val;
            }
          }
        }
      } catch (err) {
        console.warn('Scraper warning:', err);
      }
    }

    return res.json({
      resolvedUrl: current,
      asin,
      realTitle,
      realImageUrl,
      galleryImages,
      realPrice,
      realOriginalPrice,
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
