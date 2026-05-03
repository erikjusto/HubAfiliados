import React, { useState } from 'react';
import { ProductData, WooCommerceConfig } from '@/types';
import { createWooProduct } from '@/services/wooService';
import ProductPreview from '@/components/ProductPreview';
import { fetchAndParseMLProduct } from '@/services/mlScraperService';
import { 
  Link as LinkIcon, 
  Search, 
  Loader2, 
  AlertTriangle, 
  Zap, 
  Camera, 
  Percent,
  Sparkles
} from 'lucide-react';

interface LinkProductTabProps {
  onImportSuccess: (product: ProductData, id?: string) => void;
  wooConfig: WooCommerceConfig;
}

const LinkProductTab: React.FC<LinkProductTabProps> = ({ 
  onImportSuccess, 
  wooConfig
}) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ProductData | null>(null);

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setPreview(null);

    try {
      // Tenta o scraper primeiro
      const data = await fetchAndParseMLProduct(url);
      setPreview(data);
    } catch (err: any) {
      console.warn("Scraper failed, falling back to Gemini extraction:", err);
      try {
        // Fallback para o Gemini
        const { extractProductData } = await import('@/services/geminiService');
        const geminiData = await extractProductData(url);
        
        // Se o Gemini também não conseguir o nome, lançamos erro
        if (!geminiData.name || geminiData.name === "Produto Mercado Livre" || geminiData.name === "Extrair da URL") {
           throw new Error("Não foi possível extrair os dados. O Mercado Livre pode ter bloqueado o acesso ou o link é inválido.");
        }
        
        setPreview(geminiData);
      } catch (geminiErr: any) {
        setError(geminiErr.message || "Ocorreu um erro ao extrair os dados. O Mercado Livre pode ter bloqueado o acesso.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (updatedData: ProductData) => {
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
        <div className="p-6 md:p-8 bg-gradient-to-r from-indigo-50 to-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-indigo-600" />
              <h3 className="text-xl font-bold text-slate-800">Link Produto (Afiliado)</h3>
            </div>
            {!wooConfig.url && (
              <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded border border-red-100 animate-pulse">
                WooCommerce Desconectado
              </span>
            )}
          </div>
          <p className="text-slate-500 mb-6 max-w-2xl text-sm">
            Insira o link de afiliado (ex: https://meli.la/1yAZodK). O sistema irá buscar os dados do produto diretamente no código da página (como título, preço normal e riscado, tags, imagem, etc).
          </p>

          <form onSubmit={handleExtract} className="relative group">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600">
                  <LinkIcon className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://meli.la/..."
                  className="block w-full pl-11 pr-4 py-4 rounded-xl border-2 border-slate-100 focus:border-indigo-400 focus:ring-0 outline-none transition-all placeholder:text-slate-300 text-slate-700 shadow-sm"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !url}
                className={`px-8 py-4 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap shadow-lg ${
                  loading || !url
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Buscar Dados
                  </>
                )}
              </button>
            </div>
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
          <div className="flex items-center gap-2 px-2">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Dados Extraídos do Link</span>
          </div>
          <ProductPreview 
            data={preview} 
            loading={importing}
            onImport={handleImport} 
            onCancel={() => setPreview(null)} 
          />
        </div>
      )}

      {!preview && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 opacity-60">
          <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col items-center text-center">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-3">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-slate-800 text-sm">Extração Direta</h4>
            <p className="text-xs text-slate-500 mt-1">Lê o código HTML do link fornecido.</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col items-center text-center">
            <div className="w-10 h-10 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-3">
              <Camera className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-slate-800 text-sm">Imagens e Tags</h4>
            <p className="text-xs text-slate-500 mt-1">Pega a imagem principal e tags como RECOMENDADO.</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col items-center text-center">
            <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center mb-3">
              <Percent className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-slate-800 text-sm">Preços e Descontos</h4>
            <p className="text-xs text-slate-500 mt-1">Identifica o preço riscado e o atual.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LinkProductTab;
