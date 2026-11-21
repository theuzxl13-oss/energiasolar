/** Utilitários HTTP compartilhados pelas rotas do Worker. */
import type { D1Database } from "./db";

export interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  DB: D1Database;
  CHAT_LIMITER?: { limit(options: { key: string }): Promise<{ success: boolean }> };
  /** Código pedido na tela de configuração inicial (criação do primeiro administrador). */
  ADMIN_SETUP_SECRET?: string;
  /** "true" liga a verificação em duas etapas (código do app) no login do painel. */
  REQUIRE_MFA?: string;
  // Chat (Gemini)
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  // "Não sou robô" (Cloudflare Turnstile)
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  // E-mails (backup mensal e recuperação de senha) pelo Resend
  RESEND_API_KEY?: string;
  BACKUP_EMAIL?: string;
}

/** Tamanho máximo do corpo JSON (o maior é a importação de dados, feita em partes). */
export const MAX_BODY_BYTES = 64 * 1024;

const SECURITY_HEADERS = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
  "Referrer-Policy": "no-referrer",
};

export const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", ...SECURITY_HEADERS, ...headers } });

export const clientIp = (request: Request) => request.headers.get("CF-Connecting-IP") ?? "anon";

/** `true` se passou do limite de requisições por minuto deste IP para a rota. */
export async function limited(env: Env, request: Request, route: string) {
  return Boolean(env.CHAT_LIMITER && !(await env.CHAT_LIMITER.limit({ key: `${route}:${clientIp(request)}` })).success);
}

/** Requisições que alteram dados só valem vindas do próprio site (navegadores sempre enviam Origin). */
export function sameOrigin(request: Request) {
  const origin = request.headers.get("Origin");
  return Boolean(origin) && origin === new URL(request.url).origin;
}

/**
 * Confere método, origem, JSON e tamanho, e devolve o corpo. Em caso de
 * problema, devolve a resposta de erro.
 */
export async function readJson(
  request: Request,
  { methods = ["POST"], maxBytes = MAX_BODY_BYTES }: { methods?: string[]; maxBytes?: number } = {},
): Promise<{ body: unknown } | { error: Response }> {
  if (!methods.includes(request.method)) return { error: json({ error: "Método não permitido." }, 405) };
  if (!sameOrigin(request)) return { error: json({ error: "Origem não permitida." }, 403) };
  if (!request.headers.get("Content-Type")?.includes("application/json")) return { error: json({ error: "Formato inválido." }, 415) };
  if (Number(request.headers.get("Content-Length") ?? 0) > maxBytes) return { error: json({ error: "Conteúdo muito grande." }, 413) };
  const raw = await request.text().catch(() => "");
  if (raw.length > maxBytes) return { error: json({ error: "Conteúdo muito grande." }, 413) };
  try {
    return { body: JSON.parse(raw) };
  } catch {
    return { body: null };
  }
}

export const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

export const str = (value: unknown, max = 500) => (typeof value === "string" ? value.trim().slice(0, max) : "");

/** E-mail pelo Resend (sem domínio próprio, só entrega para o e-mail da conta Resend). */
export async function sendEmail(env: Env, message: { to: string; subject: string; html: string; attachments?: { filename: string; content: string }[] }) {
  if (!env.RESEND_API_KEY) throw new Error("Resend não configurado");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "Site DC Eco Energy <onboarding@resend.dev>", to: [message.to], subject: message.subject, html: message.html, attachments: message.attachments }),
  });
  if (!response.ok) throw new Error(`Resend respondeu ${response.status}: ${(await response.text()).slice(0, 200)}`);
}

export const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
