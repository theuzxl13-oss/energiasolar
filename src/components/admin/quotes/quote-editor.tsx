"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Eye, Plus, Save, Trash2, UserRound } from "lucide-react";
import { useQuotes } from "@/hooks/use-quotes";
import { useDemoLeads } from "@/hooks/use-demo-leads";
import { SERVICE_LABELS } from "@/lib/labels";
import {
  QUOTE_STATUSES,
  QUOTE_STATUS_LABELS,
  QUOTE_UNITS,
  currencyToWords,
  emptyQuote,
  lineTotal,
  quoteTotals,
  validityText,
  type Quote,
  type QuoteItem,
} from "@/lib/quotes";
import { cn, formatCurrency, generateId, maskPhone } from "@/lib/utils";
import { AdminPageHeader, Panel } from "../ui";
import { Field, inputClass } from "../form-fields";

/** Editor de orçamento. Sem `quoteId` cria um novo (opcionalmente a partir de um lead via `?lead=`). */
export function QuoteEditor({ quoteId }: { quoteId?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const { quotes, ready, saveQuote, getNextNumber } = useQuotes();
  const { leads } = useDemoLeads();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [leadPicker, setLeadPicker] = useState("");

  const leadParam = params.get("lead");

  // Carrega o orçamento (edição) ou cria um em branco (novo).
  useEffect(() => {
    if (!ready || quote) return;
    if (quoteId) {
      const found = quotes.find((item) => item.id === quoteId);
      if (found) setQuote(structuredClone(found));
      return;
    }
    setQuote(emptyQuote(generateId("quote"), getNextNumber()));
  }, [ready, quote, quoteId, quotes, getNextNumber]);

  // Pré-preenche com um lead quando vier ?lead=ID.
  useEffect(() => {
    if (!quote || quoteId || !leadParam || quote.leadId) return;
    const lead = leads.find((item) => item.id === leadParam);
    if (lead) applyLead(lead.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quote, leads, leadParam, quoteId]);

  const totals = useMemo(() => (quote ? quoteTotals(quote) : { subtotal: 0, discount: 0, total: 0 }), [quote]);

  if (!ready || !quote) {
    return <p className="text-sm text-slate-500">{ready && quoteId ? "Orçamento não encontrado." : "Carregando…"}</p>;
  }

  const update = (patch: Partial<Quote>) => setQuote((current) => (current ? { ...current, ...patch } : current));
  const updateClient = (patch: Partial<Quote["client"]>) => setQuote((current) => (current ? { ...current, client: { ...current.client, ...patch } } : current));
  const updateHighlights = (patch: Partial<Quote["highlights"]>) =>
    setQuote((current) => (current ? { ...current, highlights: { ...current.highlights, ...patch } } : current));
  const updateConditions = (patch: Partial<Quote["conditions"]>) =>
    setQuote((current) => (current ? { ...current, conditions: { ...current.conditions, ...patch } } : current));
  const updateItem = (id: string, patch: Partial<QuoteItem>) =>
    setQuote((current) => (current ? { ...current, items: current.items.map((item) => (item.id === id ? { ...item, ...patch } : item)) } : current));

  function setDates(issueDate: string, validUntil: string) {
    setQuote((current) =>
      current ? { ...current, issueDate, validUntil, conditions: { ...current.conditions, validity: validityText(issueDate, validUntil) } } : current,
    );
  }

  function addItem() {
    setQuote((current) =>
      current ? { ...current, items: [...current.items, { id: generateId("item"), description: "", quantity: 1, unit: "un", unitPrice: 0 }] } : current,
    );
  }

  function removeItem(id: string) {
    setQuote((current) => (current && current.items.length > 1 ? { ...current, items: current.items.filter((item) => item.id !== id) } : current));
  }

  function applyLead(leadId: string) {
    const lead = leads.find((item) => item.id === leadId);
    if (!lead) return;
    const place = `${lead.city}/${lead.state}`;
    setQuote((current) =>
      current
        ? {
            ...current,
            leadId: lead.id,
            title: current.title || SERVICE_LABELS[lead.service],
            client: { name: lead.name, phone: lead.phone, email: lead.email, address: place, installationAddress: place },
          }
        : current,
    );
  }

  function validate(target: Quote) {
    const problems: string[] = [];
    if (!target.client.name.trim()) problems.push("Informe o nome do cliente.");
    if (!target.title.trim()) problems.push("Informe o título do orçamento.");
    if (!target.items.some((item) => item.description.trim() && item.quantity > 0)) problems.push("Adicione ao menos um item com descrição e quantidade.");
    if (target.validUntil < target.issueDate) problems.push("A validade deve ser posterior à data de emissão.");
    return problems;
  }

  function save(thenView: boolean) {
    if (!quote) return;
    const cleaned: Quote = { ...quote, isDemo: false, items: quote.items.filter((item) => item.description.trim() || item.unitPrice > 0) };
    const problems = validate(cleaned);
    setErrors(problems);
    if (problems.length) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const saved = saveQuote(cleaned);
    setQuote(saved);
    setSavedAt(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
    if (thenView) router.push(`/admin/orcamentos/visualizar?id=${encodeURIComponent(saved.id)}`);
    else if (!quoteId) router.replace(`/admin/orcamentos/editar?id=${encodeURIComponent(saved.id)}`);
  }

  return (
    <div className="space-y-6 pb-24">
      <Link href="/admin/orcamentos" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-night-900">
        <ArrowLeft className="size-4" aria-hidden="true" /> Voltar para orçamentos
      </Link>
      <AdminPageHeader
        title={quoteId ? `Editar orçamento ${quote.number}` : "Novo orçamento"}
        description="Preencha as informações. Totais e valor por extenso são calculados automaticamente."
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
          {/* Identificação */}
          <Panel title="Identificação">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Nº do orçamento" hint="Gerado automaticamente">
                <input className={inputClass} value={quote.number} onChange={(event) => update({ number: event.target.value })} />
              </Field>
              <Field label="Emissão">
                <input type="date" className={inputClass} value={quote.issueDate} onChange={(event) => setDates(event.target.value, quote.validUntil)} />
              </Field>
              <Field label="Validade">
                <input type="date" className={inputClass} value={quote.validUntil} onChange={(event) => setDates(quote.issueDate, event.target.value)} />
              </Field>
              <Field label="Status">
                <select className={inputClass} value={quote.status} onChange={(event) => update({ status: event.target.value as Quote["status"] })}>
                  {QUOTE_STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {QUOTE_STATUS_LABELS[value]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Título do orçamento" className="sm:col-span-2 lg:col-span-4">
                <input
                  className={inputClass}
                  placeholder="Ex.: Sistema solar residencial 6,6 kWp"
                  value={quote.title}
                  onChange={(event) => update({ title: event.target.value })}
                />
              </Field>
            </div>
          </Panel>

          {/* Cliente */}
          <Panel
            title="Cliente"
            actions={
              <div className="flex items-center gap-2">
                <UserRound className="size-4 text-slate-400" aria-hidden="true" />
                <select
                  aria-label="Preencher com dados de um lead"
                  className="h-9 max-w-56 rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none focus:border-brand-500"
                  value={leadPicker}
                  onChange={(event) => {
                    setLeadPicker(event.target.value);
                    if (event.target.value) applyLead(event.target.value);
                  }}
                >
                  <option value="">Preencher com um lead…</option>
                  {leads.slice(0, 80).map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.name} — {lead.city}/{lead.state}
                    </option>
                  ))}
                </select>
              </div>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome do cliente" className="sm:col-span-2">
                <input className={inputClass} value={quote.client.name} onChange={(event) => updateClient({ name: event.target.value })} />
              </Field>
              <Field label="Telefone / WhatsApp">
                <input
                  className={inputClass}
                  inputMode="tel"
                  placeholder="(00) 00000-0000"
                  value={quote.client.phone}
                  onChange={(event) => updateClient({ phone: maskPhone(event.target.value) })}
                />
              </Field>
              <Field label="E-mail">
                <input type="email" className={inputClass} value={quote.client.email} onChange={(event) => updateClient({ email: event.target.value })} />
              </Field>
              <Field label="Endereço" className="sm:col-span-2">
                <input className={inputClass} placeholder="Rua, número — bairro, cidade/UF" value={quote.client.address} onChange={(event) => updateClient({ address: event.target.value })} />
              </Field>
              <Field label="Local da instalação" className="sm:col-span-2">
                <div className="flex gap-2">
                  <input
                    className={inputClass}
                    value={quote.client.installationAddress}
                    onChange={(event) => updateClient({ installationAddress: event.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => updateClient({ installationAddress: quote.client.address })}
                    className="shrink-0 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Igual ao endereço
                  </button>
                </div>
              </Field>
            </div>
          </Panel>

          {/* Apresentação e destaques */}
          <Panel title="Apresentação">
            <textarea className={cn(inputClass, "min-h-28")} value={quote.presentation} onChange={(event) => update({ presentation: event.target.value })} />
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Field label="Potência do sistema">
                <input className={inputClass} placeholder="Ex.: 6,6 kWp" value={quote.highlights.power} onChange={(event) => updateHighlights({ power: event.target.value })} />
              </Field>
              <Field label="Geração estimada">
                <input
                  className={inputClass}
                  placeholder="Ex.: ≈ 820 kWh/mês"
                  value={quote.highlights.generation}
                  onChange={(event) => updateHighlights({ generation: event.target.value })}
                />
              </Field>
              <Field label="Economia estimada">
                <input className={inputClass} placeholder="Ex.: ≈ R$ 690/mês" value={quote.highlights.savings} onChange={(event) => updateHighlights({ savings: event.target.value })} />
              </Field>
            </div>
            <p className="mt-2 text-xs text-slate-400">Os destaques são opcionais — campos vazios não aparecem no PDF.</p>
          </Panel>

          {/* Itens */}
          <Panel title="Itens do orçamento">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="text-left text-xs tracking-wide text-slate-500 uppercase">
                    <th className="w-8 pb-2 font-semibold">#</th>
                    <th className="pb-2 font-semibold">Descrição</th>
                    <th className="w-20 pb-2 font-semibold">Qtd.</th>
                    <th className="w-24 pb-2 font-semibold">Un.</th>
                    <th className="w-36 pb-2 font-semibold">Valor unit. (R$)</th>
                    <th className="w-32 pb-2 text-right font-semibold">Total</th>
                    <th className="w-10 pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {quote.items.map((item, index) => (
                    <tr key={item.id} className="border-t border-slate-100 align-top">
                      <td className="py-2 pr-2 pt-4 text-slate-400">{index + 1}</td>
                      <td className="py-2 pr-2">
                        <input
                          className={inputClass}
                          placeholder="Ex.: Módulo fotovoltaico 550 W"
                          aria-label={`Descrição do item ${index + 1}`}
                          value={item.description}
                          onChange={(event) => updateItem(item.id, { description: event.target.value })}
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="number"
                          min={0}
                          step="any"
                          className={inputClass}
                          aria-label={`Quantidade do item ${index + 1}`}
                          value={item.quantity}
                          onChange={(event) => updateItem(item.id, { quantity: Number(event.target.value) })}
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          list="quote-units"
                          className={inputClass}
                          aria-label={`Unidade do item ${index + 1}`}
                          value={item.unit}
                          onChange={(event) => updateItem(item.id, { unit: event.target.value })}
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          className={inputClass}
                          aria-label={`Valor unitário do item ${index + 1}`}
                          value={item.unitPrice}
                          onChange={(event) => updateItem(item.id, { unitPrice: Number(event.target.value) })}
                        />
                      </td>
                      <td className="py-2 pt-4 pr-2 text-right font-semibold whitespace-nowrap text-night-900">{formatCurrency(lineTotal(item), true)}</td>
                      <td className="py-2">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          disabled={quote.items.length === 1}
                          className="rounded-lg p-2.5 text-rose-500 hover:bg-rose-50 disabled:opacity-30"
                          aria-label={`Remover item ${index + 1}`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <datalist id="quote-units">
                {QUOTE_UNITS.map((unit) => (
                  <option key={unit} value={unit} />
                ))}
              </datalist>
            </div>
            <button
              type="button"
              onClick={addItem}
              className="mt-3 inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:border-brand-400 hover:text-brand-700"
            >
              <Plus className="size-4" aria-hidden="true" /> Adicionar item
            </button>
          </Panel>

          {/* Condições comerciais */}
          <Panel title="Condições comerciais" description="Textos padrão já preenchidos — edite conforme a proposta.">
            <div className="grid gap-4">
              <Field label="Forma de pagamento">
                <textarea className={cn(inputClass, "min-h-20")} value={quote.conditions.payment} onChange={(event) => updateConditions({ payment: event.target.value })} />
              </Field>
              <Field label="Prazo de execução">
                <input className={inputClass} value={quote.conditions.deadline} onChange={(event) => updateConditions({ deadline: event.target.value })} />
              </Field>
              <Field label="Validade da proposta" hint="Atualizada automaticamente ao mudar as datas.">
                <input className={inputClass} value={quote.conditions.validity} onChange={(event) => updateConditions({ validity: event.target.value })} />
              </Field>
              <Field label="Garantia">
                <textarea className={cn(inputClass, "min-h-20")} value={quote.conditions.warranty} onChange={(event) => updateConditions({ warranty: event.target.value })} />
              </Field>
              <Field label="Observações">
                <textarea className={cn(inputClass, "min-h-20")} value={quote.conditions.notes} onChange={(event) => updateConditions({ notes: event.target.value })} />
              </Field>
            </div>
          </Panel>
        </div>

        {/* Resumo (fixo ao rolar) */}
        <aside className="xl:sticky xl:top-6 xl:self-start">
          <Panel title="Resumo">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Subtotal</dt>
                <dd className="font-semibold text-night-900">{formatCurrency(totals.subtotal, true)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">Desconto (R$)</dt>
                <dd>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    aria-label="Desconto em reais"
                    className="h-9 w-32 rounded-lg border border-slate-200 px-2 text-right text-sm outline-none focus:border-brand-500"
                    value={quote.discount}
                    onChange={(event) => update({ discount: Number(event.target.value) })}
                  />
                </dd>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-3">
                <dt className="font-semibold text-night-900">Valor total</dt>
                <dd className="font-display text-xl font-bold text-brand-700">{formatCurrency(totals.total, true)}</dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-slate-500">({currencyToWords(totals.total)})</p>

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
