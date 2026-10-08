import { Suspense } from "react";
import { LeadDetailFromUrl } from "@/components/admin/lead-detail";

export const metadata = { title: "Detalhes do lead" };

/** Detalhe do lead via `?id=` — página estática, compatível com hospedagem estática. */
export default function AdminLeadPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Carregando…</p>}>
      <LeadDetailFromUrl />
    </Suspense>
  );
}
