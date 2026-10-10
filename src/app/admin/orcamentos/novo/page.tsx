import { Suspense } from "react";
import { QuoteEditor } from "@/components/admin/quotes/quote-editor";

export const metadata = { title: "Novo orçamento" };

/** Novo orçamento. Aceita `?lead=ID` para pré-preencher os dados do cliente. */
export default function NovoOrcamentoPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Carregando…</p>}>
      <QuoteEditor />
    </Suspense>
  );
}
