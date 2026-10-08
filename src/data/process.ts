import type { ProcessStep } from "@/types";

export const customerJourney: ProcessStep[] = [
  { step: 1, title: "Contato", description: "Você solicita um orçamento pelo site, WhatsApp ou telefone.", icon: "headset" },
  { step: 2, title: "Análise", description: "Nossa equipe analisa a necessidade, o consumo e o local.", icon: "search" },
  { step: 3, title: "Projeto", description: "Dimensionamento técnico da solução ideal.", icon: "clipboard" },
  { step: 4, title: "Proposta", description: "Apresentação técnica e comercial transparente.", icon: "file" },
  { step: 5, title: "Instalação", description: "Execução do projeto por equipe qualificada.", icon: "hardhat" },
  { step: 6, title: "Ativação", description: "Testes, comissionamento e entrega do sistema.", icon: "zap" },
  { step: 7, title: "Monitoramento e suporte", description: "Acompanhamento pós-instalação e manutenção.", icon: "monitor" },
];

export const eletropostoSteps: ProcessStep[] = [
  { step: 1, title: "Análise do local", description: "Visita técnica, fluxo de veículos, vagas e carga elétrica disponível.", icon: "search" },
  { step: 2, title: "Dimensionamento elétrico", description: "Definição de potência, quantidade de pontos e adequações de entrada.", icon: "gauge" },
  { step: 3, title: "Projeto", description: "Projeto elétrico e civil, documentação e aprovações necessárias.", icon: "file" },
  { step: 4, title: "Infraestrutura", description: "Execução de entrada de energia, eletrodutos, cabeamento e bases.", icon: "hardhat" },
  { step: 5, title: "Instalação dos carregadores", description: "Montagem, fixação e conexão dos equipamentos AC e/ou DC.", icon: "plug" },
  { step: 6, title: "Configuração e testes", description: "Comissionamento, conectividade, plataforma de gestão e cobrança.", icon: "settings" },
  { step: 7, title: "Operação", description: "Estação liberada ao público com sinalização e suporte ao usuário.", icon: "zap" },
  { step: 8, title: "Suporte e manutenção", description: "Monitoramento remoto, manutenção preventiva e corretiva.", icon: "shield" },
];

export const solarFlow = [
  { id: "sol", title: "Sol", description: "A luz solar atinge os módulos fotovoltaicos.", icon: "sun" as const },
  { id: "paineis", title: "Painéis", description: "As células convertem luz em energia elétrica em corrente contínua (CC).", icon: "chart" as const },
  { id: "inversor", title: "Inversor", description: "Converte CC em corrente alternada (CA), compatível com o imóvel.", icon: "cpu" as const },
  { id: "imovel", title: "Imóvel", description: "A energia abastece equipamentos e iluminação em tempo real.", icon: "home" as const },
  { id: "rede", title: "Rede elétrica", description: "O excedente vai para a rede e vira créditos de energia.", icon: "network" as const },
];
