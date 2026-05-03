
import React from 'react';
import { AppTab } from '@/types';
import { ShoppingCart } from 'lucide-react';

interface HeaderProps {
  activeTab: AppTab;
}

const Header: React.FC<HeaderProps> = ({ activeTab }) => {
  const getTitle = () => {
    switch(activeTab) {
      case AppTab.AFFILIATE: return 'Produto Afiliado (Perfil)';
      case AppTab.LINK_PRODUCT: return 'Link Produto (Afiliado)';
      case AppTab.LINK_URL: return 'Importar via URL';
      case AppTab.PRODUCTS: return 'Gerenciar Produtos';
      case AppTab.STOREFRONT: return 'Storefront (Modelo ML)';
      case AppTab.STOREFRONT_PET: return 'Storefront (Petshop)';
      case AppTab.SETTINGS: return 'Configurações do Aplicativo';
      default: return 'Painel de Controle';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-4 lg:hidden">
         <div className="w-8 h-8 bg-yellow-400 rounded flex items-center justify-center text-slate-900">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <h1 className="font-bold text-slate-800">ML Afiliados</h1>
      </div>

      <h2 className="hidden lg:block text-lg font-semibold text-slate-800">{getTitle()}</h2>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex flex-col items-end mr-2">
          <span className="text-sm font-medium text-slate-700 leading-none">Administrador</span>
          <span className="text-[10px] text-slate-400">Especialista WooCommerce</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 overflow-hidden">
          <img src="https://picsum.photos/seed/admin/100" alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
      </div>
    </header>
  );
};

export default Header;
