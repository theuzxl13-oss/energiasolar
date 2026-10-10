"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ContractEditor } from "@/components/admin/contracts/contract-editor";

function EditorFromUrl() {
  const id = useSearchParams().get("id") ?? "";
  return <ContractEditor key={id} contractId={id} />;
}

/** Edição via `?id=` — página estática, compatível com hospedagem estática. */
export default function EditarContratoPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Carregando…</p>}>
      <EditorFromUrl />
    </Suspense>
  );
}
