"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, MessageCircle, Pencil, Printer } from "lucide-react";
import { useContracts } from "@/hooks/use-contracts";
import { CONTRACT_STATUSES, CONTRACT_STATUS_LABELS, type ContractStatus } from "@/lib/contracts";
import { formatCurrency, onlyDigits } from "@/lib/utils";
import { ContractDocument } from "./contract-document";
import { FitToWidth } from "../documents/fit-to-width";

/** Visualização do contrato com ações: imprimir/baixar PDF, WhatsApp, editar e status. */
export function ContractViewer() {
  const id = useSearchParams().get("id") ?? "";
  const { contracts, ready, saveContract } = useContracts();
  const contract = contracts.find((item) => item.id === id);

  if (!contract) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-slate-200">
        <p className="text-slate-600">{ready ? "Contrato não encontrado." : "Carregando…"}</p>
        <Link href="/admin/contratos" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
          <ArrowLeft className="size-4" aria-hidden="true" /> Voltar para contratos
        </Link>
      </div>
    );
  }

  const total = formatCurrency(contract.total, true);
  const clientName = contract.client.name.replace(/\(.*?\)/g, "").trim();

  function printPdf() {
    if (!contract) return;
    const previous = document.title;
    document.title = `Contrato-${contract.number.replace("/", "-")}${clientName ? `-${clientName.replace(/\s+/g, "-")}` : ""}`;
    window.print();
    window.setTimeout(() => (document.title = previous), 500);
  }

  const phone = onlyDigits(contract.client.phone);
  const whatsappText = `Olá${clientName ? `, ${clientName}` : ""}! Segue o contrato nº ${contract.number}${
    contract.title ? ` — ${contract.title}` : ""
  } (valor total de ${total}) para sua conferência e assinatura. Envio o PDF em anexo. Qualquer dúvida, estou à disposição.`;
  const whatsappUrl = `https://wa.me/${phone.length >= 10 ? `55${phone}` : ""}?text=${encodeURIComponent(whatsappText)}`;

  return (
    <div className="space-y-6">
      <div className="space-y-4 print:hidden">
        <Link href="/admin/contratos" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-night-900">
          <ArrowLeft className="size-4" aria-hidden="true" /> Voltar para contratos
        </Link>
        <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-display text-lg font-bold text-night-900">
              Contrato {contract.number} <span className="font-normal text-slate-500">· {total}</span>
            </p>
            <p className="text-sm text-slate-500">{contract.client.name || "Contratante não informado"}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              Status
              <select
                value={contract.status}
                onChange={(event) => saveContract({ ...contract, status: event.target.value as ContractStatus })}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand-500"
              >
                {CONTRACT_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {CONTRACT_STATUS_LABELS[value]}
                  </option>
                ))}
              </select>
            </label>
            <Link
              href={`/admin/contratos/editar?id=${encodeURIComponent(contract.id)}`}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              <Pencil className="size-4" aria-hidden="true" /> Editar
            </Link>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-semibold text-[#fff] hover:bg-[#1fbd5a]"
            >
              <MessageCircle className="size-4" aria-hidden="true" /> Enviar no WhatsApp
            </a>
            <button
              type="button"
              onClick={printPdf}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
            >
              <Printer className="size-4" aria-hidden="true" /> Baixar PDF / Imprimir
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Para gerar o arquivo, clique em <strong>Baixar PDF / Imprimir</strong> e escolha <strong>“Salvar como PDF”</strong>. As páginas são montadas automaticamente
          conforme o tamanho das cláusulas.
        </p>
      </div>

      <FitToWidth>
        <ContractDocument contract={contract} />
      </FitToWidth>
    </div>
  );
}
