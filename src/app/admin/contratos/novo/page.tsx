import { Suspense } from "react";
import { ContractEditor } from "@/components/admin/contracts/contract-editor";

export const metadata = { title: "Novo contrato" };

/** Novo contrato. Aceita `?orcamento=ID` para preencher a partir de um orçamento. */
export default function NovoContratoPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Carregando…</p>}>
      <ContractEditor />
    </Suspense>
  );
}
