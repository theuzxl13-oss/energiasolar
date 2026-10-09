import { formatDate, generateId, onlyDigits } from "@/lib/utils";
import type { Lead, Quote, QuoteHighlight, QuoteItem, QuoteStatus, ServiceType } from "@/types";

/* ---------------------------------------------------------------------------
 * Regras dos orçamentos emitidos pelo painel: modelos por serviço, totais,
 * numeração e formatação. Os itens e textos padrão são pontos de partida —
 * ajuste preços e descrições a cada proposta.
 * ------------------------------------------------------------------------- */

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  aprovado: "Aprovado",
  recusado: "Recusado",
};

/* --------------------------------- Totais --------------------------------- */

export const itemTotal = (item: QuoteItem) => item.quantity * item.unitPrice;

export function quoteTotals(quote: Pick<Quote, "items" | "discount">) {
  const subtotal = quote.items.reduce((acc, item) => acc + itemTotal(item), 0);
  const discount = Math.min(Math.max(quote.discount, 0), subtotal);
  return { subtotal, discount, total: subtotal - discount };
}

/** Data de validade (emissão + dias). */
export function quoteValidUntil(quote: Pick<Quote, "issueDate" | "validityDays">) {
  const date = new Date(`${quote.issueDate}T12:00:00`);
  date.setDate(date.getDate() + quote.validityDays);
  return date;
}

export function isQuoteExpired(quote: Quote) {
  return quote.status === "enviado" && quoteValidUntil(quote).getTime() < Date.now();
}

/* ------------------------------ Modelos por serviço ----------------------- */

type ItemSeed = [description: string, quantity: number, unit: string];

const DEFAULT_ITEMS: Record<ServiceType, ItemSeed[]> = {
  energia_solar: [
    ["Módulo fotovoltaico 550 W", 12, "un"],
    ["Inversor solar on-grid 6 kW", 1, "un"],
    ["Estrutura de fixação para telhado", 1, "cj"],
    ["String box, cabos e conectores", 1, "cj"],
    ["Projeto, homologação na concessionária, instalação e ART", 1, "vb"],
  ],
  carregador_residencial: [
    ["Carregador wallbox AC 7,4 kW", 1, "un"],
    ["Quadro de proteção dedicado (DR + disjuntor)", 1, "un"],
    ["Cabeamento e infraestrutura até a vaga", 1, "vb"],
    ["Instalação, testes e ART", 1, "vb"],
  ],
  carregador_empresarial: [
    ["Carregador AC 22 kW", 2, "un"],
    ["Quadro de distribuição e proteções", 1, "un"],
    ["Cabeamento e infraestrutura", 1, "vb"],
    ["Sinalização das vagas", 2, "un"],
    ["Instalação, comissionamento e ART", 1, "vb"],
  ],
  condominio: [
    ["Infraestrutura coletiva de recarga", 1, "vb"],
    ["Medição individualizada por vaga", 1, "cj"],
    ["Ponto de recarga AC 7,4 kW", 1, "un"],
    ["Projeto elétrico e ART", 1, "vb"],
  ],
  eletroposto: [
    ["Carregador DC 60 kW", 1, "un"],
    ["Carregador AC 22 kW", 1, "un"],
    ["Quadro geral e proteções", 1, "un"],
    ["Software de gestão e pagamento (implantação)", 1, "vb"],
    ["Obra civil, sinalização e comunicação visual", 1, "vb"],
    ["Projeto, instalação, comissionamento e ART", 1, "vb"],
  ],
  frota: [
    ["Carregador para frota", 4, "un"],
    ["Quadro de distribuição e proteções", 1, "un"],
    ["Software de gestão de recarga", 1, "vb"],
    ["Instalação, comissionamento e ART", 1, "vb"],
  ],
  manutencao: [
    ["Visita técnica preventiva", 1, "un"],
    ["Limpeza dos módulos fotovoltaicos", 1, "vb"],
    ["Inspeção elétrica e termográfica", 1, "vb"],
    ["Relatório técnico", 1, "un"],
  ],
  outro: [["Serviço", 1, "vb"]],
};

const DEFAULT_DESCRIPTION: Record<ServiceType, string> = {
  energia_solar:
    "Apresentamos nossa proposta para a implantação de um sistema de energia solar fotovoltaica conectado à rede, dimensionado a partir do seu histórico de consumo. A solução inclui projeto, homologação junto à concessionária, fornecimento dos equipamentos e instalação completa.",
  carregador_residencial:
    "Apresentamos nossa proposta para a instalação de carregador residencial (wallbox) para veículo elétrico, com circuito dedicado e proteções conforme as normas técnicas, para recarregar seu veículo com segurança e praticidade.",
  carregador_empresarial:
    "Apresentamos nossa proposta para a instalação de pontos de recarga para veículos elétricos na sua empresa, atendendo colaboradores, clientes e visitantes com segurança e gestão de uso.",
  condominio:
    "Apresentamos nossa proposta para a implantação de infraestrutura de recarga de veículos elétricos no condomínio, com medição individualizada para que cada morador pague apenas pela energia que utilizar.",
  eletroposto:
    "Apresentamos nossa proposta para a implantação de eletroposto, com carregadores de recarga rápida, software de gestão e pagamento e toda a infraestrutura elétrica e civil necessária.",
  frota:
    "Apresentamos nossa proposta para a infraestrutura de recarga da sua frota elétrica, dimensionada para a rotina de operação dos veículos e com gestão centralizada do consumo.",
  manutencao:
    "Apresentamos nossa proposta de manutenção preventiva para o seu sistema, garantindo o máximo desempenho, segurança e vida útil dos equipamentos.",
  outro: "Apresentamos nossa proposta para os serviços descritos abaixo.",
};

const DEFAULT_HIGHLIGHTS: Partial<Record<ServiceType, string[]>> = {
  energia_solar: ["Potência do sistema", "Geração estimada", "Economia estimada"],
  carregador_residencial: ["Potência do carregador", "Tempo de recarga"],
  carregador_empresarial: ["Pontos de recarga", "Potência por ponto"],
  condominio: ["Vagas atendidas", "Potência por ponto"],
  eletroposto: ["Potência instalada", "Pontos de recarga"],
  frota: ["Veículos atendidos", "Potência instalada"],
};

const DEFAULT_WARRANTY: Record<ServiceType, string> = {
  energia_solar: "Módulos: 12 anos contra defeitos e 25 anos de performance (fabricante). Inversor: 10 anos (fabricante). Instalação: 12 meses.",
  carregador_residencial: "Carregador: conforme fabricante. Instalação: 12 meses.",
  carregador_empresarial: "Carregadores: conforme fabricante. Instalação: 12 meses.",
  condominio: "Equipamentos: conforme fabricante. Instalação: 12 meses.",
  eletroposto: "Carregadores: conforme fabricante. Instalação e obra: 12 meses.",
  frota: "Carregadores: conforme fabricante. Instalação: 12 meses.",
  manutencao: "Serviços executados: 90 dias.",
  outro: "Serviços executados: 90 dias.",
};

export function defaultItems(service: ServiceType): QuoteItem[] {
  return DEFAULT_ITEMS[service].map(([description, quantity, unit]) => ({ id: generateId("it"), description, quantity, unit, unitPrice: 0 }));
}

export function defaultHighlights(service: ServiceType): QuoteHighlight[] {
  return (DEFAULT_HIGHLIGHTS[service] ?? []).map((label) => ({ label, value: "" }));
}

/** Campos que dependem do serviço — reaplicados ao trocar o serviço de um orçamento ainda não editado. */
export function serviceDefaults(service: ServiceType) {
  return {
    description: DEFAULT_DESCRIPTION[service],
    highlights: defaultHighlights(service),
    items: defaultItems(service),
    warranty: DEFAULT_WARRANTY[service],
    executionDays: service === "eletroposto" ? 90 : service === "energia_solar" ? 45 : service === "manutencao" ? 7 : 20,
  };
}

/* ------------------------------ Criação e cópia --------------------------- */

function nextNumber(existing: Quote[]) {
  const year = new Date().getFullYear();
  const used = existing.map((item) => item.number.match(new RegExp(`^${year}/(\\d+)$`))?.[1]).filter(Boolean).map(Number);
  return `${year}/${String((used.length ? Math.max(...used) : 0) + 1).padStart(4, "0")}`;
}

export function createQuote(existing: Quote[], service: ServiceType = "energia_solar"): Quote {
  const now = new Date().toISOString();
  return {
    id: generateId("orc"),
    number: nextNumber(existing),
    title: "",
    service,
    status: "rascunho",
    client: { name: "", document: "", phone: "", email: "", address: "", city: "", state: "" },
    installAddress: "",
    ...serviceDefaults(service),
    discount: 0,
    paymentTerms: "50% de entrada na aprovação e 50% na conclusão, via PIX ou transferência. Consulte condições de financiamento e parcelamento no cartão.",
    validityDays: 15,
    notes: "",
    issueDate: now.slice(0, 10),
    createdAt: now,
    updatedAt: now,
  };
}

/** Pré-preenche um novo orçamento com os dados de um lead. */
export function createQuoteFromLead(existing: Quote[], lead: Lead): Quote {
  const quote = createQuote(existing, lead.service);
  return {
    ...quote,
    leadId: lead.id,
    client: { ...quote.client, name: lead.name, phone: lead.phone, email: lead.email, city: lead.city, state: lead.state },
    notes: lead.averageBill ? `Conta de energia média informada: R$ ${lead.averageBill.toLocaleString("pt-BR")}/mês.` : "",
  };
}

export function duplicateQuote(existing: Quote[], source: Quote): Quote {
  const now = new Date().toISOString();
  return {
    ...structuredClone(source),
    id: generateId("orc"),
    number: nextNumber(existing),
    status: "rascunho",
    issueDate: now.slice(0, 10),
    createdAt: now,
    updatedAt: now,
  };
}

/* -------------------------------- Formatação ------------------------------ */

/** Máscara de CPF (11 dígitos) ou CNPJ (14 dígitos). */
export function maskDocument(value: string) {
  const d = onlyDigits(value).slice(0, 14);
  if (d.length <= 11) {
    return d.replace(/^(\d{3})(\d)/, "$1.$2").replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1-$2");
  }
  return d.replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2");
}

export const formatIsoDate = (isoDate: string) => formatDate(`${isoDate}T12:00:00`);

/** Quantidade sem casas desnecessárias: 12 → "12", 6.6 → "6,6". */
export const formatQuantity = (value: number) => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value);
