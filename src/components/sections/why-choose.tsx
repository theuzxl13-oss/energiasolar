import { companyStats } from "@/config/stats";
import { siteConfig } from "@/config/site";
import { Container, DemoBadge, Section, SectionHeading } from "@/components/ui/primitives";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Reveal } from "@/components/ui/reveal";
import type { FeatureItem } from "@/types";

const differentials: FeatureItem[] = [
  { title: "Engenharia própria", description: "Projetos dimensionados tecnicamente para cada imóvel e necessidade.", icon: "hardhat" },
  { title: "Solução completa", description: "Energia solar, recarga e eletropostos com um único parceiro.", icon: "network" },
  { title: "Segurança e normas", description: "Instalações executadas seguindo as normas técnicas aplicáveis.", icon: "shield" },
  { title: "Suporte pós-venda", description: "Monitoramento, manutenção preventiva e atendimento técnico.", icon: "headset" },
  { title: "Transparência", description: "Propostas claras, com premissas e estimativas explicadas.", icon: "file" },
  { title: "Tecnologia", description: "Equipamentos com monitoramento e gestão inteligente de energia.", icon: "cpu" },
];

export function WhyChooseSection() {
  const hasDemoStats = companyStats.some((stat) => stat.isDemo);
  return (
    <Section id="por-que-escolher">
      <Container>
        <SectionHeading
          eyebrow="Por que escolher"
          title={`Por que escolher a ${siteConfig.name}?`}
          description="Combinamos engenharia, tecnologia e atendimento próximo para entregar projetos que funcionam por décadas."
        />

        <ul className="mt-20 grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:mt-28 lg:grid-cols-4">
          {companyStats.map((stat, index) => (
            <Reveal key={stat.id} as="li" delay={index * 0.06} className="border-t border-white/10 pt-6">
              <p className="text-headline text-white">
                {stat.prefix}
                <AnimatedNumber value={stat.value} />
                <span className="text-ash">{stat.suffix}</span>
              </p>
              <p className="mt-3 text-sm font-extralight text-mist">{stat.label}</p>
              {stat.isDemo && <DemoBadge className="mt-4" />}
            </Reveal>
          ))}
        </ul>
        {hasDemoStats && (
          <p className="mt-8 text-xs text-ash">Indicadores ilustrativos para demonstração. Os números oficiais serão exibidos após validação pela empresa.</p>
        )}

        <ul className="mt-24 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {differentials.map((item, index) => (
            <Reveal key={item.title} as="li" delay={index * 0.05}>
              <h3 className="text-2xl tracking-[-0.02em] text-white">{item.title}</h3>
              <p className="mt-2 font-extralight text-mist">{item.description}</p>
            </Reveal>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
