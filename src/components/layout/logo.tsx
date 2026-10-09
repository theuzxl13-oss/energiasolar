import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
// Versões do logo para fundo escuro (fundo transparente, partes escuras em branco).
import monogram from "@/assets/brand/dc-monogram-dark.png";
import fullLogo from "@/assets/brand/dc-eco-energy-dark.png";

/** Monograma "DC" + nome da marca — usado na navbar. */
export function Logo({ className }: { tone?: "dark" | "light"; className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-3", className)} aria-label={`${siteConfig.name} — página inicial`}>
      <Image src={monogram} alt="" className="h-8 w-auto sm:h-9" priority sizes="80px" />
      <span className="text-lg tracking-[-0.02em] whitespace-nowrap text-white">
        {/* Destaca "Eco" em verde, como no logotipo oficial. */}
        {siteConfig.name.split(" ").map((word, index) => (
          <span key={`${word}-${index}`} className={word.toLowerCase() === "eco" ? "text-brand-400" : undefined}>
            {index > 0 && " "}
            {word}
          </span>
        ))}
      </span>
    </Link>
  );
}

/** Logo completo (monograma, nome e slogan) — usado no rodapé e em destaques. */
export function FullLogo({ className }: { className?: string }) {
  return <Image src={fullLogo} alt={`${siteConfig.name} — ${siteConfig.slogan}`} className={cn("h-auto w-full", className)} sizes="(min-width: 1024px) 360px, 70vw" />;
}

export { monogram as brandMonogram };
