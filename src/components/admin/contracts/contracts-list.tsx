"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Copy, Eye, FileSignature, Pencil, Search, Trash2 } from "lucide-react";
import { useContracts } from "@/hooks/use-contracts";
import { CONTRACT_SERVICE_LABELS, CONTRACT_STATUSES, CONTRACT_STATUS_LABELS, type Contract, type ContractStatus } from "@/lib/contracts";
import { formatIsoDate } from "@/lib/quotes";
import { formatCurrency, generateId } from "@/lib/utils";
import { AdminPageHeader, DemoNote } from "../ui";
import { ContractStatusBadge } from "./contract-status-badge";

export function ContractsList() {
  const { contracts, ready, saveContract, deleteContract, getNextNumber } = useContracts();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ContractStatus | "">("");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return contracts.filter(
      (contract) =>
        (!status || contract.status === status) &&
        (!term || [contract.number, contract.title, contract.client.name, contract.client.document].some((value) => value.toLowerCase().includes(term))),
    );
  }, [contracts, query, status]);

  const summary = useMemo(() => {
    const active = contracts.filter((contract) => ["assinado", "em_execucao"].includes(contract.status));
    return {
      pending: contracts.filter((contract) => contract.status === "aguardando_assinatura").length,
      activeValue: active.reduce((sum, contract) => sum + contract.total, 0),
      done: contracts.filter((contract) => contract.status === "concluido").length,
    };
  }, [contracts]);

  function duplicate(contract: Contract) {
    const id = generateId("contract");
    const now = new Date().toISOString();
    saveContract({ ...contract, id, number: getNextNumber(), status: "rascunho", isDemo: false, title: `${contract.title} (cópia)`, createdAt: now, updatedAt: now });
  }

  function remove(contract: Contract) {
    if (window.confirm(`Excluir o contrato ${contract.number}${contract.client.name ? ` de ${contract.client.name}` : ""}? Esta ação não pode ser desfeita.`)) {
      deleteContract(contract.id);
    }
  }

  const viewHref = (contract: Contract) => `/admin/contratos/visualizar?id=${encodeURIComponent(contract.id)}`;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Contratos"
        description="Crie contratos a partir dos orçamentos aprovados e gere o PDF para assinatura."
        actions={
          <Link href="/admin/contratos/novo" className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700">
            <FileSignature className="size-4" aria-hidden="true" /> Novo contrato
          </Link>
        }
      />

      <DemoNote>
        Modo demonstração: os contratos ficam salvos neste navegador. O modelo de cláusulas é uma base e deve ser revisado pelo jurídico da empresa antes do uso com
        clientes.
      </DemoNote>

      <div className="grid gap-4 sm:grid-cols-3">
        <Summary label="Aguardando assinatura" value={String(summary.pending)} />
        <Summary label="Em vigor (assinados / em execução)" value={formatCurrency(summary.activeValue)} />
        <Summary label="Concluídos" value={String(summary.done)} />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Buscar</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por número, título, cliente ou CPF/CNPJ"
            className="h-10 w-full rounded-xl border border-slate-200 pr-3 pl-9 text-sm outline-none focus:border-brand-500"
          />
        </label>
        <select
          aria-label="Filtrar por status"
          value={status}
          onChange={(event) => setStatus(event.target.value as ContractStatus | "")}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand-500"
        >
          <option value="">Todos os status</option>
          {CONTRACT_STATUSES.map((value) => (
            <option key={value} value={value}>
              {CONTRACT_STATUS_LABELS[value]}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wider text-slate-500 uppercase">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Nº</th>
                <th scope="col" className="px-5 py-3 font-semibold">Cliente / título</th>
                <th scope="col" className="px-5 py-3 font-semibold">Serviço</th>
                <th scope="col" className="px-5 py-3 font-semibold">Início</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">Valor</th>
                <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((contract) => (
                <tr key={contract.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-mono text-xs whitespace-nowrap text-slate-600">{contract.number}</td>
                  <td className="px-5 py-3">
                    <Link href={viewHref(contract)} className="font-semibold text-night-900 hover:text-brand-700">
                      {contract.client.name || "Cliente não informado"}
                    </Link>
                    <span className="block text-xs text-slate-500">{contract.title || "Sem título"}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{CONTRACT_SERVICE_LABELS[contract.service]}</td>
                  <td className="px-5 py-3 whitespace-nowrap text-slate-600">{formatIsoDate(contract.startDate)}</td>
                  <td className="px-5 py-3 text-right font-semibold whitespace-nowrap text-night-900">{formatCurrency(contract.total, true)}</td>
                  <td className="px-5 py-3">
                    <ContractStatusBadge status={contract.status} />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <IconLink href={viewHref(contract)} label="Visualizar e gerar PDF" icon={<Eye className="size-4" />} />
                      <IconLink href={`/admin/contratos/editar?id=${encodeURIComponent(contract.id)}`} label="Editar" icon={<Pencil className="size-4" />} />
                      <IconButton onClick={() => duplicate(contract)} label="Duplicar" icon={<Copy className="size-4" />} />
                      <IconButton onClick={() => remove(contract)} label="Excluir" icon={<Trash2 className="size-4" />} danger />
                    </div>
                  </td>
                </tr>
              ))}
              {ready && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center text-slate-500">
                    {contracts.length ? "Nenhum contrato encontrado com os filtros atuais." : "Nenhum contrato criado ainda."}{" "}
                    <Link href="/admin/contratos/novo" className="font-semibold text-brand-700 hover:underline">
                      Criar novo contrato
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold text-night-900">{value}</p>
    </div>
  );
}

function IconLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link href={href} title={label} aria-label={label} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-night-900">
      {icon}
    </Link>
  );
}

function IconButton({ onClick, label, icon, danger }: { onClick: () => void; label: string; icon: React.ReactNode; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={danger ? "rounded-lg p-2 text-rose-500 transition hover:bg-rose-50" : "rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-night-900"}
    >
      {icon}
    </button>
  );
}
