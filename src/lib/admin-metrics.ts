import { SERVICE_LABELS, STATUS_LABELS } from "@/lib/labels";
import { LEAD_STATUSES, type Lead, type ServiceType } from "@/types";

/**
 * Agregações do dashboard. Funções puras: no futuro podem rodar no servidor
 * (ou virar views/RPCs no Supabase) sem alterar os componentes.
 */

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export function leadsByMonth(leads: Lead[], months = 6) {
  const latest = leads.reduce((acc, lead) => (lead.createdAt > acc ? lead.createdAt : acc), new Date(0).toISOString());
  const end = new Date(latest);
  const buckets = Array.from({ length: months }, (_, index) => {
    const date = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - (months - 1 - index), 1));
    return { key: `${date.getUTCFullYear()}-${date.getUTCMonth()}`, label: MONTHS[date.getUTCMonth()]!, value: 0 };
  });
  for (const lead of leads) {
    const date = new Date(lead.createdAt);
    const bucket = buckets.find((item) => item.key === `${date.getUTCFullYear()}-${date.getUTCMonth()}`);
    if (bucket) bucket.value += 1;
  }
  return buckets.map(({ label, value }) => ({ label, value }));
}

export function leadsByService(leads: Lead[]) {
  const counts = new Map<ServiceType, number>();
  for (const lead of leads) counts.set(lead.service, (counts.get(lead.service) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([service, value]) => ({ label: SERVICE_LABELS[service], value }));
}

export function leadsByStatus(leads: Lead[]) {
  return LEAD_STATUSES.map((status) => ({ label: STATUS_LABELS[status], value: leads.filter((lead) => lead.status === status).length }));
}

const CHARGER_SERVICES: ServiceType[] = ["carregador_residencial", "carregador_empresarial", "condominio", "frota"];

export function dashboardKpis(leads: Lead[]) {
  const quotes = leads.filter((lead) => ["orcamento_enviado", "negociacao", "fechado"].includes(lead.status)).length;
  const closed = leads.filter((lead) => lead.status === "fechado").length;
  return {
    total: leads.length,
    novos: leads.filter((lead) => lead.status === "novo").length,
    orcamentos: quotes,
    projetos: closed,
    clientes: new Set(leads.filter((lead) => lead.status === "fechado").map((lead) => lead.email)).size,
    solar: leads.filter((lead) => lead.service === "energia_solar").length,
    carregadores: leads.filter((lead) => CHARGER_SERVICES.includes(lead.service)).length,
    eletropostos: leads.filter((lead) => lead.service === "eletroposto").length,
    conversao: leads.length ? Math.round((closed / leads.length) * 100) : 0,
  };
}
