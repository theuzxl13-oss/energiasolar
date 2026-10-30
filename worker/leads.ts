/**
 * Formulários do site → servidor → banco.
 * Confere o "não sou robô" (Cloudflare Turnstile), valida com as mesmas regras
 * do formulário e grava pela função `submit_lead` do banco (com segredo).
 */
import { buildContactLead, buildLead, leadToRow } from "../src/lib/leads/build";
import type { ContactFormInput, LeadApiPayload } from "../src/lib/validations/lead";
import { clientIp, json, limited, readJsonPost, RpcError, supabaseRpc, type Env } from "./http";

/** O envio pelo servidor está pronto quando os três segredos foram cadastrados. */
export const leadsViaServer = (env: Env) => Boolean(env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY && env.LEAD_SUBMIT_SECRET);

/** GET /api/leads/config: o site descobre se deve mostrar o "não sou robô". */
export function leadsConfig(env: Env) {
  return json({ enabled: leadsViaServer(env), siteKey: leadsViaServer(env) ? env.TURNSTILE_SITE_KEY : null });
}

/** POST /api/leads  { kind: "lead" | "contact", payload, token } */
export async function submitLead(request: Request, env: Env) {
  const read = await readJsonPost(request);
  if ("error" in read) return read.error;
  if (!leadsViaServer(env)) return json({ error: "Envio pelo servidor não configurado." }, 503);
  if (await limited(env, request, "lead")) return json({ error: "Muitos envios em pouco tempo. Aguarde um instante." }, 429);

  const body = (read.body ?? {}) as { kind?: string; payload?: unknown; token?: unknown };
  if (typeof body.token !== "string" || !body.token || body.token.length > 4096) {
    return json({ error: "Confirme que você não é um robô." }, 400);
  }
  if (!(await turnstileOk(env, body.token, request))) {
    return json({ error: "Não foi possível confirmar que você não é um robô. Tente novamente." }, 403);
  }

  const built =
    body.kind === "contact" ? buildContactLead((body.payload ?? {}) as ContactFormInput) : buildLead((body.payload ?? {}) as LeadApiPayload);
  if (!built.ok) return json({ error: "Verifique os campos do formulário.", fieldErrors: built.fieldErrors }, 422);

  try {
    await supabaseRpc(env, "submit_lead", { lead: leadToRow(built.lead), secret: env.LEAD_SUBMIT_SECRET });
    return json({ lead: built.lead });
  } catch (error) {
    if (error instanceof RpcError && /Muitos envios/.test(error.message)) return json({ error: "Muitos envios. Tente novamente mais tarde." }, 429);
    console.error("[leads] Falha ao gravar:", error instanceof Error ? error.message : error);
    return json({ error: "Não foi possível enviar agora. Tente novamente ou fale conosco pelo WhatsApp." }, 502);
  }
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
