"use client";

import { featuredProjects } from "@/data/projects";
import { useProjects } from "@/hooks/use-site-content";
import { Container, Section, SectionHeading } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { ProjectCard } from "@/components/projects/project-card";

export function ProjectsPreview() {
  const { items } = useProjects();
  const featured = featuredProjects(items);
  if (!featured.length) return null;
  return (
    <Section id="projetos">
      <Container>
        <SectionHeading
          eyebrow="Portfólio"
          title="Projetos que geram resultado."
          description={
            featured.some((project) => project.isDemo)
              ? "Exemplos de soluções em energia solar, recarga veicular e eletropostos (projetos demonstrativos)."
              : "Exemplos de soluções em energia solar, recarga veicular e eletropostos."
          }
        />
        <ul className="mt-20 grid gap-x-10 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((project, index) => (
            <Reveal key={project.slug} as="li" delay={index * 0.08}>
              <ProjectCard project={project} />
            </Reveal>
          ))}
        </ul>
        <ButtonLink href="/projetos" variant="ghost" className="mt-12 text-white">
          Ver todos os projetos
        </ButtonLink>
      </Container>
    </Section>
  );
}
