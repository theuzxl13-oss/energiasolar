import type { Quote } from "@/types";

/**
 * ORÇAMENTO FICTÍCIO PARA O PAINEL DEMONSTRATIVO.
 * Cliente, contatos e preços inventados — não pertencem a pessoa real.
 */
export const mockQuotes: Quote[] = [
  {
    id: "orc_demo_1",
    number: "2026/0001",
    title: "Sistema solar residencial 6,6 kWp",
    service: "energia_solar",
    status: "enviado",
    client: {
      name: "Ana Ferreira (cliente fictícia)",
      document: "",
      phone: "(19) 90000-0000",
      email: "ana.ferreira@exemplo.com",
      address: "Rua Exemplo, 123 — Jardim Demonstração",
      city: "Campinas",
      state: "SP",
    },
    installAddress: "Rua Exemplo, 123 — Jardim Demonstração, Campinas/SP",
    description:
      "Apresentamos nossa proposta para a implantação de um sistema de energia solar fotovoltaica conectado à rede, dimensionado a partir do seu histórico de consumo. A solução inclui projeto, homologação junto à concessionária, fornecimento dos equipamentos e instalação completa.",
    highlights: [
      { label: "Potência do sistema", value: "6,6 kWp" },
      { label: "Geração estimada", value: "≈ 820 kWh/mês" },
      { label: "Economia estimada", value: "≈ R$ 690/mês" },
    ],
    items: [
      { id: "it_demo_1", description: "Módulo fotovoltaico 550 W", quantity: 12, unit: "un", unitPrice: 890 },
      { id: "it_demo_2", description: "Inversor solar on-grid 6 kW", quantity: 1, unit: "un", unitPrice: 5200 },
      { id: "it_demo_3", description: "Estrutura de fixação para telhado cerâmico", quantity: 1, unit: "cj", unitPrice: 1650 },
      { id: "it_demo_4", description: "String box, cabos e conectores", quantity: 1, unit: "cj", unitPrice: 1320 },
      { id: "it_demo_5", description: "Projeto, homologação na concessionária, instalação e ART", quantity: 1, unit: "vb", unitPrice: 6500 },
    ],
    discount: 450,
    paymentTerms: "50% de entrada na aprovação e 50% na conclusão, via PIX ou transferência. Consulte condições de financiamento e parcelamento no cartão.",
    executionDays: 45,
    validityDays: 15,
    warranty: "Módulos: 12 anos contra defeitos e 25 anos de performance (fabricante). Inversor: 10 anos (fabricante). Instalação: 12 meses.",
    notes: "Valores de geração e economia são estimativas baseadas na irradiação média da região e na tarifa vigente, podendo variar conforme clima e regras tarifárias.",
    issueDate: "2026-10-01",
    createdAt: "2026-10-01T12:00:00.000Z",
    updatedAt: "2026-10-01T12:00:00.000Z",
  },
];
