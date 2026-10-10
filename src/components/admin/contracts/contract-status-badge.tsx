import { CONTRACT_STATUS_LABELS, type ContractStatus } from "@/lib/contracts";
import { cn } from "@/lib/utils";

const STYLES: Record<ContractStatus, string> = {
  rascunho: "bg-slate-100 text-slate-700 ring-slate-200",
  aguardando_assinatura: "bg-amber-50 text-amber-800 ring-amber-200",
  assinado: "bg-volt-50 text-volt-700 ring-volt-200",
  em_execucao: "bg-sky-50 text-sky-700 ring-sky-200",
  concluido: "bg-brand-50 text-brand-800 ring-brand-200",
  cancelado: "bg-rose-50 text-rose-700 ring-rose-200",
};

export function ContractStatusBadge({ status }: { status: ContractStatus }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ring-1", STYLES[status])}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {CONTRACT_STATUS_LABELS[status]}
    </span>
  );
}
