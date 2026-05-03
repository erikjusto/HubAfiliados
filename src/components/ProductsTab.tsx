
import React, { useState } from 'react';
import { ImportRecord } from '@/types';
import { ML_CATEGORIES } from '@/constants';
import { generateLongDescription, generateTags, generateShortDescription, generateSeoContent } from '@/services/geminiService';
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
  Filter,
  RefreshCw,
  AlertTriangle,
  LayoutGrid,
  List,
  ChevronRight,
  Brain,
  Zap,
  Activity
} from 'lucide-react';

interface ProductsTabProps {
  history: ImportRecord[];
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, updatedData: Partial<ImportRecord>) => Promise<void>;
}

const ProductsTab: React.FC<ProductsTabProps> = ({ history, onDelete, onUpdate }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<Partial<ImportRecord>>({});
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [isGeneratingTags, setIsGeneratingTags] = useState<string | null>(null);
  const [isGeneratingShortDesc, setIsGeneratingShortDesc] = useState<string | null>(null);
  const [isGeneratingSEO, setIsGeneratingSEO] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [isUpdatingPrice, setIsUpdatingPrice] = useState<string | null>(null);
  const [isFetchingCategories, setIsFetchingCategories] = useState<string | null>(null);
  const [isBulkUpdating, setIsBulkUpdating] = useState<boolean>(false);
  const [bulkUpdateProgress, setBulkUpdateProgress] = useState<{ current: number, total: number } | null>(null);
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);
  const [missingProduct, setMissingProduct] = useState<ImportRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [bulkEditForm, setBulkEditForm] = useState<{category?: string, subcategory?: string, tags?: string}>({});
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [aiSelector, setAiSelector] = useState<{
    isOpen: boolean;
    productId: string | null;
    type: 'seo' | 'short' | 'long' | 'tags';
  }>({ isOpen: false, productId: null, type: 'seo' });

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
      productUrl: product.productUrl || '',
      category: product.category,
      subcategory: product.subcategory,
      tags: product.tags || [],
      path_from_root: product.path_from_root || []
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
      const productToProcess = editingId === id ? editForm : product;
      const [tags, shortDesc] = await Promise.all([
        generateTags(productToProcess),
        generateShortDescription(productToProcess)
      ]);

      if (editingId === id) {
        setEditForm(prev => ({ 
          ...prev, 
          tags: tags,
          description: shortDesc || prev.description 
        }));
      } else {
        onUpdate(id, { 
          tags: tags,
          description: shortDesc || product.description
        });
      }
    } catch (err) {
      console.error(err);
      alert("Falha ao gerar tags e descrição curta.");
    } finally {
      setIsGeneratingTags(null);
    }
  };

  const handleGenerateShortDescription = async (id: string) => {
    const product = history.find(p => p.id === id);
    if (!product) return;

    setIsGeneratingShortDesc(id);
    try {
      const productToProcess = editingId === id ? editForm : product;
      const shortDesc = await generateShortDescription(productToProcess);

      if (editingId === id) {
        setEditForm(prev => ({ 
          ...prev, 
          description: shortDesc || prev.description 
        }));
      } else {
        onUpdate(id, { 
          description: shortDesc || product.description
        });
      }
    } catch (err) {
      console.error(err);
      alert("Falha ao gerar descrição curta.");
    } finally {
      setIsGeneratingShortDesc(null);
    }
  };

  const handleGenerateSeoWithProvider = async (id: string, provider: 'gemini' | 'openai') => {
    const product = history.find(p => p.id === id);
    if (!product) return;

    setIsGeneratingSEO(id);
    setAiSelector({ ...aiSelector, isOpen: false });
    
    try {
      const productToProcess = editingId === id ? editForm : product;
      const seoData = await generateSeoContent(
        productToProcess.name || '',
        productToProcess.category || 'Geral',
        productToProcess.affiliateUrl || '',
        "Donos de pets (cachorros e gatos)", // Default publico
        { provider }
      );

      const newTags = [seoData.palavra_chave_principal];
      if (Array.isArray(seoData.palavras_chave_secundarias)) {
        newTags.push(...seoData.palavras_chave_secundarias);
      }

      if (editingId === id) {
        setEditForm(prev => ({
          ...prev,
          name: seoData.titulo || prev.name,
          description: seoData.descricao_curta || prev.description,
          longDescription: seoData.conteudo_html || prev.longDescription,
          tags: newTags.length > 0 ? newTags : prev.tags,
          path_from_root: seoData.hierarquia || prev.path_from_root
        }));
      } else {
        onUpdate(id, {
          name: seoData.titulo || product.name,
          description: seoData.descricao_curta || product.description,
          longDescription: seoData.conteudo_html || product.longDescription,
          tags: newTags.length > 0 ? newTags : product.tags,
          path_from_root: seoData.hierarquia || product.path_from_root
        });
      }
    } catch (err) {
      console.error(err);
      alert("Falha ao gerar conteúdo SEO.");
    } finally {
      setIsGeneratingSEO(null);
    }
  };

  const handleFetchCategoryFromML = async (id: string, url: string) => {
    if (!url) {
      alert('URL do produto inválida.');
      return;
    }
    setIsFetchingCategories(id);
    try {
      const response = await fetch(`/api/ml/import-url?url=${encodeURIComponent(url)}`);
      if (!response.ok) {
        throw new Error('Falha ao buscar dados do ML');
      }
      const json = await response.json();
      if (json.path_from_root) {
        setEditForm(prev => ({
          ...prev,
          path_from_root: json.path_from_root
        }));
      } else {
        alert('Não foi possível encontrar uma estrutura de categorias para este produto no Mercado Livre.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao buscar categorias do Mercado Livre.');
    } finally {
      setIsFetchingCategories(null);
    }
  };

  const handleUpdatePrice = async (id: string, silent: boolean = false) => {
    const product = history.find(p => p.id === id);
    if (!product || !product.affiliateUrl) return { success: false };

    setIsUpdatingPrice(id); // Always show spinner
    try {
      // Scroll to the product being updated
      const element = document.getElementById(`product-card-${id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      const response = await fetch(`/api/ml/product?url=${encodeURIComponent(product.affiliateUrl)}`);
      
      if (response.status === 404 || response.status === 500) {
        if (silent) {
          setMissingProduct(product);
          setIsBulkUpdating(false); // Pause bulk update
          return { success: false, missing: true };
        }
        throw new Error("Produto não encontrado ou link inválido.");
      }

      if (!response.ok) throw new Error("Falha ao buscar dados do produto.");
      
      const latestData = await response.json();
      
      if (latestData.price && latestData.price !== ',00' && latestData.price !== '0,00') {
        await onUpdate(id, { 
          price: latestData.price, 
          originalPrice: latestData.originalPrice || '',
          productUrl: latestData.productUrl || product.productUrl || ''
        });
        if (editingId === id) {
          setEditForm(prev => ({ 
            ...prev, 
            price: latestData.price, 
            originalPrice: latestData.originalPrice || '',
            productUrl: latestData.productUrl || prev.productUrl || ''
          }));
        }
        return { success: true };
      } else {
        if (!silent) throw new Error("Não foi possível extrair o preço atual.");
        return { success: false };
      }
    } catch (err) {
      console.error(err);
      if (!silent) alert("Falha ao atualizar preço. Verifique o link do produto.");
      return { success: false };
    } finally {
      setIsUpdatingPrice(null);
    }
  };

  const handleBulkUpdatePrices = async (startIndex: number = 0) => {
    const listToUpdate = selectedIds.length > 0 
      ? filteredHistory.filter(p => selectedIds.includes(p.id))
      : filteredHistory;

    if (listToUpdate.length === 0) return;

    setIsBulkUpdating(true);
    if (startIndex === 0) {
      setBulkUpdateProgress({ current: 0, total: listToUpdate.length });
    }

    try {
      for (let i = startIndex; i < listToUpdate.length; i++) {
        const product = listToUpdate[i];
        setHighlightedProductId(product.id);
        
        const result = await handleUpdatePrice(product.id, true);
        
        if (result.missing) {
          // handleUpdatePrice already set the missingProduct and paused bulk update
          // We store the next index to resume later
          localStorage.setItem('bulk_update_resume_index', (i + 1).toString());
          setHighlightedProductId(null);
          return; 
        }

        setBulkUpdateProgress(prev => prev ? { ...prev, current: i + 1 } : null);
        // Intervalo de 2 segundos
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      // Concluído
      localStorage.removeItem('bulk_update_resume_index');
    } catch (err) {
      console.error(err);
    } finally {
      setIsBulkUpdating(false);
      setHighlightedProductId(null);
      if (!missingProduct) setBulkUpdateProgress(null);
    }
  };

  const resumeBulkUpdate = () => {
    const resumeIndex = parseInt(localStorage.getItem('bulk_update_resume_index') || '0');
    setMissingProduct(null);
    handleBulkUpdatePrices(resumeIndex);
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await onDelete(id);
      setConfirmDeleteId(null);
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    } catch (err) {
      console.error(err);
      alert("Falha ao excluir produto no WooCommerce.");
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredHistory.length && filteredHistory.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredHistory.map(p => p.id));
    }
  };

  const handleBulkEditSave = async () => {
    setIsBulkSaving(true);
    try {
      const updates: Partial<ImportRecord> = {};
      if (bulkEditForm.category) updates.category = bulkEditForm.category;
      if (bulkEditForm.subcategory) updates.subcategory = bulkEditForm.subcategory;
      if (bulkEditForm.tags) updates.tags = bulkEditForm.tags.split(',').map(t => t.trim()).filter(Boolean);

      if (Object.keys(updates).length === 0) {
        setIsBulkEditModalOpen(false);
        return;
      }

      for (const id of selectedIds) {
        await onUpdate(id, updates);
      }
      setSelectedIds([]);
      setIsBulkEditModalOpen(false);
      setBulkEditForm({});
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar edições em massa.");
    } finally {
      setIsBulkSaving(false);
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
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input 
              type="checkbox"
              checked={selectedIds.length === filteredHistory.length && filteredHistory.length > 0}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              title="Selecionar todos"
            />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {filteredHistory.length} {filteredHistory.length === 1 ? 'Produto Encontrado' : 'Produtos Encontrados'}
              {history.length !== filteredHistory.length && ` (de ${history.length})`}
            </span>
          </div>
          {selectedIds.length > 0 && (
            <button
              onClick={() => setIsBulkEditModalOpen(true)}
              className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-all active:scale-95"
            >
              <Pencil className="w-3 h-3" />
              Editar Selecionados ({selectedIds.length})
            </button>
          )}
          {filteredHistory.length > 0 && selectedIds.length === 0 && (
            <button 
              onClick={() => handleBulkUpdatePrices(0)}
              disabled={isBulkUpdating}
              className="flex items-center gap-2 text-xs font-bold text-green-600 hover:text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 transition-all active:scale-95 disabled:opacity-50"
            >
              {isBulkUpdating ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Atualizando ({bulkUpdateProgress?.current}/{bulkUpdateProgress?.total})...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3" />
                  Atualizar Preços em Massa
                </>
              )}
            </button>
          )}
          {selectedIds.length > 0 && (
            <button 
              onClick={() => handleBulkUpdatePrices(0)}
              disabled={isBulkUpdating}
              className="flex items-center gap-2 text-xs font-bold text-green-600 hover:text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 transition-all active:scale-95 disabled:opacity-50"
            >
              {isBulkUpdating ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Atualizando ({bulkUpdateProgress?.current}/{bulkUpdateProgress?.total})...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3" />
                  Atualizar Preços ({selectedIds.length})
                </>
              )}
            </button>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
            <Download className="w-3 h-3" />
            Exportar CSV
          </button>
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              title="Visualização em Grade"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              title="Visualização em Lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
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
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
          {filteredHistory.map((item) => {
          const isEditing = editingId === item.id;

          return (
            <div 
              key={item.id} 
              id={`product-card-${item.id}`}
              className={`bg-white rounded-2xl border overflow-hidden hover:shadow-lg transition-all duration-300 group flex ${viewMode === 'grid' ? 'flex-col' : 'flex-col md:flex-row'} ${
                selectedIds.includes(item.id) ? 'border-blue-400 ring-1 ring-blue-200 bg-blue-50/10' :
                highlightedProductId === item.id
                  ? 'border-blue-500 ring-4 ring-blue-300 shadow-2xl scale-[1.02] z-10'
                  : isUpdatingPrice === item.id 
                    ? 'border-blue-400 ring-2 ring-blue-100 shadow-md'
                    : 'border-slate-200'
              }`}
            >
              <div className={`${viewMode === 'grid' ? 'h-48 border-b' : 'h-48 md:h-auto md:w-64 border-b md:border-b-0 md:border-r'} bg-slate-50 border-slate-100 flex items-center justify-center p-6 relative flex-shrink-0`}>
                <div className="absolute top-3 left-3 z-10">
                  <input 
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => toggleSelection(item.id)}
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shadow-sm"
                  />
                </div>
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
                        onClick={() => setConfirmDeleteId(item.id)}
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
                    <div className="flex justify-end mb-2">
                       <button
                         onClick={() => setAiSelector({ isOpen: true, productId: item.id, type: 'seo' })}
                         disabled={isGeneratingSEO === item.id}
                         className="flex items-center gap-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-3 py-1.5 rounded-lg shadow-sm transition-all disabled:opacity-50"
                       >
                         {isGeneratingSEO === item.id ? (
                           <>
                             <Loader2 className="w-3 h-3 animate-spin" />
                             Gerando Conteúdo SEO (IA)...
                           </>
                         ) : (
                           <>
                             <Sparkles className="w-3 h-3" />
                             Gerar Conteúdo SEO (IA)
                           </>
                         )}
                       </button>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Nome do Produto</label>
                      <textarea 
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full text-sm font-bold text-slate-800 border-b-2 border-blue-400 outline-none bg-blue-50/30 px-2 py-1.5 rounded resize-none"
                        rows={2}
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

                    {((editForm.path_from_root && editForm.path_from_root.length > 0) || editForm.category) && (
                      <div className="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-inner">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Estrutura de Categorias (Mercado Livre)
                          </span>
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              handleFetchCategoryFromML(item.id, editForm.productUrl || editForm.affiliateUrl || '');
                            }}
                            disabled={isFetchingCategories === item.id}
                            className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors disabled:opacity-50"
                            title="Buscar categorias mais recentes do ML"
                          >
                            {isFetchingCategories === item.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <RefreshCw className="w-3 h-3" />
                            )}
                            Atualizar
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {(editForm.path_from_root?.length ? editForm.path_from_root : [editForm.category, editForm.subcategory].filter(Boolean)).map((cat, index, arr) => (
                            <React.Fragment key={index}>
                              <span className="text-[11px] font-black text-slate-700 bg-white px-2 py-1 rounded-md border border-slate-100 shadow-sm">
                                {cat}
                              </span>
                              {index < arr.length - 1 && (
                                <ChevronRight className="w-3 h-3 text-slate-300" />
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    )}

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
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Link da Página do Produto</label>
                      <input 
                        type="text"
                        value={editForm.productUrl || ''}
                        onChange={(e) => setEditForm({ ...editForm, productUrl: e.target.value })}
                        className="w-full text-xs text-slate-600 border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-400 bg-white"
                        placeholder="https://www.mercadolivre.com.br/..."
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block flex items-center justify-between">
                        <span>Tags (separadas por vírgula)</span>
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
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block flex items-center justify-between">
                          <span>Descrição Curta</span>
                        </label>
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
                          {!item.description && (
                            <button
                              onClick={() => handleGenerateShortDescription(item.id)}
                              disabled={isGeneratingShortDesc === item.id}
                              className="text-[9px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 disabled:opacity-50"
                            >
                              {isGeneratingShortDesc === item.id ? (
                                <Loader2 className="w-2 h-2 animate-spin" />
                              ) : (
                                <Sparkles className="w-2 h-2" />
                              )}
                              Gerar
                            </button>
                          )}
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
                        <button 
                          onClick={() => handleUpdatePrice(item.id)}
                          disabled={isUpdatingPrice === item.id}
                          className="w-9 h-9 rounded-xl bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-600 hover:text-white transition-all shadow-sm disabled:opacity-50"
                          title="Atualizar Preço via Link"
                        >
                          {isUpdatingPrice === item.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                        </button>
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
      {/* Confirmation Modal */}
      {missingProduct && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-red-100">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-3">Produto Inexistente!</h3>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                O produto <span className="font-bold text-slate-700">"{missingProduct.name}"</span> não foi encontrado no Mercado Livre. O link pode ter expirado ou o produto foi removido.
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={async () => {
                    await handleDelete(missingProduct.id);
                    resumeBulkUpdate();
                  }}
                  className="w-full py-4 bg-red-500 text-white font-black rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-2 active:scale-95"
                >
                  <Trash2 className="w-5 h-5" />
                  Excluir Produto Agora
                </button>
                <button 
                  onClick={resumeBulkUpdate}
                  className="w-full py-4 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all active:scale-95"
                >
                  Pular e Continuar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Confirmar Exclusão</h3>
              <p className="text-slate-500 text-sm mb-6">
                Tem certeza que deseja excluir este produto? Esta ação irá removê-lo permanentemente do seu site WooCommerce.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmDeleteId(null)}
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => handleDelete(confirmDeleteId)}
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    'Excluir'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isBulkEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Pencil className="w-5 h-5 text-blue-500" />
                Edição em Massa ({selectedIds.length} produtos)
              </h3>
              <button 
                onClick={() => setIsBulkEditModalOpen(false)}
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm mb-4 border border-blue-100">
                Apenas os campos preenchidos abaixo serão alterados nos produtos selecionados. Deixe em branco para manter o valor original.
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Nova Categoria</label>
                  <select 
                    value={bulkEditForm.category || ''}
                    onChange={(e) => setBulkEditForm({ ...bulkEditForm, category: e.target.value, subcategory: 'Geral' })}
                    className="w-full text-sm text-slate-700 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white cursor-pointer"
                  >
                    <option value="">Manter original</option>
                    {Object.keys(ML_CATEGORIES).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Nova Subcategoria</label>
                  <select 
                    value={bulkEditForm.subcategory || ''}
                    onChange={(e) => setBulkEditForm({ ...bulkEditForm, subcategory: e.target.value })}
                    className="w-full text-sm text-slate-700 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white cursor-pointer"
                    disabled={!bulkEditForm.category}
                  >
                    <option value="">Manter original</option>
                    {bulkEditForm.category && ML_CATEGORIES[bulkEditForm.category as keyof typeof ML_CATEGORIES] ? (
                      ML_CATEGORIES[bulkEditForm.category as keyof typeof ML_CATEGORIES].map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))
                    ) : null}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Novas Tags (Substituir)</label>
                <input 
                  type="text"
                  value={bulkEditForm.tags || ''}
                  onChange={(e) => setBulkEditForm({ ...bulkEditForm, tags: e.target.value })}
                  className="w-full text-sm text-slate-700 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
                  placeholder="tag1, tag2, tag3 (deixe em branco para manter)"
                />
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => setIsBulkEditModalOpen(false)}
                disabled={isBulkSaving}
                className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                onClick={handleBulkEditSave}
                disabled={isBulkSaving}
                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-200"
              >
                {isBulkSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Aplicar Alterações
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* AI PROVIDER SELECTOR MODAL */}
      {aiSelector.isOpen && (
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
                onClick={() => setAiSelector({ ...aiSelector, isOpen: false })}
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
                onClick={() => handleGenerateSeoWithProvider(aiSelector.productId!, 'gemini')}
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
                onClick={() => handleGenerateSeoWithProvider(aiSelector.productId!, 'openai')}
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
            
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                O uso será contabilizado no Dashboard
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsTab;
