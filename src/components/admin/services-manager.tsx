"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowDown, ArrowUp, ExternalLink, Pencil, Plus, RotateCcw, Save, Trash2, X } from "lucide-react";
import type { Solution } from "@/data/solutions";
import { useContentReady, useSolutions } from "@/hooks/use-site-content";
import { SERVICE_LABELS } from "@/lib/labels";
import { SERVICE_TYPES, type ServiceType } from "@/types";
import { Icon } from "@/components/ui/icon";
import { AdminPageHeader, DemoNote, Panel } from "./ui";
import { Field, inputClass } from "./form-fields";
import { cn, moveItem } from "@/lib/utils";

/** Links sugeridos para "Saiba mais" e para o botão de ação. */
const LINK_SUGGESTIONS = [
  { href: "/energia-solar", label: "Página Energia Solar" },
  { href: "/carregadores", label: "Página Carregadores" },
  { href: "/eletropostos", label: "Página Eletropostos" },
  { href: "/orcamento", label: "Formulário de orçamento" },
  { href: "/orcamento?servico=solar", label: "Orçamento — energia solar" },
  { href: "/orcamento?servico=carregador", label: "Orçamento — carregador" },
  { href: "/orcamento?servico=eletroposto", label: "Orçamento — eletroposto" },
  { href: "/#simulador-solar", label: "Simulador solar" },
  { href: "/contato", label: "Página de contato" },
];

function emptySolution(): Solution {
  return {
    id: `servico-${Date.now()}`,
    eyebrow: "",
    title: "",
    description: "",
    href: "",
    cta: { label: "Solicitar orçamento", href: "/orcamento" },
    icon: "zap",
    tags: [],
    highlights: [],
  };
}

const buttonGhost = "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50";

/** Serviços exibidos em "Nossas soluções" (modo demonstração: salvos no navegador). */
export function ServicesManager() {
  const ready = useContentReady();
  const { items, customized, save, reset } = useSolutions();
  const [draft, setDraft] = useState<Solution | null>(null);
  const [enabled, setEnabled] = useState<Record<ServiceType, boolean>>(
    () => Object.fromEntries(SERVICE_TYPES.map((service) => [service, true])) as Record<ServiceType, boolean>,
  );

  if (!ready) return <p className="text-sm text-slate-500">Carregando…</p>;

  const isNew = draft !== null && !items.some((item) => item.id === draft.id);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!draft || !draft.title.trim() || !draft.description.trim()) return;
    const clean: Solution = {
      ...draft,
      title: draft.title.trim(),
      description: draft.description.trim(),
      href: draft.href.trim(),
      tags: draft.tags.map((tag) => ({ ...tag, label: tag.label.trim() })).filter((tag) => tag.label),
    };
    save(isNew ? [...items, clean] : items.map((item) => (item.id === clean.id ? clean : item)));
    setDraft(null);
  }

  function remove(solution: Solution) {
    if (!window.confirm(`Excluir o serviço “${solution.title}” do site?`)) return;
    save(items.filter((item) => item.id !== solution.id));
    if (draft?.id === solution.id) setDraft(null);
  }

  const move = (index: number, direction: -1 | 1) => save(moveItem(items, index, direction));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Serviços"
        description={`${items.length} serviços na seção “Nossas soluções” da página inicial`}
        actions={
          <>
            {customized && (
              <button type="button" onClick={() => window.confirm("Voltar os serviços para o padrão original?") && reset()} className={buttonGhost}>
                <RotateCcw className="size-4" aria-hidden="true" /> Restaurar padrão
              </button>
            )}
            <button
              type="button"
              onClick={() => setDraft(emptySolution())}
              className="inline-flex items-center gap-2 rounded-full bg-night-950 px-4 py-2 text-sm font-semibold text-white hover:bg-night-800"
            >
              <Plus className="size-4" aria-hidden="true" /> Novo serviço
            </button>
          </>
        }
      />
      <DemoNote>
        Modo demonstração: as alterações ficam salvas <strong>neste navegador</strong> e já aparecem na seção “Nossas soluções” do site. Com o banco
        conectado, todos verão as alterações.
      </DemoNote>

      {draft && (
        <form onSubmit={submit} className="rounded-2xl bg-white p-5 shadow-sm ring-2 ring-brand-300 sm:p-6">
          <h2 className="font-semibold text-night-900">{isNew ? "Novo serviço" : `Editar: ${draft.title}`}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Título *" className="sm:col-span-2">
              <input required className={inputClass} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
            </Field>
            <Field label="Chamada curta" hint="Aparece acima do título, ex.: “Geração própria”.">
              <input className={inputClass} value={draft.eyebrow} onChange={(event) => setDraft({ ...draft, eyebrow: event.target.value })} />
            </Field>
            <Field label="Atende (separe por vírgula)" hint="Ex.: Residências, Empresas, Condomínios">
              <input
                className={inputClass}
                value={draft.tags.map((tag) => tag.label).join(", ")}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    tags: event.target.value.split(",").map((label, index) => ({
                      label: label.trimStart(),
                      icon: draft.tags[index]?.icon ?? "check",
                    })),
                  })
                }
                onBlur={() => setDraft({ ...draft, tags: draft.tags.map((tag) => ({ ...tag, label: tag.label.trim() })).filter((tag) => tag.label) })}
              />
            </Field>
            <Field label="Descrição *" className="sm:col-span-2">
              <textarea required rows={3} className={inputClass} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
            </Field>
            <Field label="Texto do botão" hint="Deixe em branco para não exibir o botão.">
              <input className={inputClass} value={draft.cta.label} onChange={(event) => setDraft({ ...draft, cta: { ...draft.cta, label: event.target.value } })} />
            </Field>
            <Field label="Link do botão">
              <input
                list="service-links"
                className={inputClass}
                value={draft.cta.href}
                onChange={(event) => setDraft({ ...draft, cta: { ...draft.cta, href: event.target.value } })}
              />
            </Field>
            <Field label="Página “Saiba mais”" className="sm:col-span-2" hint="Deixe em branco se o serviço não tiver página própria.">
              <input list="service-links" className={inputClass} value={draft.href} onChange={(event) => setDraft({ ...draft, href: event.target.value })} />
            </Field>
            <datalist id="service-links">
              {LINK_SUGGESTIONS.map((link) => (
                <option key={link.href} value={link.href}>
                  {link.label}
                </option>
              ))}
            </datalist>
          </div>
          <div className="mt-5 flex gap-2">
            <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              <Save className="size-4" aria-hidden="true" /> Salvar
            </button>
            <button type="button" onClick={() => setDraft(null)} className={buttonGhost}>
              <X className="size-4" aria-hidden="true" /> Cancelar
            </button>
          </div>
        </form>
      )}

      <ul className="grid gap-4 lg:grid-cols-3">
        {items.map((solution, index) => (
          <li key={solution.id}>
            <Panel className="flex h-full flex-col">
              <div className="flex items-start justify-between gap-2">
                <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-volt-500 text-white">
                  <Icon name={solution.icon} className="size-5" />
                </span>
                <div className="flex gap-1">
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
                  <button type="button" onClick={() => setDraft(structuredClone(solution))} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Editar">
                    <Pencil className="size-4" />
                  </button>
                  <button type="button" onClick={() => remove(solution)} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50" aria-label="Excluir">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
              {solution.eyebrow && <p className="mt-4 text-xs font-semibold text-brand-700">{solution.eyebrow}</p>}
              <h2 className="mt-1 font-semibold text-night-900">{solution.title}</h2>
              <p className="mt-1 line-clamp-3 text-sm text-slate-600">{solution.description}</p>
              {solution.tags.length > 0 && <p className="mt-3 text-xs text-slate-500">{solution.tags.map((tag) => tag.label).join(" • ")}</p>}
              <p className="mt-auto pt-3 text-xs text-slate-500">
                {solution.href ? (
                  <Link href={solution.href} target="_blank" className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline">
                    {solution.href} <ExternalLink className="size-3" aria-hidden="true" />
                  </Link>
                ) : (
                  "Sem página própria"
                )}
                {solution.cta.label && <> • Botão: “{solution.cta.label}”</>}
              </p>
            </Panel>
          </li>
        ))}
      </ul>

      <Panel title="Serviços do formulário de orçamento" description="Opções da lista “Serviço” no formulário (ainda não salvas na demonstração).">
        <ul className="divide-y divide-slate-100">
          {SERVICE_TYPES.map((service) => (
            <li key={service} className="flex items-center justify-between py-3">
              <span className="text-sm font-medium text-night-900">{SERVICE_LABELS[service]}</span>
              <button
                type="button"
                role="switch"
                aria-checked={enabled[service]}
                aria-label={`Exibir ${SERVICE_LABELS[service]}`}
                onClick={() => setEnabled((current) => ({ ...current, [service]: !current[service] }))}
                className={cn("relative h-6 w-11 rounded-full transition", enabled[service] ? "bg-brand-500" : "bg-slate-300")}
              >
                <span className={cn("absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition", enabled[service] && "translate-x-5")} />
              </button>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
