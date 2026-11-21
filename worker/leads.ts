/**
 * Formulários do site → servidor → banco D1.
 * Valida com as mesmas regras do formulário, confere o "não sou robô"
 * (Cloudflare Turnstile, quando configurado) e aplica as travas anti-spam.
 */
import { buildContactLead, buildLead, leadToRow } from "../src/lib/leads/build";
import type { ContactFormInput, LeadApiPayload } from "../src/lib/validations/lead";
import { nowIso } from "./db";
import { clientIp, json, limited, readJson, type Env } from "./http";

export const turnstileEnabled = (env: Env) => Boolean(env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY);

/** GET /api/leads/config: o site descobre se deve mostrar o "não sou robô". */
export function leadsConfig(env: Env) {
  return json({ enabled: true, turnstile: turnstileEnabled(env), siteKey: turnstileEnabled(env) ? env.TURNSTILE_SITE_KEY : null });
}

/** POST /api/leads  { kind: "lead" | "contact", payload, token } */
export async function submitLead(request: Request, env: Env) {
  const read = await readJson(request);
  if ("error" in read) return read.error;
  if (await limited(env, request, "lead")) return json({ error: "Muitos envios em pouco tempo. Aguarde um instante." }, 429);

  const body = (read.body ?? {}) as { kind?: string; payload?: unknown; token?: unknown };
  if (turnstileEnabled(env)) {
    if (typeof body.token !== "string" || !body.token || body.token.length > 4096) return json({ error: "Confirme que você não é um robô." }, 400);
    if (!(await turnstileOk(env, body.token, request))) return json({ error: "Não foi possível confirmar que você não é um robô. Tente novamente." }, 403);
  }

  const built =
    body.kind === "contact" ? buildContactLead((body.payload ?? {}) as ContactFormInput) : buildLead((body.payload ?? {}) as LeadApiPayload);
  if (!built.ok) return json({ error: "Verifique os campos do formulário.", fieldErrors: built.fieldErrors }, 422);
  const row = leadToRow(built.lead);
  const metadata = row.metadata ? JSON.stringify(row.metadata) : null;
  if (metadata && metadata.length > 4096) return json({ error: "Dados extras muito grandes." }, 422);

  // Travas anti-spam: mesmo e-mail no máximo 3 vezes por hora; no total, 200 a cada 10 min.
  const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
  const tenMinutesAgo = new Date(Date.now() - 600_000).toISOString();
  const [byEmail, total] = await Promise.all([
    env.DB.prepare("select count(*) as n from leads where lower(email) = lower(?) and created_at > ?").bind(row.email, hourAgo).first<{ n: number }>(),
    env.DB.prepare("select count(*) as n from leads where created_at > ?").bind(tenMinutesAgo).first<{ n: number }>(),
  ]);
  if ((byEmail?.n ?? 0) >= 3 || (total?.n ?? 0) >= 200) return json({ error: "Muitos envios. Tente novamente mais tarde." }, 429);

  const now = nowIso();
  await env.DB.prepare(
    `insert into leads (id, name, phone, email, city, state, client_type, service, property_type, average_bill, ev_count, message, source, status, metadata, created_at, updated_at)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'novo', ?, ?, ?)`,
  )
    .bind(row.id, row.name, row.phone, row.email, row.city, row.state, row.client_type, row.service, row.property_type, row.average_bill, row.ev_count, row.message, row.source, metadata, now, now)
    .run();
  return json({ lead: built.lead });
}

/** Confere o token do Turnstile na Cloudflare (inclui o domínio, contra tokens de outros sites). */
async function turnstileOk(env: Env, token: string, request: Request) {
  const form = new FormData();
  form.append("secret", env.TURNSTILE_SECRET_KEY!);
  form.append("response", token);
  form.append("remoteip", clientIp(request));
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
    const result = (await response.json()) as { success?: boolean; hostname?: string };
    return Boolean(result.success) && (!result.hostname || result.hostname === new URL(request.url).hostname);
  } catch {
    return false;
  }
}
