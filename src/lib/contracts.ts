import { siteConfig } from "@/config/site";
import { currencyToWords, integerToWords, quantityWithWords } from "@/lib/extenso";
import { formatCurrency, formatDate, generateId } from "@/lib/utils";
import type { Contract, ContractBilling, ContractClause, ContractStatus, Lead, Quote, ServiceType } from "@/types";

/* ---------------------------------------------------------------------------
 * Regras de negócio dos contratos: modelos de cláusulas, variáveis e formatação.
 * Os textos abaixo são MODELOS — revise-os com o jurídico antes do uso real.
 * ------------------------------------------------------------------------- */

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  rascunho: "Rascunho",
  emitido: "Emitido",
  assinado: "Assinado",
  cancelado: "Cancelado",
};

/** Descrição do objeto usada na variável {servico}. */
export const SERVICE_OBJECT: Record<ServiceType, string> = {
  energia_solar: "implantação de sistema de energia solar fotovoltaica",
  carregador_residencial: "instalação de carregador residencial para veículo elétrico (wallbox)",
  carregador_empresarial: "instalação de carregadores para veículos elétricos",
  condominio: "implantação de infraestrutura de recarga de veículos elétricos em condomínio",
  eletroposto: "implantação de eletroposto para recarga de veículos elétricos",
  frota: "implantação de infraestrutura de recarga para frota de veículos elétricos",
  manutencao: "manutenção preventiva e corretiva de sistemas de energia",
  outro: "serviços de engenharia elétrica",
};

/** Título exibido no topo do documento. */
export function contractHeading(contract: Pick<Contract, "billing" | "service">) {
  return contract.service === "manutencao" || contract.billing === "mensal"
    ? "CONTRATO DE PRESTAÇÃO DE SERVIÇOS"
    : "CONTRATO DE FORNECIMENTO E INSTALAÇÃO";
}

/* --------------------------------- Variáveis ------------------------------ */

export const CONTRACT_VARIABLES: { token: string; description: string }[] = [
  { token: "{contratante}", description: "Nome/razão social do cliente" },
  { token: "{documento}", description: "CPF/CNPJ do cliente" },
  { token: "{servico}", description: "Descrição do objeto" },
  { token: "{local}", description: "Endereço da instalação" },
  { token: "{escopo}", description: "Escopo técnico" },
  { token: "{valor}", description: "Valor em R$" },
  { token: "{valor_extenso}", description: "Valor por extenso" },
  { token: "{pagamento}", description: "Forma de pagamento" },
  { token: "{vencimento}", description: "Dia de vencimento" },
  { token: "{prazo_execucao}", description: "Prazo de execução" },
  { token: "{garantia}", description: "Garantia da instalação" },
  { token: "{vigencia}", description: "Vigência do contrato" },
  { token: "{foro}", description: "Comarca do foro" },
];

export function contractVariables(contract: Contract): Record<string, string> {
  return {
    contratante: contract.client.name || "[CONTRATANTE]",
    documento: contract.client.document || "[CPF/CNPJ]",
    servico: SERVICE_OBJECT[contract.service],
    local: contract.installAddress || "[endereço da instalação]",
    escopo: contract.scope.trim().replace(/\.$/, "") || "[escopo técnico]",
    valor: formatCurrency(contract.value, true),
    valor_extenso: currencyToWords(contract.value),
    pagamento: contract.paymentTerms.trim().replace(/\.$/, "") || "[forma de pagamento]",
    vencimento: `${String(contract.dueDay).padStart(2, "0")} (${integerToWords(contract.dueDay)})`,
    prazo_execucao: quantityWithWords(contract.executionDays, "dia", "dias"),
    garantia: quantityWithWords(contract.warrantyMonths, "mês", "meses"),
    vigencia: contract.durationMonths ? quantityWithWords(contract.durationMonths, "mês", "meses") : "prazo indeterminado",
    foro: contract.forum || "[cidade/UF]",
  };
}

/** Substitui as variáveis {nome} do texto. Variáveis desconhecidas são mantidas. */
export function fillVariables(text: string, variables: Record<string, string>) {
  return text.replace(/\{([a-z_]+)\}/g, (match, key: string) => variables[key] ?? match);
}

/* ---------------------------- Modelos de cláusulas ------------------------ */

const clause = (title: string, ...paragraphs: (string | false)[]): ContractClause => ({
  id: generateId("cl"),
  title,
  body: paragraphs.filter(Boolean).join("\n\n"),
});

function installationClauses(service: ServiceType): ContractClause[] {
  const isSolar = service === "energia_solar";
  return [
    clause(
      "OBJETO",
      "O presente contrato tem por objeto a {servico} pela CONTRATADA à CONTRATANTE, compreendendo projeto, fornecimento de equipamentos, instalação e comissionamento, no endereço {local}.",
      "O escopo técnico contratado compreende: {escopo}.",
    ),
    clause(
      "PREÇO E FORMA DE PAGAMENTO",
      "Pelos equipamentos e serviços objeto deste contrato, a CONTRATANTE pagará à CONTRATADA o valor total de {valor} ({valor_extenso}), da seguinte forma: {pagamento}.",
      "O atraso no pagamento sujeitará a CONTRATANTE à multa de 2% (dois por cento) sobre o valor em atraso, acrescida de juros de mora de 1% (um por cento) ao mês, calculados pro rata die.",
    ),
    clause(
      "PRAZO DE EXECUÇÃO",
      "A CONTRATADA concluirá a instalação em até {prazo_execucao}, contados da confirmação do pagamento da entrada e da liberação do local, ressalvados atrasos decorrentes de condições climáticas, caso fortuito, força maior ou de providências a cargo da CONTRATANTE ou de terceiros.",
      isSolar
        ? "Os prazos de análise do projeto, vistoria e substituição do medidor pela concessionária de energia não dependem da CONTRATADA e não integram o prazo previsto nesta cláusula."
        : "Caso seja necessária adequação do padrão de entrada ou aumento de carga junto à concessionária, os respectivos prazos não integram o prazo previsto nesta cláusula.",
    ),
    clause(
      "OBRIGAÇÕES DA CONTRATADA",
      "Executar os serviços por meio de profissionais habilitados, observando as normas técnicas da ABNT, as normas regulamentadoras de segurança do trabalho e os padrões da concessionária local, com emissão da respectiva ART (Anotação de Responsabilidade Técnica).",
      isSolar && "Elaborar e protocolar o projeto junto à concessionária de energia e acompanhar o processo de homologação até a conexão do sistema à rede.",
      "Entregar à CONTRATANTE, ao final da instalação, os manuais e certificados de garantia dos equipamentos e orientá-la quanto ao seu uso adequado.",
      "Manter sigilo sobre as informações da CONTRATANTE a que tiver acesso em razão deste contrato.",
    ),
    clause(
      "OBRIGAÇÕES DA CONTRATANTE",
      "Permitir o acesso da equipe técnica ao local nos dias e horários acordados e fornecer, em tempo hábil, as informações e documentos necessários à execução dos serviços.",
      service === "condominio" && "Apresentar a aprovação da assembleia ou do síndico para a execução das obras nas áreas comuns, quando exigida pela convenção do condomínio.",
      "Efetuar os pagamentos nas datas e condições pactuadas.",
    ),
    clause(
      "GARANTIA",
      "A CONTRATADA garante os serviços de instalação pelo prazo de {garantia}, contados da conclusão. Os equipamentos possuem a garantia oferecida pelos respectivos fabricantes, nos termos de seus certificados.",
      "A garantia não cobre danos decorrentes de mau uso, intervenção de terceiros não autorizados pela CONTRATADA, descargas atmosféricas, eventos da natureza ou oscilações da rede elétrica da concessionária.",
    ),
    ...(isSolar
      ? [
          clause(
            "ESTIMATIVA DE GERAÇÃO",
            "A geração de energia apresentada em proposta é uma estimativa baseada em dados históricos de irradiação solar e pode variar conforme o clima, o sombreamento, a limpeza dos módulos e as regras tarifárias vigentes, não constituindo garantia de economia.",
          ),
        ]
      : []),
    clause(
      "RESCISÃO",
      "O descumprimento de qualquer cláusula deste contrato autoriza a parte prejudicada a rescindi-lo mediante notificação por escrito, sujeitando a parte infratora à multa de 10% (dez por cento) sobre o valor total do contrato, sem prejuízo de eventuais perdas e danos.",
      "Em caso de desistência da CONTRATANTE após a aquisição dos equipamentos, os valores já desembolsados pela CONTRATADA poderão ser retidos ou cobrados mediante comprovação.",
    ),
    clause(
      "PROTEÇÃO DE DADOS",
      "As partes tratarão os dados pessoais compartilhados em razão deste contrato exclusivamente para a sua execução, em conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados).",
    ),
    clause(
      "FORO",
      "Fica eleito o foro da comarca de {foro} para dirimir quaisquer dúvidas oriundas deste contrato, com renúncia a qualquer outro, por mais privilegiado que seja.",
    ),
  ];
}

function recurringClauses(): ContractClause[] {
  return [
    clause(
      "OBJETO",
      "O presente contrato tem por objeto a prestação de serviços de {servico} pela CONTRATADA à CONTRATANTE, no endereço {local}.",
      "O escopo dos serviços compreende: {escopo}.",
    ),
    clause(
      "VALOR E FORMA DE PAGAMENTO",
      "Pelos serviços prestados, a CONTRATANTE pagará à CONTRATADA o valor mensal de {valor} ({valor_extenso}), com vencimento todo dia {vencimento} de cada mês, por meio de {pagamento}.",
      "O valor será reajustado a cada 12 (doze) meses pela variação acumulada do IPCA/IBGE.",
      "O atraso no pagamento sujeitará a CONTRATANTE à multa de 2% (dois por cento) sobre o valor em atraso, acrescida de juros de mora de 1% (um por cento) ao mês.",
    ),
    clause(
      "VIGÊNCIA",
      "O presente contrato vigorará por {vigencia}, a contar da data de início indicada, podendo ser renovado por acordo entre as partes.",
    ),
    clause(
      "OBRIGAÇÕES DA CONTRATADA",
      "Prestar os serviços com zelo e diligência, por meio de profissionais habilitados, observando as normas técnicas e de segurança aplicáveis, e emitir relatório técnico após cada visita.",
      "Manter sigilo sobre as informações da CONTRATANTE a que tiver acesso em razão deste contrato.",
    ),
    clause(
      "OBRIGAÇÕES DA CONTRATANTE",
      "Permitir o acesso da equipe técnica aos equipamentos, comunicar prontamente qualquer falha ou anomalia e efetuar os pagamentos nas datas pactuadas.",
      "Peças e equipamentos que precisarem ser substituídos fora da garantia do fabricante serão orçados à parte e dependerão da aprovação prévia da CONTRATANTE.",
    ),
    clause(
      "RESCISÃO",
      "O presente contrato poderá ser rescindido por qualquer das partes, mediante aviso prévio por escrito de 30 (trinta) dias, sem prejuízo dos valores já devidos.",
    ),
    clause(
      "PROTEÇÃO DE DADOS",
      "As partes tratarão os dados pessoais compartilhados em razão deste contrato exclusivamente para a sua execução, em conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados).",
    ),
    clause(
      "FORO",
      "Fica eleito o foro da comarca de {foro} para dirimir quaisquer dúvidas oriundas deste contrato, com renúncia a qualquer outro, por mais privilegiado que seja.",
    ),
  ];
}

export function defaultBilling(service: ServiceType): ContractBilling {
  return service === "manutencao" ? "mensal" : "unico";
}

/** Cláusulas padrão para o tipo de serviço e cobrança informados. */
export function defaultClauses(service: ServiceType, billing: ContractBilling): ContractClause[] {
  return billing === "mensal" ? recurringClauses() : installationClauses(service);
}

/* ------------------------------ Criação e cópia --------------------------- */

export const DEFAULT_SCOPE: Record<ServiceType, string> = {
  energia_solar: "sistema fotovoltaico de 0,00 kWp, composto por 00 módulos de 000 W, inversor de 0 kW, estruturas de fixação, cabeamento, string box e demais componentes necessários",
  carregador_residencial: "01 carregador wallbox AC de 7,4 kW, quadro de proteção dedicado, cabeamento e infraestrutura até a vaga de garagem",
  carregador_empresarial: "00 carregadores AC de 22 kW, quadro de distribuição, cabeamento, infraestrutura e sinalização das vagas",
  condominio: "infraestrutura coletiva de recarga com medição individualizada e 00 pontos de recarga AC",
  eletroposto: "00 carregadores DC de 00 kW, transformador, quadro geral, software de gestão e sinalização",
  frota: "00 carregadores para a frota, quadro de distribuição, cabeamento e software de gestão de recarga",
  manutencao: "visitas técnicas preventivas trimestrais, limpeza dos módulos, inspeção elétrica e atendimento corretivo em até 72 horas",
  outro: "",
};

function nextNumber(existing: Contract[]) {
  const year = new Date().getFullYear();
  const used = existing.map((item) => item.number.match(new RegExp(`^${year}/(\\d+)$`))?.[1]).filter(Boolean).map(Number);
  return `${year}/${String((used.length ? Math.max(...used) : 0) + 1).padStart(4, "0")}`;
}

export function createContract(existing: Contract[], service: ServiceType = "energia_solar"): Contract {
  const now = new Date().toISOString();
  const billing = defaultBilling(service);
  return {
    id: generateId("ctr"),
    number: nextNumber(existing),
    title: "",
    service,
    status: "rascunho",
    client: { kind: "pf", name: "", document: "", representative: "", address: "", city: "", state: "", email: "", phone: "" },
    installAddress: "",
    scope: DEFAULT_SCOPE[service],
    billing,
    value: 0,
    paymentTerms:
      billing === "mensal"
        ? "boleto bancário ou PIX"
        : "50% (cinquenta por cento) de entrada na assinatura e 50% (cinquenta por cento) na conclusão da instalação, via PIX ou transferência bancária",
    dueDay: 10,
    executionDays: service === "eletroposto" ? 90 : service === "energia_solar" ? 60 : 30,
    warrantyMonths: 12,
    durationMonths: billing === "mensal" ? 12 : null,
    startDate: now.slice(0, 10),
    forum: siteConfig.address.city !== "Cidade" ? `${siteConfig.address.city}/${siteConfig.address.state}` : "",
    clauses: defaultClauses(service, billing),
    createdAt: now,
    updatedAt: now,
  };
}

/** Pré-preenche um novo contrato com os dados de um lead. */
export function createContractFromLead(existing: Contract[], lead: Lead): Contract {
  const contract = createContract(existing, lead.service);
  const isCompany = lead.clientType === "empresa" || lead.clientType === "condominio" || lead.clientType === "poder_publico";
  return {
    ...contract,
    leadId: lead.id,
    title: lead.name,
    client: { ...contract.client, kind: isCompany ? "pj" : "pf", name: lead.name, email: lead.email, phone: lead.phone, city: lead.city, state: lead.state },
    forum: `${lead.city}/${lead.state}`,
  };
}

/**
 * Gera o contrato a partir de um orçamento aprovado: cliente, valor, prazo,
 * pagamento e escopo (lista de itens) vêm do orçamento.
 */
export function createContractFromQuote(existing: Contract[], quote: Quote, quoteTotal: number): Contract {
  const contract = createContract(existing, quote.service);
  const digits = quote.client.document.replace(/\D/g, "");
  const scope = quote.items
    .filter((item) => item.description.trim())
    .map((item) => `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(item.quantity)} ${item.unit} de ${item.description}`)
    .join("; ");
  return {
    ...contract,
    leadId: quote.leadId,
    title: quote.title,
    client: {
      ...contract.client,
      kind: digits.length > 11 ? "pj" : "pf",
      name: quote.client.name,
      document: quote.client.document,
      email: quote.client.email,
      phone: quote.client.phone,
      address: quote.client.address,
      city: quote.client.city,
      state: quote.client.state,
    },
    installAddress: quote.installAddress || [quote.client.address, quote.client.city && `${quote.client.city}/${quote.client.state}`].filter(Boolean).join(", "),
    scope: scope || contract.scope,
    value: quoteTotal,
    paymentTerms: quote.paymentTerms.replace(/\.$/, "") || contract.paymentTerms,
    executionDays: quote.executionDays || contract.executionDays,
    forum: quote.client.city ? `${quote.client.city}/${quote.client.state}` : contract.forum,
  };
}

export function duplicateContract(existing: Contract[], source: Contract): Contract {
  const now = new Date().toISOString();
  return {
    ...structuredClone(source),
    id: generateId("ctr"),
    number: nextNumber(existing),
    status: "rascunho",
    title: source.title ? `${source.title} (cópia)` : "",
    createdAt: now,
    updatedAt: now,
  };
}

/* -------------------------------- Formatação ------------------------------ */

/** Resumo da vigência para listagens. Ex.: "08/10/2026 a 07/10/2027". */
export function contractPeriod(contract: Contract) {
  const start = formatDate(`${contract.startDate}T12:00:00`);
  if (contract.billing === "unico") return `${start} · ${contract.executionDays} dias`;
  if (!contract.durationMonths) return `${start} (indeterminado)`;
  const end = new Date(`${contract.startDate}T12:00:00`);
  end.setMonth(end.getMonth() + contract.durationMonths);
  end.setDate(end.getDate() - 1);
  return `${start} a ${formatDate(end.toISOString())}`;
}

/** Data por extenso para o fecho. Ex.: "9 de outubro de 2026". */
export function longDate(isoDate: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${isoDate}T12:00:00`));
}
