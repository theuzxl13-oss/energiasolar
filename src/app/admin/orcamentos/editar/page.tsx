import { Suspense } from "react";
import { QuoteEditorFromUrl } from "@/components/admin/quotes/quote-editor";

export const metadata = { title: "Editar orçamento" };

/** Novo orçamento, a partir de lead (`?lead=`) ou edição (`?id=`). */
export default function AdminQuoteEditPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Carregando…</p>}>
      <QuoteEditorFromUrl />
    </Suspense>
  );
}
