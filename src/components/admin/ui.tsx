import { cn } from "@/lib/utils";
import { STATUS_LABELS } from "@/lib/labels";
import type { LeadStatus } from "@/types";

export function AdminPageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-bold text-night-900 sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, description, actions, className, children }: { title?: string; description?: string; actions?: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <section className={cn("rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6", className)}>
      {(title || actions) && (
        <header className="mb-5 flex items-start justify-between gap-4">
          <div>
            {title && <h2 className="font-semibold text-night-900">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}

const STATUS_STYLES: Record<LeadStatus, string> = {
  novo: "bg-volt-50 text-volt-700 ring-volt-200",
  em_contato: "bg-sky-50 text-sky-700 ring-sky-200",
  orcamento_enviado: "bg-violet-50 text-violet-700 ring-violet-200",
  negociacao: "bg-amber-50 text-amber-800 ring-amber-200",
  fechado: "bg-brand-50 text-brand-800 ring-brand-200",
  perdido: "bg-slate-100 text-slate-600 ring-slate-200",
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ring-1", STATUS_STYLES[status])}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  );
}

export function KpiCard({ label, value, hint, icon }: { label: string; value: React.ReactNode; hint?: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        <span className="flex size-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">{icon}</span>
      </div>
      <p className="mt-3 font-display text-3xl font-bold text-night-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function DemoNote({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-900 ring-1 ring-amber-200">{children}</p>;
}
