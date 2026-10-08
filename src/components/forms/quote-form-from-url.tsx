"use client";

import { useSearchParams } from "next/navigation";
import { SERVICE_QUERY_ALIASES } from "@/lib/labels";
import { STATE_UFS } from "@/lib/brazil";
import { PROPERTY_TYPES, type PropertyType } from "@/types";
import { QuoteForm, type QuoteFormDefaults } from "./quote-form";

function read(params: URLSearchParams, key: string) {
  return params.get(key)?.slice(0, 200) ?? undefined;
}

/** Converte os parâmetros da URL (vindos dos simuladores/CTAs) em valores iniciais do formulário. */
export function parseQuoteDefaults(params: URLSearchParams): QuoteFormDefaults {
  const service = SERVICE_QUERY_ALIASES[read(params, "servico") ?? ""];
  const state = read(params, "uf")?.toUpperCase();
  const property = read(params, "imovel") as PropertyType | undefined;
  const bill = Number(read(params, "conta"));
  const solution = read(params, "solucao");
  const vehicles = Number(read(params, "veiculos"));

  return {
    service,
    state: state && STATE_UFS.includes(state) ? state : undefined,
    city: read(params, "cidade"),
    propertyType: property && PROPERTY_TYPES.includes(property) ? property : undefined,
    averageBill: Number.isFinite(bill) && bill > 0 ? String(Math.round(bill)) : undefined,
    evCount: Number.isFinite(vehicles) && vehicles > 0 ? String(Math.round(vehicles)) : undefined,
    message: solution ? `Recomendação do simulador: ${solution}.` : undefined,
  };
}

/**
 * Lê os parâmetros no navegador, permitindo que a página de orçamento seja
 * estática (compatível com hospedagem estática como o GitHub Pages).
 */
export function QuoteFormFromUrl() {
  const params = useSearchParams();
  return <QuoteForm key={params.toString()} defaults={parseQuoteDefaults(new URLSearchParams(params.toString()))} />;
}
