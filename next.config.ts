import type { NextConfig } from "next";

/**
 * Dois modos de build:
 * - Padrão (Vercel / Node): site completo com rotas de API, proxy e cabeçalhos.
 * - Estático (STATIC_EXPORT=true): versão de apresentação para hospedagem
 *   estática (GitHub Pages). Ver `.github/workflows/deploy-pages.yml`.
 */
const isStaticExport = process.env.STATIC_EXPORT === "true";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

/**
 * Cabeçalhos de segurança aplicados a todas as rotas.
 * Uma Content-Security-Policy completa deve ser adicionada quando os domínios
 * de terceiros definitivos (analytics, mapas, avaliações) forem conhecidos.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    unoptimized: isStaticExport,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  ...(isStaticExport
    ? { output: "export" as const, trailingSlash: true, basePath }
    : {
        async headers() {
          return [{ source: "/(.*)", headers: securityHeaders }];
        },
      }),
};

export default nextConfig;
