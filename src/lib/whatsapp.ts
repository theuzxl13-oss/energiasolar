import { siteConfig } from "@/config/site";

/**
 * Monta o link de conversa do WhatsApp usando o número centralizado
 * em `src/config/site.ts`.
 */
export function buildWhatsAppUrl(message: string = siteConfig.whatsappDefaultMessage) {
  const phone = siteConfig.contact.whatsapp.replace(/\D/g, "");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
