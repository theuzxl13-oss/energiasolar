import { Suspense } from "react";
import { ContractEditorFromUrl } from "@/components/admin/contracts/contract-editor";

export const metadata = { title: "Editar contrato" };

/** Novo contrato, a partir de lead (`?lead=`) ou orçamento (`?orcamento=`), ou edição (`?id=`). */
export default function AdminContractEditPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Carregando…</p>}>
      <ContractEditorFromUrl />
    </Suspense>
  );
}
