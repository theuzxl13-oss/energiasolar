import { buildMetadata } from "@/lib/seo";
import { eletropostoApplications, eletropostoBenefits, eletropostoServices } from "@/data/solutions";
import { eletropostoSteps } from "@/data/process";
import { Container, Section, SectionHeading } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { PageHero } from "@/components/sections/page-hero";
import { FeatureGrid } from "@/components/sections/feature-grid";
import { ProcessTimeline } from "@/components/sections/process-timeline";
import { FaqSection } from "@/components/sections/faq-section";
import { CtaBanner } from "@/components/sections/cta-banner";
import { ServiceJsonLd } from "@/components/seo/json-ld";
import { Constellation } from "@/components/illustrations/constellation";

const DESCRIPTION =
  "Implantação de eletropostos e estações de recarga para veículos elétricos: estudo técnico, projeto elétrico, infraestrutura, instalação, configuração, operação e manutenção.";

export const metadata = buildMetadata({
  title: "Eletropostos e Estações de Recarga para Veículos Elétricos",
  description: DESCRIPTION,
  path: "/eletropostos",
  keywords: ["implantação de eletroposto", "estação de recarga rápida", "carregador DC para posto"],
});

export default function EletropostosPage() {
  return (
    <>
      <PageHero
        eyebrow="Eletropostos"
        title="Transforme seu estabelecimento em um ponto de recarga."
        description="Planejamos e implantamos eletropostos completos — com carregadores AC e DC, plataforma de gestão e cobrança — para atrair clientes e criar novas receitas."
        breadcrumb={[{ name: "Eletropostos", path: "/eletropostos" }]}
        aside={<Constellation shape="bolt" density={1300} label="Constelação de partículas em forma de raio" />}
        actions={
          <>
            <ButtonLink href="/orcamento?servico=eletroposto" size="lg">
              Quero instalar um eletroposto
            </ButtonLink>
            <ButtonLink href="#implantacao" variant="ghost">
              Como funciona a implantação
            </ButtonLink>
          </>
        }
      >
        <ul className="mt-20 grid grid-cols-2 gap-x-10 gap-y-10 sm:grid-cols-4">
          {[
            { value: "AC + DC", label: "Recarga normal e rápida" },
            { value: "24/7", label: "Monitoramento remoto" },
            { value: "App", label: "Gestão e cobrança" },
            { value: "Escalável", label: "Pronto para expansão" },
          ].map((item) => (
            <li key={item.label} className="border-t border-white/10 pt-5">
              <p className="text-3xl tracking-[-0.04em] text-white">{item.value}</p>
              <p className="mt-1 text-sm font-extralight text-mist">{item.label}</p>
            </li>
          ))}
        </ul>
      </PageHero>

      <Section>
        <Container>
          <SectionHeading
            eyebrow="Vantagens"
            title="Por que ter um eletroposto?"
            description="A recarga de veículos elétricos se torna um diferencial competitivo e um novo serviço para o seu negócio."
          />
          <div className="mt-20">
            <FeatureGrid items={eletropostoBenefits} columns="sm:grid-cols-2 lg:grid-cols-3" />
          </div>
        </Container>
      </Section>

      <ProcessTimeline
        id="implantacao"
        steps={eletropostoSteps}
        eyebrow="Implantação"
        title="Como funciona a implantação."
        description="Um processo completo, conduzido por engenharia especializada, do estudo do local ao suporte contínuo."
      />

      <Section>
        <Container>
          <SectionHeading eyebrow="Escopo" title="O que fazemos no seu eletroposto." />
          <div className="mt-20">
            <FeatureGrid items={eletropostoServices} />
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeading eyebrow="Aplicações" title="Onde instalar um eletroposto." description="Locais com fluxo de veículos e permanência adequada são ideais para recarga." />
          <ul className="mt-16 flex flex-wrap gap-x-10 gap-y-4">
            {eletropostoApplications.map((application, index) => (
              <Reveal key={application.label} as="li" delay={index * 0.03} className="text-3xl tracking-[-0.04em] text-white sm:text-4xl">
                {application.label}
                <span className="text-brand-400">.</span>
              </Reveal>
            ))}
          </ul>
          <ButtonLink href="/orcamento?servico=eletroposto" variant="ghost" className="mt-12 text-white">
            Solicitar estudo do meu local
          </ButtonLink>
        </Container>
      </Section>

      <FaqSection category="eletropostos" title="Dúvidas sobre eletropostos." />
      <CtaBanner
        title="Seu estabelecimento pronto para a mobilidade elétrica."
        description="Agende uma análise técnica do local e receba um estudo com a solução recomendada."
        primary={{ label: "Quero instalar um eletroposto", href: "/orcamento?servico=eletroposto" }}
        whatsappMessage="Olá! Acessei o site e gostaria de informações sobre a implantação de um eletroposto."
      />
      <ServiceJsonLd name="Implantação de eletropostos" description={DESCRIPTION} path="/eletropostos" />
    </>
  );
}
