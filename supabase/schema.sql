-- =============================================================================
-- Schema inicial — Supabase / PostgreSQL
-- Execute no SQL Editor do Supabase (ou via `supabase db push`).
-- =============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Leads (orçamentos e contatos)
-- ----------------------------------------------------------------------------
create table if not exists public.leads (
  id             uuid primary key default gen_random_uuid(),
  name           text not null check (char_length(name) between 3 and 120),
  phone          text not null,
  email          text not null,
  city           text not null,
  state          char(2) not null,
  client_type    text check (client_type in ('pessoa_fisica','empresa','condominio','produtor_rural','poder_publico')),
  service        text not null check (service in ('energia_solar','carregador_residencial','carregador_empresarial','condominio','eletroposto','frota','manutencao','outro')),
  property_type  text check (property_type in ('residencial','comercial','industrial','rural','condominio','outro')),
  average_bill   numeric(12,2),
  ev_count       integer,
  message        text not null default '',
  source         text not null default 'orcamento' check (source in ('orcamento','contato','simulador_solar','simulador_carregador','chat')),
  status         text not null default 'novo' check (status in ('novo','em_contato','orcamento_enviado','negociacao','fechado','perdido')),
  metadata       jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_status_idx on public.leads (status);
create index if not exists leads_service_idx on public.leads (service);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists leads_updated_at on public.leads;
create trigger leads_updated_at before update on public.leads
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Conteúdo gerenciável pelo painel
-- ----------------------------------------------------------------------------
create table if not exists public.projects (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique not null,
  title            text not null,
  category         text not null check (category in ('solar','carregadores','eletropostos')),
  segment          text,
  location         text,
  power            text,
  summary          text,
  description      text,
  result           text,
  estimated_savings text,
  technical_info   jsonb not null default '[]'::jsonb,
  highlights       jsonb not null default '[]'::jsonb,
  image_path       text,          -- caminho no Supabase Storage (bucket "projects")
  published        boolean not null default false,
  created_at       timestamptz not null default now()
);

create table if not exists public.faq (
  id         uuid primary key default gen_random_uuid(),
  question   text not null,
  answer     text not null,
  category   text not null default 'geral' check (category in ('solar','carregadores','eletropostos','geral')),
  position   integer not null default 0,
  published  boolean not null default true
);

create table if not exists public.testimonials (
  id         uuid primary key default gen_random_uuid(),
  author     text not null,
  role       text,
  content    text not null,
  rating     smallint not null default 5 check (rating between 1 and 5),
  service    text,
  source     text not null default 'manual' check (source in ('manual','google')),
  authorized boolean not null default false, -- autorização do cliente para publicação
  published  boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Segurança (Row Level Security)
-- O site grava leads pela rota /api/leads usando a SERVICE_ROLE_KEY no
-- servidor, que ignora RLS. Visitantes anônimos NÃO têm acesso direto.
-- Usuários autenticados (equipe, via Supabase Auth) podem gerenciar dados.
-- ----------------------------------------------------------------------------
alter table public.leads         enable row level security;
alter table public.projects      enable row level security;
alter table public.faq           enable row level security;
alter table public.testimonials  enable row level security;
alter table public.site_settings enable row level security;

create policy "equipe gerencia leads" on public.leads
  for all to authenticated using (true) with check (true);

create policy "conteúdo publicado é público" on public.projects
  for select to anon, authenticated using (published);
create policy "equipe gerencia projetos" on public.projects
  for all to authenticated using (true) with check (true);

create policy "faq publicado é público" on public.faq
  for select to anon, authenticated using (published);
create policy "equipe gerencia faq" on public.faq
  for all to authenticated using (true) with check (true);

create policy "depoimentos publicados são públicos" on public.testimonials
  for select to anon, authenticated using (published and authorized);
create policy "equipe gerencia depoimentos" on public.testimonials
  for all to authenticated using (true) with check (true);

create policy "configurações são públicas" on public.site_settings
  for select to anon, authenticated using (true);
create policy "equipe gerencia configurações" on public.site_settings
  for all to authenticated using (true) with check (true);
