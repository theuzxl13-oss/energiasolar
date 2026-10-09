import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
// Versões do logo: "dark" para o tema escuro (texto branco) e "light" para o tema claro (texto azul-marinho).
import emblemDark from "@/assets/brand/dc-emblem-dark.png";
import emblemLight from "@/assets/brand/dc-emblem-light.png";
import fullLogoDark from "@/assets/brand/dc-eco-energy-dark.png";
import fullLogoLight from "@/assets/brand/dc-eco-energy-light.png";

/** Emblema + nome da marca — usado na navbar. */
export function Logo({ className }: { tone?: "dark" | "light"; className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-3", className)} aria-label={`${siteConfig.name} — página inicial`}>
      <Image src={emblemDark} alt="" className="h-10 w-auto light:hidden" priority sizes="48px" />
      <Image src={emblemLight} alt="" className="hidden h-10 w-auto light:block" sizes="48px" />
      <span className="text-lg tracking-[-0.02em] whitespace-nowrap text-white">
        {/* Grafia do logotipo: "DC" em maiúsculas, "eco" em verde, demais palavras em minúsculas. */}
        {siteConfig.name.split(" ").map((word, index) => (
          <span key={`${word}-${index}`} className={word.toLowerCase() === "eco" ? "text-brand-400" : undefined}>
            {index > 0 && " "}
            {index === 0 ? word : word.toLowerCase()}
          </span>
        ))}
      </span>
    </Link>
  );
}

/** Logo completo (emblema, nome e frase de apoio) — usado no rodapé. */
export function FullLogo({ className }: { className?: string }) {
  const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
  const sizes = "(min-width: 1024px) 360px, 70vw";
  return (
    <>
      <Image src={fullLogoDark} alt={alt} className={cn("h-auto w-full light:hidden", className)} sizes={sizes} />
      <Image src={fullLogoLight} alt={alt} className={cn("hidden h-auto w-full light:block", className)} sizes={sizes} />
    </>
  );
}

export { emblemDark as brandMonogram };
