
import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import * as cheerio from 'cheerio';
import { ML_CATEGORIES } from './src/constants.ts';
import { mlAgentService } from './services/mlAgentService.ts';
import { GoogleGenAI } from "@google/genai";
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = 3000;

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
          const priceFraction = $el.find('.poly-price__current .andes-money-amount__fraction').first().text().replace(/\./g, '');
          const priceCents = $el.find('.poly-price__current .andes-money-amount__cents').first().text() || '00';
          const priceText = `${priceFraction}.${priceCents}`;
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
          const priceCents = $el.find('.price-tag-cents, .andes-money-amount__cents').first().text() || '00';
          const priceText = `${priceFraction}.${priceCents}`;
          const price = parseFloat(priceText) || 0;

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
      let response = await fetch(url as string, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        redirect: 'follow'
      });

      if (!response.ok) throw new Error(`Failed to fetch product page: ${response.status}`);

      let html = await response.text();
      let $ = cheerio.load(html);

      // Check for meta refresh redirect (common in shortlinks)
      const metaRefresh = $('meta[http-equiv="refresh"]').attr('content');
      if (metaRefresh) {
        const match = metaRefresh.match(/url=['"]?([^'"]+)['"]?/i);
        if (match && match[1]) {
          const finalUrl = match[1];
          response = await fetch(finalUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
              'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
            },
            redirect: 'follow'
          });
          if (response.ok) {
            html = await response.text();
            $ = cheerio.load(html);
          }
        }
      }

      let title = $('.ui-pdp-title').text().trim();
      let price = '';
      let originalPrice = '';
      let installmentInfo = '';
      let description = '';
      let imageUrl = '';

      if (title) {
        // Standard PDP
        const zoomImg = $('img.ui-pdp-image.ui-pdp-gallery__figure__image[data-zoom]').first();
        if (zoomImg.length > 0) {
          imageUrl = zoomImg.attr('data-zoom') || '';
        }
        if (!imageUrl) {
          const mainImg = $('img.ui-pdp-image.ui-pdp-gallery__figure__image').first();
          imageUrl = mainImg.attr('src') || mainImg.attr('data-src') || 
                     $('.ui-pdp-gallery__figure__image').attr('src') || '';
        }

        const priceFraction = $('.ui-pdp-price__second-line .andes-money-amount__fraction, .ui-pdp-price__main-container .andes-money-amount__fraction').first().text().replace(/\./g, '');
        const priceCents = $('.ui-pdp-price__second-line .andes-money-amount__cents, .ui-pdp-price__main-container .andes-money-amount__cents').first().text() || '00';
        price = priceFraction ? `${priceFraction},${priceCents}` : '0,00';

        const originalPriceEl = $('.ui-pdp-price__original-value, .andes-money-amount--previous').first();
        if (originalPriceEl.length > 0) {
          const origFraction = originalPriceEl.find('.andes-money-amount__fraction').text().replace(/\./g, '');
          const origCents = originalPriceEl.find('.andes-money-amount__cents').text() || '00';
          if (origFraction) {
            originalPrice = `${origFraction},${origCents}`;
          } else {
            const text = originalPriceEl.text().replace('R$', '').trim();
            const matches = text.match(/(\d+)\s*(\d{2})?/);
            if (matches) {
              originalPrice = matches[2] ? `${matches[1]},${matches[2]}` : `${matches[1]},00`;
            }
          }
        }
        
        installmentInfo = $('#pricing_price_subtitle, .ui-pdp-price__subtitles').text().trim();
        description = '';
      } else {
        // Fallback to poly-card
        const card = $('.poly-card').first();
        if (card.length > 0) {
          title = card.find('.poly-component__title').text().trim();
          imageUrl = card.find('.poly-component__picture').attr('src') || 
                     card.find('.poly-component__picture').attr('data-src') || '';
          
          const priceFraction = card.find('.poly-price__current .andes-money-amount__fraction').first().text().replace(/\./g, '');
          const priceCents = card.find('.poly-price__current .andes-money-amount__cents').first().text() || '00';
          price = priceFraction ? `${priceFraction},${priceCents}` : '0,00';

          const originalPriceEl = card.find('.andes-money-amount--previous').first();
          if (originalPriceEl.length > 0) {
            const origFraction = originalPriceEl.find('.andes-money-amount__fraction').text().replace(/\./g, '');
            const origCents = originalPriceEl.find('.andes-money-amount__cents').text() || '00';
            if (origFraction) {
              originalPrice = `${origFraction},${origCents}`;
            } else {
              const text = originalPriceEl.text().replace('R$', '').trim();
              const matches = text.match(/(\d+)\s*(\d{2})?/);
              if (matches) {
                originalPrice = matches[2] ? `${matches[1]},${matches[2]}` : `${matches[1]},00`;
              }
            }
          }
          description = '';
        }
      }

      if (!title) {
        const ogTitle = $('meta[property="og:title"]').attr('content');
        if (ogTitle) title = ogTitle;
      }

      if (!title) {
        const titleTag = $('title').text();
        if (titleTag) title = titleTag.split('|')[0].trim();
      }

      if (!title) {
        const imgEl = $('img[alt]').first();
        if (imgEl.length > 0) {
          const alt = imgEl.attr('alt') || '';
          if (alt.length > 10 && !alt.toLowerCase().includes('imagem')) {
            title = alt;
          }
        }
      }

      if (!title) {
        return res.status(404).json({ error: 'SCRAPER_FAILED: Não foi possível encontrar o título do produto na página.' });
      }

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
      console.warn('ML Product Scraping Warning (Fallback will be used):', error.message);
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
      const card = $('.poly-card').first();
      
      if (card.length === 0) {
        // Fallback to standard product scraper if card not found
        return res.redirect(`/api/ml/product?url=${encodeURIComponent(url as string)}`);
      }

      const title = card.find('.poly-component__title').text().trim();
      const imageUrl = card.find('.poly-component__picture').attr('src') || 
                       card.find('.poly-component__picture').attr('data-src') || '';
      
      // Current Price
      const priceFraction = card.find('.poly-price__current .andes-money-amount__fraction').first().text().replace(/\./g, '');
      const priceCents = card.find('.poly-price__current .andes-money-amount__cents').first().text() || '00';
      const price = `${priceFraction},${priceCents}`;

      // Original Price
      const originalPriceEl = card.find('.andes-money-amount--previous').first();
      let originalPrice = '';
      if (originalPriceEl.length > 0) {
        const origFraction = originalPriceEl.find('.andes-money-amount__fraction').text().replace(/\./g, '');
        const origCents = originalPriceEl.find('.andes-money-amount__cents').text() || '00';
        if (origFraction) {
          originalPrice = `${origFraction},${origCents}`;
        } else {
          const text = originalPriceEl.text().replace('R$', '').trim();
          const matches = text.match(/(\d+)\s*(\d{2})?/);
          if (matches) {
            originalPrice = matches[2] ? `${matches[1]},${matches[2]}` : `${matches[1]},00`;
          }
        }
      }

      const description = title;

      // Extract Category and Subcategory (fallback for affiliate cards)
      const category = 'Geral';
      const subcategory = 'Geral';

      res.json({
        name: title,
        price,
        originalPrice,
        currency: 'R$',
        installmentInfo: '',
        description,
        imageUrl,
        category,
        subcategory,
        affiliateUrl: url
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
      let payload = req.body;
      if (typeof payload === "string") {
        try {
          payload = JSON.parse(payload);
        } catch (e) {}
      }
      let { config, endpoint, method, body } = payload || {};

      if (!config) config = {};
      if (!config.url) config.url = process.env.WC_URL || process.env.VITE_WOO_URL || '';
      if (!config.consumerKey) config.consumerKey = process.env.WC_CONSUMER_KEY || process.env.VITE_WOO_KEY || process.env.VITE_WOO_CK || '';
      if (!config.consumerSecret) config.consumerSecret = process.env.WC_CONSUMER_SECRET || process.env.VITE_WOO_SECRET || process.env.VITE_WOO_CS || '';

      config.url = String(config.url).trim();
      config.consumerKey = String(config.consumerKey).trim();
      config.consumerSecret = String(config.consumerSecret).trim();

      if (!config.url || !config.consumerKey || !config.consumerSecret) {
        return res.status(400).json({ message: "Configuração do WooCommerce incompleta." });
      }

      let baseUrl = config.url.replace(/\/$/, "");
      if (!baseUrl.startsWith("http")) {
        baseUrl = `https://${baseUrl}`;
      }
      let apiUrl = `${baseUrl}${endpoint}`;
      const separator = apiUrl.includes("?") ? "&" : "?";
      apiUrl = `${apiUrl}${separator}consumer_key=${config.consumerKey}&consumer_secret=${config.consumerSecret}`;
      const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString("base64");

      console.log(`WooCommerce Proxy Request: ${method || "GET"} ${apiUrl}`);
      try {
        const response = await axios({
          url: apiUrl,
          method: method || "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${auth}`,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
          },
          data: body || undefined,
          timeout: 7000
        });
        
        res.json(response.data);
      } catch (axiosError: any) {
        if (axiosError.response) {
          console.error(`WooCommerce API Error (${axiosError.response.status}):`, axiosError.response.data);
          return res.status(axiosError.response.status).json({
            message: axiosError.response.data?.message || `Erro ${axiosError.response.status} na API do WooCommerce.`,
            code: axiosError.response.data?.code,
            data: axiosError.response.data?.data
          });
        }
        throw axiosError;
      }
    } catch (error: any) {
      console.error("Erro no proxy do WooCommerce:", error);
      res.status(500).json({ 
        message: `Erro interno no proxy: ${error.message}`,
        details: error.stack
      });
    }
  });

  // Endpoint to scrape product data from a Mercado Livre URL
  app.get('/api/ml/import-url', async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL is required' });
    }

    try {
      console.log('Importing from URL:', url);
      
      // Follow redirects to get the final URL (important for short links like meli.la)
      const initialResponse = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        }
      });

      const finalUrl = initialResponse.url;
      console.log('Final URL resolved to:', finalUrl);

      let html = await initialResponse.text();
      let $ = cheerio.load(html);

      // Check for CAPTCHA or blocking
      if ($('title').text().toLowerCase().includes('captcha') || $('.andes-form-captcha').length > 0) {
        throw new Error('Mercado Livre bloqueou o acesso automático (CAPTCHA). Tente novamente em alguns instantes ou use a importação via HTML.');
      }

      // Fallback data from affiliate page (if it's an affiliate page)
      let fallbackTitle = $('.poly-component__title').first().text().trim();
      let fallbackPriceFraction = $('.poly-price__current .andes-money-amount__fraction').first().text().trim().replace(/\./g, '');
      let fallbackPriceCents = $('.poly-price__current .andes-money-amount__cents').first().text().trim() || '00';
      let fallbackImage = $('.poly-component__picture').attr('src') || $('.poly-component__picture').attr('data-src') || '';
      let fallbackInstallments = $('.poly-price__installments').first().text().trim();
      let fallbackOriginalPrice = '';
      
      const prevPriceEl = $('.andes-money-amount--previous').first();
      if (prevPriceEl.length > 0) {
        const prevFraction = prevPriceEl.find('.andes-money-amount__fraction').text().trim().replace(/\./g, '');
        const prevCents = prevPriceEl.find('.andes-money-amount__cents').text().trim() || '00';
        if (prevFraction) fallbackOriginalPrice = `${prevFraction},${prevCents}`;
      }

      // Check if this is a recommendation/affiliate page instead of a direct product page
      const productLink = $('.poly-component__title').attr('href') || $('.poly-component__link').attr('href');
      
      let pdpFetched = false;
      if (productLink && productLink.includes('mercadolivre.com.br')) {
        console.log('Found product link in affiliate page, fetching actual product page:', productLink);
        try {
          const productResponse = await fetch(productLink, {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
              'Accept-Language': 'pt-BR,pt;q=0.8,en-US;q=0.5,en;q=0.3',
            }
          });
          const pdpHtml = await productResponse.text();
          const $pdp = cheerio.load(pdpHtml);
          
          if (!$pdp('title').text().toLowerCase().includes('captcha') && $pdp('.andes-form-captcha').length === 0) {
            $ = $pdp; // Use PDP HTML
            pdpFetched = true;
          } else {
            console.log('PDP fetch returned CAPTCHA, falling back to affiliate page data.');
          }
        } catch (err) {
          console.error('Failed to fetch PDP, falling back to affiliate page data:', err);
        }
      } else {
        pdpFetched = true; // It was already a PDP
      }

      // Extract data using PDP selectors (trying multiple for robustness)
      let title = $('.ui-pdp-title').first().text().trim();
      if (!title) title = $('h1').first().text().trim();
      if (!title) title = $('meta[property="og:title"]').attr('content')?.trim() || '';

      // Clean up title (remove " | Mercado Livre")
      title = title.replace(/\s*\|\s*Mercado\s*Livre.*$/i, '');

      // Use fallback if PDP title is missing
      if (!title && fallbackTitle) {
        title = fallbackTitle;
      }

      // Current Price (from PDP)
      let priceFractionEl = $('.ui-pdp-price__second-line .andes-money-amount:not(.andes-money-amount--previous) .andes-money-amount__fraction').first();
      if (priceFractionEl.length === 0) priceFractionEl = $('.poly-price__current .andes-money-amount__fraction').first();
      if (priceFractionEl.length === 0) priceFractionEl = $('.andes-money-amount:not(.andes-money-amount--previous) .andes-money-amount__fraction').first();
      
      let priceFraction = priceFractionEl.text().trim().replace(/\./g, '');
      if (!priceFraction && fallbackPriceFraction) priceFraction = fallbackPriceFraction;

      let priceCentsEl = $('.ui-pdp-price__second-line .andes-money-amount:not(.andes-money-amount--previous) .andes-money-amount__cents').first();
      if (priceCentsEl.length === 0) priceCentsEl = $('.poly-price__current .andes-money-amount__cents').first();
      if (priceCentsEl.length === 0) priceCentsEl = $('.andes-money-amount:not(.andes-money-amount--previous) .andes-money-amount__cents').first();
      
      let priceCents = priceCentsEl.text().trim() || '00';
      if (!priceCents && fallbackPriceCents) priceCents = fallbackPriceCents;

      let currency = $('.poly-price__current .andes-money-amount__currency-symbol').first().text().trim() || 'R$';

      const price = priceFraction ? `${priceFraction},${priceCents}` : '0';

      // Original Price from PDP
      let originalPrice = '';
      const pdpPrevFractionEl = $('.andes-money-amount--previous .andes-money-amount__fraction').first();
      if (pdpPrevFractionEl.length > 0) {
        const pdpPrevFraction = pdpPrevFractionEl.text().trim().replace(/\./g, '');
        const pdpPrevCents = $('.andes-money-amount--previous .andes-money-amount__cents').first().text().trim() || '00';
        if (pdpPrevFraction) originalPrice = `${pdpPrevFraction},${pdpPrevCents}`;
      }

      if (!originalPrice && fallbackOriginalPrice) {
        originalPrice = fallbackOriginalPrice;
      }
      
      // Installments
      let installmentInfo = $('.ui-pdp-price__second-line, .ui-pdp-media__title, .ui-pdp-color--GREEN').first().text().trim();
      if (!installmentInfo && fallbackInstallments) installmentInfo = fallbackInstallments;
      
      // Description
      const description = $('.ui-pdp-description__content').first().html() || '';
      
      // Images
      const images: string[] = [];
      
      // PRIORITIZE affiliate card image (poly-component__picture) as requested
      if (fallbackImage && !fallbackImage.includes('pixel')) {
        images.push(fallbackImage);
      }

      // Try to find images in gallery or meta tags
      $('.ui-pdp-gallery__figure img, .ui-pdp-gallery__column img, .ui-pdp-image').each((i, el) => {
        const src = $(el).attr('data-zoom') || $(el).attr('data-src') || $(el).attr('src');
        if (src && !images.includes(src) && !src.includes('pixel')) {
          images.push(src);
        }
      });
      
      if (images.length === 0) {
        const cardImg = $('.poly-card__portada img, .poly-component__picture').first();
        const cardSrc = cardImg.attr('src') || cardImg.attr('data-src');
        if (cardSrc && !cardSrc.includes('pixel') && !images.includes(cardSrc)) {
          images.push(cardSrc);
        }
      }

      if (images.length === 0) {
        const ogImage = $('meta[property="og:image"]').attr('content');
        if (ogImage && !ogImage.includes('logo')) images.push(ogImage);
      }

      // Breadcrumbs (Category/Subcategory)
      const breadcrumbs: string[] = [];
      $('.andes-breadcrumb__item, .ui-pdp-breadcrumb__item, .andes-breadcrumb__link').each((i, el) => {
        const text = $(el).text().trim();
        if (text && !breadcrumbs.includes(text)) {
          breadcrumbs.push(text);
        }
      });

      let category = breadcrumbs[0] || 'Geral';
      let subcategory = breadcrumbs[1] || '';

      // MODIFICAÇÃO: Buscar categorias via API oficial do Mercado Livre (Lógica Pai > Filho > Neto)
      let pathFromRoot: string[] = [];
      try {
        let productId = '';
        const urlToMatch = (pdpFetched && productLink) ? productLink : finalUrl;
        
        // LÓGICA SOLICITADA: Tentar extrair o ID sendo a última parte do path (muito comum em links diretos)
        const pathParts = urlToMatch.split('?')[0].split('/');
        const lastPart = pathParts[pathParts.length - 1];
        const secondToLastPart = pathParts[pathParts.length - 2];
        
        if (lastPart.startsWith('MLB') && /MLB\d+/.test(lastPart)) {
          productId = lastPart;
        } else if (secondToLastPart === 'p' && lastPart.startsWith('MLB')) {
          productId = lastPart; // Caso /p/MLBxxxx
        } else {
          // Fallback 1: Parâmetros de marketing (matt_product_id, item_id, etc)
          const urlParamsMatch = urlToMatch.match(/(?:product_id|item_id|matt_product_id)=MLB-?(\d+)/i);
          if (urlParamsMatch) {
            productId = `MLB${urlParamsMatch[1]}`;
          } else {
            // Fallback 2: Regex genérico na URL
            const urlGenericMatch = urlToMatch.match(/MLB-?(\d+)/i);
            if (urlGenericMatch) {
              productId = `MLB${urlGenericMatch[1]}`;
            } else {
              // Fallback 3: Metatags no HTML
              const itemIdMeta = $('meta[name="twitter:app:url:google"]').attr('content') || 
                                $('meta[property="al:android:url"]').attr('content');
              if (itemIdMeta) {
                const m = itemIdMeta.match(/id=(MLB-?\d+)/i) || itemIdMeta.match(/item\/(MLB-?\d+)/i);
                if (m) productId = m[1].replace('-', '');
              }
            }
          }
        }

        if (productId) {
          console.log('ID do Produto identificado com sucesso:', productId);
          const apiHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'application/json',
          };
          
          // Consultar API de Itens
          const itemResponse = await fetch(`https://api.mercadolibre.com/items/${productId}`, { headers: apiHeaders });
          if (itemResponse.ok) {
            const itemData = await itemResponse.json();
            const categoryId = itemData.category_id;
            
            if (categoryId) {
              // Consultar API de Categorias para obter a hierarquia (path_from_root)
              const catResponse = await fetch(`https://api.mercadolibre.com/categories/${categoryId}`, { headers: apiHeaders });
              if (catResponse.ok) {
                const catData = await catResponse.json();
                if (catData.path_from_root) {
                    pathFromRoot = catData.path_from_root.map((c: any) => c.name);
                    console.log('Hierarquia API ML:', pathFromRoot.join(' > '));
                }
              }
            }
          }
        }
      } catch (apiErr) {
        console.warn('Falha na consulta à API do ML, usando breadcrumbs do HTML:', apiErr);
      }

      // MODIFICAÇÃO: Estruturar hierarquia conforme solicitação (Principal > Sub > Segmento)
      let segment = "";
      if (pathFromRoot.length > 0) {
        category = pathFromRoot[0] || category;
        subcategory = pathFromRoot[1] || subcategory;
        segment = pathFromRoot[2] || "";
      }

      // Fallback via IA para extração de imagens
      if (images.length === 0) {
        console.warn('Scraping padrão de imagem falhou, tentando fallback via IA para a URL:', finalUrl);
        try {
          const { GoogleGenAI } = await import("@google/genai");
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
          const prompt = `Você é um assistente especializado em web scraping e análise de metatags de e-commerce.
Analise a URL do Mercado Livre fornecida e extraia a URL da imagem principal do produto em alta resolução, além da galeria de fotos.
URL do Produto: ${finalUrl}

Regras de Extração:
Priorize a imagem definida na metatag og:image.
Se houver uma galeria, procure por seletores como .ui-pdp-gallery__figure__image ou scripts que contenham o array pictures.
Certifique-se de que a URL da imagem seja a versão de alta resolução (geralmente terminando em -O.jpg ou -F.jpg).
Retorne APENAS um objeto JSON válido no seguinte formato:

{
  "imagem_principal": "string_url",
  "galeria": ["url1", "url2"],
  "id_produto": "MLBxxxx"
}`;
          
          const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
              safetySettings: [
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
              ]
            }
          });
          
          const text = result.response?.text() || "";
          const jsonMatch = text.match(/\{.*\}/s);
          
          if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);
            if (data.imagem_principal) images.push(data.imagem_principal);
            if (data.galeria && Array.isArray(data.galeria)) {
              data.galeria.forEach((img: string) => {
                if (img && !images.includes(img)) images.push(img);
              });
            }
          }
        } catch (err) {
          console.error("Falha ao recuperar imagem via IA:", err);
        }
      }

      if (!title || title.length < 3) {
        // Fallback to Gemini if standard scraping fails to find a title
        console.warn('Standard scraper failed to find title, attempting Gemini fallback for URL:', finalUrl);
        try {
          const { GoogleGenAI } = await import("@google/genai");
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
          const fallbackResult = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Extraia o título exato, preço atual, preço original (se houver), e categoria deste produto do Mercado Livre: ${finalUrl}. Retorne em JSON: {"titulo": "", "preco": "", "preco_original": "", "categoria": ""}`,
            config: {
              safetySettings: [
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
              ]
            }
          });
          
          const fallbackText = fallbackResult.response?.text() || "";
          const jsonMatch = fallbackText.match(/\{.*\}/s);
          if (jsonMatch) {
            const fallbackData = JSON.parse(jsonMatch[0]);
            title = fallbackData.titulo || title;
            if (fallbackData.preco) priceFraction = fallbackData.preco.split(',')[0].replace(/\D/g, '');
            if (fallbackData.preco_original) fallbackOriginalPrice = fallbackData.preco_original;
            if (fallbackData.categoria && breadcrumbs.length === 0) breadcrumbs.push(fallbackData.categoria);
          }
        } catch (fallbackErr) {
          console.error('Gemini fallback failed:', fallbackErr);
        }
      }

      if (!title || title.length < 3) {
        throw new Error('Não foi possível encontrar o título do produto. A URL pode não ser uma página de produto válida do Mercado Livre ou o acesso foi limitado.');
      }

      // NOVO: Gerar descrição curta e SEO automaticamente se não houver descrição completa
      let shortDesc = "";
      let generatedLongDesc = description;

      if (process.env.GEMINI_API_KEY) {
        try {
          console.log('Generating AI descriptions for:', title);
          const { GoogleGenAI } = await import("@google/genai");
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
          const seoResult = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Aja como um redator especialista em E-commerce e Copywriting persuasivo. Analise o produto "${title}".
            Crie um conteúdo no estilo BLOG POST para a descrição, focado em conversão.
            1. Gere uma descrição curta impactante (máximo 160 caracteres).
            2. Gere uma descrição longa vendedora em HTML, baseando-se nos dados do fabricante e detalhes do anúncio. Use títulos (h2, h3), listas e destaque os benefícios. No final de TUDO, adicione obrigatoriamente um parágrafo com um link em destaque: <p><strong>COMPRE NO MERCADO LIVRE: <a href="${url}">${url}</a></strong></p>
            3. Identifique a hierarquia completa de categorias deste produto (ex: Tecnologia > Celulares > Smartphones).
            Retorne JSON: {"descricao_curta": "", "conteudo_html": "", "hierarquia": ["Pai", "Filho", "Neto"]}`,
            config: { responseMimeType: "application/json" }
          });
          
          const seoText = seoResult.response?.text() || "";
          const seoMatch = seoText.match(/\{.*\}/s);
          if (seoMatch) {
            const seoData = JSON.parse(seoMatch[0]);
            shortDesc = seoData.descricao_curta || "";
            generatedLongDesc = seoData.conteudo_html || description;
            if (seoData.hierarquia && seoData.hierarquia.length > 0 && pathFromRoot.length === 0) {
              pathFromRoot = seoData.hierarquia;
            }
          }
        } catch (err) {
          console.error('Falha ao gerar descrições automáticas via IA:', err);
        }
      }

      const productData = {
        name: title,
        price,
        originalPrice,
        currency: currency === 'R$' ? 'BRL' : currency,
        installmentInfo,
        description: shortDesc || (description ? description.substring(0, 160).replace(/<[^>]*>/g, '') : ""), 
        longDescription: generatedLongDesc || description,
        imageUrl: images[0] || 'https://picsum.photos/400',
        affiliateUrl: url, 
        productUrl: finalUrl, 
        category,
        subcategory,
        segment,
        tags: [],
        path_from_root: pathFromRoot.length > 0 ? pathFromRoot : breadcrumbs
      };

      res.json(productData);
    } catch (error: any) {
      console.error('Import URL Error:', error);
      res.status(500).json({ error: error.message || 'Failed to import from URL' });
    }
  });

  // Proxy to get raw HTML from a URL
  app.get('/api/ml/raw-html', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
      console.log(`Fetching raw HTML from: ${url}`);
      const response = await fetch(url as string, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        redirect: 'follow'
      });

      if (!response.ok) throw new Error(`Failed to fetch page: ${response.status}`);

      const html = await response.text();
      res.send(html);
    } catch (error: any) {
      console.error('Raw HTML Fetch Error:', error);
      res.status(500).json({ error: 'Failed to fetch raw HTML' });
    }
  });

  // Endpoint to scrape banners from Mercado Livre home page
  app.get('/api/ml/banners', async (req, res) => {
    try {
      console.log('Scraping ML Banners...');
      const response = await fetch('https://www.mercadolivre.com.br/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        }
      });

      if (!response.ok) throw new Error(`Failed to fetch ML home: ${response.status}`);

      const html = await response.text();
      const $ = cheerio.load(html);
      const banners: any[] = [];

      // Selectors for banners in the carousel
      $('.exhibitors-carousel__item, .exhibitors__item, .andes-carousel-snapper, .andes-carousel__item').each((i, el) => {
        const $el = $(el);
        const $img = $el.find('img');
        
        // Try multiple attributes for image URL
        const imageUrl = $img.attr('data-src') || 
                         $img.attr('src') || 
                         $img.attr('srcset')?.split(' ')[0] || 
                         $img.attr('data-lazy-src') || '';
                         
        const link = $el.find('a').attr('href') || $el.attr('href') || '';

        if (imageUrl && imageUrl.includes('http') && !banners.some(b => b.imageUrl === imageUrl)) {
          banners.push({ imageUrl, link });
        }
      });

      // Fallback if the above selector fails (ML often changes classes)
      if (banners.length === 0) {
        $('a[href*="c_id=/home/exhibitors-carousel/element"], a[href*="c_id=/home/banners"]').each((i, el) => {
          const $el = $(el);
          const $img = $el.find('img');
          const imageUrl = $img.attr('data-src') || $img.attr('src') || '';
          const link = $el.attr('href') || '';
          
          if (imageUrl && !banners.some(b => b.imageUrl === imageUrl)) {
            banners.push({ imageUrl, link });
          }
        });
      }

      // Final fallback: look for any large images that might be banners
      if (banners.length === 0) {
        $('img').each((i, el) => {
          const $img = $(el);
          const src = $img.attr('src') || $img.attr('data-src') || '';
          const width = parseInt($img.attr('width') || '0');
          const height = parseInt($img.attr('height') || '0');
          
          if (src.includes('mlstatic.com') && (src.includes('MLA') || src.includes('MLB')) && (width > 1000 || src.includes('OO.webp'))) {
            const link = $img.closest('a').attr('href') || '';
            if (!banners.some(b => b.imageUrl === src)) {
              banners.push({ imageUrl: src, link });
            }
          }
        });
      }

      res.json({ banners });
    } catch (error: any) {
      console.error('ML Banners Scraping Error:', error);
      res.status(500).json({ error: 'Failed to scrape banners from ML', banners: [] });
    }
  });


  // ML Agent endpoint for automated extraction
  app.get('/api/ml/agent/run', async (req, res) => {
    const { url, category } = req.query;
    
    try {
      console.log(`ML Agent triggered for ${url || category || 'default'}`);
      
      if (url) {
        const affiliateUrl = await mlAgentService.extractAffiliateLink(url as string);
        return res.json({ success: true, affiliateUrl });
      }
      
      const results = await mlAgentService.browseCategoryAndExtract(category as string);
      res.json({ success: true, results });
    } catch (error: any) {
      console.error('ML Agent error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Endpoint to check Gemini API key status and expose server key to frontend
  app.get('/api/gemini/status', async (req: any, res: any) => {
    const serverKey = (process.env.GEMINI_API_KEY || '').trim();
    const serverOpenAIKey = (process.env.OPENAI_API_KEY || '').trim();
    
    if (!serverKey) {
      return res.json({ 
        status: 'not_configured',
        hasServerKey: false,
        hasOpenAIKey: !!serverOpenAIKey,
        message: 'GEMINI_API_KEY não configurada no servidor (.env)'
      });
    }

    try {
      const testResponse = await axios({
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${serverKey}`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: { contents: [{ parts: [{ text: "Responda apenas: OK" }] }] },
        timeout: 8000
      });

      const text = testResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      return res.json({
        status: 'ok',
        hasServerKey: true,
        hasOpenAIKey: !!serverOpenAIKey,
        serverKeyMasked: `${serverKey.slice(0, 10)}...${serverKey.slice(-4)}`,
        message: 'Conexão com Google AI Studio estabelecida com sucesso!',
        testResponse: text.trim(),
      });
    } catch (error: any) {
      console.error("Gemini status check error:", error.message);
      const errResponseData = error.response?.data;
      const errorMessage = errResponseData?.error?.message || error.message || '';

      const isInvalid = errorMessage.toLowerCase().includes('api key') || 
                        errorMessage.toLowerCase().includes('invalid') || 
                        error.response?.status === 400 || 
                        error.response?.status === 401;
      const isQuota = errorMessage.toLowerCase().includes('quota') || 
                      errorMessage.toLowerCase().includes('rate limit') || 
                      errorMessage.toLowerCase().includes('resource_exhausted') || 
                      error.response?.status === 429;
      
      return res.json({
        status: isInvalid ? 'invalid_key' : isQuota ? 'quota_exceeded' : 'error',
        hasServerKey: true,
        hasOpenAIKey: !!serverOpenAIKey,
        serverKeyMasked: `${serverKey.slice(0, 10)}...${serverKey.slice(-4)}`,
        message: isInvalid 
          ? 'API Key inválida ou sem permissão.' 
          : isQuota 
          ? 'Cota da API excedida. Aguarde ou troque a chave.'
          : `Erro ao conectar: ${errorMessage}`,
        error: errorMessage,
      });
    }
  });

  // Proxy for Gemini AI calls to avoid CORS and frontend key exposure issues
  app.post('/api/gemini/proxy', async (req: any, res: any) => {
    try {
      const { prompt, config } = req.body;
      let provider = (config?.provider || 'gemini').toLowerCase();

      console.log(`>>> AI PROXY REQUEST | Provider: ${provider} | Action: ${req.body.action || 'unknown'}`);

      // 1. OPENAI
      if (provider === 'openai') {
        const openaiKey = (config?.openaiApiKey || process.env.OPENAI_API_KEY || '').trim();
        const openaiModel = config?.openaiModel || 'gpt-4o-mini';
        
        if (!openaiKey) return res.status(500).json({ error: 'OpenAI API Key is not configured.' });

        console.log('>>> Routing to OpenAI');
        const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
          body: JSON.stringify({ model: openaiModel, messages: [{ role: "user", content: prompt }] })
        });

        if (!openAiResponse.ok) {
          const err = await openAiResponse.json();
          throw new Error(err.error?.message || 'OpenAI API error');
        }

        const openAiData = await openAiResponse.json();
        return res.json({
          text: openAiData.choices[0].message.content,
          usageMetadata: { totalTokenCount: openAiData.usage.total_tokens }
        });
      }


      // 3. GEMINI (Fallback padrão)
      console.log('>>> Routing to Gemini');
      const apiKey = (config?.apiKey || process.env.GEMINI_API_KEY || '').trim();
      let model = config?.model || 'gemini-2.5-flash';
      
      // Forçar nome limpo do modelo para evitar erro 404
      if (model.includes('gemini-2.5-flash')) model = 'gemini-2.5-flash';
      if (model.includes('gemini-2.5-pro')) model = 'gemini-2.5-pro';
      if (model.includes('gemini-2.0-flash-lite')) model = 'gemini-2.0-flash-lite';
      if (model.includes('gemini-2.0-flash-exp')) model = 'gemini-2.0-flash';
      if (model.includes('gemini-2.0-flash')) model = 'gemini-2.0-flash';
      if (model.includes('gemini-1.5-flash')) model = 'gemini-1.5-flash';
      if (model.includes('gemini-1.5-pro')) model = 'gemini-1.5-pro';
      
      model = model.replace('models/', '');
      
      if (!apiKey) {
        return res.status(500).json({ error: 'Gemini API Key is not configured.' });
      }

      const ai = new GoogleGenAI({ apiKey });
      
      // Lógica de Retentativa e Fallback de Modelo
      let lastError: any = null;
      let currentModel = model;
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`Gemini Attempt ${attempt}:`, { action: req.body.action, model: currentModel });
          
          const result = await ai.models.generateContent({
            model: currentModel,
            contents: prompt,
            config: {
              ...(config || {}),
              safetySettings: [
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
              ]
            }
          });

          if (!result) throw new Error('Gemini returned an empty result');
          
          // Se chegou aqui, deu certo
          // ... continuar com a extração

          // Extração robusta de texto: tenta várias propriedades comuns em diferentes versões do SDK
          let generatedText = "";
          try {
            if (typeof result.response?.text === 'function') {
              generatedText = result.response.text();
            } else if (result.response?.text) {
              generatedText = result.response.text;
            } else if (result.text) {
              generatedText = result.text;
            } else if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
              generatedText = result.candidates[0].content.parts[0].text;
            }
          } catch (e) {
            console.warn("Erro ao extrair texto via função .text(), tentando propriedade direta:", e);
            generatedText = result.text || "";
          }

          if (!generatedText && attempt === 3) {
             throw new Error('A IA não retornou nenhum texto após 3 tentativas.');
          }

          const responseData = {
            text: generatedText,
            usageMetadata: result.usageMetadata || { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 }
          };

          console.log('Gemini Proxy Success:', { 
            textLength: generatedText.length, 
            tokens: responseData.usageMetadata.totalTokenCount 
          });
          return res.json(responseData);
        } catch (error: any) {
          lastError = error;
          console.error(`Gemini Error (Attempt ${attempt}):`, error.message);
          
          // Fallback para gemini-2.5-flash se o modelo inicial falhar
          if (attempt === 1 && (error.message?.includes('not found') || error.message?.includes('not supported'))) {
            console.log('Falling back to gemini-2.5-flash due to model error');
            currentModel = 'gemini-2.5-flash';
          }
          
          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            continue;
          }
          throw error;
        }
      }

      throw lastError;
    } catch (error: any) {
      // Detectar erro de cota de várias formas (Google SDK retorna status como string ou código numérico)
      const isQuotaError = 
        error.status === "RESOURCE_EXHAUSTED" || 
        error.code === 429 || 
        error.message?.toLowerCase().includes('quota') ||
        error.message?.toLowerCase().includes('rate limit');

      // FALLBACK AUTOMÁTICO PARA OPENAI (GPT-4o-mini)
      if (isQuotaError && process.env.OPENAI_API_KEY) {
        console.warn('Cota do Gemini atingida (RESOURCE_EXHAUSTED). Acionando OpenAI como plano de backup...');
        try {
          const { prompt } = req.body;
          const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY.trim()}`
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [
                { role: "system", content: "Você é um assistente de e-commerce que retorna apenas JSON válido." },
                { role: "user", content: prompt }
              ],
              temperature: 0.7,
              response_format: { type: "json_object" }
            })
          });

          if (openAiResponse.ok) {
            const openAiData = await openAiResponse.json();
            console.log('OpenAI Fallback Ativo: Sucesso com GPT-4o-mini');
            return res.json({
              text: openAiData.choices[0].message.content,
              usageMetadata: { 
                promptTokenCount: openAiData.usage.prompt_tokens, 
                candidatesTokenCount: openAiData.usage.completion_tokens, 
                totalTokenCount: openAiData.usage.total_tokens 
              },
              source: 'OpenAI'
            });
          } else {
            const errorText = await openAiResponse.text();
            console.error('OpenAI também falhou:', errorText);
          }
        } catch (oaError) {
          console.error('Falha crítica no Fallback OpenAI:', oaError);
        }
      }

      console.error('Erro final na comunicação com IAs:', error);
      res.status(500).json({ 
        error: error.message || 'Falha ao gerar conteúdo (Cota excedida e Fallback falhou)',
        status: 500,
        isQuotaExceeded: isQuotaError
      });
    }
  });
  
  // Structured capture from Mercado Livre link
  app.post('/api/ml/capture', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL é obrigatória' });

    try {
      console.log(`Capturing structured data from: ${url}`);
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.8,en-US;q=0.5,en;q=0.3',
        }
      });
      const html = await response.text();
      const $ = cheerio.load(html);

      // Preço anterior
      const precoAnteriorFraction = $('.andes-money-amount--previous .andes-money-amount__fraction').first().text().trim();
      const precoAnterior = precoAnteriorFraction ? `R$ ${precoAnteriorFraction}` : null;

      // Preço atual
      const precoAtualFraction = $('.andes-money-amount:not(.andes-money-amount--previous) .andes-money-amount__fraction').first().text().trim();
      const precoAtual = precoAtualFraction ? `R$ ${precoAtualFraction}` : null;

      // Desconto
      const desconto = $('.andes-money-amount__discount').first().text().trim();

      // Parcelamento
      const parcelamento = $('.poly-price__installments').first().text().trim()
        .replace(/\s+/g, ' '); // Clean up whitespace

      // Frete
      const frete = $('.poly-component__shipping').first().text().trim();

      // Cupom
      const cupom = $('.poly-coupons__pill').first().text().trim();

      // Link do produto
      const link_produto = $('.poly-component__title a').attr('href') || $('.poly-component__link').attr('href') || url;

      const result = {
        preco_anterior: precoAnterior,
        preco_atual: precoAtual,
        desconto: desconto || null,
        parcelamento: parcelamento || null,
        frete: frete || null,
        cupom: cupom || null,
        link_produto: link_produto
      };

      res.json(result);
    } catch (error: any) {
      console.error('Erro na captura estruturada:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/git/test', async (req, res) => {
    let payload = req.body;
    if (typeof payload === "string") {
      try {
        payload = JSON.parse(payload);
      } catch (e) {}
    }
    const { repoUrl, token } = payload || {};

    if (!repoUrl || !token) {
      return res.status(400).json({ error: 'URL do repositório e Token são obrigatórios.' });
    }

    try {
      const { execSync } = await import('child_process');

      // Clean the repository URL to embed the token
      let authenticatedUrl = repoUrl.trim();
      if (authenticatedUrl.startsWith('https://')) {
        authenticatedUrl = `https://${token}@${authenticatedUrl.replace('https://', '')}`;
      } else if (authenticatedUrl.startsWith('http://')) {
        authenticatedUrl = `https://${token}@${authenticatedUrl.replace('http://', '')}`;
      }

      // Execute git ls-remote to check connection
      execSync(`git ls-remote ${authenticatedUrl}`, { stdio: 'pipe' });

      res.json({ status: 'success', message: 'Conexão com o Git estabelecida com sucesso!' });
    } catch (error: any) {
      console.error('Erro ao testar Git:', error);
      let errorMsg = error.message;
      if (error.stderr) {
        errorMsg += '\n' + error.stderr.toString();
      }
      res.status(500).json({ error: `Erro na conexão Git: ${errorMsg}` });
    }
  });

  app.post('/api/git/push', async (req, res) => {
    let payload = req.body;
    if (typeof payload === "string") {
      try {
        payload = JSON.parse(payload);
      } catch (e) {}
    }
    const { repoUrl, token, email, username } = payload || {};

    if (!repoUrl || !token) {
      return res.status(400).json({ error: 'URL do repositório e Token são obrigatórios.' });
    }

    try {
      const { execSync } = await import('child_process');
      
      // Auto-register / create the repository on GitHub if it doesn't exist
      const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/.]+)/);
      if (match) {
        const gitOwner = match[1];
        const gitRepoName = match[2];

        try {
          const checkResponse = await fetch(`https://api.github.com/repos/${gitOwner}/${gitRepoName}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'HubAfiliados-App'
            }
          });

          if (checkResponse.status === 404) {
            console.log(`Repositório não encontrado. Criando automaticamente: ${gitRepoName}`);
            const createResponse = await fetch('https://api.github.com/user/repos', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'HubAfiliados-App'
              },
              body: JSON.stringify({
                name: gitRepoName,
                private: true,
                description: 'Projeto HubAfiliados criado automaticamente'
              })
            });

            if (createResponse.ok) {
              console.log('Repositório criado no GitHub com sucesso!');
            } else {
              const createErr = await createResponse.json().catch(() => ({}));
              console.warn('Erro ao criar repositório automático:', createErr);
            }
          }
        } catch (err) {
          console.warn('Erro ao tentar verificar ou criar repositório no GitHub:', err);
        }
      }

      // Configure Git Identity
      const gitEmail = email || 'erikjusto@gmail.com';
      const gitUser = username || 'Erik';
      execSync(`git config user.email "${gitEmail}"`, { stdio: 'pipe' });
      execSync(`git config user.name "${gitUser}"`, { stdio: 'pipe' });

      // Clean the repository URL to embed the authentication token
      // E.g. https://github.com/Erik/HubAfiliados.git -> https://<token>@github.com/Erik/HubAfiliados.git
      let authenticatedUrl = repoUrl.trim();
      if (authenticatedUrl.startsWith('https://')) {
        authenticatedUrl = `https://${token}@${authenticatedUrl.replace('https://', '')}`;
      } else if (authenticatedUrl.startsWith('http://')) {
        authenticatedUrl = `https://${token}@${authenticatedUrl.replace('http://', '')}`;
      }

      // Add Remote and Branch Config
      try {
        execSync('git remote remove origin', { stdio: 'pipe' });
      } catch (err) {}

      execSync(`git remote add origin ${authenticatedUrl}`, { stdio: 'pipe' });
      execSync('git branch -M main', { stdio: 'pipe' });

      // Add, Commit, and Push
      execSync('git add .', { stdio: 'pipe' });
      
      try {
        execSync('git commit -m "Auto deploy via HubAfiliados Settings"', { stdio: 'pipe' });
      } catch (err) {
        // Fall through if there's nothing to commit
      }

      execSync('git push -u origin main --force', { stdio: 'pipe' });

      res.json({ status: 'success', message: 'Código enviado com sucesso para a conta Git!' });
    } catch (error: any) {
      console.error('Erro ao enviar para o Git:', error);
      let errorMsg = error.message;
      if (error.stderr) {
        errorMsg += '\n' + error.stderr.toString();
      }
      res.status(500).json({ error: `Erro no Git: ${errorMsg}` });
    }
  });

  // Global error handler to ensure JSON responses
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Global Server Error:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
      status: err.status || 500
    });
  });

  // Start server
  async function startServer() {
    if (process.env.NODE_ENV !== 'production') {
      try {
        // Vite middleware for development
        const { createServer: createViteServer } = await import('vite');
        const vite = await createViteServer({
          server: { middlewareMode: true },
          appType: 'spa',
        });
        app.use(vite.middlewares);
      } catch (err) {
        console.error('Failed to start local dev server:', err);
      }
    } else {
      // Serve static files in production
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*all', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  }

  startServer();

  // Export for Vercel serverless functions
  export default app;
