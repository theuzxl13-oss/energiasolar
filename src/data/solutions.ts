import type { FeatureItem, IconName } from "@/types";

export interface Solution {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  /** Página "Saiba mais". Vazio = sem página própria (o botão é ocultado). */
  href: string;
  cta: { label: string; href: string };
  icon: IconName;
  tags: { label: string; icon: IconName }[];
  highlights: string[];
}

export const solutions: Solution[] = [
  {
    id: "solar",
    eyebrow: "Geração própria",
    title: "Energia Solar Fotovoltaica",
    description:
      "Projetos fotovoltaicos dimensionados para o seu consumo, com equipamentos de qualidade, homologação junto à distribuidora e monitoramento da geração.",
    href: "/energia-solar",
    cta: { label: "Simular meu projeto solar", href: "/#simulador-solar" },
    icon: "sun",
    tags: [
      { label: "Residências", icon: "home" },
      { label: "Empresas", icon: "building" },
      { label: "Comércios", icon: "store" },
      { label: "Indústrias", icon: "factory" },
      { label: "Propriedades rurais", icon: "tractor" },
    ],
    highlights: ["Estudo de viabilidade", "Projeto e homologação", "Instalação e monitoramento"],
  },
  {
    id: "carregadores",
    eyebrow: "Mobilidade elétrica",
    title: "Carregadores para Veículos Elétricos",
    description:
      "Wallbox residencial, carregadores AC e DC e infraestrutura elétrica completa para recarregar com segurança onde você estiver.",
    href: "/carregadores",
    cta: { label: "Solicitar projeto de carregador", href: "/orcamento?servico=carregador" },
    icon: "plug",
    tags: [
      { label: "Residencial", icon: "home" },
      { label: "Empresarial", icon: "briefcase" },
      { label: "Condomínios", icon: "building" },
      { label: "Estacionamentos", icon: "parking" },
      { label: "Frotas", icon: "truck" },
    ],
    highlights: ["Wallbox", "Carregadores AC", "Carregadores DC rápidos"],
  },
  {
    id: "eletropostos",
    eyebrow: "Novo negócio",
    title: "Eletropostos e Estações de Recarga",
    description:
      "Da análise técnica à operação: implantamos estações de recarga para estabelecimentos que querem atrair clientes e criar novas receitas.",
    href: "/eletropostos",
    cta: { label: "Quero instalar um eletroposto", href: "/orcamento?servico=eletroposto" },
    icon: "zap",
    tags: [
      { label: "Postos", icon: "fuel" },
      { label: "Rodovias", icon: "highway" },
      { label: "Shoppings", icon: "cart" },
      { label: "Hotéis", icon: "hotel" },
      { label: "Estacionamentos", icon: "parking" },
    ],
    highlights: ["Estudo técnico", "Projeto e infraestrutura", "Operação e manutenção"],
  },
];

export const eletropostoServices: FeatureItem[] = [
  { title: "Estudo técnico", description: "Avaliação do local, fluxo de veículos e potencial de uso.", icon: "search" },
  { title: "Projeto elétrico", description: "Projeto assinado por responsável técnico habilitado.", icon: "file" },
  { title: "Dimensionamento", description: "Potência, quantidade de pontos e carga disponível.", icon: "gauge" },
  { title: "Infraestrutura", description: "Entrada de energia, cabeamento, bases e sinalização.", icon: "hardhat" },
  { title: "Instalação", description: "Montagem e conexão dos carregadores AC e DC.", icon: "wrench" },
  { title: "Configuração", description: "Plataforma de gestão, cobrança e conectividade.", icon: "settings" },
  { title: "Manutenção", description: "Planos preventivos e atendimento corretivo.", icon: "shield" },
  { title: "Expansão futura", description: "Infraestrutura preparada para novos pontos.", icon: "trending" },
];

export const eletropostoApplications: { label: string; icon: IconName }[] = [
  { label: "Postos de combustíveis", icon: "fuel" },
  { label: "Rodovias", icon: "highway" },
  { label: "Shopping centers", icon: "cart" },
  { label: "Supermercados", icon: "store" },
  { label: "Hotéis", icon: "hotel" },
  { label: "Estacionamentos", icon: "parking" },
  { label: "Condomínios", icon: "building" },
  { label: "Empresas", icon: "briefcase" },
  { label: "Frotas", icon: "truck" },
];

export const eletropostoBenefits: FeatureItem[] = [
  { title: "Atraia novos clientes", description: "Motoristas de veículos elétricos escolhem destinos onde podem recarregar.", icon: "users" },
  { title: "Ofereça um novo serviço", description: "Diferencie seu estabelecimento com uma comodidade moderna e valorizada.", icon: "zap" },
  { title: "Prepare-se para o crescimento", description: "Esteja pronto para a expansão da frota elétrica no Brasil.", icon: "trending" },
  { title: "Novas possibilidades de receita", description: "Modelos de cobrança por kWh, tempo de uso ou assinatura.", icon: "coins" },
  { title: "Valorize o empreendimento", description: "Infraestrutura de recarga agrega valor ao imóvel e à marca.", icon: "award" },
  { title: "Compromisso com sustentabilidade", description: "Demonstre, na prática, apoio à mobilidade de baixa emissão.", icon: "leaf" },
];

export const solarBenefits: FeatureItem[] = [
  { title: "Economia na conta de luz", description: "Reduza significativamente o valor pago à distribuidora, conforme o seu perfil de consumo.", icon: "coins" },
  { title: "Longa vida útil", description: "Módulos fotovoltaicos costumam ter garantia de desempenho de 25 anos ou mais.", icon: "calendar" },
  { title: "Baixa manutenção", description: "Limpezas periódicas e inspeções preventivas mantêm o sistema eficiente.", icon: "wrench" },
  { title: "Monitoramento", description: "Acompanhe a geração pelo aplicativo do inversor, em tempo real.", icon: "smartphone" },
  { title: "Sustentabilidade", description: "Energia limpa e renovável, sem emissões durante a operação.", icon: "leaf" },
  { title: "Retorno do investimento", description: "Investimento com retorno calculado na proposta, de acordo com o seu caso.", icon: "trending" },
  { title: "Valorização do imóvel", description: "Imóveis com geração própria tendem a ser mais atrativos no mercado.", icon: "home" },
  { title: "Proteção contra reajustes", description: "Menor exposição aos aumentos tarifários e bandeiras.", icon: "shield" },
];

export interface Segment {
  id: string;
  title: string;
  description: string;
  icon: IconName;
  bullets: string[];
}

export const solarSegments: Segment[] = [
  {
    id: "residencial",
    title: "Residencial",
    description: "Para casas e sobrados que querem reduzir a conta e ganhar previsibilidade.",
    icon: "home",
    bullets: ["Projeto sob medida para o telhado", "Homologação com a distribuidora", "Monitoramento pelo celular"],
  },
  {
    id: "comercial",
    title: "Comercial",
    description: "Lojas, escritórios, clínicas e serviços com consumo diurno elevado.",
    icon: "store",
    bullets: ["Redução de custo operacional", "Geração alinhada ao horário comercial", "Opções de financiamento"],
  },
  {
    id: "industrial",
    title: "Industrial",
    description: "Usinas de maior porte em telhados, solo ou estacionamentos.",
    icon: "factory",
    bullets: ["Estudos de demanda e tarifas", "Sistemas de média e grande potência", "Operação e manutenção (O&M)"],
  },
  {
    id: "rural",
    title: "Rural",
    description: "Propriedades rurais, irrigação, granjas, aviários e agroindústrias.",
    icon: "tractor",
    bullets: ["Sistemas em solo ou telhado", "Atendimento a bombeamento e irrigação", "Soluções on-grid e híbridas"],
  },
];

export interface ChargingCategory {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: IconName;
  power: string;
  current: "AC" | "DC" | "AC/DC";
  features: string[];
}

export const chargingCategories: ChargingCategory[] = [
  {
    id: "residencial",
    title: "Carregamento residencial",
    subtitle: "Wallbox para residência",
    description:
      "A forma mais prática de recarregar: o carro abastece enquanto você dorme, com segurança e custo por km bem menor do que combustíveis.",
    icon: "home",
    power: "7,4 a 11 kW",
    current: "AC",
    features: ["Instalação na garagem", "Circuito dedicado e proteções", "Agendamento pelo app (conforme modelo)"],
  },
  {
    id: "comercial",
    title: "Carregamento comercial",
    subtitle: "Empresas, lojas e estacionamentos",
    description:
      "Ofereça recarga para colaboradores e clientes, com controle de acesso, relatórios de uso e possibilidade de cobrança.",
    icon: "store",
    power: "22 kW AC ou DC",
    current: "AC/DC",
    features: ["Gestão por plataforma", "Controle de usuários", "Cobrança opcional"],
  },
  {
    id: "condominios",
    title: "Condomínios",
    subtitle: "Sistema preparado para múltiplos moradores",
    description:
      "Infraestrutura coletiva com medição individualizada e balanceamento de carga, para que cada morador pague apenas pelo que consumir.",
    icon: "building",
    power: "7,4 a 22 kW",
    current: "AC",
    features: ["Medição individual", "Gestão dinâmica de carga", "Projeto para aprovação em assembleia"],
  },
  {
    id: "frotas",
    title: "Frotas",
    subtitle: "Infraestrutura para vários veículos",
    description:
      "Planejamento de recarga por turnos, potência adequada para a operação e relatórios de consumo por veículo.",
    icon: "truck",
    power: "22 kW AC a 120+ kW DC",
    current: "AC/DC",
    features: ["Agendamento inteligente", "Relatórios por veículo", "Escalável conforme a frota cresce"],
  },
  {
    id: "rapido",
    title: "Carregamento rápido",
    subtitle: "Soluções DC de alta potência",
    description:
      "Carregadores em corrente contínua para aplicações que precisam de maior velocidade, como rodovias, eletropostos e frotas.",
    icon: "zap",
    power: "40 a 150+ kW",
    current: "DC",
    features: ["Recargas em minutos", "Conectores CCS2 e outros padrões", "Ideal para alta rotatividade"],
  },
];

export interface ChargerExample {
  name: string;
  type: string;
  power: string;
  use: string;
  icon: IconName;
}

export const chargerExamples: ChargerExample[] = [
  { name: "Wallbox", type: "AC • Parede", power: "7,4 – 11 kW", use: "Residências e condomínios", icon: "home" },
  { name: "Carregador AC", type: "AC • Parede ou pedestal", power: "22 kW", use: "Empresas, comércios e estacionamentos", icon: "plug" },
  { name: "Carregador DC", type: "DC • Pedestal", power: "40 – 60 kW", use: "Comércios, frotas e estacionamentos", icon: "battery" },
  { name: "Carregador rápido", type: "DC • Alta potência", power: "120 kW ou mais", use: "Eletropostos, rodovias e frotas", icon: "zap" },
];
