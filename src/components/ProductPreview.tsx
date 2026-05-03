
import React, { useState, useEffect } from 'react';
import { ProductData } from '@/types';
import { normalizePrice } from '@/services/wooService';
import { ML_CATEGORIES } from '@/constants';
import { generateLongDescription, generateTags, generateShortDescription } from '@/services/geminiService';
import { 
  Image as ImageIcon, 
  Copy, 
  Check, 
  X, 
  AlignLeft, 
  ExternalLink, 
  CloudUpload, 
  Pencil,
  Loader2,
  Sparkles,
  Link as LinkIcon,
  ChevronRight
} from 'lucide-react';

interface ProductPreviewProps {
  data: ProductData;
  loading?: boolean;
  onImport: (updatedData: ProductData) => void;
  onCancel: () => void;
}

const ProductPreview: React.FC<ProductPreviewProps> = ({ data, loading, onImport, onCancel }) => {
  const [imageError, setImageError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editedData, setEditedData] = useState<ProductData>(data);
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [isGeneratingShortDesc, setIsGeneratingShortDesc] = useState(false);
  
  // Auto-copy image URL when preview opens
  useEffect(() => {
    if (data.imageUrl) {
      navigator.clipboard.writeText(data.imageUrl).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setEditedData(data);
  }, [data]);

  const decimalPrice = normalizePrice(editedData.price);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateLongDescription = async () => {
    setIsGenerating(true);
    try {
      const longDesc = await generateLongDescription(editedData);
      setEditedData(prev => ({ ...prev, longDescription: longDesc }));
    } catch (err) {
      console.error(err);
      alert("Falha ao gerar descrição longa.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateTags = async () => {
    setIsGeneratingTags(true);
    try {
      const tags = await generateTags(editedData);
      setEditedData(prev => ({ ...prev, tags: tags }));
    } catch (err) {
      console.error(err);
      alert("Falha ao gerar tags.");
    } finally {
      setIsGeneratingTags(false);
    }
  };

  const handleGenerateShortDescription = async () => {
    setIsGeneratingShortDesc(true);
    try {
      const shortDesc = await generateShortDescription(editedData);
      setEditedData(prev => ({ ...prev, description: shortDesc }));
    } catch (err) {
      console.error(err);
      alert("Falha ao gerar descrição curta.");
    } finally {
      setIsGeneratingShortDesc(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row h-full">
        {/* Galeria de Imagens com Fallback */}
        <div className="md:w-2/5 p-6 bg-slate-50 border-r border-slate-100 flex flex-col items-center">
          <div className="relative group w-full aspect-square rounded-xl overflow-hidden shadow-inner bg-white border border-slate-200 flex items-center justify-center mb-6">
            {data.imageUrl && !imageError ? (
              <img 
                src={data.imageUrl} 
                alt={data.name} 
                loading="lazy"
                onError={() => setImageError(true)}
                className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex flex-col items-center text-slate-300 p-8 text-center">
                <ImageIcon className="w-16 h-16 mb-4" />
                <span className="text-xs font-bold uppercase tracking-tighter">Imagem em HD não pôde ser carregada</span>
              </div>
            )}
            <div className="absolute top-4 right-4 bg-yellow-400 text-slate-900 text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase">
              Alta Resolução
            </div>
          </div>

          {/* URL da Imagem - Visualização Técnica */}
          <div className="w-full space-y-2">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">URL da Imagem Capturada</h4>
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-3 shadow-sm group/url">
              <div className="flex-1 overflow-hidden">
                <p className="text-[10px] text-blue-600 truncate font-mono select-all">
                  {data.imageUrl || "URL não encontrada"}
                </p>
              </div>
              <button 
                onClick={() => copyToClipboard(data.imageUrl)}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-50 text-slate-400 hover:text-blue-500 transition-all hover:bg-blue-50"
                title="Copiar URL da Imagem"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Detalhes do Conteúdo */}
        <div className="md:w-3/5 p-6 md:p-8 flex flex-col">
          <div className="mb-6">
            <div className="flex items-start justify-between gap-4 mb-2">
              <textarea
                value={editedData.name}
                onChange={(e) => setEditedData({ ...editedData, name: e.target.value })}
                className="text-2xl font-bold text-slate-800 leading-tight w-full border border-transparent hover:border-slate-200 focus:border-blue-400 focus:bg-blue-50/30 outline-none px-2 py-1.5 rounded resize-none transition-all"
                rows={2}
                title="Editar nome do produto"
              />
              <button 
                onClick={onCancel}
                disabled={loading}
                className="text-slate-300 hover:text-red-500 transition-colors shrink-0 disabled:opacity-30 p-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 mt-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Preço Extraído</span>
                <div className="flex flex-col">
                  {editedData.originalPrice && (
                    <span className="text-sm font-bold text-slate-400 line-through decoration-red-400/50 decoration-2">
                      {editedData.currency} {editedData.originalPrice}
                    </span>
                  )}
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xl font-black text-slate-900">{editedData.currency}</span>
                      <input
                        type="text"
                        value={editedData.price}
                        onChange={(e) => setEditedData({ ...editedData, price: e.target.value })}
                        className="text-xl font-black text-slate-900 tracking-tight border-b-2 border-blue-400 outline-none bg-blue-50/50 px-2 py-1 rounded w-32"
                      />
                    </div>
                  ) : (
                    <span className="text-3xl font-black text-slate-900 tracking-tight">
                      {editedData.currency} {editedData.price}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="h-10 w-[1px] bg-slate-200 hidden sm:block"></div>

              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-blue-400 uppercase">Valor para o WooCommerce</span>
                <span className="text-xl font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
                  {decimalPrice}
                </span>

              </div>
            </div>
          </div>

          {/* URL Longa / Link de Afiliado */}
          <div className="mb-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Link de Afiliado (URL Longa)</span>
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-2 shadow-sm focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
              <div className="text-slate-400 pl-2">
                <LinkIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={editedData.affiliateUrl}
                onChange={(e) => setEditedData({ ...editedData, affiliateUrl: e.target.value })}
                className="w-full text-sm text-slate-700 outline-none px-2 py-1 bg-transparent"
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Link da Página do Produto */}
          <div className="mb-6">
            <span className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Link da Página do Produto</span>
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-2 shadow-sm focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
              <div className="text-slate-400 pl-2">
                <ExternalLink className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={editedData.productUrl || ''}
                onChange={(e) => setEditedData({ ...editedData, productUrl: e.target.value })}
                className="w-full text-sm text-slate-700 outline-none px-2 py-1 bg-transparent"
                placeholder="https://www.mercadolivre.com.br/..."
              />
            </div>
          </div>

          {/* Hierarquia de Categorias (Mercado Livre) */}
          {((editedData.path_from_root && editedData.path_from_root.length > 0) || editedData.category) && (
            <div className="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-inner">
              <span className="text-[10px] font-bold text-slate-400 uppercase mb-2 block tracking-widest">Estrutura de Categorias (Mercado Livre)</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {(editedData.path_from_root?.length ? editedData.path_from_root : [editedData.category, editedData.subcategory, editedData.segment].filter(Boolean)).map((cat, idx, arr) => (
                  <React.Fragment key={idx}>
                    <span className="text-[11px] font-black text-slate-700 bg-white px-2 py-1 rounded-md border border-slate-100 shadow-sm">{cat}</span>
                    {idx < arr.length - 1 && (
                      <ChevronRight className="w-3 h-3 text-slate-300" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* Categorias */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Categoria</span>
              <select
                value={editedData.category || ''}
                onChange={(e) => setEditedData({ ...editedData, category: e.target.value, subcategory: 'Geral' })}
                className="text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:border-blue-400 outline-none transition-all cursor-pointer"
              >
                <option value="Geral">Geral</option>
                {Object.keys(ML_CATEGORIES).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Subcategoria</span>
              <select
                value={editedData.subcategory || ''}
                onChange={(e) => setEditedData({ ...editedData, subcategory: e.target.value })}
                className="text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:border-blue-400 outline-none transition-all cursor-pointer"
              >
                <option value="Geral">Geral</option>
                {editedData.category && ML_CATEGORIES[editedData.category as keyof typeof ML_CATEGORIES] ? (
                  ML_CATEGORIES[editedData.category as keyof typeof ML_CATEGORIES].map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))
                ) : null}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Tags (WooCommerce)</span>
            </div>
            {isEditing ? (
              <input
                type="text"
                value={editedData.tags?.join(', ') || ''}
                onChange={(e) => setEditedData({ ...editedData, tags: e.target.value.split(',').map(t => t.trim()).filter(t => t !== '') })}
                placeholder="tag1, tag2, tag3"
                className="w-full text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:border-blue-400 outline-none transition-all"
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {editedData.tags && editedData.tags.length > 0 ? (
                  editedData.tags.map((tag, idx) => (
                    <span key={idx} className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-md border border-slate-200">
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">Nenhuma tag extraída.</span>
                )}
              </div>
            )}
          </div>

          <div className="mb-6 flex-1 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <AlignLeft className="w-4 h-4 text-yellow-400" /> Descrição Curta (WooCommerce)
                </h4>
              </div>
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 h-32 overflow-y-auto">
                {isEditing ? (
                  <textarea
                    value={editedData.description}
                    onChange={(e) => setEditedData({ ...editedData, description: e.target.value })}
                    className="w-full h-full text-slate-600 text-sm leading-relaxed whitespace-pre-wrap outline-none bg-transparent"
                  />
                ) : (
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                    {editedData.description || "Nenhuma descrição técnica extraída."}
                  </p>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" /> Descrição Longa SEO (HTML)
                </h4>
              </div>
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 h-64 overflow-y-auto">
                {isEditing ? (
                  <textarea
                    value={editedData.longDescription}
                    onChange={(e) => setEditedData({ ...editedData, longDescription: e.target.value })}
                    className="w-full h-full text-slate-600 text-sm font-mono leading-relaxed whitespace-pre-wrap outline-none bg-transparent"
                    placeholder="Texto longo em HTML gerado automaticamente..."
                  />
                ) : (
                  <div 
                    className="text-slate-600 text-sm leading-relaxed prose prose-slate max-w-none"
                    dangerouslySetInnerHTML={{ __html: editedData.longDescription || "Aguardando geração do texto SEO..." }}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-slate-100 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                Produto pronto para sincronização
              </span>
              <a href={editedData.affiliateUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 font-bold flex items-center gap-1">
                Ver original <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => onImport(editedData)}
                disabled={loading}
                className={`flex-[2] text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg active:scale-[0.98] ${
                  loading ? 'bg-slate-400 shadow-none cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/20'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <CloudUpload className="w-5 h-5" />
                    Sincronizar com WooCommerce
                  </>
                )}
              </button>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className={`flex-1 font-bold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${
                  isEditing ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                title="Revisar Dados"
              >
                {isEditing ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                <span className="hidden sm:inline">{isEditing ? 'Salvar' : 'Editar'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPreview;
