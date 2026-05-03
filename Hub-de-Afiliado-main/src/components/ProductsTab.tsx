
import React, { useState } from 'react';
import { ImportRecord } from '@/types';
import { ML_CATEGORIES } from '@/constants';
import { generateLongDescription, generateTags } from '@/services/geminiService';
import { 
  PackageOpen, 
  Trash2, 
  ExternalLink, 
  Download,
  CheckCircle2,
  Pencil,
  Save,
  X,
  AlignLeft,
  Tag,
  Sparkles,
  Loader2,
  Search,
  Filter
} from 'lucide-react';

interface ProductsTabProps {
  history: ImportRecord[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, updatedData: Partial<ImportRecord>) => Promise<void>;
}

const ProductsTab: React.FC<ProductsTabProps> = ({ history, onDelete, onUpdate }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ImportRecord>>({});
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [isGeneratingTags, setIsGeneratingTags] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');

  const filteredHistory = history.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'Todas' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(history.map(item => item.category).filter(Boolean)));

  const startEditing = (product: ImportRecord) => {
    setEditingId(product.id);
    setEditForm({
      name: product.name,
      description: product.description,
      longDescription: product.longDescription || '',
      price: product.price,
      originalPrice: product.originalPrice,
      category: product.category,
      subcategory: product.subcategory,
      tags: product.tags || []
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEditing = async (id: string) => {
    setIsSaving(id);
    try {
      await onUpdate(id, editForm);
      setEditingId(null);
      setEditForm({});
    } catch (err) {
      console.error(err);
      alert("Falha ao salvar alterações no WooCommerce.");
    } finally {
      setIsSaving(null);
    }
  };

  const handleGenerateLongDescription = async (id: string) => {
    const product = history.find(p => p.id === id);
    if (!product) return;

    setIsGenerating(id);
    try {
      const longDesc = await generateLongDescription(editingId === id ? editForm : product);
      if (editingId === id) {
        setEditForm(prev => ({ ...prev, longDescription: longDesc }));
      } else {
        onUpdate(id, { longDescription: longDesc });
      }
    } catch (err) {
      console.error(err);
      alert("Falha ao gerar descrição longa.");
    } finally {
      setIsGenerating(null);
    }
  };

  const handleGenerateTags = async (id: string) => {
    const product = history.find(p => p.id === id);
    if (!product) return;

    setIsGeneratingTags(id);
    try {
      const tags = await generateTags(editingId === id ? editForm : product);
      if (editingId === id) {
        setEditForm(prev => ({ ...prev, tags: tags }));
      } else {
        onUpdate(id, { tags: tags });
      }
    } catch (err) {
      console.error(err);
      alert("Falha ao gerar tags.");
    } finally {
      setIsGeneratingTags(null);
    }
  };

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <PackageOpen className="w-10 h-10 opacity-20" />
        </div>
        <h3 className="text-lg font-medium">Nenhum produto encontrado</h3>
        <p className="text-sm mt-1">Comece extraindo alguns produtos na aba Explorar ou Afiliado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nome ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative min-w-[180px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Filter className="w-4 h-4" />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="Todas">Todas as Categorias</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {(searchTerm || selectedCategory !== 'Todas') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('Todas');
              }}
              className="p-2.5 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              title="Limpar Filtros"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          {filteredHistory.length} {filteredHistory.length === 1 ? 'Produto Encontrado' : 'Produtos Encontrados'}
          {history.length !== filteredHistory.length && ` (de ${history.length})`}
        </span>
        <button className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
          <Download className="w-3 h-3" />
          Exportar CSV
        </button>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <Search className="w-10 h-10 opacity-20" />
          </div>
          <h3 className="text-lg font-medium">Nenhum produto corresponde aos filtros</h3>
          <p className="text-sm mt-1">Tente ajustar sua busca ou categoria.</p>
          <button 
            onClick={() => { setSearchTerm(''); setSelectedCategory('Todas'); }}
            className="mt-4 text-blue-600 font-bold text-sm hover:underline"
          >
            Limpar todos os filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHistory.map((item) => {
          const isEditing = editingId === item.id;

          return (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col">
              <div className="h-48 bg-slate-50 border-b border-slate-100 flex items-center justify-center p-6 relative">
                <img src={item.imageUrl} alt={item.name} className="h-full object-contain group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  {!isEditing && (
                    <>
                      <button 
                        onClick={() => startEditing(item)}
                        className="w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-blue-500 shadow-sm border border-blue-50 transition-all hover:bg-blue-500 hover:text-white"
                        title="Editar Produto"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDelete(item.id)}
                        className="w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-red-500 shadow-sm border border-red-50 transition-all hover:bg-red-500 hover:text-white"
                        title="Excluir Produto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-50 px-2 py-0.5 rounded">
                      <CheckCircle2 className="w-2 h-2" />
                      Publicado
                    </span>
                    <span className="text-[10px] text-slate-400">{new Date(item.importedAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                  {isEditing && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => saveEditing(item.id)}
                        disabled={isSaving === item.id}
                        className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                        title="Salvar Alterações"
                      >
                        {isSaving === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={cancelEditing}
                        disabled={isSaving === item.id}
                        className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors disabled:opacity-50"
                        title="Cancelar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Nome do Produto</label>
                      <input 
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full text-sm font-bold text-slate-800 border-b-2 border-blue-400 outline-none bg-blue-50/30 px-2 py-1 rounded"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Preço Atual</label>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-slate-500">{item.currency}</span>
                          <input 
                            type="text"
                            value={editForm.price}
                            onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                            className="w-full text-sm font-bold text-slate-800 border-b-2 border-blue-400 outline-none bg-blue-50/30 px-2 py-1 rounded"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Preço Riscado</label>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-slate-500">{item.currency}</span>
                          <input 
                            type="text"
                            value={editForm.originalPrice || ''}
                            onChange={(e) => setEditForm({ ...editForm, originalPrice: e.target.value })}
                            className="w-full text-sm font-bold text-slate-800 border-b-2 border-blue-400 outline-none bg-blue-50/30 px-2 py-1 rounded"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Categoria</label>
                        <select 
                          value={editForm.category || ''}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value, subcategory: 'Geral' })}
                          className="w-full text-xs text-slate-600 border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-400 bg-white cursor-pointer"
                        >
                          <option value="Geral">Geral</option>
                          {Object.keys(ML_CATEGORIES).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Subcategoria</label>
                        <select 
                          value={editForm.subcategory || ''}
                          onChange={(e) => setEditForm({ ...editForm, subcategory: e.target.value })}
                          className="w-full text-xs text-slate-600 border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-400 bg-white cursor-pointer"
                        >
                          <option value="Geral">Geral</option>
                          {editForm.category && ML_CATEGORIES[editForm.category as keyof typeof ML_CATEGORIES] ? (
                            ML_CATEGORIES[editForm.category as keyof typeof ML_CATEGORIES].map(sub => (
                              <option key={sub} value={sub}>{sub}</option>
                            ))
                          ) : null}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block flex items-center justify-between">
                        <span>Tags (separadas por vírgula)</span>
                        <button
                          onClick={() => handleGenerateTags(item.id)}
                          disabled={isGeneratingTags === item.id}
                          className="text-[9px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 flex items-center gap-1 transition-all active:scale-95 disabled:opacity-50"
                        >
                          {isGeneratingTags === item.id ? (
                            <>
                              <Loader2 className="w-2 h-2 animate-spin" />
                              Gerando...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-2 h-2" />
                              Gerar por IA
                            </>
                          )}
                        </button>
                      </label>
                      <input 
                        type="text"
                        value={editForm.tags?.join(', ') || ''}
                        onChange={(e) => setEditForm({ ...editForm, tags: e.target.value.split(',').map(t => t.trim()).filter(t => t !== '') })}
                        className="w-full text-xs text-slate-600 border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-400 bg-white"
                        placeholder="tag1, tag2, tag3"
                      />
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Descrição Curta</label>
                        <textarea 
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          className="w-full text-xs text-slate-600 border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-400 h-20 resize-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-2 h-2 text-blue-400" /> Descrição Longa (HTML)
                          </span>
                          <button
                            onClick={() => handleGenerateLongDescription(item.id)}
                            disabled={isGenerating === item.id}
                            className="text-[9px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 flex items-center gap-1 transition-all active:scale-95 disabled:opacity-50"
                          >
                            {isGenerating === item.id ? (
                              <>
                                <Loader2 className="w-2 h-2 animate-spin" />
                                Gerando...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-2 h-2" />
                                Gerar com IA
                              </>
                            )}
                          </button>
                        </label>
                        <textarea 
                          value={editForm.longDescription}
                          onChange={(e) => setEditForm({ ...editForm, longDescription: e.target.value })}
                          className="w-full text-xs text-slate-600 border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-400 h-32 resize-none font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <h4 className="font-bold text-slate-800 line-clamp-2 leading-snug">{item.name}</h4>
                    
                    <div className="flex flex-wrap gap-2">
                      {item.category && (
                        <span className="flex items-center gap-1 text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase">
                          <Tag className="w-2 h-2" />
                          {item.category}
                        </span>
                      )}
                      {item.subcategory && (
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded uppercase border border-slate-100">
                          {item.subcategory}
                        </span>
                      )}
                      {item.tags && item.tags.length > 0 && item.tags.map((tag, idx) => (
                        <span key={idx} className="text-[9px] font-bold text-blue-400 bg-blue-50 px-2 py-0.5 rounded uppercase border border-blue-100">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                            <AlignLeft className="w-3 h-3" /> Descrição Curta
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          {item.description || "Sem descrição."}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                            <Sparkles className="w-3 h-3 text-blue-400" /> Descrição SEO
                          </div>
                          {!item.longDescription && (
                            <button
                              onClick={() => handleGenerateLongDescription(item.id)}
                              disabled={isGenerating === item.id}
                              className="text-[9px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 disabled:opacity-50"
                            >
                              {isGenerating === item.id ? (
                                <Loader2 className="w-2 h-2 animate-spin" />
                              ) : (
                                <Sparkles className="w-2 h-2" />
                              )}
                              Gerar
                            </button>
                          )}
                        </div>
                        {item.longDescription ? (
                          <div 
                            className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed opacity-80 italic"
                            dangerouslySetInnerHTML={{ __html: item.longDescription.substring(0, 100) + '...' }}
                          />
                        ) : (
                          <p className="text-[10px] text-slate-400 italic">Ainda não gerada.</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-auto pt-2 flex items-center justify-between">
                      <div className="flex flex-col">
                        {item.originalPrice && (
                          <span className="text-[10px] font-bold text-slate-400 line-through">
                            {item.currency} {item.originalPrice}
                          </span>
                        )}
                        <span className="text-xl font-black text-slate-900">{item.currency} {item.price}</span>
                      </div>
                      <div className="flex gap-1">
                        <a 
                          href={item.affiliateUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                          title="Ver no Mercado Livre"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};

export default ProductsTab;
