
import React, { useState, useEffect } from 'react';
import { AppTab, ProductData, ImportRecord, WooCommerceConfig } from '@/types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AffiliateTab from './components/AffiliateTab';
import LinkProductTab from './components/LinkProductTab';
import LinkUrlTab from './components/LinkUrlTab';
import ProductsTab from './components/ProductsTab';
import StorefrontTab from './components/StorefrontTab';
import PetStoreLayout from './components/PetStoreLayout';
import SettingsTab from './components/SettingsTab';
import LoginComponent from './components/LoginComponent';
import { getWooProducts, updateWooProduct, deleteWooProduct } from '@/services/wooService';

import GeminiDashboard from './components/GeminiDashboard';
import AIPromptTab from './components/AIPromptTab';

const App: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [showLogin, setShowLogin] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD_IA);
  const [history, setHistory] = useState<ImportRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [prefilledUrl, setPrefilledUrl] = useState<string>('');
  
  // Inicializamos com a URL e as chaves fornecidas pelo usuário
  const [wooConfig, setWooConfig] = useState<WooCommerceConfig>({
    url: import.meta.env.VITE_WOO_URL || 'https://shopifybrasil.com.br/',
    consumerKey: import.meta.env.VITE_WOO_CK || 'ck_408f106abd650aff5c87fd369c3904c510dd0ec5',
    consumerSecret: import.meta.env.VITE_WOO_CS || 'cs_82a9e6b58684c5475fdb6c1664e4adcf38b5b628'
  });

  // Load history, config and auth from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('ml_woo_config');
    let currentConfig = wooConfig;
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      currentConfig = { ...wooConfig, ...parsed };
      setWooConfig(currentConfig);
    }

    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const wooProducts = await getWooProducts(currentConfig);
        if (wooProducts.length > 0) {
          setHistory(wooProducts);
        } else {
          // Fallback to localStorage if WooCommerce is empty or not configured
          const savedHistory = localStorage.getItem('ml_import_history');
          if (savedHistory) setHistory(JSON.parse(savedHistory));
        }
      } catch (err) {
        console.error("Erro ao carregar produtos:", err);
        const savedHistory = localStorage.getItem('ml_import_history');
        if (savedHistory) setHistory(JSON.parse(savedHistory));
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();

    const savedAuth = localStorage.getItem('ml_admin_auth');
    if (savedAuth === 'true') setIsAdmin(true);
  }, [wooConfig.url]);

  const refreshHistory = async () => {
    setIsLoading(true);
    try {
      const wooProducts = await getWooProducts(wooConfig);
      setHistory(wooProducts);
    } catch (err) {
      console.error("Erro ao atualizar histórico:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (success: boolean) => {
    if (success) {
      setIsAdmin(true);
      setShowLogin(false);
      localStorage.setItem('ml_admin_auth', 'true');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('ml_admin_auth');
    setActiveTab(AppTab.LINK_URL);
  };

  const handleSaveConfig = (newConfig: WooCommerceConfig) => {
    setWooConfig(newConfig);
    localStorage.setItem('ml_woo_config', JSON.stringify(newConfig));
  };

  const addToHistory = (product: ProductData, wooId?: string) => {
    const newRecord: ImportRecord = {
      ...product,
      id: wooId || Math.random().toString(36).substr(2, 9),
      importedAt: new Date().toISOString(),
      status: 'published'
    };
    const updatedHistory = [newRecord, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('ml_import_history', JSON.stringify(updatedHistory));
    // Refresh from WooCommerce after a short delay to ensure the new product is there
    setTimeout(refreshHistory, 2000);
  };

  const updateProduct = async (id: string, updatedData: Partial<ImportRecord>) => {
    const updatedHistory = history.map(item => 
      item.id === id ? { ...item, ...updatedData } : item
    );
    setHistory(updatedHistory);
    localStorage.setItem('ml_import_history', JSON.stringify(updatedHistory));

    // Export to WooCommerce
    try {
      await updateWooProduct(wooConfig, id, updatedData);
      console.log("Produto atualizado no WooCommerce com sucesso.");
    } catch (err) {
      console.error("Erro ao atualizar no WooCommerce:", err);
      // We don't necessarily want to block the local update, but maybe alert the user?
    }
  };

  const deleteFromHistory = async (id: string) => {
    try {
      await deleteWooProduct(wooConfig, id);
      const updatedHistory = history.filter(item => item.id !== id);
      setHistory(updatedHistory);
      localStorage.setItem('ml_import_history', JSON.stringify(updatedHistory));
      console.log("Produto excluído do WooCommerce com sucesso.");
    } catch (err) {
      console.error("Erro ao excluir no WooCommerce:", err);
      throw err;
    }
  };

  // Se estiver na tela de login, mostramos apenas o componente de Login
  if (showLogin) {
    return <LoginComponent onLogin={handleLogin} />;
  }

  // Se NÃO for admin, mostramos apenas o Storefront (Site Público)
  if (!isAdmin) {
    const defaultTheme = localStorage.getItem('ml_default_theme') || 'standard';
    return (
      <div className="min-h-screen bg-[#ebebeb]">
        {defaultTheme === 'pet' ? (
          <PetStoreLayout history={history} onAdminClick={() => setShowLogin(true)} isLoading={isLoading} />
        ) : (
          <StorefrontTab history={history} onAdminClick={() => setShowLogin(true)} isLoading={isLoading} />
        )}
      </div>
    );
  }

  // Se FOR admin, mostramos o Painel de Controle (Backend)
  return (
    <div className="flex min-h-screen bg-[#ebebeb]">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header activeTab={activeTab} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {activeTab === AppTab.AFFILIATE && (
            <AffiliateTab 
              onImportSuccess={addToHistory} 
              wooConfig={wooConfig} 
              prefilledUrl={prefilledUrl}
              onClearPrefilled={() => setPrefilledUrl('')}
            />
          )}
          {activeTab === AppTab.LINK_PRODUCT && (
            <LinkProductTab 
              onImportSuccess={addToHistory} 
              wooConfig={wooConfig} 
            />
          )}
          {activeTab === AppTab.LINK_URL && (
            <LinkUrlTab 
              onImportSuccess={addToHistory} 
              wooConfig={wooConfig} 
            />
          )}
          {activeTab === AppTab.PRODUCTS && (
            <ProductsTab history={history} onDelete={deleteFromHistory} onUpdate={updateProduct} />
          )}
          {activeTab === AppTab.STOREFRONT && (
            <StorefrontTab history={history} isLoading={isLoading} />
          )}
          {activeTab === AppTab.STOREFRONT_PET && (
            <div className="min-h-screen bg-white">
              <PetStoreLayout history={history} />
            </div>
          )}
          {activeTab === AppTab.DASHBOARD_IA && (
            <GeminiDashboard />
          )}
          {activeTab === AppTab.AI_PROMPTS && (
            <AIPromptTab />
          )}
          {activeTab === AppTab.SETTINGS && (
            <SettingsTab config={wooConfig} onSave={handleSaveConfig} onRefreshProducts={refreshHistory} />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
