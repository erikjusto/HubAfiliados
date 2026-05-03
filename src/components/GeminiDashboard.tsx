
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Zap, AlertCircle, BarChart3, Clock, Trash2, ChevronDown, Activity, Database, Cpu, Settings, Eye, EyeOff, Save, CheckCircle2, XCircle, RefreshCw, Wifi, WifiOff, Link2, Info, ExternalLink } from 'lucide-react';
import { getGeminiUsageLogs, clearGeminiUsageLogs, GeminiUsageLog } from '../services/usageTracker';
import { getGeminiConfig, saveGeminiConfig } from '../services/geminiConfigService';

interface ApiStatus {
  status: 'idle' | 'loading' | 'ok' | 'error' | 'invalid_key' | 'quota_exceeded' | 'not_configured';
  message: string;
  hasServerKey?: boolean;
  hasOpenAIKey?: boolean;
  serverKeyMasked?: string;
  testResponse?: string;
}

const GeminiDashboard: React.FC = () => {
  const [logs, setLogs] = useState<GeminiUsageLog[]>([]);
  const [config, setConfig] = useState(getGeminiConfig());
  const [isSaving, setIsSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [apiStatus, setApiStatus] = useState<ApiStatus>({ status: 'idle', message: 'Clique em "Testar Conexão" para verificar.' });
  const [stats, setStats] = useState({
    totalCalls: 0,
    totalTokens: 0,
    avgTokensPerCall: 0,
    successRate: 0,
    callsByAction: {} as Record<string, number>
  });

  const checkApiStatus = useCallback(async () => {
    setApiStatus({ status: 'loading', message: 'Verificando conexão com Google AI Studio...' });
    try {
      const res = await fetch('/api/gemini/status');
      const data = await res.json();
      setApiStatus({
        status: data.status,
        message: data.message,
        hasServerKey: data.hasServerKey,
        hasOpenAIKey: data.hasOpenAIKey,
        serverKeyMasked: data.serverKeyMasked,
        testResponse: data.testResponse,
      });
      // Auto-sync: if server has a key and frontend has none, load server key masked info
      if (data.hasServerKey && !config.apiKey) {
        // Show that the server key is being used (don't expose the actual key)
        setConfig(prev => ({ ...prev, apiKey: '' }));
      }
    } catch (err: any) {
      setApiStatus({ status: 'error', message: `Erro de rede: ${err.message}` });
    }
  }, [config.apiKey]);

  useEffect(() => {
    loadLogs();
    checkApiStatus();
  }, []);

  const loadLogs = () => {
    const usageLogs = getGeminiUsageLogs();
    setLogs(usageLogs);

    const total = usageLogs.length;
    const success = usageLogs.filter(l => l.status === 'success').length;
    const tokens = usageLogs.reduce((acc, curr) => acc + curr.totalTokens, 0);
    
    const byAction: Record<string, number> = {};
    usageLogs.forEach(l => {
      byAction[l.action] = (byAction[l.action] || 0) + 1;
    });

    setStats({
      totalCalls: total,
      totalTokens: tokens,
      avgTokensPerCall: total > 0 ? Math.round(tokens / total) : 0,
      successRate: total > 0 ? Math.round((success / total) * 100) : 0,
      callsByAction: byAction
    });
  };

  const handleSaveConfig = () => {
    setIsSaving(true);
    saveGeminiConfig(config);
    setTimeout(() => {
      setIsSaving(false);
      checkApiStatus();
    }, 500);
  };

  const handleClearLogs = () => {
    if (window.confirm('Deseja realmente limpar todos os logs de consumo?')) {
      clearGeminiUsageLogs();
      loadLogs();
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusColors = {
    idle: 'border-slate-200 bg-slate-50 text-slate-500',
    loading: 'border-blue-200 bg-blue-50 text-blue-600',
    ok: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    error: 'border-red-200 bg-red-50 text-red-600',
    invalid_key: 'border-amber-200 bg-amber-50 text-amber-700',
    quota_exceeded: 'border-orange-200 bg-orange-50 text-orange-700',
    not_configured: 'border-slate-200 bg-slate-50 text-slate-500',
  };

  const StatusIcon = () => {
    if (apiStatus.status === 'loading') return <RefreshCw size={18} className="animate-spin" />;
    if (apiStatus.status === 'ok') return <CheckCircle2 size={18} />;
    if (apiStatus.status === 'invalid_key' || apiStatus.status === 'quota_exceeded') return <AlertCircle size={18} />;
    if (apiStatus.status === 'error') return <XCircle size={18} />;
    if (apiStatus.status === 'not_configured') return <WifiOff size={18} />;
    return <Wifi size={18} />;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Brain size={120} className="text-blue-600" />
        </div>
        
        <div className="relative z-10">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Activity size={20} />
            </div>
            Google AI Studio — Dashboard
          </h2>
          <p className="text-slate-500 mt-1 font-medium">Monitoramento de consumo, configuração e teste da API Gemini.</p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button 
            onClick={loadLogs}
            className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition-all flex items-center gap-2 font-bold text-sm"
          >
            <Clock size={18} /> Atualizar
          </button>
          <button 
            onClick={handleClearLogs}
            className="p-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl transition-all flex items-center gap-2 font-bold text-sm"
          >
            <Trash2 size={18} /> Limpar Logs
          </button>
        </div>
      </div>

      {/* GOOGLE AI STUDIO STATUS BANNER */}
      <div className={`rounded-3xl border-2 p-5 transition-all ${statusColors[apiStatus.status] || statusColors.idle}`}>
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <StatusIcon />
            <div>
              <p className="font-black text-sm">Status da Conexão — Google AI Studio</p>
              <p className="text-xs font-medium opacity-80 mt-0.5">{apiStatus.message}</p>
              {apiStatus.serverKeyMasked && (
                <p className="text-xs font-mono opacity-60 mt-1">Chave: {apiStatus.serverKeyMasked}</p>
              )}
              {apiStatus.testResponse && (
                <p className="text-xs mt-1 opacity-70">Resposta do modelo: <span className="font-mono">"{apiStatus.testResponse}"</span></p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {apiStatus.hasOpenAIKey && (
              <span className="text-[10px] px-2 py-1 bg-white/60 rounded-xl font-bold border border-current/20">OpenAI Fallback ✓</span>
            )}
            <button
              id="btn-test-gemini-connection"
              onClick={checkApiStatus}
              disabled={apiStatus.status === 'loading'}
              className="px-4 py-2 bg-white/70 hover:bg-white text-current border border-current/20 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw size={14} className={apiStatus.status === 'loading' ? 'animate-spin' : ''} />
              Testar Conexão
            </button>
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-white/70 hover:bg-white text-current border border-current/20 rounded-2xl font-bold text-sm transition-all flex items-center gap-2"
            >
              <ExternalLink size={14} />
              AI Studio
            </a>
          </div>
        </div>
      </div>

      {/* PROVEDOR SELECTION */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg ${
            config.provider === 'gemini' ? 'bg-blue-600 shadow-blue-100' : 
            'bg-emerald-600 shadow-emerald-100'
          }`}>
            {config.provider === 'gemini' ? <Brain size={20} /> : <Zap size={20} />}
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Provedor Principal</p>
            <p className="font-black text-slate-800">
              {config.provider === 'gemini' ? '🟦 Google Gemini (AI Studio)' : '🟩 OpenAI GPT'}
            </p>
          </div>
        </div>
        
        <div className="bg-slate-100 p-1 rounded-2xl flex gap-1">
          {[{ id: 'gemini', label: '🟦 Gemini' }, { id: 'openai', label: '🟩 OpenAI' }].map((p) => (
            <button 
              key={p.id}
              id={`btn-provider-${p.id}`}
              onClick={() => setConfig({ ...config, provider: p.id as any })}
              className={`px-4 py-2 rounded-xl text-[11px] font-black transition-all ${
                config.provider === p.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* CONFIGURATION SECTION */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-1 h-full ${
          config.provider === 'gemini' ? 'bg-blue-600' : 
          config.provider === 'openai' ? 'bg-emerald-600' : 
          'bg-purple-600'
        }`}></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="font-black text-slate-800 flex items-center gap-2">
              <Settings size={18} className={
                config.provider === 'gemini' ? 'text-blue-600' : 
                config.provider === 'openai' ? 'text-emerald-600' : 
                'text-purple-600'
              } />
              Configurações do Provedor {config.provider.toUpperCase()}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {config.provider === 'gemini' ? 'Configure os parâmetros para a API do Google Gemini.' : 
               'Configure os parâmetros para a API da OpenAI (GPT).'}
            </p>
          </div>
          
          <button 
            onClick={handleSaveConfig}
            disabled={isSaving}
            className={`px-8 py-3 text-white rounded-2xl font-bold transition-all shadow-lg flex items-center gap-2 ${isSaving ? 'opacity-50' : ''} ${
              config.provider === 'gemini' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-100' : 
              config.provider === 'openai' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' : 
              'bg-purple-600 hover:bg-purple-700 shadow-purple-100'
            }`}
          >
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            <Save size={18} />
          </button>
        </div>

        {config.provider === 'gemini' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Chave de API Gemini</label>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${config.apiKey ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  {config.apiKey ? 'Configurada' : 'Pendente'}
                </span>
              </div>
              <div className="relative group">
                <input 
                  type={showKey ? "text" : "password"}
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-mono text-sm focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-blue-500 transition-all outline-none"
                  placeholder="Cole sua nova API Key aqui..."
                />
                <button 
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-blue-600 transition-colors"
                >
                  {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Versão do Modelo (Gemini)</label>
              <div className="relative">
                <select 
                  value={config.model}
                  onChange={(e) => setConfig({ ...config, model: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold text-sm focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-blue-500 transition-all outline-none appearance-none"
                >
                  <optgroup label="Gemini 2.5 (Mais Recentes)">
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash ⚡ (Recomendado)</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro 🧠 (Mais Avançado)</option>
                  </optgroup>
                  <optgroup label="Gemini 2.0">
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash (Estável)</option>
                    <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite (Econômico)</option>
                  </optgroup>
                  <optgroup label="Gemini 1.5 (Legado)">
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                  </optgroup>
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronDown size={18} />
                </div>
              </div>
            </div>
          </div>
        )}

        {config.provider === 'openai' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Chave de API OpenAI</label>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${config.openaiApiKey ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  {config.openaiApiKey ? 'Configurada' : 'Pendente'}
                </span>
              </div>
              <div className="relative group">
                <input 
                  type={showKey ? "text" : "password"}
                  value={config.openaiApiKey}
                  onChange={(e) => setConfig({ ...config, openaiApiKey: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-mono text-sm focus:ring-4 focus:ring-emerald-500/5 focus:bg-white focus:border-emerald-500 transition-all outline-none"
                  placeholder="Cole sua OpenAI API Key aqui..."
                />
                <button 
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-emerald-600 transition-colors"
                >
                  {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Versão do Modelo (GPT)</label>
              <div className="relative">
                <select 
                  value={config.openaiModel}
                  onChange={(e) => setConfig({ ...config, openaiModel: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold text-sm focus:ring-4 focus:ring-emerald-500/5 focus:bg-white focus:border-emerald-500 transition-all outline-none appearance-none"
                >
                  <option value="gpt-4o-mini">GPT-4o Mini (Rápido e Barato)</option>
                  <option value="gpt-4o">GPT-4o (Alta Performance)</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Legado)</option>
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronDown size={18} />
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total de Chamadas', value: stats.totalCalls, icon: Zap, color: 'blue' },
          { label: 'Tokens Consumidos', value: stats.totalTokens.toLocaleString(), icon: Database, color: 'indigo' },
          { label: 'Taxa de Sucesso', value: `${stats.successRate}%`, icon: BarChart3, color: 'emerald' },
          { label: 'Tokens Médios / Chamada', value: stats.avgTokensPerCall, icon: Cpu, color: 'amber' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm group hover:border-blue-300 transition-all"
          >
            <div className={`w-12 h-12 rounded-2xl mb-4 flex items-center justify-center bg-slate-50 text-slate-600 group-hover:scale-110 transition-transform`}>
              <stat.icon size={24} />
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-3xl font-black text-slate-800 mt-1">{stat.value}</h3>
          </motion.div>
        ))}

        {/* USAGE BY ACTION */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm group hover:border-blue-300 transition-all flex flex-col h-full"
        >
          <div className="w-12 h-12 rounded-2xl mb-4 shrink-0 flex items-center justify-center bg-slate-50 text-slate-600 group-hover:scale-110 transition-transform">
            <BarChart3 size={24} />
          </div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Uso por Recurso</p>
          
          <div className="flex-1 flex flex-col justify-center">
            {Object.entries(stats.callsByAction).length === 0 ? (
              <h3 className="text-3xl font-black text-slate-800 mt-1">0</h3>
            ) : (
              <div className="space-y-4">
                {Object.entries(stats.callsByAction).map(([action, count]) => (
                  <div key={action}>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate" title={action}>{action}</p>
                    <h3 className="text-3xl font-black text-slate-800 mt-1">{count}</h3>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* RECENT CALLS LOG */}
      <div className="w-full mt-6 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-black text-slate-800 flex items-center gap-2">
            <Clock size={18} className="text-blue-600" />
            Últimas Atividades
          </h3>
          <span className="text-xs font-bold text-slate-400">{logs.length} registros</span>
        </div>
        <div className="flex-1 overflow-y-auto max-h-[500px]">
          {logs.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Brain size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-bold">Nenhuma atividade registrada ainda.</p>
              <p className="text-sm mt-1">As chamadas à API aparecerão aqui.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {logs.slice().reverse().map((log, i) => (
                <div key={i} className="p-4 hover:bg-slate-50 transition-colors flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    log.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {log.status === 'success' ? <Zap size={18} /> : <AlertCircle size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-800 truncate uppercase text-xs tracking-tight">
                        {log.action}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 shrink-0">
                        {formatDate(log.timestamp)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-bold">
                        {log.model}
                      </span>
                      {log.status === 'success' ? (
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                          <Database size={10} /> {log.totalTokens} tokens
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-red-500 truncate max-w-[500px]">
                          {log.errorMessage || 'Erro desconhecido'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeminiDashboard;
