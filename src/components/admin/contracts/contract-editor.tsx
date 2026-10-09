"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, Eye, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { useDemoContracts } from "@/hooks/use-demo-contracts";
import { useDemoLeads } from "@/hooks/use-demo-leads";
import { useDemoQuotes } from "@/hooks/use-demo-quotes";
import { BRAZILIAN_STATES } from "@/lib/brazil";
import {
  CONTRACT_STATUS_LABELS,
  CONTRACT_VARIABLES,
  createContract,
  createContractFromLead,
  createContractFromQuote,
  DEFAULT_SCOPE,
  defaultBilling,
  defaultClauses,
} from "@/lib/contracts";
import { maskDocument, quoteTotals } from "@/lib/quotes";
import { SERVICE_LABELS } from "@/lib/labels";
import { cn, formatNumber, generateId, maskPhone, parseCurrencyInput } from "@/lib/utils";
import { CONTRACT_STATUSES, SERVICE_TYPES, type Contract, type ContractBilling, type ContractClause, type ContractParty, type ServiceType } from "@/types";
import { AdminPageHeader, Panel } from "../ui";
import { ContractDocument } from "./contract-document";
import { contractViewHref } from "./contracts-list";

const inputClass = "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand-500";
const textareaClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm leading-relaxed outline-none focus:border-brand-500";

function Field({ label, hint, className, children }: { label: string; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={cn("grid gap-1.5", className)}>
      <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">{label}</span>
      {children}
      {hint && <span className="text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

/** Compara cláusulas pelo conteúdo (ignora ids) — saber se o usuário editou o modelo. */
const sameClauses = (a: ContractClause[], b: ContractClause[]) =>
  a.length === b.length && a.every((item, index) => item.title === b[index]!.title && item.body === b[index]!.body);

/** Novo contrato (sem parâmetros), a partir de um lead (`?lead=`), de um orçamento (`?orcamento=`) ou edição (`?id=`). */
export function ContractEditorFromUrl() {
  const params = useSearchParams();
  const id = params.get("id");
  const leadId = params.get("lead");
  const quoteId = params.get("orcamento");
  const { contracts, ready, saveContract } = useDemoContracts();
  const { leads, ready: leadsReady } = useDemoLeads();
  const { quotes, ready: quotesReady } = useDemoQuotes();
  const [initial, setInitial] = useState<Contract | null | undefined>(undefined);

  useEffect(() => {
    if (initial !== undefined || !ready || (leadId && !leadsReady) || (quoteId && !quotesReady)) return;
    if (id) {
      setInitial(contracts.find((item) => item.id === id) ?? null);
      return;
    }
    const quote = quoteId ? quotes.find((item) => item.id === quoteId) : undefined;
    const lead = leadId ? leads.find((item) => item.id === leadId) : undefined;
    setInitial(
      quote ? createContractFromQuote(contracts, quote, quoteTotals(quote).total) : lead ? createContractFromLead(contracts, lead) : createContract(contracts),
    );
  }, [initial, ready, leadsReady, quotesReady, id, leadId, quoteId, contracts, leads, quotes]);

  if (initial === undefined) return <p className="text-sm text-slate-500">Carregando…</p>;
  if (initial === null) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-slate-200">
        <p className="text-slate-600">Contrato não encontrado.</p>
        <Link href="/admin/contratos" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
          <ArrowLeft className="size-4" aria-hidden="true" /> Voltar para contratos
        </Link>
      </div>
    );
  }
  return <ContractEditor key={initial.id} initial={initial} isNew={!id} onSave={saveContract} />;
}

function ContractEditor({ initial, isNew, onSave }: { initial: Contract; isNew: boolean; onSave: (contract: Contract) => void }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Contract>(initial);
  const [valueText, setValueText] = useState(initial.value ? formatNumber(initial.value, 2) : "");
  const [saved, setSaved] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const update = (patch: Partial<Contract>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setSaved(false);
  };
  const updateClient = (patch: Partial<ContractParty>) => update({ client: { ...draft.client, ...patch } });
  const updateClause = (id: string, patch: Partial<ContractClause>) => update({ clauses: draft.clauses.map((item) => (item.id === id ? { ...item, ...patch } : item)) });

  /** Troca de serviço/cobrança: aplica o modelo correspondente se o atual não foi editado. */
  function changeModel(service: ServiceType, billing: ContractBilling) {
    const untouched = sameClauses(draft.clauses, defaultClauses(draft.service, draft.billing));
    update({
      service,
      billing,
      scope: draft.scope === DEFAULT_SCOPE[draft.service] || !draft.scope ? DEFAULT_SCOPE[service] : draft.scope,
      durationMonths: billing === "mensal" ? (draft.durationMonths ?? 12) : null,
      ...(untouched ? { clauses: defaultClauses(service, billing) } : {}),
    });
  }

  function moveClause(index: number, direction: -1 | 1) {
    const clauses = [...draft.clauses];
    const target = index + direction;
    if (target < 0 || target >= clauses.length) return;
    [clauses[index], clauses[target]] = [clauses[target]!, clauses[index]!];
    update({ clauses });
  }

  function restoreClauses() {
    if (window.confirm("Substituir todas as cláusulas pelo modelo padrão deste tipo de serviço? As edições feitas nelas serão perdidas.")) {
      update({ clauses: defaultClauses(draft.service, draft.billing) });
    }
  }

  const missing = [
    !draft.client.name.trim() && "nome/razão social do contratante",
    !draft.client.document.trim() && "CPF/CNPJ do contratante",
    !draft.value && "valor",
    !draft.forum.trim() && "foro (cidade/UF)",
  ].filter(Boolean) as string[];

  function save(thenView: boolean) {
    setShowErrors(true);
    onSave(draft);
    setSaved(true);
    if (thenView) router.push(contractViewHref(draft.id));
    else if (isNew) router.replace(`/admin/contratos/editar?id=${encodeURIComponent(draft.id)}`);
  }

  const isMonthly = draft.billing === "mensal";
  const docLabel = draft.client.kind === "pj" ? "CNPJ" : "CPF";

  return (
    <div className="space-y-6">
      <Link href="/admin/contratos" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-night-900">
        <ArrowLeft className="size-4" aria-hidden="true" /> Voltar para contratos
      </Link>
      <AdminPageHeader
        title={isNew ? "Novo contrato" : `Contrato nº ${draft.number}`}
        description={isNew ? `Será emitido com o nº ${draft.number}.` : "Edite os dados e salve para atualizar o documento."}
        actions={
          <>
            <button type="button" onClick={() => save(false)} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
              <Save className="size-4" aria-hidden="true" /> {saved ? "Salvo" : "Salvar"}
            </button>
            <button type="button" onClick={() => save(true)} className="inline-flex items-center gap-2 rounded-full bg-night-950 px-4 py-2 text-sm font-semibold text-white hover:bg-night-800">
              <Eye className="size-4" aria-hidden="true" /> Salvar e visualizar
            </button>
          </>
        }
      />

      {showErrors && missing.length > 0 && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          Contrato salvo, mas ainda falta preencher: {missing.join(", ")}. Esses campos aparecem entre colchetes no documento.
        </p>
      )}

      <div className="grid items-start gap-6 2xl:grid-cols-[minmax(0,1fr)_490px]">
        <div className="space-y-6">
          <Panel title="Dados do contrato">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Título" hint="Aparece no topo do documento. Ex.: Usina solar 6,6 kWp — Residência Silva" className="sm:col-span-2">
                <input value={draft.title} onChange={(event) => update({ title: event.target.value })} className={inputClass} />
              </Field>
              <Field label="Serviço">
                <select value={draft.service} onChange={(event) => changeModel(event.target.value as ServiceType, defaultBilling(event.target.value as ServiceType))} className={inputClass}>
                  {SERVICE_TYPES.map((item) => (
                    <option key={item} value={item}>{SERVICE_LABELS[item]}</option>
                  ))}
                </select>
              </Field>
              <Field label="Status">
                <select value={draft.status} onChange={(event) => update({ status: event.target.value as Contract["status"] })} className={inputClass}>
                  {CONTRACT_STATUSES.map((item) => (
                    <option key={item} value={item}>{CONTRACT_STATUS_LABELS[item]}</option>
                  ))}
                </select>
              </Field>
              <Field label="Número">
                <input value={draft.number} onChange={(event) => update({ number: event.target.value })} className={inputClass} />
              </Field>
              <Field label="Data de início / assinatura">
                <input type="date" value={draft.startDate} onChange={(event) => update({ startDate: event.target.value || draft.startDate })} className={inputClass} />
              </Field>
            </div>
          </Panel>

          <Panel title="Contratante">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex gap-2 sm:col-span-2" role="radiogroup" aria-label="Tipo de pessoa">
                {(["pf", "pj"] as const).map((kind) => (
                  <label key={kind} className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
                    <input type="radio" name="kind" checked={draft.client.kind === kind} onChange={() => updateClient({ kind })} className="accent-brand-600" />
                    {kind === "pf" ? "Pessoa física" : "Pessoa jurídica"}
                  </label>
                ))}
              </div>
              <Field label={draft.client.kind === "pj" ? "Razão social" : "Nome completo"}>
                <input value={draft.client.name} onChange={(event) => updateClient({ name: event.target.value })} className={inputClass} />
              </Field>
              <Field label={docLabel}>
                <input value={draft.client.document} inputMode="numeric" onChange={(event) => updateClient({ document: maskDocument(event.target.value) })} className={inputClass} />
              </Field>
              {draft.client.kind === "pj" && (
                <Field label="Representante legal" hint="Nome e CPF de quem assina pela empresa" className="sm:col-span-2">
                  <input value={draft.client.representative} onChange={(event) => updateClient({ representative: event.target.value })} className={inputClass} />
                </Field>
              )}
              <Field label="Endereço" className="sm:col-span-2">
                <input value={draft.client.address} onChange={(event) => updateClient({ address: event.target.value })} placeholder="Rua, número, complemento, bairro" className={inputClass} />
              </Field>
              <div className="grid grid-cols-[1fr_96px] gap-3">
                <Field label="Cidade">
                  <input value={draft.client.city} onChange={(event) => updateClient({ city: event.target.value })} className={inputClass} />
                </Field>
                <Field label="UF">
                  <select value={draft.client.state} onChange={(event) => updateClient({ state: event.target.value })} className={inputClass}>
                    <option value="">—</option>
                    {BRAZILIAN_STATES.map((state) => (
                      <option key={state.uf} value={state.uf}>{state.uf}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Telefone">
                  <input value={draft.client.phone} inputMode="tel" onChange={(event) => updateClient({ phone: maskPhone(event.target.value) })} className={inputClass} />
                </Field>
                <Field label="E-mail">
                  <input type="email" value={draft.client.email} onChange={(event) => updateClient({ email: event.target.value })} className={inputClass} />
                </Field>
              </div>
            </div>
          </Panel>

          <Panel title="Objeto e condições">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Local da instalação / prestação" className="sm:col-span-2">
                <div className="flex gap-2">
                  <input value={draft.installAddress} onChange={(event) => update({ installAddress: event.target.value })} className={inputClass} />
                  <button
                    type="button"
                    onClick={() => update({ installAddress: [draft.client.address, draft.client.city && `${draft.client.city}/${draft.client.state}`].filter(Boolean).join(", ") })}
                    className="shrink-0 rounded-xl px-3 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                  >
                    Usar endereço do cliente
                  </button>
                </div>
              </Field>
              <Field label="Escopo técnico" hint="Equipamentos, potência, quantidades. Entra na cláusula do objeto." className="sm:col-span-2">
                <textarea rows={3} value={draft.scope} onChange={(event) => update({ scope: event.target.value })} className={textareaClass} />
              </Field>
              <Field label="Cobrança">
                <select value={draft.billing} onChange={(event) => changeModel(draft.service, event.target.value as ContractBilling)} className={inputClass}>
                  <option value="unico">Valor total (instalação / obra)</option>
                  <option value="mensal">Mensalidade (serviço recorrente)</option>
                </select>
              </Field>
              <Field label={isMonthly ? "Valor mensal (R$)" : "Valor total (R$)"}>
                <input
                  value={valueText}
                  inputMode="decimal"
                  placeholder="0,00"
                  onChange={(event) => {
                    setValueText(event.target.value);
                    update({ value: parseCurrencyInput(event.target.value) });
                  }}
                  onBlur={() => setValueText(draft.value ? formatNumber(draft.value, 2) : "")}
                  className={inputClass}
                />
              </Field>
              <Field label="Forma de pagamento" className="sm:col-span-2">
                <textarea rows={2} value={draft.paymentTerms} onChange={(event) => update({ paymentTerms: event.target.value })} className={textareaClass} />
              </Field>
              {isMonthly ? (
                <>
                  <Field label="Dia de vencimento">
                    <input type="number" min={1} max={31} value={draft.dueDay} onChange={(event) => update({ dueDay: Math.min(31, Math.max(1, Number(event.target.value) || 1)) })} className={inputClass} />
                  </Field>
                  <Field label="Vigência">
                    <div className="flex gap-2">
                      <select
                        value={draft.durationMonths === null ? "indeterminado" : "meses"}
                        onChange={(event) => update({ durationMonths: event.target.value === "indeterminado" ? null : 12 })}
                        className={inputClass}
                      >
                        <option value="meses">Prazo determinado</option>
                        <option value="indeterminado">Indeterminado</option>
                      </select>
                      {draft.durationMonths !== null && (
                        <input type="number" min={1} aria-label="Meses" value={draft.durationMonths} onChange={(event) => update({ durationMonths: Math.max(1, Number(event.target.value) || 1) })} className={cn(inputClass, "w-24")} />
                      )}
                    </div>
                  </Field>
                </>
              ) : (
                <>
                  <Field label="Prazo de execução (dias)">
                    <input type="number" min={1} value={draft.executionDays} onChange={(event) => update({ executionDays: Math.max(1, Number(event.target.value) || 1) })} className={inputClass} />
                  </Field>
                  <Field label="Garantia da instalação (meses)">
                    <input type="number" min={1} value={draft.warrantyMonths} onChange={(event) => update({ warrantyMonths: Math.max(1, Number(event.target.value) || 1) })} className={inputClass} />
                  </Field>
                </>
              )}
              <Field label="Foro (cidade/UF)" hint="Comarca para resolver disputas; também aparece no local da assinatura.">
                <input value={draft.forum} onChange={(event) => update({ forum: event.target.value })} placeholder="Campinas/SP" className={inputClass} />
              </Field>
            </div>
          </Panel>

          <Panel
            title="Cláusulas"
            description="Cada parágrafo (separado por linha em branco) vira uma cláusula numerada. As variáveis entre chaves são preenchidas automaticamente."
            actions={
              <button type="button" onClick={restoreClauses} className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50">
                <RotateCcw className="size-3.5" aria-hidden="true" /> Restaurar modelo
              </button>
            }
          >
            <details className="mb-4 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-600">
              <summary className="cursor-pointer font-semibold text-slate-700">Variáveis disponíveis</summary>
              <ul className="mt-3 grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
                {CONTRACT_VARIABLES.map((variable) => (
                  <li key={variable.token}>
                    <code className="rounded bg-white px-1.5 py-0.5 text-night-900 ring-1 ring-slate-200">{variable.token}</code> {variable.description}
                  </li>
                ))}
              </ul>
            </details>

            <ol className="space-y-3">
              {draft.clauses.map((clause, index) => (
                <li key={clause.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center gap-2">
                    <input aria-label="Título da seção" value={clause.title} onChange={(event) => updateClause(clause.id, { title: event.target.value.toUpperCase() })} className={cn(inputClass, "font-semibold")} />
                    <button type="button" onClick={() => moveClause(index, -1)} disabled={index === 0} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label="Mover para cima">
                      <ArrowUp className="size-4" />
                    </button>
                    <button type="button" onClick={() => moveClause(index, 1)} disabled={index === draft.clauses.length - 1} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label="Mover para baixo">
                      <ArrowDown className="size-4" />
                    </button>
                    <button type="button" onClick={() => update({ clauses: draft.clauses.filter((item) => item.id !== clause.id) })} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50" aria-label="Remover seção">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <textarea
                    aria-label={`Texto da seção ${clause.title}`}
                    rows={Math.min(10, Math.max(3, Math.ceil(clause.body.length / 90)))}
                    value={clause.body}
                    onChange={(event) => updateClause(clause.id, { body: event.target.value })}
                    className={cn(textareaClass, "mt-2")}
                  />
                </li>
              ))}
            </ol>
            <button
              type="button"
              onClick={() => update({ clauses: [...draft.clauses, { id: generateId("cl"), title: "NOVA SEÇÃO", body: "" }] })}
              className="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50"
            >
              <Plus className="size-4" aria-hidden="true" /> Adicionar seção
            </button>
          </Panel>
        </div>

        {/* Pré-visualização ao vivo (telas largas) */}
        <aside className="sticky top-6 hidden 2xl:block" aria-label="Pré-visualização">
          <p className="mb-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">Pré-visualização</p>
          <div className="max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-lg">
            <div style={{ zoom: 0.6 }}>
              <ContractDocument contract={draft} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
