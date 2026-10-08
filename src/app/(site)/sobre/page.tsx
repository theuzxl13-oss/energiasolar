import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/config/site";
import { Container, Eyebrow, Section, SectionHeading } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { PageHero } from "@/components/sections/page-hero";
import { FeatureGrid } from "@/components/sections/feature-grid";
import { WhyChooseSection } from "@/components/sections/why-choose";
import { ProcessTimeline } from "@/components/sections/process-timeline";
import { CtaBanner } from "@/components/sections/cta-banner";
import { Constellation } from "@/components/illustrations/constellation";
import type { FeatureItem } from "@/types";

export const metadata = buildMetadata({
  title: "Sobre a Empresa",
  description: `Conheça a ${siteConfig.name}: soluções completas em energia solar fotovoltaica, carregadores para veículos elétricos e eletropostos.`,
  path: "/sobre",
});

const pillars = [
  {
    title: "Missão",
    text: "Acelerar a transição energética de pessoas e empresas com soluções de energia limpa e mobilidade elétrica seguras, eficientes e economicamente viáveis.",
  },
  {
    title: "Visão",
    text: "Ser referência regional em projetos integrados de geração solar e infraestrutura de recarga, reconhecida pela qualidade técnica e pelo atendimento.",
  },
  {
    title: "Valores",
    text: "Ética, transparência, segurança, compromisso com prazos, inovação e respeito ao meio ambiente em cada projeto.",
  },
];

const values: FeatureItem[] = [
  { title: "Engenharia aplicada", description: "Cada projeto parte de dados reais de consumo, local e infraestrutura.", icon: "hardhat" },
  { title: "Integração solar + recarga", description: "Projetos que combinam geração própria e mobilidade elétrica.", icon: "network" },
  { title: "Atendimento consultivo", description: "Explicamos opções e premissas para decisões seguras.", icon: "handshake" },
  { title: "Visão de longo prazo", description: "Sistemas preparados para manutenção e expansão futura.", icon: "trending" },
];

export default function SobrePage() {
  return (
    <>
      <PageHero
        eyebrow="Sobre nós"
        title="Engenharia a serviço da energia limpa."
        description={`A ${siteConfig.name} desenvolve soluções completas em energia solar fotovoltaica, carregadores para veículos elétricos e eletropostos — unindo tecnologia, sustentabilidade e economia.`}
        breadcrumb={[{ name: "Sobre", path: "/sobre" }]}
        aside={<Constellation shape="sun" density={1100} label="Constelação de partículas em forma de sol" />}
      />

      <Section>
        <Container className="grid gap-16 lg:grid-cols-12 lg:gap-12">
          <h2 className="text-headline text-white lg:col-span-6">Energia e mobilidade, em um só parceiro.</h2>
          {/* Texto institucional modelo — revisar com a história real da empresa. */}
          <div className="space-y-6 text-lead text-mist lg:col-span-5 lg:col-start-8">
            <Eyebrow>Nossa história</Eyebrow>
            <p>
              Nascemos com o propósito de simplificar o acesso à energia limpa. Atuamos desde o estudo de viabilidade até a manutenção, para que nossos
              clientes tenham um único ponto de contato em todas as etapas.
            </p>
            <p>
              Com o crescimento dos veículos elétricos, expandimos nossa atuação para a infraestrutura de recarga: wallbox residencial, soluções para
              condomínios, empresas, frotas e eletropostos — muitas vezes integradas à geração solar.
            </p>
            <p>Nosso compromisso é entregar projetos seguros, eficientes e transparentes, com suporte contínuo após a instalação.</p>
            <ButtonLink href="/orcamento" variant="ghost" className="text-white">
              Fale com nossa equipe
            </ButtonLink>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <ul className="grid gap-x-10 gap-y-14 md:grid-cols-3">
            {pillars.map(({ title, text }, index) => (
              <Reveal key={title} as="li" delay={index * 0.08} className="border-t border-white/10 pt-6">
                <h2 className="text-title text-white">{title}</h2>
                <p className="mt-4 font-extralight text-mist">{text}</p>
              </Reveal>
            ))}
          </ul>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeading eyebrow="Diferenciais" title="Como trabalhamos." />
          <div className="mt-20">
            <FeatureGrid items={values} />
          </div>
        </Container>
      </Section>

      <WhyChooseSection />
      <ProcessTimeline />
      <CtaBanner />
    </>
  );
}
