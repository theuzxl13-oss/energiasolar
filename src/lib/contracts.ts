/**
 * ============================================================================
 * CONTRATOS — modelo de dados, cláusulas padrão e preenchimento automático
 * ============================================================================
 * As cláusulas são textos editáveis com "variáveis" entre chaves (ex.: {VALOR}).
 * Na visualização/PDF, as variáveis são trocadas pelos dados do contrato —
 * assim, mudar o valor ou o prazo atualiza todas as cláusulas automaticamente.
 *
 * IMPORTANTE: o modelo de cláusulas é uma base e deve ser revisado pelo
 * responsável jurídico da empresa antes do uso com clientes.
 * ============================================================================
 */

import { companyAddressLine, getSiteSettings } from "@/lib/site-content";
import { currencyToWords, integerToWords, todayIso, type Quote, quoteTotals } from "@/lib/quotes";
import { formatCurrency, formatNumber, generateId } from "@/lib/utils";

export const CONTRACT_STATUSES = ["rascunho", "aguardando_assinatura", "assinado", "em_execucao", "concluido", "cancelado"] as const;
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  rascunho: "Rascunho",
  aguardando_assinatura: "Aguardando assinatura",
  assinado: "Assinado",
  em_execucao: "Em execução",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export const CONTRACT_SERVICES = ["solar", "carregador", "eletroposto", "manutencao", "outro"] as const;
export type ContractService = (typeof CONTRACT_SERVICES)[number];

export const CONTRACT_SERVICE_LABELS: Record<ContractService, string> = {
  solar: "Energia Solar",
  carregador: "Carregador Veicular",
  eletroposto: "Eletroposto",
  manutencao: "Manutenção",
  outro: "Outro",
};

/** Texto padrão do objeto por tipo de serviço (variável {OBJETO}). */
export const DEFAULT_OBJECTS: Record<ContractService, string> = {
  solar:
    "a implantação de sistema de energia solar fotovoltaica pela CONTRATADA à CONTRATANTE, compreendendo projeto, fornecimento de equipamentos, instalação e comissionamento",
  carregador:
    "o fornecimento e a instalação de carregador para veículos elétricos pela CONTRATADA à CONTRATANTE, compreendendo projeto elétrico, infraestrutura, instalação e configuração",
  eletroposto:
    "a implantação de eletroposto (estação de recarga de veículos elétricos) pela CONTRATADA à CONTRATANTE, compreendendo estudo técnico, projeto, infraestrutura, fornecimento e instalação dos carregadores, configuração e comissionamento",
  manutencao: "a prestação de serviços de manutenção preventiva e corretiva pela CONTRATADA à CONTRATANTE",
  outro: "a prestação de serviços pela CONTRATADA à CONTRATANTE, conforme escopo descrito neste contrato",
};

export const DEFAULT_CONTRACT_TYPES: Record<ContractService, string> = {
  solar: "Contrato de fornecimento e instalação",
  carregador: "Contrato de fornecimento e instalação",
  eletroposto: "Contrato de fornecimento e instalação",
  manutencao: "Contrato de prestação de serviços de manutenção",
  outro: "Contrato de prestação de serviços",
};

export interface ContractSection {
  id: string;
  title: string;
  clauses: string[];
}

export interface Contract {
  id: string;
  number: string;
  title: string;
  service: ContractService;
  /** Título do documento, ex.: "Contrato de fornecimento e instalação". */
  contractType: string;
  status: ContractStatus;
  quoteId: string | null;
  startDate: string;
  executionDays: number;
  signingCity: string;
  signingDate: string;
  forum: string;
  client: {
    name: string;
    docType: "CPF" | "CNPJ";
    document: string;
    address: string;
    /** Representante legal (quando pessoa jurídica). */
    representative: string;
    phone: string;
    email: string;
    installationAddress: string;
  };
  object: string;
  scope: string;
  total: number;
  payment: string;
  sections: ContractSection[];
  witnesses: boolean;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------ Variáveis ---------------------------------- */

export const CONTRACT_TOKENS: { token: string; description: string }[] = [
  { token: "{OBJETO}", description: "Objeto do contrato" },
  { token: "{ESCOPO}", description: "Escopo técnico" },
  { token: "{LOCAL_INSTALACAO}", description: "Local da instalação" },
  { token: "{VALOR}", description: "Valor total (R$)" },
  { token: "{VALOR_EXTENSO}", description: "Valor por extenso" },
  { token: "{PAGAMENTO}", description: "Forma de pagamento" },
  { token: "{PRAZO}", description: "Prazo em dias, ex.: 60 (sessenta)" },
  { token: "{FORO}", description: "Comarca do foro" },
];

/** Substitui as variáveis {…} do texto pelos dados do contrato. */
export function fillContractTokens(text: string, contract: Contract) {
  const values: Record<string, string> = {
    "{OBJETO}": contract.object.trim(),
    "{ESCOPO}": contract.scope.trim(),
    "{LOCAL_INSTALACAO}": contract.client.installationAddress.trim() || contract.client.address.trim(),
    "{VALOR}": formatCurrency(contract.total, true),
    "{VALOR_EXTENSO}": currencyToWords(contract.total),
    "{PAGAMENTO}": contract.payment.trim(),
    "{PRAZO}": `${contract.executionDays} (${integerToWords(contract.executionDays)})`,
    "{FORO}": contract.forum.trim(),
  };
  return text.replace(/\{[A-Z_]+\}/g, (token) => values[token] || token);
}

/* --------------------------- Textos automáticos ----------------------------- */

const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

/** "2026-10-05" → "5 de outubro de 2026". */
export function longDate(iso: string) {
  if (!iso) return "";
  const [year, month, day] = iso.split("-").map(Number);
  return `${day} de ${MONTHS[(month ?? 1) - 1]} de ${year}`;
}

/** Endereço da empresa (editável em /admin/conteudo). */
export function companyAddress() {
  return companyAddressLine(getSiteSettings());
}

export function contractorParagraph() {
  const { legalName, cnpj } = getSiteSettings();
  return `${legalName}, pessoa jurídica de direito privado inscrita no CNPJ sob o nº ${cnpj}, com sede em ${companyAddress()}.`;
}

export function clientParagraph(contract: Contract) {
  const { name, docType, document, address, representative } = contract.client;
  const doc = document.trim() || (docType === "CPF" ? "000.000.000-00" : "00.000.000/0000-00");
  if (docType === "CNPJ") {
    return `${name}, pessoa jurídica de direito privado inscrita no CNPJ sob o nº ${doc}, com sede em ${address}${
      representative.trim() ? `, neste ato representada por ${representative.trim()}` : ""
    }.`;
  }
  return `${name}, inscrito(a) no CPF sob o nº ${doc}, residente e domiciliado(a) em ${address}.`;
}

/* ---------------------------- Cláusulas padrão ------------------------------ */

const section = (title: string, clauses: string[]): ContractSection => ({ id: generateId("section"), title, clauses });

export const DEFAULT_PAYMENT =
  "50% (cinquenta por cento) de entrada na assinatura e 50% (cinquenta por cento) na conclusão da instalação, via PIX ou transferência bancária.";

/** Cláusulas padrão (baseadas no contrato modelo), adaptadas ao tipo de serviço. */
export function defaultContractSections(service: ContractService): ContractSection[] {
  const isSolar = service === "solar";
  const sections: ContractSection[] = [
    section("Objeto", [
      "O presente contrato tem por objeto {OBJETO}, no endereço {LOCAL_INSTALACAO}.",
      "O escopo técnico contratado compreende: {ESCOPO}",
    ]),
    section("Preço e forma de pagamento", [
      "Pelos equipamentos e serviços objeto deste contrato, a CONTRATANTE pagará à CONTRATADA o valor total de {VALOR} ({VALOR_EXTENSO}), da seguinte forma: {PAGAMENTO}",
      "O atraso no pagamento sujeitará a CONTRATANTE à multa de 2% (dois por cento) sobre o valor em atraso, acrescida de juros de mora de 1% (um por cento) ao mês, calculados pro rata die.",
    ]),
    section("Prazo de execução", [
      "A CONTRATADA concluirá a instalação em até {PRAZO} dias, contados da confirmação do pagamento da entrada e da liberação do local, ressalvados atrasos decorrentes de condições climáticas, caso fortuito, força maior ou de providências a cargo da CONTRATANTE ou de terceiros.",
      isSolar
        ? "Os prazos de análise do projeto, vistoria e substituição do medidor pela concessionária de energia não dependem da CONTRATADA e não integram o prazo previsto nesta cláusula."
        : "Os prazos de análise, vistoria e eventual aumento de carga junto à concessionária de energia, quando aplicáveis, não dependem da CONTRATADA e não integram o prazo previsto nesta cláusula.",
    ]),
    section("Obrigações da contratada", [
      "Executar os serviços por meio de profissionais habilitados, observando as normas técnicas da ABNT, as normas regulamentadoras de segurança do trabalho e os padrões da concessionária local, com emissão da respectiva ART (Anotação de Responsabilidade Técnica).",
      isSolar
        ? "Elaborar e protocolar o projeto junto à concessionária de energia e acompanhar o processo de homologação até a conexão do sistema à rede."
        : "Elaborar o projeto elétrico e, quando necessário, protocolar as solicitações junto à concessionária de energia, acompanhando o processo até a sua conclusão.",
      "Entregar à CONTRATANTE, ao final da instalação, os manuais e certificados de garantia dos equipamentos e orientá-la quanto ao seu uso adequado.",
      "Manter sigilo sobre as informações da CONTRATANTE a que tiver acesso em razão deste contrato.",
    ]),
    section("Obrigações da contratante", [
      "Permitir o acesso da equipe técnica ao local nos dias e horários acordados e fornecer, em tempo hábil, as informações e documentos necessários à execução dos serviços.",
      "Efetuar os pagamentos nas datas e condições pactuadas.",
    ]),
    section("Garantia", [
      "A CONTRATADA garante os serviços de instalação pelo prazo de 12 (doze) meses, contados da conclusão. Os equipamentos possuem a garantia oferecida pelos respectivos fabricantes, nos termos de seus certificados.",
      "A garantia não cobre danos decorrentes de mau uso, intervenção de terceiros não autorizados pela CONTRATADA, descargas atmosféricas, eventos da natureza ou oscilações da rede elétrica da concessionária.",
    ]),
  ];

  if (isSolar) {
    sections.push(
      section("Estimativa de geração", [
        "A geração de energia apresentada em proposta é uma estimativa baseada em dados históricos de irradiação solar e pode variar conforme o clima, o sombreamento, a limpeza dos módulos e as regras tarifárias vigentes, não constituindo garantia de economia.",
      ]),
    );
  }

  sections.push(
    section("Rescisão", [
      "O descumprimento de qualquer cláusula deste contrato autoriza a parte prejudicada a rescindi-lo mediante notificação por escrito, sujeitando a parte infratora à multa de 10% (dez por cento) sobre o valor total do contrato, sem prejuízo de eventuais perdas e danos.",
      "Em caso de desistência da CONTRATANTE após a aquisição dos equipamentos, os valores já desembolsados pela CONTRATADA poderão ser retidos ou cobrados mediante comprovação.",
    ]),
    section("Proteção de dados", [
      "As partes tratarão os dados pessoais compartilhados em razão deste contrato exclusivamente para a sua execução, em conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados).",
    ]),
    section("Foro", [
      "Fica eleito o foro da comarca de {FORO} para dirimir quaisquer dúvidas oriundas deste contrato, com renúncia a qualquer outro, por mais privilegiado que seja.",
    ]),
  );

  return sections;
}

/* ------------------------------- Construtores ------------------------------- */

export function emptyContract(id: string, number: string): Contract {
  const today = todayIso();
  const now = new Date().toISOString();
  const service: ContractService = "solar";
  const { address } = getSiteSettings();
  return {
    id,
    number,
    title: "",
    service,
    contractType: DEFAULT_CONTRACT_TYPES[service],
    status: "rascunho",
    quoteId: null,
    startDate: today,
    executionDays: 60,
    signingCity: address.city,
    signingDate: today,
    forum: `${address.city}/${address.state}`,
    client: { name: "", docType: "CPF", document: "", address: "", representative: "", phone: "", email: "", installationAddress: "" },
    object: DEFAULT_OBJECTS[service],
    scope: "",
    total: 0,
    payment: DEFAULT_PAYMENT,
    sections: defaultContractSections(service),
    witnesses: false,
    createdAt: now,
    updatedAt: now,
  };
}

/** Texto de escopo a partir dos itens de um orçamento. */
export function scopeFromQuote(quote: Quote) {
  const items = quote.items
    .filter((item) => item.description.trim())
    .map((item) => `${formatNumber(item.quantity, 2)} ${item.unit} — ${item.description.trim()}`)
    .join("; ");
  return items ? `${items}, e demais componentes necessários.` : "";
}

/** Preenche um contrato com os dados de um orçamento. */
export function applyQuoteToContract(contract: Contract, quote: Quote): Contract {
  const { total } = quoteTotals(quote);
  return {
    ...contract,
    quoteId: quote.id,
    title: quote.title || contract.title,
    total,
    scope: scopeFromQuote(quote),
    payment: quote.conditions.payment.trim() || contract.payment,
    client: {
      ...contract.client,
      name: quote.client.name,
      phone: quote.client.phone,
      email: quote.client.email,
      address: quote.client.address,
      installationAddress: quote.client.installationAddress || quote.client.address,
    },
  };
}

/** Contrato de exemplo (o mesmo do PDF modelo), exibido no modo demonstração. */
export function sampleContract(): Contract {
  const base = emptyContract("demo-contract-0001", "2026/0001");
  return {
    ...base,
    title: "Sistema solar residencial 6,6 kWp",
    status: "aguardando_assinatura",
    startDate: "2026-10-05",
    signingDate: "2026-10-05",
    signingCity: "Campinas",
    forum: "Campinas/SP",
    client: {
      name: "Ana Ferreira (cliente fictícia)",
      docType: "CPF",
      document: "000.000.000-00",
      address: "Rua Exemplo, 123 — Jardim Demonstração, Campinas/SP",
      representative: "",
      phone: "(19) 90000-0000",
      email: "ana.ferreira@exemplo.com",
      installationAddress: "Rua Exemplo, 123 — Jardim Demonstração, Campinas/SP",
    },
    scope:
      "sistema fotovoltaico de 6,6 kWp, composto por 12 módulos de 550 W, inversor de 6 kW, estruturas de fixação para telhado cerâmico, cabeamento, string box e demais componentes necessários.",
    total: 24900,
    isDemo: true,
    createdAt: "2026-10-05T12:00:00.000Z",
    updatedAt: "2026-10-05T12:00:00.000Z",
  };
}

/** Linha de resumo exibida abaixo do título. */
export function contractMetaLine(contract: Contract) {
  const start = contract.startDate ? contract.startDate.split("-").reverse().join("/") : "";
  return [`Contrato nº ${contract.number}`, CONTRACT_SERVICE_LABELS[contract.service], start && `Início em ${start}`, `Execução em até ${contract.executionDays} dias`]
    .filter(Boolean)
    .join(" · ");
}
