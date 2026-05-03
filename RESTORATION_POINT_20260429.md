# Ponto de Restauração - HubAfiliados
**Data: 29/04/2026**
**Status: Estável / Produção**

## 🚀 Funcionalidades Consolidadas

### 1. Extração de Dados (Mercado Livre)
- **Resolução de Links**: Suporte a links encurtados (`meli.la`) com redirecionamento automático.
- **Identificação de ID**: Lógica robusta via URL (`split("/")[-1]`) e fallback via Metatags.
- **Categorias (API)**: Uso das APIs oficiais `/items` e `/categories` para obter a hierarquia real.
- **Hierarquia de 3 Níveis**: Mapeamento para Categoria Principal, Subcategoria e Segmento.

### 2. Inteligência Artificial (Failover Automático)
- **Modelo Primário**: `gemini-2.5-flash` (Ajustado para a cota atual do usuário).
- **Modelo de Backup**: `gpt-4o-mini` (OpenAI).
- **Automação de Troca**: O servidor alterna para OpenAI instantaneamente se o Gemini retornar Erro 429 (Cota) ou 503.
- **Prompts**: Estilo Blog Persuasivo, focado em benefícios e dados do fabricante.

### 3. Integração WooCommerce
- **Sincronização Recursiva**: Criação automática de categorias em árvore (Pai > Filho > Neto).
- **Sanitização**: Preços e títulos limpos antes do envio.

### 4. Interface (Dashboard)
- **Preview de Produto**: Ficha técnica completa com trilha de categorias e descrições editáveis.
- **Remoção de Ruído**: Textos promocionais do ML (ex: "ou R$ em outros meios") removidos da visualização.

## 🛠️ Configurações Críticas (.env)
- `GEMINI_API_KEY`: Configurada com a nova chave da série 2.5.
- `OPENAI_API_KEY`: Configurada para backup.
- `VITE_WOO_*`: Credenciais de conexão com a loja.

---
**Instrução para Recuperação:** Caso o sistema apresente instabilidade, verifique se o modelo no `server.ts` ainda condiz com a cota do Google AI Studio e se o servidor foi reiniciado após alterações no `.env`.
