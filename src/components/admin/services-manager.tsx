"use client";

import { useState } from "react";
import { solutions } from "@/data/solutions";
import { SERVICE_LABELS } from "@/lib/labels";
import { SERVICE_TYPES, type ServiceType } from "@/types";
import { Icon } from "@/components/ui/icon";
import { AdminPageHeader, DemoNote, Panel } from "./ui";
import { cn } from "@/lib/utils";

/** Gerenciamento de serviços (estado local na demonstração). */
export function ServicesManager() {
  const [enabled, setEnabled] = useState<Record<ServiceType, boolean>>(
    () => Object.fromEntries(SERVICE_TYPES.map((service) => [service, true])) as Record<ServiceType, boolean>,
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Serviços" description="Soluções exibidas no site e opções disponíveis no formulário de orçamento" />
      <DemoNote>Alterações nesta tela não são persistidas no modo demonstração. Os textos vêm de <code>src/data/solutions.ts</code>.</DemoNote>

      <div className="grid gap-4 lg:grid-cols-3">
        {solutions.map((solution) => (
          <Panel key={solution.id}>
            <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-volt-500 text-white">
              <Icon name={solution.icon} className="size-5" />
            </span>
            <h2 className="mt-4 font-semibold text-night-900">{solution.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{solution.description}</p>
            <p className="mt-3 text-xs text-slate-500">
              Página: <code>{solution.href}</code> • CTA: “{solution.cta.label}”
            </p>
          </Panel>
        ))}
      </div>

      <Panel title="Serviços do formulário de orçamento">
        <ul className="divide-y divide-slate-100">
          {SERVICE_TYPES.map((service) => (
            <li key={service} className="flex items-center justify-between py-3">
              <span className="text-sm font-medium text-night-900">{SERVICE_LABELS[service]}</span>
              <button
                type="button"
                role="switch"
                aria-checked={enabled[service]}
                aria-label={`Exibir ${SERVICE_LABELS[service]}`}
                onClick={() => setEnabled((current) => ({ ...current, [service]: !current[service] }))}
                className={cn("relative h-6 w-11 rounded-full transition", enabled[service] ? "bg-brand-500" : "bg-slate-300")}
              >
                <span className={cn("absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition", enabled[service] && "translate-x-5")} />
              </button>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
