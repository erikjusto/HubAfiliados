
import { GoogleGenAI, Type } from "@google/genai";
import { ProductData } from "@/types";
import { ML_CATEGORIES } from "@/constants";

export const generateLongDescription = async (product: Partial<ProductData>): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Aja como um especialista em COPYWRITING e SEO para E-commerce.
    
    GERE uma DESCRIÇÃO LONGA em HTML com técnicas de SEO para o seguinte produto:
    Nome: ${product.name}
    Preço: ${product.price}
    Descrição Curta: ${product.description}
    
    INSTRUÇÕES:
    - Use H2, H3, listas (ul/li), negrito (strong).
    - Foco em benefícios, dor do cliente e solução.
    - O texto deve ser ALTAMENTE PERSUASIVO, direto ao ponto e NÃO precisa ser longo (priorize qualidade e impacto sobre quantidade).
    - Não use tags <html> ou <body>.
    
    Retorne apenas o HTML da descrição.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "";
  } catch (error) {
    console.error("Erro ao gerar descrição longa:", error);
    throw new Error("Não foi possível gerar a descrição longa.");
  }
};

export const generateTags = async (product: Partial<ProductData>): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
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
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Erro ao gerar tags:", error);
    return [];
  }
};

export const extractProductData = async (input: string): Promise<ProductData> => {
  // Se for uma URL do Mercado Livre, tenta o scraper dedicado primeiro
  let scrapedData: Partial<ProductData> | null = null;
  const isUrl = input.trim().startsWith('http://') || input.trim().startsWith('https://');

  if (isUrl && (input.includes('mercadolivre.com') || input.includes('mlstatic.com'))) {
    try {
      const response = await fetch(`/api/ml/product?url=${encodeURIComponent(input)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.imageUrl && data.name) {
          scrapedData = data;
        }
      }
    } catch (err) {
      console.warn('Dedicated ML scraper failed, falling back to Gemini:', err);
    }
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Aja como um especialista em COPYWRITING e SEO para E-commerce.
    
    DADOS DO PRODUTO (Pode ser uma URL, HTML ou texto):
    ${isUrl ? `URL: ${input}` : `Conteúdo HTML/Texto:\n${input}`}
    
    DADOS EXTRAÍDOS PREVIAMENTE (se houver):
    Nome: ${scrapedData?.name || "N/A"}
    Preço: ${scrapedData?.price || "N/A"}
    Descrição Original: ${scrapedData?.description || "N/A"}
    
    INSTRUÇÕES:
    1. Extraia os dados do produto a partir do conteúdo/URL fornecido.
       - Se for HTML, procure por tags de imagem (<img>), título (<h2>, <h1>), preço (<strong>, <span>) e links de afiliado (<a>).
       - O "affiliateUrl" deve ser o link de afiliado extraído do HTML (procure por links longos com parâmetros de rastreio ou texto como "Link Afiliado"). Se a entrada for uma URL, use a própria URL.
    2. Gere uma DESCRIÇÃO CURTA (campo "description") profissional e concisa.
    3. Gere uma DESCRIÇÃO LONGA (campo "longDescription") em HTML com técnicas de SEO.
       - Use H2, H3, listas (ul/li), negrito (strong).
       - Foco em benefícios, dor do cliente e solução.
       - O texto deve ser ALTAMENTE PERSUASIVO, direto ao ponto e NÃO precisa ser longo (priorize qualidade e impacto sobre quantidade).
       - Não use tags <html> ou <body>.
    
    CATEGORIAS DISPONÍVEIS:
    ${JSON.stringify(ML_CATEGORIES, null, 2)}
    
    Retorne estritamente este JSON:
    {
      "name": "Título do Produto",
      "price": "VALOR (ex: 1.299,90)",
      "originalPrice": "VALOR_RISCADO ou vazio",
      "currency": "R$",
      "installmentInfo": "Parcelamento",
      "description": "Descrição curta",
      "longDescription": "HTML SEO longo",
      "imageUrl": "URL da imagem HD",
      "category": "Categoria",
      "subcategory": "Subcategoria",
      "tags": ["tag1", "tag2", "tag3"],
      "affiliateUrl": "URL de afiliado extraída ou a URL original"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            price: { type: Type.STRING },
            originalPrice: { type: Type.STRING },
            currency: { type: Type.STRING },
            installmentInfo: { type: Type.STRING },
            description: { type: Type.STRING },
            longDescription: { type: Type.STRING },
            imageUrl: { type: Type.STRING },
            category: { type: Type.STRING },
            subcategory: { type: Type.STRING },
            tags: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            affiliateUrl: { type: Type.STRING }
          },
          required: ["name", "price", "imageUrl", "installmentInfo", "category", "subcategory", "longDescription", "tags", "affiliateUrl"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    
    return {
      name: data.name || "Produto Mercado Livre",
      price: data.price || "0,00",
      originalPrice: data.originalPrice || "",
      currency: data.currency || "R$",
      installmentInfo: data.installmentInfo || "",
      description: data.description || "Descrição não extraída.",
      longDescription: data.longDescription || "",
      imageUrl: data.imageUrl || "",
      category: data.category || "Geral",
      subcategory: data.subcategory || "Geral",
      tags: data.tags || [],
      affiliateUrl: data.affiliateUrl || (isUrl ? input : ""),
    };
  } catch (error) {
    console.error("Erro na extração Gemini:", error);
    throw new Error("Não foi possível processar os dados. Verifique o link ou HTML e tente novamente.");
  }
};
