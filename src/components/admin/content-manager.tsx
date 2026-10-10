"use client";

import { useState } from "react";
import { Check, ExternalLink, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { mainNavigation } from "@/config/navigation";
import { useContentReady, useSiteSettings } from "@/hooks/use-site-content";
import { whatsappUrl, type SiteSettings } from "@/lib/site-content";
import { maskPhone, onlyDigits } from "@/lib/utils";
import type { CompanyStat } from "@/types";
import { AdminPageHeader, DemoNote, Panel } from "./ui";
import { Field, inputClass } from "./form-fields";

function maskCnpj(value: string) {
  return onlyDigits(value)
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

const buttonGhost = "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50";
const buttonPrimary = "inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700";

/** Edição dos dados da empresa, contatos, horários, redes e indicadores. */
export function ContentManager() {
  const ready = useContentReady();
  const { settings, customized, save, reset } = useSiteSettings();
  // Muda a cada "Restaurar padrão" para remontar o formulário com os dados originais.
  const [version, setVersion] = useState(0);

  if (!ready) return <p className="text-sm text-slate-500">Carregando…</p>;
  return (
    <ContentForm
      key={version}
      initial={settings}
      customized={customized}
      onSave={save}
      onReset={() => {
        reset();
        setVersion((current) => current + 1);
      }}
    />
  );
}

function ContentForm({
  initial,
  customized,
  onSave,
  onReset,
}: {
  initial: SiteSettings;
  customized: boolean;
  onSave: (settings: SiteSettings) => boolean;
  onReset: () => void;
}) {
  const [draft, setDraft] = useState<SiteSettings>(() => structuredClone(initial));
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);

  function update(patch: Partial<SiteSettings>) {
    setDraft((current) => ({ ...current, ...patch }));
    setStatus("idle");
  }
  const updateIn = <K extends "contact" | "address" | "social">(section: K, patch: Partial<SiteSettings[K]>) =>
    update({ [section]: { ...draft[section], ...patch } } as Partial<SiteSettings>);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const cleaned: SiteSettings = {
      ...draft,
      businessHours: draft.businessHours.filter((item) => item.label.trim() || item.value.trim()),
      stats: draft.stats.filter((stat) => stat.label.trim()),
    };
    setDraft(cleaned);
    setStatus(onSave(cleaned) ? "saved" : "error");
  }

  function restore() {
    if (!window.confirm("Voltar todos os dados desta tela para o padrão original? As edições serão perdidas.")) return;
    onReset();
  }

  const updateStat = (index: number, patch: Partial<CompanyStat>) =>
    update({ stats: draft.stats.map((stat, i) => (i === index ? { ...stat, ...patch } : stat)) });

  return (
    <form onSubmit={submit} className="space-y-6">
      <AdminPageHeader
        title="Conteúdo do Site"
        description="Dados da empresa, contatos, horários, redes sociais e indicadores"
        actions={
          <>
            {customized && (
              <button type="button" onClick={restore} className={buttonGhost}>
                <RotateCcw className="size-4" aria-hidden="true" /> Restaurar padrão
              </button>
            )}
            <button type="submit" className={buttonPrimary}>
              <Save className="size-4" aria-hidden="true" /> Salvar alterações
            </button>
          </>
        }
      />
      <DemoNote>
        Modo demonstração: as alterações ficam salvas <strong>neste navegador</strong> e aparecem no site (rodapé, contato, botões de WhatsApp, política
        de privacidade, indicadores) e nos orçamentos e contratos. Outras pessoas só verão quando o banco de dados for conectado.
      </DemoNote>

      {status !== "idle" && (
        <p
          role="status"
          className={
            status === "saved"
              ? "flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-800 ring-1 ring-brand-200"
              : "rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800 ring-1 ring-rose-200"
          }
        >
          {status === "saved" ? (
            <>
              <Check className="size-4" aria-hidden="true" /> Alterações salvas. O site já está atualizado neste navegador.
            </>
          ) : (
            "Não foi possível salvar (armazenamento do navegador indisponível ou cheio)."
          )}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Dados da empresa" description="Usados no rodapé, na política de privacidade e nos contratos.">
          <div className="grid gap-4">
            <Field label="Razão social">
              <input className={inputClass} value={draft.legalName} onChange={(event) => update({ legalName: event.target.value })} />
            </Field>
            <Field label="CNPJ">
              <input className={inputClass} inputMode="numeric" value={draft.cnpj} onChange={(event) => update({ cnpj: maskCnpj(event.target.value) })} />
            </Field>
          </div>
        </Panel>

        <Panel title="Contatos" description="Telefone, WhatsApp e e-mail exibidos no site e nos documentos.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Telefone">
              <input
                className={inputClass}
                inputMode="tel"
                value={draft.contact.phoneDisplay}
                onChange={(event) => updateIn("contact", { phoneDisplay: maskPhone(event.target.value) })}
              />
            </Field>
            <Field label="WhatsApp" hint="Todos os botões de WhatsApp do site usam este número.">
              <input
                className={inputClass}
                inputMode="tel"
                value={draft.contact.whatsappDisplay}
                onChange={(event) => updateIn("contact", { whatsappDisplay: maskPhone(event.target.value) })}
              />
            </Field>
            <Field label="E-mail" className="sm:col-span-2">
              <input type="email" className={inputClass} value={draft.contact.email} onChange={(event) => updateIn("contact", { email: event.target.value })} />
            </Field>
            <Field label="Mensagem inicial do WhatsApp" className="sm:col-span-2">
              <textarea
                rows={2}
                className={inputClass}
                value={draft.whatsappDefaultMessage}
                onChange={(event) => update({ whatsappDefaultMessage: event.target.value })}
              />
            </Field>
            <a
              href={whatsappUrl(draft)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline sm:col-span-2"
            >
              Testar link do WhatsApp <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          </div>
        </Panel>

        <Panel title="Endereço" description="Página de contato, rodapé e qualificação da empresa nos contratos.">
          <div className="grid gap-4 sm:grid-cols-6">
            <Field label="Rua e número" className="sm:col-span-6">
              <input className={inputClass} value={draft.address.street} onChange={(event) => updateIn("address", { street: event.target.value })} />
            </Field>
            <Field label="Bairro" className="sm:col-span-3">
              <input className={inputClass} value={draft.address.district} onChange={(event) => updateIn("address", { district: event.target.value })} />
            </Field>
            <Field label="CEP" className="sm:col-span-3">
              <input
                className={inputClass}
                inputMode="numeric"
                value={draft.address.zipCode}
                onChange={(event) => updateIn("address", { zipCode: onlyDigits(event.target.value).slice(0, 8).replace(/^(\d{5})(\d)/, "$1-$2") })}
              />
            </Field>
            <Field label="Cidade" className="sm:col-span-4">
              <input className={inputClass} value={draft.address.city} onChange={(event) => updateIn("address", { city: event.target.value })} />
            </Field>
            <Field label="UF" className="sm:col-span-2">
              <input
                className={inputClass}
                maxLength={2}
                value={draft.address.state}
                onChange={(event) => updateIn("address", { state: event.target.value.toUpperCase() })}
              />
            </Field>
            <Field label="Link do Google Maps (opcional)" className="sm:col-span-6" hint="Deixe em branco para esconder o botão “Ver no mapa”.">
              <input className={inputClass} value={draft.address.mapsUrl} onChange={(event) => updateIn("address", { mapsUrl: event.target.value })} />
            </Field>
            <Field label="Área de atendimento" className="sm:col-span-6">
              <input className={inputClass} value={draft.serviceArea} onChange={(event) => update({ serviceArea: event.target.value })} />
            </Field>
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel
            title="Horário de atendimento"
            actions={
              <button
                type="button"
                onClick={() => update({ businessHours: [...draft.businessHours, { label: "", value: "" }] })}
                className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline"
              >
                <Plus className="size-4" aria-hidden="true" /> Adicionar
              </button>
            }
          >
            <ul className="space-y-3">
              {draft.businessHours.map((item, index) => (
                <li key={index} className="flex items-center gap-2">
                  <input
                    aria-label="Dias"
                    placeholder="Ex.: Segunda a sexta"
                    className={inputClass}
                    value={item.label}
                    onChange={(event) =>
                      update({ businessHours: draft.businessHours.map((entry, i) => (i === index ? { ...entry, label: event.target.value } : entry)) })
                    }
                  />
                  <input
                    aria-label="Horário"
                    placeholder="Ex.: 08h às 18h"
                    className={inputClass}
                    value={item.value}
                    onChange={(event) =>
                      update({ businessHours: draft.businessHours.map((entry, i) => (i === index ? { ...entry, value: event.target.value } : entry)) })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => update({ businessHours: draft.businessHours.filter((_, i) => i !== index) })}
                    className="shrink-0 rounded-lg p-2 text-rose-500 hover:bg-rose-50"
                    aria-label="Remover horário"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Redes sociais" description="Cole o link completo do perfil. Deixe em branco para esconder o ícone.">
            <div className="grid gap-4">
              {(["instagram", "facebook", "linkedin", "youtube"] as const).map((network) => (
                <Field key={network} label={{ instagram: "Instagram", facebook: "Facebook", linkedin: "LinkedIn", youtube: "YouTube" }[network]}>
                  <input
                    className={inputClass}
                    placeholder="https://"
                    value={draft.social[network]}
                    onChange={(event) => updateIn("social", { [network]: event.target.value })}
                  />
                </Field>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <Panel
        title="Indicadores (Por que escolher)"
        description="Números exibidos na página inicial e em Sobre. Desmarque “demonstrativo” quando o número for oficial."
        actions={
          <button
            type="button"
            onClick={() =>
              update({ stats: [...draft.stats, { id: `stat-${Date.now()}`, value: 0, prefix: "+", suffix: "", label: "", icon: "chart", isDemo: true }] })
            }
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline"
          >
            <Plus className="size-4" aria-hidden="true" /> Adicionar
          </button>
        }
      >
        <ul className="grid gap-4 md:grid-cols-2">
          {draft.stats.map((stat, index) => (
            <li key={stat.id} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <div className="grid grid-cols-[70px_1fr_90px] gap-2">
                <Field label="Antes">
                  <input className={inputClass} value={stat.prefix ?? ""} onChange={(event) => updateStat(index, { prefix: event.target.value })} />
                </Field>
                <Field label="Número">
                  <input
                    className={inputClass}
                    inputMode="numeric"
                    value={String(stat.value)}
                    onChange={(event) => updateStat(index, { value: Number(onlyDigits(event.target.value)) || 0 })}
                  />
                </Field>
                <Field label="Depois">
                  <input className={inputClass} value={stat.suffix ?? ""} onChange={(event) => updateStat(index, { suffix: event.target.value })} />
                </Field>
              </div>
              <Field label="Descrição" className="mt-3">
                <input className={inputClass} value={stat.label} onChange={(event) => updateStat(index, { label: event.target.value })} />
              </Field>
              <div className="mt-3 flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={stat.isDemo} onChange={(event) => updateStat(index, { isDemo: event.target.checked })} className="size-4 accent-brand-600" />
                  Dado demonstrativo
                </label>
                <p className="text-sm font-semibold text-night-900">
                  Prévia: {stat.prefix}
                  {stat.value.toLocaleString("pt-BR")}
                  {stat.suffix}
                </p>
                <button
                  type="button"
                  onClick={() => update({ stats: draft.stats.filter((_, i) => i !== index) })}
                  className="rounded-lg p-2 text-rose-500 hover:bg-rose-100"
                  aria-label="Remover indicador"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Menu principal" description="Definido no código (src/config/navigation.ts).">
        <ul className="flex flex-wrap gap-2">
          {mainNavigation.map((item) => (
            <li key={item.href} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700">
              {item.label} <span className="text-slate-400">{item.href}</span>
            </li>
          ))}
        </ul>
      </Panel>

      <div className="sticky bottom-4 flex items-center justify-end gap-3">
        {dirty && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">Alterações não salvas</span>}
        <button type="submit" className={`${buttonPrimary} shadow-lg`}>
          <Save className="size-4" aria-hidden="true" /> Salvar alterações
        </button>
      </div>
    </form>
  );
}
