"use client";

import { useSiteSettings } from "@/hooks/use-site-content";
import { phoneHref, whatsappUrl } from "@/lib/site-content";
import { Eyebrow } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";

/** Canais, endereço e horário da página de contato (dados editáveis no painel). */
export function ContactDetails() {
  const { settings } = useSiteSettings();
  const { contact, address } = settings;
  const channels = [
    { label: "WhatsApp", value: contact.whatsappDisplay, href: whatsappUrl(settings), external: true },
    { label: "Telefone", value: contact.phoneDisplay, href: `tel:${phoneHref(settings)}` },
    { label: "E-mail", value: contact.email, href: `mailto:${contact.email}` },
  ];

  return (
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
          {address.street}
          {address.district && `, ${address.district}`}
          <br />
          {address.city} — {address.state}
          {address.zipCode && ` · CEP ${address.zipCode}`}
        </p>
        {settings.serviceArea && <p className="mt-1 text-sm font-extralight text-ash">{settings.serviceArea}</p>}
        {address.mapsUrl.trim() && (
          <ButtonLink href={address.mapsUrl} external variant="ghost">
            Ver no mapa
          </ButtonLink>
        )}
      </li>
      <li className="border-t border-white/10 py-6">
        <Eyebrow>Horário de atendimento</Eyebrow>
        <dl className="mt-3 space-y-1 font-extralight">
          {settings.businessHours.map((item, index) => (
            <div key={`${item.label}-${index}`} className="flex justify-between gap-4">
              <dt className="text-mist">{item.label}</dt>
              <dd className="text-white">{item.value}</dd>
            </div>
          ))}
        </dl>
      </li>
    </ul>
  );
}
