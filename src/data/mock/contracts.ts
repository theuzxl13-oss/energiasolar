import { defaultClauses } from "@/lib/contracts";
import type { Contract } from "@/types";

/**
 * CONTRATO FICTÍCIO PARA O PAINEL DEMONSTRATIVO.
 * Cliente e documento inventados — não pertencem a pessoa real.
 */
export const mockContracts: Contract[] = [
  {
    id: "ctr_demo_1",
    number: "2026/0001",
    title: "Sistema solar residencial 6,6 kWp",
    service: "energia_solar",
    status: "emitido",
    client: {
      kind: "pf",
      name: "Ana Ferreira (cliente fictícia)",
      document: "000.000.000-00",
      representative: "",
      address: "Rua Exemplo, 123 — Jardim Demonstração",
      city: "Campinas",
      state: "SP",
      email: "ana.ferreira@exemplo.com",
      phone: "(19) 90000-0000",
    },
    installAddress: "Rua Exemplo, 123 — Jardim Demonstração, Campinas/SP",
    scope: "sistema fotovoltaico de 6,6 kWp, composto por 12 módulos de 550 W, inversor de 6 kW, estruturas de fixação para telhado cerâmico, cabeamento, string box e demais componentes necessários",
    billing: "unico",
    value: 24900,
    paymentTerms: "50% (cinquenta por cento) de entrada na assinatura e 50% (cinquenta por cento) na conclusão da instalação, via PIX ou transferência bancária",
    dueDay: 10,
    executionDays: 60,
    warrantyMonths: 12,
    durationMonths: null,
    startDate: "2026-10-05",
    forum: "Campinas/SP",
    clauses: defaultClauses("energia_solar", "unico").map((clause, index) => ({ ...clause, id: `cl_demo_${index}` })),
    createdAt: "2026-10-05T12:00:00.000Z",
    updatedAt: "2026-10-05T12:00:00.000Z",
  },
];
