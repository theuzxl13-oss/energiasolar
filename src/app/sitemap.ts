import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { projects } from "@/data/projects";

/** Gerado no build (compatível também com exportação estática). */
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes: { path: string; priority: number; changeFrequency: "weekly" | "monthly" | "yearly" }[] = [
    { path: "", priority: 1, changeFrequency: "weekly" },
    { path: "/energia-solar", priority: 0.9, changeFrequency: "monthly" },
    { path: "/carregadores", priority: 0.9, changeFrequency: "monthly" },
    { path: "/eletropostos", priority: 0.9, changeFrequency: "monthly" },
    { path: "/orcamento", priority: 0.8, changeFrequency: "yearly" },
    { path: "/projetos", priority: 0.7, changeFrequency: "weekly" },
    { path: "/sobre", priority: 0.6, changeFrequency: "yearly" },
    { path: "/contato", priority: 0.6, changeFrequency: "yearly" },
    { path: "/politica-de-privacidade", priority: 0.2, changeFrequency: "yearly" },
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: `${siteConfig.url}${route.path}`,
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...projects.map((project) => ({
      url: `${siteConfig.url}/projetos/${project.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
