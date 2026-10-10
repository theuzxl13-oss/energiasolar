"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Coleção de documentos salva no navegador (MODO DEMONSTRAÇÃO).
 * Usada por orçamentos e contratos. Em produção, troque leitura/gravação por
 * chamadas à API/Supabase — a interface do hook continua a mesma.
 */

interface StoredDoc {
  id: string;
  number: string;
  updatedAt: string;
}

export interface CollectionOptions<T> {
  /** Chave no armazenamento local. */
  key: string;
  /** Documentos de exemplo incluídos uma única vez, no primeiro acesso. */
  seed?: () => T[];
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
  const { key } = options;
  const [docs, setDocs] = useState<T[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
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
