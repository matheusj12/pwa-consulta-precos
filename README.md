# ATACADÃO — Consulta de Preços (PWA)

Progressive Web App para consulta rápida de preços de bebidas. O frontend é estático (HTML/CSS/JS puro) e roda como uma PWA offline-first; o catálogo em si vive num Postgres (Vercel Postgres) e é servido por uma pequena API serverless, o que permite editar preço e imagem em produção pelo painel `/admin` sem precisar de novo deploy.

## Stack

Frontend: HTML5, CSS3, JavaScript ES6+ (sem frameworks), Web App Manifest, Service Worker, LocalStorage.
Backend: funções serverless da Vercel (Node.js) + Postgres (dados). Imagens de produto são hyperlinks (URL externa) guardados junto do produto — nada de upload/hospedagem própria.

## Estrutura

```
pwa-consulta-precos/
├── assets/            logo, ícones PWA (192/512/maskable), favicon, splash
├── css/
│   ├── reset.css      normalização básica do navegador
│   ├── variables.css  paleta de cores, espaçamentos, sombras, easing
│   ├── app.css        layout: splash, header, busca, chips, cards, toast
│   ├── animations.css keyframes e transições (respeita prefers-reduced-motion)
│   └── responsive.css breakpoints (mobile / tablet / desktop)
├── js/
│   ├── utils.js       funções puras: debounce, normalização de texto, moeda, hash
│   ├── storage.js      leitura/escrita de favoritos e histórico no LocalStorage
│   ├── service.js      fetch único de /api/produtos + cache em memória
│   ├── search.js       índice de busca em memória + filtro por texto/categoria
│   ├── ui.js           toda manipulação de DOM (cards, chips, toasts, splash)
│   ├── app.js          orquestrador: liga estado, eventos e Service Worker
│   └── admin.js        painel /admin: lista, edita preço, edita URL da imagem
├── api/
│   ├── produtos.js           GET público — catálogo completo (lido do Postgres)
│   └── admin/
│       └── produtos.js       GET/PUT — listar e editar produtos (sem autenticação)
├── lib/
│   ├── db.js           pool de conexão Postgres compartilhado pelas functions
│   └── hash.js          mesmo hash de id usado no frontend (js/utils.js)
├── scripts/migrate.js  importa data/produtos.json pro Postgres (upsert, re-executável)
├── data/produtos.json  catálogo original (seed/backup — não é mais servido direto)
├── index.html
├── admin.html          painel administrativo, sem login (decisão de produto)
├── manifest.json
├── service-worker.js
├── vercel.json
└── package.json
```

Cada arquivo JS tem uma única responsabilidade — `search.js` nunca toca o DOM, `ui.js` nunca busca dados, `storage.js` não sabe nada sobre produtos.

## Origem dos dados

O catálogo em `data/produtos.json` (413 itens) foi importado da tabela de preços real da distribuidora; categoria, marca e embalagem foram inferidos automaticamente a partir do texto original. Esse arquivo agora só serve como **seed** para `scripts/migrate.js` — depois da primeira migração, quem manda é o Postgres, editável pelo `/admin`.

Fotos de produto são links diretos para imagens do banco aberto [Open Food Facts](https://openfoodfacts.org), casadas por marca+categoria — não baixamos/hospedamos cópia própria, o campo `imagem` é só a URL. 140 dos 413 produtos têm foto real; o restante usa o ícone genérico — pode ser preenchido a qualquer momento pelo `/admin` colando qualquer URL de imagem.

## Configurando o banco (obrigatório antes do primeiro deploy)

1. No painel da Vercel → projeto → aba **Storage** → **Create Database** → **Postgres** → conectar ao projeto. Isso injeta `POSTGRES_URL` automaticamente.
2. Rodar a migração uma vez (localmente, apontando pro Postgres da Vercel — pegue a connection string em Storage → Postgres → `.env.local`):

   ```bash
   npm install
   POSTGRES_URL="postgres://...da Vercel..." npm run migrate
   ```

   É um upsert por id — pode rodar de novo sem duplicar nada.

## Rodando localmente

O frontend estático sobe com qualquer servidor (Service Worker exige http/https, não abre com `file://`):

```bash
npm install
npm run dev          # sobe em http://localhost:5000
```

As rotas `/api/*` só existem de verdade rodando na Vercel (`vercel dev`, requer `vercel login`) — sem elas, `npm run dev` serve só os arquivos estáticos e a busca/admin não terão dados.

## Deploy na Vercel

```bash
npm install
vercel --prod
```

Ou conecte o repositório GitHub direto no painel da Vercel (import project) — cada push na `main` gera um deploy novo automaticamente. Sem passo de build: `vercel.json` já define os headers de cache corretos, e as pastas `api/` são detectadas como serverless functions automaticamente.

## Painel `/admin`

`https://seu-dominio.vercel.app/admin` — lista os 413 produtos com busca, edita preço unitário/caixa e a URL da imagem inline (salva ao sair do campo). **Sem usuário/senha** — decisão deliberada, a URL não é linkada em nenhum lugar do app público. Se em algum momento isso passar a incomodar, dá pra adicionar um token simples em `api/admin/produtos.js` sem mexer no resto.

## Atualizando o catálogo

Preço e imagem: direto pelo `/admin`, tem efeito imediato (a API lê do Postgres a cada request).

Se algum dia mudar o **app shell** (HTML/CSS/JS/ícones), incremente `CACHE_VERSION` em `service-worker.js` — navegadores só detectam Service Worker novo comparando os bytes desse arquivo, e é isso que dispara o aviso "Novo catálogo disponível" pra quem já instalou o app.

## Funcionalidades

- Busca em tempo real (debounce), ignorando maiúsculas/minúsculas, acentos e pontuação; busca em nome, categoria, marca e embalagem.
- Catálogo completo agrupado por categoria quando não há filtro ativo; lista simples quando há busca, categoria ou "somente favoritos" selecionados.
- Favoritos e histórico de busca (últimas 20) persistidos em LocalStorage.
- Splash screen com fade suave enquanto o catálogo carrega.
- Funciona offline após o primeiro acesso (HTML, CSS, JS, catálogo e ícones em cache); preço/imagem atualizados pelo admin aparecem assim que o vendedor tiver conexão de novo.
- Instalável como app (Add to Home Screen) em Android e iOS.
- Painel `/admin` pra edição de preço e imagem em produção, sem redeploy.
