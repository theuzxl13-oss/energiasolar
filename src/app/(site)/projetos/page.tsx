import { buildMetadata } from "@/lib/seo";
import { Container, Section } from "@/components/ui/primitives";
import { PageHero } from "@/components/sections/page-hero";
import { ProjectsGallery } from "@/components/projects/projects-gallery";
import { CtaBanner } from "@/components/sections/cta-banner";

export const metadata = buildMetadata({
  title: "Projetos de Energia Solar, Carregadores e Eletropostos",
  description: "Conheça exemplos de projetos de energia solar residencial, comercial e industrial, instalação de wallbox, infraestrutura para condomínios e eletropostos.",
  path: "/projetos",
});

export default function ProjetosPage() {
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
          <ProjectsGallery />
        </Container>
      </Section>
      <CtaBanner title="Quer um projeto como esses?" description="Conte sua necessidade e receba uma proposta técnica personalizada." />
    </>
  );
}
