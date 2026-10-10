/**
 * ============================================================================
 * CONTEÚDO EDITÁVEL PELO PAINEL (MODO DEMONSTRAÇÃO)
 * ============================================================================
 * Projetos, serviços, FAQ e dados da empresa podem ser editados em /admin.
 * As edições ficam no armazenamento do navegador (localStorage) de quem
 * editou; sem edição, valem os padrões de `src/config` e `src/data`.
 *
 * Para usar um banco (Supabase), troque apenas `readContent`/`writeContent`
 * por chamadas à API — os hooks em `src/hooks/use-site-content.ts` e as
 * telas continuam iguais.
 * ============================================================================
 */

import { siteConfig } from "@/config/site";
import { companyStats } from "@/config/stats";
import type { CompanyStat } from "@/types";

export const CONTENT_KEYS = {
  settings: "content:site-settings",
  projects: "content:projects",
  solutions: "content:solutions",
  faq: "content:faq",
} as const;

export const CONTENT_CHANGE_EVENT = "site-content-change";

/* ------------------------------ Armazenamento ------------------------------ */

/** Lê um conteúdo salvo; `null` quando não há edição (ou fora do navegador). */
export function readContent<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** Grava (ou, com `null`, apaga e volta ao padrão) um conteúdo. Retorna `false` se não couber. */
export function writeContent<T>(key: string, value: T | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(CONTENT_CHANGE_EVENT, { detail: key }));
    return true;
  } catch {
    return false;
  }
}

/* --------------------------- Dados da empresa ------------------------------ */

export interface BusinessHour {
  label: string;
  value: string;
}

export interface SiteSettings {
  legalName: string;
  cnpj: string;
  contact: {
    phoneDisplay: string;
    whatsappDisplay: string;
    email: string;
  };
  whatsappDefaultMessage: string;
  address: {
    street: string;
    district: string;
    city: string;
    state: string;
    zipCode: string;
    mapsUrl: string;
  };
  serviceArea: string;
  businessHours: BusinessHour[];
  social: {
    instagram: string;
    facebook: string;
    linkedin: string;
    youtube: string;
  };
  stats: CompanyStat[];
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  legalName: siteConfig.legalName,
  cnpj: siteConfig.cnpj,
  contact: {
    phoneDisplay: siteConfig.contact.phoneDisplay,
    whatsappDisplay: siteConfig.contact.whatsappDisplay,
    email: siteConfig.contact.email,
  },
  whatsappDefaultMessage: siteConfig.whatsappDefaultMessage,
  address: { ...siteConfig.address, mapsUrl: siteConfig.address.mapsUrl ?? "" },
  serviceArea: siteConfig.serviceArea,
  businessHours: siteConfig.businessHours.map((item) => ({ ...item })),
  social: {
    instagram: siteConfig.social.instagram ?? "",
    facebook: siteConfig.social.facebook ?? "",
    linkedin: siteConfig.social.linkedin ?? "",
    youtube: siteConfig.social.youtube ?? "",
  },
  stats: companyStats.map((stat) => ({ ...stat })),
};

/** Completa um registro salvo com os padrões (campos novos continuam funcionando). */
export function mergeSiteSettings(saved: Partial<SiteSettings> | null): SiteSettings {
  if (!saved) return DEFAULT_SITE_SETTINGS;
  const base = DEFAULT_SITE_SETTINGS;
  return {
    ...base,
    ...saved,
    contact: { ...base.contact, ...saved.contact },
    address: { ...base.address, ...saved.address },
    social: { ...base.social, ...saved.social },
    businessHours: saved.businessHours ?? base.businessHours,
    stats: saved.stats ?? base.stats,
  };
}

/** Dados atuais da empresa (para código fora de componentes, ex.: contratos). */
export function getSiteSettings() {
  return mergeSiteSettings(readContent<Partial<SiteSettings>>(CONTENT_KEYS.settings));
}

const digits = (value: string) => value.replace(/\D/g, "");

/** "(11) 96298-6718" → "5511962986718" (acrescenta o 55 quando faltar). */
export function toInternationalPhone(display: string) {
  const value = digits(display);
  return value.startsWith("55") && value.length >= 12 ? value : `55${value}`;
}

export function phoneHref(settings: SiteSettings) {
  return `+${toInternationalPhone(settings.contact.phoneDisplay)}`;
}

export function whatsappUrl(settings: SiteSettings, message = settings.whatsappDefaultMessage) {
  return `https://wa.me/${toInternationalPhone(settings.contact.whatsappDisplay)}?text=${encodeURIComponent(message)}`;
}

export function companyAddressLine(settings: SiteSettings) {
  const { street, district, city, state, zipCode } = settings.address;
  return `${street}, ${district}, ${city}/${state}, CEP ${zipCode}`;
}
