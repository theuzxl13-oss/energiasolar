import { Suspense } from "react";
import { QuoteViewerFromUrl } from "@/components/admin/quotes/quote-viewer";

export const metadata = { title: "Orçamento" };

/** Orçamento com papel timbrado via `?id=` (`&imprimir=1` abre a impressão). */
export default function AdminQuoteViewPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Carregando…</p>}>
      <QuoteViewerFromUrl />
    </Suspense>
  );
}
