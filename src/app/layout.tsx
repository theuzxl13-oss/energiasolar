import type { Metadata, Viewport } from "next";
import { siteConfig } from "@/config/site";
import { SEO_KEYWORDS } from "@/lib/seo";
import { MotionProvider } from "@/components/providers/motion-provider";
/**
 * Fonte Inter (variável) hospedada no próprio projeto, via @fontsource —
 * o build não depende do Google Fonts e o carregamento fica mais rápido.
 */
import "@fontsource-variable/inter";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} | Energia Solar, Carregadores Veiculares e Eletropostos`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: SEO_KEYWORDS,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: "/",
    siteName: siteConfig.name,
    title: `${siteConfig.name} | Energia Solar e Mobilidade Elétrica`,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} | Energia Solar e Mobilidade Elétrica`,
    description: siteConfig.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: o tema salvo (data-theme) é aplicado por script antes da hidratação.
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-dvh font-sans antialiased">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
