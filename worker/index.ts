/**
 * Cloudflare Worker: serve o site estático (pasta out/) e a rota POST /api/chat.
 *
 * O chat usa o Gemini (Google). A chave fica no segredo GEMINI_API_KEY da
 * Cloudflare e nunca chega ao navegador. Sem chave, com erro ou com a cota
 * gratuita esgotada, responde 503 e o site usa as respostas prontas.
 */
import { chatRequestSchema } from "../src/lib/validations/chat";
import { buildSystemPrompt } from "../src/services/ai/knowledge-base";
import type { ChatMessage } from "../src/types";

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  CHAT_LIMITER?: { limit(options: { key: string }): Promise<{ success: boolean }> };
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
}

const DEFAULT_MODEL = "gemini-flash-latest";

/** Tamanho máximo do corpo do chat (12 mensagens de até 1.500 caracteres cabem com folga). */
const MAX_BODY_BYTES = 64 * 1024;

const json = (body: unknown, status = 200) =>
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/chat/status") return chatStatus(request, env);
    if (url.pathname === "/api/chat") {
      if (request.method !== "POST") return json({ error: "Método não permitido." }, 405);
      return handleChat(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};

/**
 * Diz se a IA está pronta, para a tela de Configurações do painel. Confere a
 * chave consultando o modelo no Google (não gera texto nem gasta a cota do chat).
 */
async function chatStatus(request: Request, env: Env) {
  const model = env.GEMINI_MODEL || DEFAULT_MODEL;
  if (!env.GEMINI_API_KEY) return json({ configured: false, valid: false, model });
  const ip = request.headers.get("CF-Connecting-IP") ?? "anon";
  if (env.CHAT_LIMITER && !(await env.CHAT_LIMITER.limit({ key: `status:${ip}` })).success) {
    return json({ error: "Muitas consultas. Aguarde um instante." }, 429);
  }
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
  // Só aceita chamadas do próprio site (navegadores sempre enviam Origin em POST).
  const origin = request.headers.get("Origin");
  if (!origin || origin !== new URL(request.url).origin) return json({ error: "Origem não permitida." }, 403);
  if (!request.headers.get("Content-Type")?.includes("application/json")) return json({ error: "Formato inválido." }, 415);
  if (Number(request.headers.get("Content-Length") ?? 0) > MAX_BODY_BYTES) return json({ error: "Mensagem muito grande." }, 413);

  if (!env.GEMINI_API_KEY) return json({ error: "IA não configurada." }, 503);

  const ip = request.headers.get("CF-Connecting-IP") ?? "anon";
  if (env.CHAT_LIMITER && !(await env.CHAT_LIMITER.limit({ key: ip })).success) {
    return json({ error: "Muitas mensagens em pouco tempo. Aguarde um instante." }, 429);
  }

  const raw = await request.text().catch(() => "");
  if (raw.length > MAX_BODY_BYTES) return json({ error: "Mensagem muito grande." }, 413);
  let body: unknown = null;
  try {
    body = JSON.parse(raw);
  } catch {
    /* inválido: o schema recusa abaixo */
  }
  const parsed = chatRequestSchema.safeParse(body);
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
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return [];
  const response = await fetch(`${env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/site_content?select=key,value`, {
    headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${env.SUPABASE_ANON_KEY}` },
  });
  if (!response.ok) throw new Error(`Supabase respondeu ${response.status}`);
  const rows = (await response.json()) as { key: string; value: unknown }[];
  const get = <T>(key: string) => rows.find((row) => row.key === key)?.value as T | undefined;

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
