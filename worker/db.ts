/**
 * Banco de dados D1 (Cloudflare). As tabelas são criadas automaticamente na
 * primeira requisição de cada instância do Worker (comandos idempotentes).
 */

export interface D1Result<T = Record<string, unknown>> {
  results: T[];
  meta: { changes?: number };
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  run(): Promise<D1Result>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
}

const SCHEMA = [
  // Equipe do painel
  `create table if not exists users (
    id text primary key,
    email text not null unique,
    name text not null default '',
    role text not null default 'usuario',
    active integer not null default 1,
    password_hash text not null,
    totp_secret text,
    totp_pending text,
    totp_last_step integer not null default 0,
    created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  )`,
  `create table if not exists sessions (
    token_hash text primary key,
    user_id text not null references users(id) on delete cascade,
    aal integer not null default 1,
    created_at integer not null,
    expires_at integer not null
  )`,
  `create index if not exists sessions_user on sessions(user_id)`,
  `create table if not exists recovery_codes (
    user_id text not null references users(id) on delete cascade,
    code_hash text not null,
    used_at text,
    primary key (user_id, code_hash)
  )`,
  `create table if not exists password_resets (
    token_hash text primary key,
    user_id text not null references users(id) on delete cascade,
    expires_at integer not null,
    used_at integer
  )`,
  // Tentativas que falharam (login, código, código reserva): freio contra adivinhação
  `create table if not exists failures (key text not null, at integer not null)`,
  `create index if not exists failures_key on failures(key, at)`,
  // Dados do site
  `create table if not exists leads (
    id text primary key,
    name text not null,
    phone text not null,
    email text not null,
    city text not null,
    state text not null,
    client_type text,
    service text not null,
    property_type text,
    average_bill real,
    ev_count integer,
    message text not null default '',
    source text not null default 'orcamento',
    status text not null default 'novo',
    metadata text,
    created_at text not null,
    updated_at text not null
  )`,
  `create index if not exists leads_created on leads(created_at desc)`,
  `create index if not exists leads_email on leads(email, created_at)`,
  `create table if not exists quotes (
    id text primary key,
    owner_id text,
    number text not null unique,
    status text not null default 'rascunho',
    title text not null default '',
    client_name text not null default '',
    total real not null default 0,
    doc text not null,
    created_at text not null,
    updated_at text not null
  )`,
  `create table if not exists contracts (
    id text primary key,
    owner_id text,
    number text not null unique,
    status text not null default 'rascunho',
    title text not null default '',
    client_name text not null default '',
    total real not null default 0,
    doc text not null,
    created_at text not null,
    updated_at text not null
  )`,
  `create table if not exists site_content (key text primary key, value text not null, updated_at text not null)`,
  // Fotos dos projetos (até ~1,5 MB cada, já reduzidas no painel)
  `create table if not exists images (id text primary key, content_type text not null, data blob not null, created_at text not null)`,
];

let ready: Promise<void> | null = null;

export function ensureSchema(db: D1Database) {
  ready ??= db
    .batch(SCHEMA.map((sql) => db.prepare(sql)))
    .then(() => undefined)
    .catch((error) => {
      ready = null;
      throw error;
    });
  return ready;
}

export const nowIso = () => new Date().toISOString();
export const nowMs = () => Date.now();

/** Registra uma falha e diz se o limite foi atingido (ex.: 5 erros em 15 min). */
export async function tooManyFailures(db: D1Database, key: string, max: number, windowMs: number) {
  const since = nowMs() - windowMs;
  const row = await db.prepare("select count(*) as n from failures where key = ? and at > ?").bind(key, since).first<{ n: number }>();
  return (row?.n ?? 0) >= max;
}

export async function recordFailure(db: D1Database, key: string) {
  await db.batch([
    db.prepare("insert into failures (key, at) values (?, ?)").bind(key, nowMs()),
    // Faxina: falhas com mais de 1 dia não importam mais.
    db.prepare("delete from failures where at < ?").bind(nowMs() - 86_400_000),
  ]);
}
