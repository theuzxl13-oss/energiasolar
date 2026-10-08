import { siteConfig } from "@/config/site";

/**
 * Base de conhecimento usada pelo chat em modo demonstrativo e como
 * contexto (system prompt) quando a integração com IA estiver ativa.
 */

export interface KnowledgeEntry {
  id: string;
  keywords: string[];
  answer: string;
}

export const knowledgeBase: KnowledgeEntry[] = [
  {
    id: "economia",
    keywords: ["economia", "economizar", "conta", "reduzir", "desconto", "quanto posso"],
    answer:
      "A economia com energia solar depende do seu consumo, da tarifa e da região. Muitos clientes reduzem a maior parte da conta, mas sempre permanece uma parcela mínima (custo de disponibilidade e encargos). Experimente o simulador na página inicial para uma estimativa — o valor definitivo vem na proposta técnica.",
  },
  {
    id: "vida-util",
    keywords: ["dura", "vida útil", "vida util", "garantia", "quanto tempo dura"],
    answer:
      "Os módulos solares costumam durar mais de 25 anos, com garantia de desempenho do fabricante. Os inversores têm vida útil menor e podem ser substituídos ao longo do tempo. As garantias exatas dependem dos equipamentos escolhidos na proposta.",
  },
  {
    id: "nublado",
    keywords: ["nublado", "chuva", "nuvem", "inverno", "noite"],
    answer:
      "Em dias nublados a geração diminui, mas não para. À noite não há geração: você usa a energia da rede e os créditos acumulados durante o dia compensam esse consumo. O sistema é dimensionado pela média anual da sua região.",
  },
  {
    id: "paineis",
    keywords: ["painel", "painéis", "paineis", "placa", "módulo", "modulo", "telhado", "quantos"],
    answer:
      "A quantidade de painéis depende do consumo e da irradiação local. Nosso simulador estima a potência (kWp) e o número aproximado de módulos. Na visita técnica avaliamos telhado, orientação, sombreamento e estrutura.",
  },
  {
    id: "instalacao-solar",
    keywords: ["instalação", "instalacao", "instalar", "prazo", "homologação", "homologacao", "distribuidora"],
    answer:
      "O processo envolve análise, projeto, homologação junto à distribuidora, instalação e ativação. A instalação física costuma ser rápida; o prazo total depende principalmente da aprovação da distribuidora. Informamos o cronograma na proposta.",
  },
  {
    id: "manutencao",
    keywords: ["manutenção", "manutencao", "limpeza", "suporte", "defeito", "problema"],
    answer:
      "Sistemas solares exigem pouca manutenção: limpeza periódica dos módulos e inspeções preventivas. Também oferecemos suporte técnico e manutenção para carregadores e eletropostos. Você pode solicitar pelo formulário de orçamento, escolhendo “Manutenção”.",
  },
  {
    id: "wallbox",
    keywords: ["wallbox", "carregar em casa", "carregador", "garagem", "residência", "residencia", "carro elétrico", "carro eletrico", "veículo", "veiculo"],
    answer:
      "Para recarga em casa recomendamos um wallbox (geralmente 7,4 kW) em circuito dedicado, com proteções adequadas. Ele recarrega a maioria dos carros durante a noite. Use o simulador de carregador para ver uma recomendação inicial.",
  },
  {
    id: "tempo-recarga",
    keywords: ["tempo", "demora", "horas", "carregar", "rápido", "rapido", "dc"],
    answer:
      "O tempo de recarga depende da bateria, da potência do carregador e do limite do veículo. Como referência: wallbox de 7,4 kW recarrega durante a noite; carregadores DC rápidos podem recuperar boa parte da bateria em menos de 1 hora.",
  },
  {
    id: "aumento-carga",
    keywords: ["aumento de carga", "carga elétrica", "carga eletrica", "padrão", "padrao", "disjuntor"],
    answer:
      "Nem sempre é preciso aumentar a carga. Avaliamos o padrão de entrada e o consumo atual; em alguns casos a gestão de carga resolve, em outros é necessário solicitar aumento à distribuidora. Isso é definido na análise técnica.",
  },
  {
    id: "condominio",
    keywords: ["condomínio", "condominio", "prédio", "predio", "síndico", "sindico", "assembleia"],
    answer:
      "Sim, é possível instalar carregadores em condomínios, com medição individualizada e balanceamento de carga — cada morador paga pela própria energia. Apoiamos o condomínio com o projeto técnico para apresentação em assembleia.",
  },
  {
    id: "eletroposto",
    keywords: ["eletroposto", "estação", "estacao", "ponto de recarga", "posto", "shopping", "hotel", "rodovia"],
    answer:
      "Um eletroposto é uma estação de recarga aberta ao público. Fazemos estudo técnico, projeto, infraestrutura, instalação, configuração da plataforma e manutenção. Veja a página Eletropostos ou solicite uma avaliação do seu local.",
  },
  {
    id: "custo-eletroposto",
    keywords: ["custa", "preço", "preco", "valor", "investimento", "orçamento", "orcamento"],
    answer:
      "O investimento varia conforme a solução: potência, quantidade de pontos, adequações elétricas e obras. Por isso, os valores são definidos após a análise técnica. Solicite um orçamento sem compromisso pela página Orçamento ou pelo WhatsApp.",
  },
  {
    id: "cobranca",
    keywords: ["cobrar", "cobrança", "cobranca", "receita", "pagamento", "lucro"],
    answer:
      "É possível cobrar pela recarga usando plataformas de gestão (por kWh, por tempo ou assinatura), observando a regulamentação vigente. Ajudamos a definir o modelo mais adequado ao seu negócio.",
  },
  {
    id: "contato",
    keywords: ["contato", "telefone", "whatsapp", "falar", "atendente", "especialista", "humano"],
    answer: `Você pode falar com um especialista pelo WhatsApp (botão verde na tela), pelo e-mail ${siteConfig.contact.email} ou preenchendo o formulário em /orcamento.`,
  },
];

export const FALLBACK_ANSWER =
  "Posso ajudar com dúvidas sobre energia solar, painéis, economia, instalação, carregadores, wallbox e eletropostos. Para uma análise do seu caso, solicite um orçamento em /orcamento ou fale com um especialista pelo WhatsApp.";

export const GREETING_ANSWER = `Olá! Sou o assistente virtual da ${siteConfig.name}. Como posso ajudar com energia solar, carregadores ou eletropostos?`;

export function buildSystemPrompt() {
  const facts = knowledgeBase.map((entry) => `- ${entry.answer}`).join("\n");
  return [
    `Você é o assistente virtual do site da ${siteConfig.name} (${siteConfig.tagline}).`,
    "Responda em português do Brasil, de forma cordial, objetiva e em no máximo 3 parágrafos curtos.",
    "Assuntos permitidos: energia solar fotovoltaica, painéis, economia, instalação, manutenção, carregadores de veículos elétricos, wallbox, eletropostos, orçamentos e serviços da empresa.",
    "Para assuntos fora desse escopo, explique gentilmente que só pode ajudar com esses temas.",
    "Nunca prometa valores exatos de economia, preços, prazos ou resultados: diga que dependem de análise técnica e convide para solicitar orçamento em /orcamento ou falar no WhatsApp.",
    "Não invente dados da empresa (CNPJ, endereço, certificações, parceiros, clientes ou números). Use apenas as informações abaixo.",
    "",
    "Informações de referência:",
    facts,
  ].join("\n");
}
