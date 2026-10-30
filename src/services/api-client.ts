import type { ChatMessage, Lead } from "@/types";
import type { ContactFormInput, LeadApiPayload } from "@/lib/validations/lead";
import { buildContactLead, buildLead } from "@/lib/leads/build";
import { demoChatProvider } from "@/services/ai/demo-provider";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { insertLead } from "@/lib/supabase/leads";

/**
 * Cliente HTTP do frontend para as rotas internas (/api/*).
 * Os componentes nunca chamam serviços externos diretamente.
 *
 * Quando NEXT_PUBLIC_STATIC_DEMO=true (build estático, ex.: GitHub Pages,
 * onde não existem rotas de servidor), as mesmas operações são resolvidas no
 * navegador ou no Cloudflare Worker, com as MESMAS validações. Com o Supabase
 * configurado, os leads são gravados no banco; sem ele, ficam só neste
 * navegador (demonstração).
 */
const STATIC_DEMO = process.env.NEXT_PUBLIC_STATIC_DEMO === "true";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
  }
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as { error?: string; fieldErrors?: Record<string, string[]> } & T;
  if (!response.ok) {
    throw new ApiError(data.error ?? "Não foi possível concluir a solicitação.", response.status, data.fieldErrors);
  }
  return data;
}

function validationError(fieldErrors: Record<string, string[] | undefined>) {
  return new ApiError("Verifique os campos do formulário.", 422, fieldErrors as Record<string, string[]>);
}

interface LeadsConfig {
  enabled: boolean;
  siteKey: string | null;
}

let leadsConfig: Promise<LeadsConfig> | null = null;

/**
 * Site estático: o servidor (Cloudflare Worker) diz se o "não sou robô" está
 * ativo. Se estiver, os formulários enviam por ele; senão, direto ao banco.
 */
export function getLeadsConfig(): Promise<LeadsConfig> {
  leadsConfig ??= fetch("/api/leads/config", { cache: "no-store" })
    .then((response) => (response.ok ? (response.json() as Promise<LeadsConfig>) : null))
    .then((config) => (config && typeof config.enabled === "boolean" ? config : { enabled: false, siteKey: null }))
    .catch(() => ({ enabled: false, siteKey: null }));
  return leadsConfig;
}

async function submitStatic(kind: "lead" | "contact", payload: LeadApiPayload | ContactFormInput, token?: string | null) {
  if ((await getLeadsConfig()).enabled) {
    return postJson<{ lead: Lead }>("/api/leads", { kind, payload, token: token ?? "" });
  }
  const built = kind === "contact" ? buildContactLead(payload as ContactFormInput) : buildLead(payload as LeadApiPayload);
  if (!built.ok) throw validationError(built.fieldErrors);
  // Sem Supabase (demonstração), o lead fica só neste navegador.
  if (!isSupabaseConfigured) return { lead: { ...built.lead, metadata: { ...built.lead.metadata, demo: true } } };
  return { lead: await insertLead(built.lead) };
}

export async function submitLead(payload: LeadApiPayload, turnstileToken?: string | null) {
  if (STATIC_DEMO) return submitStatic("lead", payload, turnstileToken);
  return postJson<{ lead: Lead }>("/api/leads", payload);
}

export async function submitContact(payload: ContactFormInput, turnstileToken?: string | null) {
  if (STATIC_DEMO) return submitStatic("contact", payload, turnstileToken);
  return postJson<{ lead: Lead }>("/api/contact", payload);
}

export async function sendChatMessage(messages: ChatMessage[]) {
  if (STATIC_DEMO) {
    // Site estático: a IA roda no Worker da Cloudflare (/api/chat). Sem IA
    // configurada ou fora do ar, usa as respostas prontas da base local.
    try {
      return await postJson<{ reply: string; provider: string }>("/api/chat", { messages });
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) throw error;
      const reply = await demoChatProvider.reply(messages.slice(-12));
      return { reply: reply.content, provider: reply.provider };
    }
  }
  return postJson<{ reply: string; provider: string }>("/api/chat", { messages });
}
