import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo";
import { PROJECT_CATEGORY_LABELS, getProjectBySlug, projects } from "@/data/projects";
import { Container, DemoBadge, Eyebrow, Section } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { PageHero } from "@/components/sections/page-hero";
import { ProjectCard, ProjectMedia } from "@/components/projects/project-card";

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

const SERVICE_BY_CATEGORY = { solar: "solar", carregadores: "carregador", eletropostos: "eletroposto" } as const;

export default async function ProjetoPage({ params }: PageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  const related = projects.filter((item) => item.slug !== project.slug && item.category === project.category).slice(0, 3);
  const others = related.length ? related : projects.filter((item) => item.slug !== project.slug).slice(0, 3);

  return (
    <>
      <PageHero
        eyebrow={`${PROJECT_CATEGORY_LABELS[project.category]} · ${project.segment}`}
        title={project.title}
        description={project.summary}
        breadcrumb={[
          { name: "Projetos", path: "/projetos" },
          { name: project.title, path: `/projetos/${project.slug}` },
        ]}
      >
        {project.isDemo && <DemoBadge label="Projeto demonstrativo — dados ilustrativos" className="mt-8" />}
      </PageHero>

      <Section className="pt-0 sm:pt-0 lg:pt-0">
        <Container>
          <ProjectMedia project={project} className="aspect-[16/8]" priority />

          <div className="mt-20 grid gap-16 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7">
              <Eyebrow>Sobre o projeto</Eyebrow>
              <p className="mt-5 text-2xl leading-snug font-extralight text-white">{project.description}</p>

              <Eyebrow className="mt-14">Destaques</Eyebrow>
              <ul className="mt-5 space-y-3 text-lg font-extralight text-mist">
                {project.highlights.map((highlight) => (
                  <li key={highlight} className="flex gap-3">
                    <span className="mt-3 size-1 shrink-0 rounded-full bg-brand-400" aria-hidden="true" />
                    {highlight}
                  </li>
                ))}
              </ul>

              <Eyebrow className="mt-14">Resultado</Eyebrow>
              <p className="mt-5 text-lead text-white">{project.result}</p>
              <p className="mt-3 text-sm font-extralight text-mist">
                Economia estimada: <span className="text-brand-300">{project.estimatedSavings}</span>
              </p>
            </div>

            <aside className="lg:col-span-4 lg:col-start-9">
              <Eyebrow>Informações técnicas</Eyebrow>
              <dl className="mt-5">
                {[{ label: "Potência", value: project.power }, { label: "Localização", value: project.location }, ...project.technicalInfo].map((info) => (
                  <div key={info.label} className="flex justify-between gap-6 border-t border-white/10 py-4 text-sm">
                    <dt className="text-ash">{info.label}</dt>
                    <dd className="text-right text-white">{info.value}</dd>
                  </div>
                ))}
              </dl>
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
    </>
  );
}
