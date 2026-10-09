"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Copy, Eye, FileSignature, Pencil, Plus, Printer, Search, Trash2 } from "lucide-react";
import { useDemoContracts } from "@/hooks/use-demo-contracts";
import { CONTRACT_STATUS_LABELS, contractPeriod, duplicateContract } from "@/lib/contracts";
import { SERVICE_LABELS } from "@/lib/labels";
import { cn, formatCurrency } from "@/lib/utils";
import { CONTRACT_STATUSES, type ContractStatus } from "@/types";
import { AdminPageHeader, DemoNote } from "../ui";

export const contractEditHref = (id?: string) => (id ? `/admin/contratos/editar?id=${encodeURIComponent(id)}` : "/admin/contratos/editar");
export const contractViewHref = (id: string, print = false) => `/admin/contratos/visualizar?id=${encodeURIComponent(id)}${print ? "&imprimir=1" : ""}`;

const STATUS_STYLES: Record<ContractStatus, string> = {
  rascunho: "bg-slate-100 text-slate-700 ring-slate-200",
  emitido: "bg-volt-50 text-volt-700 ring-volt-200",
  assinado: "bg-brand-50 text-brand-800 ring-brand-200",
  cancelado: "bg-rose-50 text-rose-700 ring-rose-200",
};

export function ContractStatusBadge({ status }: { status: ContractStatus }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ring-1", STATUS_STYLES[status])}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {CONTRACT_STATUS_LABELS[status]}
    </span>
  );
}

export function ContractsList() {
  const router = useRouter();
  const { contracts, ready, saveContract, removeContract } = useDemoContracts();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ContractStatus | "">("");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return contracts.filter(
      (contract) =>
        (!status || contract.status === status) &&
        (!term || [contract.client.name, contract.title, contract.number, contract.client.document].some((value) => value.toLowerCase().includes(term))),
    );
  }, [contracts, query, status]);

  function duplicate(id: string) {
    const source = contracts.find((item) => item.id === id);
    if (!source) return;
    const copy = duplicateContract(contracts, source);
    saveContract(copy);
    router.push(contractEditHref(copy.id));
  }

  function remove(id: string, label: string) {
    if (window.confirm(`Excluir o contrato de ${label}? Esta ação não pode ser desfeita.`)) removeContract(id);
  }

  const actionClass = "rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-night-900";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Contratos"
        description="Emissão de contratos com o papel timbrado da empresa, prontos para imprimir ou salvar em PDF."
        actions={
          <Link href={contractEditHref()} className="inline-flex items-center gap-2 rounded-full bg-night-950 px-4 py-2 text-sm font-semibold text-white hover:bg-night-800">
            <Plus className="size-4" aria-hidden="true" /> Novo contrato
          </Link>
        }
      />
      <DemoNote>
        Na demonstração, os contratos ficam salvos neste navegador. Em produção, serão gravados na tabela <code>contracts</code> do Supabase. Os modelos de cláusulas devem ser revisados pelo jurídico antes do uso. Dica: um orçamento aprovado pode virar contrato pelo botão “Gerar contrato” na tela do orçamento.
      </DemoNote>

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Buscar</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por cliente, número ou CPF/CNPJ"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-9 text-sm outline-none focus:border-brand-500"
          />
        </label>
        <select aria-label="Status" value={status} onChange={(event) => setStatus(event.target.value as ContractStatus | "")} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand-500">
          <option value="">Todos os status</option>
          {CONTRACT_STATUSES.map((item) => (
            <option key={item} value={item}>{CONTRACT_STATUS_LABELS[item]}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs font-semibold tracking-wider text-slate-500 uppercase">
            <tr>
              <th className="px-5 py-3.5">Cliente</th>
              <th className="px-5 py-3.5">Contrato</th>
              <th className="px-5 py-3.5">Vigência / prazo</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Valor</th>
              <th className="px-5 py-3.5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((contract) => {
              const label = contract.client.name || contract.title || contract.number;
              return (
                <tr key={contract.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-night-900">{contract.client.name || "Cliente não informado"}</p>
                    <p className="text-xs text-slate-500">{contract.client.document || "—"}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-slate-700">{contract.title || SERVICE_LABELS[contract.service]}</p>
                    <p className="text-xs text-slate-500">nº {contract.number} · {SERVICE_LABELS[contract.service]}</p>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-slate-600">{contractPeriod(contract)}</td>
                  <td className="px-5 py-4">
                    <ContractStatusBadge status={contract.status} />
                  </td>
                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    <p className="font-semibold text-night-900">{formatCurrency(contract.value, true)}</p>
                    <p className="text-xs text-slate-500">{contract.billing === "mensal" ? "mensal" : "valor total"}</p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-0.5">
                      <Link href={contractViewHref(contract.id)} className={actionClass} aria-label="Visualizar" title="Visualizar">
                        <Eye className="size-4" />
                      </Link>
                      <Link href={contractViewHref(contract.id, true)} className={actionClass} aria-label="Imprimir / PDF" title="Imprimir / PDF">
                        <Printer className="size-4" />
                      </Link>
                      <Link href={contractEditHref(contract.id)} className={actionClass} aria-label="Editar" title="Editar">
                        <Pencil className="size-4" />
                      </Link>
                      <button type="button" onClick={() => duplicate(contract.id)} className={actionClass} aria-label="Duplicar" title="Duplicar">
                        <Copy className="size-4" />
                      </button>
                      <button type="button" onClick={() => remove(contract.id, label)} className="rounded-lg p-2 text-rose-500 transition hover:bg-rose-50" aria-label="Excluir" title="Excluir">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {ready && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <FileSignature className="size-8 text-slate-300" aria-hidden="true" />
            <p className="text-sm text-slate-500">{contracts.length ? "Nenhum contrato encontrado com esses filtros." : "Nenhum contrato emitido ainda."}</p>
            {!contracts.length && (
              <Link href={contractEditHref()} className="text-sm font-semibold text-brand-700 hover:text-brand-800">
                Emitir o primeiro contrato
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
