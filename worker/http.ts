/** Utilitários HTTP compartilhados pelas rotas do Worker. */

export interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  CHAT_LIMITER?: { limit(options: { key: string }): Promise<{ success: boolean }> };
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  // Chat (Gemini)
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  // "Não sou robô" (Cloudflare Turnstile) e envio de leads pelo servidor
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  LEAD_SUBMIT_SECRET?: string;
  // Backup mensal por e-mail (Resend)
  BACKUP_SECRET?: string;
  RESEND_API_KEY?: string;
  BACKUP_EMAIL?: string;
}

/** Tamanho máximo do corpo das requisições (as maiores são o chat e o formulário). */
export const MAX_BODY_BYTES = 64 * 1024;

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
      "Referrer-Policy": "no-referrer",
    },
  });

export const clientIp = (request: Request) => request.headers.get("CF-Connecting-IP") ?? "anon";

/** `true` se passou do limite de requisições por minuto deste IP para a rota. */
export async function limited(env: Env, request: Request, route: string) {
  return Boolean(env.CHAT_LIMITER && !(await env.CHAT_LIMITER.limit({ key: `${route}:${clientIp(request)}` })).success);
}

/**
 * Confere que o POST veio do próprio site, em JSON e com tamanho aceitável, e
 * devolve o corpo. Em caso de problema, devolve a resposta de erro.
 */
export async function readJsonPost(request: Request): Promise<{ body: unknown } | { error: Response }> {
  if (request.method !== "POST") return { error: json({ error: "Método não permitido." }, 405) };
  // Navegadores sempre enviam Origin em POST.
  const origin = request.headers.get("Origin");
  if (!origin || origin !== new URL(request.url).origin) return { error: json({ error: "Origem não permitida." }, 403) };
  if (!request.headers.get("Content-Type")?.includes("application/json")) return { error: json({ error: "Formato inválido." }, 415) };
  if (Number(request.headers.get("Content-Length") ?? 0) > MAX_BODY_BYTES) return { error: json({ error: "Mensagem muito grande." }, 413) };
  const raw = await request.text().catch(() => "");
  if (raw.length > MAX_BODY_BYTES) return { error: json({ error: "Mensagem muito grande." }, 413) };
  try {
    return { body: JSON.parse(raw) };
  } catch {
    return { body: null };
  }
}

/** Chama uma função do banco (RPC) pela API do Supabase. */
export async function supabaseRpc<T>(env: Env, fn: string, args: unknown, userJwt?: string): Promise<T> {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) throw new Error("Supabase não configurado");
  const response = await fetch(`${env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${userJwt ?? env.SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  });
  const data = (await response.json().catch(() => null)) as T & { message?: string };
  if (!response.ok) throw new RpcError(response.status, data?.message ?? `Supabase respondeu ${response.status}`);
  return data;
}

export class RpcError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
