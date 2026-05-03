
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ImportRecord } from '@/types';
import { ML_CATEGORIES, ML_CATEGORY_ICONS } from '@/constants';
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
  Loader2,
  Plus,
  Minus,
  X
} from 'lucide-react';

interface StorefrontTabProps {
  history: ImportRecord[];
  onAdminClick?: () => void;
  isLoading?: boolean;
}

const StorefrontTab: React.FC<StorefrontTabProps> = ({ history, onAdminClick, isLoading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [showOnlyOffers, setShowOnlyOffers] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCategoriesMenu, setShowCategoriesMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ImportRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const productsRef = useRef<HTMLDivElement>(null);
  const categoriesHeaderRef = useRef<HTMLHeadingElement>(null);

  const [showSearchCategoryMenu, setShowSearchCategoryMenu] = useState(false);
  const searchCategoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchCategoryRef.current && !searchCategoryRef.current.contains(event.target as Node)) {
        setShowSearchCategoryMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const itemsPerPage = 12;

  const [banners, setBanners] = useState<{imageUrl: string, link: string}[]>([
    {
      imageUrl: "https://http2.mlstatic.com/storage/splinter-admin/o:f_webp,q_auto:best/1776861510450-2af59120-3e48-11f1-aa05-d1b3115a5fff.jpg",
      link: "https://lista.mercadolivre.com.br/_Container_ads-intel-refresh-2024"
    },
    {
      imageUrl: "https://http2.mlstatic.com/storage/splinter-admin/o:f_webp,q_auto:best/1776861319985-b96eea10-3e47-11f1-a927-d38d6cd8536e.png",
      link: "https://lista.mercadolivre.com.br/_Container_aipc-hp"
    },
    {
      imageUrl: "https://http2.mlstatic.com/storage/splinter-admin/o:f_webp,q_auto:best/1776863113451-e66c1bb0-3e4b-11f1-aa05-d1b3115a5fff.png",
      link: "https://lista.mercadolivre.com.br/_Container_it-appliances"
    },
    {
      imageUrl: "https://http2.mlstatic.com/storage/splinter-admin/o:f_webp,q_auto:best/1776863134932-f339d940-3e4b-11f1-aa05-d1b3115a5fff.png",
      link: "https://lista.mercadolivre.com.br/_Container_notebooks-qualcomm"
    }
  ]);
  const [isBannersLoading, setIsBannersLoading] = useState(false);

  const ML_MENU_CATEGORIES = [
    { name: "Veículos", categoryName: "Acessórios para Veículos", url: "#/" },
    { name: "Supermercado", categoryName: "Alimentos e Bebidas", url: "#/" },
    { name: "Tecnologia", url: "#/", subcategories: [
      { name: "Celulares e Telefones", categoryName: "Celulares e Telefones", url: "#/", items: ["Acessórios para Celulares", "Peças para Celular"] },
      { name: "Informática", categoryName: "Informática", url: "#/", items: ["Componentes para PC", "Impressão", "Acessórios para Notebook", "Conectividade e Redes", "Software", "Computadores", "Tablets e Acessórios"] },
      { name: "Câmeras e Acessórios", categoryName: "Câmeras e Acessórios", url: "#/", items: ["Acessórios para Câmeras", "Câmeras", "Filmadoras"] },
      { name: "Eletrônicos, Áudio e Vídeo", categoryName: "Eletrônicos, Áudio e Vídeo", url: "#/", items: ["Acessórios para Áudio e Vídeo", "Áudio Portátil e Acessórios", "Componentes Eletrônicos", "Equipamento para DJs", "Som Automotivo", "Drones e Acessórios", "Acessórios para TV", "Fones de Ouvido", "Áudio", "Projetores e Telas"] },
      { name: "Games", categoryName: "Games", url: "#/", items: ["Video Games", "Fliperamas e Arcade", "Digitais"] },
      { name: "Televisores", categoryName: "Eletrônicos, Áudio e Vídeo", url: "#/", items: [] }
    ]},
    { name: "Casa e Móveis", categoryName: "Casa, Móveis e Decoração", url: "#/" },
    { name: "Eletrodomésticos", categoryName: "Eletrodomésticos", url: "#/" },
    { name: "Esportes e Fitness", categoryName: "Esportes e Fitness", url: "#/" },
    { name: "Ferramentas", categoryName: "Ferramentas", url: "#/" },
    { name: "Construção", categoryName: "Construção", url: "#/" },
    { name: "Indústria e Comércio", categoryName: "Indústria e Comércio", url: "#/" },
    { name: "Pet Shop", categoryName: "Pet Shop", url: "#/" },
    { name: "Saúde", categoryName: "Saúde", url: "#/" },
    { name: "Acessórios para Veículos", categoryName: "Acessórios para Veículos", url: "#/" },
    { name: "Beleza e Cuidado Pessoal", categoryName: "Beleza e Cuidado Pessoal", url: "#/" },
    { name: "Moda", categoryName: "Calçados, Roupas e Bolsas", url: "#/" },
    { name: "Bebês", categoryName: "Bebês", url: "#/" },
    { name: "Brinquedos", categoryName: "Brinquedos e Hobbies", url: "#/" },
    { name: "Mais vendidos", categoryName: null, url: "#/" },
    { name: "Ver mais categorias", categoryName: null, url: "#/" }
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

  const activeCategories = useMemo(() => {
    return Object.keys(categoryMap).sort();
  }, [categoryMap]);

  useEffect(() => {
    if (activeCategories.length <= 1) return;
    const timer = setInterval(() => {
      const el = document.getElementById('category-slider');
      if (el) {
        if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 10) {
          el.scrollLeft = 0;
        } else {
          el.scrollLeft += 200;
        }
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [activeCategories.length]);

  const filteredProducts = useMemo(() => {
    // Sort history by date descending before filtering
    const sortedHistory = [...history].sort((a, b) => 
      new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime()
    );

    return sortedHistory.filter(item => {
      const searchLower = appliedSearchTerm.toLowerCase();
      const matchesSearch = 
        item.name.toLowerCase().includes(searchLower) ||
        (item.category && item.category.toLowerCase().includes(searchLower)) ||
        (item.description && item.description.toLowerCase().includes(searchLower));
      
      const matchesCategory = !selectedCategory || item.category === selectedCategory;
      const matchesSubcategory = !selectedSubcategory || item.subcategory === selectedSubcategory;
      const matchesOffers = !showOnlyOffers || (item.originalPrice && item.originalPrice.trim() !== '');
      return matchesSearch && matchesCategory && matchesSubcategory && matchesOffers;
    });
  }, [history, appliedSearchTerm, selectedCategory, selectedSubcategory, showOnlyOffers]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [appliedSearchTerm, selectedCategory, selectedSubcategory, showOnlyOffers]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const latestProducts = useMemo(() => {
    return [...history]
      .sort((a, b) => new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime())
      .slice(0, 8);
  }, [history]);

  const mobileProducts = useMemo(() => {
    return [...history]
      .filter(p => p.category === 'Celulares e Smartphones')
      .sort((a, b) => new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime())
      .slice(0, 8);
  }, [history]);

  const babyProducts = useMemo(() => {
    return [...history]
      .filter(p => p.category === 'Higiene e Cuidados com o Bebê')
      .sort((a, b) => new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime())
      .slice(0, 8);
  }, [history]);

  const renderProductCard = (product: ImportRecord) => (
    <div 
      key={product.id} 
      className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group border border-transparent hover:border-slate-200 flex flex-col h-full"
    >
      {/* Product Image */}
      <div 
        className="relative aspect-square bg-white p-2 md:p-4 flex items-center justify-center border-b border-slate-100 cursor-pointer"
        onClick={() => {
          setSelectedProduct(product);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      >
        <div className="w-full h-full flex items-center justify-center">
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
          />
        </div>
        <button 
          className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors shadow-sm z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <Heart className="w-4 h-4" />
        </button>
      </div>

      {/* Product Info */}
      <div className="p-2 md:p-4 space-y-1.5 md:space-y-2 flex-1 flex flex-col">
        <div className="min-h-[1rem] md:min-h-[1.25rem]">
          {product.originalPrice && (
            <span className="text-xs text-slate-400 line-through">
              {product.currency} {product.originalPrice}
            </span>
          )}
        </div>
        
        <div className="flex items-baseline gap-1.5">
          <div className="flex items-baseline text-slate-900">
            <span className="text-[10px] md:text-xs font-medium mr-0.5 md:mr-1">{product.currency}</span>
            <span className="text-xl md:text-3xl font-medium leading-none">
              {product.price.replace(',', '.').split('.')[0]}
            </span>
            <span className="text-xs md:text-sm font-medium self-start mt-0.5 md:mt-1">
              {product.price.replace(',', '.').split('.')[1] || '00'}
            </span>
          </div>
          
          {product.originalPrice && (
            <div className="bg-[#e6f7ee] text-[#00a650] text-[10px] md:text-[13px] font-semibold px-1 md:px-1.5 py-0.5 rounded-sm">
              {(() => {
                const orig = parseFloat(product.originalPrice.replace(',', '.'));
                const curr = parseFloat(product.price.replace(',', '.'));
                return Math.round(((orig - curr) / orig) * 100);
              })()}% OFF
            </div>
          )}
        </div>
        
        {product.installmentInfo && (
          <p className="text-xs text-slate-600">
            em <span className="text-green-600">{product.installmentInfo}</span>
          </p>
        )}

        <div className="flex items-center gap-1 text-green-600 font-bold text-xs">
          <Truck className="w-3 h-3" />
          <span>Frete grátis com MercadoFull</span>
        </div>

        <h3 
          className="text-xs md:text-sm text-slate-700 line-clamp-2 group-hover:text-blue-600 transition-colors cursor-pointer flex-1"
          onClick={() => {
            setSelectedProduct(product);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          {product.name}
        </h3>

        {product.subcategory && (
          <span className="inline-block bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded uppercase font-bold self-start">
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
          className="mt-2 md:mt-4 w-full py-2 bg-blue-600 text-white text-[11px] md:text-sm font-bold rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-1 md:gap-2"
        >
          Comprar no Mercado Livre
        </a>
      </div>
    </div>
  );

  const handleCategoryClick = (cat: string | null) => {
    setSelectedCategory(cat);
    setSelectedSubcategory(null);
    setShowOnlyOffers(false);
    setShowCategoriesMenu(false);
    setShowMobileMenu(false);
    
    // Scroll to products section
    if (productsRef.current) {
      const elementPosition = productsRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - 170; // 120 header + 50 extra
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleSubcategoryClick = (cat: string, sub: string) => {
    setSelectedCategory(cat);
    setSelectedSubcategory(sub);
    setShowOnlyOffers(false);
    setShowCategoriesMenu(false);
    setShowMobileMenu(false);

    // Scroll to products section
    if (productsRef.current) {
      const elementPosition = productsRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - 170; // 120 header + 50 extra
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleOffersClick = () => {
    setShowOnlyOffers(true);
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setShowCategoriesMenu(false);
    setShowMobileMenu(false);

    // Scroll to products section
    if (productsRef.current) {
      const elementPosition = productsRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - 170; // 120 header + 50 extra
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategory(prev => prev === cat ? null : cat);
  };

  const allCategories = Object.keys(ML_CATEGORIES).sort();

  const isPublicView = Boolean(onAdminClick);

  return (
    <div className={`min-h-screen bg-[#ebebeb] ${isPublicView ? 'mt-0' : '-mt-4 md:-mt-8'} ${isPublicView ? 'mx-0' : '-mx-4 md:-mx-8'}`}>
      <style dangerouslySetInnerHTML={{ __html: `
        .nav-header-visually-hidden {
          border: 0;
          clip: rect(1px, 1px, 1px, 1px);
          height: 1px;
          margin: -1px;
          overflow: hidden;
          padding: 0;
          position: absolute;
          width: 1px;
        }
        .nav-search {
          display: flex;
          background-color: #fff;
          border-radius: 2px;
          height: 40px;
          box-shadow: 0 1px 2px 0 rgba(0,0,0,.2);
          position: relative;
          width: 100%;
        }
        .nav-search-input {
          flex: 1;
          border: none;
          padding: 7px 15px;
          font-size: 16px;
          color: #333;
          outline: none;
          height: 100%;
          border-radius: 2px 0 0 2px;
          padding-right: 232px;
        }
        .nav-category {
          display: flex;
          align-items: center;
          background: none;
          border: none;
          border-left: 1px solid #e6e6e6;
          padding: 0 15px;
          cursor: pointer;
          height: 24px;
          margin: 8px 0;
          color: #666;
          font-size: 14px;
          white-space: nowrap;
          position: absolute;
          right: 45px;
          top: 0;
        }
        .nav-category:hover {
          color: #3483fa;
        }
        .nav-header-search-chevron {
          border-style: solid;
          border-width: 1px 1px 0 0;
          content: "";
          display: inline-block;
          height: 5px;
          margin-left: 8px;
          position: relative;
          top: -1px;
          transform: rotate(135deg);
          vertical-align: middle;
          width: 5px;
          transition: transform 0.2s;
        }
        .nav-header-search-chevron.active {
          transform: rotate(-45deg);
          top: 1px;
        }
        .nav-search-btn {
          background: none;
          border: none;
          border-left: 1px solid #e6e6e6;
          padding: 0 15px;
          cursor: pointer;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: absolute;
          right: 0;
          top: 0;
        }
        .nav-icon-search {
          width: 18px;
          height: 18px;
          color: #666;
        }
        .nav-category-content-options-desktop {
          position: absolute;
          top: 100%;
          right: 45px;
          background: #fff;
          box-shadow: 0 4px 8px rgba(0,0,0,.1);
          border: 1px solid #e6e6e6;
          border-radius: 0 0 4px 4px;
          z-index: 100;
          width: 250px;
        }
        .nav-category-list-options {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .nav-category-content-options {
          display: flex;
          align-items: center;
          padding: 10px 15px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .nav-category-content-options:hover {
          background: #f5f5f5;
        }
        .nav-category-content-options input[type="radio"] {
          margin: 0;
          cursor: pointer;
        }
        .nav-category-content-options label {
          margin-left: 10px;
          font-size: 14px;
          color: #333;
          cursor: pointer;
          flex: 1;
        }
        .image-option {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          object-fit: cover;
          margin-left: 8px;
        }
        @media (max-width: 768px) {
          .nav-category {
            display: none;
          }
          .nav-search-input {
            padding-right: 45px !important;
          }
          .nav-search-btn {
            right: 0;
          }
        }

        /* ========= DESCRIPTION CONTENT STYLES ========= */
        /* Links e botões dentro da descrição longa do produto */
        .product-long-description .description-content a {
          color: #3483fa;
          text-decoration: underline;
          text-underline-offset: 2px;
          font-weight: 600;
          transition: color 0.2s, opacity 0.2s;
          cursor: pointer;
          word-break: break-word;
        }
        .product-long-description .description-content a:hover {
          color: #2968c8;
          opacity: 0.85;
        }
        .product-long-description .description-content a:visited {
          color: #6b46c1;
        }

        /* CTA Links - Destaque para links de compra */
        .product-long-description .description-content p > strong > a,
        .product-long-description .description-content a[href*="mercadolivre"],
        .product-long-description .description-content a[href*="meli.la"] {
          display: inline-block;
          background: linear-gradient(135deg, #3483fa 0%, #2968c8 100%);
          color: #fff !important;
          text-decoration: none !important;
          padding: 14px 32px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 16px;
          letter-spacing: 0.3px;
          box-shadow: 0 4px 14px rgba(52, 131, 250, 0.35);
          transition: all 0.3s ease;
          margin: 16px 0;
        }
        .product-long-description .description-content p > strong > a:hover,
        .product-long-description .description-content a[href*="mercadolivre"]:hover,
        .product-long-description .description-content a[href*="meli.la"]:hover {
          background: linear-gradient(135deg, #2968c8 0%, #1a4fa0 100%);
          box-shadow: 0 6px 20px rgba(52, 131, 250, 0.5);
          transform: translateY(-2px);
          color: #fff !important;
        }

        /* Buttons within HTML descriptions */
        .product-long-description .description-content button,
        .product-long-description .description-content .btn,
        .product-long-description .description-content [role="button"] {
          display: inline-block;
          background: linear-gradient(135deg, #3483fa 0%, #2968c8 100%);
          color: #fff;
          border: none;
          padding: 12px 28px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(52, 131, 250, 0.3);
          transition: all 0.3s ease;
        }
        .product-long-description .description-content button:hover,
        .product-long-description .description-content .btn:hover,
        .product-long-description .description-content [role="button"]:hover {
          background: linear-gradient(135deg, #2968c8 0%, #1a4fa0 100%);
          box-shadow: 0 6px 20px rgba(52, 131, 250, 0.5);
          transform: translateY(-2px);
        }

        /* Heading hierarchy within description */
        .product-long-description .description-content h2 {
          font-size: 1.5rem;
          font-weight: 800;
          color: #1e293b;
          margin: 2rem 0 0.75rem;
          line-height: 1.3;
        }
        .product-long-description .description-content h3 {
          font-size: 1.2rem;
          font-weight: 700;
          color: #334155;
          margin: 1.5rem 0 0.5rem;
          line-height: 1.4;
        }
        .product-long-description .description-content p {
          margin: 0.75rem 0;
          line-height: 1.8;
          color: #475569;
        }
        .product-long-description .description-content ul,
        .product-long-description .description-content ol {
          padding-left: 1.5rem;
          margin: 1rem 0;
        }
        .product-long-description .description-content li {
          margin: 0.4rem 0;
          line-height: 1.7;
          color: #475569;
        }
        .product-long-description .description-content strong {
          color: #1e293b;
          font-weight: 700;
        }
        .product-long-description .description-content img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1rem 0;
        }
        .product-long-description .description-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
        }
        .product-long-description .description-content th,
        .product-long-description .description-content td {
          border: 1px solid #e2e8f0;
          padding: 10px 14px;
          text-align: left;
        }
        .product-long-description .description-content th {
          background: #f8fafc;
          font-weight: 700;
          color: #1e293b;
        }
      `}} />
      {/* Mercado Livre Style Header */}
      <header className="bg-[#fff159] pt-2 pb-3 px-4 md:px-8 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-4">
            {/* Mobile Hamburger & Logo */}
            <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
              <button 
                className="lg:hidden p-1 -ml-1 text-slate-800 hover:bg-black/5 rounded"
                onClick={() => setShowMobileMenu(true)}
              >
                <Menu className="w-6 h-6" />
              </button>
              <img 
                src="https://shopifybrasil.com.br/wp-content/uploads/2026/01/shopifybrasil.png" 
                alt="Shopify Brasil Logo" 
                className="h-10 md:h-12 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Search Bar (Mercado Livre Style) */}
            <div className="flex-1 w-full relative">
              <form 
                className="nav-search" 
                role="search" 
                onSubmit={(e) => {
                  e.preventDefault();
                  setAppliedSearchTerm(searchTerm);
                  
                  if (searchTerm.trim() !== '') {
                    if (selectedProduct) setSelectedProduct(null);
                    
                    // Global search: clear other filters to ensure results are found
                    setSelectedCategory(null);
                    setSelectedSubcategory(null);
                    setShowOnlyOffers(false);

                    // Scroll to products section
                    setTimeout(() => {
                      if (productsRef.current) {
                        const elementPosition = productsRef.current.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - 150;
                        window.scrollTo({
                          top: offsetPosition,
                          behavior: 'smooth'
                        });
                      }
                    }, 100);
                  }
                }}
              >
                <label className="nav-header-visually-hidden" htmlFor="cb1-edit">Digite o que você quer encontrar</label>
                <input 
                  type="text" 
                  className="nav-search-input" 
                  id="cb1-edit" 
                  placeholder="Buscar produtos, marcas e muito mais…" 
                  maxLength={120}
                  autoCapitalize="off" 
                  autoCorrect="off" 
                  spellCheck="false" 
                  autoComplete="off" 
                  name="as_word" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

                {searchTerm && (
                  <button 
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setAppliedSearchTerm('');
                    }}
                    className="absolute right-[110px] md:right-[240px] top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-slate-500 transition-colors z-10"
                    aria-label="Limpar busca"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                <button 
                  type="button" 
                  id="mlCategory" 
                  className="nav-category"
                  onClick={() => setShowSearchCategoryMenu(!showSearchCategoryMenu)}
                >
                  <span id="category-label" className="max-w-[120px] truncate">
                    {selectedCategory ? `em ${selectedCategory}` : 'em todo Mercado Livre'}
                  </span>
                  <span className={`nav-header-search-chevron ${showSearchCategoryMenu ? 'active' : ''}`} id="search-chevron"></span>
                </button>

                {showSearchCategoryMenu && (
                  <div className="nav-category-content-options-desktop" id="categoryListContainer" ref={searchCategoryRef}>
                    <ul className="nav-category-list-options" id="categoryList">
                      <li 
                        className="nav-category-content-options"
                        onClick={() => {
                          setSelectedCategory(null);
                          setSelectedSubcategory(null);
                          setShowSearchCategoryMenu(false);
                        }}
                      >
                        <input type="radio" id="em todo Mercado Livre" name="navigations-options" checked={!selectedCategory} readOnly />
                        <img className="image-option rounded-full object-cover" src="https://http2.mlstatic.com/D_NQ_NP_799205-MLA74508030657_022024-O.jpg" alt="" />
                        <label htmlFor="em todo Mercado Livre">em todo Mercado Livre</label>
                      </li>
                      {activeCategories.slice(0, 8).map(cat => (
                        <li 
                          key={cat}
                          className="nav-category-content-options"
                          onClick={() => {
                            handleCategoryClick(cat);
                            setShowSearchCategoryMenu(false);
                          }}
                        >
                          <input type="radio" id={`em ${cat}`} name="navigations-options" checked={selectedCategory === cat} readOnly />
                          <img 
                            className="image-option rounded-full object-cover" 
                            src={ML_CATEGORY_ICONS[cat] || (cat === 'Cães' ? 'https://img.freepik.com/fotos-gratis/uma-bela-foto-de-diferentes-racas-de-caes-a-descansar_181624-19887.jpg?semt=ais_hybrid&w=740&q=80' : `https://picsum.photos/seed/${cat}/50`)} 
                            alt="" 
                          />
                          <label htmlFor={`em ${cat}`} className="truncate">em {cat}</label>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button type="submit" className="nav-search-btn">
                  <div role="img" aria-label="Buscar" className="nav-icon-search">
                    <Search className="w-full h-full" />
                  </div>
                </button>
              </form>
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
              <span>Categorias</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showCategoriesMenu ? 'rotate-180' : ''}`} />
              
              {/* Categories Dropdown Menu (Mercado Livre Style) */}
              {showCategoriesMenu && (
                <div className="absolute top-full left-0 mt-0 w-[1000px] bg-[#333] shadow-2xl rounded-b-md overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 duration-200 flex">
                  {/* Departments List */}
                  <div className="w-[260px] bg-[#333] py-4">
                    <ul className="space-y-0">
                      {ML_MENU_CATEGORIES.map((cat, idx) => (
                        <li key={idx} className="group/item">
                          <a 
                            href={cat.url}
                            className={`block px-6 py-3 text-[14px] text-white hover:bg-blue-600 transition-colors flex items-center justify-between ${cat.name === 'Tecnologia' ? 'bg-blue-600' : ''}`}
                            onClick={(e) => {
                              e.preventDefault();
                              if (cat.categoryName !== undefined) {
                                handleCategoryClick(cat.categoryName as string);
                              }
                            }}
                          >
                            {cat.name}
                            {cat.subcategories && <ChevronRight className="w-4 h-4 text-white/50" />}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Detail Section (Tecnologia example) */}
                  <div className="flex-1 bg-white p-8">
                    <div className="mb-6 border-b border-slate-100 pb-4">
                      <h2 className="text-2xl font-bold text-slate-800">Tecnologia</h2>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-8">
                      {ML_MENU_CATEGORIES.find(c => c.name === 'Tecnologia')?.subcategories?.map((sub, idx) => (
                        <div key={idx} className="space-y-3">
                          <h3 className="font-bold text-slate-800 text-[15px] hover:text-blue-600 cursor-pointer">
                            <a 
                              href={sub.url}
                              onClick={(e) => {
                                e.preventDefault();
                                if (sub.categoryName) {
                                  handleCategoryClick(sub.categoryName);
                                }
                              }}
                            >
                              {sub.name}
                            </a>
                          </h3>
                          <ul className="space-y-1.5">
                            {sub.items.map((item, i) => (
                              <li key={i}>
                                <a 
                                  href="#" 
                                  className="text-[13px] text-slate-500 hover:text-blue-600 transition-colors"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    // For items, we could potentially filter by subcategory
                                    // But handleCategoryClick currently only takes category
                                    // Let's just filter by the parent subcategory's categoryName for now
                                    if (sub.categoryName) {
                                      handleCategoryClick(sub.categoryName);
                                    }
                                  }}
                                >
                                  {item}
                                </a>
                              </li>
                            ))}
                          </ul>
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
      {/* Banner Slide (Only show if no product selected) */}
      {!selectedProduct && (
        <div className="w-full overflow-hidden relative group h-[150px] sm:h-[200px] md:h-[340px] bg-[#ebebeb] mt-0 pt-0">
          {isBannersLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : (
            <>
              <div 
                className="flex transition-transform duration-700 ease-in-out h-full"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {banners.map((banner, index) => (
                  <div 
                    key={index} 
                    className="min-w-full h-full relative block"
                  >
                    <img 
                      src={banner.imageUrl} 
                      alt={`Banner Promocional ${index + 1}`} 
                      className="w-full h-full object-cover object-top"
                      referrerPolicy="no-referrer"
                      loading={index === 0 ? "eager" : "lazy"}
                      decoding="async"
                    />
                    {/* Bottom gradient to blend with background */}
                    <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#ebebeb] to-transparent pointer-events-none" />
                  </div>
                ))}
              </div>

              {banners.length > 1 && (
                <>
                  {/* Navigation Arrows */}
                  <button 
                    onClick={prevSlide}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white shadow-md rounded-full flex items-center justify-center text-blue-600 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10"
                    aria-label="Slide anterior"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white shadow-md rounded-full flex items-center justify-center text-blue-600 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10"
                    aria-label="Próximo slide"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>

                  {/* Navigation Dots Removed */}
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Benefits Bar */}
      {/* Benefits Bar moved to footer */}

      <main className={`max-w-7xl mx-auto px-4 md:px-8 pt-0 pb-12 ${!selectedProduct ? 'mt-0.5' : 'mt-[60px]'} relative z-10`}>
        {/* Navegue por Categorias Section */}
        {!selectedProduct && activeCategories.length > 0 && (
          <div className="mb-12 mt-[50px] relative z-20">
            <h2 className="text-xl md:text-2xl font-black text-slate-800 mb-4 uppercase tracking-tight">
              Compre por Categoria
            </h2>
            <div className="relative group/slider">
              <div 
                className="flex items-start gap-8 overflow-x-auto pb-6 scrollbar-hide px-4 md:px-0 scroll-smooth"
                id="category-slider"
              >
                {activeCategories.map((cat) => (
                  <div 
                    key={cat} 
                    className="flex flex-col items-center gap-4 shrink-0 cursor-pointer group/item"
                    onClick={() => handleCategoryClick(cat)}
                  >
                    <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-white border border-slate-100 shadow-sm overflow-hidden flex items-center justify-center group-hover/item:shadow-md transition-all group-hover/item:scale-105 duration-300">
                      <img 
                        src={ML_CATEGORY_ICONS[cat] || (cat === 'Cães' ? 'https://img.freepik.com/fotos-gratis/uma-bela-foto-de-diferentes-racas-de-caes-a-descansar_181624-19887.jpg?semt=ais_hybrid&w=740&q=80' : `https://picsum.photos/seed/${cat}/300`)} 
                        alt={cat}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <span className="text-sm font-bold text-slate-700 group-hover/item:text-blue-600 transition-colors text-center max-w-[120px]">
                      {cat}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Navigation Buttons */}
              <button 
                onClick={() => {
                  const el = document.getElementById('category-slider');
                  if (el) el.scrollLeft -= 300;
                }}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center text-slate-400 hover:text-blue-600 opacity-0 group-hover/slider:opacity-100 transition-opacity z-10 border border-slate-100"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button 
                onClick={() => {
                  const el = document.getElementById('category-slider');
                  if (el) el.scrollLeft += 300;
                }}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center text-slate-400 hover:text-blue-600 opacity-0 group-hover/slider:opacity-100 transition-opacity z-10 border border-slate-100"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {selectedProduct ? (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 md:p-10">
              <div className="flex flex-col lg:flex-row gap-12">
                {/* Product Image */}
                <div className="lg:w-1/2 space-y-4">
                  <div className="aspect-square bg-white border border-slate-100 rounded-lg p-8 flex items-center justify-center">
                    <img 
                      src={selectedProduct.imageUrl} 
                      alt={selectedProduct.name}
                      className="max-w-full max-h-full object-contain"
                      referrerPolicy="no-referrer"
                      decoding="async"
                    />
                  </div>
                </div>

                {/* Product Info */}
                <div className="lg:w-1/2 space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>Novo</span>
                      <span>|</span>
                      <span>124 vendidos</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 leading-tight">
                      {selectedProduct.name}
                    </h1>
                    <div className="flex items-center gap-1">
                      <div className="flex text-blue-500">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-current" />
                        ))}
                      </div>
                      <span className="text-sm text-slate-400 font-bold">4.8 (124 opiniões)</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {selectedProduct.originalPrice && (
                      <span className="text-lg text-slate-400 line-through">
                        {selectedProduct.currency} {selectedProduct.originalPrice}
                      </span>
                    )}
                    <div className="flex items-baseline gap-2">
                      <div className="flex items-baseline text-slate-900">
                        <span className="text-xl font-medium mr-1">{selectedProduct.currency}</span>
                        <span className="text-5xl font-medium leading-none">
                          {selectedProduct.price.replace(',', '.').split('.')[0]}
                        </span>
                        <span className="text-2xl font-medium self-start mt-1">
                          {selectedProduct.price.replace(',', '.').split('.')[1] || '00'}
                        </span>
                      </div>
                      {selectedProduct.originalPrice && (
                        <span className="text-lg text-green-600 font-semibold">
                          {(() => {
                            const orig = parseFloat(selectedProduct.originalPrice.replace(',', '.'));
                            const curr = parseFloat(selectedProduct.price.replace(',', '.'));
                            return Math.round(((orig - curr) / orig) * 100);
                          })()}% OFF
                        </span>
                      )}
                    </div>
                    {selectedProduct.installmentInfo && (
                      <p className="text-slate-700">
                        em <span className="text-green-600 font-medium">{selectedProduct.installmentInfo}</span>
                      </p>
                    )}
                  </div>

                  <div className="p-4 bg-slate-50 rounded-lg space-y-4">
                    <div className="flex items-start gap-3">
                      <Truck className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-green-600">Frete grátis com MercadoFull</p>
                        <p className="text-xs text-slate-500">Saiba os prazos de entrega e as formas de envio.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-green-600">Compra Garantida</p>
                        <p className="text-xs text-slate-500">Receba o produto que está esperando ou devolvemos o seu dinheiro.</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <a 
                      href={selectedProduct.affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full py-4 bg-blue-600 text-white text-center font-bold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Comprar no Mercado Livre
                    </a>
                  </div>
                </div>
              </div>

              {/* Description & SEO Content */}
              <div className="mt-16 pt-12 border-t border-slate-100">
                <div className="max-w-4xl">
                  <h2 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-2">
                    <Package className="w-6 h-6 text-blue-600" />
                    Descrição do Produto
                  </h2>
                  
                  <article 
                    className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-6 product-long-description"
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
                        },
                        ...(selectedProduct.originalPrice ? {
                          "priceSpecification": {
                            "@type": "UnitPriceSpecification",
                            "price": selectedProduct.originalPrice?.replace(',', '.'),
                            "priceCurrency": "BRL",
                            "priceType": "https://schema.org/ListPrice"
                          }
                        } : {})
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
                                // Add aria-label for accessibility
                                if (!a.getAttribute('aria-label')) {
                                  a.setAttribute('aria-label', `Ir para: ${a.textContent || a.href}`);
                                }
                              });
                            }
                          }}
                        />
                      ) : (
                        <div className="description-content text-lg">
                          {selectedProduct.longDescription.split('\n').map((line, i) => (
                            line.trim() ? <p key={i} className="mb-4">{line}</p> : <div key={i} className="h-2"></div>
                          ))}
                        </div>
                      )
                    ) : (
                      <div className="whitespace-pre-line text-lg">
                        {selectedProduct.description}
                      </div>
                    )}

                    {/* CTA Button (always visible below description) */}
                    {selectedProduct.affiliateUrl && (
                      <div className="mt-8 pt-6 border-t border-slate-100">
                        <a 
                          href={selectedProduct.affiliateUrl}
                          target="_blank"
                          rel="noopener noreferrer sponsored"
                          className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#3483fa] to-[#2968c8] text-white font-bold text-lg rounded-lg shadow-lg hover:shadow-xl hover:from-[#2968c8] hover:to-[#1a4fa0] transition-all duration-300 hover:-translate-y-0.5"
                          aria-label={`Comprar ${selectedProduct.name} no Mercado Livre`}
                        >
                          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                          </svg>
                          COMPRAR NO MERCADO LIVRE
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                            <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                          </svg>
                        </a>
                      </div>
                    )}
                  </article>

                  {/* SEO Tags / Keywords */}
                  {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                    <div className="mt-12 pt-8 border-t border-slate-50">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Tags Relacionadas</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedProduct.tags.map((tag, idx) => (
                          <span 
                            key={idx}
                            className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Sidebar Filters */}
            <aside className="hidden lg:block w-64 shrink-0 space-y-8 sticky top-[120px]">
              {/* Categories */}
              <div>
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2" ref={categoriesHeaderRef}>
                  <Filter className="w-4 h-4" /> Categorias
                </h3>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li 
                    className={`cursor-pointer hover:text-blue-600 transition-colors ${!selectedCategory ? 'font-bold text-blue-600' : ''}`}
                    onClick={() => handleCategoryClick(null)}
                  >
                    Todas as categorias
                  </li>
                  {(Object.entries(categoryMap) as [string, Set<string>][]).sort().map(([cat, subs]) => {
                    const isExpanded = expandedCategory === cat;
                    return (
                      <li key={cat} className="space-y-1">
                        <div className="flex items-center justify-between group">
                          <div 
                            className={`cursor-pointer hover:text-blue-600 transition-colors flex-1 py-1 ${selectedCategory === cat && !selectedSubcategory ? 'font-bold text-blue-600' : ''}`}
                            onClick={() => handleCategoryClick(cat)}
                          >
                            {cat}
                          </div>
                          {subs.size > 0 && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); toggleCategory(cat); }}
                              className="p-1 -mr-1 text-slate-400 hover:text-blue-600"
                            >
                              {isExpanded ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                        {subs.size > 0 && isExpanded && (
                          <ul className="ml-4 space-y-1 border-l border-slate-200 pl-3 mt-1 mb-2">
                            {Array.from(subs).sort().map((sub: string) => (
                              <li 
                                key={sub}
                                className={`cursor-pointer text-xs hover:text-blue-600 transition-colors py-1.5 ${selectedSubcategory === sub ? 'font-bold text-blue-600' : ''}`}
                                onClick={() => handleSubcategoryClick(cat, sub)}
                              >
                                {sub}
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Other Filters Placeholder */}
            </aside>

            {/* Product Grid */}
            <div className="flex-1" ref={productsRef}>
              {(appliedSearchTerm || selectedCategory || selectedSubcategory || showOnlyOffers) && !isLoading && filteredProducts.length > 0 && (
                <div className="mb-6 flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Filter className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">
                      {appliedSearchTerm ? `Resultados para "${appliedSearchTerm}"` : 'Filtros aplicados'}
                      {selectedCategory && ` em ${selectedCategory}`}
                      {selectedSubcategory && ` > ${selectedSubcategory}`}
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      setSearchTerm('');
                      setAppliedSearchTerm('');
                      setSelectedCategory(null);
                      setSelectedSubcategory(null);
                      setShowOnlyOffers(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-md transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Limpar filtros
                  </button>
                </div>
              )}

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
                    onClick={() => {
                      setSearchTerm('');
                      setAppliedSearchTerm('');
                      setSelectedCategory(null);
                      setSelectedSubcategory(null);
                      setShowOnlyOffers(false);
                    }}
                    className="mt-6 text-blue-600 font-bold hover:underline"
                  >
                    Limpar todos os filtros
                  </button>
                </div>
              ) : (
                <div className="space-y-12">
                  {/* Custom Home Sections if no filters applied */}
                  {!(appliedSearchTerm || selectedCategory || selectedSubcategory || showOnlyOffers) ? (
                    <>
                      {/* ACABARAM DE CHEGAR */}
                      <section className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <h2 className="text-xl md:text-2xl font-bold text-slate-800 uppercase tracking-tight">ACABARAM DE CHEGAR</h2>
                          <button className="text-blue-600 font-bold text-sm hover:underline">Ver tudo</button>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
                          {latestProducts.map(renderProductCard)}
                        </div>
                      </section>

                      {/* Celulares e Smartphones */}
                      {mobileProducts.length > 0 && (
                        <section className="space-y-6">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                            <h2 className="text-xl md:text-2xl font-bold text-slate-800 uppercase tracking-tight">Celulares e Smartphones</h2>
                            <button 
                              onClick={() => handleCategoryClick('Celulares e Smartphones')}
                              className="text-blue-600 font-bold text-sm hover:underline"
                            >
                              Ver tudo
                            </button>
                          </div>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
                            {mobileProducts.map(renderProductCard)}
                          </div>
                        </section>
                      )}

                      {/* Higiene e Cuidados com o Bebê */}
                      {babyProducts.length > 0 && (
                        <section className="space-y-6">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                            <h2 className="text-xl md:text-2xl font-bold text-slate-800 uppercase tracking-tight">Higiene e Cuidados com o Bebê</h2>
                            <button 
                              onClick={() => handleCategoryClick('Higiene e Cuidados com o Bebê')}
                              className="text-blue-600 font-bold text-sm hover:underline"
                            >
                              Ver tudo
                            </button>
                          </div>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
                            {babyProducts.map(renderProductCard)}
                          </div>
                        </section>
                      )}

                      {/* All other products (Main Feed) */}
                      <section className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <h2 className="text-xl md:text-2xl font-bold text-slate-800 uppercase tracking-tight">Mais Produtos</h2>
                        </div>
                        <div className="grid grid-cols-2 xl:grid-cols-3 gap-2 md:gap-4">
                          {paginatedProducts.map(renderProductCard)}
                        </div>
                      </section>
                    </>
                  ) : (
                    <div className="grid grid-cols-2 xl:grid-cols-3 gap-2 md:gap-4">
                      {paginatedProducts.map(renderProductCard)}
                    </div>
                  )}

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-8">
                      <button
                        onClick={() => {
                          setCurrentPage(prev => Math.max(1, prev - 1));
                          if (productsRef.current) {
                            const elementPosition = productsRef.current.getBoundingClientRect().top;
                            const offsetPosition = elementPosition + window.pageYOffset - 150;
                            window.scrollTo({
                              top: offsetPosition,
                              behavior: 'smooth'
                            });
                          }
                        }}
                        disabled={currentPage === 1}
                        className="p-2 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {[...Array(totalPages)].map((_, i) => {
                          const pageNum = i + 1;
                          if (
                            pageNum === 1 || 
                            pageNum === totalPages || 
                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                          ) {
                            return (
                              <button
                                key={pageNum}
                                onClick={() => {
                                  setCurrentPage(pageNum);
                                  if (productsRef.current) {
                                    const elementPosition = productsRef.current.getBoundingClientRect().top;
                                    const offsetPosition = elementPosition + window.pageYOffset - 150;
                                    window.scrollTo({
                                      top: offsetPosition,
                                      behavior: 'smooth'
                                    });
                                  }
                                }}
                                className={`w-10 h-10 rounded-md text-sm font-medium transition-colors ${
                                  currentPage === pageNum 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          } else if (
                            (pageNum === 2 && currentPage > 3) || 
                            (pageNum === totalPages - 1 && currentPage < totalPages - 2)
                          ) {
                            return <span key={pageNum} className="px-1 text-slate-400">...</span>;
                          }
                          return null;
                        })}
                      </div>

                      <button
                        onClick={() => {
                          setCurrentPage(prev => Math.min(totalPages, prev + 1));
                          if (productsRef.current) {
                            const elementPosition = productsRef.current.getBoundingClientRect().top;
                            const offsetPosition = elementPosition + window.pageYOffset - 150;
                            window.scrollTo({
                              top: offsetPosition,
                              behavior: 'smooth'
                            });
                          }
                        }}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-20">
        
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
        
        {/* Benefits Bar */}
        <div className="bg-white border-t border-gray-200 py-8 hidden md:block relative z-20 shadow-sm mt-12">
          <div className="max-w-7xl mx-auto px-4 md:px-8 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <Truck className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Frete grátis com MercadoFull</p>
                <p className="text-xs text-slate-500">Em milhões de produtos</p>
              </div>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Compra garantida</p>
                <p className="text-xs text-slate-500">Receba o que esperava ou devolvemos</p>
              </div>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <Star className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Melhores marcas</p>
                <p className="text-xs text-slate-500">Os melhores produtos do mercado</p>
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

      {/* Mobile Menu Drawer */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-[100] flex lg:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowMobileMenu(false)} />
          <div className="relative w-4/5 max-w-sm bg-white h-full shadow-xl flex flex-col animate-in slide-in-from-left duration-300">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-[#fff159]">
              <div className="flex items-center gap-2">
                <Menu className="w-5 h-5 text-slate-800" />
                <span className="font-bold text-slate-800">Menu</span>
              </div>
              <button onClick={() => setShowMobileMenu(false)} className="p-2 -mr-2 hover:bg-black/5 rounded-full">
                <X className="w-5 h-5 text-slate-800" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Filter className="w-5 h-5" /> Categorias
              </h3>
              <ul className="space-y-4 text-base text-slate-600">
                <li 
                  className={`cursor-pointer hover:text-blue-600 transition-colors ${!selectedCategory ? 'font-bold text-blue-600' : ''}`}
                  onClick={() => handleCategoryClick(null)}
                >
                  Todas as categorias
                </li>
                {(Object.entries(categoryMap) as [string, Set<string>][]).sort().map(([cat, subs]) => {
                  const isExpanded = expandedCategory === cat;
                  return (
                    <li key={cat} className="space-y-2 border-b border-slate-50 pb-2">
                      <div className="flex items-center justify-between group">
                        <div 
                          className={`cursor-pointer hover:text-blue-600 transition-colors flex-1 py-1 ${selectedCategory === cat && !selectedSubcategory ? 'font-bold text-blue-600' : ''}`}
                          onClick={() => handleCategoryClick(cat)}
                        >
                          {cat}
                        </div>
                        {subs.size > 0 && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleCategory(cat); }}
                            className="p-2 -mr-2 text-slate-400 hover:text-blue-600 bg-slate-50 rounded-full"
                          >
                            {isExpanded ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                          </button>
                        )}
                      </div>
                      {subs.size > 0 && isExpanded && (
                        <ul className="ml-4 space-y-2 border-l-2 border-blue-100 pl-4 mt-3 mb-4">
                          {Array.from(subs).sort().map((sub: string) => (
                            <li 
                              key={sub}
                              className={`cursor-pointer text-sm hover:text-blue-600 transition-colors py-1.5 ${selectedSubcategory === sub ? 'font-bold text-blue-600' : ''}`}
                              onClick={() => handleSubcategoryClick(cat, sub)}
                            >
                              {sub}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <div 
                  className={`cursor-pointer py-2 hover:text-blue-600 transition-colors ${showOnlyOffers ? 'font-bold text-blue-600' : 'text-slate-600'}`}
                  onClick={handleOffersClick}
                >
                  Ofertas
                </div>
                {onAdminClick && (
                  <button 
                    onClick={() => { setShowMobileMenu(false); onAdminClick(); }}
                    className="mt-4 w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Painel Admin
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
