import { ProductData } from '@/types';

export const fetchAndParseMLProduct = async (url: string): Promise<ProductData> => {
  try {
    let html = '';
    let finalUrl = url;
    const proxies = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      `https://corsproxy.io/?${encodeURIComponent(url)}`,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
      `https://thingproxy.freeboard.io/fetch/${url}`
    ];

    for (const proxyUrl of proxies) {
      try {
        const response = await fetch(proxyUrl, { redirect: 'follow' });
        if (response.ok) {
          html = await response.text();
          if (html && html.includes('<html')) break;
        }
      } catch (e) {
        console.warn(`Proxy failed: ${proxyUrl}`, e);
      }
    }

    if (!html) {
      throw new Error('Falha ao acessar o link fornecido. Verifique se o link é válido e está acessível.');
    }

    let parser = new DOMParser();
    let doc = parser.parseFromString(html, 'text/html');

    // Check for meta refresh redirect (common in shortlinks)
    const metaRefresh = doc.querySelector('meta[http-equiv="refresh"]');
    if (metaRefresh) {
      const content = metaRefresh.getAttribute('content');
      if (content) {
        const match = content.match(/url=['"]?([^'"]+)['"]?/i);
        if (match && match[1]) {
          finalUrl = match[1];
          // Fetch the actual URL
          html = '';
          for (const proxyUrl of proxies) {
            try {
              const redirectProxyUrl = proxyUrl.replace(encodeURIComponent(url), encodeURIComponent(finalUrl)).replace(url, finalUrl);
              const response = await fetch(redirectProxyUrl, { redirect: 'follow' });
              if (response.ok) {
                html = await response.text();
                if (html && html.includes('<html')) break;
              }
            } catch (e) {
              console.warn(`Proxy failed on redirect: ${proxyUrl}`, e);
            }
          }
          if (html) {
            doc = parser.parseFromString(html, 'text/html');
          }
        }
      }
    }

    let name = '';
    let price = '';
    let originalPrice = '';
    let imageUrl = '';
    let installmentInfo = '';
    let tag = '';
    let description = '';

    const pdpTitleEl = doc.querySelector('.ui-pdp-title');
    const polyCard = doc.querySelector('.poly-card');
    const alternativeTitleEl = doc.querySelector('h1.ui-pdp-title, .ui-pdp-header__title-container h1, .poly-component__title');
    
    if (pdpTitleEl) {
      // Standard product page
      name = pdpTitleEl.textContent?.trim() || '';

      const imgEl = doc.querySelector('.ui-pdp-gallery__figure__image');
      if (imgEl) imageUrl = imgEl.getAttribute('src') || imgEl.getAttribute('data-src') || '';

      const currentPriceEl = doc.querySelector('.ui-pdp-price__second-line .andes-money-amount__fraction, .ui-pdp-price__main-container .andes-money-amount__fraction');
      const currentPriceCentsEl = doc.querySelector('.ui-pdp-price__second-line .andes-money-amount__cents, .ui-pdp-price__main-container .andes-money-amount__cents');
      if (currentPriceEl) {
        price = currentPriceEl.textContent?.trim().replace(/\./g, '') || '';
        const cents = currentPriceCentsEl?.textContent?.trim() || '00';
        if (price) price = `${price},${cents}`;
      }

      const originalPriceEl = doc.querySelector('.ui-pdp-price__original-value .andes-money-amount__fraction, .andes-money-amount--previous .andes-money-amount__fraction, .ui-pdp-price__original-value s .andes-money-amount__fraction');
      const originalPriceCentsEl = doc.querySelector('.ui-pdp-price__original-value .andes-money-amount__cents, .andes-money-amount--previous .andes-money-amount__cents, .ui-pdp-price__original-value s .andes-money-amount__cents');
      if (originalPriceEl) {
        let origPrice = originalPriceEl.textContent?.trim().replace(/\./g, '') || '';
        const origCents = originalPriceCentsEl?.textContent?.trim() || '00';
        if (origPrice) originalPrice = `${origPrice},${origCents}`;
      } else {
        // Fallback for <s> tag without specific classes if needed
        const sTag = doc.querySelector('.ui-pdp-price__original-value s, .andes-money-amount--previous');
        if (sTag && !originalPrice) {
          const text = sTag.textContent?.replace('R$', '').trim() || '';
          const matches = text.match(/(\d+)\s*(\d{2})?/);
          if (matches) {
            originalPrice = matches[2] ? `${matches[1]},${matches[2]}` : `${matches[1]},00`;
          }
        }
      }

      const installmentsEl = doc.querySelector('.ui-pdp-payment-icon-container__text, #pricing_price_subtitle, .ui-pdp-price__subtitles');
      if (installmentsEl) installmentInfo = installmentsEl.textContent?.trim() || '';
      
      const extractFormattedText = (el: Element | null): string => {
        if (!el) return '';
        let html = el.innerHTML;
        // Replace <br> and block elements with newlines before stripping tags
        html = html.replace(/<br\s*\/?>/gi, '\n');
        html = html.replace(/<\/(p|div|h[1-6]|li)>/gi, '\n');
        
        // Use a temporary element to decode HTML entities (like &amp;)
        const temp = document.createElement('div');
        temp.innerHTML = html;
        let text = temp.textContent || '';
        
        // Clean up excess newlines
        return text.replace(/\n{3,}/g, '\n\n').trim();
      };

      const descEl = doc.querySelector('.ui-pdp-description__content, .ui-pdp-description');
      if (descEl) description = extractFormattedText(descEl);
    } else if (polyCard || doc.querySelector('.poly-component__title')) {
      // Fallback to poly-card or any poly component
      const container = polyCard || doc;
      const titleEl = container.querySelector('.poly-component__title');
      if (titleEl) name = titleEl.textContent?.trim() || '';

      const linkEl = container.querySelector('a.poly-component__title');
      if (linkEl) {
        const href = linkEl.getAttribute('href');
        if (href) finalUrl = href;
      }

      const imgEl = container.querySelector('.poly-component__picture, img');
      if (imgEl) imageUrl = imgEl.getAttribute('src') || imgEl.getAttribute('data-src') || '';

      const convertPriceText = (text: string) => {
        if (!text) return '';
        const matches = text.match(/([0-9]+).*?([0-9]{2})/);
        if (matches) return `${matches[1]},${matches[2]}`;
        return text.replace(/[^\d,]/g, '');
      };

      // Current Price
      const priceLabel = container.querySelector('[aria-label^="Agora:"]')?.getAttribute('aria-label');
      if (priceLabel) {
        price = convertPriceText(priceLabel);
      } else {
        const currentPriceEl = container.querySelector('.poly-price__current .andes-money-amount__fraction');
        const currentPriceCentsEl = container.querySelector('.poly-price__current .andes-money-amount__cents');
        if (currentPriceEl) {
          price = currentPriceEl.textContent?.trim().replace(/\./g, '') || '';
          const cents = currentPriceCentsEl?.textContent?.trim() || '00';
          if (price) price = `${price},${cents}`;
        } else {
          const spans = Array.from(container.querySelectorAll('span'));
          const currentPriceMatch = spans.find(s => s.textContent?.includes('R$') && !s.textContent?.includes('OFF'));
          if (currentPriceMatch) {
            price = currentPriceMatch.textContent?.replace('R$', '').trim() || '';
          }
        }
      }

      // Original Price
      const oldPriceLabel = container.querySelector('[aria-label^="Antes:"]')?.getAttribute('aria-label');
      if (oldPriceLabel) {
        originalPrice = convertPriceText(oldPriceLabel);
      } else {
        const previousPriceContainer = container.querySelector('.andes-money-amount--previous');
        if (previousPriceContainer) {
          const origFraction = previousPriceContainer.querySelector('.andes-money-amount__fraction')?.textContent?.trim().replace(/\./g, '');
          const origCents = previousPriceContainer.querySelector('.andes-money-amount__cents')?.textContent?.trim() || '00';
          if (origFraction) {
            originalPrice = `${origFraction},${origCents}`;
          } else {
            const text = previousPriceContainer.textContent?.replace('R$', '').trim() || '';
            const matches = text.match(/(\d+)\s*(\d{2})?/);
            if (matches) {
              originalPrice = matches[2] ? `${matches[1]},${matches[2]}` : `${matches[1]},00`;
            }
          }
        } else {
          const sTag = container.querySelector('s');
          if (sTag) {
            const text = sTag.textContent?.replace('R$', '').trim() || '';
            const matches = text.match(/(\d+)\s*(\d{2})?/);
            if (matches) {
              originalPrice = matches[2] ? `${matches[1]},${matches[2]}` : `${matches[1]},00`;
            }
          }
        }
      }

      const installmentsEl = container.querySelector('.poly-price__installments');
      if (installmentsEl) installmentInfo = installmentsEl.textContent?.trim() || '';

      const sellerEl = container.querySelector('.poly-component__seller');
      const seller = sellerEl?.textContent?.replace('Por', '').trim() || 'Desconhecido';
      
      const discountEl = container.querySelector('.poly-price__disc_label, .andes-money-amount__discount');
      const discount = discountEl?.textContent?.trim() || '';
      
      const couponEl = container.querySelector('.poly-coupons__pill');
      const coupon = couponEl?.textContent?.trim() || '';
      
      const shippingEl = container.querySelector('.poly-component__shipping, .poly-shipping--monday');
      const shipping = shippingEl?.textContent?.trim() || '';

      description = '';
      
      const tagEl = container.querySelector('.poly-component__highlight');
      if (tagEl) tag = tagEl.textContent?.trim() || '';
    } else if (alternativeTitleEl) {
        name = alternativeTitleEl.textContent?.trim() || '';
        
        const imgEl = doc.querySelector('img.ui-pdp-image, img.poly-component__picture');
        if (imgEl) imageUrl = imgEl.getAttribute('src') || imgEl.getAttribute('data-src') || '';

        const currentPriceEl = doc.querySelector('.andes-money-amount__fraction');
        const currentPriceCentsEl = doc.querySelector('.andes-money-amount__cents');
        if (currentPriceEl) {
          price = currentPriceEl.textContent?.trim().replace(/\./g, '') || '';
          const cents = currentPriceCentsEl?.textContent?.trim() || '00';
          if (price) price = `${price},${cents}`;
        }
    }

    if (!name) {
      const ogTitle = doc.querySelector('meta[property="og:title"]');
      if (ogTitle) name = ogTitle.getAttribute('content') || '';
    }

    if (!name) {
      const titleTag = doc.querySelector('title');
      if (titleTag) name = titleTag.textContent?.split('|')[0]?.trim() || '';
    }

    if (!name) {
      const imgEl = doc.querySelector('img[alt]');
      if (imgEl) {
        const alt = imgEl.getAttribute('alt') || '';
        if (alt.length > 10 && !alt.toLowerCase().includes('imagem')) {
          name = alt;
        }
      }
    }

    if (!name) {
      throw new Error('SCRAPER_FAILED: Não foi possível encontrar o título do produto na página.');
    }

    // MODIFICAÇÃO: Tentar buscar categorias via API do Mercado Livre (se possível via CORS ou proxy)
    let pathFromRoot: string[] = [];
    try {
      const productIdMatch = finalUrl.match(/MLB-?\d+/);
      if (productIdMatch) {
         const productId = productIdMatch[0].replace('-', '');
         const apiResponse = await fetch(`https://api.mercadolibre.com/items/${productId}`);
         if (apiResponse.ok) {
           const itemData = await apiResponse.json();
           const catResponse = await fetch(`https://api.mercadolibre.com/categories/${itemData.category_id}`);
           if (catResponse.ok) {
             const catData = await catResponse.json();
             if (catData.path_from_root) {
               pathFromRoot = catData.path_from_root.map((c: any) => c.name);
             }
           }
         }
      }
    } catch (e) {
      console.warn('API category fetch failed on client:', e);
    }

    return {
      name,
      price: price || '0',
      originalPrice: originalPrice || undefined,
      currency: 'BRL',
      installmentInfo: installmentInfo || '',
      description: '',
      imageUrl: imageUrl || 'https://picsum.photos/400',
      affiliateUrl: url,
      productUrl: finalUrl,
      tags: tag ? [tag] : [],
      category: 'Geral', // Default category
      subcategory: '',
      path_from_root: pathFromRoot.length > 0 ? pathFromRoot : (name ? [] : undefined)
    };
  } catch (error: any) {
    // Apenas repassa o erro para que o componente principal (LinkProductTab) lide com o fallback
    throw new Error(error.message || 'Erro ao extrair dados do produto.');
  }
};
