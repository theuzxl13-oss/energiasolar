"use client";

import { useSiteSettings, useWhatsAppUrl } from "@/hooks/use-site-content";
import { phoneHref, type SiteSettings } from "@/lib/site-content";
import { ButtonLink } from "./button";

/**
 * Peças pequenas que mostram os dados editáveis da empresa dentro de páginas
 * renderizadas no servidor (o resto da página continua estático).
 */

type ButtonLinkProps = Omit<React.ComponentProps<typeof ButtonLink>, "href" | "external">;

/** Botão que abre o WhatsApp da empresa (número editável em /admin/conteudo). */
export function WhatsAppButtonLink({ message, ...props }: ButtonLinkProps & { message?: string }) {
  const href = useWhatsAppUrl(message);
  return <ButtonLink href={href} external {...props} />;
}

const TEXT_FIELDS: Record<"legalName" | "cnpj" | "email" | "phone" | "whatsapp", (settings: SiteSettings) => string> = {
  legalName: (s) => s.legalName,
  cnpj: (s) => s.cnpj,
  email: (s) => s.contact.email,
  phone: (s) => s.contact.phoneDisplay,
  whatsapp: (s) => s.contact.whatsappDisplay,
};

/** Texto de um dado da empresa, ex.: <CompanyText field="cnpj" />. */
export function CompanyText({ field }: { field: "legalName" | "cnpj" | "email" | "phone" | "whatsapp" }) {
  const { settings } = useSiteSettings();
  return <>{TEXT_FIELDS[field](settings)}</>;
}

/** Link de telefone ou e-mail da empresa. */
export function CompanyContactLink({ kind, className }: { kind: "phone" | "email"; className?: string }) {
  const { settings } = useSiteSettings();
  const href = kind === "phone" ? `tel:${phoneHref(settings)}` : `mailto:${settings.contact.email}`;
  return (
    <a href={href} className={className}>
      {kind === "phone" ? settings.contact.phoneDisplay : settings.contact.email}
    </a>
  );
}
