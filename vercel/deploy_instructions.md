# Guia de Implantação no Vercel - HubAfiliados

Este guia contém as instruções completas para realizar o deploy da aplicação **Hub de Afiliados** no Vercel.

---

## 1. Modelo de Application Preset a Utilizar
Ao criar o projeto no Vercel:
- **Framework Preset**: Escolha **Other** (Outros) ou **Vite**. Como o projeto já possui o arquivo `vercel.json` na raiz, o Vercel irá ler automaticamente as configurações para rodar o backend (`server.ts`) e o frontend (`dist/` gerado pelo Vite).

---

## 2. Variáveis de Ambiente a Incluir no Vercel
Adicione as seguintes chaves nas configurações do projeto no Vercel (**Project Settings** -> **Environment Variables**):

| Nome da Variável | Descrição / Valor Exemplo |
|---|---|
| `GEMINI_API_KEY` | Sua chave de API do Google AI Studio. |
| `OPENAI_API_KEY` | Sua chave de API do OpenAI (Fallback caso exceda cota). |
| `MANUS_API_KEY` | Sua chave de API do Manus (Opcional). |
| `VITE_GEMINI_API_KEY` | Mesma chave do Gemini (usada no frontend se aplicável). |
| `VITE_WOO_URL` | URL da sua loja WooCommerce (Ex: `https://shopifybrasil.com.br/`). |
| `VITE_WOO_CK` | Chave Consumer Key do WooCommerce. |
| `VITE_WOO_CS` | Chave Consumer Secret do WooCommerce. |

---

## 3. Configuração existente no `vercel.json`
O arquivo `vercel.json` na raiz do projeto já está configurado da seguinte maneira:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.ts",
      "use": "@vercel/node"
    },
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server.ts"
    },
    {
      "src": "/auth/(.*)",
      "dest": "server.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/$1",
      "continue": true
    },
    {
      "handle": "filesystem"
    },
    {
      "src": "/(.*)",
      "dest": "index.html"
    }
  ]
}
```

---

## 4. Passos para Subir a Aplicação no Vercel
1. Conecte o repositório Git ao Vercel.
2. Selecione a raiz do projeto.
3. Configure o **Framework Preset** como **Other** (Outro) ou **Vite**.
4. Cole as variáveis de ambiente mencionadas na Seção 2.
5. Clique em **Deploy**.
