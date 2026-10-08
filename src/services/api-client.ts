import type { ChatMessage, Lead } from "@/types";
import type { ContactFormInput, LeadApiPayload } from "@/lib/validations/lead";

/**
 * Cliente HTTP do frontend para as rotas internas (/api/*).
 * Os componentes nunca chamam serviços externos diretamente.
 */

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

export function submitLead(payload: LeadApiPayload) {
  return postJson<{ lead: Lead }>("/api/leads", payload);
}

export function submitContact(payload: ContactFormInput) {
  return postJson<{ lead: Lead }>("/api/contact", payload);
}

export function sendChatMessage(messages: ChatMessage[]) {
  return postJson<{ reply: string; provider: string }>("/api/chat", { messages });
}
