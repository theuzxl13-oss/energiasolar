"use client";

import { useCallback, useEffect, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { deleteDocument, fetchDocuments, upsertDocument, type DocumentSummary, type DocumentTable } from "@/lib/supabase/documents";

/**
 * Coleção de documentos usada por orçamentos e contratos.
 * - Com o Supabase configurado: salva no banco (tabela `table`).
 * - Sem ele (MODO DEMONSTRAÇÃO): salva no navegador.
 */

interface StoredDoc {
  id: string;
  number: string;
  updatedAt: string;
}

export interface CollectionOptions<T> {
  /** Chave no armazenamento local. */
  key: string;
  /** Documentos de exemplo incluídos uma única vez, no primeiro acesso (só no modo demonstração). */
  seed?: () => T[];
  /** Tabela no Supabase e colunas de listagem. */
  table: DocumentTable;
  summary: (doc: T) => DocumentSummary;
}

function read<T>({ key, seed }: CollectionOptions<T>): T[] {
  try {
    const seededKey = `${key}-seeded`;
    if (seed && !window.localStorage.getItem(seededKey)) {
      window.localStorage.setItem(seededKey, "1");
      window.localStorage.setItem(key, JSON.stringify(seed()));
    }
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, docs: T[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(docs));
    window.dispatchEvent(new CustomEvent("stored-collection-change", { detail: key }));
  } catch {
    /* armazenamento indisponível (modo privado) */
  }
}

/** Próximo número no formato AAAA/NNNN, reiniciando a sequência a cada ano. */
export function nextDocumentNumber(existing: string[], year = new Date().getFullYear()) {
  const prefix = `${year}/`;
  const max = existing
    .filter((number) => number.startsWith(prefix))
    .map((number) => Number.parseInt(number.slice(prefix.length), 10))
    .filter(Number.isFinite)
    .reduce((acc, value) => Math.max(acc, value), 0);
  return `${prefix}${String(max + 1).padStart(4, "0")}`;
}

export function useStoredCollection<T extends StoredDoc>(options: CollectionOptions<T>) {
  const remote = useSupabaseCollection(options);
  const local = useLocalCollection(options);
  return isSupabaseConfigured ? remote : local;
}

/* ------------------------------- Supabase --------------------------------- */

/** Cache por tabela, compartilhado entre telas: o que acabou de ser salvo já aparece na próxima página. */
const cache = new Map<DocumentTable, { docs: StoredDoc[]; loading?: Promise<void> }>();
const REMOTE_EVENT = "remote-collection-change";

function emit(table: DocumentTable) {
  window.dispatchEvent(new CustomEvent(REMOTE_EVENT, { detail: table }));
}

function failed(action: string) {
  window.alert(`Não foi possível ${action} no banco de dados. Verifique sua conexão e tente novamente.`);
}

/** Envia uma única vez os documentos criados no navegador antes da ligação com o Supabase. */
async function migrateLocal<T extends StoredDoc>({ key, table, summary }: CollectionOptions<T>, existing: StoredDoc[]) {
  const flag = `${key}-migrated`;
  try {
    if (window.localStorage.getItem(flag)) return [];
    const raw = window.localStorage.getItem(key);
    const known = new Set(existing.flatMap((doc) => [doc.id, doc.number]));
    const pending = ((raw ? JSON.parse(raw) : []) as (T & { isDemo?: boolean })[]).filter((doc) => !doc.isDemo && !known.has(doc.id) && !known.has(doc.number));
    const sent: T[] = [];
    for (const doc of pending) {
      await upsertDocument(table, doc, summary(doc)).then(
        () => sent.push(doc),
        () => undefined,
      );
    }
    // Só marca como enviado quando tudo deu certo; o que falhou é tentado de novo no próximo acesso.
    if (sent.length === pending.length) window.localStorage.setItem(flag, "1");
    return sent;
  } catch {
    return [];
  }
}

function useSupabaseCollection<T extends StoredDoc>(options: CollectionOptions<T>) {
  const { table, summary } = options;
  const [docs, setDocs] = useState<T[]>(() => (cache.get(table)?.docs as T[] | undefined) ?? []);
  const [ready, setReady] = useState(() => Boolean(cache.get(table) && !cache.get(table)?.loading));

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const sync = () => {
      const entry = cache.get(table);
      if (!entry || entry.loading) return;
      setDocs(entry.docs as T[]);
      setReady(true);
    };
    const onChange = (event: Event) => {
      if (event instanceof CustomEvent && event.detail === table) sync();
    };
    window.addEventListener(REMOTE_EVENT, onChange);
    if (!cache.has(table)) {
      const entry: { docs: StoredDoc[]; loading?: Promise<void> } = { docs: [] };
      entry.loading = fetchDocuments<T>(table)
        .then(async (loaded) => {
          entry.docs = [...loaded, ...(await migrateLocal(options, loaded))];
        })
        .catch(() => failed("carregar os documentos"))
        .finally(() => {
          entry.loading = undefined;
          emit(table);
        });
      cache.set(table, entry);
    }
    sync();
    return () => window.removeEventListener(REMOTE_EVENT, onChange);
    // As opções são estáticas por coleção.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  const save = useCallback(
    (doc: T) => {
      const entry = cache.get(table) ?? { docs: [] };
      const updated = { ...doc, updatedAt: new Date().toISOString() };
      const exists = entry.docs.some((item) => item.id === doc.id);
      entry.docs = exists ? entry.docs.map((item) => (item.id === doc.id ? updated : item)) : [updated, ...entry.docs];
      cache.set(table, entry);
      emit(table);
      upsertDocument(table, updated, summary(updated)).catch(() => failed("salvar o documento"));
      return updated;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [table],
  );

  const remove = useCallback(
    (id: string) => {
      const entry = cache.get(table);
      if (entry) entry.docs = entry.docs.filter((item) => item.id !== id);
      emit(table);
      deleteDocument(table, id).catch(() => failed("excluir o documento"));
    },
    [table],
  );

  const getNextNumber = useCallback(() => nextDocumentNumber((cache.get(table)?.docs ?? []).map((item) => item.number)), [table]);

  const sorted = [...docs].sort((a, b) => b.number.localeCompare(a.number));

  return { docs: sorted, ready, save, remove, getNextNumber };
}

/* --------------------------- Navegador (demonstração) --------------------- */

function useLocalCollection<T extends StoredDoc>(options: CollectionOptions<T>) {
  const { key } = options;
  const [docs, setDocs] = useState<T[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isSupabaseConfigured) return;
    const sync = () => {
      setDocs(read(options));
      setReady(true);
    };
    sync();
    const onChange = (event: Event) => {
      if (!(event instanceof CustomEvent) || event.detail === key) sync();
    };
    window.addEventListener("stored-collection-change", onChange);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("stored-collection-change", onChange);
      window.removeEventListener("storage", sync);
    };
    // As opções são estáticas por coleção.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const save = useCallback(
    (doc: T) => {
      const current = read(options);
      const updated = { ...doc, updatedAt: new Date().toISOString() };
      const exists = current.some((item) => item.id === doc.id);
      write(key, exists ? current.map((item) => (item.id === doc.id ? updated : item)) : [updated, ...current]);
      return updated;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );

  const remove = useCallback((id: string) => write(key, read(options).filter((item) => item.id !== id)), [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const getNextNumber = useCallback(() => nextDocumentNumber(read(options).map((item) => item.number)), [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const sorted = [...docs].sort((a, b) => b.number.localeCompare(a.number));

  return { docs: sorted, ready, save, remove, getNextNumber };
}
