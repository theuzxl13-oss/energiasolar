"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, ExternalLink, ImagePlus, Pencil, Plus, RotateCcw, Save, Star, Trash2, X } from "lucide-react";
import { PROJECT_ART_LABELS, PROJECT_CATEGORY_LABELS, projectHref } from "@/data/projects";
import { useContentReady, useProjects } from "@/hooks/use-site-content";
import type { Project, ProjectCategory } from "@/types";
import { moveItem } from "@/lib/utils";
import { ProjectArt } from "@/components/illustrations/project-art";
import { DemoBadge } from "@/components/ui/primitives";
import { AdminPageHeader, DemoNote } from "./ui";
import { Field, inputClass } from "./form-fields";

const buttonGhost = "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50";

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function uniqueSlug(title: string, taken: string[]) {
  const base = slugify(title) || "projeto";
  let slug = base;
  for (let n = 2; taken.includes(slug) || slug === "detalhe"; n += 1) slug = `${base}-${n}`;
  return slug;
}

function emptyProject(): Project {
  return {
    slug: "",
    title: "",
    category: "solar",
    segment: "",
    location: "",
    power: "",
    summary: "",
    description: "",
    result: "",
    estimatedSavings: "",
    technicalInfo: [{ label: "", value: "" }],
    highlights: [],
    art: "solar-home",
    isDemo: false,
  };
}

/** Reduz a foto (lado maior 1280 px, JPEG) para caber no armazenamento do navegador. */
function resizeImage(file: File, maxSize = 1280, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Imagem inválida"));
    };
    img.src = url;
  });
}

/** Portfólio de projetos (modo demonstração: salvo no navegador e exibido no site). */
export function ProjectsManager() {
  const ready = useContentReady();
  const { items, customized, save, reset } = useProjects();
  const [draft, setDraft] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  if (!ready) return <p className="text-sm text-slate-500">Carregando…</p>;

  const isNew = draft !== null && !draft.slug;

  function open(project: Project) {
    setDraft(structuredClone(project));
    setError(null);
    window.setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  function persist(next: Project[]) {
    if (save(next)) return true;
    setError("Não foi possível salvar: o armazenamento do navegador está cheio. Remova ou troque fotos grandes e tente novamente.");
    return false;
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!draft) return;
    const clean: Project = {
      ...draft,
      title: draft.title.trim(),
      summary: draft.summary.trim(),
      technicalInfo: draft.technicalInfo.filter((item) => item.label.trim() && item.value.trim()),
      highlights: draft.highlights.map((item) => item.trim()).filter(Boolean),
    };
    if (isNew) clean.slug = uniqueSlug(clean.title, items.map((item) => item.slug));
    const next = isNew ? [clean, ...items] : items.map((item) => (item.slug === clean.slug ? clean : item));
    if (persist(next)) setDraft(null);
  }

  function remove(project: Project) {
    if (!window.confirm(`Excluir o projeto “${project.title}” do site?`)) return;
    persist(items.filter((item) => item.slug !== project.slug));
    if (draft?.slug === project.slug) setDraft(null);
  }

  const move = (index: number, direction: -1 | 1) => persist(moveItem(items, index, direction));

  async function onPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !draft) return;
    try {
      const image = await resizeImage(file);
      setDraft((current) => (current ? { ...current, image } : current));
      setError(null);
    } catch {
      setError("Não foi possível ler esta imagem. Use um arquivo JPG, PNG ou WebP.");
    }
  }

  const featuredCount = items.filter((item) => item.featured).length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Projetos"
        description={`${items.length} projetos publicados no portfólio`}
        actions={
          <>
            {customized && (
              <button type="button" onClick={() => window.confirm("Voltar o portfólio para os projetos originais? As edições serão perdidas.") && reset()} className={buttonGhost}>
                <RotateCcw className="size-4" aria-hidden="true" /> Restaurar padrão
              </button>
            )}
            <button
              type="button"
              onClick={() => open(emptyProject())}
              className="inline-flex items-center gap-2 rounded-full bg-night-950 px-4 py-2 text-sm font-semibold text-white hover:bg-night-800"
            >
              <Plus className="size-4" aria-hidden="true" /> Novo projeto
            </button>
          </>
        }
      />
      <DemoNote>
        Modo demonstração: os projetos ficam salvos <strong>neste navegador</strong> e já aparecem no site (página Projetos, prévia da página inicial e
        página de cada projeto). As fotos são reduzidas automaticamente; o espaço do navegador é limitado (poucos MB). Marque a estrela para escolher
        os projetos da página inicial{featuredCount ? ` (${featuredCount} marcados)` : " (sem marcação, aparece um de cada categoria)"}.
      </DemoNote>

      {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800 ring-1 ring-rose-200">{error}</p>}

      {draft && (
        <form ref={formRef} onSubmit={submit} className="scroll-mt-6 rounded-2xl bg-white p-5 shadow-sm ring-2 ring-brand-300 sm:p-6">
          <h2 className="font-semibold text-night-900">{isNew ? "Novo projeto" : `Editar: ${draft.title}`}</h2>

          <div className="mt-5 grid gap-6 lg:grid-cols-[320px_1fr]">
            <div>
              <div className="relative overflow-hidden rounded-xl ring-1 ring-slate-200">
                {draft.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={draft.image} alt="" className="aspect-[16/11] w-full object-cover" />
                ) : (
                  <ProjectArt art={draft.art} className="aspect-[16/11]" />
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <label className={`${buttonGhost} cursor-pointer`}>
                  <ImagePlus className="size-4" aria-hidden="true" /> {draft.image ? "Trocar foto" : "Enviar foto"}
                  <input type="file" accept="image/*" className="sr-only" onChange={onPhoto} />
                </label>
                {draft.image && (
                  <button type="button" onClick={() => setDraft({ ...draft, image: undefined })} className={buttonGhost}>
                    <Trash2 className="size-4" aria-hidden="true" /> Remover foto
                  </button>
                )}
              </div>
              {!draft.image && (
                <Field label="Ilustração (sem foto)" className="mt-4">
                  <select className={inputClass} value={draft.art} onChange={(event) => setDraft({ ...draft, art: event.target.value as Project["art"] })}>
                    {Object.entries(PROJECT_ART_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
              <div className="mt-4 space-y-2">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={Boolean(draft.featured)} onChange={(event) => setDraft({ ...draft, featured: event.target.checked })} className="size-4 accent-brand-600" />
                  Destacar na página inicial
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={draft.isDemo} onChange={(event) => setDraft({ ...draft, isDemo: event.target.checked })} className="size-4 accent-brand-600" />
                  Marcar como “projeto demonstrativo”
                </label>
              </div>
            </div>

            <div className="grid content-start gap-4 sm:grid-cols-2">
              <Field label="Título *" className="sm:col-span-2">
                <input required className={inputClass} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
              </Field>
              <Field label="Categoria">
                <select className={inputClass} value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as ProjectCategory })}>
                  {Object.entries(PROJECT_CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Segmento" hint="Ex.: Residencial, Comercial, Condomínio">
                <input className={inputClass} value={draft.segment} onChange={(event) => setDraft({ ...draft, segment: event.target.value })} />
              </Field>
              <Field label="Potência">
                <input className={inputClass} placeholder="Ex.: 8,5 kWp" value={draft.power} onChange={(event) => setDraft({ ...draft, power: event.target.value })} />
              </Field>
              <Field label="Localização">
                <input className={inputClass} placeholder="Ex.: Campinas/SP" value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} />
              </Field>
              <Field label="Resumo *" className="sm:col-span-2" hint="Uma frase, exibida no card do projeto.">
                <input required className={inputClass} value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} />
              </Field>
              <Field label="Sobre o projeto" className="sm:col-span-2">
                <textarea rows={4} className={inputClass} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
              </Field>
              <Field label="Destaques (um por linha)" className="sm:col-span-2">
                <textarea
                  rows={3}
                  className={inputClass}
                  value={draft.highlights.join("\n")}
                  onChange={(event) => setDraft({ ...draft, highlights: event.target.value.split("\n") })}
                />
              </Field>
              <Field label="Resultado">
                <input className={inputClass} value={draft.result} onChange={(event) => setDraft({ ...draft, result: event.target.value })} />
              </Field>
              <Field label="Economia estimada">
                <input className={inputClass} value={draft.estimatedSavings} onChange={(event) => setDraft({ ...draft, estimatedSavings: event.target.value })} />
              </Field>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-wide text-slate-600 uppercase">Informações técnicas</span>
                  <button
                    type="button"
                    onClick={() => setDraft({ ...draft, technicalInfo: [...draft.technicalInfo, { label: "", value: "" }] })}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline"
                  >
                    <Plus className="size-4" aria-hidden="true" /> Adicionar linha
                  </button>
                </div>
                <ul className="mt-2 space-y-2">
                  {draft.technicalInfo.map((info, index) => (
                    <li key={index} className="flex gap-2">
                      <input
                        aria-label="Item"
                        placeholder="Ex.: Módulos"
                        className={inputClass}
                        value={info.label}
                        onChange={(event) =>
                          setDraft({ ...draft, technicalInfo: draft.technicalInfo.map((item, i) => (i === index ? { ...item, label: event.target.value } : item)) })
                        }
                      />
                      <input
                        aria-label="Valor"
                        placeholder="Ex.: 14 × 610 Wp"
                        className={inputClass}
                        value={info.value}
                        onChange={(event) =>
                          setDraft({ ...draft, technicalInfo: draft.technicalInfo.map((item, i) => (i === index ? { ...item, value: event.target.value } : item)) })
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setDraft({ ...draft, technicalInfo: draft.technicalInfo.filter((_, i) => i !== index) })}
                        className="shrink-0 rounded-lg p-2 text-rose-500 hover:bg-rose-50"
                        aria-label="Remover linha"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              <Save className="size-4" aria-hidden="true" /> Salvar projeto
            </button>
            <button type="button" onClick={() => setDraft(null)} className={buttonGhost}>
              <X className="size-4" aria-hidden="true" /> Cancelar
            </button>
          </div>
        </form>
      )}

      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((project, index) => (
          <li key={project.slug} className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            {project.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={project.image} alt="" className="aspect-[16/8] w-full object-cover" />
            ) : (
              <ProjectArt art={project.art} className="aspect-[16/8]" />
            )}
            <div className="flex flex-1 flex-col p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">{PROJECT_CATEGORY_LABELS[project.category]}</span>
                {project.featured && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                    <Star className="size-3" aria-hidden="true" /> Página inicial
                  </span>
                )}
                {project.isDemo && <DemoBadge tone="light" label="Demonstrativo" />}
              </div>
              <h2 className="mt-3 font-semibold text-night-900">{project.title}</h2>
              <p className="mt-1 text-sm text-slate-500">{[project.power, project.segment].filter(Boolean).join(" • ")}</p>
              <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                <Link href={projectHref(project.slug)} target="_blank" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
                  Ver no site <ExternalLink className="size-3.5" aria-hidden="true" />
                </Link>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => persist(items.map((item) => (item.slug === project.slug ? { ...item, featured: !item.featured } : item)))}
                    className={project.featured ? "rounded-lg p-2 text-amber-500 hover:bg-amber-50" : "rounded-lg p-2 text-slate-400 hover:bg-slate-100"}
                    aria-label={project.featured ? "Tirar da página inicial" : "Destacar na página inicial"}
                    aria-pressed={Boolean(project.featured)}
                  >
                    <Star className="size-4" fill={project.featured ? "currentColor" : "none"} />
                  </button>
                  <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label="Mover para trás">
                    <ArrowUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === items.length - 1}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                    aria-label="Mover para frente"
                  >
                    <ArrowDown className="size-4" />
                  </button>
                  <button type="button" onClick={() => open(project)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Editar">
                    <Pencil className="size-4" />
                  </button>
                  <button type="button" onClick={() => remove(project)} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50" aria-label="Excluir">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
