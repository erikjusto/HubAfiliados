
import React from 'react';
import { AppTab } from '../types';
import { 
  History, 
  Settings, 
  ShoppingCart,
  Database,
  UserCheck,
  Layout,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, onLogout }) => {
  const menuItems = [
    { id: AppTab.IMPORT, label: 'Importar Produto', icon: UserCheck },
    { id: AppTab.PRODUCTS, label: 'Produtos', icon: History },
    { id: AppTab.STOREFRONT, label: 'Storefront', icon: Layout },
    { id: AppTab.SETTINGS, label: 'Configurações', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col hidden lg:flex shadow-xl shrink-0">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none">HUB AFILIADOS</h1>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Admin Panel</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 mt-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${
              activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-md font-semibold' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : 'group-hover:text-blue-400 transition-colors'}`} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Sair do Painel
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
