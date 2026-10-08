import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

export const SEO_KEYWORDS = [
  "energia solar",
  "empresa de energia solar",
  "painel solar",
  "instalação energia solar",
  "energia fotovoltaica",
  "carregador carro elétrico",
  "wallbox",
  "instalação wallbox",
  "carregador veicular",
  "eletroposto",
  "estação de recarga",
  "carregamento de veículos elétricos",
];

interface PageSeo {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  noIndex?: boolean;
}

/** Gera metadados consistentes (title, description, canonical, Open Graph, Twitter). */
export function buildMetadata({ title, description, path, keywords = [], noIndex = false }: PageSeo): Metadata {
  return {
    title,
    description,
    keywords: [...keywords, ...SEO_KEYWORDS],
    alternates: { canonical: path },
    openGraph: {
      title: `${title} | ${siteConfig.name}`,
      description,
      url: path,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteConfig.name}`,
      description,
    },
    robots: noIndex ? { index: false, follow: false } : undefined,
  };
}
