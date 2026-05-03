
import { GoogleGenAI, Type } from "@google/genai";
import { ProductData } from "../types";
import { ML_CATEGORIES } from "../src/constants";

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

export const extractProductData = async (url: string): Promise<ProductData> => {
  // Se for uma URL do Mercado Livre, tenta o scraper dedicado primeiro
  let scrapedData: Partial<ProductData> | null = null;
  if (url.includes('mercadolivre.com') || url.includes('mlstatic.com')) {
    try {
      const response = await fetch(`/api/ml/product?url=${encodeURIComponent(url)}`);
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
    
    DADOS DO PRODUTO:
    Nome: ${scrapedData?.name || "Extrair da URL"}
    Preço: ${scrapedData?.price || "Extrair da URL"}
    Descrição Original: ${scrapedData?.description || "Extrair da URL"}
    URL: ${url}
    
    INSTRUÇÕES:
    1. Se os dados acima estiverem incompletos, extraia-os da URL.
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
      "subcategory": "Subcategoria"
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
          },
          required: ["name", "price", "imageUrl", "installmentInfo", "category", "subcategory", "longDescription"]
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
      affiliateUrl: url,
    };
  } catch (error) {
    console.error("Erro na extração Gemini:", error);
    throw new Error("Não foi possível processar os dados. Verifique o link e tente novamente.");
  }
};
