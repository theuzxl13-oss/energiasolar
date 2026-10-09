import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { FloatingActions } from "@/components/layout/floating-actions";
import { OrganizationJsonLd } from "@/components/seo/json-ld";
import { ThemeScript, ThemeSync } from "@/components/providers/theme";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ThemeScript />
      <ThemeSync />
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-full focus:bg-brand-400 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-black"
      >
        Pular para o conteúdo
      </a>
      <Navbar />
      <main id="conteudo">{children}</main>
      <Footer />
      <FloatingActions />
      <OrganizationJsonLd />
    </>
  );
}
