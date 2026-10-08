import type { ClientType, LeadSource, LeadStatus, PropertyType, ServiceType } from "@/types";

export const SERVICE_LABELS: Record<ServiceType, string> = {
  energia_solar: "Energia Solar",
  carregador_residencial: "Carregador Residencial",
  carregador_empresarial: "Carregador Empresarial",
  condominio: "Condomínio",
  eletroposto: "Eletroposto",
  frota: "Projeto para Frota",
  manutencao: "Manutenção",
  outro: "Outro",
};

export const STATUS_LABELS: Record<LeadStatus, string> = {
  novo: "Novo",
  em_contato: "Em contato",
  orcamento_enviado: "Orçamento enviado",
  negociacao: "Negociação",
  fechado: "Fechado",
  perdido: "Perdido",
};

export const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  pessoa_fisica: "Pessoa física",
  empresa: "Empresa",
  condominio: "Condomínio",
  produtor_rural: "Produtor rural",
  poder_publico: "Poder público",
};

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  residencial: "Residencial",
  comercial: "Comercial",
  industrial: "Industrial",
  rural: "Rural",
  condominio: "Condomínio",
  outro: "Outro",
};

export const SOURCE_LABELS: Record<LeadSource, string> = {
  orcamento: "Formulário de orçamento",
  contato: "Formulário de contato",
  simulador_solar: "Simulador solar",
  simulador_carregador: "Simulador de carregador",
  chat: "Chat",
};

/** Converte o parâmetro `?servico=` das URLs em um ServiceType. */
export const SERVICE_QUERY_ALIASES: Record<string, ServiceType> = {
  solar: "energia_solar",
  "energia-solar": "energia_solar",
  carregador: "carregador_residencial",
  "carregador-residencial": "carregador_residencial",
  "carregador-empresarial": "carregador_empresarial",
  condominio: "condominio",
  eletroposto: "eletroposto",
  frota: "frota",
  manutencao: "manutencao",
  outro: "outro",
};
