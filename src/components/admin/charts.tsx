"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Gráficos leves em SVG/HTML (sem dependências), série única, com tooltip
 * no hover/foco e rótulos de valor seletivos. Cores via tokens do tema.
 */

export interface Datum {
  label: string;
  value: number;
}

/** Barras verticais — ex.: leads por mês. */
export function ColumnChart({ data, valueLabel = "leads", height = 220 }: { data: Datum[]; valueLabel?: string; height?: number }) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(...data.map((item) => item.value), 1);
  const ticks = [0, Math.round(max / 2), max];

  return (
    <figure>
      <div className="relative flex gap-3" style={{ height }}>
        {/* Eixo Y recessivo */}
        <div className="flex flex-col-reverse justify-between pb-6 text-[11px] text-slate-400" aria-hidden="true">
          {ticks.map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>
        <div className="relative flex-1">
          <div className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between" aria-hidden="true">
            {ticks.map((tick) => (
              <span key={tick} className="h-px w-full bg-slate-100" />
            ))}
          </div>
          <ul className="absolute inset-x-0 top-0 bottom-0 flex items-end gap-2 sm:gap-4">
            {data.map((item, index) => {
              const pct = (item.value / max) * 100;
              const isActive = active === index;
              const isLast = index === data.length - 1;
              return (
                <li key={item.label} className="relative flex h-full flex-1 flex-col items-center justify-end">
                  <button
                    type="button"
                    className="group relative flex h-[calc(100%-1.5rem)] w-full items-end justify-center outline-none"
                    onMouseEnter={() => setActive(index)}
                    onMouseLeave={() => setActive(null)}
                    onFocus={() => setActive(index)}
                    onBlur={() => setActive(null)}
                    aria-label={`${item.label}: ${item.value} ${valueLabel}`}
                  >
                    <span
                      className={cn(
                        "w-full max-w-12 rounded-t-[4px] transition-all duration-500",
                        isActive || (active === null && isLast) ? "bg-brand-600" : "bg-brand-400/70",
                      )}
                      style={{ height: `${Math.max(pct, 2)}%` }}
                    />
                    {(isActive || (active === null && isLast)) && (
                      <span className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-night-950 px-2.5 py-1.5 text-xs whitespace-nowrap text-white shadow-lg">
                        <strong>{item.value}</strong> {valueLabel}
                      </span>
                    )}
                  </button>
                  <span className="mt-2 h-4 text-[11px] text-slate-500">{item.label}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <figcaption className="sr-only">
        {data.map((item) => `${item.label}: ${item.value}`).join("; ")}
      </figcaption>
    </figure>
  );
}

/** Barras horizontais com rótulo e valor — ex.: leads por serviço, funil. */
export function BarList({ data, total, tone = "brand" }: { data: Datum[]; total?: number; tone?: "brand" | "volt" }) {
  const max = Math.max(...data.map((item) => item.value), 1);
  const sum = total ?? data.reduce((acc, item) => acc + item.value, 0);
  return (
    <ul className="space-y-3">
      {data.map((item) => {
        const share = sum ? Math.round((item.value / sum) * 100) : 0;
        return (
          <li key={item.label} className="group" title={`${item.label}: ${item.value} (${share}%)`}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate text-slate-700">{item.label}</span>
              <span className="shrink-0 tabular-nums text-slate-500">
                <strong className="text-night-900">{item.value}</strong> · {share}%
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={cn("h-full rounded-full transition-all duration-700 group-hover:opacity-80", tone === "brand" ? "bg-brand-500" : "bg-volt-500")}
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
