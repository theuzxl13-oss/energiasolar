"use client";

import { sampleQuote, type Quote } from "@/lib/quotes";
import { useStoredCollection } from "./use-stored-collection";

/** Orçamentos (modo demonstração: salvos no navegador). */
export function useQuotes() {
  const { docs, ready, save, remove, getNextNumber } = useStoredCollection<Quote>({ key: "demo:quotes", seed: () => [sampleQuote()] });
  return { quotes: docs, ready, saveQuote: save, deleteQuote: remove, getNextNumber };
}
