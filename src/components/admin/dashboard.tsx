"use client";

import Link from "next/link";
import { leadDetailHref } from "./lead-detail";
import { ArrowRight, BatteryCharging, FileText, FolderKanban, Inbox, Sun, Users, Zap, Percent } from "lucide-react";
import { useDemoLeads } from "@/hooks/use-demo-leads";
import { dashboardKpis, leadsByMonth, leadsByService, leadsByStatus } from "@/lib/admin-metrics";
import { SERVICE_LABELS } from "@/lib/labels";
import { formatDate } from "@/lib/utils";
import { AdminPageHeader, KpiCard, Panel, StatusBadge } from "./ui";
import { BarList, ColumnChart } from "./charts";

export function AdminDashboard() {
  const { leads, localCount } = useDemoLeads();
  const kpis = dashboardKpis(leads);
  const recent = leads.slice(0, 6);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Visão geral"
        description={`Acompanhe leads, orçamentos e solicitações.${localCount ? ` ${localCount} enviado(s) pelo site neste navegador.` : ""}`}
        actions={
          <Link href="/admin/leads" className="inline-flex items-center gap-2 rounded-full bg-night-950 px-4 py-2 text-sm font-semibold text-white hover:bg-night-800">
            Ver leads <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Leads recebidos" value={kpis.total} hint={`${kpis.novos} novos aguardando contato`} icon={<Inbox className="size-5" />} />
        <KpiCard label="Orçamentos" value={kpis.orcamentos} hint="Enviados, em negociação ou fechados" icon={<FileText className="size-5" />} />
        <KpiCard label="Projetos" value={kpis.projetos} hint="Negócios fechados" icon={<FolderKanban className="size-5" />} />
        <KpiCard label="Clientes" value={kpis.clientes} hint={`Taxa de conversão de ${kpis.conversao}%`} icon={<Users className="size-5" />} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Solicitações de energia solar" value={kpis.solar} icon={<Sun className="size-5" />} />
        <KpiCard label="Solicitações de carregadores" value={kpis.carregadores} icon={<BatteryCharging className="size-5" />} />
        <KpiCard label="Solicitações de eletropostos" value={kpis.eletropostos} icon={<Zap className="size-5" />} />
        <KpiCard label="Conversão" value={`${kpis.conversao}%`} hint="Leads fechados / total" icon={<Percent className="size-5" />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Leads por mês" description="Últimos 6 meses">
          <ColumnChart data={leadsByMonth(leads)} />
        </Panel>
        <Panel title="Leads por serviço">
          <BarList data={leadsByService(leads)} />
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <Panel title="Funil por status" description="Situação atual dos leads">
          <BarList data={leadsByStatus(leads)} tone="volt" />
        </Panel>
        <Panel
          title="Leads recentes"
          actions={
            <Link href="/admin/leads" className="text-sm font-semibold text-brand-700 hover:underline">
              Ver todos
            </Link>
          }
        >
          <ul className="divide-y divide-slate-100">
            {recent.map((lead) => (
              <li key={lead.id}>
                <Link href={leadDetailHref(lead.id)} className="flex items-center justify-between gap-4 py-3 hover:bg-slate-50 sm:px-2">
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-night-900">{lead.name}</span>
                    <span className="block truncate text-xs text-slate-500">
                      {SERVICE_LABELS[lead.service]} • {lead.city}/{lead.state} • {formatDate(lead.createdAt)}
                    </span>
                  </span>
                  <StatusBadge status={lead.status} />
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
