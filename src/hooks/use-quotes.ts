"use client";

import { useCallback, useEffect, useState } from "react";
import { nextQuoteNumber, sampleQuote, type Quote } from "@/lib/quotes";

/**
 * Armazenamento dos orçamentos no MODO DEMONSTRAÇÃO (navegador).
 * Em produção, substitua as funções abaixo por chamadas à API/Supabase
 * (tabela `quotes`, ver supabase/schema.sql) — a interface do hook se mantém.
 */

const QUOTES_KEY = "demo:quotes";
const SEEDED_KEY = "demo:quotes-seeded";
const EVENT = "demo-quotes-change";

function readQuotes(): Quote[] {
  try {
    if (!window.localStorage.getItem(SEEDED_KEY)) {
      // Primeiro acesso: inclui o orçamento de exemplo uma única vez.
      window.localStorage.setItem(SEEDED_KEY, "1");
      window.localStorage.setItem(QUOTES_KEY, JSON.stringify([sampleQuote()]));
    }
    const raw = window.localStorage.getItem(QUOTES_KEY);
    return raw ? (JSON.parse(raw) as Quote[]) : [];
  } catch {
    return [];
  }
}

function writeQuotes(quotes: Quote[]) {
  try {
    window.localStorage.setItem(QUOTES_KEY, JSON.stringify(quotes));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* armazenamento indisponível (modo privado) */
  }
}

export function useQuotes() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      setQuotes(readQuotes());
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

  const saveQuote = useCallback((quote: Quote) => {
    const current = readQuotes();
    const updated = { ...quote, updatedAt: new Date().toISOString() };
    const exists = current.some((item) => item.id === quote.id);
    writeQuotes(exists ? current.map((item) => (item.id === quote.id ? updated : item)) : [updated, ...current]);
    return updated;
  }, []);

  const deleteQuote = useCallback((id: string) => {
    writeQuotes(readQuotes().filter((item) => item.id !== id));
  }, []);

  const getNextNumber = useCallback(() => nextQuoteNumber(readQuotes().map((item) => item.number)), []);

  const sorted = [...quotes].sort((a, b) => b.number.localeCompare(a.number));

  return { quotes: sorted, ready, saveQuote, deleteQuote, getNextNumber };
}
