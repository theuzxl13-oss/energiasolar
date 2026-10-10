import { QUOTE_STATUS_LABELS, type QuoteStatus } from "@/lib/quotes";
import { cn } from "@/lib/utils";

const STYLES: Record<QuoteStatus, string> = {
  rascunho: "bg-slate-100 text-slate-700 ring-slate-200",
  enviado: "bg-volt-50 text-volt-700 ring-volt-200",
  aprovado: "bg-brand-50 text-brand-800 ring-brand-200",
  recusado: "bg-rose-50 text-rose-700 ring-rose-200",
};

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ring-1", STYLES[status])}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {QUOTE_STATUS_LABELS[status]}
    </span>
  );
}
