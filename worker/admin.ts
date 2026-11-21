/**
 * Rotas de dados do painel (todas exigem login com a segunda etapa) e as
 * rotas públicas de leitura do conteúdo do site e das fotos.
 */
import { requireAdmin, requireStaff } from "./auth";
import { nowIso, type D1Database } from "./db";
import { isObject, json, readJson, sameOrigin, str, type Env } from "./http";

export const CONTENT_KEYS = ["content:site-settings", "content:projects", "content:solutions", "content:faq"];
const DOC_TABLES = ["quotes", "contracts"] as const;
type DocTable = (typeof DOC_TABLES)[number];

const LEAD_STATUSES = ["novo", "em_contato", "orcamento_enviado", "negociacao", "fechado", "perdido"];
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 1_500_000;

const safeDecode = (segment: string) => {
  try {
    return decodeURIComponent(segment);
  } catch {
    return "";
  }
};

const parse = (text: unknown) => {
  try {
    return typeof text === "string" ? JSON.parse(text) : null;
  } catch {
    return null;
  }
};

/* ---------------------------- Público (visitantes) ------------------------- */

/** GET /api/content: conteúdo editado no painel (empresa, projetos, serviços, FAQ). */
export async function publicContent(env: Env) {
  const { results } = await env.DB.prepare("select key, value from site_content").all<{ key: string; value: string }>();
  return json(
    results.map((row) => ({ key: row.key, value: parse(row.value) })),
    200,
    // Visitantes veem a edição em até 1 minuto; o painel pede sem cache.
    { "Cache-Control": "public, max-age=60" },
  );
}

/** GET /api/images/:id: foto de projeto. */
export async function publicImage(env: Env, id: string) {
  const row = await env.DB.prepare("select content_type, data from images where id = ?").bind(id).first<{ content_type: string; data: ArrayBuffer | number[] }>();
  if (!row) return json({ error: "Imagem não encontrada." }, 404);
  return new Response(row.data instanceof ArrayBuffer ? row.data : new Uint8Array(row.data), {
    headers: {
      "Content-Type": row.content_type,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}

/* ------------------------------- Painel ------------------------------------ */

export async function handleAdmin(request: Request, env: Env, path: string): Promise<Response> {
  // Leads
  if (path === "/api/admin/leads" && request.method === "GET") {
    const session = await requireStaff(request, env);
    if (session instanceof Response) return session;
    const { results } = await env.DB.prepare("select * from leads order by created_at desc").all();
    return json(results.map((row) => ({ ...row, metadata: parse(row.metadata) })));
  }
  const leadMatch = path.match(/^\/api\/admin\/leads\/([\w%-]{1,120})$/);
  if (leadMatch && request.method === "PATCH") {
    const read = await readJson(request, { methods: ["PATCH"] });
    if ("error" in read) return read.error;
    const session = await requireStaff(request, env);
    if (session instanceof Response) return session;
    const status = str(isObject(read.body) ? read.body.status : "", 40);
    if (!LEAD_STATUSES.includes(status)) return json({ error: "Status inválido." }, 422);
    await env.DB.prepare("update leads set status = ?, updated_at = ? where id = ?").bind(status, nowIso(), safeDecode(leadMatch[1]!)).run();
    return json({ ok: true });
  }
  if (leadMatch && request.method === "DELETE") {
    const session = await requireAdmin(request, env);
    if (session instanceof Response) return session;
    await env.DB.prepare("delete from leads where id = ?").bind(safeDecode(leadMatch[1]!)).run();
    return json({ ok: true });
  }

  // Orçamentos e contratos
  const docMatch = path.match(/^\/api\/admin\/(quotes|contracts)(?:\/([\w%-]{1,200}))?$/);
  if (docMatch) return documents(request, env, docMatch[1] as DocTable, docMatch[2] === undefined ? undefined : safeDecode(docMatch[2]));

  // Conteúdo do site
  const contentMatch = path.match(/^\/api\/admin\/content\/([^/]{1,80})$/);
  if (contentMatch) {
    // O navegador codifica o ":" da chave (content%3Afaq).
    const key = safeDecode(contentMatch[1]!);
    if (!CONTENT_KEYS.includes(key)) return json({ error: "Conteúdo desconhecido." }, 404);
    if (request.method === "DELETE") {
      const session = await requireAdmin(request, env);
      if (session instanceof Response) return session;
      await env.DB.prepare("delete from site_content where key = ?").bind(key).run();
      return json({ ok: true });
    }
    const read = await readJson(request, { methods: ["PUT"], maxBytes: 512 * 1024 });
    if ("error" in read) return read.error;
    const session = await requireAdmin(request, env);
    if (session instanceof Response) return session;
    if (!isObject(read.body) || !("value" in read.body)) return json({ error: "Conteúdo inválido." }, 422);
    // Fotos vão para /api/admin/images antes; aqui só ficam os endereços.
    if (JSON.stringify(read.body.value).includes('"data:')) return json({ error: "Envie as fotos antes de salvar." }, 422);
    await env.DB.prepare("insert into site_content (key, value, updated_at) values (?, ?, ?) on conflict(key) do update set value = excluded.value, updated_at = excluded.updated_at")
      .bind(key, JSON.stringify(read.body.value), nowIso())
      .run();
    return json({ ok: true });
  }

  // Fotos
  if (path === "/api/admin/images" && request.method === "POST") return uploadImage(request, env);

  // Backup para baixar e importação (restauração ou vindo do Supabase)
  if (path === "/api/admin/backup" && request.method === "GET") {
    const session = await requireAdmin(request, env);
    if (session instanceof Response) return session;
    return json(await exportAll(env.DB), 200, { "Content-Disposition": `attachment; filename="backup-${nowIso().slice(0, 10)}.json"` });
  }
  if (path === "/api/admin/import" && request.method === "POST") return importRows(request, env);

  return json({ error: "Não encontrado." }, 404);
}

async function documents(request: Request, env: Env, table: DocTable, id?: string) {
  if (request.method === "GET" && !id) {
    const session = await requireStaff(request, env);
    if (session instanceof Response) return session;
    // Dono vê os seus; administrador vê todos (como era no Supabase).
    const { results } =
      session.user.role === "admin"
        ? await env.DB.prepare(`select doc from ${table}`).all<{ doc: string }>()
        : await env.DB.prepare(`select doc from ${table} where owner_id = ?`).bind(session.user.id).all<{ doc: string }>();
    return json(results.map((row) => parse(row.doc)).filter(Boolean));
  }
  if (!id) return json({ error: "Não encontrado." }, 404);

  if (request.method === "DELETE") {
    const session = await requireStaff(request, env);
    if (session instanceof Response) return session;
    const owner = await env.DB.prepare(`select owner_id from ${table} where id = ?`).bind(id).first<{ owner_id: string | null }>();
    if (owner && owner.owner_id !== session.user.id && session.user.role !== "admin") return json({ error: "Sem permissão." }, 403);
    await env.DB.prepare(`delete from ${table} where id = ?`).bind(id).run();
    return json({ ok: true });
  }

  const read = await readJson(request, { methods: ["PUT"], maxBytes: 256 * 1024 });
  if ("error" in read) return read.error;
  const session = await requireStaff(request, env);
  if (session instanceof Response) return session;
  const body = isObject(read.body) ? read.body : {};
  const doc = isObject(body.doc) ? body.doc : null;
  const summary = isObject(body.summary) ? body.summary : {};
  if (!doc || doc.id !== id) return json({ error: "Documento inválido." }, 422);

  const existing = await env.DB.prepare(`select owner_id from ${table} where id = ?`).bind(id).first<{ owner_id: string | null }>();
  if (existing && existing.owner_id !== session.user.id && session.user.role !== "admin") return json({ error: "Sem permissão." }, 403);
  const now = nowIso();
  try {
    await env.DB.prepare(
      `insert into ${table} (id, owner_id, number, status, title, client_name, total, doc, created_at, updated_at)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       on conflict(id) do update set number = excluded.number, status = excluded.status, title = excluded.title,
         client_name = excluded.client_name, total = excluded.total, doc = excluded.doc, updated_at = excluded.updated_at`,
    )
      .bind(id, session.user.id, str(summary.number, 30), str(summary.status, 40), str(summary.title, 300), str(summary.clientName, 200), Number(summary.total) || 0, JSON.stringify(doc), now, now)
      .run();
  } catch (error) {
    if (/UNIQUE/i.test(String(error))) return json({ error: "Já existe um documento com este número." }, 409);
    throw error;
  }
  return json({ ok: true });
}

async function uploadImage(request: Request, env: Env) {
  if (!sameOrigin(request)) return json({ error: "Origem não permitida." }, 403);
  const session = await requireAdmin(request, env);
  if (session instanceof Response) return session;
  const type = (request.headers.get("Content-Type") ?? "").split(";")[0]!.trim();
  if (!IMAGE_TYPES.includes(type)) return json({ error: "Use JPG, PNG ou WebP." }, 415);
  if (Number(request.headers.get("Content-Length") ?? 0) > MAX_IMAGE_BYTES) return json({ error: "Foto muito grande." }, 413);
  const data = await request.arrayBuffer();
  if (!data.byteLength || data.byteLength > MAX_IMAGE_BYTES) return json({ error: "Foto muito grande." }, 413);
  const id = crypto.randomUUID();
  await env.DB.prepare("insert into images (id, content_type, data, created_at) values (?, ?, ?, ?)").bind(id, type, data, nowIso()).run();
  return json({ url: `/api/images/${id}` });
}

/* ------------------------- Exportação e importação ------------------------- */

export async function exportAll(db: D1Database) {
  const [leads, quotes, contracts, content] = await Promise.all([
    db.prepare("select * from leads order by created_at desc").all(),
    db.prepare("select * from quotes order by number").all(),
    db.prepare("select * from contracts order by number").all(),
    db.prepare("select key, value, updated_at from site_content").all<{ key: string; value: string; updated_at: string }>(),
  ]);
  const withDoc = (rows: Record<string, unknown>[]) => rows.map((row) => ({ ...row, doc: parse(row.doc) }));
  return {
    generated_at: nowIso(),
    leads: leads.results.map((row) => ({ ...row, metadata: parse(row.metadata) })),
    quotes: withDoc(quotes.results),
    contracts: withDoc(contracts.results),
    site_content: content.results.map((row) => ({ ...row, value: parse(row.value) })),
  };
}

const iso = (value: unknown) => {
  const date = new Date(typeof value === "string" ? value : "");
  return Number.isNaN(date.getTime()) ? nowIso() : date.toISOString();
};

/**
 * POST /api/admin/import  { table, rows }: recebe o backup em partes (de até 50
 * linhas). Aceita o formato do backup deste site e o exportado do Supabase.
 * Não sobrescreve o que já existe.
 */
async function importRows(request: Request, env: Env) {
  const read = await readJson(request, { maxBytes: 1024 * 1024 });
  if ("error" in read) return read.error;
  const session = await requireAdmin(request, env);
  if (session instanceof Response) return session;
  const body = isObject(read.body) ? read.body : {};
  const rows = Array.isArray(body.rows) ? body.rows.filter(isObject).slice(0, 50) : [];
  const db = env.DB;
  let imported = 0;

  if (body.table === "leads") {
    for (const row of rows) {
      const result = await db
        .prepare(
          `insert or ignore into leads (id, name, phone, email, city, state, client_type, service, property_type, average_bill, ev_count, message, source, status, metadata, created_at, updated_at)
           values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          str(row.id, 80) || crypto.randomUUID(),
          str(row.name, 120),
          str(row.phone, 30),
          str(row.email, 160),
          str(row.city, 80),
          str(row.state, 2),
          str(row.client_type, 40) || null,
          str(row.service, 40),
          str(row.property_type, 40) || null,
          row.average_bill === null || row.average_bill === undefined ? null : Number(row.average_bill),
          row.ev_count === null || row.ev_count === undefined ? null : Number(row.ev_count),
          str(row.message, 2000),
          str(row.source, 40) || "orcamento",
          LEAD_STATUSES.includes(String(row.status)) ? String(row.status) : "novo",
          row.metadata ? JSON.stringify(row.metadata).slice(0, 4096) : null,
          iso(row.created_at),
          iso(row.updated_at ?? row.created_at),
        )
        .run();
      imported += result.meta.changes ?? 0;
    }
  } else if (body.table === "quotes" || body.table === "contracts") {
    for (const row of rows) {
      const doc = isObject(row.doc) ? row.doc : parse(row.doc);
      if (!isObject(doc) || typeof doc.id !== "string") continue;
      const result = await db
        .prepare(
          `insert or ignore into ${body.table} (id, owner_id, number, status, title, client_name, total, doc, created_at, updated_at)
           values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(doc.id, session.user.id, str(row.number, 30), str(row.status, 40), str(row.title, 300), str(row.client_name, 200), Number(row.total) || 0, JSON.stringify(doc), iso(row.created_at), iso(row.updated_at))
        .run();
      imported += result.meta.changes ?? 0;
    }
  } else if (body.table === "site_content") {
    for (const row of rows) {
      const key = str(row.key, 60);
      if (!CONTENT_KEYS.includes(key)) continue;
      let value = isObject(row.value) || Array.isArray(row.value) ? row.value : parse(row.value);
      if (value === null) continue;
      // Fotos que estavam no Supabase passam a morar aqui.
      if (key === "content:projects" && Array.isArray(value)) value = await copyProjectImages(db, value);
      const result = await db
        .prepare("insert or ignore into site_content (key, value, updated_at) values (?, ?, ?)")
        .bind(key, JSON.stringify(value), nowIso())
        .run();
      imported += result.meta.changes ?? 0;
    }
  } else {
    return json({ error: "Tabela desconhecida." }, 422);
  }
  return json({ imported });
}

async function copyProjectImages(db: D1Database, projects: unknown[]) {
  return Promise.all(
    projects.map(async (project) => {
      if (!isObject(project) || typeof project.image !== "string" || !/^https:\/\/[\w-]+\.supabase\.co\/storage\/v1\/object\/public\//.test(project.image)) return project;
      try {
        const response = await fetch(project.image);
        const type = (response.headers.get("Content-Type") ?? "").split(";")[0]!.trim();
        const data = await response.arrayBuffer();
        if (!response.ok || !IMAGE_TYPES.includes(type) || data.byteLength > MAX_IMAGE_BYTES) return project;
        const id = crypto.randomUUID();
        await db.prepare("insert into images (id, content_type, data, created_at) values (?, ?, ?, ?)").bind(id, type, data, nowIso()).run();
        return { ...project, image: `/api/images/${id}` };
      } catch {
        return project;
      }
    }),
  );
}
