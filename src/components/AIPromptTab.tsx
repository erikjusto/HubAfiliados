
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Save, RotateCcw, MessageSquare, Info, AlertTriangle } from 'lucide-react';
import { getGeminiConfig, saveGeminiConfig } from '../services/geminiConfigService';

const AIPromptTab: React.FC = () => {
  const [config, setConfig] = useState(getGeminiConfig());
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedMsg, setShowSavedMsg] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    saveGeminiConfig(config);
    setTimeout(() => {
      setIsSaving(false);
      setShowSavedMsg(true);
      setTimeout(() => setShowSavedMsg(false), 3000);
    }, 800);
  };

  const handleReset = () => {
    if (window.confirm('Deseja realmente restaurar o prompt padrão? Todas as alterações manuais serão perdidas.')) {
      const defaultConfig = {
        ...config,
        systemPrompt: `Você é um especialista em e-commerce, copywriting persuasivo e SEO estratégico.
Sua tarefa é gerar conteúdos de SEO altamente otimizados para um produto, baseando-se estritamente no nome, categoria e detalhes do anúncio.
Crie um conteúdo no estilo BLOG POST para a descrição, focado em conversão e benefícios.

INSTRUÇÕES:
1. "titulo": Crie um título SEO impactante entre 50-60 caracteres.
2. "descricao_curta": Gere um resumo persuasivo (máximo 160 caracteres) que destaque o principal benefício.
3. "conteudo_html": Gere uma descrição longa vendedora em HTML. Use títulos (h2, h3), listas e parágrafos persuasivos. Foque na autoridade do fabricante e nas dores/desejos do cliente. No final de TUDO, adicione obrigatoriamente um parágrafo com um link em destaque: <p><strong>COMPRE NO MERCADO LIVRE: <a href="\${affiliateUrl}">\${affiliateUrl}</a></strong></p>
4. "hierarquia": Identifique a trilha de navegação correta (ex: Tecnologia > Celulares > Smartphones).
5. "slug": Crie uma URL amigável.`
      };
      setConfig(defaultConfig);
      saveGeminiConfig(defaultConfig);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 bg-gradient-to-br from-indigo-50 to-white border-b border-slate-100">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <MessageSquare size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800">Prompt de Comportamento</h2>
                <p className="text-slate-500 font-medium">Defina como a IA deve descrever seus produtos afiliados.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={handleReset}
                className="p-3 bg-white text-slate-400 hover:text-slate-600 rounded-2xl border border-slate-200 transition-all flex items-center gap-2 font-bold text-sm"
                title="Restaurar Padrão"
              >
                <RotateCcw size={18} />
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold shadow-lg shadow-slate-200 transition-all flex items-center gap-2"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                {isSaving ? 'Salvando...' : 'Salvar Prompt'}
              </button>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3 text-amber-800 text-sm">
            <AlertTriangle className="shrink-0 w-5 h-5" />
            <p>
              <strong>Atenção:</strong> Alterar este prompt afeta como a IA gera os textos. Certifique-se de manter as variáveis como <strong>{`\${productName}`}</strong> e <strong>{`\${affiliateUrl}`}</strong> caso queira que a IA as utilize.
            </p>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Prompt do Sistema (System Instruction)</label>
              <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">Editor Avançado</span>
            </div>
            <textarea 
              value={config.systemPrompt}
              onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
              className="w-full h-96 bg-slate-50 border-2 border-slate-100 rounded-3xl p-6 font-mono text-sm text-slate-700 leading-relaxed focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all shadow-inner"
              placeholder="Descreva aqui as instruções de como a IA deve se comportar..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="p-2 bg-white rounded-xl shadow-sm text-blue-500">
                <Sparkles size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-1 tracking-tight">Variáveis Disponíveis</h4>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Use <strong>{`\${productName}`}</strong>, <strong>{`\${category}`}</strong> e <strong>{`\${affiliateUrl}`}</strong> no seu texto para que a IA receba os dados do produto.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="p-2 bg-white rounded-xl shadow-sm text-indigo-500">
                <Info size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-1 tracking-tight">Dica de Conversão</h4>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Peça para a IA focar em "benefícios em vez de características" para aumentar a conversão dos links afiliados.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showSavedMsg && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-3xl shadow-2xl z-50 flex items-center gap-3 font-bold"
          >
            <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
              <Save size={14} />
            </div>
            Configurações de Prompt salvas com sucesso!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIPromptTab;
