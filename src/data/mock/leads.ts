import type { ClientType, Lead, LeadSource, LeadStatus, PropertyType, ServiceType } from "@/types";

/**
 * LEADS FICTÍCIOS PARA O PAINEL DEMONSTRATIVO
 * Gerados de forma determinística (mesmo resultado no servidor e no cliente).
 * Nomes, telefones e e-mails são inventados e não pertencem a pessoas reais.
 */

const FIRST_NAMES = ["Ana", "Bruno", "Carla", "Diego", "Elisa", "Fábio", "Gabriela", "Henrique", "Isabela", "João", "Larissa", "Marcos", "Natália", "Otávio", "Paula", "Rafael", "Sabrina", "Tiago", "Vanessa", "William"];
const LAST_NAMES = ["Almeida", "Barbosa", "Cardoso", "Duarte", "Ferreira", "Gomes", "Lima", "Martins", "Nogueira", "Oliveira", "Pereira", "Ribeiro", "Santos", "Teixeira", "Vieira"];
const LOCATIONS: [string, string][] = [
  ["São Paulo", "SP"], ["Campinas", "SP"], ["Belo Horizonte", "MG"], ["Uberlândia", "MG"], ["Curitiba", "PR"],
  ["Londrina", "PR"], ["Goiânia", "GO"], ["Brasília", "DF"], ["Salvador", "BA"], ["Recife", "PE"],
  ["Fortaleza", "CE"], ["Florianópolis", "SC"], ["Porto Alegre", "RS"], ["Rio de Janeiro", "RJ"], ["Cuiabá", "MT"],
];

const SERVICE_WEIGHTS: ServiceType[] = [
  "energia_solar", "energia_solar", "energia_solar", "energia_solar", "energia_solar",
  "carregador_residencial", "carregador_residencial", "carregador_empresarial",
  "condominio", "eletroposto", "eletroposto", "frota", "manutencao", "outro",
];
const STATUS_WEIGHTS: LeadStatus[] = [
  "novo", "novo", "novo", "em_contato", "em_contato", "orcamento_enviado", "orcamento_enviado",
  "negociacao", "fechado", "fechado", "perdido",
];
const SOURCES: LeadSource[] = ["orcamento", "orcamento", "simulador_solar", "simulador_carregador", "contato", "chat"];

const MESSAGES: Partial<Record<ServiceType, string>> = {
  energia_solar: "Gostaria de um orçamento para reduzir a conta de energia. Telhado com boa insolação.",
  carregador_residencial: "Comprei um carro elétrico e preciso instalar um wallbox na garagem.",
  carregador_empresarial: "Queremos oferecer recarga para colaboradores no estacionamento da empresa.",
  condominio: "O condomínio aprovou estudo para instalação de carregadores nas vagas.",
  eletroposto: "Tenho um estabelecimento às margens da rodovia e quero avaliar um eletroposto.",
  frota: "Estamos eletrificando parte da frota de entregas e precisamos de infraestrutura.",
  manutencao: "Preciso de manutenção preventiva no sistema solar instalado há 4 anos.",
  outro: "Gostaria de conversar sobre soluções de eficiência energética.",
};

function clientTypeFor(service: ServiceType, index: number): ClientType {
  if (service === "condominio") return "condominio";
  if (service === "eletroposto" || service === "frota" || service === "carregador_empresarial") return "empresa";
  if (service === "energia_solar" && index % 6 === 0) return "produtor_rural";
  return index % 3 === 0 ? "empresa" : "pessoa_fisica";
}

function propertyTypeFor(client: ClientType, index: number): PropertyType {
  switch (client) {
    case "condominio":
      return "condominio";
    case "produtor_rural":
      return "rural";
    case "empresa":
      return index % 4 === 0 ? "industrial" : "comercial";
    default:
      return "residencial";
  }
}

/** Data base fixa para manter os dados estáveis entre renderizações. */
const BASE_DATE = Date.UTC(2026, 9, 6, 15, 0, 0);
const DAY = 86_400_000;

function buildMockLeads(count: number): Lead[] {
  return Array.from({ length: count }, (_, index) => {
    const first = FIRST_NAMES[(index * 7) % FIRST_NAMES.length]!;
    const last = LAST_NAMES[(index * 11) % LAST_NAMES.length]!;
    const [city, state] = LOCATIONS[(index * 5) % LOCATIONS.length]!;
    const service = SERVICE_WEIGHTS[(index * 3) % SERVICE_WEIGHTS.length]!;
    // Leads mais recentes tendem a estar no início do funil.
    const status: LeadStatus = index < 6 ? "novo" : STATUS_WEIGHTS[(index * 5) % STATUS_WEIGHTS.length]!;
    const clientType = clientTypeFor(service, index);
    const daysAgo = Math.floor(index * 3.7 + (index % 4));
    const createdAt = new Date(BASE_DATE - daysAgo * DAY - (index % 9) * 3_600_000).toISOString();
    const averageBill = service === "energia_solar" || service === "manutencao" ? 250 + ((index * 137) % 2400) : null;
    const evCount = service.startsWith("carregador") || service === "condominio" || service === "frota" || service === "eletroposto" ? 1 + ((index * 3) % 8) : null;

    return {
      id: `demo_${String(index + 1).padStart(3, "0")}`,
      name: `${first} ${last}`,
      phone: `(00) 90000-${String(1000 + index * 37).slice(-4)}`,
      email: `${first.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")}.${last.toLowerCase()}@exemplo.com`,
      city,
      state,
      clientType,
      service,
      propertyType: propertyTypeFor(clientType, index),
      averageBill,
      evCount,
      message: MESSAGES[service] ?? "",
      source: SOURCES[index % SOURCES.length]!,
      status,
      createdAt,
      metadata: { demo: true },
    } satisfies Lead;
  });
}

export const mockLeads: Lead[] = buildMockLeads(48);
