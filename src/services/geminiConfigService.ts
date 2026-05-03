
export interface GeminiConfig {
  provider: 'gemini' | 'openai';
  apiKey: string; // Gemini API Key
  model: string;  // Gemini Model
  openaiApiKey: string;
  openaiModel: string;
  systemPrompt?: string;
}

const STORAGE_KEY = 'hub_afiliados_gemini_config';

const DEFAULT_SYSTEM_PROMPT = `Você é um especialista em e-commerce, copywriting persuasivo e SEO estratégico.
Sua tarefa é gerar conteúdos de SEO altamente otimizados para um produto, baseando-se estritamente no nome, categoria e detalhes do anúncio.
Crie um conteúdo no estilo BLOG POST para a descrição, focado em conversão e benefícios.

INSTRUÇÕES:
1. "titulo": Crie um título SEO impactante entre 50-60 caracteres.
2. "descricao_curta": Gere um resumo persuasivo (máximo 160 caracteres) que destaque o principal benefício.
3. "conteudo_html": Gere uma descrição longa vendedora em HTML. Use títulos (h2, h3), listas e parágrafos persuasivos. Foque na autoridade do fabricante e nas dores/desejos do cliente.
4. "hierarquia": Identifique a trilha de navegação correta (ex: Tecnologia > Celulares > Smartphones).
5. "slug": Crie uma URL amigável.`;

export const getGeminiConfig = (): GeminiConfig => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const config = JSON.parse(stored);
      // Ensure we use a valid model name if empty
      if (!config.model) config.model = 'gemini-2.5-flash';
      if (!config.provider) config.provider = 'gemini';
      if (!config.openaiModel) config.openaiModel = 'gpt-4o-mini';
      if (!config.openaiApiKey) config.openaiApiKey = '';
      if (!config.systemPrompt) config.systemPrompt = DEFAULT_SYSTEM_PROMPT;
      // Auto-fill API key from env if not set in localStorage
      if (!config.apiKey && import.meta.env.VITE_GEMINI_API_KEY) {
        config.apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      }
      return config;
    } catch (e) {
      console.error('Failed to parse Gemini config', e);
    }
  }
  
  // Default values from environment variables if available
  return {
    provider: 'gemini',
    apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
    model: 'gemini-2.5-flash',
    openaiApiKey: '',
    openaiModel: 'gpt-4o-mini',
    systemPrompt: DEFAULT_SYSTEM_PROMPT
  };
};

export const saveGeminiConfig = (config: GeminiConfig) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
};
