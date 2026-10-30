import type { Lead, LeadStatus } from "@/types";
import { leadToRow } from "@/lib/leads/build";
import { getSupabase } from "./client";

/**
 * Leads no Supabase direto do navegador (site estático, sem rotas de servidor).
 * - Visitante anônimo: só pode INSERIR (sem ler de volta).
 * - Equipe logada: lê e atualiza o status.
 * As permissões são garantidas pelo RLS em `supabase/schema.sql`.
 */

interface LeadRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  client_type: Lead["clientType"];
  service: Lead["service"];
  property_type: Lead["propertyType"];
  average_bill: number | null;
  ev_count: number | null;
  message: string;
  source: Lead["source"];
  status: LeadStatus;
  metadata: Lead["metadata"] | null;
  created_at: string;
}

function toLead(row: LeadRow): Lead {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    city: row.city,
    state: row.state,
    clientType: row.client_type,
    service: row.service,
    propertyType: row.property_type,
    averageBill: row.average_bill === null ? null : Number(row.average_bill),
    evCount: row.ev_count,
    message: row.message,
    source: row.source,
    status: row.status,
    metadata: row.metadata ?? undefined,
    createdAt: row.created_at,
  };
}

/** Grava um lead enviado pelo site direto no banco (antes da etapa final do "não sou robô"). */
export async function insertLead(lead: Lead): Promise<Lead> {
  const { error } = await getSupabase().from("leads").insert(leadToRow(lead));
  if (error) throw new Error("Não foi possível enviar agora. Tente novamente ou fale conosco pelo WhatsApp.");
  return lead;
}

export async function fetchLeads(): Promise<Lead[]> {
  const { data, error } = await getSupabase().from("leads").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data as LeadRow[]).map(toLead);
}

export async function updateLeadStatus(id: string, status: LeadStatus) {
  const { error } = await getSupabase().from("leads").update({ status }).eq("id", id);
  if (error) throw error;
}
