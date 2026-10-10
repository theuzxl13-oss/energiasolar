/**
 * ============================================================================
 * ORÇAMENTOS — modelo de dados, cálculos e textos padrão
 * ============================================================================
 * Funções puras (sem acesso a armazenamento), reutilizáveis no editor, na
 * visualização/PDF e, futuramente, em rotas de servidor com Supabase.
 * ============================================================================
 */

export const QUOTE_STATUSES = ["rascunho", "enviado", "aprovado", "recusado"] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  aprovado: "Aprovado",
  recusado: "Recusado",
};

export const QUOTE_UNITS = ["un", "cj", "vb", "m", "m²", "kWp", "h", "pç"] as const;

export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

export interface Quote {
  id: string;
  /** Número sequencial no formato AAAA/NNNN. */
  number: string;
  title: string;
  /** Datas no formato ISO (AAAA-MM-DD). */
  issueDate: string;
  validUntil: string;
  status: QuoteStatus;
  leadId: string | null;
  client: {
    name: string;
    phone: string;
    email: string;
    address: string;
    installationAddress: string;
  };
  presentation: string;
  highlights: {
    power: string;
    generation: string;
    savings: string;
  };
  items: QuoteItem[];
  discount: number;
  conditions: {
    payment: string;
    deadline: string;
    validity: string;
    warranty: string;
    notes: string;
  };
  /** Orçamento de exemplo (modo demonstração). */
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

/* --------------------------------- Cálculos -------------------------------- */

export const lineTotal = (item: QuoteItem) => roundMoney((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0));

export function quoteTotals(quote: Pick<Quote, "items" | "discount">) {
  const subtotal = roundMoney(quote.items.reduce((sum, item) => sum + lineTotal(item), 0));
  const discount = Math.min(Math.max(Number(quote.discount) || 0, 0), subtotal);
  return { subtotal, discount, total: roundMoney(subtotal - discount) };
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

/* ---------------------------------- Datas ---------------------------------- */

export function todayIso() {
  const now = new Date();
  return toIsoDate(now);
}

export function addDaysIso(iso: string, days: number) {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

export function daysBetween(fromIso: string, toIso: string) {
  return Math.round((new Date(`${toIso}T12:00:00`).getTime() - new Date(`${fromIso}T12:00:00`).getTime()) / 86_400_000);
}

function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function formatIsoDate(iso: string) {
  if (!iso) return "—";
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

/** Texto padrão de validade, ex.: "15 dias (até 16/10/2026)." */
export function validityText(issueDate: string, validUntil: string) {
  const days = daysBetween(issueDate, validUntil);
  return `${days} dias (até ${formatIsoDate(validUntil)}).`;
}

/* ------------------------------- Numeração --------------------------------- */

/** Próximo número no formato AAAA/NNNN, reiniciando a sequência a cada ano. */
export function nextQuoteNumber(existing: string[], year = new Date().getFullYear()) {
  const prefix = `${year}/`;
  const max = existing
    .filter((number) => number.startsWith(prefix))
    .map((number) => Number.parseInt(number.slice(prefix.length), 10))
    .filter(Number.isFinite)
    .reduce((acc, value) => Math.max(acc, value), 0);
  return `${prefix}${String(max + 1).padStart(4, "0")}`;
}

/* ----------------------------- Valor por extenso ---------------------------- */

const UNITS = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
const TENS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const HUNDREDS = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];
const SCALES: [string, string][] = [
  ["", ""],
  ["mil", "mil"],
  ["milhão", "milhões"],
  ["bilhão", "bilhões"],
];

function below1000(value: number): string {
  if (value === 0) return "";
  if (value === 100) return "cem";
  const hundreds = Math.floor(value / 100);
  const rest = value % 100;
  const parts: string[] = [];
  if (hundreds) parts.push(HUNDREDS[hundreds]!);
  if (rest) {
    if (rest < 20) parts.push(UNITS[rest]!);
    else {
      const tens = Math.floor(rest / 10);
      const units = rest % 10;
      parts.push(units ? `${TENS[tens]} e ${UNITS[units]}` : TENS[tens]!);
    }
  }
  return parts.join(" e ");
}

/** Número inteiro por extenso (pt-BR). */
export function integerToWords(value: number): string {
  const n = Math.floor(Math.abs(value));
  if (n === 0) return "zero";

  const groups: number[] = [];
  for (let rest = n; rest > 0; rest = Math.floor(rest / 1000)) groups.push(rest % 1000);

  const pieces: { text: string; value: number }[] = [];
  for (let index = groups.length - 1; index >= 0; index -= 1) {
    const group = groups[index]!;
    if (!group) continue;
    const [singular, plural] = SCALES[index]!;
    const text = index === 1 && group === 1 ? "mil" : `${below1000(group)}${singular ? ` ${group === 1 ? singular : plural}` : ""}`;
    pieces.push({ text, value: group });
  }

  // "mil e quinhentos", "dois mil e trinta", mas "dois mil trezentos e quarenta".
  return pieces
    .map((piece, index) => {
      if (index === 0) return piece.text;
      const isLast = index === pieces.length - 1;
      const useE = isLast && (piece.value < 100 || piece.value % 100 === 0);
      return `${useE ? " e " : " "}${piece.text}`;
    })
    .join("");
}

/** Valor em reais por extenso, ex.: 24900 → "vinte e quatro mil e novecentos reais". */
export function currencyToWords(value: number): string {
  const cents = Math.round(Math.abs(value) * 100);
  const reais = Math.floor(cents / 100);
  const centavos = cents % 100;

  const parts: string[] = [];
  if (reais > 0) {
    const words = integerToWords(reais);
    // "um milhão de reais", "dois milhões de reais"
    const exactMillions = reais >= 1_000_000 && reais % 1_000_000 === 0;
    parts.push(`${words}${exactMillions ? " de" : ""} ${reais === 1 ? "real" : "reais"}`);
  }
  if (centavos > 0) parts.push(`${integerToWords(centavos)} ${centavos === 1 ? "centavo" : "centavos"}`);
  return parts.length ? parts.join(" e ") : "zero real";
}

/* ------------------------------- Textos padrão ------------------------------ */

export const DEFAULT_QUOTE_TEXTS = {
  presentation:
    "Apresentamos nossa proposta para a implantação de um sistema de energia solar fotovoltaica conectado à rede, dimensionado a partir do seu histórico de consumo. A solução inclui projeto, homologação junto à concessionária, fornecimento dos equipamentos e instalação completa.",
  payment:
    "50% de entrada na aprovação e 50% na conclusão, via PIX ou transferência. Consulte condições de financiamento e parcelamento no cartão.",
  deadline: "Até 45 dias após a aprovação e a liberação do local.",
  warranty:
    "Módulos: 12 anos contra defeitos e 25 anos de performance (fabricante). Inversor: 10 anos (fabricante). Instalação: 12 meses.",
  notes:
    "Valores de geração e economia são estimativas baseadas na irradiação média da região e na tarifa vigente, podendo variar conforme clima e regras tarifárias.",
};

export const DEFAULT_VALIDITY_DAYS = 15;

/** Orçamento em branco, já com textos padrão e datas preenchidas. */
export function emptyQuote(id: string, number: string): Quote {
  const issueDate = todayIso();
  const validUntil = addDaysIso(issueDate, DEFAULT_VALIDITY_DAYS);
  const now = new Date().toISOString();
  return {
    id,
    number,
    title: "",
    issueDate,
    validUntil,
    status: "rascunho",
    leadId: null,
    client: { name: "", phone: "", email: "", address: "", installationAddress: "" },
    presentation: DEFAULT_QUOTE_TEXTS.presentation,
    highlights: { power: "", generation: "", savings: "" },
    items: [{ id: `${id}-1`, description: "", quantity: 1, unit: "un", unitPrice: 0 }],
    discount: 0,
    conditions: {
      payment: DEFAULT_QUOTE_TEXTS.payment,
      deadline: DEFAULT_QUOTE_TEXTS.deadline,
      validity: validityText(issueDate, validUntil),
      warranty: DEFAULT_QUOTE_TEXTS.warranty,
      notes: DEFAULT_QUOTE_TEXTS.notes,
    },
    createdAt: now,
    updatedAt: now,
  };
}

/** Orçamento de exemplo (o mesmo do PDF modelo), exibido no modo demonstração. */
export function sampleQuote(): Quote {
  const issueDate = "2026-10-01";
  const validUntil = "2026-10-16";
  return {
    id: "demo-quote-0001",
    number: "2026/0001",
    title: "Sistema solar residencial 6,6 kWp",
    issueDate,
    validUntil,
    status: "enviado",
    leadId: null,
    client: {
      name: "Ana Ferreira (cliente fictícia)",
      phone: "(19) 90000-0000",
      email: "ana.ferreira@exemplo.com",
      address: "Rua Exemplo, 123 — Jardim Demonstração, Campinas/SP",
      installationAddress: "Rua Exemplo, 123 — Jardim Demonstração, Campinas/SP",
    },
    presentation: DEFAULT_QUOTE_TEXTS.presentation,
    highlights: { power: "6,6 kWp", generation: "≈ 820 kWh/mês", savings: "≈ R$ 690/mês" },
    items: [
      { id: "d1", description: "Módulo fotovoltaico 550 W", quantity: 12, unit: "un", unitPrice: 890 },
      { id: "d2", description: "Inversor solar on-grid 6 kW", quantity: 1, unit: "un", unitPrice: 5200 },
      { id: "d3", description: "Estrutura de fixação para telhado cerâmico", quantity: 1, unit: "cj", unitPrice: 1650 },
      { id: "d4", description: "String box, cabos e conectores", quantity: 1, unit: "cj", unitPrice: 1320 },
      { id: "d5", description: "Projeto, homologação na concessionária, instalação e ART", quantity: 1, unit: "vb", unitPrice: 6500 },
    ],
    discount: 450,
    conditions: {
      payment: DEFAULT_QUOTE_TEXTS.payment,
      deadline: DEFAULT_QUOTE_TEXTS.deadline,
      validity: validityText(issueDate, validUntil),
      warranty: DEFAULT_QUOTE_TEXTS.warranty,
      notes: DEFAULT_QUOTE_TEXTS.notes,
    },
    isDemo: true,
    createdAt: "2026-10-01T12:00:00.000Z",
    updatedAt: "2026-10-01T12:00:00.000Z",
  };
}
