
import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import * as cheerio from 'cheerio';
import { ML_CATEGORIES } from './src/constants.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/ml/test', async (req, res) => {
    const appId = process.env.ML_APP_ID;
    const secretKey = process.env.ML_SECRET_KEY;
    const authHeader = req.headers['authorization'];
    
    try {
      const headers: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://www.mercadolivre.com.br/',
        'Cache-Control': 'no-cache'
      };

      if (authHeader) {
        headers['Authorization'] = authHeader;
      }

      const response = await fetch('https://api.mercadolibre.com/sites/MLB/categories', { headers });
      
      if (response.ok) {
        const data = await response.json();
        res.json({ 
          status: 'success', 
          message: 'Conexão com API do Mercado Livre estabelecida com sucesso!',
          categoriesCount: data.length,
          env: {
            appIdSet: !!appId,
            secretKeySet: !!secretKey
          }
        });
      } else {
        // Even if ML returns 403, we return 200 with an error object to avoid frontend proxy issues
        res.json({ 
          status: 'error', 
          message: 'O Mercado Livre bloqueou a requisição anônima (403).',
          details: 'Isso é comum em servidores de nuvem. Por favor, use o botão "Conectar com Mercado Livre" para autenticar sua conta e liberar o acesso.'
        });
      }
    } catch (error: any) {
      res.json({ 
        status: 'error', 
        message: 'Falha de rede ao conectar com o Mercado Livre',
        details: error.message 
      });
    }
  });

  // Proxy for Mercado Livre - Web Scraping Implementation (Paliativo)
  app.get('/api/ml/search', async (req, res) => {
    const { q, limit = 10 } = req.query;
    const query = q || 'mais vendidos';
    
    // Construct search URL for scraping
    let searchUrl = '';
    if (query === 'mais vendidos') {
      searchUrl = 'https://www.mercadolivre.com.br/mais-vendidos';
    } else {
      searchUrl = `https://lista.mercadolivre.com.br/${encodeURIComponent(query as string).replace(/%20/g, '-')}`;
    }
    
    try {
      console.log(`Scraping ML Search: ${searchUrl}`);
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Upgrade-Insecure-Requests': '1'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ML page: ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      const results: any[] = [];

      // Selectors for "Mais Vendidos" page
      if (query === 'mais vendidos') {
        $('.poly-card').each((i, el) => {
          if (results.length >= Number(limit)) return false;
          const $el = $(el);
          const title = $el.find('.poly-component__title a').text().trim();
          const permalink = $el.find('.poly-component__title a').attr('href') || '';
          const priceText = $el.find('.poly-price__current .andes-money-amount__fraction').first().text().replace(/\./g, '');
          const price = parseFloat(priceText) || 0;
          
          // Try to get the best image
          let thumbnail = $el.find('.poly-card__portada img').attr('data-src') || 
                          $el.find('.poly-card__portada img').attr('src') || 
                          $el.find('.poly-card__portada img').attr('srcset')?.split(' ')[0] || '';

          if (title && permalink) {
            results.push({
              id: `ML-${Math.random().toString(36).substr(2, 9)}`,
              title,
              price,
              currency_id: 'BRL',
              thumbnail,
              permalink,
              condition: 'new'
            });
          }
        });
      }

      // Standard Search Results Selectors
      if (results.length === 0) {
        $('.ui-search-result__wrapper, .ui-search-layout__item').each((i, el) => {
          if (results.length >= Number(limit)) return false;

          const $el = $(el);
          const title = $el.find('.ui-search-item__title').text().trim() || $el.find('.poly-component__title').text().trim();
          const permalink = $el.find('a.ui-search-link').attr('href') || $el.find('a').first().attr('href') || '';
          
          // Price extraction
          const priceFraction = $el.find('.price-tag-fraction, .andes-money-amount__fraction').first().text().replace(/\./g, '');
          const price = parseFloat(priceFraction) || 0;

          // Thumbnail extraction - Improved with more attributes
          const img = $el.find('img.ui-search-result-image__element, img').first();
          let thumbnail = img.attr('data-src') || 
                          img.attr('src') || 
                          img.attr('srcset')?.split(' ')[0] || '';

          if (title && permalink) {
            results.push({
              id: `ML-${Math.random().toString(36).substr(2, 9)}`,
              title,
              price,
              currency_id: 'BRL',
              thumbnail,
              permalink,
              condition: 'new'
            });
          }
        });
      }

      res.json({ results });
    } catch (error: any) {
      console.error('ML Search Scraping Error:', error);
      res.status(500).json({ error: 'Failed to scrape from ML', results: [] });
    }
  });

  // Scraper for individual product page (PDP)
  app.get('/api/ml/product', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
      console.log(`Scraping ML Product: ${url}`);
      const response = await fetch(url as string, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        }
      });

      if (!response.ok) throw new Error(`Failed to fetch product page: ${response.status}`);

      const html = await response.text();
      const $ = cheerio.load(html);

      // Extract high-quality image using the requested selectors
      let imageUrl = '';
      const zoomImg = $('img.ui-pdp-image.ui-pdp-gallery__figure__image[data-zoom]').first();
      if (zoomImg.length > 0) {
        imageUrl = zoomImg.attr('data-zoom') || '';
      }
      
      if (!imageUrl) {
        const mainImg = $('img.ui-pdp-image.ui-pdp-gallery__figure__image').first();
        imageUrl = mainImg.attr('src') || mainImg.attr('data-src') || 
                   $('.ui-pdp-gallery__figure__image').attr('src') || '';
      }

      const title = $('.ui-pdp-title').text().trim();
      
      // Preço Atual
      let priceFraction = $('.ui-pdp-price__main-container .andes-money-amount__fraction').first().text().replace(/\./g, '');
      let priceCents = $('.ui-pdp-price__main-container .andes-money-amount__cents').first().text() || '00';
      
      if (!priceFraction) {
        // Fallback for simple structure <span>R$75,65</span>
        const spanPrices = $('span').map((i, el) => $(el).text()).get();
        const currentPriceMatch = spanPrices.find(p => p.includes('R$') && !p.includes('OFF'));
        if (currentPriceMatch) {
          const cleanPrice = currentPriceMatch.replace('R$', '').trim();
          const parts = cleanPrice.split(',');
          priceFraction = parts[0].replace(/\./g, '');
          priceCents = parts[1] || '00';
        }
      }
      const price = `${priceFraction},${priceCents}`;

      // Preço Original (Riscaço)
      const originalPriceEl = $('.ui-pdp-price__original-value, .andes-money-amount--previous, s').first();
      let originalPrice = '';
      if (originalPriceEl.length > 0) {
        if (originalPriceEl.is('s')) {
          originalPrice = originalPriceEl.text().replace('R$', '').trim();
        } else {
          const origFraction = originalPriceEl.find('.andes-money-amount__fraction').text().replace(/\./g, '');
          const origCents = originalPriceEl.find('.andes-money-amount__cents').text() || '00';
          if (origFraction) {
            originalPrice = `${origFraction},${origCents}`;
          }
        }
      }
      
      const installmentInfo = $('#pricing_price_subtitle, .ui-pdp-price__subtitles').text().trim();
      const description = $('.ui-pdp-description__content').text().trim() || 'Descrição não disponível.';

      // Extract Category and Subcategory from breadcrumb
      const breadcrumbs = $('.andes-breadcrumb__item, .ui-pdp-breadcrumb__item').map((i, el) => $(el).text().trim()).get();
      
      let category = 'Geral';
      let subcategory = 'Geral';

      if (breadcrumbs.length > 0) {
        // Tenta encontrar a categoria principal (Pet Shop se houver "Animais")
        const isPetShop = breadcrumbs.some(b => b.toLowerCase().includes('animais') || b.toLowerCase().includes('pet shop'));
        
        if (isPetShop) {
          category = 'Pet Shop';
          const validSubcats = ML_CATEGORIES['Pet Shop'];
          
          // Tenta encontrar uma subcategoria correspondente no breadcrumb
          const foundSubcat = validSubcats.find(s => 
            breadcrumbs.some(b => b.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(b.toLowerCase()))
          );
          
          if (foundSubcat) {
            subcategory = foundSubcat;
          } else {
            // Fallback para a segunda posição do breadcrumb se fizer sentido
            subcategory = breadcrumbs[1] || 'Outros';
          }
        } else {
          category = breadcrumbs[0] || 'Geral';
          subcategory = breadcrumbs[1] || breadcrumbs[0] || 'Geral';
        }
      }

      res.json({
        name: title,
        price,
        originalPrice,
        currency: 'R$',
        installmentInfo,
        description,
        imageUrl,
        category,
        subcategory,
        affiliateUrl: url
      });
    } catch (error: any) {
      console.error('ML Product Scraping Error:', error);
      res.status(500).json({ error: 'Failed to scrape product data' });
    }
  });

  // Scraper for Affiliate Product (Recommendations/Profile cards)
  app.get('/api/ml/affiliate-product', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
      console.log(`Scraping ML Affiliate Product: ${url}`);
      const response = await fetch(url as string, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        }
      });

      if (!response.ok) throw new Error(`Failed to fetch page: ${response.status}`);

      const html = await response.text();
      const $ = cheerio.load(html);

      // Search for the poly-card structure within recommendations
      let card = $('.poly-card').first();
      if (card.length === 0) {
        card = $('.ui-recommendations-list').first();
      }
      
      if (card.length === 0 && !html.includes('poly-component__title')) {
        // Fallback to standard product scraper if card not found
        return res.redirect(`/api/ml/product?url=${encodeURIComponent(url as string)}`);
      }

      const title = card.find('.poly-component__title').text().trim() || $('.poly-component__title').first().text().trim();
      const affiliateUrl = card.find('a.poly-component__title').attr('href') || $('.poly-component__title').first().attr('href') || url;
      const imageUrl = card.find('.poly-component__picture, img').first().attr('src') || 
                       card.find('.poly-component__picture, img').first().attr('data-src') || '';
      
      // Helper to convert text price like "67 reais com 28 centavos" to "67,28"
      const convertPriceText = (text: string) => {
        if (!text) return '';
        const matches = text.match(/([0-9]+).*?([0-9]{2})/);
        if (matches) return `${matches[1]},${matches[2]}`;
        return text.replace(/[^\d,]/g, '');
      };

      // Current Price
      let price = '';
      const priceLabel = card.find('[aria-label^="Agora:"]').attr('aria-label') || $('[aria-label^="Agora:"]').first().attr('aria-label');
      if (priceLabel) {
        price = convertPriceText(priceLabel);
      } else {
        const priceFraction = card.find('.poly-price__current .andes-money-amount__fraction').first().text().replace(/\./g, '');
        if (priceFraction) {
          const priceCents = card.find('.poly-price__current .andes-money-amount__cents').first().text() || '00';
          price = `${priceFraction},${priceCents}`;
        } else {
          const spanPrices = card.find('span').map((i, el) => $(el).text()).get();
          const currentPriceMatch = spanPrices.find(p => p.includes('R$') && !p.includes('OFF'));
          if (currentPriceMatch) price = currentPriceMatch.replace('R$', '').trim();
        }
      }

      // Original Price
      let originalPrice = '';
      const oldPriceLabel = card.find('[aria-label^="Antes:"]').attr('aria-label') || $('[aria-label^="Antes:"]').first().attr('aria-label');
      if (oldPriceLabel) {
        originalPrice = convertPriceText(oldPriceLabel);
      } else {
        const originalPriceEl = card.find('.andes-money-amount--previous, s').first();
        if (originalPriceEl.length > 0) {
          if (originalPriceEl.is('s')) {
            originalPrice = originalPriceEl.text().replace('R$', '').trim();
          } else {
            const origFraction = originalPriceEl.find('.andes-money-amount__fraction').text().replace(/\./g, '');
            const origCents = originalPriceEl.find('.andes-money-amount__cents').text() || '00';
            if (origFraction) originalPrice = `${origFraction},${origCents}`;
          }
        }
      }

      const seller = card.find('.poly-component__seller').text().replace('Por', '').trim();
      const discount = card.find('.poly-price__disc_label, .andes-money-amount__discount').first().text().trim();
      const coupon = card.find('.poly-coupons__pill').text().trim();
      const installments = card.find('.poly-price__installments').text().trim();
      const shipping = card.find('.poly-component__shipping, .poly-shipping--monday').first().text().trim();

      const description = `Vendedor: ${seller}\nPreço anterior: R$ ${originalPrice}\nDesconto: ${discount}\nCupom: ${coupon}\nParcelamento: ${installments}\nFrete: ${shipping}`;

      res.json({
        name: title,
        price,
        originalPrice,
        currency: 'R$',
        installmentInfo: installments,
        description,
        imageUrl,
        category: 'Geral',
        subcategory: 'Geral',
        affiliateUrl
      });
    } catch (error: any) {
      console.error('ML Affiliate Product Scraping Error:', error);
      res.status(500).json({ error: 'Failed to scrape affiliate product data' });
    }
  });
  app.get('/api/ml/categories', async (req, res) => {
    const authHeader = req.headers['authorization'];
    try {
      const headers: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://www.mercadolivre.com.br/',
        'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site'
      };

      if (authHeader) {
        headers['Authorization'] = authHeader;
      }

      let response = await fetch('https://api.mercadolibre.com/sites/MLB/categories', { headers });
      
      // Fallback for public endpoint if auth fails
      if (!response.ok && authHeader) {
        console.warn('ML Categories fetch failed with auth, trying without auth...');
        const publicHeaders = { ...headers };
        delete publicHeaders['Authorization'];
        response = await fetch('https://api.mercadolibre.com/sites/MLB/categories', { headers: publicHeaders });
      }
      
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        console.error('ML Categories API Error:', response.status, errorBody);
        
        return res.status(response.status === 403 ? 200 : response.status).json({
          status: 'error',
          code: response.status,
          message: `Erro ${response.status} ao buscar categorias: ${errorBody.message || 'Falha na API do Mercado Livre'}`
        });
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error('ML Categories Endpoint Exception:', error);
      res.status(500).json({ 
        status: 'error', 
        message: `Exceção ao buscar categorias: ${error.message || 'Erro interno no servidor'}` 
      });
    }
  });

  // Mercado Livre OAuth Endpoints
  app.get('/api/auth/ml/url', (req, res) => {
    const appId = (process.env.ML_APP_ID || '670446035130544').trim();
    // Use APP_URL from env or fallback to request headers
    const baseUrl = process.env.APP_URL || `${req.headers['x-forwarded-proto'] || 'https'}://${req.get('host')}`;
    const redirectUri = `${baseUrl.replace(/\/$/, '')}/auth/ml/callback`;
    
    const params = new URLSearchParams({
      client_id: appId,
      response_type: 'code',
      redirect_uri: redirectUri,
    });
    
    // Using the generic auth URL which is more robust
    const authUrl = `https://auth.mercadolivre.com.br/authorization?${params}`;
    console.log('Generated ML Auth URL:', authUrl);
    res.json({ url: authUrl });
  });

  // Mercado Livre Notification Callback (Webhooks)
  app.post('/api/ml/notifications', (req, res) => {
    const notification = req.body;
    console.log('ML Notification Received:', notification);
    res.status(200).send('OK');
  });

  app.get(['/auth/ml/callback', '/auth/ml/callback/'], async (req, res) => {
    const { code } = req.query;
    const appId = (process.env.ML_APP_ID || '670446035130544').trim();
    const secretKey = (process.env.ML_SECRET_KEY || 'B44FD5GGjF3TbvixfElBFG2DDCUOx7Dx').trim();
    
    // Use APP_URL from env or fallback to request headers
    const baseUrl = process.env.APP_URL || `${req.headers['x-forwarded-proto'] || 'https'}://${req.get('host')}`;
    const redirectUri = `${baseUrl.replace(/\/$/, '')}/auth/ml/callback`;

    if (!code) {
      return res.status(400).send('No code provided');
    }

    try {
      const response = await fetch('https://api.mercadolibre.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: appId || '',
          client_secret: secretKey || '',
          code: code as string,
          redirect_uri: redirectUri,
        }),
      });

      const tokens = await response.json();
      
      // In a real app, we'd store these in a session or database.
      // For this demo, we'll just send a success message back to the opener.
      
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'ML_AUTH_SUCCESS', tokens: ${JSON.stringify(tokens)} }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Autenticação com Mercado Livre concluída com sucesso! Esta janela fechará automaticamente.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('ML OAuth Error:', error);
      res.status(500).send('Authentication failed');
    }
  });

  // WooCommerce Proxy
  app.post("/api/woo/proxy", async (req, res) => {
    try {
      const { config, endpoint, method, body } = req.body || {};

      if (!config || !config.url || !config.consumerKey || !config.consumerSecret) {
        return res.status(400).json({ message: "Configuração do WooCommerce incompleta." });
      }

      let baseUrl = String(config.url).replace(/\/$/, "");
      if (!baseUrl.startsWith("http")) {
        baseUrl = `https://${baseUrl}`;
      }
      const apiUrl = `${baseUrl}${endpoint}`;
      const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString("base64");

      console.log(`WooCommerce Proxy Request: ${method || "GET"} ${apiUrl}`);
      const response = await fetch(apiUrl, {
        method: method || "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${auth}`,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        },
        body: body ? JSON.stringify(body) : undefined
      });

      const data = await response.json().catch(() => null);
      
      if (!response.ok) {
        console.error(`WooCommerce API Error (${response.status}):`, data);
        return res.status(response.status).json({
          message: data?.message || `Erro ${response.status} na API do WooCommerce.`,
          code: data?.code,
          data: data?.data
        });
      }

      res.json(data);
    } catch (error: any) {
      console.error("Erro no proxy do WooCommerce:", error);
      res.status(500).json({ 
        message: `Erro interno no proxy: ${error.message}`,
        details: error.stack
      });
    }
  });

  // Export for Vercel serverless functions
  export default app;

  // Global error handler to prevent unhandled crashes
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Unhandled Express Error:', err);
    res.status(500).json({ message: 'Erro interno no servidor', details: err.message });
  });

  // Start server locally (not on Vercel)
  if (process.env.NODE_ENV !== 'production') {
    (async () => {
      try {
        // Vite middleware for development
        const { createServer: createViteServer } = await import('vite');
        const vite = await createViteServer({
          server: { middlewareMode: true },
          appType: 'spa',
        });
        app.use(vite.middlewares);

        app.listen(PORT, '0.0.0.0', () => {
          console.log(`Server running on http://localhost:${PORT}`);
        });
      } catch (err) {
        console.error('Failed to start local dev server:', err);
      }
    })();
  }
