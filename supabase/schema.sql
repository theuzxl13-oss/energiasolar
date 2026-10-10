-- =============================================================================
-- DC eco energy — Banco de dados (Supabase / PostgreSQL)
-- Execute este arquivo inteiro no Supabase: SQL Editor → New query → Run.
-- Pode ser executado mais de uma vez (é idempotente).
--
-- Segurança (Row Level Security):
--   • Visitantes do site (anônimos): podem ENVIAR leads e LER conteúdo publicado.
--   • Usuários logados: veem/editam apenas os orçamentos e contratos que criaram.
--   • Administradores (profiles.role = 'admin'): veem e gerenciam tudo.
--   • Novos cargos: basta usar outros valores em profiles.role e criar políticas.
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Perfis de usuário (1 por login) e cargos
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '',
  email       text not null default '',
  role        text not null default 'usuario',   -- 'admin' | 'usuario' | futuros cargos
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Cria o perfil automaticamente quando um login é criado.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Verdadeiro se o usuário logado for administrador ativo.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and active);
$$;

-- Verdadeiro se o usuário logado tiver perfil ativo (qualquer cargo).
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and active);
$$;

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- -----------------------------------------------------------------------------
-- Leads (formulários do site)
-- -----------------------------------------------------------------------------
create table if not exists public.leads (
  id             uuid primary key default gen_random_uuid(),
  name           text not null check (char_length(name) between 3 and 120),
  phone          text not null check (char_length(phone) <= 30),
  email          text not null check (char_length(email) <= 160),
  city           text not null check (char_length(city) <= 80),
  state          char(2) not null,
  client_type    text,
  service        text not null,
  property_type  text,
  average_bill   numeric(12,2),
  ev_count       integer,
  message        text not null default '' check (char_length(message) <= 2000),
  source         text not null default 'orcamento',
  status         text not null default 'novo',
  metadata       jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists leads_created_at_idx on public.leads (created_at desc);
drop trigger if exists leads_updated_at on public.leads;
create trigger leads_updated_at before update on public.leads for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Orçamentos e contratos (documento completo em JSON + colunas para listagem)
-- -----------------------------------------------------------------------------
create table if not exists public.quotes (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null default auth.uid() references public.profiles (id),
  number       text not null unique,
  status       text not null default 'rascunho',
  title        text not null default '',
  client_name  text not null default '',
  total        numeric(14,2) not null default 0,
  doc          jsonb not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists quotes_owner_idx on public.quotes (owner_id);
drop trigger if exists quotes_updated_at on public.quotes;
create trigger quotes_updated_at before update on public.quotes for each row execute function public.set_updated_at();

create table if not exists public.contracts (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null default auth.uid() references public.profiles (id),
  quote_id     uuid references public.quotes (id) on delete set null,
  number       text not null unique,
  status       text not null default 'rascunho',
  title        text not null default '',
  client_name  text not null default '',
  total        numeric(14,2) not null default 0,
  doc          jsonb not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists contracts_owner_idx on public.contracts (owner_id);
drop trigger if exists contracts_updated_at on public.contracts;
create trigger contracts_updated_at before update on public.contracts for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Conteúdo do site (editável pelo painel)
-- -----------------------------------------------------------------------------
create table if not exists public.projects (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique,
  title              text not null,
  category           text not null check (category in ('solar','carregadores','eletropostos')),
  segment            text not null default '',
  location           text not null default '',
  power              text not null default '',
  summary            text not null default '',
  description        text not null default '',
  result             text not null default '',
  estimated_savings  text not null default '',
  technical_info     jsonb not null default '[]'::jsonb,
  highlights         jsonb not null default '[]'::jsonb,
  art                text not null default 'solar-home',
  image_url          text,
  is_demo            boolean not null default false,
  published          boolean not null default true,
  position           integer not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
drop trigger if exists projects_updated_at on public.projects;
create trigger projects_updated_at before update on public.projects for each row execute function public.set_updated_at();

create table if not exists public.faq (
  id         uuid primary key default gen_random_uuid(),
  question   text not null,
  answer     text not null,
  category   text not null default 'geral' check (category in ('solar','carregadores','eletropostos','geral')),
  position   integer not null default 0,
  published  boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.testimonials (
  id          uuid primary key default gen_random_uuid(),
  author      text not null,
  role        text not null default '',
  content     text not null,
  rating      smallint not null default 5 check (rating between 1 and 5),
  service     text not null default '',
  authorized  boolean not null default false,  -- autorização do cliente para publicar
  published   boolean not null default false,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.profiles     enable row level security;
alter table public.leads        enable row level security;
alter table public.quotes       enable row level security;
alter table public.contracts    enable row level security;
alter table public.projects     enable row level security;
alter table public.faq          enable row level security;
alter table public.testimonials enable row level security;

-- Recria as políticas (permite reexecutar o arquivo).
do $$ declare r record; begin
  for r in select policyname, tablename from pg_policies where schemaname = 'public'
    and tablename in ('profiles','leads','quotes','contracts','projects','faq','testimonials')
  loop execute format('drop policy %I on public.%I', r.policyname, r.tablename); end loop;
end $$;

-- Perfis: cada um lê o próprio; admin lê e gerencia todos.
create policy "perfil próprio" on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "admin gerencia perfis" on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Leads: o site (anônimo) só pode enviar; a equipe lê; admin gerencia.
create policy "site envia leads" on public.leads for insert to anon, authenticated with check (status = 'novo');
create policy "equipe lê leads" on public.leads for select to authenticated using (public.is_staff());
create policy "equipe atualiza leads" on public.leads for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "admin exclui leads" on public.leads for delete to authenticated using (public.is_admin());

-- Orçamentos e contratos: dono ou admin.
create policy "dono ou admin lê orçamentos" on public.quotes for select to authenticated using (owner_id = auth.uid() or public.is_admin());
create policy "equipe cria orçamentos" on public.quotes for insert to authenticated with check (owner_id = auth.uid() and public.is_staff());
create policy "dono ou admin edita orçamentos" on public.quotes for update to authenticated using (owner_id = auth.uid() or public.is_admin()) with check (owner_id = auth.uid() or public.is_admin());
create policy "dono ou admin exclui orçamentos" on public.quotes for delete to authenticated using (owner_id = auth.uid() or public.is_admin());

create policy "dono ou admin lê contratos" on public.contracts for select to authenticated using (owner_id = auth.uid() or public.is_admin());
create policy "equipe cria contratos" on public.contracts for insert to authenticated with check (owner_id = auth.uid() and public.is_staff());
create policy "dono ou admin edita contratos" on public.contracts for update to authenticated using (owner_id = auth.uid() or public.is_admin()) with check (owner_id = auth.uid() or public.is_admin());
create policy "dono ou admin exclui contratos" on public.contracts for delete to authenticated using (owner_id = auth.uid() or public.is_admin());

-- Conteúdo do site: público lê o que está publicado; admin gerencia.
create policy "público lê projetos" on public.projects for select to anon, authenticated using (published or public.is_admin());
create policy "admin gerencia projetos" on public.projects for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "público lê faq" on public.faq for select to anon, authenticated using (published or public.is_admin());
create policy "admin gerencia faq" on public.faq for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "público lê depoimentos" on public.testimonials for select to anon, authenticated using ((published and authorized) or public.is_admin());
create policy "admin gerencia depoimentos" on public.testimonials for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- Armazenamento de fotos dos projetos (Supabase Storage)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('projects', 'projects', true) on conflict (id) do nothing;

drop policy if exists "fotos de projetos são públicas" on storage.objects;
drop policy if exists "admin envia fotos de projetos" on storage.objects;
drop policy if exists "admin altera fotos de projetos" on storage.objects;
drop policy if exists "admin remove fotos de projetos" on storage.objects;
create policy "fotos de projetos são públicas" on storage.objects for select to anon, authenticated using (bucket_id = 'projects');
create policy "admin envia fotos de projetos" on storage.objects for insert to authenticated with check (bucket_id = 'projects' and public.is_admin());
create policy "admin altera fotos de projetos" on storage.objects for update to authenticated using (bucket_id = 'projects' and public.is_admin());
create policy "admin remove fotos de projetos" on storage.objects for delete to authenticated using (bucket_id = 'projects' and public.is_admin());

-- -----------------------------------------------------------------------------
-- Tornar um usuário ADMINISTRADOR (rode depois de criar o login no painel do
-- Supabase: Authentication → Users → Add user). Troque o e-mail abaixo:
--
--   update public.profiles set role = 'admin' where email = 'seu-email@exemplo.com';
-- -----------------------------------------------------------------------------
