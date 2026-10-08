import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { Container } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";

interface CtaBannerProps {
  title?: string;
  description?: string;
  primary?: { label: string; href: string };
  whatsappMessage?: string;
}

/** Chamada final: título monumental + uma única ação preenchida. */
export function CtaBanner({
  title = "Vamos tirar o seu projeto do papel?",
  description = "Receba uma análise da sua necessidade e uma proposta técnica e comercial personalizada.",
  primary = { label: "Solicitar orçamento", href: "/orcamento" },
  whatsappMessage,
}: CtaBannerProps) {
  return (
    <section className="py-20 sm:py-28">
      <Container className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        <h2 className="text-headline text-white lg:col-span-8">{title}</h2>
        <div className="lg:col-span-4 lg:pt-4">
          <p className="text-lead text-mist">{description}</p>
          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
            <ButtonLink href={primary.href} size="lg">
              {primary.label}
            </ButtonLink>
            <ButtonLink href={buildWhatsAppUrl(whatsappMessage)} external variant="whatsapp">
              WhatsApp
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
