import type { Testimonial } from "@/types";

/**
 * DEPOIMENTOS DEMONSTRATIVOS
 * Textos ilustrativos para apresentação do layout. NÃO representam clientes
 * reais e são exibidos com o selo "Depoimento demonstrativo".
 * Substitua por depoimentos autorizados ou ative a integração com o Google
 * (ver `src/services/reviews`).
 */
export const demoTestimonials: Testimonial[] = [
  {
    id: "demo-1",
    author: "Cliente residencial",
    role: "Exemplo — Energia Solar",
    content:
      "Espaço reservado para o depoimento de um cliente real sobre o projeto solar residencial: atendimento, prazo de instalação e resultado na conta de energia.",
    rating: 5,
    service: "Energia Solar",
    source: "demo",
  },
  {
    id: "demo-2",
    author: "Síndico(a) de condomínio",
    role: "Exemplo — Carregadores",
    content:
      "Espaço reservado para o relato de um condomínio sobre a infraestrutura de recarga: aprovação em assembleia, medição individual e funcionamento no dia a dia.",
    rating: 5,
    service: "Carregadores",
    source: "demo",
  },
  {
    id: "demo-3",
    author: "Empresário(a) do varejo",
    role: "Exemplo — Eletroposto",
    content:
      "Espaço reservado para o depoimento de um estabelecimento comercial sobre a implantação do eletroposto e a percepção dos clientes.",
    rating: 5,
    service: "Eletropostos",
    source: "demo",
  },
];
