"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Copy, Eye, FileText, Pencil, Plus, Printer, Search, Trash2 } from "lucide-react";
import { useDemoQuotes } from "@/hooks/use-demo-quotes";
import { duplicateQuote, formatIsoDate, isQuoteExpired, QUOTE_STATUS_LABELS, quoteTotals, quoteValidUntil } from "@/lib/quotes";
import { SERVICE_LABELS } from "@/lib/labels";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { QUOTE_STATUSES, type QuoteStatus } from "@/types";
import { AdminPageHeader, DemoNote } from "../ui";

export const quoteEditHref = (id?: string) => (id ? `/admin/orcamentos/editar?id=${encodeURIComponent(id)}` : "/admin/orcamentos/editar");
export const quoteViewHref = (id: string, print = false) => `/admin/orcamentos/visualizar?id=${encodeURIComponent(id)}${print ? "&imprimir=1" : ""}`;

/** Abas da seção Orçamentos: emitidos (documentos) e funil comercial (kanban de leads). */
export function QuotesTabs() {
  const pathname = usePathname();
  const tabs = [
    { label: "Orçamentos emitidos", href: "/admin/orcamentos" },
    { label: "Funil comercial", href: "/admin/orcamentos/funil" },
  ];
  return (
    <nav className="flex gap-1 border-b border-slate-200" aria-label="Seções de orçamentos">
      {tabs.map((tab) => {
        const active = pathname.replace(/\/$/, "") === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn("-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition", active ? "border-brand-600 text-night-900" : "border-transparent text-slate-500 hover:text-night-900")}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

const STATUS_STYLES: Record<QuoteStatus | "expirado", string> = {
  rascunho: "bg-slate-100 text-slate-700 ring-slate-200",
  enviado: "bg-volt-50 text-volt-700 ring-volt-200",
  aprovado: "bg-brand-50 text-brand-800 ring-brand-200",
  recusado: "bg-rose-50 text-rose-700 ring-rose-200",
  expirado: "bg-amber-50 text-amber-800 ring-amber-200",
};

export function QuoteStatusBadge({ status, expired }: { status: QuoteStatus; expired?: boolean }) {
  const key = expired ? "expirado" : status;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ring-1", STATUS_STYLES[key])}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {expired ? "Vencido" : QUOTE_STATUS_LABELS[status]}
    </span>
  );
}

export function QuotesList() {
  const router = useRouter();
  const { quotes, ready, saveQuote, removeQuote } = useDemoQuotes();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<QuoteStatus | "">("");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return quotes.filter(
      (quote) =>
        (!status || quote.status === status) &&
        (!term || [quote.client.name, quote.title, quote.number, quote.client.phone].some((value) => value.toLowerCase().includes(term))),
    );
  }, [quotes, query, status]);

  const totals = useMemo(() => {
    const sum = (list: typeof quotes) => list.reduce((acc, quote) => acc + quoteTotals(quote).total, 0);
    return { open: sum(quotes.filter((quote) => quote.status === "enviado")), approved: sum(quotes.filter((quote) => quote.status === "aprovado")) };
  }, [quotes]);

  function duplicate(id: string) {
    const source = quotes.find((item) => item.id === id);
    if (!source) return;
    const copy = duplicateQuote(quotes, source);
    saveQuote(copy);
    router.push(quoteEditHref(copy.id));
  }

  function remove(id: string, label: string) {
    if (window.confirm(`Excluir o orçamento de ${label}? Esta ação não pode ser desfeita.`)) removeQuote(id);
  }

  const actionClass = "rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-night-900";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Orçamentos"
        description="Emita orçamentos com o papel timbrado da empresa, prontos para imprimir ou enviar em PDF."
        actions={
          <Link href={quoteEditHref()} className="inline-flex items-center gap-2 rounded-full bg-night-950 px-4 py-2 text-sm font-semibold text-white hover:bg-night-800">
            <Plus className="size-4" aria-hidden="true" /> Novo orçamento
          </Link>
        }
      />
      <QuotesTabs />
      <DemoNote>
        Na demonstração, os orçamentos ficam salvos neste navegador. Em produção, serão gravados na tabela <code>quotes</code> do Supabase.
      </DemoNote>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs text-slate-500">Orçamentos</p>
          <p className="mt-1 text-xl font-bold text-night-900">{quotes.length}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs text-slate-500">Aguardando resposta</p>
          <p className="mt-1 text-xl font-bold text-night-900">{formatCurrency(totals.open)}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs text-slate-500">Aprovados</p>
          <p className="mt-1 text-xl font-bold text-brand-700">{formatCurrency(totals.approved)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Buscar</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por cliente, número ou telefone"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-9 text-sm outline-none focus:border-brand-500"
          />
        </label>
        <select aria-label="Status" value={status} onChange={(event) => setStatus(event.target.value as QuoteStatus | "")} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand-500">
          <option value="">Todos os status</option>
          {QUOTE_STATUSES.map((item) => (
            <option key={item} value={item}>{QUOTE_STATUS_LABELS[item]}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs font-semibold tracking-wider text-slate-500 uppercase">
            <tr>
              <th className="px-5 py-3.5">Cliente</th>
              <th className="px-5 py-3.5">Orçamento</th>
              <th className="px-5 py-3.5">Emissão / validade</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Valor total</th>
              <th className="px-5 py-3.5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((quote) => {
              const label = quote.client.name || quote.title || quote.number;
              return (
                <tr key={quote.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-night-900">{quote.client.name || "Cliente não informado"}</p>
                    <p className="text-xs text-slate-500">{[quote.client.city, quote.client.state].filter(Boolean).join("/") || quote.client.phone || "—"}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-slate-700">{quote.title || SERVICE_LABELS[quote.service]}</p>
                    <p className="text-xs text-slate-500">nº {quote.number} · {SERVICE_LABELS[quote.service]}</p>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-slate-600">
                    {formatIsoDate(quote.issueDate)}
                    <span className="block text-xs text-slate-500">válido até {formatDate(quoteValidUntil(quote).toISOString())}</span>
                  </td>
                  <td className="px-5 py-4">
                    <QuoteStatusBadge status={quote.status} expired={isQuoteExpired(quote)} />
                  </td>
                  <td className="px-5 py-4 text-right font-semibold whitespace-nowrap text-night-900">{formatCurrency(quoteTotals(quote).total, true)}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-0.5">
                      <Link href={quoteViewHref(quote.id)} className={actionClass} aria-label="Visualizar" title="Visualizar">
                        <Eye className="size-4" />
                      </Link>
                      <Link href={quoteViewHref(quote.id, true)} className={actionClass} aria-label="Imprimir / PDF" title="Imprimir / PDF">
                        <Printer className="size-4" />
                      </Link>
                      <Link href={quoteEditHref(quote.id)} className={actionClass} aria-label="Editar" title="Editar">
                        <Pencil className="size-4" />
                      </Link>
                      <button type="button" onClick={() => duplicate(quote.id)} className={actionClass} aria-label="Duplicar" title="Duplicar">
                        <Copy className="size-4" />
                      </button>
                      <button type="button" onClick={() => remove(quote.id, label)} className="rounded-lg p-2 text-rose-500 transition hover:bg-rose-50" aria-label="Excluir" title="Excluir">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {ready && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <FileText className="size-8 text-slate-300" aria-hidden="true" />
            <p className="text-sm text-slate-500">{quotes.length ? "Nenhum orçamento encontrado com esses filtros." : "Nenhum orçamento emitido ainda."}</p>
            {!quotes.length && (
              <Link href={quoteEditHref()} className="text-sm font-semibold text-brand-700 hover:text-brand-800">
                Emitir o primeiro orçamento
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
