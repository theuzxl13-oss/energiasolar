"use client";

import { useState } from "react";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { faqItems } from "@/data/faq";
import type { FaqItem } from "@/types";
import { AdminPageHeader, DemoNote } from "./ui";

const CATEGORY_LABELS: Record<FaqItem["category"], string> = {
  solar: "Energia solar",
  carregadores: "Carregadores",
  eletropostos: "Eletropostos",
  geral: "Geral",
};

/** Edição de perguntas frequentes (estado local na demonstração). */
export function FaqManager() {
  const [items, setItems] = useState<FaqItem[]>(faqItems);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<FaqItem | null>(null);

  function startEdit(item: FaqItem) {
    setEditing(item.id);
    setDraft({ ...item });
  }

  function save() {
    if (!draft || !draft.question.trim() || !draft.answer.trim()) return;
    setItems((current) => (current.some((item) => item.id === draft.id) ? current.map((item) => (item.id === draft.id ? draft : item)) : [draft, ...current]));
    setEditing(null);
    setDraft(null);
  }

  function add() {
    const item: FaqItem = { id: `novo-${Date.now()}`, question: "", answer: "", category: "geral" };
    setEditing(item.id);
    setDraft(item);
  }

  const inputClass = "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="FAQ"
        description={`${items.length} perguntas`}
        actions={
          <button type="button" onClick={add} className="inline-flex items-center gap-2 rounded-full bg-night-950 px-4 py-2 text-sm font-semibold text-white hover:bg-night-800">
            <Plus className="size-4" aria-hidden="true" /> Nova pergunta
          </button>
        }
      />
      <DemoNote>As edições ficam apenas nesta sessão. Em produção, serão salvas na tabela <code>faq</code> do Supabase.</DemoNote>

      <ul className="space-y-3">
        {editing && draft && !items.some((item) => item.id === draft.id) && (
          <li className="rounded-2xl bg-white p-5 ring-2 ring-brand-300">
            <Editor draft={draft} setDraft={setDraft} inputClass={inputClass} onSave={save} onCancel={() => setEditing(null)} />
          </li>
        )}
        {items.map((item) => (
          <li key={item.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            {editing === item.id && draft ? (
              <Editor draft={draft} setDraft={setDraft} inputClass={inputClass} onSave={save} onCancel={() => setEditing(null)} />
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold text-brand-700">{CATEGORY_LABELS[item.category]}</span>
                  <h2 className="mt-1 font-semibold text-night-900">{item.question}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{item.answer}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button type="button" onClick={() => startEdit(item)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Editar">
                    <Pencil className="size-4" />
                  </button>
                  <button type="button" onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50" aria-label="Remover">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Editor({
  draft,
  setDraft,
  inputClass,
  onSave,
  onCancel,
}: {
  draft: FaqItem;
  setDraft: (item: FaqItem) => void;
  inputClass: string;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="grid gap-3">
      <select aria-label="Categoria" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as FaqItem["category"] })} className={`${inputClass} sm:w-60`}>
        {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
      <input aria-label="Pergunta" placeholder="Pergunta" value={draft.question} onChange={(event) => setDraft({ ...draft, question: event.target.value })} className={inputClass} />
      <textarea aria-label="Resposta" placeholder="Resposta" rows={4} value={draft.answer} onChange={(event) => setDraft({ ...draft, answer: event.target.value })} className={inputClass} />
      <div className="flex gap-2">
        <button type="button" onClick={onSave} className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          <Save className="size-4" aria-hidden="true" /> Salvar
        </button>
        <button type="button" onClick={onCancel} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50">
          <X className="size-4" aria-hidden="true" /> Cancelar
        </button>
      </div>
    </div>
  );
}
