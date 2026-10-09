"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef } from "react";
import { ArrowLeft, Pencil, Printer } from "lucide-react";

/**
 * Imprime o documento timbrado da página, aguardando logo e marca d'água
 * carregarem. O título da página vira o nome sugerido do arquivo PDF.
 */
async function printDocument(fileTitle: string) {
  await Promise.all(
    Array.from(document.querySelectorAll<HTMLImageElement>(".letterhead-doc img")).map((img) =>
      img.complete ? Promise.resolve() : new Promise((resolve) => img.addEventListener("load", resolve, { once: true })),
    ),
  );
  const previous = document.title;
  document.title = fileTitle.replace(/[\\/:*?"<>|]/g, "-").trim();
  window.print();
  document.title = previous;
}

interface DocumentViewerProps<S extends string> {
  backHref: string;
  backLabel: string;
  editHref: string;
  /** Nome sugerido para o PDF (sem extensão). */
  fileTitle: string;
  status: S;
  statuses: readonly S[];
  statusLabels: Record<S, string>;
  onStatusChange: (status: S) => void;
  /** Abre a janela de impressão assim que a página carrega (link "Imprimir / PDF" da listagem). */
  autoPrint?: boolean;
  /** Ações extras na barra (ex.: "Gerar contrato" no orçamento). */
  actions?: React.ReactNode;
  children: React.ReactNode;
}

/** Barra de ações + documento timbrado. A barra some na impressão. */
export function DocumentViewer<S extends string>({
  backHref,
  backLabel,
  editHref,
  fileTitle,
  status,
  statuses,
  statusLabels,
  onStatusChange,
  autoPrint,
  actions,
  children,
}: DocumentViewerProps<S>) {
  const printed = useRef(false);
  const print = useCallback(() => void printDocument(fileTitle), [fileTitle]);

  useEffect(() => {
    if (autoPrint && !printed.current) {
      printed.current = true;
      print();
    }
  }, [autoPrint, print]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 print:hidden sm:flex-row sm:items-center sm:justify-between">
        <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-night-900">
          <ArrowLeft className="size-4" aria-hidden="true" /> {backLabel}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            Status
            <select
              value={status}
              onChange={(event) => onStatusChange(event.target.value as S)}
              className="h-9 rounded-full border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand-500"
            >
              {statuses.map((item) => (
                <option key={item} value={item}>{statusLabels[item]}</option>
              ))}
            </select>
          </label>
          {actions}
          <Link href={editHref} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
            <Pencil className="size-4" aria-hidden="true" /> Editar
          </Link>
          <button type="button" onClick={print} className="inline-flex items-center gap-2 rounded-full bg-night-950 px-4 py-2 text-sm font-semibold text-white hover:bg-night-800">
            <Printer className="size-4" aria-hidden="true" /> Imprimir / Salvar PDF
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-slate-500 print:hidden">
        Para gerar o PDF, escolha <strong>“Salvar como PDF”</strong> como destino na janela de impressão. Se o cabeçalho escuro não aparecer, ative <strong>“Gráficos de fundo”</strong> nas opções.
      </p>

      <div className="overflow-x-auto pb-8 print:overflow-visible print:pb-0">{children}</div>
    </div>
  );
}

/** Mensagem de "não encontrado" / carregando das telas de documento. */
export function DocumentNotFound({ ready, label, backHref, backLabel }: { ready: boolean; label: string; backHref: string; backLabel: string }) {
  return (
    <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-slate-200">
      <p className="text-slate-600">{ready ? `${label} não encontrado.` : "Carregando…"}</p>
      <Link href={backHref} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
        <ArrowLeft className="size-4" aria-hidden="true" /> {backLabel}
      </Link>
    </div>
  );
}
