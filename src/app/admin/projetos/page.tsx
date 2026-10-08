import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { PROJECT_CATEGORY_LABELS, projects } from "@/data/projects";
import { AdminPageHeader, DemoNote } from "@/components/admin/ui";
import { ProjectArt } from "@/components/illustrations/project-art";
import { DemoBadge } from "@/components/ui/primitives";

export const metadata = { title: "Projetos" };

export default function AdminProjetosPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Projetos" description={`${projects.length} projetos publicados no portfólio`} />
      <DemoNote>
        Os projetos são lidos de <code>src/data/projects.ts</code>. Com o Supabase conectado, esta tela passa a listar a tabela <code>projects</code>.
      </DemoNote>
      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <li key={project.slug} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <ProjectArt art={project.art} className="aspect-[16/8]" />
            <div className="p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">{PROJECT_CATEGORY_LABELS[project.category]}</span>
                {project.isDemo && <DemoBadge tone="light" label="Demonstrativo" />}
              </div>
              <h2 className="mt-3 font-semibold text-night-900">{project.title}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {project.power} • {project.segment}
              </p>
              <Link href={`/projetos/${project.slug}`} target="_blank" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
                Ver no site <ExternalLink className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
