import { siteConfig } from "@/config/site";
import type { FaqItem } from "@/types";

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Conteúdo estático gerado no servidor a partir da configuração.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

/**
 * Schema.org da empresa. Campos com placeholders não são incluídos,
 * evitando publicar dados fictícios como se fossem reais.
 */
export function OrganizationJsonLd() {
  const sameAs = Object.values(siteConfig.social).filter(
    (url): url is string => typeof url === "string" && /^https:\/\/[^/]+\/.+/.test(url),
  );
  const hasRealAddress = !siteConfig.address.street.includes("a definir");

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${siteConfig.url}/#empresa`,
    name: siteConfig.name,
    slogan: siteConfig.slogan,
    description: siteConfig.description,
    url: siteConfig.url,
    logo: `${siteConfig.url}${siteConfig.logoOriginal}`,
    image: `${siteConfig.url}${siteConfig.logoOriginal}`,
    knowsAbout: ["Energia solar fotovoltaica", "Carregadores para veículos elétricos", "Wallbox", "Eletropostos"],
    makesOffer: [
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Projeto e instalação de energia solar" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Instalação de carregadores para veículos elétricos" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Implantação de eletropostos" } },
    ],
  };

  if (!siteConfig.contact.email.includes("seudominio")) data.email = siteConfig.contact.email;
  if (!/^\+550+$/.test(siteConfig.contact.phoneHref)) data.telephone = siteConfig.contact.phoneHref;
  if (sameAs.length) data.sameAs = sameAs;
  if (hasRealAddress) {
    data.address = {
      "@type": "PostalAddress",
      streetAddress: siteConfig.address.street,
      addressLocality: siteConfig.address.city,
      addressRegion: siteConfig.address.state,
      postalCode: siteConfig.address.zipCode,
      addressCountry: "BR",
    };
  }

  return <JsonLd data={data} />;
}

export function FaqJsonLd({ items }: { items: FaqItem[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      }}
    />
  );
}

export function BreadcrumbJsonLd({ items }: { items: { name: string; path: string }[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: `${siteConfig.url}${item.path}`,
        })),
      }}
    />
  );
}

export function ServiceJsonLd({ name, description, path }: { name: string; description: string; path: string }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Service",
        name,
        description,
        url: `${siteConfig.url}${path}`,
        areaServed: { "@type": "Country", name: "Brasil" },
        provider: { "@id": `${siteConfig.url}/#empresa` },
      }}
    />
  );
}
