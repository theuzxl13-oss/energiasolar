"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { QuoteEditor } from "@/components/admin/quotes/quote-editor";

function EditorFromUrl() {
  const id = useSearchParams().get("id") ?? "";
  return <QuoteEditor key={id} quoteId={id} />;
}

/** Edição via `?id=` — página estática, compatível com hospedagem estática. */
export default function EditarOrcamentoPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Carregando…</p>}>
      <EditorFromUrl />
    </Suspense>
  );
}
