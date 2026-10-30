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
  remoteContent,
  safeUrl,
  writeContent,
  whatsappUrl,
  type SiteSettings,
} from "@/lib/site-content";
import { fetchSiteContent, hasSession, saveSiteContent, uploadProjectImages } from "@/lib/supabase/site-content";

/**
 * Conteúdo editável do site.
 * - Com o Supabase configurado: lido do banco (vale para todos os visitantes).
 * - Sem ele (modo demonstração): salvo no navegador de quem editou.
 * No servidor e no primeiro render vale o padrão; logo depois as edições aparecem.
 */

const emit = (key: string) => window.dispatchEvent(new CustomEvent(CONTENT_CHANGE_EVENT, { detail: key }));

let loading: Promise<void> | null = null;
/** O banco não respondeu: o site mostra o padrão e o painel não grava por cima. */
let loadFailed = false;

/** Carrega o conteúdo do banco uma vez por visita. */
function ensureRemoteLoaded() {
  loading ??= fetchSiteContent()
    .then(async (rows) => {
      for (const row of rows) remoteContent.values.set(row.key, row.value);
      remoteContent.loaded = true;
      emit("*");
      await migrateLocalContent();
    })
    .catch(() => {
      loadFailed = true;
      remoteContent.loaded = true;
      emit("*");
    });
  return loading;
}

/** Envia ao banco, uma única vez, as edições feitas antes no navegador do administrador. */
async function migrateLocalContent() {
  const flag = "content:migrated";
  try {
    if (window.localStorage.getItem(flag) || !(await hasSession())) return;
    let ok = true;
    for (const key of Object.values(CONTENT_KEYS)) {
      const raw = window.localStorage.getItem(key);
      if (!raw || remoteContent.values.has(key)) continue;
      const value: unknown = JSON.parse(raw);
      remoteContent.values.set(key, value);
      emit(key);
      ok = (await persistRemote(key, value, false)) && ok;
    }
    if (ok) window.localStorage.setItem(flag, "1");
  } catch {
    /* tenta de novo no próximo acesso */
  }
}

/** Grava no banco (enviando fotos novas ao Storage) e atualiza a memória. */
async function persistRemote(key: string, value: unknown, warn = true) {
  try {
    const stored = key === CONTENT_KEYS.projects && Array.isArray(value) ? await uploadProjectImages(value as Project[]) : value;
    await saveSiteContent(key, stored);
    if (stored !== value && remoteContent.values.get(key) === value) {
      remoteContent.values.set(key, stored);
      emit(key);
    }
    return true;
  } catch {
    if (warn) window.alert("Não foi possível salvar no banco de dados. Verifique sua conexão e tente novamente.");
    return false;
  }
}

/** Grava um conteúdo (`null` volta ao padrão). Retorna `false` se não for possível salvar. */
function saveContent<T>(key: string, value: T | null) {
  if (!remoteContent.enabled) return writeContent(key, value);
  if (loadFailed) {
    window.alert("O conteúdo do banco de dados não carregou. Recarregue a página antes de editar.");
    return false;
  }
  if (value === null) remoteContent.values.delete(key);
  else remoteContent.values.set(key, value);
  emit(key);
  void persistRemote(key, value);
  return true;
}

const cache = new Map<string, { raw: string | null; value: unknown }>();

function snapshot(key: string): unknown {
  if (remoteContent.enabled) return remoteContent.values.get(key) ?? null;
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
  if (remoteContent.enabled) void ensureRemoteLoaded();
  window.addEventListener(CONTENT_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CONTENT_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

const noopSubscribe = () => () => {};

/** `true` depois que o componente já está no navegador e as edições foram carregadas. */
export function useContentReady() {
  return useSyncExternalStore(
    remoteContent.enabled ? subscribe : noopSubscribe,
    () => !remoteContent.enabled || remoteContent.loaded,
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
  const save = useCallback((next: T[]) => saveContent(key, next), [key]);
  const reset = useCallback(() => saveContent(key, null), [key]);
  return { items, customized: saved !== null, save, reset };
}

/* --------------------------------- Hooks ----------------------------------- */

export function useSiteSettings() {
  const saved = useStoredContent<Partial<SiteSettings>>(CONTENT_KEYS.settings);
  const settings = useMemo(() => mergeSiteSettings(saved), [saved]);
  const save = useCallback((next: SiteSettings) => saveContent(CONTENT_KEYS.settings, next), []);
  const reset = useCallback(() => saveContent(CONTENT_KEYS.settings, null), []);
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
  const list = useContentList<Solution>(CONTENT_KEYS.solutions, defaultSolutions);
  // Links editados no painel passam pelo mesmo filtro dos dados da empresa.
  const items = useMemo(
    () => list.items.map((item) => ({ ...item, href: safeUrl(item.href), cta: { ...item.cta, href: safeUrl(item.cta.href) } })),
    [list.items],
  );
  return { ...list, items };
}

export function useFaq() {
  return useContentList<FaqItem>(CONTENT_KEYS.faq, defaultFaq);
}
