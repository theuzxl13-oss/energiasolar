/* ---------------------------------------------------------------------------
 * Tipos de domínio compartilhados entre frontend, rotas de API e serviços.
 * ------------------------------------------------------------------------- */

export type IconName =
  | "sun"
  | "zap"
  | "plug"
  | "car"
  | "home"
  | "building"
  | "factory"
  | "tractor"
  | "store"
  | "hotel"
  | "parking"
  | "fuel"
  | "cart"
  | "truck"
  | "leaf"
  | "chart"
  | "shield"
  | "wrench"
  | "gauge"
  | "battery"
  | "users"
  | "route"
  | "briefcase"
  | "clipboard"
  | "cpu"
  | "settings"
  | "handshake"
  | "trending"
  | "map"
  | "monitor"
  | "headset"
  | "calendar"
  | "award"
  | "search"
  | "file"
  | "hardhat"
  | "check"
  | "coins"
  | "smartphone"
  | "network"
  | "highway";

export interface CompanyStat {
  id: string;
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  icon: IconName;
  /** Quando verdadeiro, o valor é exibido com selo de dado demonstrativo. */
  isDemo: boolean;
}

export interface FeatureItem {
  title: string;
  description: string;
  icon: IconName;
}

export interface ProcessStep {
  step: number;
  title: string;
  description: string;
  icon: IconName;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: "solar" | "carregadores" | "eletropostos" | "geral";
}

export type ProjectCategory = "solar" | "carregadores" | "eletropostos";

export interface Project {
  slug: string;
  title: string;
  category: ProjectCategory;
  segment: string;
  location: string;
  power: string;
  summary: string;
  description: string;
  result: string;
  estimatedSavings: string;
  technicalInfo: { label: string; value: string }[];
  highlights: string[];
  /** Variante da ilustração vetorial usada como imagem do projeto. */
  art: "solar-home" | "solar-commercial" | "solar-industrial" | "wallbox" | "condo" | "station";
  /** Caminho opcional para foto real em /public. Tem prioridade sobre a ilustração. */
  image?: string;
  isDemo: boolean;
}

export interface Testimonial {
  id: string;
  author: string;
  role: string;
  content: string;
  rating: number;
  service: string;
  source: "demo" | "google" | "manual";
}

/* ----------------------------------- Leads -------------------------------- */

export const LEAD_STATUSES = [
  "novo",
  "em_contato",
  "orcamento_enviado",
  "negociacao",
  "fechado",
  "perdido",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const SERVICE_TYPES = [
  "energia_solar",
  "carregador_residencial",
  "carregador_empresarial",
  "condominio",
  "eletroposto",
  "frota",
  "manutencao",
  "outro",
] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export const CLIENT_TYPES = ["pessoa_fisica", "empresa", "condominio", "produtor_rural", "poder_publico"] as const;
export type ClientType = (typeof CLIENT_TYPES)[number];

export const PROPERTY_TYPES = ["residencial", "comercial", "industrial", "rural", "condominio", "outro"] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export type LeadSource = "orcamento" | "contato" | "simulador_solar" | "simulador_carregador" | "chat";

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  /** `null` quando não informado (ex.: formulário de contato simplificado). */
  clientType: ClientType | null;
  service: ServiceType;
  propertyType: PropertyType | null;
  averageBill: number | null;
  evCount: number | null;
  message: string;
  source: LeadSource;
  status: LeadStatus;
  createdAt: string;
  /** Dados adicionais (ex.: resultado do simulador). */
  metadata?: Record<string, string | number | boolean | null>;
}

/* ------------------------------------ Chat -------------------------------- */

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/* --------------------------- Orçamentos emitidos -------------------------- */

export const QUOTE_STATUSES = ["rascunho", "enviado", "aprovado", "recusado"] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  /** Unidade exibida (un, kWp, m, vb…). */
  unit: string;
  unitPrice: number;
}

/** Indicador de destaque no topo do orçamento (ex.: "Potência" → "6,6 kWp"). Vazio = oculto. */
export interface QuoteHighlight {
  label: string;
  value: string;
}

export interface Quote {
  id: string;
  /** Número sequencial exibido no documento (ex.: 2026/0001). */
  number: string;
  title: string;
  service: ServiceType;
  status: QuoteStatus;
  client: {
    name: string;
    /** CPF ou CNPJ (opcional no orçamento). */
    document: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
  };
  /** Endereço onde o serviço será executado. */
  installAddress: string;
  /** Texto de apresentação / descrição da solução. */
  description: string;
  highlights: QuoteHighlight[];
  items: QuoteItem[];
  /** Desconto em R$ sobre o subtotal. */
  discount: number;
  paymentTerms: string;
  executionDays: number;
  validityDays: number;
  warranty: string;
  notes: string;
  issueDate: string;
  leadId?: string;
  createdAt: string;
  updatedAt: string;
}

/* --------------------------------- Contratos ------------------------------ */

export const CONTRACT_STATUSES = ["rascunho", "emitido", "assinado", "cancelado"] as const;
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

/** Pagamento único (obra/instalação) ou recorrente (manutenção, O&M, gestão de eletroposto). */
export type ContractBilling = "unico" | "mensal";

export interface ContractClause {
  id: string;
  /** Título da seção (ex.: "OBJETO", "PREÇO E FORMA DE PAGAMENTO"). */
  title: string;
  /**
   * Texto da cláusula. Aceita variáveis entre chaves, substituídas na emissão
   * (ver CONTRACT_VARIABLES). Parágrafos são separados por linha em branco.
   */
  body: string;
}

export interface ContractParty {
  kind: "pf" | "pj";
  name: string;
  /** CPF ou CNPJ. */
  document: string;
  /** Representante legal (somente PJ). */
  representative: string;
  address: string;
  city: string;
  state: string;
  email: string;
  phone: string;
}

export interface Contract {
  id: string;
  /** Número sequencial exibido no documento (ex.: 2026/0001). */
  number: string;
  title: string;
  service: ServiceType;
  status: ContractStatus;
  client: ContractParty;
  /** Endereço onde o serviço será executado (instalação, obra). */
  installAddress: string;
  /** Descrição técnica: equipamentos, potência, quantidade de módulos/carregadores. */
  scope: string;
  billing: ContractBilling;
  /** Valor total (pagamento único) ou mensal (recorrente). */
  value: number;
  paymentTerms: string;
  /** Dia de vencimento (somente mensal). */
  dueDay: number;
  /** Prazo de execução em dias (pagamento único). */
  executionDays: number;
  /** Garantia do serviço de instalação, em meses. */
  warrantyMonths: number;
  /** Vigência em meses; `null` = prazo indeterminado (somente mensal). */
  durationMonths: number | null;
  startDate: string;
  /** Cidade/UF do foro e da assinatura. */
  forum: string;
  clauses: ContractClause[];
  leadId?: string;
  createdAt: string;
  updatedAt: string;
}
