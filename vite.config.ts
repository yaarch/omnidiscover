import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

function amazonResolverPlugin(): Plugin {
  return {
    name: 'amazon-resolver-middleware',
    configureServer(server) {
      server.middlewares.use('/api/resolve-amazon', async (req, res) => {
        try {
          const urlObj = new URL(req.url || '', 'http://localhost:3000');
          const targetUrl = urlObj.searchParams.get('url');

          if (!targetUrl) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Missing url parameter' }));
            return;
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

          // Extract ASIN and domain
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

          if (asin) {
            const mobileUrl = `https://www.${domain}/gp/aw/d/${asin}`;
            try {
              const pageRes = await fetch(mobileUrl, {
                headers: {
                  'User-Agent':
                    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
                  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                  'Accept-Language': 'en-US,en;q=0.9',
                },
              });

              if (pageRes.ok) {
                const html = await pageRes.text();

                // Real Product Title
                const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
                if (titleMatch) {
                  const raw = titleMatch[1]
                    .replace(/^Amazon\.[a-z\.]+:\s*/i, '')
                    .replace(/\s*:\s*(Electronics|Computers & Accessories|Video Games|Home & Kitchen).*$/i, '')
                    .trim();
                  if (
                    raw &&
                    !raw.toLowerCase().includes('page not found') &&
                    !raw.toLowerCase().includes('robot check')
                  ) {
                    realTitle = raw;
                  }
                }

                // Real Amazon CDN Images
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

                const sl1500Imgs = validImgs.filter((u) => u.includes('SL1500') || u.includes('_AC_'));
                galleryImages = (sl1500Imgs.length > 0 ? sl1500Imgs : validImgs).slice(0, 6);
                realImageUrl = galleryImages[0] || validImgs[0] || null;

                // Real Live Price
                const priceMatch =
                  html.match(/class="a-offscreen">([$£€¥][0-9\.,]+)<\/span>/i) ||
                  html.match(/class="a-price-whole">([^<]+)<\/span><span class="a-price-fraction">([^<]+)/i);
                if (priceMatch) {
                  const rawPriceStr = priceMatch[1] + (priceMatch[2] ? `.${priceMatch[2]}` : '');
                  const num = parseFloat(rawPriceStr.replace(/[^0-9\.]/g, ''));
                  if (!isNaN(num) && num > 0) {
                    realPrice = num;
                  }
                }
              }
            } catch (err) {
              console.warn('Scraper warning in dev middleware:', err);
            }
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              resolvedUrl: current,
              asin,
              realTitle,
              realImageUrl,
              galleryImages,
              realPrice,
            })
          );
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err?.message || 'Resolution failed' }));
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), amazonResolverPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
