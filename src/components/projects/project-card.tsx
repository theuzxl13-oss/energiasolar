import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/types";
import { PROJECT_CATEGORY_LABELS, projectHref } from "@/data/projects";
import { DemoBadge } from "@/components/ui/primitives";
import { ProjectArt } from "@/components/illustrations/project-art";
import { cn } from "@/lib/utils";

export function ProjectMedia({ project, className, priority = false }: { project: Project; className?: string; priority?: boolean }) {
  if (project.image) {
    return (
      <div className={cn("relative overflow-hidden rounded-3xl", className)}>
        {project.image.startsWith("data:") ? (
          // Foto enviada pelo painel (guardada no navegador).
          // eslint-disable-next-line @next/next/no-img-element
          <img src={project.image} alt={project.title} className="absolute inset-0 size-full object-cover" />
        ) : (
          <Image src={project.image} alt={project.title} fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" priority={priority} />
        )}
      </div>
    );
  }
  return <ProjectArt art={project.art} className={cn("rounded-3xl ring-1 ring-white/10", className)} />;
}

/** Card sem contêiner: imagem arredondada + texto flutuando no preto. */
export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="group relative">
      <ProjectMedia project={project} className="aspect-[16/11] transition duration-500 group-hover:ring-brand-400/50" />
      <p className="label-caps mt-6 text-brand-400">
        {PROJECT_CATEGORY_LABELS[project.category]}
        {project.power && ` · ${project.power}`}
      </p>
      <h3 className="mt-3 text-2xl tracking-[-0.03em] text-white">
        <Link href={projectHref(project.slug)} className="after:absolute after:inset-0 after:content-[''] group-hover:text-brand-300">
          {project.title}
        </Link>
      </h3>
      <p className="mt-2 font-extralight text-mist">{project.summary}</p>
      {project.isDemo && <DemoBadge label="Projeto demonstrativo" className="mt-4" />}
    </article>
  );
}
