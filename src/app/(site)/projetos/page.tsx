import { buildMetadata } from "@/lib/seo";
import { projects } from "@/data/projects";
import { Container, DemoBadge, Section } from "@/components/ui/primitives";
import { PageHero } from "@/components/sections/page-hero";
import { ProjectsGallery } from "@/components/projects/projects-gallery";
import { CtaBanner } from "@/components/sections/cta-banner";

export const metadata = buildMetadata({
  title: "Projetos de Energia Solar, Carregadores e Eletropostos",
  description: "Conheça exemplos de projetos de energia solar residencial, comercial e industrial, instalação de wallbox, infraestrutura para condomínios e eletropostos.",
  path: "/projetos",
});

export default function ProjetosPage() {
  const hasDemo = projects.some((project) => project.isDemo);
  return (
    <>
      <PageHero
        eyebrow="Portfólio"
        title="Projetos de energia e mobilidade."
        description="Soluções em energia solar, carregadores veiculares e eletropostos para diferentes segmentos e portes."
        breadcrumb={[{ name: "Projetos", path: "/projetos" }]}
      />
      <Section className="pt-0 sm:pt-0 lg:pt-0">
        <Container>
          {hasDemo && (
            <p className="mb-12 flex max-w-2xl flex-wrap items-center gap-3 text-sm font-extralight text-mist">
              <DemoBadge label="Projetos demonstrativos" />
              Exemplos ilustrativos para apresentação, que serão substituídos por casos reais da empresa.
            </p>
          )}
          <ProjectsGallery projects={projects} />
        </Container>
      </Section>
      <CtaBanner title="Quer um projeto como esses?" description="Conte sua necessidade e receba uma proposta técnica personalizada." />
    </>
  );
}
