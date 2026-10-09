"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { mockQuotes } from "@/data/mock/quotes";
import type { Quote } from "@/types";

/**
 * Armazenamento local dos orçamentos emitidos no MODO DEMONSTRAÇÃO (mesmo
 * padrão de `use-demo-leads`). Em produção, substitua pela tabela `quotes` do Supabase.
 */

const QUOTES_KEY = "demo:quotes";
/** IDs de orçamentos fictícios removidos pelo usuário. */
const HIDDEN_KEY = "demo:quotes-hidden";
const EVENT = "demo-quotes-change";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* armazenamento indisponível (modo privado) — ignora */
  }
}

export function useDemoQuotes() {
  const [local, setLocal] = useState<Quote[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      setLocal(read<Quote[]>(QUOTES_KEY, []));
      setHidden(read<string[]>(HIDDEN_KEY, []));
      setReady(true);
    };
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const quotes = useMemo(() => {
    // Um orçamento salvo localmente substitui o fictício de mesmo id (edição).
    const localIds = new Set(local.map((item) => item.id));
    const mocks = mockQuotes.filter((item) => !localIds.has(item.id) && !hidden.includes(item.id));
    return [...local, ...mocks].sort((a, b) => b.number.localeCompare(a.number));
  }, [local, hidden]);

  const saveQuote = useCallback((quote: Quote) => {
    const current = read<Quote[]>(QUOTES_KEY, []);
    write(QUOTES_KEY, [{ ...quote, updatedAt: new Date().toISOString() }, ...current.filter((item) => item.id !== quote.id)]);
  }, []);

  const removeQuote = useCallback((id: string) => {
    write(QUOTES_KEY, read<Quote[]>(QUOTES_KEY, []).filter((item) => item.id !== id));
    if (mockQuotes.some((item) => item.id === id)) write(HIDDEN_KEY, [...read<string[]>(HIDDEN_KEY, []), id]);
  }, []);

  return { quotes, ready, saveQuote, removeQuote };
}
