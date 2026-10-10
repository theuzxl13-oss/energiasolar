"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { projects as defaultProjects } from "@/data/projects";
import { solutions as defaultSolutions, type Solution } from "@/data/solutions";
import { faqItems as defaultFaq } from "@/data/faq";
import type { FaqItem, Project } from "@/types";
import {
  CONTENT_CHANGE_EVENT,
  CONTENT_KEYS,
  mergeSiteSettings,
  writeContent,
  whatsappUrl,
  type SiteSettings,
} from "@/lib/site-content";

/**
 * Conteúdo editável do site (modo demonstração: salvo no navegador).
 * No servidor e no primeiro render vale o padrão; logo após a hidratação,
 * as edições feitas no painel aparecem.
 */

const cache = new Map<string, { raw: string | null; value: unknown }>();

function snapshot(key: string): unknown {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    /* armazenamento indisponível */
  }
  const cached = cache.get(key);
  if (cached && cached.raw === raw) return cached.value;
  let value: unknown = null;
  try {
    value = raw ? JSON.parse(raw) : null;
  } catch {
    value = null;
  }
  cache.set(key, { raw, value });
  return value;
}

function subscribe(callback: () => void) {
  window.addEventListener(CONTENT_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CONTENT_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

const noopSubscribe = () => () => {};

/** `true` depois que o componente já está no navegador (edições carregadas). */
export function useContentReady() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/** Valor salvo de uma chave (`null` = sem edição, usar o padrão). */
function useStoredContent<T>(key: string): T | null {
  return useSyncExternalStore(
    subscribe,
    () => snapshot(key) as T | null,
    () => null,
  );
}

/** Lista editável com padrão: retorna os itens atuais e funções de gravação. */
function useContentList<T>(key: string, defaults: T[]) {
  const saved = useStoredContent<T[]>(key);
  const items = saved ?? defaults;
  const save = useCallback((next: T[]) => writeContent(key, next), [key]);
  const reset = useCallback(() => writeContent(key, null), [key]);
  return { items, customized: saved !== null, save, reset };
}

/* --------------------------------- Hooks ----------------------------------- */

export function useSiteSettings() {
  const saved = useStoredContent<Partial<SiteSettings>>(CONTENT_KEYS.settings);
  const settings = useMemo(() => mergeSiteSettings(saved), [saved]);
  const save = useCallback((next: SiteSettings) => writeContent(CONTENT_KEYS.settings, next), []);
  const reset = useCallback(() => writeContent(CONTENT_KEYS.settings, null), []);
  return { settings, customized: saved !== null, save, reset };
}

/** Link do WhatsApp com o número atual da empresa. */
export function useWhatsAppUrl(message?: string) {
  const { settings } = useSiteSettings();
  return whatsappUrl(settings, message);
}

export function useProjects() {
  return useContentList<Project>(CONTENT_KEYS.projects, defaultProjects);
}

export function useSolutions() {
  return useContentList<Solution>(CONTENT_KEYS.solutions, defaultSolutions);
}

export function useFaq() {
  return useContentList<FaqItem>(CONTENT_KEYS.faq, defaultFaq);
}
