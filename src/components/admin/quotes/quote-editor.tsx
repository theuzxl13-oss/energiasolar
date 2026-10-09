"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, Eye, Plus, Save, Trash2 } from "lucide-react";
import { useDemoQuotes } from "@/hooks/use-demo-quotes";
import { useDemoLeads } from "@/hooks/use-demo-leads";
import { BRAZILIAN_STATES } from "@/lib/brazil";
import { createQuote, createQuoteFromLead, itemTotal, maskDocument, QUOTE_STATUS_LABELS, quoteTotals, serviceDefaults } from "@/lib/quotes";
import { SERVICE_LABELS } from "@/lib/labels";
import { cn, formatCurrency, formatNumber, generateId, maskPhone, parseCurrencyInput } from "@/lib/utils";
import { QUOTE_STATUSES, SERVICE_TYPES, type Quote, type QuoteItem, type ServiceType } from "@/types";
import { AdminPageHeader, Panel } from "../ui";
import { QuoteDocument } from "./quote-document";
import { quoteViewHref } from "./quotes-list";

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

/**
 * Campo de valor em reais. Mantém o texto digitado enquanto edita e formata
 * ("1.250,00") ao sair do campo.
 */
function MoneyInput({ value, onChange, className, label }: { value: number; onChange: (value: number) => void; className?: string; label: string }) {
  const format = (amount: number) => (amount ? formatNumber(amount, 2) : "");
  const [text, setText] = useState(format(value));
  return (
    <input
      aria-label={label}
      value={text}
      inputMode="decimal"
      placeholder="0,00"
      onChange={(event) => {
        setText(event.target.value);
        onChange(parseCurrencyInput(event.target.value));
      }}
      onBlur={() => setText(format(value))}
      className={cn(inputClass, "text-right", className)}
    />
  );
}

export function QuoteEditorFromUrl() {
  const params = useSearchParams();
  const id = params.get("id");
  const leadId = params.get("lead");
  const { quotes, ready, saveQuote } = useDemoQuotes();
  const { leads, ready: leadsReady } = useDemoLeads();
  const [initial, setInitial] = useState<Quote | null | undefined>(undefined);

  useEffect(() => {
    if (initial !== undefined || !ready || (leadId && !leadsReady)) return;
    if (id) {
      setInitial(quotes.find((item) => item.id === id) ?? null);
      return;
    }
    const lead = leadId ? leads.find((item) => item.id === leadId) : undefined;
    setInitial(lead ? createQuoteFromLead(quotes, lead) : createQuote(quotes));
  }, [initial, ready, leadsReady, id, leadId, quotes, leads]);

  if (initial === undefined) return <p className="text-sm text-slate-500">Carregando…</p>;
  if (initial === null) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-slate-200">
        <p className="text-slate-600">Orçamento não encontrado.</p>
        <Link href="/admin/orcamentos" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
          <ArrowLeft className="size-4" aria-hidden="true" /> Voltar para orçamentos
        </Link>
      </div>
    );
  }
  return <QuoteEditor key={initial.id} initial={initial} isNew={!id} onSave={saveQuote} />;
}

/** Os campos dependentes do serviço ainda são os do modelo (sem edição do usuário)? */
function isUntouchedTemplate(quote: Quote) {
  const defaults = serviceDefaults(quote.service);
  const strip = (items: QuoteItem[]) => items.map(({ description, quantity, unit, unitPrice }) => [description, quantity, unit, unitPrice].join("|")).join("\n");
  return (
    quote.description === defaults.description &&
    quote.warranty === defaults.warranty &&
    strip(quote.items) === strip(defaults.items) &&
    quote.highlights.every((item) => !item.value)
  );
}

function QuoteEditor({ initial, isNew, onSave }: { initial: Quote; isNew: boolean; onSave: (quote: Quote) => void }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Quote>(initial);
  const [saved, setSaved] = useState(false);
  // Remonta os campos de valor quando a lista de itens é trocada pelo modelo de outro serviço.
  const [itemsVersion, setItemsVersion] = useState(0);

  const update = (patch: Partial<Quote>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setSaved(false);
  };
  const updateClient = (patch: Partial<Quote["client"]>) => update({ client: { ...draft.client, ...patch } });
  const updateItem = (id: string, patch: Partial<QuoteItem>) => update({ items: draft.items.map((item) => (item.id === id ? { ...item, ...patch } : item)) });

  function changeService(service: ServiceType) {
    if (isUntouchedTemplate(draft)) {
      update({ service, ...serviceDefaults(service) });
      setItemsVersion((version) => version + 1);
    } else {
      update({ service });
    }
  }

  function moveItem(index: number, direction: -1 | 1) {
    const items = [...draft.items];
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target]!, items[index]!];
    update({ items });
  }

  function save(thenView: boolean) {
    onSave(draft);
    setSaved(true);
    if (thenView) router.push(quoteViewHref(draft.id));
    else if (isNew) router.replace(`/admin/orcamentos/editar?id=${encodeURIComponent(draft.id)}`);
  }

  const { subtotal, discount, total } = quoteTotals(draft);

  return (
    <div className="space-y-6">
      <Link href="/admin/orcamentos" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-night-900">
        <ArrowLeft className="size-4" aria-hidden="true" /> Voltar para orçamentos
      </Link>
      <AdminPageHeader
        title={isNew ? "Novo orçamento" : `Orçamento nº ${draft.number}`}
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

      <div className="grid items-start gap-6 2xl:grid-cols-[minmax(0,1fr)_490px]">
        <div className="space-y-6">
          <Panel title="Dados do orçamento">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Título" hint="Aparece em destaque no documento. Ex.: Sistema solar residencial 6,6 kWp" className="sm:col-span-2">
                <input value={draft.title} onChange={(event) => update({ title: event.target.value })} className={inputClass} />
              </Field>
              <Field label="Serviço" hint="Trocar o serviço carrega itens e textos de exemplo, se você ainda não os editou.">
                <select value={draft.service} onChange={(event) => changeService(event.target.value as ServiceType)} className={inputClass}>
                  {SERVICE_TYPES.map((item) => (
                    <option key={item} value={item}>{SERVICE_LABELS[item]}</option>
                  ))}
                </select>
              </Field>
              <Field label="Status">
                <select value={draft.status} onChange={(event) => update({ status: event.target.value as Quote["status"] })} className={inputClass}>
                  {QUOTE_STATUSES.map((item) => (
                    <option key={item} value={item}>{QUOTE_STATUS_LABELS[item]}</option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-3 gap-3 sm:col-span-2">
                <Field label="Número">
                  <input value={draft.number} onChange={(event) => update({ number: event.target.value })} className={inputClass} />
                </Field>
                <Field label="Emissão">
                  <input type="date" value={draft.issueDate} onChange={(event) => update({ issueDate: event.target.value || draft.issueDate })} className={inputClass} />
                </Field>
                <Field label="Validade (dias)">
                  <input type="number" min={1} value={draft.validityDays} onChange={(event) => update({ validityDays: Math.max(1, Number(event.target.value) || 1) })} className={inputClass} />
                </Field>
              </div>
            </div>
          </Panel>

          <Panel title="Cliente">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome / razão social">
                <input value={draft.client.name} onChange={(event) => updateClient({ name: event.target.value })} className={inputClass} />
              </Field>
              <Field label="CPF / CNPJ (opcional)">
                <input value={draft.client.document} inputMode="numeric" onChange={(event) => updateClient({ document: maskDocument(event.target.value) })} className={inputClass} />
              </Field>
              <Field label="Telefone / WhatsApp">
                <input value={draft.client.phone} inputMode="tel" onChange={(event) => updateClient({ phone: maskPhone(event.target.value) })} className={inputClass} />
              </Field>
              <Field label="E-mail">
                <input type="email" value={draft.client.email} onChange={(event) => updateClient({ email: event.target.value })} className={inputClass} />
              </Field>
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
              <Field label="Local da instalação" hint="Deixe vazio se for o mesmo endereço do cliente.">
                <input value={draft.installAddress} onChange={(event) => update({ installAddress: event.target.value })} className={inputClass} />
              </Field>
            </div>
          </Panel>

          <Panel title="Apresentação da solução">
            <div className="grid gap-4">
              <Field label="Texto de apresentação" hint="Separe parágrafos com uma linha em branco.">
                <textarea rows={4} value={draft.description} onChange={(event) => update({ description: event.target.value })} className={textareaClass} />
              </Field>
              <div>
                <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Destaques</p>
                <p className="mt-0.5 text-xs text-slate-400">Números em evidência no topo do orçamento. Os que ficarem sem valor não aparecem.</p>
                <div className="mt-2 grid gap-2">
                  {draft.highlights.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        aria-label="Nome do destaque"
                        value={item.label}
                        onChange={(event) => update({ highlights: draft.highlights.map((entry, i) => (i === index ? { ...entry, label: event.target.value } : entry)) })}
                        placeholder="Ex.: Geração estimada"
                        className={inputClass}
                      />
                      <input
                        aria-label={`Valor de ${item.label}`}
                        value={item.value}
                        onChange={(event) => update({ highlights: draft.highlights.map((entry, i) => (i === index ? { ...entry, value: event.target.value } : entry)) })}
                        placeholder="Ex.: 820 kWh/mês"
                        className={inputClass}
                      />
                      <button type="button" onClick={() => update({ highlights: draft.highlights.filter((_, i) => i !== index) })} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50" aria-label="Remover destaque">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
                {draft.highlights.length < 4 && (
                  <button type="button" onClick={() => update({ highlights: [...draft.highlights, { label: "", value: "" }] })} className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800">
                    <Plus className="size-3.5" aria-hidden="true" /> Adicionar destaque
                  </button>
                )}
              </div>
            </div>
          </Panel>

          <Panel title="Itens" description="Equipamentos, materiais e serviços. O total é calculado automaticamente.">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="text-left text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  <tr>
                    <th className="pb-2">Descrição</th>
                    <th className="w-20 pb-2 pl-2">Qtd.</th>
                    <th className="w-20 pb-2 pl-2">Un.</th>
                    <th className="w-32 pb-2 pl-2">Valor unit.</th>
                    <th className="w-28 pb-2 pl-2 text-right">Total</th>
                    <th className="w-28 pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {draft.items.map((item, index) => (
                    <tr key={`${item.id}-${itemsVersion}`} className="align-middle">
                      <td className="py-1">
                        <input aria-label="Descrição" value={item.description} onChange={(event) => updateItem(item.id, { description: event.target.value })} className={inputClass} />
                      </td>
                      <td className="py-1 pl-2">
                        <input
                          aria-label="Quantidade"
                          type="number"
                          min={0}
                          step="any"
                          value={item.quantity}
                          onChange={(event) => updateItem(item.id, { quantity: Math.max(0, Number(event.target.value) || 0) })}
                          className={cn(inputClass, "px-2")}
                        />
                      </td>
                      <td className="py-1 pl-2">
                        <input aria-label="Unidade" value={item.unit} onChange={(event) => updateItem(item.id, { unit: event.target.value })} className={cn(inputClass, "px-2")} />
                      </td>
                      <td className="py-1 pl-2">
                        <MoneyInput label="Valor unitário" value={item.unitPrice} onChange={(unitPrice) => updateItem(item.id, { unitPrice })} />
                      </td>
                      <td className="py-1 pl-2 text-right font-medium whitespace-nowrap text-night-900">{formatCurrency(itemTotal(item), true)}</td>
                      <td className="py-1 pl-1">
                        <div className="flex justify-end">
                          <button type="button" onClick={() => moveItem(index, -1)} disabled={index === 0} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label="Mover para cima">
                            <ArrowUp className="size-4" />
                          </button>
                          <button type="button" onClick={() => moveItem(index, 1)} disabled={index === draft.items.length - 1} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label="Mover para baixo">
                            <ArrowDown className="size-4" />
                          </button>
                          <button type="button" onClick={() => update({ items: draft.items.filter((entry) => entry.id !== item.id) })} className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50" aria-label="Remover item">
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              onClick={() => update({ items: [...draft.items, { id: generateId("it"), description: "", quantity: 1, unit: "un", unitPrice: 0 }] })}
              className="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50"
            >
              <Plus className="size-4" aria-hidden="true" /> Adicionar item
            </button>

            <dl className="mt-5 ml-auto grid max-w-xs gap-2 border-t border-slate-200 pt-4 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Subtotal</dt>
                <dd className="font-medium text-night-900">{formatCurrency(subtotal, true)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-500">Desconto (R$)</dt>
                <dd className="w-36">
                  <MoneyInput label="Desconto" value={draft.discount} onChange={(value) => update({ discount: value })} className="h-9" />
                </dd>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-night-950 px-3 py-2.5 text-white">
                <dt className="text-xs font-semibold tracking-wider uppercase">Total</dt>
                <dd className="text-lg font-bold">{formatCurrency(total, true)}</dd>
              </div>
              {discount < draft.discount && <p className="text-xs text-amber-700">O desconto foi limitado ao subtotal.</p>}
            </dl>
          </Panel>

          <Panel title="Condições comerciais">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Forma de pagamento" className="sm:col-span-2">
                <textarea rows={2} value={draft.paymentTerms} onChange={(event) => update({ paymentTerms: event.target.value })} className={textareaClass} />
              </Field>
              <Field label="Prazo de execução (dias)" hint="Use 0 para não exibir.">
                <input type="number" min={0} value={draft.executionDays} onChange={(event) => update({ executionDays: Math.max(0, Number(event.target.value) || 0) })} className={inputClass} />
              </Field>
              <Field label="Garantia" className="sm:col-span-2">
                <textarea rows={2} value={draft.warranty} onChange={(event) => update({ warranty: event.target.value })} className={textareaClass} />
              </Field>
              <Field label="Observações" hint="Opcional. Ex.: itens não inclusos, premissas do dimensionamento." className="sm:col-span-2">
                <textarea rows={3} value={draft.notes} onChange={(event) => update({ notes: event.target.value })} className={textareaClass} />
              </Field>
            </div>
          </Panel>
        </div>

        {/* Pré-visualização ao vivo (telas largas) */}
        <aside className="sticky top-6 hidden 2xl:block" aria-label="Pré-visualização">
          <p className="mb-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">Pré-visualização</p>
          <div className="max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-lg">
            <div style={{ zoom: 0.6 }}>
              <QuoteDocument quote={draft} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
