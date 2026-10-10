import { Suspense } from "react";
import { QuoteViewer } from "@/components/admin/quotes/quote-viewer";

export const metadata = { title: "Visualizar orçamento" };

export default function VisualizarOrcamentoPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Carregando…</p>}>
      <QuoteViewer />
    </Suspense>
  );
}
