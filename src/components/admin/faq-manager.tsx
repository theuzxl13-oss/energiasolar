"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, RotateCcw, Save, Trash2, X } from "lucide-react";
import { useContentReady, useFaq } from "@/hooks/use-site-content";
import type { FaqItem } from "@/types";
import { moveItem } from "@/lib/utils";
import { AdminPageHeader, DemoNote } from "./ui";

const CATEGORY_LABELS: Record<FaqItem["category"], string> = {
  solar: "Energia solar",
  carregadores: "Carregadores",
  eletropostos: "Eletropostos",
  geral: "Geral",
};

/** Edição de perguntas frequentes (modo demonstração: salvas no navegador e exibidas no site). */
export function FaqManager() {
  const ready = useContentReady();
  const { items, customized, save: saveItems, reset } = useFaq();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<FaqItem | null>(null);

  function startEdit(item: FaqItem) {
    setEditing(item.id);
    setDraft({ ...item });
  }

  function save() {
    if (!draft || !draft.question.trim() || !draft.answer.trim()) return;
    const clean = { ...draft, question: draft.question.trim(), answer: draft.answer.trim() };
    saveItems(items.some((item) => item.id === clean.id) ? items.map((item) => (item.id === clean.id ? clean : item)) : [clean, ...items]);
    setEditing(null);
    setDraft(null);
  }

  function remove(item: FaqItem) {
    if (!window.confirm(`Excluir a pergunta “${item.question}”?`)) return;
    saveItems(items.filter((entry) => entry.id !== item.id));
  }

  const move = (index: number, direction: -1 | 1) => saveItems(moveItem(items, index, direction));

  function restore() {
    if (window.confirm("Voltar o FAQ para as perguntas originais? As edições serão perdidas.")) reset();
  }

  if (!ready) return <p className="text-sm text-slate-500">Carregando…</p>;

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
          <>
            {customized && (
              <button
                type="button"
                onClick={restore}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              >
                <RotateCcw className="size-4" aria-hidden="true" /> Restaurar padrão
              </button>
            )}
            <button type="button" onClick={add} className="inline-flex items-center gap-2 rounded-full bg-night-950 px-4 py-2 text-sm font-semibold text-white hover:bg-night-800">
              <Plus className="size-4" aria-hidden="true" /> Nova pergunta
            </button>
          </>
        }
      />
      <DemoNote>
        Modo demonstração: as perguntas ficam salvas <strong>neste navegador</strong> e já aparecem no site (página inicial e páginas de cada solução,
        conforme a categoria). Com o banco conectado, todos verão as alterações.
      </DemoNote>

      <ul className="space-y-3">
        {editing && draft && !items.some((item) => item.id === draft.id) && (
          <li className="rounded-2xl bg-white p-5 ring-2 ring-brand-300">
            <Editor draft={draft} setDraft={setDraft} inputClass={inputClass} onSave={save} onCancel={() => setEditing(null)} />
          </li>
        )}
        {items.map((item, index) => (
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
                  <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label="Mover para cima">
                    <ArrowUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === items.length - 1}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                    aria-label="Mover para baixo"
                  >
                    <ArrowDown className="size-4" />
                  </button>
                  <button type="button" onClick={() => startEdit(item)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Editar">
                    <Pencil className="size-4" />
                  </button>
                  <button type="button" onClick={() => remove(item)} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50" aria-label="Remover">
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
