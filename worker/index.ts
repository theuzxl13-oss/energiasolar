/**
 * Cloudflare Worker: serve o site estático (pasta out/) e as rotas /api/*.
 * Os dados ficam no banco D1 (binding DB, tabelas criadas em worker/db.ts).
 * - /api/auth/*: login do painel com verificação em duas etapas (worker/auth.ts).
 * - /api/admin/*: dados do painel, só com login completo (worker/admin.ts).
 * - /api/content e /api/images/*: conteúdo e fotos públicos do site.
 * - /api/leads: formulários com "não sou robô" (worker/leads.ts).
 * - /api/chat: chat com o Gemini (segredo GEMINI_API_KEY). Sem chave, com erro
 *   ou com a cota gratuita esgotada, responde 503 e o site usa as respostas prontas.
 * - /api/backup/run e cron mensal: backup por e-mail (worker/backup.ts).
 * - /api/status: o que está configurado (tela de Configurações do painel).
 */
import { chatRequestSchema } from "../src/lib/validations/chat";
import { buildSystemPrompt } from "../src/services/ai/knowledge-base";
import type { ChatMessage } from "../src/types";
import { handleAdmin, publicContent, publicImage } from "./admin";
import { handleAuth, handleUsers, mfaRequired } from "./auth";
import { backupConfigured, backupNow, runBackup } from "./backup";
import { ensureSchema } from "./db";
import { json, limited, readJson, type Env } from "./http";
import { leadsConfig, submitLead, turnstileEnabled } from "./leads";

const DEFAULT_MODEL = "gemini-flash-latest";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (!pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
    try {
      return await route(request, env, pathname);
    } catch (error) {
      console.error("[api] Erro inesperado:", error instanceof Error ? error.message : error);
      return json({ error: "Erro inesperado. Tente novamente." }, 500);
    }
  },

  /** Cron mensal (wrangler.jsonc → triggers.crons): backup por e-mail. */
  async scheduled(_controller: unknown, env: Env, ctx: { waitUntil(promise: Promise<unknown>): void }) {
    if (!backupConfigured(env)) return;
    ctx.waitUntil(
      ensureSchema(env.DB)
        .then(() => runBackup(env))
        .catch((error) => console.error("[backup] Falha no envio mensal:", error instanceof Error ? error.message : error)),
    );
  },
};

async function route(request: Request, env: Env, pathname: string): Promise<Response> {
  // Rotas que não usam o banco
  if (pathname === "/api/chat/status") return chatStatus(request, env);
  if (pathname === "/api/leads/config") return leadsConfig(env);

  await ensureSchema(env.DB);
  if (pathname.startsWith("/api/auth/")) return handleAuth(request, env, pathname);
  if (pathname.startsWith("/api/admin/users")) return handleUsers(request, env, pathname);
  if (pathname.startsWith("/api/admin/")) return handleAdmin(request, env, pathname);
  if (pathname === "/api/content" && request.method === "GET") return publicContent(env);
  const image = pathname.match(/^\/api\/images\/([0-9a-f-]{36})$/);
  if (image && request.method === "GET") return publicImage(env, image[1]!);

  switch (pathname) {
    case "/api/chat":
      return handleChat(request, env);
    case "/api/leads":
      return submitLead(request, env);
    case "/api/backup/run":
      return backupNow(request, env);
    case "/api/status":
      return json({ database: true, mfa: mfaRequired(env), turnstile: turnstileEnabled(env), backup: backupConfigured(env), email: Boolean(env.RESEND_API_KEY) });
  }
  return json({ error: "Não encontrado." }, 404);
}

/**
 * Diz se a IA está pronta, para a tela de Configurações do painel. Confere a
 * chave consultando o modelo no Google (não gera texto nem gasta a cota do chat).
 */
async function chatStatus(request: Request, env: Env) {
  const model = env.GEMINI_MODEL || DEFAULT_MODEL;
  if (!env.GEMINI_API_KEY) return json({ configured: false, valid: false, model });
  if (await limited(env, request, "status")) return json({ error: "Muitas consultas. Aguarde um instante." }, 429);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}`, {
      headers: { "x-goog-api-key": env.GEMINI_API_KEY },
    });
    const problem = response.ok ? null : response.status === 404 ? "model" : response.status === 429 ? "quota" : "key";
    return json({ configured: true, valid: response.ok, problem, model });
  } catch {
    return json({ configured: true, valid: false, problem: "network", model });
  }
}

async function handleChat(request: Request, env: Env) {
  const read = await readJson(request);
  if ("error" in read) return read.error;
  if (!env.GEMINI_API_KEY) return json({ error: "IA não configurada." }, 503);
  if (await limited(env, request, "chat")) return json({ error: "Muitas mensagens em pouco tempo. Aguarde um instante." }, 429);

  const parsed = chatRequestSchema.safeParse(read.body);
  if (!parsed.success) return json({ error: "Mensagem inválida." }, 400);

  // Só o histórico recente, para controlar consumo da cota.
  const messages = parsed.data.messages.slice(-12);

  try {
    const reply = await askGemini(env, await systemPrompt(env), messages);
    return reply ? json({ reply, provider: "gemini" }) : json({ error: "Sem resposta." }, 503);
  } catch (error) {
    console.error("[chat] Falha no Gemini:", error instanceof Error ? error.message : error);
    return json({ error: "IA indisponível." }, 503);
  }
}

async function askGemini(env: Env, system: string, messages: ChatMessage[]) {
  const model = env.GEMINI_MODEL || DEFAULT_MODEL;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY! },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: messages.map((message) => ({ role: message.role === "assistant" ? "model" : "user", parts: [{ text: message.content }] })),
      generationConfig: { temperature: 0.4, maxOutputTokens: 800 },
    }),
  });
  if (!response.ok) throw new Error(`Gemini respondeu ${response.status}`);
  const data = (await response.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  return (data.candidates?.[0]?.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("")
    .trim();
}

/* ------------------------- Contexto (system prompt) ------------------------ */

let cachedPrompt: { text: string; expires: number } | null = null;

/** Base de conhecimento + dados editados no painel (empresa, serviços, FAQ), com cache de 5 minutos. */
async function systemPrompt(env: Env) {
  if (cachedPrompt && cachedPrompt.expires > Date.now()) return cachedPrompt.text;
  const parts = [
    buildSystemPrompt(),
    "",
    "Privacidade: não peça nome, telefone, e-mail, endereço ou documentos no chat. Para orçamento, oriente a usar o formulário em /orcamento ou o WhatsApp.",
    "Se as informações da empresa abaixo divergirem das anteriores, use as abaixo (são as mais recentes).",
  ];
  try {
    parts.push(...(await panelContent(env)));
  } catch (error) {
    console.error("[chat] Conteúdo do painel indisponível:", error instanceof Error ? error.message : error);
  }
  const text = parts.join("\n");
  cachedPrompt = { text, expires: Date.now() + 5 * 60_000 };
  return text;
}

interface Settings {
  legalName?: string;
  contact?: { phoneDisplay?: string; whatsappDisplay?: string; email?: string };
  address?: { street?: string; district?: string; city?: string; state?: string };
  serviceArea?: string;
  businessHours?: { label: string; value: string }[];
}

async function panelContent(env: Env) {
  await ensureSchema(env.DB);
  const { results } = await env.DB.prepare("select key, value from site_content").all<{ key: string; value: string }>();
  const get = <T>(key: string) => {
    const row = results.find((item) => item.key === key);
    return row ? (JSON.parse(row.value) as T) : undefined;
  };

  const lines: string[] = [];
  const settings = get<Settings>("content:site-settings");
  if (settings) {
    const { contact, address } = settings;
    lines.push("", "Dados atuais da empresa:");
    if (contact?.whatsappDisplay) lines.push(`- WhatsApp: ${contact.whatsappDisplay}`);
    if (contact?.phoneDisplay) lines.push(`- Telefone: ${contact.phoneDisplay}`);
    if (contact?.email) lines.push(`- E-mail: ${contact.email}`);
    if (address?.city) lines.push(`- Endereço: ${[address.street, address.district, address.city, address.state].filter(Boolean).join(", ")}`);
    if (settings.serviceArea) lines.push(`- Área de atendimento: ${settings.serviceArea}`);
    if (settings.businessHours?.length) lines.push(`- Horário: ${settings.businessHours.map((hour) => `${hour.label}: ${hour.value}`).join("; ")}`);
  }
  const solutions = get<{ title: string; description: string }[]>("content:solutions");
  if (solutions?.length) {
    lines.push("", "Serviços:");
    for (const solution of solutions) lines.push(`- ${solution.title}: ${solution.description}`);
  }
  const faq = get<{ question: string; answer: string }[]>("content:faq");
  if (faq?.length) {
    lines.push("", "Perguntas frequentes:");
    for (const item of faq) lines.push(`- ${item.question} ${item.answer}`);
  }
  return lines;
}
