"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, Eye, FileText, ListPlus, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { siteConfig } from "@/config/site";
import { useContracts } from "@/hooks/use-contracts";
import { useQuotes } from "@/hooks/use-quotes";
import {
  CONTRACT_SERVICES,
  CONTRACT_SERVICE_LABELS,
  CONTRACT_STATUSES,
  CONTRACT_STATUS_LABELS,
  CONTRACT_TOKENS,
  DEFAULT_CONTRACT_TYPES,
  DEFAULT_OBJECTS,
  applyQuoteToContract,
  companyAddress,
  defaultContractSections,
  emptyContract,
  type Contract,
  type ContractService,
} from "@/lib/contracts";
import { currencyToWords, quoteTotals } from "@/lib/quotes";
import { cn, formatCurrency, generateId, maskPhone, onlyDigits } from "@/lib/utils";
import { AdminPageHeader, Panel } from "../ui";
import { Field, inputClass } from "../form-fields";

/** Máscara de CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00). */
function maskDocument(value: string, type: "CPF" | "CNPJ") {
  const digits = onlyDigits(value).slice(0, type === "CPF" ? 11 : 14);
  if (type === "CPF") return digits.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

/** Editor de contrato. Sem `contractId` cria um novo (opcionalmente a partir de um orçamento via `?orcamento=`). */
export function ContractEditor({ contractId }: { contractId?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const { contracts, ready, saveContract, getNextNumber } = useContracts();
  const { quotes } = useQuotes();
  const [contract, setContract] = useState<Contract | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const quoteParam = params.get("orcamento");

  useEffect(() => {
    if (!ready || contract) return;
    if (contractId) {
      const found = contracts.find((item) => item.id === contractId);
      if (found) setContract(structuredClone(found));
      return;
    }
    setContract(emptyContract(generateId("contract"), getNextNumber()));
  }, [ready, contract, contractId, contracts, getNextNumber]);

  // Pré-preenche com um orçamento quando vier ?orcamento=ID.
  useEffect(() => {
    if (!contract || contractId || !quoteParam || contract.quoteId) return;
    const quote = quotes.find((item) => item.id === quoteParam);
    if (quote) setContract((current) => (current ? applyQuoteToContract(current, quote) : current));
  }, [contract, quotes, quoteParam, contractId]);

  if (!ready || !contract) {
    return <p className="text-sm text-slate-500">{ready && contractId ? "Contrato não encontrado." : "Carregando…"}</p>;
  }

  const update = (patch: Partial<Contract>) => setContract((current) => (current ? { ...current, ...patch } : current));
  const updateClient = (patch: Partial<Contract["client"]>) => setContract((current) => (current ? { ...current, client: { ...current.client, ...patch } } : current));
  const updateSections = (fn: (sections: Contract["sections"]) => Contract["sections"]) =>
    setContract((current) => (current ? { ...current, sections: fn(current.sections) } : current));

  function changeService(service: ContractService) {
    setContract((current) => {
      if (!current) return current;
      // Atualiza objeto e título do documento apenas se ainda estiverem no texto padrão anterior.
      const object = current.object === DEFAULT_OBJECTS[current.service] ? DEFAULT_OBJECTS[service] : current.object;
      const contractType = current.contractType === DEFAULT_CONTRACT_TYPES[current.service] ? DEFAULT_CONTRACT_TYPES[service] : current.contractType;
      return { ...current, service, object, contractType };
    });
  }

  function importQuote(quoteId: string) {
    const quote = quotes.find((item) => item.id === quoteId);
    if (quote) setContract((current) => (current ? applyQuoteToContract(current, quote) : current));
  }

  function restoreClauses() {
    if (!contract) return;
    if (window.confirm(`Substituir todas as cláusulas pelo modelo padrão de "${CONTRACT_SERVICE_LABELS[contract.service]}"? As edições feitas nas cláusulas serão perdidas.`)) {
      updateSections(() => defaultContractSections(contract.service));
    }
  }

  function moveSection(index: number, direction: -1 | 1) {
    updateSections((sections) => {
      const target = index + direction;
      if (target < 0 || target >= sections.length) return sections;
      const next = [...sections];
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });
  }

  function validate(target: Contract) {
    const problems: string[] = [];
    if (!target.title.trim()) problems.push("Informe o título do contrato.");
    if (!target.client.name.trim()) problems.push("Informe o nome do contratante.");
    if (!target.client.address.trim()) problems.push("Informe o endereço do contratante.");
    if (!(target.total > 0)) problems.push("Informe o valor total do contrato.");
    if (!target.sections.some((section) => section.clauses.some((clause) => clause.trim()))) problems.push("O contrato precisa ter ao menos uma cláusula.");
    return problems;
  }

  function save(thenView: boolean) {
    if (!contract) return;
    const cleaned: Contract = {
      ...contract,
      isDemo: false,
      sections: contract.sections
        .map((section) => ({ ...section, clauses: section.clauses.filter((clause) => clause.trim()) }))
        .filter((section) => section.title.trim() || section.clauses.length),
    };
    const problems = validate(cleaned);
    setErrors(problems);
    if (problems.length) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const saved = saveContract(cleaned);
    setContract(saved);
    setSavedAt(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
    if (thenView) router.push(`/admin/contratos/visualizar?id=${encodeURIComponent(saved.id)}`);
    else if (!contractId) router.replace(`/admin/contratos/editar?id=${encodeURIComponent(saved.id)}`);
  }

  let clauseCounter = 0;

  return (
    <div className="space-y-6 pb-24">
      <Link href="/admin/contratos" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-night-900">
        <ArrowLeft className="size-4" aria-hidden="true" /> Voltar para contratos
      </Link>
      <AdminPageHeader
        title={contractId ? `Editar contrato ${contract.number}` : "Novo contrato"}
        description="Os dados preenchidos entram automaticamente nas cláusulas. As cláusulas são numeradas sozinhas."
      />

      {errors.length > 0 && (
        <div role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700 ring-1 ring-rose-200">
          <p className="font-semibold">Corrija antes de salvar:</p>
          <ul className="mt-1 list-disc pl-5">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          {/* Importar orçamento */}
          <Panel title="Gerar a partir de um orçamento" description="Puxa cliente, título, valor, itens (escopo) e forma de pagamento.">
            <div className="flex items-center gap-2">
              <FileText className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
              <select className={inputClass} value={contract.quoteId ?? ""} onChange={(event) => event.target.value && importQuote(event.target.value)} aria-label="Orçamento de origem">
                <option value="">Selecione um orçamento…</option>
                {quotes.map((quote) => (
                  <option key={quote.id} value={quote.id}>
                    {quote.number} — {quote.client.name || "Sem cliente"} — {formatCurrency(quoteTotals(quote).total, true)}
                  </option>
                ))}
              </select>
            </div>
          </Panel>

          {/* Identificação */}
          <Panel title="Identificação">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Nº do contrato" hint="Gerado automaticamente">
                <input className={inputClass} value={contract.number} onChange={(event) => update({ number: event.target.value })} />
              </Field>
              <Field label="Serviço">
                <select className={inputClass} value={contract.service} onChange={(event) => changeService(event.target.value as ContractService)}>
                  {CONTRACT_SERVICES.map((value) => (
                    <option key={value} value={value}>
                      {CONTRACT_SERVICE_LABELS[value]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Status" className="lg:col-span-2">
                <select className={inputClass} value={contract.status} onChange={(event) => update({ status: event.target.value as Contract["status"] })}>
                  {CONTRACT_STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {CONTRACT_STATUS_LABELS[value]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Título" className="sm:col-span-2">
                <input
                  className={inputClass}
                  placeholder="Ex.: Sistema solar residencial 6,6 kWp"
                  value={contract.title}
                  onChange={(event) => update({ title: event.target.value })}
                />
              </Field>
              <Field label="Tipo de contrato (título do documento)" className="sm:col-span-2">
                <input className={inputClass} value={contract.contractType} onChange={(event) => update({ contractType: event.target.value })} />
              </Field>
            </div>
          </Panel>

          {/* Datas e prazos */}
          <Panel title="Datas, prazo e foro">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Início">
                <input type="date" className={inputClass} value={contract.startDate} onChange={(event) => update({ startDate: event.target.value })} />
              </Field>
              <Field label="Prazo de execução (dias)">
                <input
                  type="number"
                  min={1}
                  className={inputClass}
                  value={contract.executionDays}
                  onChange={(event) => update({ executionDays: Math.max(1, Math.round(Number(event.target.value) || 1)) })}
                />
              </Field>
              <Field label="Foro (comarca)" hint="Ex.: Campinas/SP">
                <input className={inputClass} value={contract.forum} onChange={(event) => update({ forum: event.target.value })} />
              </Field>
              <Field label="Cidade da assinatura">
                <input className={inputClass} value={contract.signingCity} onChange={(event) => update({ signingCity: event.target.value })} />
              </Field>
              <Field label="Data da assinatura">
                <input type="date" className={inputClass} value={contract.signingDate} onChange={(event) => update({ signingDate: event.target.value })} />
              </Field>
            </div>
          </Panel>

          {/* Partes */}
          <Panel title="Contratada" description="Dados da empresa — alterados em src/config/site.ts.">
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-slate-500">Razão social</dt>
                <dd className="text-night-900">{siteConfig.legalName}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">CNPJ</dt>
                <dd className="text-night-900">{siteConfig.cnpj}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-slate-500">Sede</dt>
                <dd className="text-night-900">{companyAddress()}</dd>
              </div>
            </dl>
          </Panel>

          <Panel title="Contratante">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome / razão social" className="sm:col-span-2">
                <input className={inputClass} value={contract.client.name} onChange={(event) => updateClient({ name: event.target.value })} />
              </Field>
              <Field label="Tipo de documento">
                <select
                  className={inputClass}
                  value={contract.client.docType}
                  onChange={(event) => {
                    const docType = event.target.value as "CPF" | "CNPJ";
                    updateClient({ docType, document: maskDocument(contract.client.document, docType) });
                  }}
                >
                  <option value="CPF">CPF (pessoa física)</option>
                  <option value="CNPJ">CNPJ (pessoa jurídica)</option>
                </select>
              </Field>
              <Field label={contract.client.docType}>
                <input
                  className={inputClass}
                  inputMode="numeric"
                  placeholder={contract.client.docType === "CPF" ? "000.000.000-00" : "00.000.000/0000-00"}
                  value={contract.client.document}
                  onChange={(event) => updateClient({ document: maskDocument(event.target.value, contract.client.docType) })}
                />
              </Field>
              {contract.client.docType === "CNPJ" && (
                <Field label="Representante legal" className="sm:col-span-2" hint="Ex.: João da Silva, CPF 000.000.000-00, sócio-administrador">
                  <input className={inputClass} value={contract.client.representative} onChange={(event) => updateClient({ representative: event.target.value })} />
                </Field>
              )}
              <Field label="Endereço" className="sm:col-span-2">
                <input className={inputClass} placeholder="Rua, número — bairro, cidade/UF" value={contract.client.address} onChange={(event) => updateClient({ address: event.target.value })} />
              </Field>
              <Field label="Telefone / WhatsApp">
                <input
                  className={inputClass}
                  inputMode="tel"
                  placeholder="(00) 00000-0000"
                  value={contract.client.phone}
                  onChange={(event) => updateClient({ phone: maskPhone(event.target.value) })}
                />
              </Field>
              <Field label="E-mail">
                <input type="email" className={inputClass} value={contract.client.email} onChange={(event) => updateClient({ email: event.target.value })} />
              </Field>
              <Field label="Local da instalação" className="sm:col-span-2">
                <div className="flex gap-2">
                  <input
                    className={inputClass}
                    value={contract.client.installationAddress}
                    onChange={(event) => updateClient({ installationAddress: event.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => updateClient({ installationAddress: contract.client.address })}
                    className="shrink-0 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Igual ao endereço
                  </button>
                </div>
              </Field>
            </div>
          </Panel>

          {/* Objeto e valores */}
          <Panel title="Objeto, escopo e pagamento">
            <div className="grid gap-4">
              <Field label="Objeto — variável {OBJETO}" hint="Completa a frase “O presente contrato tem por objeto …”">
                <textarea className={cn(inputClass, "min-h-20")} value={contract.object} onChange={(event) => update({ object: event.target.value })} />
              </Field>
              <Field label="Escopo técnico — variável {ESCOPO}" hint="Ex.: sistema fotovoltaico de 6,6 kWp, composto por 12 módulos de 550 W, inversor de 6 kW…">
                <textarea className={cn(inputClass, "min-h-24")} value={contract.scope} onChange={(event) => update({ scope: event.target.value })} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Valor total (R$) — variável {VALOR}">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className={inputClass}
                    value={contract.total}
                    onChange={(event) => update({ total: Number(event.target.value) })}
                  />
                </Field>
                <div className="flex flex-col justify-end pb-2 text-sm text-slate-600">
                  <span className="font-semibold text-night-900">{formatCurrency(contract.total, true)}</span>
                  <span className="text-xs">({currencyToWords(contract.total)})</span>
                </div>
              </div>
              <Field label="Forma de pagamento — variável {PAGAMENTO}">
                <textarea className={cn(inputClass, "min-h-20")} value={contract.payment} onChange={(event) => update({ payment: event.target.value })} />
              </Field>
            </div>
          </Panel>

          {/* Cláusulas */}
          <Panel
            title="Cláusulas"
            description="Edite livremente. Use as variáveis abaixo para inserir os dados do contrato automaticamente."
            actions={
              <button
                type="button"
                onClick={restoreClauses}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              >
                <RotateCcw className="size-3.5" aria-hidden="true" /> Restaurar modelo padrão
              </button>
            }
          >
            <div className="mb-5 flex flex-wrap gap-2">
              {CONTRACT_TOKENS.map(({ token, description }) => (
                <span key={token} title={description} className="rounded-lg bg-brand-50 px-2 py-1 font-mono text-[11px] text-brand-800 ring-1 ring-brand-100">
                  {token} <span className="font-sans text-brand-700/70">· {description}</span>
                </span>
              ))}
            </div>

            <ol className="space-y-5">
              {contract.sections.map((section, sectionIndex) => (
                <li key={section.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2">
                    <input
                      className={cn(inputClass, "font-semibold uppercase")}
                      aria-label={`Título da seção ${sectionIndex + 1}`}
                      value={section.title}
                      onChange={(event) =>
                        updateSections((sections) => sections.map((item) => (item.id === section.id ? { ...item, title: event.target.value } : item)))
                      }
                    />
                    <button type="button" onClick={() => moveSection(sectionIndex, -1)} disabled={sectionIndex === 0} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label="Mover seção para cima">
                      <ArrowUp className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSection(sectionIndex, 1)}
                      disabled={sectionIndex === contract.sections.length - 1}
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                      aria-label="Mover seção para baixo"
                    >
                      <ArrowDown className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => window.confirm(`Remover a seção "${section.title}" e suas cláusulas?`) && updateSections((sections) => sections.filter((item) => item.id !== section.id))}
                      className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"
                      aria-label="Remover seção"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>

                  <div className="mt-3 space-y-3">
                    {section.clauses.map((clause, clauseIndex) => {
                      if (clause.trim()) clauseCounter += 1;
                      const label = clause.trim() ? `Cláusula ${clauseCounter}ª` : "Nova cláusula";
                      return (
                        <div key={`${section.id}-${clauseIndex}`} className="flex gap-2">
                          <div className="flex-1">
                            <p className="mb-1 text-xs font-semibold text-slate-500">{label}</p>
                            <textarea
                              className={cn(inputClass, "min-h-20")}
                              aria-label={label}
                              value={clause}
                              onChange={(event) =>
                                updateSections((sections) =>
                                  sections.map((item) =>
                                    item.id === section.id ? { ...item, clauses: item.clauses.map((text, index) => (index === clauseIndex ? event.target.value : text)) } : item,
                                  ),
                                )
                              }
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              updateSections((sections) =>
                                sections.map((item) => (item.id === section.id ? { ...item, clauses: item.clauses.filter((_, index) => index !== clauseIndex) } : item)),
                              )
                            }
                            className="mt-6 self-start rounded-lg p-2 text-rose-500 hover:bg-rose-50"
                            aria-label={`Remover ${label}`}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => updateSections((sections) => sections.map((item) => (item.id === section.id ? { ...item, clauses: [...item.clauses, ""] } : item)))}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:underline"
                    >
                      <Plus className="size-3.5" aria-hidden="true" /> Adicionar cláusula nesta seção
                    </button>
                  </div>
                </li>
              ))}
            </ol>

            <button
              type="button"
              onClick={() => updateSections((sections) => [...sections, { id: generateId("section"), title: "Nova seção", clauses: [""] }])}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:border-brand-400 hover:text-brand-700"
            >
              <ListPlus className="size-4" aria-hidden="true" /> Adicionar seção
            </button>
          </Panel>

          <Panel title="Assinaturas">
            <label className="flex items-center gap-3 text-sm text-slate-700">
              <input type="checkbox" className="size-4 accent-brand-600" checked={contract.witnesses} onChange={(event) => update({ witnesses: event.target.checked })} />
              Incluir campos para 2 testemunhas
            </label>
          </Panel>
        </div>

        <aside className="xl:sticky xl:top-6 xl:self-start">
          <Panel title="Resumo">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Contratante</dt>
                <dd className="text-right font-semibold text-night-900">{contract.client.name || "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Serviço</dt>
                <dd className="text-night-900">{CONTRACT_SERVICE_LABELS[contract.service]}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Prazo</dt>
                <dd className="text-night-900">{contract.executionDays} dias</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Cláusulas</dt>
                <dd className="text-night-900">{contract.sections.reduce((sum, section) => sum + section.clauses.filter((clause) => clause.trim()).length, 0)}</dd>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-3">
                <dt className="font-semibold text-night-900">Valor total</dt>
                <dd className="font-display text-xl font-bold text-brand-700">{formatCurrency(contract.total, true)}</dd>
              </div>
            </dl>
            <div className="mt-6 grid gap-2">
              <button
                type="button"
                onClick={() => save(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700"
              >
                <Eye className="size-4" aria-hidden="true" /> Salvar e visualizar PDF
              </button>
              <button
                type="button"
                onClick={() => save(false)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
              >
                <Save className="size-4" aria-hidden="true" /> Salvar rascunho
              </button>
              {savedAt && <p className="text-center text-xs text-brand-700">Salvo às {savedAt}</p>}
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
