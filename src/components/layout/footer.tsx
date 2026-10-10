"use client";

import Link from "next/link";
import { footerNavigation } from "@/config/navigation";
import { isDemoMode, siteConfig } from "@/config/site";
import { useSiteSettings } from "@/hooks/use-site-content";
import { phoneHref, whatsappUrl } from "@/lib/site-content";
import { Container } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { FullLogo } from "./logo";
import { SocialLinks } from "./social-icons";

export function Footer() {
  const year = new Date().getFullYear();
  const { settings } = useSiteSettings();
  const { address, contact } = settings;
  const whatsappHref = whatsappUrl(settings);

  return (
    <footer className="relative text-mist">
      <Container>
        <div className="grid gap-10 border-t border-white/10 py-20 lg:grid-cols-12 lg:py-28">
          <p className="text-headline text-white lg:col-span-8">Pronto para gerar sua própria energia?</p>
          <div className="flex flex-col items-start gap-4 lg:col-span-4 lg:items-end lg:justify-end">
            <ButtonLink href="/orcamento" size="lg">
              Solicitar orçamento
            </ButtonLink>
            <ButtonLink href={whatsappHref} external variant="whatsapp">
              Falar no WhatsApp
            </ButtonLink>
          </div>
        </div>

        <div className="grid gap-12 pb-16 md:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <FullLogo className="max-w-[300px]" />
            <p className="mt-8 max-w-sm text-sm leading-relaxed font-extralight">{siteConfig.description}</p>
            <SocialLinks className="mt-6" />
          </div>

          <FooterColumn title="Soluções" links={footerNavigation.solucoes} className="lg:col-span-3" />
          <FooterColumn title="Empresa" links={[...footerNavigation.empresa, ...footerNavigation.ferramentas]} className="lg:col-span-2" />

          <div className="lg:col-span-3">
            <h2 className="label-caps text-spark">Contato</h2>
            <ul className="mt-5 space-y-3 text-sm font-extralight">
              <li>
                <a href={`tel:${phoneHref(settings)}`} className="hover:text-white">
                  {contact.phoneDisplay}
                </a>
              </li>
              <li>
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  WhatsApp {contact.whatsappDisplay}
                </a>
              </li>
              <li>
                <a href={`mailto:${contact.email}`} className="break-all hover:text-white">
                  {contact.email}
                </a>
              </li>
              <li>
                {address.street}
                <br />
                {address.city} — {address.state}
              </li>
              {settings.businessHours.map((item, index) => (
                <li key={`${item.label}-${index}`}>
                  {item.label}: {item.value}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 py-8 text-xs text-ash md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {settings.legalName} · CNPJ {settings.cnpj}
          </p>
          {isDemoMode && <p className="text-spark/80">Versão demonstrativa — dados institucionais, indicadores, projetos e depoimentos são ilustrativos.</p>}
        </div>
      </Container>
    </footer>
  );
}

function FooterColumn({ title, links, className }: { title: string; links: { label: string; href: string }[]; className?: string }) {
  return (
    <div className={className}>
      <h2 className="label-caps text-spark">{title}</h2>
      <ul className="mt-5 space-y-3 text-sm font-extralight">
        {links.map((link) => (
          <li key={`${link.href}-${link.label}`}>
            <Link href={link.href} className="transition hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
