# Site — Energia Solar & Mobilidade Elétrica

Site institucional e comercial para empresas de **energia solar fotovoltaica**, **carregadores para veículos elétricos (wallbox, AC e DC)** e **eletropostos**.

Esta é uma **versão demonstrativa comercial**: tudo funciona (navegação, simuladores, formulários, chat, painel), com dados fictícios claramente identificados. A arquitetura já está preparada para produção (Supabase, IA via backend, Vercel).

---

## Sumário

1. [Funcionalidades](#funcionalidades)
2. [Tecnologias](#tecnologias)
3. [Instalação e execução](#instalação-e-execução)
4. [Variáveis de ambiente](#variáveis-de-ambiente)
5. [Estrutura do projeto](#estrutura-do-projeto)
6. [Decisões de arquitetura](#decisões-de-arquitetura)
7. [Como alterar os dados da empresa](#como-alterar-os-dados-da-empresa)
8. [Como configurar o WhatsApp](#como-configurar-o-whatsapp)
9. [Como configurar a IA do chat](#como-configurar-a-ia-do-chat)
10. [Como conectar o Supabase](#como-conectar-o-supabase)
11. [Como publicar na Vercel](#como-publicar-na-vercel)
12. [Modo demonstração — o que é fictício](#modo-demonstração--o-que-é-fictício)
13. [Checklist antes de ir para produção](#checklist-antes-de-ir-para-produção)

---

## Funcionalidades

| Área | Rota | Destaques |
|---|---|---|
| Home | `/` | Hero com ilustração animada, soluções, simulador solar, eletropostos, simulador de carregador, indicadores, timeline, portfólio, depoimentos, FAQ e CTAs |
| Energia Solar | `/energia-solar` | Fluxo **SOL → PAINÉIS → INVERSOR → IMÓVEL → REDE**, benefícios, segmentos (residencial, comercial, industrial, rural), simulador |
| Carregadores | `/carregadores` | Residencial, comercial, condomínios, frotas, carregamento rápido, comparativo AC × DC, simulador |
| Eletropostos | `/eletropostos` | Vantagens, implantação em 8 etapas, escopo, aplicações |
| Projetos | `/projetos` e `/projetos/[slug]` | Filtros (Todos, Solar, Carregadores, Eletropostos) e página de detalhe por projeto |
| Sobre | `/sobre` | Missão, visão, valores, diferenciais |
| Orçamento | `/orcamento` | Formulário completo com validação (frontend + backend), pré-preenchido pelos simuladores |
| Contato | `/contato` | Canais, horário e formulário |
| Privacidade | `/politica-de-privacidade` | Modelo LGPD (revisar com jurídico) |
| Admin | `/admin` | Dashboard com KPIs e gráficos, leads (tabela, filtros, status, CSV, detalhe), orçamentos (kanban), projetos, serviços, depoimentos, FAQ, conteúdo, configurações |
| APIs | `/api/leads`, `/api/contact`, `/api/chat` | Validação com Zod, rate limit, honeypot anti-spam |

Também inclui: botão flutuante do WhatsApp, chat com assistente virtual, SEO (metadata, Open Graph dinâmico, `sitemap.xml`, `robots.txt`, JSON-LD), cabeçalhos de segurança e acessibilidade (navegação por teclado, ARIA, `prefers-reduced-motion`).

---

## Tecnologias

- **Next.js 16** (App Router, Server Components, Route Handlers, Turbopack)
- **React 19** + **TypeScript** (modo `strict`)
- **Tailwind CSS 4** (design tokens em `src/app/globals.css`)
- **Framer Motion** (animações e microinterações)
- **Lucide Icons**
- **React Hook Form** + **Zod** (mesmo schema no frontend e no backend)
- **@anthropic-ai/sdk** (chat com IA, opcional, somente no servidor)

Sem bibliotecas de gráficos ou UI pesadas: gráficos e ilustrações são SVG próprios, mantendo o bundle leve.

---

## Instalação e execução

Pré-requisitos: **Node.js 20.9+** e npm.

```bash
npm install
cp .env.example .env.local   # no Windows: copy .env.example .env.local
npm run dev                  # http://localhost:3000
```

Outros comandos:

```bash
npm run build      # build de produção
npm run start      # executa o build
npm run typecheck  # checagem de tipos
```

---

## Variáveis de ambiente

Todas documentadas em [`.env.example`](.env.example). O arquivo `.env.local` **nunca** deve ser versionado (já está no `.gitignore`).

| Variável | Onde é usada | Obrigatória |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | SEO, sitemap, Open Graph | Sim em produção |
| `NEXT_PUBLIC_DEMO_MODE` | Selos "demonstrativo" e aviso no admin (`false` em produção) | Não |
| `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL` | Chat com IA (servidor) | Não — sem chave, o chat usa a base de conhecimento local |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Persistência de leads | Não — sem elas, leads ficam em memória |
| `ADMIN_BASIC_AUTH_USER`, `ADMIN_BASIC_AUTH_PASSWORD` | Proteção do `/admin` | **Recomendado** em qualquer ambiente publicado |
| `GOOGLE_PLACES_API_KEY`, `GOOGLE_PLACE_ID` | Avaliações reais do Google | Não |

> Variáveis `NEXT_PUBLIC_*` são expostas ao navegador. Segredos (`AI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` etc.) são lidos apenas em `src/lib/env.ts`, que importa `server-only` — o build falha se algum componente cliente tentar importá-lo.

---

## Estrutura do projeto

```
src/
├── app/
│   ├── (site)/                 # Páginas públicas (layout com navbar, footer, WhatsApp e chat)
│   │   ├── page.tsx            # Home
│   │   ├── energia-solar/  carregadores/  eletropostos/
│   │   ├── projetos/[slug]/    # Detalhe de projeto (gerado estaticamente)
│   │   ├── sobre/  orcamento/  contato/  politica-de-privacidade/
│   ├── admin/                  # Painel administrativo (layout próprio, noindex)
│   ├── api/                    # Route handlers: leads, contact, chat
│   ├── sitemap.ts  robots.ts  opengraph-image.tsx  icon.svg  not-found.tsx
│   └── globals.css             # Tailwind 4 + design tokens (cores brand/volt/night)
├── components/
│   ├── ui/                     # Primitivos: Button, Section, Icon, Accordion, Reveal, AnimatedNumber…
│   ├── layout/                 # Navbar, Footer, Logo, botões flutuantes (WhatsApp + chat)
│   ├── sections/               # Seções reutilizáveis (Hero, FAQ, Timeline, CTA, PageHero…)
│   ├── simulators/             # Simulador solar e de carregador (UI)
│   ├── forms/                  # Campos acessíveis, formulário de orçamento e contato
│   ├── projects/               # Cards e galeria com filtros
│   ├── illustrations/          # Ilustrações SVG (hero, eletroposto, projetos)
│   ├── admin/                  # Sidebar, gráficos, tabelas, dashboard
│   └── seo/                    # JSON-LD (LocalBusiness, FAQPage, Breadcrumb, Service)
├── config/                     # ⭐ site.ts (dados da empresa), navigation.ts, stats.ts
├── data/                       # Conteúdo: soluções, projetos, FAQ, depoimentos, processos, mocks
├── lib/
│   ├── simulators/             # Regras de cálculo (solar e carregador), desacopladas da UI
│   ├── validations/            # Schemas Zod compartilhados front/back
│   ├── env.ts  seo.ts  whatsapp.ts  labels.ts  brazil.ts  rate-limit.ts  admin-metrics.ts  utils.ts
├── services/
│   ├── leads/                  # Repositório: interface + memória + Supabase
│   ├── ai/                     # Provedores de chat: demo + Anthropic
│   ├── reviews/                # Depoimentos demo ou Google Places
│   └── api-client.ts           # Cliente HTTP do frontend para /api/*
├── hooks/                      # use-demo-leads (armazenamento local da demonstração)
├── types/                      # Tipos de domínio
└── proxy.ts                    # Proteção do /admin (Basic Auth opcional)
supabase/schema.sql             # Tabelas, índices e políticas RLS
```

---

## Decisões de arquitetura

- **Route groups `(site)` e `admin`** — layouts independentes: o painel não carrega navbar/footer/chat do site e é marcado como `noindex`.
- **Conteúdo como dados** (`src/data`, `src/config`) — textos, projetos e FAQ ficam fora dos componentes. Migrar para o Supabase significa trocar a origem dos dados, não reescrever a UI.
- **Padrão Repository para leads** (`src/services/leads`) — as rotas dependem da interface `LeadRepository`. Hoje há implementações em memória e Supabase (via REST, sem dependência extra); a escolha é automática pelas variáveis de ambiente.
- **Provedores de IA plugáveis** (`src/services/ai`) — interface `ChatProvider`; o modo demo funciona offline e serve de *fallback* se a API externa falhar.
- **Calculadoras isoladas** (`src/lib/simulators`) — a UI chama `solarCalculator.calculate()` e `chargerRecommender.recommend()`. Para adotar uma metodologia técnica real, basta criar outra implementação da interface e trocar a instância exportada.
- **Validação única** — o mesmo schema Zod valida o formulário (react-hook-form) e a API.
- **Server Components por padrão** — apenas componentes interativos são `"use client"`, reduzindo JavaScript enviado ao navegador.
- **Ilustrações vetoriais** — sem imagens pesadas nem dependência de bancos de imagem; quando houver fotos reais, use `next/image` (já suportado em `project.image` e `siteConfig.logo`).

---

## Como alterar os dados da empresa

Edite **um único arquivo**: [`src/config/site.ts`](src/config/site.ts).

Ali estão nome, slogan, razão social, CNPJ, logo, telefone, WhatsApp, e-mail, endereço, área de atendimento, horário, redes sociais e a mensagem padrão do WhatsApp. Navbar, footer, contato, SEO, JSON-LD, chat e admin leem desse arquivo.

- **Logo:** o logo original (fundo claro) fica em `public/brand/dc-eco-energy-original.jpg`. As versões para o fundo escuro do site ficam em `src/assets/brand/` (`dc-monogram-dark.png` na navbar e `dc-eco-energy-dark.png` no rodapé); o favicon está em `src/app/icon.png` e `src/app/apple-icon.png`. Para trocar, substitua esses arquivos mantendo os nomes. O ideal é receber do designer versões em SVG/PNG transparente para fundo escuro.
- **Nome e slogan:** `name` e `slogan` em `src/config/site.ts`.
- **Redes sociais:** use `null` para ocultar um ícone.
- **Indicadores** ("+X projetos" etc.): [`src/config/stats.ts`](src/config/stats.ts). Mude `isDemo` para `false` apenas com números reais e verificáveis.
- **Cores:** tokens `brand` (verde), `volt` (azul) e `night` (escuros) em [`src/app/globals.css`](src/app/globals.css).
- **Projetos, FAQ, depoimentos, textos de soluções:** arquivos em [`src/data`](src/data).

> O JSON-LD não publica telefone, e-mail ou endereço enquanto eles forem placeholders, evitando dados falsos para buscadores.

---

## Como configurar o WhatsApp

Em [`src/config/site.ts`](src/config/site.ts):

```ts
contact: {
  whatsapp: "5511999999999",          // 55 + DDD + número, só dígitos
  whatsappDisplay: "(11) 99999-9999", // texto exibido
},
whatsappDefaultMessage: "Olá! Acessei o site e gostaria de receber mais informações sobre as soluções de energia.",
```

Todos os botões usam `buildWhatsAppUrl()` ([`src/lib/whatsapp.ts`](src/lib/whatsapp.ts)), que monta o link `wa.me` com a mensagem codificada.

---

## Como configurar a IA do chat

Sem configuração, o chat responde pela base de conhecimento local ([`src/services/ai/knowledge-base.ts`](src/services/ai/knowledge-base.ts)).

Para ativar a IA (Claude, da Anthropic), defina no `.env.local` ou na Vercel:

```bash
AI_PROVIDER=anthropic
AI_API_KEY=sua-chave
AI_MODEL=claude-opus-5-5
```

Fluxo seguro: navegador → `POST /api/chat` (validação + rate limit) → provedor no servidor. A chave **nunca** vai para o frontend. O prompt de sistema restringe o assistente aos temas da empresa e proíbe prometer valores ou inventar dados. Se a API falhar, a resposta cai automaticamente para o modo demo.

Outro provedor: implemente a interface `ChatProvider` em `src/services/ai/` e adicione um `case` em `getChatProvider()`.

---

## Como conectar o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No **SQL Editor**, execute [`supabase/schema.sql`](supabase/schema.sql) (tabelas `leads`, `projects`, `faq`, `testimonials`, `site_settings` com RLS).
3. Em *Project Settings → API*, copie URL, `anon key` e `service_role key` para as variáveis:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...   # secreta, apenas servidor
   ```
4. Reinicie o servidor. `/api/leads` e `/api/contact` passam a gravar no Supabase automaticamente (veja `/admin/configuracoes`).

Próximos passos sugeridos para produção:

- **Admin com dados reais:** trocar `useDemoLeads` por chamadas a rotas autenticadas (ex.: `GET /api/admin/leads` usando `getLeadRepository().list()` e `updateStatus()`).
- **Supabase Auth:** login da equipe e verificação de sessão em `src/proxy.ts` no lugar do Basic Auth.
- **Supabase Storage:** bucket `projects` para fotos; salve o caminho em `projects.image_path` e exiba com `next/image`.
- **Conteúdo dinâmico:** ler `projects`, `faq` e `testimonials` do banco nas páginas (Server Components) com revalidação.

---

## Como publicar na Vercel

1. Envie o projeto para o GitHub:
   ```bash
   git init
   git add .
   git commit -m "Site energia solar e mobilidade elétrica"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
   git push -u origin main
   ```
2. Em [vercel.com/new](https://vercel.com/new), importe o repositório (framework detectado automaticamente: Next.js).
3. Em *Environment Variables*, cadastre ao menos `NEXT_PUBLIC_SITE_URL` (a URL final) e, recomendado, `ADMIN_BASIC_AUTH_USER`/`ADMIN_BASIC_AUTH_PASSWORD`.
4. Clique em **Deploy**. Cada novo `git push` gera um deploy automático; Pull Requests geram URLs de pré-visualização.
5. Domínio próprio: *Project → Settings → Domains*.

> Em ambiente serverless, o repositório em memória é reiniciado com frequência; para guardar leads de verdade, conecte o Supabase.

---

## Modo demonstração — o que é fictício

Para não apresentar informações falsas como reais, os itens abaixo são placeholders identificados no site:

| Item | Onde alterar | Como aparece |
|---|---|---|
| Nome "Sua Empresa", CNPJ `00.000.000/0000-00`, telefone `(00)…`, endereço "a definir" | `src/config/site.ts` | Placeholder evidente |
| Indicadores (+projetos, +kWp…) | `src/config/stats.ts` | Selo "Dado demonstrativo" |
| Projetos do portfólio | `src/data/projects.ts` | Selo "Projeto demonstrativo" + "localização demonstrativa" |
| Depoimentos | `src/data/testimonials.ts` ou Google | Selo "Depoimento demonstrativo" (texto de espaço reservado) |
| Leads, orçamentos e valores do admin | `src/data/mock/leads.ts`, `src/lib/admin-metrics.ts` | Faixa "Modo demonstração" no painel |
| Parâmetros dos simuladores | `src/lib/simulators/` | Aviso de valores estimados |

Não há certificações, parceiros, clientes ou números apresentados como verdadeiros.

---

## Checklist antes de ir para produção

- [ ] Dados reais em `src/config/site.ts` (nome, CNPJ, contatos, endereço, redes) e logo em `public/`
- [ ] `NEXT_PUBLIC_DEMO_MODE=false` e `NEXT_PUBLIC_SITE_URL` com o domínio final
- [ ] Indicadores, projetos e depoimentos reais (com autorização dos clientes)
- [ ] Supabase conectado e painel com autenticação (Supabase Auth)
- [ ] Parâmetros dos simuladores revisados pela engenharia (tarifas, irradiação por município, Lei 14.300)
- [ ] Política de Privacidade revisada pelo jurídico
- [ ] Rate limit compartilhado (ex.: Upstash Redis) se houver múltiplas instâncias
- [ ] Content-Security-Policy definida após escolher ferramentas de analytics
- [ ] Google Search Console com o `sitemap.xml`
