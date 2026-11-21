import type { Lead, LeadStatus } from "@/types";
import { api } from "./client";

/** Leads no banco da Cloudflare (equipe logada com a segunda etapa). */

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

export async function fetchLeads(): Promise<Lead[]> {
  return (await api<LeadRow[]>("/api/admin/leads")).map(toLead);
}

export async function updateLeadStatus(id: string, status: LeadStatus) {
  await api(`/api/admin/leads/${encodeURIComponent(id)}`, { method: "PATCH", body: { status } });
}
