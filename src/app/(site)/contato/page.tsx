import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/config/site";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { Container, Eyebrow, Section } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { PageHero } from "@/components/sections/page-hero";
import { ContactForm } from "@/components/forms/contact-form";

export const metadata = buildMetadata({
  title: "Contato",
  description: `Fale com a ${siteConfig.name}: energia solar, carregadores para veículos elétricos e eletropostos. Atendimento por WhatsApp, telefone e e-mail.`,
  path: "/contato",
});

export default function ContatoPage() {
  const { contact, address } = siteConfig;
  const channels = [
    { label: "WhatsApp", value: contact.whatsappDisplay, href: buildWhatsAppUrl(), external: true },
    { label: "Telefone", value: contact.phoneDisplay, href: `tel:${contact.phoneHref}` },
    { label: "E-mail", value: contact.email, href: `mailto:${contact.email}` },
  ];

  return (
    <>
      <PageHero
        eyebrow="Contato"
        title="Fale com um especialista."
        description="Tire dúvidas, solicite uma visita técnica ou peça informações sobre nossas soluções. Escolha o canal de sua preferência."
        breadcrumb={[{ name: "Contato", path: "/contato" }]}
        actions={
          <ButtonLink href={buildWhatsAppUrl()} external size="lg">
            Conversar no WhatsApp
          </ButtonLink>
        }
      />
      <Section className="pt-0 sm:pt-0 lg:pt-0">
        <Container className="grid gap-20 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <ul>
              {channels.map(({ label, value, href, external }) => (
                <li key={label} className="border-t border-white/10 py-6">
                  <p className="label-caps text-ash">{label}</p>
                  <a
                    href={href}
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="mt-2 block text-2xl tracking-[-0.03em] break-all text-white transition-colors hover:text-brand-300 sm:text-3xl"
                  >
                    {value}
                  </a>
                </li>
              ))}
              <li className="border-t border-white/10 py-6">
                <p className="label-caps text-ash">Endereço</p>
                <p className="mt-2 text-lg font-extralight text-white">
                  {address.street}, {address.district}
                  <br />
                  {address.city} — {address.state} · CEP {address.zipCode}
                </p>
                <p className="mt-1 text-sm font-extralight text-ash">{siteConfig.serviceArea}</p>
                {address.mapsUrl && (
                  <ButtonLink href={address.mapsUrl} external variant="ghost">
                    Ver no mapa
                  </ButtonLink>
                )}
              </li>
              <li className="border-t border-white/10 py-6">
                <Eyebrow>Horário de atendimento</Eyebrow>
                <dl className="mt-3 space-y-1 font-extralight">
                  {siteConfig.businessHours.map((item) => (
                    <div key={item.label} className="flex justify-between gap-4">
                      <dt className="text-mist">{item.label}</dt>
                      <dd className="text-white">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </li>
            </ul>
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <ContactForm />
          </div>
        </Container>
      </Section>
    </>
  );
}
