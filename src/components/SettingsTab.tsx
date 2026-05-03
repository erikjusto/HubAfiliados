
import React, { useState } from 'react';
import { WooCommerceConfig } from '@/types';
import { testWooConnection } from '@/services/wooService';
import { 
  Settings2, 
  Globe, 
  Key, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Plug, 
  Info,
  RefreshCw
} from 'lucide-react';

interface SettingsTabProps {
  config: WooCommerceConfig;
  onSave: (config: WooCommerceConfig) => void;
  onRefreshProducts?: () => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ config, onSave, onRefreshProducts }) => {
  const [formData, setFormData] = useState<WooCommerceConfig>(config);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const handleTestOnly = async () => {
    setTesting(true);
    setStatus(null);
    try {
      await testWooConnection(formData);
      setStatus({ type: 'success', msg: 'Conexão estabelecida com sucesso!' });
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message || 'Falha na conexão: Verifique suas credenciais.' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    onSave(formData);
    setStatus({ type: 'success', msg: 'Configurações salvas com sucesso!' });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-bold text-slate-800">Configuração da API WooCommerce</h3>
        </div>
        
        <div className="p-6 space-y-5">
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1">
              <Globe className="w-4 h-4 text-slate-400" />
              URL da Loja
            </label>
            <input 
              type="text" 
              placeholder="https://sualoja.com.br"
              value={formData.url}
              onChange={e => setFormData({...formData, url: e.target.value})}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-yellow-400 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1">
                <Key className="w-4 h-4 text-slate-400" />
                Consumer Key
              </label>
              <input 
                type="text" 
                placeholder="ck_xxxxxxxx..."
                value={formData.consumerKey}
                onChange={e => setFormData({...formData, consumerKey: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-yellow-400 outline-none transition-all"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1">
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                Consumer Secret
              </label>
              <input 
                type="text" 
                placeholder="cs_xxxxxxxx..."
                value={formData.consumerSecret}
                onChange={e => setFormData({...formData, consumerSecret: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-yellow-400 outline-none transition-all"
              />
            </div>
          </div>

          {status && (
            <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 animate-in fade-in duration-300 ${
              status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
            }`}>
              {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              {status.msg}
            </div>
          )}

          <div className="pt-4 flex flex-col gap-3">
            <button 
              onClick={handleTestOnly}
              disabled={testing || !formData.url || !formData.consumerKey}
              className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
            >
              {testing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plug className="w-5 h-5" />}
                Testar Conexão
              </button>
              <button 
                onClick={handleSave}
                disabled={testing || !formData.url || !formData.consumerKey}
                className="bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
              >
                <CheckCircle2 className="w-5 h-5" />
                Salvar Configurações
              </button>
            
            {onRefreshProducts && (
              <button 
                onClick={onRefreshProducts}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <RefreshCw className="w-5 h-5" />
                Sincronizar Produtos do WooCommerce
              </button>
            )}

            <p className="text-[10px] text-slate-400 text-center px-8">
              Certifique-se de que seu site tenha HTTPS habilitado e que você criou a chave em <br/>
              <b>WooCommerce &gt; Configurações &gt; Avançado &gt; API REST</b>
            </p>
          </div>
        </div>
      </div>

      {/* Bloco de Configurações do Git / GitHub */}
      <GitSettingsBlock />

      <div className="mt-8 bg-blue-50 rounded-2xl p-6 border border-blue-100 mb-6">
        <h4 className="font-bold text-blue-800 text-sm mb-2 flex items-center gap-2">
          <Info className="w-4 h-4" /> Nota Importante sobre CORS
        </h4>
        <p className="text-xs text-blue-700 leading-relaxed">
          Aplicativos baseados em navegador podem enfrentar restrições de CORS ao chamar a API do WordPress diretamente. 
          Se a conexão falhar, certifique-se de que seu servidor permite requisições desta origem ou utilize um plugin de "CORS Unblocker" no seu WordPress.
        </p>
      </div>
    </div>
  );
};

const GitSettingsBlock: React.FC = () => {
  const [repoUrl, setRepoUrl] = useState('https://github.com/erikjusto/HubAfiliados.git');
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('erikjusto');
  const [email, setEmail] = useState('erikjusto@gmail.com');
  const [syncing, setSyncing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [gitStatus, setGitStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  // Carregar dados salvos ao montar o componente
  React.useEffect(() => {
    const savedGitConfig = localStorage.getItem('ml_git_config');
    if (savedGitConfig) {
      try {
        const parsed = JSON.parse(savedGitConfig);
        if (parsed.repoUrl) setRepoUrl(parsed.repoUrl);
        if (parsed.token) setToken(parsed.token);
        if (parsed.username) setUsername(parsed.username);
        if (parsed.email) setEmail(parsed.email);
      } catch (err) {
        console.error('Erro ao ler configuração do Git salva:', err);
      }
    }
  }, []);

  const handleSaveGitConfig = () => {
    localStorage.setItem('ml_git_config', JSON.stringify({ repoUrl, token, username, email }));
    setGitStatus({ type: 'success', msg: 'Configurações de Git salvas no navegador com sucesso!' });
  };

  const handleGitPush = async () => {
    if (!repoUrl || !token) {
      setGitStatus({ type: 'error', msg: 'URL do repositório e Token GitHub são obrigatórios.' });
      return;
    }

    setSyncing(true);
    setGitStatus(null);
    try {
      const response = await fetch('/api/git/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl, token, email, username })
      });
      
      const text = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch (err) {
        throw new Error(text || 'Resposta do servidor inválida');
      }

      if (response.ok) {
        // Automatically save configuration on success
        localStorage.setItem('ml_git_config', JSON.stringify({ repoUrl, token, username, email }));
        setGitStatus({ type: 'success', msg: data.message || 'Projeto enviado com sucesso para a conta Git!' });
      } else {
        setGitStatus({ type: 'error', msg: data.error || 'Erro ao sincronizar com Git.' });
      }
    } catch (err: any) {
      setGitStatus({ type: 'error', msg: err.message || 'Falha na conexão com o servidor.' });
    } finally {
      setSyncing(false);
    }
  };

  const handleGitTest = async () => {
    if (!repoUrl || !token) {
      setGitStatus({ type: 'error', msg: 'URL do repositório e Token são obrigatórios para testar.' });
      return;
    }

    setTesting(true);
    setGitStatus(null);
    try {
      const response = await fetch('/api/git/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl, token })
      });

      const text = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch (err) {
        throw new Error(text || 'Resposta do servidor inválida');
      }

      if (response.ok) {
        setGitStatus({ type: 'success', msg: data.message || 'Conexão com o Git estabelecida com sucesso!' });
      } else {
        setGitStatus({ type: 'error', msg: data.error || 'Erro ao testar conexão com o Git.' });
      }
    } catch (err: any) {
      setGitStatus({ type: 'error', msg: err.message || 'Falha na conexão com o servidor.' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-8">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
        <RefreshCw className="w-5 h-5 text-slate-600" />
        <h3 className="text-lg font-bold text-slate-800">Sincronizar Projeto com Git / GitHub</h3>
      </div>
      
      <div className="p-6 space-y-5">
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1">
            <Globe className="w-4 h-4 text-slate-400" />
            URL do Repositório Git
          </label>
          <input 
            type="text" 
            placeholder="https://github.com/usuario/repositorio.git"
            value={repoUrl}
            onChange={e => setRepoUrl(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-yellow-400 outline-none transition-all"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1">
            <Key className="w-4 h-4 text-slate-400" />
            GitHub Personal Access Token (PAT)
          </label>
          <input 
            type="password" 
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxx"
            value={token}
            onChange={e => setToken(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-yellow-400 outline-none transition-all"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1">
              Nome de Usuário
            </label>
            <input 
              type="text" 
              placeholder="Ex: Erik"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-yellow-400 outline-none transition-all"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1">
              E-mail do Git
            </label>
            <input 
              type="text" 
              placeholder="Ex: erikjusto@gmail.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-yellow-400 outline-none transition-all"
            />
          </div>
        </div>

        {gitStatus && (
          <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 animate-in fade-in duration-300 ${
            gitStatus.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
          }`}>
            {gitStatus.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            {gitStatus.msg}
          </div>
        )}

        <div className="pt-2 flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button 
              onClick={handleSaveGitConfig}
              disabled={!repoUrl || !token}
              className="w-full bg-slate-100 text-slate-800 font-bold py-3 rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 border border-slate-200"
            >
              <CheckCircle2 className="w-5 h-5 text-slate-600" />
              Salvar Dados
            </button>

            <button 
              onClick={handleGitTest}
              disabled={testing || syncing || !repoUrl || !token}
              className="w-full bg-slate-100 text-slate-800 font-bold py-3 rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 border border-slate-200"
            >
              {testing ? <Loader2 className="w-5 h-5 animate-spin text-slate-600" /> : <RefreshCw className="w-5 h-5 text-slate-600" />}
              {testing ? 'Testando...' : 'Testar Conexão Git'}
            </button>
          </div>

          <button 
            onClick={handleGitPush}
            disabled={syncing || testing || !repoUrl || !token}
            className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white font-extrabold py-3.5 rounded-xl hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg text-base transform hover:scale-[1.01] active:scale-[0.99] active:duration-75 tracking-wide"
          >
            {syncing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Globe className="w-5 h-5 animate-pulse" />}
            {syncing ? 'Publicando...' : 'Publicar no GitHub (Google AI Studio Style)'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
