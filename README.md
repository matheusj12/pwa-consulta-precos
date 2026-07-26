# ATACADÃO — Consulta de Preços (PWA)

Progressive Web App estático para consulta rápida de preços de bebidas. Sem backend, sem banco de dados — todo o catálogo vive em [`data/produtos.json`](data/produtos.json) e é carregado uma única vez, em memória, no primeiro acesso.

## Stack

HTML5, CSS3, JavaScript ES6+ (sem frameworks), Web App Manifest, Service Worker, LocalStorage. Nenhuma dependência de build — o projeto roda diretamente como arquivos estáticos.

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
│   ├── service.js      fetch único de produtos.json + cache em memória
│   ├── search.js       índice de busca em memória + filtro por texto/categoria
│   ├── ui.js           toda manipulação de DOM (cards, chips, toasts, splash)
│   └── app.js          orquestrador: liga estado, eventos e Service Worker
├── data/produtos.json  catálogo (única fonte de dados)
├── index.html
├── manifest.json
├── service-worker.js
├── vercel.json
└── package.json
```

Cada arquivo JS tem uma única responsabilidade — `search.js` nunca toca o DOM, `ui.js` nunca busca dados, `storage.js` não sabe nada sobre produtos.

## Origem dos dados

O catálogo em `data/produtos.json` (413 itens) foi importado da tabela de preços real da distribuidora. Categorias, marca e embalagem foram inferidos automaticamente a partir do texto original — revise o JSON periodicamente, é um arquivo simples de editar manualmente quando um preço mudar.

## Rodando localmente

Qualquer servidor estático funciona (Service Worker exige http/https, não abre com `file://`):

```bash
npm install
npm run dev          # sobe em http://localhost:5000
```

## Deploy na Vercel

```bash
npm install
vercel --prod
```

Ou faça upload da pasta diretamente pelo painel da Vercel. Não há passo de build: `vercel.json` já define os headers de cache corretos (catálogo e service worker sempre revalidados; assets com hash de longo prazo).

## Atualizando o catálogo (checklist de release)

Sempre que `data/produtos.json` mudar:

1. Edite o JSON.
2. Abra `service-worker.js` e incremente `CACHE_VERSION` (ex.: `v1` → `v2`).
3. Faça o deploy.

O passo 2 é obrigatório: navegadores só detectam um Service Worker novo comparando os bytes do arquivo `service-worker.js` — se ele ficar idêntico, o app nunca vai perceber que o catálogo mudou. Ao subir uma versão nova, quem já tem o app instalado vê o aviso "Novo catálogo disponível" e atualiza com um toque.

## Funcionalidades

- Busca em tempo real (debounce), ignorando maiúsculas/minúsculas, acentos e pontuação; busca em nome, categoria, marca e embalagem.
- Catálogo completo agrupado por categoria quando não há filtro ativo; lista simples quando há busca, categoria ou "somente favoritos" selecionados.
- Favoritos e histórico de busca (últimas 20) persistidos em LocalStorage.
- Splash screen com fade suave enquanto o catálogo carrega.
- 100% funcional offline após o primeiro acesso (HTML, CSS, JS, JSON e ícones em cache).
- Instalável como app (Add to Home Screen) em Android e iOS.
