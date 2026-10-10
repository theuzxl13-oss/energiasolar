"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, FileSignature, MessageCircle, Pencil, Printer } from "lucide-react";
import { useQuotes } from "@/hooks/use-quotes";
import { useSiteSettings } from "@/hooks/use-site-content";
import { QUOTE_STATUSES, QUOTE_STATUS_LABELS, quoteTotals, type QuoteStatus } from "@/lib/quotes";
import { formatCurrency, onlyDigits } from "@/lib/utils";
import { QuoteDocument } from "./quote-document";
import { FitToWidth } from "../documents/fit-to-width";

/** Visualização do orçamento com ações: imprimir/baixar PDF, WhatsApp, editar e status. */
export function QuoteViewer() {
  const id = useSearchParams().get("id") ?? "";
  const { quotes, ready, saveQuote } = useQuotes();
  const company = useSiteSettings().settings;
  const quote = quotes.find((item) => item.id === id);

  if (!quote) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-slate-200">
        <p className="text-slate-600">{ready ? "Orçamento não encontrado." : "Carregando…"}</p>
        <Link href="/admin/orcamentos" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
          <ArrowLeft className="size-4" aria-hidden="true" /> Voltar para orçamentos
        </Link>
      </div>
    );
  }

  const total = formatCurrency(quoteTotals(quote).total, true);
  const contactLine = `Fale conosco pelo WhatsApp ${company.contact.whatsappDisplay} ou pelo e-mail ${company.contact.email}.`;

  function printPdf() {
    if (!quote) return;
    // O nome do arquivo sugerido ao "Salvar como PDF" vem do título da página.
    const previous = document.title;
    const client = quote.client.name.replace(/\(.*?\)/g, "").trim().replace(/\s+/g, "-");
    document.title = `Orcamento-${quote.number.replace("/", "-")}${client ? `-${client}` : ""}`;
    window.print();
    window.setTimeout(() => (document.title = previous), 500);
  }

  const phone = onlyDigits(quote.client.phone);
  const whatsappText = `Olá${quote.client.name ? `, ${quote.client.name.replace(/\(.*?\)/g, "").trim()}` : ""}! Segue o orçamento nº ${quote.number}${
    quote.title ? ` — ${quote.title}` : ""
  }, no valor total de ${total}, válido até ${quote.validUntil.split("-").reverse().join("/")}. Envio o PDF em anexo. Qualquer dúvida, estou à disposição.`;
  const whatsappUrl = `https://wa.me/${phone.length >= 10 ? `55${phone}` : ""}?text=${encodeURIComponent(whatsappText)}`;

  return (
    <div className="space-y-6">
      <div className="space-y-4 print:hidden">
        <Link href="/admin/orcamentos" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-night-900">
          <ArrowLeft className="size-4" aria-hidden="true" /> Voltar para orçamentos
        </Link>
        <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-display text-lg font-bold text-night-900">
              Orçamento {quote.number} <span className="font-normal text-slate-500">· {total}</span>
            </p>
            <p className="text-sm text-slate-500">{quote.client.name || "Cliente não informado"}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              Status
              <select
                value={quote.status}
                onChange={(event) => saveQuote({ ...quote, status: event.target.value as QuoteStatus })}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand-500"
              >
                {QUOTE_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {QUOTE_STATUS_LABELS[value]}
                  </option>
                ))}
              </select>
            </label>
            <Link
              href={`/admin/contratos/novo?orcamento=${encodeURIComponent(quote.id)}`}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              <FileSignature className="size-4" aria-hidden="true" /> Gerar contrato
            </Link>
            <Link
              href={`/admin/orcamentos/editar?id=${encodeURIComponent(quote.id)}`}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              <Pencil className="size-4" aria-hidden="true" /> Editar
            </Link>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-semibold text-[#fff] hover:bg-[#1fbd5a]"
            >
              <MessageCircle className="size-4" aria-hidden="true" /> Enviar no WhatsApp
            </a>
            <button
              type="button"
              onClick={printPdf}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
            >
              <Printer className="size-4" aria-hidden="true" /> Baixar PDF / Imprimir
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Para gerar o arquivo, clique em <strong>Baixar PDF / Imprimir</strong> e escolha <strong>“Salvar como PDF”</strong> como destino. O WhatsApp abre com a
          mensagem pronta; anexe o PDF salvo antes de enviar.
        </p>
      </div>

      <FitToWidth>
        <QuoteDocument quote={quote} contactLine={contactLine} />
      </FitToWidth>
    </div>
  );
}
