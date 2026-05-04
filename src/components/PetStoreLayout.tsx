import React, { useState, useEffect } from 'react';
import { ImportRecord, ProductData } from '@/types';
import { ShoppingBag, Star, RefreshCw, ShieldCheck, Heart, Truck, Gift, ChevronRight, AlignLeft, Dog, Cat, Bird, Fish, Rabbit, Info, Search, Menu as MenuIcon, X, ChevronDown } from 'lucide-react';

interface PetStoreLayoutProps {
  history: ImportRecord[];
  onAdminClick?: () => void;
  isLoading?: boolean;
}

const PET_MENU = [
  {
    name: 'Cães',
    icon: Dog,
    categories: [
      {
        name: 'Alimentação',
        items: ['Ração Seca', 'Ração Úmida', 'Petiscos e Ossinhos', 'Ração Medicamentosa']
      },
      {
        name: 'Higiene e Saúde',
        items: ['Shampoos e Banho', 'Tapetes Higiênicos', 'Antipulgas e Carrapatos', 'Farmácia Pet']
      },
      {
        name: 'Acessórios',
        items: ['Camas e Casinhas', 'Coleiras e Guias', 'Comedouros e Bebedouros', 'Caixas de Transporte']
      }
    ]
  },
  {
    name: 'Gatos',
    icon: Cat,
    categories: [
      {
        name: 'Alimentação',
        items: ['Ração Seca', 'Ração Úmida', 'Petiscos', 'Catnip e Erva']
      },
      {
        name: 'Higiene',
        items: ['Areias Sanitárias', 'Caixas de Areia', 'Banho e Tosa', 'Limpeza']
      },
      {
        name: 'Conforto e Lazer',
        items: ['Arranhadores', 'Brinquedos', 'Camas e Redes', 'Fontes de Água']
      }
    ]
  },
  {
    name: 'Pássaros',
    icon: Bird,
    categories: [
      {
        name: 'Alimentação',
        items: ['Misturas de Sementes', 'Ração Extrusada', 'Bastões e Petiscos']
      },
      {
        name: 'Habitação',
        items: ['Gaiolas e Viveiros', 'Poleiros', 'Ninhos']
      }
    ]
  },
  {
    name: 'Peixes',
    icon: Fish,
    categories: [
      {
        name: 'Alimentação',
        items: ['Ração para Peixes', 'Alimento Vivo', 'Suplementos']
      },
      {
        name: 'Aquarismo',
        items: ['Aquários', 'Filtros e Bombas', 'Iluminação', 'Decoração']
      }
    ]
  },
  {
    name: 'Outros Pets',
    icon: Rabbit,
    categories: [
      {
        name: 'Roedores',
        items: ['Ração para Hamster', 'Gaiolas', 'Feno e Alfafa']
      },
      {
        name: 'Répteis',
        items: ['Terrários', 'Aquecimento', 'Alimento Específico']
      }
    ]
  }
];

const PetStoreLayout: React.FC<PetStoreLayoutProps> = ({ history, onAdminClick, isLoading }) => {
  const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Always scroll to top when opening a product detail or going back to home
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [selectedProduct]);

  // Filter products by pet categories
  const petProducts = history.filter(p => 
    !p.category || 
    ['Cães', 'Gatos', 'Animais', 'Roedores', 'Pássaros', 'Peixes', 'PetShop'].some(c => p.category?.includes(c))
  );

  // If no pet products, fallback to all (to not be empty just in case)
  const displayProducts = petProducts.length > 0 ? petProducts : history;

  const topSelling = [...displayProducts].sort((a, b) => {
    const priceA = parseFloat(a.price.replace(/[^\d.,]/g, '') || '0');
    const priceB = parseFloat(b.price.replace(/[^\d.,]/g, '') || '0');
    return priceA - priceB;
  }).slice(0, 8);

  const renderHeader = () => (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-[100] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-8">
          {/* LOGO */}
          <div 
            className="flex items-center gap-2 cursor-pointer group shrink-0"
            onClick={() => setSelectedProduct(null)}
          >
            <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-teal-500/20 group-hover:scale-110 transition-transform">
              <Dog className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tighter leading-none">PET<span className="text-teal-500">STORE</span></h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Afiliados Premium</p>
            </div>
          </div>

          {/* DESKTOP SEARCH */}
          <div className="hidden lg:flex flex-1 max-w-xl relative">
            <input 
              type="text" 
              placeholder="O que seu pet precisa hoje?" 
              className="w-full bg-slate-100 border-none rounded-2xl py-3 pl-5 pr-12 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-teal-500 transition-all outline-none"
            />
            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-500 transition-colors">
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* HEADER ACTIONS */}
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-600 hover:text-teal-500 transition-colors">
              <Heart className="w-6 h-6" />
              <span className="absolute top-0 right-0 w-4 h-4 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">0</span>
            </button>
            <button className="relative p-3 bg-teal-50 text-teal-600 hover:bg-teal-500 hover:text-white rounded-xl transition-all duration-300">
               <ShoppingBag className="w-6 h-6" />
            </button>
            {onAdminClick && (
              <button 
                onClick={onAdminClick}
                className="hidden md:flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition-colors h-11 shrink-0 select-none cursor-pointer"
              >
                Painel Admin
              </button>
            )}
            <button 
              className="lg:hidden p-2 text-slate-600"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-7 h-7" /> : <MenuIcon className="w-7 h-7" />}
            </button>
          </div>
        </div>
      </div>

      {/* NAVIGATION MENU (DESKTOP) */}
      <nav className="hidden lg:block border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-8">
           <ul className="flex items-center gap-8">
             {PET_MENU.map((item) => (
               <li 
                 key={item.name} 
                 className="relative group py-4"
                 onMouseEnter={() => setActiveMenu(item.name)}
                 onMouseLeave={() => setActiveMenu(null)}
               >
                 <button className="flex items-center gap-2 font-bold text-slate-600 hover:text-teal-600 transition-colors py-1">
                   <item.icon className="w-4 h-4" />
                   {item.name}
                   <ChevronDown className="w-3 h-3 opacity-50 group-hover:rotate-180 transition-transform" />
                 </button>

                 {/* MEGA MENU DROPDOWN - WIDER FOR 3 LEVELS */}
                 <div className="absolute top-full left-0 w-[600px] bg-white shadow-2xl rounded-b-3xl border border-slate-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all transform translate-y-2 group-hover:translate-y-0 z-50 p-8 grid grid-cols-3 gap-8">
                    {item.categories.map(cat => (
                      <div key={cat.name} className="space-y-4">
                        <h4 className="font-black text-slate-800 text-sm uppercase tracking-wider mb-2 border-b border-slate-50 pb-2">{cat.name}</h4>
                        <ul className="space-y-2">
                          {cat.items.map(sub => (
                            <li key={sub}>
                              <a href="#" className="text-sm text-slate-500 hover:text-teal-600 hover:translate-x-1 transition-all inline-block">
                                {sub}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    <div className="col-span-3 mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                       <p className="text-xs text-slate-400">Ofertas imperdíveis para {item.name}</p>
                       <button className="text-xs font-black text-teal-600 hover:underline flex items-center gap-1 uppercase tracking-tighter">
                         Ver Coleção Completa <ChevronRight className="w-3 h-3" />
                       </button>
                    </div>
                 </div>
               </li>
             ))}
             <li className="ml-auto py-4">
               <button className="font-black text-orange-500 hover:text-orange-600 py-1 flex items-center gap-2 text-sm uppercase tracking-tighter italic">
                 <Star className="w-4 h-4 fill-current" />
                 Outlet Pet Store
               </button>
             </li>
           </ul>
        </div>
      </nav>

      {/* MOBILE MENU */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-white border-t border-slate-200 shadow-2xl z-50 max-h-[80vh] overflow-y-auto animate-in slide-in-from-top duration-300">
          <div className="p-4 space-y-6">
            {/* Mobile Search */}
            <div className="relative">
              <input 
                type="text" 
                placeholder="Buscar no Petshop..." 
                className="w-full bg-slate-100 border-none rounded-xl py-3 pl-4 pr-10 text-slate-800 outline-none"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            </div>

            {/* Mobile Categories */}
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Explore as Categorias</p>
              {PET_MENU.map(item => (
                <details key={item.name} className="group border-b border-slate-50 last:border-0 pb-2">
                  <summary className="flex items-center justify-between list-none py-3 px-2 cursor-pointer font-black text-slate-800 uppercase tracking-tight">
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5 text-teal-500" />
                      {item.name}
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="pl-8 pr-4 py-2 space-y-4">
                    {item.categories.map(cat => (
                      <details key={cat.name} className="group/cat">
                         <summary className="flex items-center justify-between list-none py-1 cursor-pointer font-bold text-slate-600 text-sm">
                           {cat.name}
                           <ChevronDown className="w-3 h-3 group-open/cat:rotate-180 transition-transform" />
                         </summary>
                         <div className="pl-4 py-2 space-y-2 border-l-2 border-teal-100 mt-2">
                            {cat.items.map(sub => (
                              <a key={sub} href="#" className="block text-sm text-slate-400 hover:text-teal-600">{sub}</a>
                            ))}
                         </div>
                      </details>
                    ))}
                  </div>
                </details>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
              <button className="w-full bg-orange-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30">
                <Star className="w-5 h-5 fill-current" /> OFERTAS DO DIA
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {renderHeader()}

      {selectedProduct ? (
        <div className="pb-20 fade-in">
          {/* BREADCRUMB */}
          <div className="bg-white border-b border-slate-50 py-3 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs text-slate-400">
               <button onClick={() => setSelectedProduct(null)} className="hover:text-teal-600 transition-colors cursor-pointer">Início</button>
               <ChevronRight className="w-3 h-3" />
               <span className="text-slate-600 truncate">{selectedProduct.name}</span>
            </div>
          </div>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-3xl p-6 md:p-12 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-8 lg:gap-16">
              {/* Product Image */}
              <div className="w-full md:w-1/2 flex justify-center items-start">
                <div className="aspect-square w-full max-w-md rounded-2xl overflow-hidden border border-slate-100 bg-white shadow-inner flex items-center justify-center p-4">
                  <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-full h-full object-contain hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                </div>
              </div>

              {/* Product Info */}
              <div className="w-full md:w-1/2 flex flex-col">
                <div className="mb-2 flex items-center gap-2 text-xs font-bold text-teal-600 uppercase tracking-widest leading-none">
                  <Heart className="w-4 h-4 fill-current" />
                  Destaque Pet Store
                </div>
                
                <h1 className="text-2xl md:text-3xl font-black text-slate-800 mb-4 leading-tight">
                  {selectedProduct.name}
                </h1>

                <div className="flex items-center gap-2 mb-6">
                  <div className="flex gap-1 text-amber-400">
                    <Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" />
                  </div>
                  <span className="text-xs font-bold text-slate-400 border-l border-slate-200 pl-2">Avaliado por 120 pais de pet</span>
                </div>

                <div className="mb-8">
                  {selectedProduct.originalPrice && (
                    <span className="text-sm font-bold text-slate-300 line-through mb-1 block">
                      R$ {selectedProduct.originalPrice}
                    </span>
                  )}
                  <div className="flex items-end gap-1 text-slate-900 leading-none">
                    <span className="text-xl font-bold pb-1">{selectedProduct.currency}</span>
                    <span className="text-5xl font-black tracking-tighter">{selectedProduct.price}</span>
                  </div>
                  {selectedProduct.installmentInfo && (
                    <p className="text-sm font-bold text-teal-600 mt-2">{selectedProduct.installmentInfo}</p>
                  )}
                </div>

                <button 
                  onClick={() => {
                    if (selectedProduct.affiliateUrl) window.open(selectedProduct.affiliateUrl, '_blank');
                  }}
                  className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-black text-lg py-5 rounded-2xl shadow-xl hover:shadow-orange-500/30 transition-all flex items-center justify-center gap-3 mb-6"
                >
                  <ShoppingBag className="w-6 h-6" />
                  COMPRAR AGORA
                </button>

                <div className="bg-slate-50 rounded-2xl p-5 flex flex-col gap-4 border border-slate-100">
                  <div className="flex items-center gap-4 text-slate-600 text-sm font-bold">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-teal-500"><Truck className="w-5 h-5" /></div>
                    Vendido e entregue pelo Mercado Livre
                  </div>
                  <div className="flex items-center gap-4 text-slate-600 text-sm font-bold">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-teal-500"><ShieldCheck className="w-5 h-5" /></div>
                    Garantia de satisfação total
                  </div>
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="mt-12 bg-white rounded-3xl p-6 md:p-12 shadow-sm border border-slate-100">
              <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-500"><AlignLeft className="w-6 h-6" /></div>
                Sobre este produto
              </h2>
              
              <article 
                className="prose prose-slate prose-teal max-w-none text-slate-600 leading-relaxed product-long-description"
                itemScope
                itemType="https://schema.org/Product"
              >
                {/* Schema.org JSON-LD for Google Rich Results */}
                <script 
                  type="application/ld+json"
                  dangerouslySetInnerHTML={{ __html: JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "Product",
                    "name": selectedProduct.name,
                    "description": selectedProduct.description || selectedProduct.name,
                    "image": selectedProduct.imageUrl,
                    "offers": {
                      "@type": "Offer",
                      "url": selectedProduct.affiliateUrl || '',
                      "priceCurrency": "BRL",
                      "price": selectedProduct.price?.replace(',', '.') || '0',
                      "availability": "https://schema.org/InStock",
                      "seller": {
                        "@type": "Organization",
                        "name": "Mercado Livre"
                      }
                    }
                  }) }}
                />
                {selectedProduct.longDescription ? (
                  /\<[a-z][\s\S]*\>/i.test(selectedProduct.longDescription) ? (
                    <div 
                      className="description-content"
                      dangerouslySetInnerHTML={{ __html: selectedProduct.longDescription }}
                      ref={(el) => {
                        if (el) {
                          // Patch all links to open in new tab and add rel attributes for SEO
                          el.querySelectorAll('a').forEach(a => {
                            a.setAttribute('target', '_blank');
                            a.setAttribute('rel', 'noopener noreferrer sponsored');
                            if (!a.getAttribute('aria-label')) {
                              a.setAttribute('aria-label', `Ir para: ${a.textContent || a.href}`);
                            }
                          });
                        }
                      }}
                    />
                  ) : (
                    <div>
                      {selectedProduct.longDescription.split('\n').map((line, i) => (
                        line.trim() ? <p key={i} className="mb-4">{line}</p> : <div key={i} className="h-2"></div>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="whitespace-pre-line text-lg">
                    {selectedProduct.description || "Nenhum detalhe adicional disponível."}
                  </div>
                )}

                {/* CTA Button (always visible below description) */}
                {selectedProduct.affiliateUrl && (
                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <a 
                      href={selectedProduct.affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl hover:from-teal-600 hover:to-teal-700 transition-all duration-300 hover:-translate-y-0.5"
                      aria-label={`Comprar ${selectedProduct.name} no Mercado Livre`}
                    >
                      <ShoppingBag className="w-6 h-6" />
                      COMPRAR NO MERCADO LIVRE
                    </a>
                  </div>
                )}
              </article>
            </div>
          </main>
        </div>
      ) : (
        <>
          <section className="relative w-full h-[700px] overflow-hidden flex items-center bg-teal-50">
            {/* Background Image Setup */}
            <div className="absolute inset-0 z-0">
              <img 
                src="/pet_storefront_banner.png" 
                alt="Cão e gato felizes"
                className="w-full h-full object-cover object-top opacity-90"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-teal-900/80 via-teal-900/60 to-transparent"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
              <div className="max-w-xl text-white space-y-6">
                <div className="inline-block px-4 py-1.5 rounded-full bg-teal-500/30 backdrop-blur-sm border border-teal-400/50 text-sm font-semibold tracking-wide leading-none uppercase">
                  Muito mais que um petshop
                </div>
                <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tighter">
                  Seu pet merece o melhor cuidado <span className="text-teal-400 italic">todos os dias</span>
                </h1>
                <p className="text-lg md:text-xl text-teal-50/80 font-medium max-w-md">
                  Produtos selecionados com amor para a saúde e felicidade do seu melhor amigo.
                </p>
                <div className="pt-4">
                  <button className="bg-orange-500 hover:bg-orange-600 text-white font-black py-4 px-10 rounded-2xl shadow-2xl shadow-orange-500/40 transition-all transform hover:-translate-y-1 flex items-center gap-3 text-lg">
                    <ShoppingBag className="w-6 h-6" />
                    EXPLORAR LOJA
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* 2. SLIDER PROMOCIONAL */}
          <section className="bg-teal-700 py-3 text-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-sm md:text-base font-medium">
              <div className="flex items-center gap-2"><Truck className="w-5 h-5 text-orange-400" /> Frete grátis com MercadoFull acima de R$199</div>
              <div className="hidden md:flex items-center gap-2"><Gift className="w-5 h-5 text-orange-400" /> 10% OFF na primeira compra</div>
              <div className="flex items-center gap-2"><Star className="w-5 h-5 text-orange-400" /> Ofertas exclusivas para seu pet</div>
            </div>
          </section>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
            
            {/* 4. CATEGORIAS VISUAIS */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-slate-800">Compre por categoria</h2>
                <button className="text-teal-600 font-semibold hover:text-teal-700 flex items-center gap-1">Ver todas <ChevronRight className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
                {[
                  { name: 'Cachorros', img: 'https://img.freepik.com/fotos-gratis/lindo-retrato-de-cachorro_23-2149218450.jpg' },
                  { name: 'Gatos', img: 'https://img.freepik.com/fotos-gratis/lindo-retrato-de-gato-isolado_23-2149152051.jpg' },
                  { name: 'Higiene', img: 'https://img.freepik.com/fotos-gratis/mulher-lavando-seu-cachorro-na-banheira_23-2149022634.jpg' },
                  { name: 'Saúde', img: 'https://img.freepik.com/fotos-gratis/veterinario-examinando-cao-na-clinica_23-2148993856.jpg' },
                  { name: 'Brinquedos', img: 'https://img.freepik.com/fotos-gratis/cao-engracado-com-brinquedo_23-2148967912.jpg' },
                  { name: 'Alimentação', img: 'https://img.freepik.com/fotos-gratis/comida-de-cachorro-seca-em-uma-tigela_1150-18456.jpg' }
                ].map((cat, i) => (
                  <div key={i} className="group cursor-pointer">
                    <div className="aspect-square bg-slate-100 rounded-2xl overflow-hidden mb-3 border-2 border-transparent group-hover:border-teal-500 transition-all shadow-sm">
                      <img src={cat.img + '?semt=ais_hybrid&w=300&q=80'} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                    </div>
                    <h3 className="text-center font-bold text-slate-800 group-hover:text-teal-600 transition-colors">{cat.name}</h3>
                  </div>
                ))}
              </div>
            </section>

            {/* 5. PRODUTOS EM DESTAQUE */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-slate-800">Mais Vendidos</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {topSelling.map((product, i) => (
                  <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 hover:shadow-xl transition-all cursor-pointer group flex flex-col h-full" onClick={() => setSelectedProduct(product)}>
                    <div className="relative aspect-square mb-4 bg-white rounded-xl overflow-hidden">
                      {i < 3 && (
                        <div className="absolute top-2 left-2 z-10 bg-orange-500 text-white text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wide">
                          Mais Vendido
                        </div>
                      )}
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-600 line-clamp-2 leading-tight group-hover:text-teal-600 transition-colors flex-1 mb-2">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-1 mb-3">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="text-xs text-slate-400 ml-1">(120)</span>
                    </div>
                    <div className="space-y-1">
                      {product.originalPrice && (
                        <p className="text-xs text-slate-400 line-through">R$ {product.originalPrice}</p>
                      )}
                      <p className="text-xl font-bold text-slate-800">{product.currency} {product.price}</p>
                      {product.installmentInfo && (
                        <p className="text-xs text-green-600 font-medium">{product.installmentInfo}</p>
                      )}
                    </div>
                    <button className="w-full mt-4 bg-teal-500 hover:bg-teal-600 text-white font-bold py-2.5 rounded-xl transition-colors">
                      Ver Detalhes
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* 7. BENEFÍCIOS DA LOJA */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-6 py-8 border-y border-slate-200">
              {[
                { icon: Truck, title: 'Entrega Rápida', desc: 'Receba em até 24h na capital' },
                { icon: ShieldCheck, title: 'Compra Segura', desc: 'Criptografia de ponta a ponta' },
                { icon: Heart, title: 'Atendimento', desc: 'Especialistas apaixonados por pets' },
                { icon: Star, title: 'Qualidade Premium', desc: 'As melhores marcas do mercado' },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 mb-2">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-800">{item.title}</h4>
                  <p className="text-sm text-slate-500">{item.desc}</p>
                </div>
              ))}
            </section>

            {/* 6. PROVA SOCIAL */}
            <section className="text-center py-12">
              <h2 className="text-3xl font-black text-slate-800 mb-2">Mais de 5.000 clientes satisfeitos</h2>
              <p className="text-slate-500 mb-10">O que os pais de pet estão dizendo sobre nós</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { name: 'Ana Silva & Thor (Golden)', text: 'Entrega mega rápida! O Thor amou os brinquedos novos. Comprarei mais vezes com certeza.', rating: 5, img: 'https://img.freepik.com/fotos-gratis/mulher-sorridente-e-filhote-de-golden-retriever_23-2148419262.jpg' },
                  { name: 'Carlos Santos & Luna (Sialata)', text: 'Os melhores preços e um atendimento excepcional. Precisei trocar um item e foi super fácil.', rating: 5, img: 'https://img.freepik.com/fotos-gratis/jovem-com-gatinho-fofo-dentro-de-casa_23-2149152044.jpg' },
                  { name: 'Mariana Costa & Max', text: 'Raçōes super premium com descontos reais. Recomendo muito esse petshop para todos!', rating: 5, img: 'https://img.freepik.com/fotos-gratis/retrato-de-um-lindo-pug_23-2148906963.jpg' }
                ].map((review, i) => (
                  <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-left">
                    <div className="flex gap-1 text-teal-500 mb-4">
                      <Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" />
                    </div>
                    <p className="text-slate-600 italic mb-6">"{review.text}"</p>
                    <div className="flex items-center gap-3">
                      <img src={review.img + "?semt=ais_hybrid&w=150&q=80"} alt={review.name} className="w-12 h-12 rounded-full object-cover" />
                      <span className="font-bold text-sm text-slate-800">{review.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 8. NEWSLETTER + CAPTURA */}
            <section className="bg-slate-800 rounded-3xl p-8 md:p-16 relative overflow-hidden flex flex-col md:flex-row items-center gap-8">
              <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
                <Heart className="w-64 h-64 text-white -mb-20 -mr-10" />
              </div>
              <div className="flex-1 space-y-4 relative z-10 text-center md:text-left">
                <h2 className="text-3xl font-black text-white">Receba ofertas exclusivas para seu pet</h2>
                <p className="text-slate-300 text-lg">Dicas de saúde, novidades e cupons de desconto direto no seu email e whatsapp.</p>
              </div>
              <div className="w-full max-w-md relative z-10 space-y-3">
                <input type="email" placeholder="Seu melhor email" className="w-full px-4 py-3 rounded-xl border-none focus:ring-2 focus:ring-teal-400 bg-white/10 text-white placeholder-slate-400 outline-none" />
                <input type="text" placeholder="WhatsApp (Opcional)" className="w-full px-4 py-3 rounded-xl border-none focus:ring-2 focus:ring-teal-400 bg-white/10 text-white placeholder-slate-400 outline-none" />
                <button className="w-full bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold py-3 rounded-xl mt-2 transition-colors text-lg">
                  Quero Receber!
                </button>
              </div>
            </section>
          </main>
        </>
      )}
    </div>
  );
};

export default PetStoreLayout;
