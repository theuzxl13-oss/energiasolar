"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Copy, Eye, FilePlus2, Pencil, Search, Trash2 } from "lucide-react";
import { useQuotes } from "@/hooks/use-quotes";
import { QUOTE_STATUSES, QUOTE_STATUS_LABELS, formatIsoDate, quoteTotals, type Quote, type QuoteStatus } from "@/lib/quotes";
import { formatCurrency, generateId } from "@/lib/utils";
import { AdminPageHeader, DemoNote } from "../ui";
import { QuoteStatusBadge } from "./quote-status-badge";

export function QuotesList() {
  const { quotes, ready, saveQuote, deleteQuote, getNextNumber } = useQuotes();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<QuoteStatus | "">("");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return quotes.filter(
      (quote) =>
        (!status || quote.status === status) &&
        (!term || [quote.number, quote.title, quote.client.name, quote.client.email].some((value) => value.toLowerCase().includes(term))),
    );
  }, [quotes, query, status]);

  const totals = useMemo(() => {
    const sum = (list: Quote[]) => list.reduce((acc, quote) => acc + quoteTotals(quote).total, 0);
    return {
      open: sum(quotes.filter((quote) => quote.status === "enviado")),
      approved: sum(quotes.filter((quote) => quote.status === "aprovado")),
    };
  }, [quotes]);

  function duplicate(quote: Quote) {
    const id = generateId("quote");
    const now = new Date().toISOString();
    saveQuote({ ...quote, id, number: getNextNumber(), status: "rascunho", isDemo: false, title: `${quote.title} (cópia)`, createdAt: now, updatedAt: now });
  }

  function remove(quote: Quote) {
    if (window.confirm(`Excluir o orçamento ${quote.number}${quote.client.name ? ` de ${quote.client.name}` : ""}? Esta ação não pode ser desfeita.`)) {
      deleteQuote(quote.id);
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Orçamentos"
        description="Crie, edite e gere o PDF das propostas enviadas aos clientes."
        actions={
          <Link href="/admin/orcamentos/novo" className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700">
            <FilePlus2 className="size-4" aria-hidden="true" /> Novo orçamento
          </Link>
        }
      />

      <DemoNote>Modo demonstração: os orçamentos ficam salvos neste navegador. Com o banco de dados conectado, passam a ficar disponíveis em qualquer computador.</DemoNote>

      <div className="grid gap-4 sm:grid-cols-3">
        <Summary label="Orçamentos" value={String(quotes.length)} />
        <Summary label="Em aberto (enviados)" value={formatCurrency(totals.open)} />
        <Summary label="Aprovados" value={formatCurrency(totals.approved)} />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Buscar</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por número, título ou cliente"
            className="h-10 w-full rounded-xl border border-slate-200 pr-3 pl-9 text-sm outline-none focus:border-brand-500"
          />
        </label>
        <select
          aria-label="Filtrar por status"
          value={status}
          onChange={(event) => setStatus(event.target.value as QuoteStatus | "")}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand-500"
        >
          <option value="">Todos os status</option>
          {QUOTE_STATUSES.map((value) => (
            <option key={value} value={value}>
              {QUOTE_STATUS_LABELS[value]}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wider text-slate-500 uppercase">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Nº</th>
                <th scope="col" className="px-5 py-3 font-semibold">Cliente / título</th>
                <th scope="col" className="px-5 py-3 font-semibold">Emissão</th>
                <th scope="col" className="px-5 py-3 font-semibold">Validade</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">Total</th>
                <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((quote) => (
                <tr key={quote.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-mono text-xs whitespace-nowrap text-slate-600">{quote.number}</td>
                  <td className="px-5 py-3">
                    <Link href={`/admin/orcamentos/visualizar?id=${encodeURIComponent(quote.id)}`} className="font-semibold text-night-900 hover:text-brand-700">
                      {quote.client.name || "Cliente não informado"}
                    </Link>
                    <span className="block text-xs text-slate-500">{quote.title || "Sem título"}</span>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-slate-600">{formatIsoDate(quote.issueDate)}</td>
                  <td className="px-5 py-3 whitespace-nowrap text-slate-600">{formatIsoDate(quote.validUntil)}</td>
                  <td className="px-5 py-3 text-right font-semibold whitespace-nowrap text-night-900">{formatCurrency(quoteTotals(quote).total, true)}</td>
                  <td className="px-5 py-3">
                    <QuoteStatusBadge status={quote.status} />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <IconLink href={`/admin/orcamentos/visualizar?id=${encodeURIComponent(quote.id)}`} label="Visualizar e gerar PDF" icon={<Eye className="size-4" />} />
                      <IconLink href={`/admin/orcamentos/editar?id=${encodeURIComponent(quote.id)}`} label="Editar" icon={<Pencil className="size-4" />} />
                      <IconButton onClick={() => duplicate(quote)} label="Duplicar" icon={<Copy className="size-4" />} />
                      <IconButton onClick={() => remove(quote)} label="Excluir" icon={<Trash2 className="size-4" />} danger />
                    </div>
                  </td>
                </tr>
              ))}
              {ready && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center text-slate-500">
                    {quotes.length ? "Nenhum orçamento encontrado com os filtros atuais." : "Nenhum orçamento criado ainda."}{" "}
                    <Link href="/admin/orcamentos/novo" className="font-semibold text-brand-700 hover:underline">
                      Criar novo orçamento
                    </Link>
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

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold text-night-900">{value}</p>
    </div>
  );
}

function IconLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link href={href} title={label} aria-label={label} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-night-900">
      {icon}
    </Link>
  );
}

function IconButton({ onClick, label, icon, danger }: { onClick: () => void; label: string; icon: React.ReactNode; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={danger ? "rounded-lg p-2 text-rose-500 transition hover:bg-rose-50" : "rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-night-900"}
    >
      {icon}
    </button>
  );
}
