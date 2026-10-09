import { Suspense } from "react";
import { ContractViewerFromUrl } from "@/components/admin/contracts/contract-viewer";

export const metadata = { title: "Contrato" };

/** Contrato com papel timbrado via `?id=` (`&imprimir=1` abre a impressão). */
export default function AdminContractViewPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Carregando…</p>}>
      <ContractViewerFromUrl />
    </Suspense>
  );
}
