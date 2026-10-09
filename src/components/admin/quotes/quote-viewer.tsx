"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FileSignature } from "lucide-react";
import { useDemoQuotes } from "@/hooks/use-demo-quotes";
import { QUOTE_STATUS_LABELS } from "@/lib/quotes";
import { QUOTE_STATUSES } from "@/types";
import { DocumentNotFound, DocumentViewer } from "../document-viewer";
import { QuoteDocument } from "./quote-document";
import { quoteEditHref } from "./quotes-list";

export function QuoteViewerFromUrl() {
  const params = useSearchParams();
  const { quotes, ready, saveQuote } = useDemoQuotes();
  const quote = quotes.find((item) => item.id === params.get("id"));

  if (!quote) return <DocumentNotFound ready={ready} label="Orçamento" backHref="/admin/orcamentos" backLabel="Voltar para orçamentos" />;

  return (
    <DocumentViewer
      backHref="/admin/orcamentos"
      backLabel="Voltar para orçamentos"
      editHref={quoteEditHref(quote.id)}
      fileTitle={`Orçamento ${quote.number.replace("/", "-")}${quote.client.name ? ` - ${quote.client.name}` : ""}`}
      status={quote.status}
      statuses={QUOTE_STATUSES}
      statusLabels={QUOTE_STATUS_LABELS}
      onStatusChange={(status) => saveQuote({ ...quote, status })}
      autoPrint={params.get("imprimir") === "1"}
      actions={
        quote.status === "aprovado" && (
          <Link
            href={`/admin/contratos/editar?orcamento=${encodeURIComponent(quote.id)}`}
            className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <FileSignature className="size-4" aria-hidden="true" /> Gerar contrato
          </Link>
        )
      }
    >
      <QuoteDocument quote={quote} />
    </DocumentViewer>
  );
}
