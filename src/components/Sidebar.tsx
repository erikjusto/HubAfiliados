
import React, { useState } from 'react';
import { AppTab } from '@/types';
import { 
  History, 
  Settings, 
  ShoppingCart,
  Layout,
  LogOut,
  Code,
  Activity,
  ChevronDown
} from 'lucide-react';

interface SidebarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, onLogout }) => {
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    [AppTab.STOREFRONT]: true
  });

  const toggleMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenus(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const menuItems: { id: AppTab; label: string; icon: any; subItems?: { id: AppTab; label: string }[] }[] = [
    { id: AppTab.DASHBOARD_IA, label: 'Dashboard IA', icon: Activity },
    { id: AppTab.AI_PROMPTS, label: 'Prompt de IA', icon: Code },
    { id: AppTab.LINK_URL, label: 'Importar por URL', icon: Layout },
    { id: AppTab.PRODUCTS, label: 'Produtos', icon: History },
    { 
      id: AppTab.STOREFRONT, 
      label: 'Storefront', 
      icon: Layout,
      subItems: [
        { id: AppTab.STOREFRONT, label: 'Geral' },
        { id: AppTab.STOREFRONT_PET, label: 'Pet Shop' }
      ]
    },
    { id: AppTab.SETTINGS, label: 'Configurações', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col hidden lg:flex shadow-xl shrink-0 h-screen sticky top-0">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none">ML HUB</h1>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Admin Panel</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto">
        {menuItems.map((item) => (
          <div key={item.id}>
            <button
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                (activeTab === item.id || (item.subItems && item.subItems.some(sub => sub.id === activeTab)))
                  ? 'bg-blue-600 text-white shadow-md font-semibold' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-4">
                <item.icon className={`w-5 h-5 ${(activeTab === item.id || (item.subItems && item.subItems.some(sub => sub.id === activeTab))) ? 'text-white' : 'group-hover:text-blue-400 transition-colors'}`} />
                {item.label}
              </div>
              {item.subItems && (
                <div 
                  onClick={(e) => toggleMenu(item.id, e)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform ${openMenus[item.id] ? 'rotate-180' : ''}`} />
                </div>
              )}
            </button>
            {item.subItems && openMenus[item.id] && (
              <div className="pl-12 pr-4 pt-1 pb-2 space-y-1">
                {item.subItems.map(subItem => (
                  <button
                    key={subItem.id}
                    onClick={() => onTabChange(subItem.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeTab === subItem.id
                        ? 'bg-blue-600/20 text-blue-400 font-bold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {subItem.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-900">
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
