/**
 * ============================================================================
 * DADOS DA EMPRESA — FONTE ÚNICA DE VERDADE
 * ============================================================================
 * Todas as informações institucionais exibidas no site (navbar, footer,
 * contato, SEO, JSON-LD, WhatsApp, chat) são lidas daqui.
 *
 * Os valores abaixo são PLACEHOLDERS claramente identificáveis. Substitua-os
 * pelos dados oficiais da empresa antes de publicar em produção.
 * Campos opcionais podem receber `null` para não serem exibidos.
 * ============================================================================
 */

export const siteConfig = {
  /** Nome comercial exibido no site. */
  name: "Sua Empresa",
  /** Complemento exibido ao lado do nome (logo, rodapé, títulos). */
  tagline: "Energia Solar & Mobilidade Elétrica",
  /** Razão social para rodapé e documentos. */
  legalName: "Razão Social da Empresa (a definir)",
  /** CNPJ — placeholder. Nunca preencher com número fictício "realista". */
  cnpj: "00.000.000/0000-00",

  /** Caminho de um logo em /public (ex.: "/logo.svg"). `null` usa o logotipo vetorial padrão. */
  logo: null as string | null,

  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "pt_BR",

  description:
    "Projetos completos de energia solar fotovoltaica, carregadores para veículos elétricos, wallbox e eletropostos para residências, empresas, condomínios, indústrias e propriedades rurais.",

  contact: {
    phoneDisplay: "(00) 0000-0000",
    phoneHref: "+550000000000",
    /**
     * WhatsApp no formato internacional, somente dígitos: 55 + DDD + número.
     * Este é o ÚNICO lugar onde o número precisa ser alterado.
     */
    whatsapp: "5500000000000",
    whatsappDisplay: "(00) 00000-0000",
    email: "contato@seudominio.com.br",
  },

  /** Mensagem pré-configurada ao abrir o WhatsApp. */
  whatsappDefaultMessage:
    "Olá! Acessei o site e gostaria de receber mais informações sobre as soluções de energia.",

  address: {
    street: "Endereço da empresa (a definir)",
    district: "Bairro",
    city: "Cidade",
    state: "UF",
    zipCode: "00000-000",
    /** Link do Google Maps. `null` oculta o botão "Ver no mapa". */
    mapsUrl: null as string | null,
  },

  /** Área de atendimento declarada. */
  serviceArea: "Área de atendimento a definir",

  businessHours: [
    { label: "Segunda a sexta", value: "08h às 18h" },
    { label: "Sábado", value: "08h às 12h" },
  ],

  /** Redes sociais. `null` oculta o ícone. */
  social: {
    instagram: "https://instagram.com/" as string | null,
    facebook: "https://facebook.com/" as string | null,
    linkedin: "https://linkedin.com/" as string | null,
    youtube: null as string | null,
  },

  /** Ano de fundação (opcional). `null` oculta a informação. */
  foundedYear: null as number | null,
} as const;

export type SiteConfig = typeof siteConfig;

/** Indica se o site está em modo demonstração (selos e dados mockados). */
export const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";
