
import React, { useState } from 'react';
import { Filter, Code, Copy, Check, ExternalLink, Loader2, Sparkles, Plus, Trash2 } from 'lucide-react';
import { ProductData, WooCommerceConfig } from '@/types';
import { extractProductData } from '@/services/geminiService';

interface FilteredProductsTabProps {
  wooConfig: WooCommerceConfig;
  onImportSuccess: (product: ProductData, wooId?: string) => void;
}

const FilteredProductsTab: React.FC<FilteredProductsTabProps> = ({ wooConfig, onImportSuccess }) => {
  const [urls, setUrls] = useState<string[]>(['']);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [extractedProducts, setExtractedProducts] = useState<ProductData[]>([]);

  const addUrlField = () => setUrls([...urls, '']);
  const removeUrlField = (index: number) => setUrls(urls.filter((_, i) => i !== index));
  const updateUrl = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const handleProcess = async () => {
    const validUrls = urls.filter(u => u.trim() !== '');
    if (validUrls.length === 0) return;
    
    setIsLoading(true);
    setGeneratedCode('');
    setExtractedProducts([]);
    
    const products: ProductData[] = [];
    try {
      for (const url of validUrls) {
        const data = await extractProductData(url);
        products.push(data);
      }
      setExtractedProducts(products);
      
      // Generate a "reference code" (HTML snippet for a carousel)
      const carouselHtml = `
<!-- Carrossel de Produtos Filtrados -->
<div class="ml-carousel-container" style="display: flex; overflow-x: auto; gap: 16px; padding: 20px; background: #f5f5f5; border-radius: 12px; font-family: sans-serif;">
  ${products.map(p => `
  <div class="ml-product-card" style="flex: 0 0 240px; background: white; border-radius: 8px; padding: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); display: flex; flex-direction: column;">
    <div style="height: 180px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px;">
      <img src="${p.imageUrl}" alt="${p.name}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
    </div>
    <h3 style="font-size: 14px; color: #333; margin: 0 0 8px; height: 40px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${p.name}</h3>
    <div style="margin-top: auto;">
      <p style="font-size: 18px; font-weight: bold; color: #000; margin: 0 0 12px;">${p.currency} ${p.price}</p>
      <a href="${p.affiliateUrl}" target="_blank" style="display: block; background: #3483fa; color: white; text-align: center; padding: 8px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: bold;">Comprar Agora</a>
    </div>
  </div>
  `).join('')}
</div>
<style>
  .ml-carousel-container::-webkit-scrollbar { height: 6px; }
  .ml-carousel-container::-webkit-scrollbar-track { background: #eee; border-radius: 10px; }
  .ml-carousel-container::-webkit-scrollbar-thumb { background: #ccc; border-radius: 10px; }
</style>
      `;
      setGeneratedCode(carouselHtml.trim());
    } catch (error) {
      console.error("Erro ao processar links:", error);
      alert("Erro ao processar os links. Verifique se são links válidos do Mercado Livre.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Filter className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Produtos Filtrados</h2>
            <p className="text-sm text-slate-500">Gere códigos de referência para seus links de afiliado.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Links dos Produtos (Mercado Livre)
            </label>
            {urls.map((url, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => updateUrl(index, e.target.value)}
                  placeholder="Cole aqui o link do produto..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                {urls.length > 1 && (
                  <button
                    onClick={() => removeUrlField(index)}
                    className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
            
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={addUrlField}
                className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Adicionar mais um link
              </button>
              
              <button
                onClick={handleProcess}
                disabled={isLoading || urls.every(u => u.trim() === '')}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processando {urls.filter(u => u.trim() !== '').length} links...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Gerar Carrossel
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {generatedCode && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Code className="w-4 h-4 text-slate-400" />
                Código de Referência
              </h3>
              <button
                onClick={copyCode}
                className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copiado!' : 'Copiar Código'}
              </button>
            </div>
            <pre className="bg-slate-900 text-slate-300 p-4 rounded-xl text-xs overflow-x-auto font-mono leading-relaxed max-h-[400px]">
              {generatedCode}
            </pre>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Pré-visualização</h3>
            <div className="flex justify-center p-4 bg-slate-50 rounded-xl border border-slate-100 min-h-[300px] items-center">
              <div dangerouslySetInnerHTML={{ __html: generatedCode }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilteredProductsTab;
