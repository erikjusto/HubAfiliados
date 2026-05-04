
import { ProductData } from "@/types";
import { ML_CATEGORIES } from "@/constants";
import { logGeminiUsage } from "./usageTracker";

import { getGeminiConfig } from "./geminiConfigService";

const cleanJson = (text: string) => {
  if (!text) return "{}";
  // Remove markdown code blocks if present
  let cleaned = text.replace(/```json\s?|```/g, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  return match ? match[0] : (cleaned.startsWith('{') ? cleaned : "{}");
};

// Generic function to call Gemini through the server proxy
const callGeminiProxy = async (action: string, prompt: string, config: any = {}) => {
  const userConfig = getGeminiConfig();
  console.log('[DEBUG] callGeminiProxy using provider:', userConfig.provider);
  
  try {
    const response = await fetch('/api/gemini/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action,
        prompt, 
        config: {
          provider: userConfig.provider,
          model: userConfig.model,
          apiKey: userConfig.apiKey,
          openaiApiKey: userConfig.openaiApiKey,
          openaiModel: userConfig.openaiModel,
          ...config
        }
      })
    });

    if (response.ok) {
      const result = await response.json();
      logGeminiUsage({
        action,
        model: userConfig.model,
        tokensPrompt: result.usageMetadata?.promptTokenCount || 0,
        tokensCompletion: result.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: result.usageMetadata?.totalTokenCount || 0,
        status: 'success'
      });
      return result;
    }

    if (response.status === 404 || response.status === 500) {
      throw new Error("PROXY_NOT_FOUND");
    }

    const errData = await response.json();
    throw new Error(errData.error || 'Failed to call Gemini proxy');

  } catch (error: any) {
    if (error.message === "PROXY_NOT_FOUND" || error.message?.includes("Failed to fetch") || error.message?.includes("404")) {
      try {
        console.warn(`[Gemini Fallback] Proxy not available. Calling direct Google AI API.`);
        
        let apiKey = userConfig.apiKey || import.meta.env.VITE_GEMINI_API_KEY || "";
        let model = userConfig.model || "gemini-2.5-flash";

        const directResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: config.responseMimeType || "text/plain"
            }
          })
        });

        if (!directResponse.ok) {
          throw new Error(`Direct Gemini call failed (${directResponse.status})`);
        }

        const directResult = await directResponse.json();
        const generatedText = directResult.candidates?.[0]?.content?.parts?.[0]?.text || "";

        return {
          text: generatedText,
          usageMetadata: directResult.usageMetadata || { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 }
        };
      } catch (directErr: any) {
        console.error("Direct Gemini fallback call failed:", directErr);
        throw directErr;
      }
    }

    logGeminiUsage({
      action,
      model: userConfig.model,
      tokensPrompt: 0,
      tokensCompletion: 0,
      totalTokens: 0,
      status: 'error',
      errorMessage: error.message
    });
    console.error(`Gemini Proxy Error [${action}]:`, error);
    throw error;
  }
};

export const generateSeoContent = async (
  productName: string,
  category: string,
  affiliateUrl: string,
  publico: string = "Donos de pets (cachorros e gatos)",
  overrideConfig: any = {}
): Promise<any> => {
  const config = getGeminiConfig();
  const rawSystemPrompt = config.systemPrompt || `Você é um especialista em e-commerce, copywriting persuasivo e SEO estratégico.
Sua tarefa é gerar conteúdos de SEO altamente otimizados para um produto, baseando-se estritamente no nome, categoria e detalhes do anúncio.
Crie um conteúdo no estilo BLOG POST para a descrição, focado em conversão e benefícios.

INSTRUÇÕES:
1. "titulo": Crie um título SEO impactante entre 50-60 caracteres.
2. "descricao_curta": Gere um resumo persuasivo (máximo 160 caracteres) que destaque o principal benefício.
3. "conteudo_html": Gere uma descrição longa vendedora em HTML. Use títulos (h2, h3), listas e parágrafos persuasivos. Foque na autoridade do fabricante e nas dores/desejos do cliente. No final de TUDO, adicione obrigatoriamente um parágrafo com um link em destaque: <p><strong>COMPRE NO MERCADO LIVRE: <a href="${affiliateUrl}">${affiliateUrl}</a></strong></p>
4. "hierarquia": Identifique a trilha de navegação correta (ex: Tecnologia > Celulares > Smartphones).
5. "slug": Crie uma URL amigável.`;

  // Substituição de variáveis dinâmicas no prompt gravado pelo usuário
  const systemPrompt = rawSystemPrompt
    .replace(/\${productName}/g, productName)
    .replace(/\${category}/g, category)
    .replace(/\${affiliateUrl}/g, affiliateUrl);

  const prompt = `
    INSTRUÇÃO DE COMPORTAMENTO (PRIORITÁRIA):
    ${systemPrompt}
    
    DADOS ADICIONAIS DO PRODUTO:
    - Nome: ${productName}
    - Categoria: ${category}
    - Link: ${affiliateUrl}
    
    REQUISITO TÉCNICO DE SAÍDA:
    Retorne APENAS um objeto JSON válido (sem textos explicativos fora do JSON) seguindo estritamente este formato:
    {
      "titulo": "string",
      "descricao_curta": "string",
      "conteudo_html": "string (HTML)",
      "palavra_chave_principal": "string",
      "palavras_chave_secundarias": ["array"],
      "hierarquia": ["array de categorias"],
      "slug": "string"
    }
  `;

  try {
    const result = await callGeminiProxy('generateSeoContent', prompt, {
      ...overrideConfig,
      responseMimeType: "application/json"
    });

    const cleanedJson = cleanJson(result.text || "{}");
    return JSON.parse(cleanedJson);
  } catch (error: any) {
    throw new Error(`Erro ao gerar conteúdo SEO: ${error.message}`);
  }
};

export const generateLongDescription = async (product: Partial<ProductData>, overrideConfig: any = {}): Promise<string> => {
  const prompt = `
    Aja como um especialista em COPYWRITING e SEO para E-commerce.
    
    GERE uma DESCRIÇÃO LONGA em HTML com técnicas de SEO para o seguinte produto:
    Nome: ${product.name}
    Preço: ${product.price}
    Descrição Curta: ${product.description}
    
    INSTRUÇÕES:
    - NÃO inclua o título do produto (ele será adicionado automaticamente no topo).
    - Comece diretamente com os benefícios e características.
    - Use H3, listas (ul/li), negrito (strong).
    - Foco em benefícios, dor do cliente e solução.
    - O texto deve ser ALTAMENTE PERSUASIVO, direto ao ponto e NÃO precisa ser longo (priorize qualidade e impacto sobre quantidade).
    - Não use tags <html> ou <body>.
    - No final de TUDO, adicione obrigatoriamente um parágrafo com um link em destaque: <p><strong>COMPRE NO MERCADO LIVRE: <a href="${product.affiliateUrl}">${product.affiliateUrl}</a></strong></p>
    
    Retorne apenas o HTML da descrição.
  `;

  try {
    const result = await callGeminiProxy('generateLongDescription', prompt, overrideConfig);
    const generatedHtml = result.text || "";
    return `<h2>${product.name}</h2>\n${generatedHtml}`;
  } catch (error: any) {
    throw new Error(`Erro ao gerar descrição longa: ${error.message}`);
  }
};

export const generateTags = async (product: Partial<ProductData>, overrideConfig: any = {}): Promise<string[]> => {
  const prompt = `
    Aja como um especialista em SEO para E-commerce.
    
    GERE uma lista de TAGS (palavras-chave) para o seguinte produto:
    Nome: ${product.name}
    Descrição: ${product.description}
    Categoria: ${product.category} / ${product.subcategory}
    
    INSTRUÇÕES:
    - Retorne entre 5 e 10 tags relevantes.
    - Tags devem ser curtas (1 a 3 palavras).
    - Foco em termos de busca que os clientes usariam.
    
    Retorne apenas um array JSON de strings.
  `;

  try {
    const result = await callGeminiProxy('generateTags', prompt, {
      ...overrideConfig,
      responseMimeType: "application/json"
    });
    const cleanedJson = cleanJson(result.text || "[]");
    return JSON.parse(cleanedJson);
  } catch (error: any) {
    console.error("Erro ao gerar tags:", error);
    return [];
  }
};

export const generateShortDescription = async (product: Partial<ProductData>, overrideConfig: any = {}): Promise<string> => {
  const prompt = `
    Aja como um especialista em COPYWRITING para E-commerce.
    
    GERE uma DESCRIÇÃO CURTA e PERSUASIVA para o seguinte produto:
    Nome: ${product.name}
    Categoria: ${product.category} / ${product.subcategory}
    
    INSTRUÇÕES:
    - O texto deve ter entre 150 e 250 caracteres.
    - Foco em despertar o desejo de compra.
    - Use gatilhos mentais de escassez ou benefício imediato.
    - Retorne APENAS o texto da descrição, sem aspas ou comentários.
  `;

  try {
    const result = await callGeminiProxy('generateShortDescription', prompt, overrideConfig);
    return result.text?.trim() || "";
  } catch (error: any) {
    console.error("Erro ao gerar descrição curta:", error);
    return "";
  }
};

export const extractAffiliateCardData = async (url: string) => {
  const prompt = `
    Você é um assistente especializado em extrair dados de produtos do Mercado Livre.
    Acesse a URL fornecida e extraia as informações do produto para montar um card promocional.
    
    URL: ${url}
    
    REGRAS IMPORTANTES:
    1. Se a URL for encurtada (ex: meli.la), tente descobrir a página final ou extraia pelo contexto.
    2. Retorne APENAS um JSON estruturado exatamente com as chaves abaixo.
    3. Se algum dado não existir, retorne uma string vazia "".
    4. Formate os preços com "R$ ".
    
    FORMATO DE RETORNO (JSON):
    {
      "titulo": "string",
      "descricao": "string",
      "imagem": "string (url da imagem)",
      "preco_anterior": "string (ex: R$ 2.939)",
      "preco_atual": "string (ex: R$ 1.794)",
      "desconto": "string (ex: 38% OFF no Pix)",
      "parcelamento": "string (ex: 18x R$ 107,22 sem juros)",
      "frete": "string (ex: Frete grátis)",
      "vendedor": "string",
      "link_produto": "string (url limpa do produto)",
      "link_afiliado": "string (a url encurtada original fornecida)"
    }
  `;

  try {
    const result = await callGeminiProxy('extractAffiliateCardData', prompt, {
      responseMimeType: "application/json"
    });
    const cleanedJson = cleanJson(result.text || "{}");
    const data = JSON.parse(cleanedJson);
    if (!data.link_afiliado) data.link_afiliado = url;
    return data;
  } catch (error: any) {
    throw new Error(`Erro na extração Gemini: ${error.message}`);
  }
};

export const extractProductData = async (input: string): Promise<ProductData> => {
  const isUrl = input.trim().startsWith('http') && !input.includes('\n') && input.length < 2000;
  let scrapedData: Partial<ProductData> | null = null;
  
  if (isUrl && (input.includes('mercadolivre.com') || input.includes('mlstatic.com') || input.includes('meli.la'))) {
    try {
      const response = await fetch(`/api/ml/product?url=${encodeURIComponent(input)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.imageUrl && data.name) scrapedData = data;
      }
    } catch (err) {
      console.warn('Dedicated ML scraper failed, falling back to Gemini:', err);
    }
  }

  const prompt = `
    Você é um assistente especializado em scraping e estruturação de dados de produtos do Mercado Livre.
    Sua tarefa é extrair e estruturar as informações do produto fornecido.

    DADOS DO PRODUTO (CONTEXTO):
    Nome: ${scrapedData?.name || "Extrair da entrada"}
    Preço: ${scrapedData?.price || "Extrair da entrada"}
    Descrição Original: ${scrapedData?.description || "Extrair da entrada"}
    Entrada (URL ou HTML): ${isUrl ? input : "HTML fornecido abaixo"}
    
    ${!isUrl ? `HTML:\n${input}` : ""}
    
    REGRAS IMPORTANTES:
    1. Se a entrada for uma URL encurtada (meli.la), os dados devem ser extraídos da página final (use o contexto se disponível).
    2. "titulo": deve ser o título principal do produto exatamente como exibido.
    3. "descricao_curta": deve ser um resumo claro e objetivo da descrição.
    4. "conteudo_html": gere uma descrição vendedora em HTML.
    5. "imagem_principal": deve ser a URL da imagem principal em alta qualidade.
    6. "preco_atual": preço atual exibido.
    7. "preco_anterior": se houver preço riscado, capturar.
    8. "path_from_root": Extraia a hierarquia completa de categorias (breadcrumbs) que aparece no topo da página. Exemplo: ["Celulares e Telefones", "Celulares e Smartphones", "Smartphone 5G"].
    
    FORMATO DE RETORNO (JSON):
    {
      "titulo": "string",
      "descricao_curta": "string",
      "conteudo_html": "string (HTML)",
      "imagem_principal": "string",
      "preco_atual": "string",
      "preco_anterior": "string | null",
      "moeda": "string",
      "link_produto": "string",
      "path_from_root": ["Categoria", "Subcategoria", "Neto"],
      "palavras_chave_secundarias": ["array", "de", "strings"]
    }
  `;

  try {
    const result = await callGeminiProxy('extractProductData', prompt, {
      responseMimeType: "application/json"
    });
    const cleanedJson = cleanJson(result.text || "{}");
    const data = JSON.parse(cleanedJson);
    
    return {
      name: data.titulo || "Produto Mercado Livre",
      price: data.preco_atual || "0,00",
      originalPrice: data.preco_anterior || "",
      currency: data.moeda || "R$",
      installmentInfo: data.parcelamento || "",
      description: data.descricao_curta || "",
      longDescription: data.conteudo_html || "",
      imageUrl: data.imagem_principal || "",
      category: data.categoria || "Geral",
      subcategory: data.subcategoria || "Geral",
      tags: data.palavras_chave_secundarias || [],
      path_from_root: data.path_from_root || (data.categoria ? [data.categoria, data.subcategoria].filter(Boolean) : []),
      affiliateUrl: isUrl ? input : (data.link_produto || ""),
      productUrl: data.link_produto || "",
    };
  } catch (error: any) {
    throw new Error(`Erro na extração Gemini: ${error.message}`);
  }
};
