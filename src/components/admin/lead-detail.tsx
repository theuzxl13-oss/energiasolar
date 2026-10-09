"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, FileSignature, FileText, Mail, MessageCircle, Phone } from "lucide-react";
import { useDemoLeads } from "@/hooks/use-demo-leads";
import { CLIENT_TYPE_LABELS, PROPERTY_TYPE_LABELS, SERVICE_LABELS, SOURCE_LABELS, STATUS_LABELS } from "@/lib/labels";
import { LEAD_STATUSES, type LeadStatus } from "@/types";
import { formatCurrency, formatDate, onlyDigits } from "@/lib/utils";
import { AdminPageHeader, Panel, StatusBadge } from "./ui";

/** Monta a URL de detalhe de um lead. */
export function leadDetailHref(id: string) {
  return `/admin/leads/detalhe?id=${encodeURIComponent(id)}`;
}

export function LeadDetailFromUrl() {
  const id = useSearchParams().get("id") ?? "";
  return <LeadDetail id={id} />;
}

export function LeadDetail({ id }: { id: string }) {
  const { leads, ready, updateStatus } = useDemoLeads();
  const lead = leads.find((item) => item.id === id);

  if (!lead) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-slate-200">
        <p className="text-slate-600">{ready ? "Lead não encontrado." : "Carregando…"}</p>
        <Link href="/admin/leads" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
          <ArrowLeft className="size-4" aria-hidden="true" /> Voltar para leads
        </Link>
      </div>
    );
  }

  const phoneDigits = onlyDigits(lead.phone);
  const fields: { label: string; value: string }[] = [
    { label: "Nome", value: lead.name },
    { label: "WhatsApp", value: lead.phone },
    { label: "E-mail", value: lead.email },
    { label: "Cidade", value: lead.city },
    { label: "Estado", value: lead.state },
    { label: "Tipo de cliente", value: lead.clientType ? CLIENT_TYPE_LABELS[lead.clientType] : "Não informado" },
    { label: "Serviço desejado", value: SERVICE_LABELS[lead.service] },
    { label: "Tipo de imóvel", value: lead.propertyType ? PROPERTY_TYPE_LABELS[lead.propertyType] : "Não informado" },
    { label: "Valor médio da conta", value: lead.averageBill ? formatCurrency(lead.averageBill) : "Não informado" },
    { label: "Veículos elétricos", value: lead.evCount !== null ? String(lead.evCount) : "Não informado" },
    { label: "Origem", value: SOURCE_LABELS[lead.source] },
    { label: "Recebido em", value: formatDate(lead.createdAt, true) },
  ];

  return (
    <div className="space-y-6">
      <Link href="/admin/leads" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-night-900">
        <ArrowLeft className="size-4" aria-hidden="true" /> Voltar para leads
      </Link>
      <AdminPageHeader title={lead.name} description={`${SERVICE_LABELS[lead.service]} • ${lead.city}/${lead.state}`} actions={<StatusBadge status={lead.status} />} />

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Panel title="Informações enviadas pelo cliente">
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {fields.map((field) => (
                <div key={field.label}>
                  <dt className="text-xs font-semibold tracking-wider text-slate-500 uppercase">{field.label}</dt>
                  <dd className="mt-1 break-words text-night-900">{field.value}</dd>
                </div>
              ))}
            </dl>
          </Panel>
          <Panel title="Mensagem">
            <p className="whitespace-pre-line text-slate-700">{lead.message || "Sem mensagem."}</p>
          </Panel>
          {lead.metadata && Object.keys(lead.metadata).length > 0 && (
            <Panel title="Metadados">
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                {Object.entries(lead.metadata).map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-xs text-slate-500">{key}</dt>
                    <dd className="text-slate-700">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </Panel>
          )}
        </div>

        <div className="space-y-6">
          <Panel title="Status do atendimento">
            <div className="grid gap-2">
              {LEAD_STATUSES.map((status) => (
                <label key={status} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-sm has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
                  <input type="radio" name="status" checked={lead.status === status} onChange={() => updateStatus(lead.id, status as LeadStatus)} className="accent-brand-600" />
                  {STATUS_LABELS[status]}
                </label>
              ))}
            </div>
          </Panel>
          <Panel title="Ações rápidas">
            <div className="grid gap-2">
              <a href={`https://wa.me/55${phoneDigits}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1fbd5a]">
                <MessageCircle className="size-4" aria-hidden="true" /> Abrir WhatsApp
              </a>
              <a href={`tel:+55${phoneDigits}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
                <Phone className="size-4" aria-hidden="true" /> Ligar
              </a>
              <Link href={`/admin/orcamentos/editar?lead=${encodeURIComponent(lead.id)}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-night-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-night-800">
                <FileText className="size-4" aria-hidden="true" /> Gerar orçamento
              </Link>
              <Link href={`/admin/contratos/editar?lead=${encodeURIComponent(lead.id)}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
                <FileSignature className="size-4" aria-hidden="true" /> Gerar contrato
              </Link>
              <a href={`mailto:${lead.email}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
                <Mail className="size-4" aria-hidden="true" /> Enviar e-mail
              </a>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
