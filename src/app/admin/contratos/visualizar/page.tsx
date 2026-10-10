import { Suspense } from "react";
import { ContractViewer } from "@/components/admin/contracts/contract-viewer";

export const metadata = { title: "Visualizar contrato" };

export default function VisualizarContratoPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Carregando…</p>}>
      <ContractViewer />
    </Suspense>
  );
}
