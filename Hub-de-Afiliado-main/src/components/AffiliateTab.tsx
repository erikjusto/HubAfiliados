
import React, { useState } from 'react';
import { ProductData, WooCommerceConfig } from '@/types';
import { createWooProduct } from '@/services/wooService';
import ProductPreview from '@/components/ProductPreview';
import { extractProductData } from '@/services/geminiService';
import { 
  UserCheck, 
  Link as LinkIcon, 
  Search, 
  Loader2, 
  AlertTriangle, 
  Zap, 
  Camera, 
  Percent,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface AffiliateTabProps {
  onImportSuccess: (product: ProductData, id?: string) => void;
  wooConfig: WooCommerceConfig;
  prefilledUrl?: string;
  onClearPrefilled?: () => void;
}

const AffiliateTab: React.FC<AffiliateTabProps> = ({ 
  onImportSuccess, 
  wooConfig, 
  prefilledUrl, 
  onClearPrefilled 
}) => {
  const [url, setUrl] = useState(prefilledUrl || '');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ProductData | null>(null);

  // Handle prefilled URL
  React.useEffect(() => {
    if (prefilledUrl) {
      setUrl(prefilledUrl);
      // Optionally auto-extract if it's a new prefilled URL
      // handleExtract(new Event('submit') as any); 
    }
  }, [prefilledUrl]);

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setPreview(null);

    try {
      const data = await extractProductData(url);
      setPreview(data);
      if (onClearPrefilled) onClearPrefilled();
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao extrair os dados.");
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
      alert('Produto de afiliado importado com sucesso!');
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
              <UserCheck className="w-5 h-5 text-blue-600" />
              <h3 className="text-xl font-bold text-slate-800">Produto Afiliado (Perfil/Recomendações)</h3>
            </div>
            {!wooConfig.url && (
              <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded border border-red-100 animate-pulse">
                WooCommerce Desconectado
              </span>
            )}
          </div>
          <p className="text-slate-500 mb-6 max-w-2xl text-sm">
            Cole o link de afiliado, link de recomendações do Mercado Livre ou o código HTML do card do produto. O sistema irá extrair os dados automaticamente.
          </p>

          <form onSubmit={handleExtract} className="relative group">
            <div className="flex flex-col gap-3">
              <div className="flex-1 relative">
                <div className="absolute top-4 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600">
                  <LinkIcon className="w-5 h-5" />
                </div>
                <textarea
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Cole a URL do Mercado Livre ou o código HTML do produto..."
                  className="block w-full pl-11 pr-4 py-4 rounded-xl border-2 border-slate-100 focus:border-blue-400 focus:ring-0 outline-none transition-all placeholder:text-slate-300 text-slate-700 shadow-sm min-h-[60px] max-h-[200px] resize-y"
                  rows={url.includes('<') ? 5 : 1}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !url}
                className={`px-8 py-4 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap shadow-lg ${
                  loading || !url
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Extraindo...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Extrair Dados
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
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Dados Extraídos do Card</span>
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
            <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-3">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-slate-800 text-sm">Extração Poly-Card</h4>
            <p className="text-xs text-slate-500 mt-1">Captura dados de listas de recomendações.</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col items-center text-center">
            <div className="w-10 h-10 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-3">
              <Camera className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-slate-800 text-sm">Imagens do Card</h4>
            <p className="text-xs text-slate-500 mt-1">Pega a imagem principal do anúncio.</p>
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

export default AffiliateTab;
