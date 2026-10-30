import { contactFormSchema, leadApiSchema, type ContactFormInput, type LeadApiPayload } from "@/lib/validations/lead";
import type { Lead } from "@/types";

/**
 * Monta o lead a partir do formulário, com as MESMAS validações no navegador
 * e no servidor (Cloudflare Worker).
 */

export type LeadBuild = { ok: true; lead: Lead } | { ok: false; fieldErrors: Record<string, string[]> };

const failure = (fieldErrors: Record<string, string[] | undefined>): LeadBuild => ({ ok: false, fieldErrors: fieldErrors as Record<string, string[]> });

/** Formulário de orçamento e simuladores. */
export function buildLead(payload: LeadApiPayload): LeadBuild {
  const parsed = leadApiSchema.safeParse(payload);
  if (!parsed.success) return failure(parsed.error.flatten().fieldErrors);
  const { consent: _consent, website: _website, ...data } = parsed.data;
  return { ok: true, lead: { ...data, id: crypto.randomUUID(), status: "novo", createdAt: new Date().toISOString() } };
}

/** Formulário de contato. */
export function buildContactLead(payload: ContactFormInput): LeadBuild {
  const parsed = contactFormSchema.safeParse(payload);
  if (!parsed.success) return failure(parsed.error.flatten().fieldErrors);
  const { consent: _consent, website: _website, subject, ...data } = parsed.data;
  return {
    ok: true,
    lead: {
      ...data,
      service: subject,
      clientType: null,
      propertyType: null,
      averageBill: null,
      evCount: null,
      source: "contato",
      id: crypto.randomUUID(),
      status: "novo",
      createdAt: new Date().toISOString(),
    },
  };
}

/** Linha da tabela `leads` (nomes das colunas no banco). */
export function leadToRow(lead: Lead) {
  return {
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    city: lead.city,
    state: lead.state,
    client_type: lead.clientType,
    service: lead.service,
    property_type: lead.propertyType,
    average_bill: lead.averageBill,
    ev_count: lead.evCount,
    message: lead.message,
    source: lead.source,
    metadata: lead.metadata ?? null,
  };
}
