import type { ChatMessage, Lead } from "@/types";
import { contactFormSchema, leadApiSchema, type ContactFormInput, type LeadApiPayload } from "@/lib/validations/lead";
import { demoChatProvider } from "@/services/ai/demo-provider";
import { generateId } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { insertLead } from "@/lib/supabase/leads";

/**
 * Cliente HTTP do frontend para as rotas internas (/api/*).
 * Os componentes nunca chamam serviços externos diretamente.
 *
 * Quando NEXT_PUBLIC_STATIC_DEMO=true (build estático, ex.: GitHub Pages,
 * onde não existem rotas de servidor), as mesmas operações são resolvidas no
 * navegador com as MESMAS validações. Com o Supabase configurado, os leads
 * são gravados no banco; sem ele, ficam só neste navegador (demonstração).
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

function localLead(payload: LeadApiPayload): Lead {
  const parsed = leadApiSchema.safeParse(payload);
  if (!parsed.success) throw validationError(parsed.error.flatten().fieldErrors);
  const { consent: _consent, website: _website, ...data } = parsed.data;
  return { ...data, id: generateId("lead"), status: "novo", createdAt: new Date().toISOString(), metadata: { ...data.metadata, demo: true } };
}

function localContact(payload: ContactFormInput): Lead {
  const parsed = contactFormSchema.safeParse(payload);
  if (!parsed.success) throw validationError(parsed.error.flatten().fieldErrors);
  const { consent: _consent, website: _website, subject, ...data } = parsed.data;
  return {
    ...data,
    service: subject,
    clientType: null,
    propertyType: null,
    averageBill: null,
    evCount: null,
    source: "contato",
    id: generateId("lead"),
    status: "novo",
    createdAt: new Date().toISOString(),
    metadata: { demo: true },
  };
}

/** Site estático: grava no Supabase quando configurado (sem a marca de demonstração). */
async function storeLocalLead(lead: Lead) {
  if (!isSupabaseConfigured) return lead;
  const { demo: _demo, ...metadata } = lead.metadata ?? {};
  return insertLead({ ...lead, metadata: Object.keys(metadata).length ? metadata : undefined });
}

export async function submitLead(payload: LeadApiPayload) {
  if (STATIC_DEMO) return { lead: await storeLocalLead(localLead(payload)) };
  return postJson<{ lead: Lead }>("/api/leads", payload);
}

export async function submitContact(payload: ContactFormInput) {
  if (STATIC_DEMO) return { lead: await storeLocalLead(localContact(payload)) };
  return postJson<{ lead: Lead }>("/api/contact", payload);
}

export async function sendChatMessage(messages: ChatMessage[]) {
  if (STATIC_DEMO) {
    const reply = await demoChatProvider.reply(messages.slice(-12));
    return { reply: reply.content, provider: reply.provider };
  }
  return postJson<{ reply: string; provider: string }>("/api/chat", { messages });
}
