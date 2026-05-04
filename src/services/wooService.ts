
import { WooCommerceConfig, ProductData, ImportRecord } from "@/types";

/**
 * Normaliza preços do formato brasileiro (ex: 1.299,90) para o padrão decimal da API (1299.90).
 * Lida com símbolos de moeda, espaços, pontos de milhar e vírgulas decimais.
 */
export const normalizePrice = (priceLabel: string): string => {
  if (!priceLabel) return '0.00';
  
  // 1. Limpeza pesada: mantém apenas números, vírgulas e pontos
  let clean = priceLabel.replace(/[R$\s]/g, '').replace(/[^0-9\.,]/g, '');
  
  const lastComma = clean.lastIndexOf(',');
  const lastDot = clean.lastIndexOf('.');

  // 2. Lógica para definir o separador decimal real
  if (lastComma > lastDot) {
    // Padrão BR: Milhar com ponto, decimal com vírgula (ex: 1.299,90)
    // Remove todos os pontos (milhar) e troca a vírgula por ponto (decimal)
    return clean.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma) {
    // Padrão US: Milhar com vírgula, decimal com ponto (ex: 1,299.90)
    // Ou apenas milhar sem centavos no ML (ex: 1.299)
    if (lastComma !== -1) {
      // É 1,299.90 -> remove vírgula
      return clean.replace(/,/g, '');
    }
    
    // É 1.299? No ML, se houver apenas um ponto e 3 casas depois, costuma ser milhar.
    const parts = clean.split('.');
    if (parts.length === 2 && parts[1].length === 3) {
      return clean.replace(/\./g, '');
    }
    
    // Caso contrário, assume que o ponto já é o decimal (ex: 64.10)
    return clean;
  }

  // 3. Caso tenha apenas vírgula (ex: 64,10)
  if (lastComma !== -1 && lastDot === -1) {
    return clean.replace(',', '.');
  }

  // 4. Se não tiver nada, retorna o valor limpo ou zero
  return clean || '0.00';
};

const wooProxy = async (config: WooCommerceConfig, endpoint: string, method: string = "GET", body?: any) => {
  try {
    const response = await fetch("/api/woo/proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config, endpoint, method, body })
    });

    if (response.ok) {
      return await response.json();
    }

    if (response.status === 404) {
      console.warn("Proxy endpoint 404 not found. Attempting direct fallback call...");
      throw new Error("404_NOT_FOUND");
    }

    let errorMessage = "Erro retornado pela API do WooCommerce.";
    const text = await response.text();
    try {
      const errorData = JSON.parse(text);
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      console.error("Resposta não-JSON do proxy:", text);
      const snippet = text.substring(0, 100).replace(/\n/g, ' ');
      errorMessage = `Erro no servidor (Proxy): ${response.status}. Detalhe: ${snippet}`;
    }
    throw new Error(errorMessage);

  } catch (err: any) {
    if (err.message === "404_NOT_FOUND" || err.message?.includes("Failed to fetch") || err.message?.includes("404")) {
      let baseUrl = String(config.url).trim().replace(/\/$/, "");
      if (!baseUrl.startsWith("http")) {
        baseUrl = `https://${baseUrl}`;
      }
      let apiUrl = `${baseUrl}${endpoint}`;
      const separator = apiUrl.includes("?") ? "&" : "?";
      apiUrl = `${apiUrl}${separator}consumer_key=${config.consumerKey}&consumer_secret=${config.consumerSecret}`;
      
      const auth = btoa(`${config.consumerKey}:${config.consumerSecret}`);

      console.log(`Direct WooCommerce API Call: ${method} ${apiUrl}`);
      const directResponse = await fetch(apiUrl, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${auth}`
        },
        body: body ? JSON.stringify(body) : undefined
      });

      if (!directResponse.ok) {
        let errorMsg = "Erro na chamada direta ao WooCommerce.";
        try {
          const directText = await directResponse.text();
          const errJson = JSON.parse(directText);
          errorMsg = errJson.message || errorMsg;
        } catch (e) {}
        throw new Error(errorMsg);
      }

      return await directResponse.json();
    }
    throw err;
  }
};

export const createWooProduct = async (config: WooCommerceConfig, product: ProductData) => {
  if (!config.url || !config.consumerKey || !config.consumerSecret) {
    throw new Error("Credenciais do WooCommerce não configuradas.");
  }

  const decimalPrice = normalizePrice(product.price);
  const decimalOriginalPrice = product.originalPrice ? normalizePrice(product.originalPrice) : undefined;

  // Helper to find or create a category
  const getCategoryId = async (name: string, parentId?: number): Promise<number | null> => {
    try {
      const searchUrl = `/wp-json/wc/v3/products/categories?search=${encodeURIComponent(name)}`;
      const existing = await wooProxy(config, searchUrl);
      const match = existing.find((c: any) => c.name.toLowerCase() === name.toLowerCase() && (!parentId || c.parent === parentId));
      
      if (match) return match.id;

      // Create if not found
      const created = await wooProxy(config, "/wp-json/wc/v3/products/categories", "POST", { name, parent: parentId || 0 });
      return created.id;
    } catch (e) {
      console.error(`Erro ao processar categoria ${name}:`, e);
      return null;
    }
  };

  const categories = [];
  let parentId: number | null = null;

  if (product.path_from_root && product.path_from_root.length > 0) {
    for (const catName of product.path_from_root) {
      const catId = await getCategoryId(catName, parentId || undefined);
      if (catId) {
        categories.push({ id: catId });
        parentId = catId;
      }
    }
  } else {
    if (product.category) {
      parentId = await getCategoryId(product.category);
      if (parentId) categories.push({ id: parentId });
    }

    if (product.subcategory && parentId) {
      const subId = await getCategoryId(product.subcategory, parentId);
      if (subId) categories.push({ id: subId });
    }
  }

  const payload = {
    name: product.name,
    type: "external",
    status: "publish",
    regular_price: decimalOriginalPrice || decimalPrice,
    sale_price: decimalOriginalPrice ? decimalPrice : undefined,
    description: product.longDescription || product.description,
    short_description: product.description + 
      (product.installmentInfo ? `<p><strong>Parcelamento:</strong> ${product.installmentInfo}</p>` : "") +
      (product.productUrl ? `<p><strong>Link Original:</strong> <a href="${product.productUrl}" target="_blank">${product.productUrl}</a></p>` : ""),
    external_url: product.affiliateUrl,
    button_text: "Comprar no Mercado Livre",
    categories: categories.length > 0 ? categories : undefined,
    tags: product.tags ? product.tags.map(tag => ({ name: tag })) : undefined,
    images: product.imageUrl ? [
      {
        src: product.imageUrl,
        name: product.name,
        alt: product.name
      }
    ] : []
  };

  return await wooProxy(config, "/wp-json/wc/v3/products", "POST", payload);
};

export const updateWooProduct = async (config: WooCommerceConfig, id: string, product: Partial<ImportRecord>) => {
  if (!config.url || !config.consumerKey || !config.consumerSecret) {
    throw new Error("Credenciais do WooCommerce não configuradas.");
  }

  const decimalPrice = product.price ? normalizePrice(product.price) : undefined;
  const decimalOriginalPrice = product.originalPrice ? normalizePrice(product.originalPrice) : undefined;

  // Helper to find or create a category
  const getCategoryId = async (name: string, parentId?: number): Promise<number | null> => {
    try {
      const searchUrl = `/wp-json/wc/v3/products/categories?search=${encodeURIComponent(name)}`;
      const existing = await wooProxy(config, searchUrl);
      const match = existing.find((c: any) => c.name.toLowerCase() === name.toLowerCase() && (!parentId || c.parent === parentId));
      
      if (match) return match.id;

      // Create if not found
      const created = await wooProxy(config, "/wp-json/wc/v3/products/categories", "POST", { name, parent: parentId || 0 });
      return created.id;
    } catch (e) {
      console.error(`Erro ao processar categoria ${name}:`, e);
      return null;
    }
  };

  const categories = [];
  let parentId: number | null = null;

  if (product.path_from_root && product.path_from_root.length > 0) {
    for (const catName of product.path_from_root) {
      const catId = await getCategoryId(catName, parentId || undefined);
      if (catId) {
        categories.push({ id: catId });
        parentId = catId;
      }
    }
  } else {
    if (product.category) {
      parentId = await getCategoryId(product.category);
      if (parentId) categories.push({ id: parentId });
    }

    if (product.subcategory && parentId) {
      const subId = await getCategoryId(product.subcategory, parentId);
      if (subId) categories.push({ id: subId });
    }
  }

  const payload: any = {
    name: product.name,
    regular_price: decimalOriginalPrice || decimalPrice,
    sale_price: decimalOriginalPrice ? decimalPrice : undefined,
    description: product.longDescription || product.description,
    short_description: product.description ? (
      product.description + 
      (product.installmentInfo ? `<p><strong>Parcelamento:</strong> ${product.installmentInfo}</p>` : "") +
      (product.productUrl ? `<p><strong>Link Original:</strong> <a href="${product.productUrl}" target="_blank">${product.productUrl}</a></p>` : "")
    ) : undefined,
    external_url: product.affiliateUrl,
    categories: categories.length > 0 ? categories : undefined,
    tags: product.tags ? product.tags.map(tag => ({ name: tag })) : undefined,
  };

  if (product.imageUrl) {
    payload.images = [
      {
        src: product.imageUrl,
        name: product.name || "",
        alt: product.name || ""
      }
    ];
  }

  // Remove undefined fields
  Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

  return await wooProxy(config, `/wp-json/wc/v3/products/${id}`, "PUT", payload);
};

export const deleteWooProduct = async (config: WooCommerceConfig, id: string) => {
  if (!config.url || !config.consumerKey || !config.consumerSecret) {
    throw new Error("Credenciais do WooCommerce não configuradas.");
  }
  return await wooProxy(config, `/wp-json/wc/v3/products/${id}?force=true`, "DELETE");
};

export const syncWooCategories = async (config: WooCommerceConfig, mlCategories: Record<string, string[]>) => {
  if (!config.url || !config.consumerKey || !config.consumerSecret) {
    throw new Error("Credenciais do WooCommerce não configuradas.");
  }

  // 1. Get existing categories to avoid duplicates
  const existingCategories: any[] = await wooProxy(config, "/wp-json/wc/v3/products/categories?per_page=100");

  const results = { created: 0, skipped: 0, errors: 0 };

  for (const [parentName, subcategories] of Object.entries(mlCategories)) {
    try {
      // Check if parent exists
      let parentId: number;
      const existingParent = existingCategories.find(c => c.name.toLowerCase() === parentName.toLowerCase());

      if (existingParent) {
        parentId = existingParent.id;
        results.skipped++;
      } else {
        const newParent = await wooProxy(config, "/wp-json/wc/v3/products/categories", "POST", { name: parentName });
        parentId = newParent.id;
        results.created++;
      }

      // Create subcategories
      for (const subName of subcategories) {
        const existingSub = existingCategories.find(c => 
          c.name.toLowerCase() === subName.toLowerCase() && c.parent === parentId
        );

        if (existingSub) {
          results.skipped++;
          continue;
        }

        try {
          await wooProxy(config, "/wp-json/wc/v3/products/categories", "POST", { name: subName, parent: parentId });
          results.created++;
        } catch (err) {
          results.errors++;
        }
      }
    } catch (err) {
      console.error(`Erro ao sincronizar categoria ${parentName}:`, err);
      results.errors++;
    }
  }

  return results;
};

export const testWooConnection = async (config: WooCommerceConfig) => {
  try {
    await wooProxy(config, "/wp-json/wc/v3/products?per_page=1");
    return true;
  } catch (err: any) {
    throw new Error(err.message || "Conexão falhou. Verifique as credenciais.");
  }
};

export const getWooProducts = async (config: WooCommerceConfig): Promise<ImportRecord[]> => {
  if (!config.url || !config.consumerKey || !config.consumerSecret) {
    return [];
  }

  try {
    const products = await wooProxy(config, "/wp-json/wc/v3/products?per_page=20&status=publish");
    
    return products.map((p: any) => {
      // Extract original price if available in meta or description (simplified)
      // In a real scenario, we might store this in meta_data
      const originalPrice = p.regular_price !== p.price ? p.regular_price : undefined;
      
      // Extract installment info from short_description if we put it there
      const installmentMatch = p.short_description?.match(/<strong>Parcelamento:<\/strong> (.*?)<\/p>/);
      const installmentInfo = installmentMatch ? installmentMatch[1] : "";

      // Extract productUrl from short_description if we put it there
      const productUrlMatch = p.short_description?.match(/<strong>Link Original:<\/strong> <a href="(.*?)"/);
      const productUrl = productUrlMatch ? productUrlMatch[1] : "";

      return {
        id: p.id.toString(),
        name: p.name,
        price: p.price.replace('.', ','),
        originalPrice: originalPrice ? originalPrice.replace('.', ',') : undefined,
        currency: 'R$',
        installmentInfo: installmentInfo,
        productUrl: productUrl,
        description: p.short_description?.replace(/<p><strong>Parcelamento:<\/strong>.*?<\/p>/, '').replace(/<p><strong>Link Original:<\/strong>.*?<\/p>/, '').replace(/<[^>]*>?/gm, '').trim() || "",
        longDescription: p.description?.replace(/<[^>]*>?/gm, '').trim() || "",
        imageUrl: p.images?.[0]?.src || "",
        affiliateUrl: p.external_url || "",
        category: p.categories?.[0]?.name || "Geral",
        subcategory: p.categories?.[1]?.name || p.categories?.[0]?.name || "Geral",
        path_from_root: p.categories?.map((c: any) => c.name) || [],
        tags: p.tags?.map((t: any) => t.name) || [],
        importedAt: p.date_created,
        status: p.status === 'publish' ? 'published' : 'draft'
      };
    });
  } catch (error) {
    console.error("Erro ao buscar produtos do WooCommerce:", error);
    return [];
  }
};
