import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo";
import { getProjectBySlug, projects } from "@/data/projects";
import { ProjectDetail } from "@/components/projects/project-detail";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return {};
  return buildMetadata({ title: project.title, description: project.summary, path: `/projetos/${project.slug}` });
}

/** Projetos originais (página estática); o conteúdo reflete as edições feitas no painel. */
export default async function ProjetoPage({ params }: PageProps) {
  const { slug } = await params;
  if (!getProjectBySlug(slug)) notFound();
  return <ProjectDetail slug={slug} />;
}
