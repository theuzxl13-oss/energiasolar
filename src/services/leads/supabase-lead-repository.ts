import "server-only";
import type { Lead, LeadStatus } from "@/types";
import type { LeadRepository } from "./lead-repository";

/**
 * Repositório Supabase via API REST (PostgREST), sem dependências extras.
 * Usa a SERVICE_ROLE_KEY, portanto deve rodar exclusivamente no servidor.
 * Estrutura da tabela em `supabase/schema.sql`.
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
    averageBill: row.average_bill,
    evCount: row.ev_count,
    message: row.message,
    source: row.source,
    status: row.status,
    metadata: row.metadata ?? undefined,
    createdAt: row.created_at,
  };
}

export function createSupabaseLeadRepository(url: string, serviceRoleKey: string): LeadRepository {
  const endpoint = `${url.replace(/\/$/, "")}/rest/v1/leads`;
  const headers = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };

  async function request<T>(input: string, init?: RequestInit): Promise<T> {
    const response = await fetch(input, { ...init, headers, cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Supabase respondeu ${response.status}`);
    }
    return (await response.json()) as T;
  }

  return {
    name: "supabase",

    async create(lead) {
      const [row] = await request<LeadRow[]>(endpoint, {
        method: "POST",
        body: JSON.stringify({
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
        }),
      });
      if (!row) throw new Error("Supabase não retornou o lead criado");
      return toLead(row);
    },

    async list(options = {}) {
      const params = new URLSearchParams({ select: "*", order: "created_at.desc" });
      if (options.status) params.set("status", `eq.${options.status}`);
      if (options.limit) params.set("limit", String(options.limit));
      const rows = await request<LeadRow[]>(`${endpoint}?${params.toString()}`);
      return rows.map(toLead);
    },

    async findById(id) {
      const params = new URLSearchParams({ select: "*", id: `eq.${id}`, limit: "1" });
      const rows = await request<LeadRow[]>(`${endpoint}?${params.toString()}`);
      return rows[0] ? toLead(rows[0]) : null;
    },

    async updateStatus(id, status) {
      const params = new URLSearchParams({ id: `eq.${id}` });
      const rows = await request<LeadRow[]>(`${endpoint}?${params.toString()}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      return rows[0] ? toLead(rows[0]) : null;
    },
  };
}
