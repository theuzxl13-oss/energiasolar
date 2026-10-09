"use client";

import Link from "next/link";
import { leadDetailHref } from "./lead-detail";
import { useDemoLeads } from "@/hooks/use-demo-leads";
import { demoQuoteValue } from "@/lib/admin-metrics";
import { SERVICE_LABELS, STATUS_LABELS } from "@/lib/labels";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { LeadStatus } from "@/types";
import { AdminPageHeader, DemoNote } from "./ui";
import { QuotesTabs } from "./quotes/quotes-list";

const COLUMNS: LeadStatus[] = ["em_contato", "orcamento_enviado", "negociacao", "fechado"];

/** Quadro (kanban) de orçamentos por etapa comercial. */
export function QuotesBoard() {
  const { leads } = useDemoLeads();

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Orçamentos" description="Pipeline comercial por etapa" />
      <QuotesTabs />
      <DemoNote>Valores de proposta ilustrativos, gerados apenas para demonstrar o layout. Em produção, virão da tabela de propostas.</DemoNote>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((status) => {
          const items = leads.filter((lead) => lead.status === status);
          const total = items.reduce((acc, lead) => acc + demoQuoteValue(lead), 0);
          return (
            <section key={status} className="flex flex-col rounded-2xl bg-slate-200/60 p-3">
              <header className="flex items-center justify-between px-2 py-2">
                <h2 className="text-sm font-semibold text-night-900">
                  {STATUS_LABELS[status]} <span className="text-slate-500">({items.length})</span>
                </h2>
                <span className="text-xs font-semibold text-slate-600">{formatCurrency(total)}</span>
              </header>
              <ul className="mt-1 space-y-2">
                {items.map((lead) => (
                  <li key={lead.id}>
                    <Link href={leadDetailHref(lead.id)} className="block rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md">
                      <p className="font-medium text-night-900">{lead.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {SERVICE_LABELS[lead.service]} • {lead.city}/{lead.state}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="font-semibold text-brand-700">{formatCurrency(demoQuoteValue(lead))}</span>
                        <span className="text-slate-400">{formatDate(lead.createdAt)}</span>
                      </div>
                    </Link>
                  </li>
                ))}
                {items.length === 0 && <li className="px-2 py-6 text-center text-xs text-slate-500">Nenhum item</li>}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
