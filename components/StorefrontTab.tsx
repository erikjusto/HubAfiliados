
import React, { useState, useMemo, useEffect } from 'react';
import { ImportRecord } from '../types';
import { ML_CATEGORIES } from '../src/constants';
import { 
  Search, 
  ShoppingCart, 
  ChevronRight, 
  ChevronLeft,
  MapPin, 
  Truck, 
  ShieldCheck, 
  Star,
  Menu,
  Heart,
  Filter,
  Package,
  ChevronDown,
  Loader2
} from 'lucide-react';

interface StorefrontTabProps {
  history: ImportRecord[];
  onAdminClick?: () => void;
  isLoading?: boolean;
}

const StorefrontTab: React.FC<StorefrontTabProps> = ({ history, onAdminClick, isLoading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [showOnlyOffers, setShowOnlyOffers] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCategoriesMenu, setShowCategoriesMenu] = useState(false);

  const banners = [
    "https://http2.mlstatic.com/D_NQ_753904-MLA109634941869_032026-OO.webp",
    "https://http2.mlstatic.com/D_NQ_779101-MLA108815569856_032026-OO.webp",
    "https://http2.mlstatic.com/D_NQ_958393-MLA109639123999_032026-OO.webp",
    "https://http2.mlstatic.com/D_NQ_789153-MLA109114797449_032026-OO.webp",
    "https://http2.mlstatic.com/D_NQ_717500-MLA108958109899_032026-OO.webp"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % banners.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);

  const categoryMap = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    history.forEach(item => {
      if (item.category) {
        if (!map[item.category]) map[item.category] = new Set();
        if (item.subcategory) map[item.category].add(item.subcategory);
      }
    });
    return map;
  }, [history]);

  const filteredProducts = useMemo(() => {
    return history.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || item.category === selectedCategory;
      const matchesSubcategory = !selectedSubcategory || item.subcategory === selectedSubcategory;
      const matchesOffers = !showOnlyOffers || (item.originalPrice && item.originalPrice.trim() !== '');
      return matchesSearch && matchesCategory && matchesSubcategory && matchesOffers;
    });
  }, [history, searchTerm, selectedCategory, selectedSubcategory, showOnlyOffers]);

  const handleCategoryClick = (cat: string | null) => {
    setSelectedCategory(cat);
    setSelectedSubcategory(null);
    setShowOnlyOffers(false);
    setShowCategoriesMenu(false);
  };

  const handleSubcategoryClick = (cat: string, sub: string) => {
    setSelectedCategory(cat);
    setSelectedSubcategory(sub);
    setShowOnlyOffers(false);
    setShowCategoriesMenu(false);
  };

  const handleOffersClick = () => {
    setShowOnlyOffers(true);
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setShowCategoriesMenu(false);
  };

  const allCategories = Object.keys(ML_CATEGORIES).sort();

  return (
    <div className="min-h-screen bg-[#ebebeb] -mx-4 -mt-6 md:-mx-8 md:-mt-8">
      {/* Mercado Livre Style Header */}
      <header className="bg-[#fff159] pt-2 pb-3 px-4 md:px-8 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2 shrink-0">
              <img 
                src="https://shopifybrasil.com.br/wp-content/uploads/2026/01/shopifybrasil.png" 
                alt="Shopify Brasil Logo" 
                className="h-10 md:h-12 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Search Bar */}
            <div className="flex-1 w-full relative">
              <input
                type="text"
                placeholder="Buscar produtos, marcas e muito mais..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-2.5 pl-4 pr-12 rounded-sm shadow-sm border-none focus:ring-2 focus:ring-blue-500 outline-none text-slate-700"
              />
              <div className="absolute right-0 top-0 h-full px-4 flex items-center border-l border-slate-200 text-slate-400">
                <Search className="w-5 h-5" />
              </div>
            </div>

            {/* Header Links */}
            <div className="hidden lg:flex items-center gap-6 text-slate-700 text-sm">
              <div className="flex items-center gap-1 cursor-pointer hover:text-slate-900">
                <MapPin className="w-4 h-4" />
                <span>Enviar para Brasil</span>
              </div>
              <div className="flex items-center gap-1 cursor-pointer hover:text-slate-900">
                <ShoppingCart className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Sub-header Navigation */}
          <div className="hidden md:flex items-center gap-6 mt-3 text-xs text-slate-600 relative">
            <div 
              className="flex items-center gap-1 cursor-pointer hover:text-slate-900 group py-1"
              onMouseEnter={() => setShowCategoriesMenu(true)}
              onMouseLeave={() => setShowCategoriesMenu(false)}
            >
              <span>MAIS VENDIDOS</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showCategoriesMenu ? 'rotate-180' : ''}`} />
              
              {/* Categories Dropdown Menu (Grid Layout) */}
              {showCategoriesMenu && (
                <div className="absolute top-full left-0 mt-0 w-[1000px] bg-[#ebebeb] shadow-2xl rounded-b-md overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 duration-200 border border-slate-200">
                  <div className="p-10">
                    <h2 className="text-2xl font-normal mb-8 text-slate-800">Todas as categorias</h2>
                    <div className="bg-white rounded-lg p-12 shadow-sm grid grid-cols-5 gap-x-8 gap-y-8">
                      {allCategories.map((cat) => (
                        <div 
                          key={cat} 
                          className="text-[14px] text-slate-700 hover:text-blue-600 cursor-pointer transition-colors"
                          onClick={() => handleCategoryClick(cat)}
                        >
                          {cat}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <span 
              className={`cursor-pointer hover:text-slate-900 ${showOnlyOffers ? 'font-bold text-slate-900 border-b-2 border-slate-900' : ''}`}
              onClick={handleOffersClick}
            >
              Ofertas
            </span>
            <span className="cursor-pointer hover:text-slate-900">Histórico</span>
            <span className="cursor-pointer hover:text-slate-900">Supermercado</span>
            <span className="cursor-pointer hover:text-slate-900">Moda</span>
            <span className="cursor-pointer hover:text-slate-900">Vender</span>
            <span className="cursor-pointer hover:text-slate-900">Contato</span>
            {onAdminClick && (
              <button 
                onClick={onAdminClick}
                className="ml-auto text-blue-600 font-bold hover:underline flex items-center gap-1"
              >
                <ShieldCheck className="w-3 h-3" />
                Painel Admin
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Banner Slide */}
      <div className="w-full overflow-hidden relative group h-[400px]">
        <div 
          className="flex transition-transform duration-700 ease-in-out h-full"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {banners.map((banner, index) => (
            <div key={index} className="min-w-full h-full relative">
              <img 
                src={banner} 
                alt={`Banner Promocional ${index + 1}`} 
                className="w-full h-full object-cover object-top"
                referrerPolicy="no-referrer"
              />
              {/* Gradient Mask on each image */}
              <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-[#ebebeb] to-transparent pointer-events-none" />
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        <button 
          onClick={prevSlide}
          className="absolute left-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/30 hover:bg-white/50 backdrop-blur-md rounded-full flex items-center justify-center text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
        <button 
          onClick={nextSlide}
          className="absolute right-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/30 hover:bg-white/50 backdrop-blur-md rounded-full flex items-center justify-center text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
        >
          <ChevronRight className="w-8 h-8" />
        </button>

        {/* Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-10">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                currentSlide === index ? 'bg-white w-8' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-12 pb-12">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Sidebar Filters */}
          <aside className="lg:w-64 shrink-0 space-y-8 sticky top-[120px]">
            <div>
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Package className="w-4 h-4" /> Produtos Listados
              </h3>
              <p className="text-sm text-slate-500 ml-6">{filteredProducts.length} resultados</p>
            </div>

            {/* Categories */}
            <div>
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4" /> Categorias
              </h3>
              <ul className="space-y-3 text-sm text-slate-600">
                <li 
                  className={`cursor-pointer hover:text-blue-600 transition-colors ${!selectedCategory ? 'font-bold text-blue-600' : ''}`}
                  onClick={() => handleCategoryClick(null)}
                >
                  Todas as categorias
                </li>
                {(Object.entries(categoryMap) as [string, Set<string>][]).sort().map(([cat, subs]) => (
                  <li key={cat} className="space-y-1">
                    <div 
                      className={`cursor-pointer hover:text-blue-600 transition-colors ${selectedCategory === cat && !selectedSubcategory ? 'font-bold text-blue-600' : ''}`}
                      onClick={() => handleCategoryClick(cat)}
                    >
                      {cat}
                    </div>
                    {subs.size > 0 && (
                      <ul className="ml-4 space-y-1 border-l border-slate-200 pl-3">
                        {Array.from(subs).sort().map((sub: string) => (
                          <li 
                            key={sub}
                            className={`cursor-pointer text-xs hover:text-blue-600 transition-colors ${selectedSubcategory === sub ? 'font-bold text-blue-600' : ''}`}
                            onClick={() => handleSubcategoryClick(cat, sub)}
                          >
                            {sub}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg shadow-sm">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Carregando produtos da sua loja...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center shadow-sm">
                <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-800">Não encontramos resultados</h3>
                <p className="text-slate-500 mt-2">Tente buscar por outros termos ou limpar os filtros.</p>
                <button 
                  onClick={() => {setSearchTerm(''); setSelectedCategory(null); setSelectedSubcategory(null);}}
                  className="mt-6 text-blue-600 font-bold hover:underline"
                >
                  Limpar todos os filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredProducts.map((product) => (
                  <div 
                    key={product.id} 
                    className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer border border-transparent hover:border-slate-200"
                  >
                    {/* Product Image */}
                    <div className="relative aspect-square bg-white p-4 flex items-center justify-center border-b border-slate-100">
                      <a 
                        href={product.affiliateUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full h-full flex items-center justify-center"
                      >
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      </a>
                      <button className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors shadow-sm z-10">
                        <Heart className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Product Info */}
                    <div className="p-4 space-y-2">
                      <div className="min-h-[1.25rem]">
                        {product.originalPrice && (
                          <span className="text-xs text-slate-400 line-through">
                            {product.currency} {product.originalPrice}
                          </span>
                        )}
                      </div>
                      
                      <a 
                        href={product.affiliateUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <div className="flex items-baseline gap-1.5">
                          <div className="flex items-baseline text-slate-900">
                            <span className="text-xs font-medium mr-1">{product.currency}</span>
                            <span className="text-3xl font-medium leading-none">
                              {product.price.replace(',', '.').split('.')[0]}
                            </span>
                            <span className="text-sm font-medium self-start mt-1">
                              {product.price.replace(',', '.').split('.')[1] || '00'}
                            </span>
                          </div>
                          
                          {product.originalPrice && (
                            <div className="bg-[#e6f7ee] text-[#00a650] text-[13px] font-semibold px-1.5 py-0.5 rounded-sm">
                              {(() => {
                                const orig = parseFloat(product.originalPrice.replace(',', '.'));
                                const curr = parseFloat(product.price.replace(',', '.'));
                                return Math.round(((orig - curr) / orig) * 100);
                              })()}% OFF
                            </div>
                          )}
                        </div>
                      </a>
                      
                      {product.installmentInfo && (
                        <p className="text-xs text-slate-600">
                          em <span className="text-green-600">{product.installmentInfo}</span>
                        </p>
                      )}

                      <a 
                        href={product.affiliateUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <div className="flex items-center gap-1 text-green-600 font-bold text-xs">
                          <Truck className="w-3 h-3" />
                          <span>Frete grátis</span>
                        </div>
                      </a>

                      <a 
                        href={product.affiliateUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <h3 className="text-sm text-slate-700 line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {product.name}
                        </h3>
                      </a>

                      {product.subcategory && (
                        <span className="inline-block bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded uppercase font-bold">
                          {product.subcategory}
                        </span>
                      )}

                      <div className="pt-2 flex items-center gap-1">
                        <div className="flex text-blue-500">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-current" />
                          ))}
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold">4.8 (124)</span>
                      </div>

                      <a 
                        href={product.affiliateUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mt-4 w-full py-2 bg-blue-600 text-white text-sm font-bold rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                      >
                        Comprar agora
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-20">
        <div className="max-w-7xl mx-auto py-12 px-8 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center flex-shrink-0">
              <Truck className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800">Frete grátis para vários produtos</h4>
              <p className="text-xs text-slate-500">Aproveite o benefício de frete grátis em milhares de itens selecionados.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800">Segurança Garantida por Mercado Livre</h4>
              <p className="text-xs text-slate-500">Sua compra está protegida do início ao fim com a tecnologia do Mercado Livre.</p>
            </div>
          </div>
        </div>
        
        {/* Payment Methods */}
        <div className="border-t border-slate-100 py-8 px-8">
          <div className="max-w-7xl mx-auto">
            <h4 className="text-sm font-bold text-slate-800 mb-6">Meios de pagamento</h4>
            <div className="flex flex-wrap items-center gap-x-12 gap-y-8">
              {/* Mercado Crédito */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Linha de Crédito</span>
                <img src="https://http2.mlstatic.com/storage/logos-api-admin/f3e8e940-f549-11ef-bad6-e9962bcd76e5-m.svg" alt="Mercado Crédito" className="h-6 w-auto" referrerPolicy="no-referrer" />
              </div>
              
              {/* Credit Cards */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cartões de crédito</span>
                  <span className="text-[10px] text-blue-600 font-bold">Até 36x!</span>
                </div>
                <div className="flex items-center gap-4">
                  <img src="https://http2.mlstatic.com/storage/logos-api-admin/a5f047d0-9be0-11ec-aad4-c3381f368aaf-m.svg" alt="Visa" className="h-4 w-auto" referrerPolicy="no-referrer" />
                  <img src="https://http2.mlstatic.com/storage/logos-api-admin/9cf818e0-723a-11f0-a459-cf21d0937aeb-m.svg" alt="Mastercard" className="h-5 w-auto" referrerPolicy="no-referrer" />
                  <img src="https://http2.mlstatic.com/storage/logos-api-admin/b2c93a40-f3be-11eb-9984-b7076edb0bb7-m.svg" alt="American Express" className="h-5 w-auto" referrerPolicy="no-referrer" />
                  <img src="https://http2.mlstatic.com/storage/logos-api-admin/bb7c7bb0-adec-11f0-92e6-59fb0bcb38c2-m.svg" alt="Elo" className="h-5 w-auto" referrerPolicy="no-referrer" />
                </div>
              </div>

              {/* Pix */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pix</span>
                <img src="https://http2.mlstatic.com/storage/logos-api-admin/f99fcca0-f3bd-11eb-9984-b7076edb0bb7-m.svg" alt="Pix" className="h-6 w-auto" referrerPolicy="no-referrer" />
              </div>

              {/* Boleto */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Boleto bancário</span>
                <img src="https://http2.mlstatic.com/storage/logos-api-admin/00174300-571e-11e8-8364-bff51f08d440-m.svg" alt="Boleto" className="h-6 w-auto" referrerPolicy="no-referrer" />
              </div>

              {/* Google Safe Browsing Seal */}
              <div className="md:ml-auto flex items-center gap-2 bg-white border border-slate-100 rounded px-3 py-1.5 shadow-sm">
                <img 
                  src="https://www.gstatic.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png" 
                  alt="Google" 
                  className="h-4 w-auto" 
                  referrerPolicy="no-referrer" 
                />
                <div className="h-4 w-[1px] bg-slate-200 mx-1"></div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Site Seguro</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Line */}
        <div className="border-t border-slate-100 py-6 px-8 bg-slate-50/50">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] text-slate-400 font-medium">
            <p>© 2026 Metaminds Soluções Digitais - Somos parceiros Mercado Livre</p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-blue-600 transition-colors">Politica de Privacidade</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Meios de pagamento para este produto</h2>
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                aria-label="Fechar"
              >
                <svg aria-hidden="true" color="rgba(0,0,0,0.55)" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M4.35156 5.19496L9.15406 9.99746L4.35156 14.8L5.20009 15.6485L10.0026 10.846L14.7963 15.6397L15.6449 14.7912L10.8511 9.99746L15.6449 5.20371L14.7963 4.35518L10.0026 9.14894L5.20009 4.34644L4.35156 5.19496Z" fill="currentColor"></path>
                </svg>
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-0 bg-[#f5f5f5]">
              <div className="w-full h-full min-h-[500px]">
                <iframe 
                  className="w-full h-full min-h-[2114px]" 
                  title="Confira outros meios de pagamento" 
                  src="https://produto.mercadolivre.com.br/noindex/services/MLB5128329174/payments?new_version=true&modal=true&newIndex=true" 
                  frameBorder="0" 
                  scrolling="no"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StorefrontTab;
