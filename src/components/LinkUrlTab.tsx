import React, { useState, useEffect, useRef } from 'react';
import { ProductData, WooCommerceConfig } from '@/types';
import { createWooProduct } from '@/services/wooService';
import { generateSeoContent } from '@/services/geminiService';
import ProductPreview from '@/components/ProductPreview';
import { 
  Link as LinkIcon, 
  Search, 
  Loader2, 
  AlertTriangle, 
  Zap, 
  Globe,
  Brain,
  Activity,
  X,
  Sparkles
} from 'lucide-react';

interface LinkUrlTabProps {
  onImportSuccess: (product: ProductData, id?: string) => void;
  wooConfig: WooCommerceConfig;
}

const LinkUrlTab: React.FC<LinkUrlTabProps> = ({ 
  onImportSuccess, 
  wooConfig
}) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ProductData | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSelectorOpen, setAiSelectorOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleGenerateAiWithProvider = async (provider: 'gemini' | 'openai') => {
    if (!preview) return;
    setAiLoading(true);
    setAiSelectorOpen(false);
    setError(null);
    try {
      const seoData = await generateSeoContent(
        preview.name, 
        preview.category || 'Geral', 
        preview.affiliateUrl,
        "Donos de pets (cachorros e gatos)",
        { provider }
      );
      
      const newTags = [seoData.palavra_chave_principal];
      if (Array.isArray(seoData.palavras_chave_secundarias)) {
         newTags.push(...seoData.palavras_chave_secundarias);
      }

      setPreview(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          name: seoData.titulo || prev.name,
          description: seoData.descricao_curta || prev.description,
          longDescription: seoData.conteudo_html || prev.longDescription,
          tags: newTags.length > 0 ? newTags : prev.tags,
          path_from_root: seoData.hierarquia || prev.path_from_root
        };
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar conteúdo de IA');
    } finally {
      setAiLoading(false);
    }
  };

  const fetchProductData = async (targetUrl: string) => {
    if (!targetUrl.trim()) return;

    setLoading(true);
    setError(null);
    setPreview(null);

    try {
      // Use the backend scraper which now has the updated logic for categories
      const response = await fetch(`/api/ml/import-url?url=${encodeURIComponent(targetUrl)}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Não foi possível acessar a URL. O Mercado Livre pode ter bloqueado o acesso.");
      }
      
      const productData: ProductData = await response.json();
      
      if (!productData.name || productData.name.length < 3) {
        throw new Error('Não foi possível encontrar o título do produto na página.');
      }

      setPreview(productData);
    } catch (err: any) {
      setError(err.message || "Erro ao processar a URL.");
    } finally {
      setLoading(false);
    }
  };

  const handleImportUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    fetchProductData(url);
  };

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (url.trim() && url.includes('http')) {
      timeoutRef.current = setTimeout(() => {
        fetchProductData(url);
      }, 2000);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [url]);

  const handleSaveToWoo = async (updatedData: ProductData) => {
    if (!updatedData) return;

    if (!wooConfig.url || !wooConfig.consumerKey) {
      setError("Por favor, configure as credenciais do WooCommerce primeiro.");
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const result = await createWooProduct(wooConfig, updatedData);
      onImportSuccess(updatedData, result.id.toString());
      setPreview(null);
      setUrl('');
      alert('Produto importado com sucesso!');
    } catch (err: any) {
      setError(`Erro no WooCommerce: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-md">
        <div className="p-6 md:p-8 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              <h3 className="text-xl font-bold text-slate-800">Importar por URL</h3>
            </div>
            {!wooConfig.url && (
              <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded border border-red-100 animate-pulse">
                WooCommerce Desconectado
              </span>
            )}
          </div>
          <p className="text-slate-500 mb-6 max-w-2xl text-sm">
            Cole o link do Mercado Livre (curto ou longo). O sistema irá acessar a página automaticamente e extrair todas as informações, incluindo categoria e subcategoria.
          </p>

          <form onSubmit={handleImportUrl} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Link de Afiliado</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <LinkIcon className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://meli.la/... ou https://www.mercadolivre.com.br/..."
                  className="block w-full pl-11 pr-4 py-3 rounded-xl border-2 border-slate-100 focus:border-blue-400 focus:ring-0 outline-none transition-all placeholder:text-slate-300 text-slate-700 shadow-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !url}
              className={`w-full py-4 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg ${
                loading || !url
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Extrair Dados Automaticamente
                </>
              )}
            </button>
          </form>
        </div>

        {error && (
          <div className="mx-6 mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center gap-3 animate-in fade-in duration-300">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}
      </div>

      {preview && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Dados Extraídos Automaticamente</span>
            </div>
            <button
              onClick={() => setAiSelectorOpen(true)}
              disabled={aiLoading}
              className="flex items-center gap-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-4 py-2 rounded-lg shadow-sm transition-all disabled:opacity-50"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gerando Conteúdo SEO (IA)...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Gerar Conteúdo SEO (IA)
                </>
              )}
            </button>
          </div>
          <ProductPreview 
            data={preview} 
            loading={importing}
            onImport={handleSaveToWoo} 
            onCancel={() => setPreview(null)} 
          />
        </div>
      )}

      {/* AI PROVIDER SELECTOR MODAL */}
      {aiSelectorOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                  <Sparkles size={16} />
                </div>
                <h3 className="font-black text-slate-800 tracking-tight">Escolha a Inteligência</h3>
              </div>
              <button 
                onClick={() => setAiSelectorOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-3">
              <p className="text-xs text-slate-500 font-medium mb-4 leading-relaxed text-center">
                Selecione qual provedor você deseja usar para gerar este conteúdo agora:
              </p>
              
              <button 
                onClick={() => handleGenerateAiWithProvider('gemini')}
                className="w-full p-4 rounded-2xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50/50 flex items-center gap-4 transition-all group"
              >
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100 group-hover:scale-110 transition-transform">
                  <Brain size={20} />
                </div>
                <div className="text-left">
                  <p className="font-black text-slate-800 text-sm">Google Gemini</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Rápido e Criativo</p>
                </div>
              </button>

              <button 
                onClick={() => handleGenerateAiWithProvider('openai')}
                className="w-full p-4 rounded-2xl border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50/50 flex items-center gap-4 transition-all group"
              >
                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-100 group-hover:scale-110 transition-transform">
                  <Zap size={20} />
                </div>
                <div className="text-left">
                  <p className="font-black text-slate-800 text-sm">OpenAI GPT</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Preciso e Robusto</p>
                </div>
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LinkUrlTab;
