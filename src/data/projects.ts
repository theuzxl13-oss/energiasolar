import type { Project, ProjectCategory } from "@/types";

/**
 * PORTFÓLIO DEMONSTRATIVO
 * Projetos fictícios para apresentação do layout, todos marcados com
 * `isDemo: true` e exibidos com o selo "Projeto demonstrativo".
 * Substitua por projetos reais (com autorização dos clientes) e, se
 * houver fotos, informe o caminho em `image` (ex.: "/projetos/foto.webp").
 */
export const projects: Project[] = [
  {
    slug: "sistema-solar-residencial-8-5-kwp",
    title: "Sistema Solar Residencial — 8,5 kWp",
    category: "solar",
    segment: "Residencial",
    location: "Região Sudeste (localização demonstrativa)",
    power: "8,5 kWp",
    summary: "Sistema fotovoltaico em telhado cerâmico para residência unifamiliar com consumo elevado.",
    description:
      "Projeto demonstrativo de um sistema on-grid para uma residência com ar-condicionado e piscina aquecida. O arranjo foi distribuído em duas águas do telhado para aproveitar a melhor orientação, com inversor string e monitoramento por aplicativo.",
    result: "Geração estimada compatível com o consumo médio anual da residência.",
    estimatedSavings: "Até ~90% da conta (estimativa ilustrativa)",
    technicalInfo: [
      { label: "Módulos", value: "14 × 610 Wp" },
      { label: "Inversor", value: "String 8 kW" },
      { label: "Estrutura", value: "Telhado cerâmico" },
      { label: "Geração estimada", value: "~1.000 kWh/mês" },
    ],
    highlights: ["Monitoramento pelo celular", "Homologação junto à distribuidora", "Instalação em 2 dias (estimativa)"],
    art: "solar-home",
    isDemo: true,
  },
  {
    slug: "sistema-solar-comercial-35-kwp",
    title: "Sistema Solar Comercial — 35 kWp",
    category: "solar",
    segment: "Comercial",
    location: "Região Sul (localização demonstrativa)",
    power: "35 kWp",
    summary: "Usina em telhado metálico para centro comercial com alto consumo diurno.",
    description:
      "Projeto demonstrativo para um centro comercial com lojas e escritórios. A geração coincide com o horário de maior consumo, favorecendo o autoconsumo instantâneo. Inclui string box, proteção contra surtos e plano de manutenção preventiva.",
    result: "Redução relevante do custo operacional com energia elétrica.",
    estimatedSavings: "R$ X.XXX/mês (valor ilustrativo)",
    technicalInfo: [
      { label: "Módulos", value: "58 × 610 Wp" },
      { label: "Inversor", value: "Trifásico 30 kW" },
      { label: "Estrutura", value: "Telhado metálico trapezoidal" },
      { label: "Geração estimada", value: "~4.000 kWh/mês" },
    ],
    highlights: ["Autoconsumo diurno", "Plano de O&M", "Relatórios mensais de geração"],
    art: "solar-commercial",
    isDemo: true,
  },
  {
    slug: "sistema-solar-industrial-150-kwp",
    title: "Sistema Solar Industrial — 150 kWp",
    category: "solar",
    segment: "Industrial",
    location: "Região Centro-Oeste (localização demonstrativa)",
    power: "150 kWp",
    summary: "Usina de média potência para galpão industrial com estudo de demanda contratada.",
    description:
      "Projeto demonstrativo para uma indústria atendida em média tensão. O estudo considerou o perfil de carga, a demanda contratada e o posto tarifário. O sistema foi distribuído em múltiplos inversores para maior disponibilidade.",
    result: "Diminuição do consumo de energia da rede no horário fora de ponta.",
    estimatedSavings: "Definida em estudo tarifário (ilustrativo)",
    technicalInfo: [
      { label: "Módulos", value: "246 × 610 Wp" },
      { label: "Inversores", value: "3 × 50 kW" },
      { label: "Estrutura", value: "Telhado metálico de galpão" },
      { label: "Geração estimada", value: "~18.000 kWh/mês" },
    ],
    highlights: ["Estudo de demanda", "Múltiplos inversores", "Monitoramento remoto"],
    art: "solar-industrial",
    isDemo: true,
  },
  {
    slug: "instalacao-wallbox-residencial",
    title: "Instalação Wallbox Residencial",
    category: "carregadores",
    segment: "Residencial",
    location: "Região Sudeste (localização demonstrativa)",
    power: "7,4 kW",
    summary: "Wallbox em garagem residencial com circuito dedicado e proteções completas.",
    description:
      "Projeto demonstrativo de instalação de wallbox de 7,4 kW em residência. Incluiu verificação do padrão de entrada, circuito dedicado desde o quadro geral, dispositivo DR adequado, DPS e configuração do aplicativo para agendamento da recarga.",
    result: "Recarga completa durante a noite para o uso diário do veículo.",
    estimatedSavings: "Custo por km inferior ao de veículos a combustão (ilustrativo)",
    technicalInfo: [
      { label: "Equipamento", value: "Wallbox AC 7,4 kW" },
      { label: "Conector", value: "Tipo 2" },
      { label: "Circuito", value: "Dedicado 32 A" },
      { label: "Proteções", value: "Disjuntor, DR e DPS" },
    ],
    highlights: ["Agendamento pelo app", "Integração futura com energia solar", "Instalação em 1 dia (estimativa)"],
    art: "wallbox",
    isDemo: true,
  },
  {
    slug: "infraestrutura-recarga-condominio",
    title: "Infraestrutura para Condomínio",
    category: "carregadores",
    segment: "Condomínio",
    location: "Região Nordeste (localização demonstrativa)",
    power: "Até 20 pontos de 7,4 kW",
    summary: "Infraestrutura coletiva com medição individual e balanceamento de carga.",
    description:
      "Projeto demonstrativo para condomínio residencial vertical. Foi prevista uma infraestrutura principal com capacidade para expansão gradual, gestão dinâmica de carga e medição individualizada, permitindo que cada morador instale seu ponto quando desejar.",
    result: "Condomínio preparado para crescer conforme a adesão dos moradores.",
    estimatedSavings: "Rateio justo por consumo individual",
    technicalInfo: [
      { label: "Capacidade", value: "20 pontos (expansível)" },
      { label: "Gestão", value: "Balanceamento dinâmico" },
      { label: "Medição", value: "Individual por vaga" },
      { label: "Potência por ponto", value: "7,4 kW" },
    ],
    highlights: ["Apoio para assembleia", "Expansão gradual", "Controle por aplicativo"],
    art: "condo",
    isDemo: true,
  },
  {
    slug: "eletroposto-comercial",
    title: "Eletroposto Comercial",
    category: "eletropostos",
    segment: "Comércio",
    location: "Região Sudeste (localização demonstrativa)",
    power: "1 × DC 60 kW + 2 × AC 22 kW",
    summary: "Estação de recarga aberta ao público com cobrança por aplicativo.",
    description:
      "Projeto demonstrativo de eletroposto em estacionamento de estabelecimento comercial. A solução combina um carregador DC para recargas rápidas e dois carregadores AC para permanências mais longas, com plataforma de gestão, cobrança e sinalização das vagas.",
    result: "Novo serviço para clientes e possibilidade de receita com recargas.",
    estimatedSavings: "Receita conforme modelo de cobrança (ilustrativo)",
    technicalInfo: [
      { label: "Carregadores", value: "1 DC 60 kW + 2 AC 22 kW" },
      { label: "Conectores", value: "CCS2 e Tipo 2" },
      { label: "Plataforma", value: "Gestão e cobrança via app" },
      { label: "Potência total", value: "104 kW" },
    ],
    highlights: ["Cobrança por kWh", "Sinalização de vagas", "Monitoramento remoto"],
    art: "station",
    isDemo: true,
  },
];

export const PROJECT_CATEGORY_LABELS: Record<ProjectCategory, string> = {
  solar: "Solar",
  carregadores: "Carregadores",
  eletropostos: "Eletropostos",
};

export function getProjectBySlug(slug: string) {
  return projects.find((project) => project.slug === slug);
}
