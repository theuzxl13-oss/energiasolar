import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/config/site";
import { Container, Section } from "@/components/ui/primitives";
import { WhatsAppButtonLink } from "@/components/ui/site-content";
import { PageHero } from "@/components/sections/page-hero";
import { ContactDetails } from "@/components/sections/contact-details";
import { ContactForm } from "@/components/forms/contact-form";

export const metadata = buildMetadata({
  title: "Contato",
  description: `Fale com a ${siteConfig.name}: energia solar, carregadores para veículos elétricos e eletropostos. Atendimento por WhatsApp, telefone e e-mail.`,
  path: "/contato",
});

export default function ContatoPage() {
  return (
    <>
      <PageHero
        eyebrow="Contato"
        title="Fale com um especialista."
        description="Tire dúvidas, solicite uma visita técnica ou peça informações sobre nossas soluções. Escolha o canal de sua preferência."
        breadcrumb={[{ name: "Contato", path: "/contato" }]}
        actions={
          <WhatsAppButtonLink size="lg">
            Conversar no WhatsApp
          </WhatsAppButtonLink>
        }
      />
      <Section className="pt-0 sm:pt-0 lg:pt-0">
        <Container className="grid gap-20 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <ContactDetails />
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <ContactForm />
          </div>
        </Container>
      </Section>
    </>
  );
}
