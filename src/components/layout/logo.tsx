import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/**
 * Marca padrão: fragmento angular (raio) com gradiente verde → verde profundo,
 * ecoando os triângulos da constelação. Substituído por `siteConfig.logo` se definido.
 */
function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="logo-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34d684" />
          <stop offset="100%" stopColor="#15846e" />
        </linearGradient>
      </defs>
      <path d="M18.5 1 4 18.5h9.5L11 31 28 12h-9.8L18.5 1Z" fill="url(#logo-gradient)" />
    </svg>
  );
}

export function Logo({ className }: { tone?: "dark" | "light"; className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)} aria-label={`${siteConfig.name} — página inicial`}>
      {siteConfig.logo ? (
        <Image src={siteConfig.logo} alt={siteConfig.name} width={160} height={40} className="h-9 w-auto" priority />
      ) : (
        <>
          <LogoMark className="size-7 shrink-0" />
          <span className="text-lg tracking-[-0.02em] whitespace-nowrap text-white">{siteConfig.name}</span>
        </>
      )}
    </Link>
  );
}
