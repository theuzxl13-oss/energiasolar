import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { FloatingActions } from "@/components/layout/floating-actions";
import { OrganizationJsonLd } from "@/components/seo/json-ld";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-night-900 focus:shadow-lg"
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
