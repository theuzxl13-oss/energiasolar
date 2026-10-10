"use client";

import { PROJECT_CATEGORY_LABELS, projectHref } from "@/data/projects";
import { useContentReady, useProjects } from "@/hooks/use-site-content";
import { Container, DemoBadge, Eyebrow, Section } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { PageHero } from "@/components/sections/page-hero";
import { ProjectCard, ProjectMedia } from "./project-card";

const SERVICE_BY_CATEGORY = { solar: "solar", carregadores: "carregador", eletropostos: "eletroposto" } as const;

/** Página de um projeto (lê a lista editável no painel). */
export function ProjectDetail({ slug }: { slug: string }) {
  const ready = useContentReady();
  const { items: projects } = useProjects();
  const project = projects.find((item) => item.slug === slug);

  if (!project) {
    return (
      <PageHero
        eyebrow="Portfólio"
        title={ready ? "Projeto não encontrado." : "Carregando…"}
        description={ready ? "Este projeto pode ter sido removido ou o endereço está incorreto." : ""}
        breadcrumb={[{ name: "Projetos", path: "/projetos" }]}
        actions={
          ready && (
            <ButtonLink href="/projetos" variant="ghost">
              Ver todos os projetos
            </ButtonLink>
          )
        }
      />
    );
  }

  const related = projects.filter((item) => item.slug !== project.slug && item.category === project.category).slice(0, 3);
  const others = related.length ? related : projects.filter((item) => item.slug !== project.slug).slice(0, 3);
  const info = [
    { label: "Potência", value: project.power },
    { label: "Localização", value: project.location },
    ...project.technicalInfo,
  ].filter((item) => item.label.trim() && item.value.trim());

  return (
    <>
      <PageHero
        eyebrow={[PROJECT_CATEGORY_LABELS[project.category], project.segment].filter(Boolean).join(" · ")}
        title={project.title}
        description={project.summary}
        breadcrumb={[
          { name: "Projetos", path: "/projetos" },
          { name: project.title, path: projectHref(project.slug) },
        ]}
      >
        {project.isDemo && <DemoBadge label="Projeto demonstrativo — dados ilustrativos" className="mt-8" />}
      </PageHero>

      <Section className="pt-0 sm:pt-0 lg:pt-0">
        <Container>
          <ProjectMedia project={project} className="aspect-[16/8]" priority />

          <div className="mt-20 grid gap-16 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7">
              {project.description && (
                <>
                  <Eyebrow>Sobre o projeto</Eyebrow>
                  <p className="mt-5 text-2xl leading-snug font-extralight whitespace-pre-line text-white">{project.description}</p>
                </>
              )}

              {project.highlights.length > 0 && (
                <>
                  <Eyebrow className="mt-14">Destaques</Eyebrow>
                  <ul className="mt-5 space-y-3 text-lg font-extralight text-mist">
                    {project.highlights.map((highlight) => (
                      <li key={highlight} className="flex gap-3">
                        <span className="mt-3 size-1 shrink-0 rounded-full bg-brand-400" aria-hidden="true" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {(project.result || project.estimatedSavings) && <Eyebrow className="mt-14">Resultado</Eyebrow>}
              {project.result && <p className="mt-5 text-lead text-white">{project.result}</p>}
              {project.estimatedSavings && (
                <p className="mt-3 text-sm font-extralight text-mist">
                  Economia estimada: <span className="text-brand-300">{project.estimatedSavings}</span>
                </p>
              )}
            </div>

            <aside className="lg:col-span-4 lg:col-start-9">
              {info.length > 0 && (
                <>
                  <Eyebrow>Informações técnicas</Eyebrow>
                  <dl className="mt-5">
                    {info.map((item, index) => (
                      <div key={`${item.label}-${index}`} className="flex justify-between gap-6 border-t border-white/10 py-4 text-sm">
                        <dt className="text-ash">{item.label}</dt>
                        <dd className="text-right text-white">{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                </>
              )}
              <div className="mt-8 flex flex-col items-start gap-3">
                <ButtonLink href={`/orcamento?servico=${SERVICE_BY_CATEGORY[project.category]}`} size="lg">
                  Quero um projeto assim
                </ButtonLink>
                <ButtonLink href="/projetos" variant="ghost">
                  Voltar para projetos
                </ButtonLink>
              </div>
            </aside>
          </div>
        </Container>
      </Section>

      {others.length > 0 && (
        <Section>
          <Container>
            <h2 className="text-headline text-white">Outros projetos.</h2>
            <ul className="mt-16 grid gap-x-10 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((item) => (
                <li key={item.slug}>
                  <ProjectCard project={item} />
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      )}
    </>
  );
}
