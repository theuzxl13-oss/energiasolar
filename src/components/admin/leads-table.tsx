"use client";

import Link from "next/link";
import { leadDetailHref } from "./lead-detail";
import { useMemo, useState } from "react";
import { Download, RotateCcw, Search } from "lucide-react";
import { useDemoLeads } from "@/hooks/use-demo-leads";
import { SERVICE_LABELS, STATUS_LABELS } from "@/lib/labels";
import { LEAD_STATUSES, SERVICE_TYPES, type Lead, type LeadStatus, type ServiceType } from "@/types";
import { formatDate } from "@/lib/utils";
import { AdminPageHeader, StatusBadge } from "./ui";

function toCsv(leads: Lead[]) {
  const header = ["Nome", "Telefone", "E-mail", "Serviço", "Cidade", "UF", "Data", "Status"];
  const rows = leads.map((lead) => [lead.name, lead.phone, lead.email, SERVICE_LABELS[lead.service], lead.city, lead.state, formatDate(lead.createdAt), STATUS_LABELS[lead.status]]);
  return [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";")).join("\n");
}

export function LeadsTable() {
  const { leads, updateStatus, resetDemo, localCount } = useDemoLeads();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<LeadStatus | "">("");
  const [service, setService] = useState<ServiceType | "">("");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return leads.filter(
      (lead) =>
        (!status || lead.status === status) &&
        (!service || lead.service === service) &&
        (!term || [lead.name, lead.phone, lead.email, lead.city].some((value) => value.toLowerCase().includes(term))),
    );
  }, [leads, query, status, service]);

  function exportCsv() {
    const blob = new Blob(["﻿" + toCsv(filtered)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const selectClass = "h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand-500";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Leads"
        description={`${filtered.length} de ${leads.length} leads`}
        actions={
          <>
            {localCount > 0 && (
              <button type="button" onClick={resetDemo} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
                <RotateCcw className="size-4" aria-hidden="true" /> Limpar dados locais
              </button>
            )}
            <button type="button" onClick={exportCsv} className="inline-flex items-center gap-2 rounded-full bg-night-950 px-4 py-2 text-sm font-semibold text-white hover:bg-night-800">
              <Download className="size-4" aria-hidden="true" /> Exportar CSV
            </button>
          </>
        }
      />

      <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Buscar</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome, telefone, e-mail ou cidade"
            className="h-10 w-full rounded-xl border border-slate-200 pr-3 pl-9 text-sm outline-none focus:border-brand-500"
          />
        </label>
        <select aria-label="Filtrar por status" value={status} onChange={(event) => setStatus(event.target.value as LeadStatus | "")} className={selectClass}>
          <option value="">Todos os status</option>
          {LEAD_STATUSES.map((value) => (
            <option key={value} value={value}>{STATUS_LABELS[value]}</option>
          ))}
        </select>
        <select aria-label="Filtrar por serviço" value={service} onChange={(event) => setService(event.target.value as ServiceType | "")} className={selectClass}>
          <option value="">Todos os serviços</option>
          {SERVICE_TYPES.map((value) => (
            <option key={value} value={value}>{SERVICE_LABELS[value]}</option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wider text-slate-500 uppercase">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Nome</th>
                <th scope="col" className="px-5 py-3 font-semibold">Telefone</th>
                <th scope="col" className="px-5 py-3 font-semibold">Serviço</th>
                <th scope="col" className="px-5 py-3 font-semibold">Cidade</th>
                <th scope="col" className="px-5 py-3 font-semibold">Data</th>
                <th scope="col" className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <Link href={leadDetailHref(lead.id)} className="font-semibold text-night-900 hover:text-brand-700">
                      {lead.name}
                    </Link>
                    <span className="block text-xs text-slate-500">{lead.email}</span>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-slate-600">{lead.phone}</td>
                  <td className="px-5 py-3 text-slate-600">{SERVICE_LABELS[lead.service]}</td>
                  <td className="px-5 py-3 text-slate-600">
                    {lead.city}/{lead.state}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-slate-600">{formatDate(lead.createdAt)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={lead.status} />
                      <select
                        aria-label={`Alterar status de ${lead.name}`}
                        value={lead.status}
                        onChange={(event) => updateStatus(lead.id, event.target.value as LeadStatus)}
                        className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none focus:border-brand-500"
                      >
                        {LEAD_STATUSES.map((value) => (
                          <option key={value} value={value}>{STATUS_LABELS[value]}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    Nenhum lead encontrado com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
