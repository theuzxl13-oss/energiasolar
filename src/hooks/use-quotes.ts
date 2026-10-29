"use client";

import { quoteTotals, sampleQuote, type Quote } from "@/lib/quotes";
import { useStoredCollection } from "./use-stored-collection";

/** Orçamentos (no Supabase; sem ele, salvos no navegador). */
export function useQuotes() {
  const { docs, ready, save, remove, getNextNumber } = useStoredCollection<Quote>({ key: "demo:quotes", seed: () => [sampleQuote()], table: "quotes", summary: (quote) => ({ number: quote.number, status: quote.status, title: quote.title, clientName: quote.client.name, total: quoteTotals(quote).total }) });
  return { quotes: docs, ready, saveQuote: save, deleteQuote: remove, getNextNumber };
}
