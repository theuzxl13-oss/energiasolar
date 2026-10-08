import type { CompanyStat } from "@/types";

/**
 * Indicadores exibidos em "Por que escolher nossa empresa?".
 *
 * ATENÇÃO: os valores abaixo são ILUSTRATIVOS (isDemo: true) e aparecem no
 * site com o selo "dado demonstrativo". Substitua pelos números oficiais
 * da empresa e altere `isDemo` para `false` somente quando forem verificáveis.
 */
export const companyStats: CompanyStat[] = [
  { id: "projetos", value: 100, prefix: "+", suffix: "", label: "projetos realizados", icon: "briefcase", isDemo: true },
  { id: "kwp", value: 1000, prefix: "+", suffix: " kWp", label: "de potência instalada", icon: "sun", isDemo: true },
  { id: "carregadores", value: 50, prefix: "+", suffix: "", label: "carregadores instalados", icon: "plug", isDemo: true },
  { id: "co2", value: 500, prefix: "+", suffix: " t", label: "de CO₂ evitadas por ano", icon: "leaf", isDemo: true },
];
