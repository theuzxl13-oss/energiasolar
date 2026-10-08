import { buildMetadata } from "@/lib/seo";
import { solarBenefits, solarSegments } from "@/data/solutions";
import { faqItems } from "@/data/faq";
import { Container, Section, SectionHeading } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { PageHero } from "@/components/sections/page-hero";
import { FeatureGrid } from "@/components/sections/feature-grid";
import { EnergyFlow } from "@/components/sections/energy-flow";
import { SolarSimulatorSection } from "@/components/sections/simulators-section";
import { FaqSection } from "@/components/sections/faq-section";
import { CtaBanner } from "@/components/sections/cta-banner";
import { ServiceJsonLd } from "@/components/seo/json-ld";
import { Constellation } from "@/components/illustrations/constellation";

const DESCRIPTION =
  "Projetos de energia solar fotovoltaica para residências, comércios, indústrias e propriedades rurais: dimensionamento, instalação de painéis solares, homologação e monitoramento.";

export const metadata = buildMetadata({
  title: "Energia Solar Fotovoltaica — Instalação de Painéis Solares",
  description: DESCRIPTION,
  path: "/energia-solar",
  keywords: ["sistema fotovoltaico", "energia solar residencial", "energia solar empresarial", "energia solar rural"],
});

const topics = [
  {
    title: "Como funciona",
    text: "Os módulos fotovoltaicos convertem a luz do sol em eletricidade. O inversor adapta essa energia para uso no imóvel e o excedente é injetado na rede, gerando créditos que abatem o consumo nos meses seguintes (sistema de compensação).",
  },
  {
    title: "Economia e retorno",
    text: "A redução da conta depende do consumo, da tarifa e da irradiação local. Na proposta apresentamos a estimativa de geração, a economia projetada e o prazo de retorno do investimento, com premissas claras.",
  },
  {
    title: "Vida útil",
    text: "Módulos solares costumam operar por mais de 25 anos, com garantia de desempenho do fabricante. Inversores têm vida útil menor e podem ser substituídos ao longo do período.",
  },
  {
    title: "Manutenção",
    text: "Baixa manutenção: limpezas periódicas e inspeções preventivas de conexões, estruturas e proteções mantêm a eficiência ao longo dos anos.",
  },
  {
    title: "Monitoramento",
    text: "Acompanhe a geração em tempo real pelo aplicativo do inversor. Alertas ajudam a identificar rapidamente qualquer queda de desempenho.",
  },
  {
    title: "Sustentabilidade",
    text: "Energia renovável, sem emissões durante a operação, que contribui para reduzir a pegada de carbono do seu imóvel ou empresa.",
  },
];

export default function EnergiaSolarPage() {
  return (
    <>
      <PageHero
        eyebrow="Energia solar fotovoltaica"
        title="Gere sua própria energia."
        description="Projetos de energia solar sob medida para residências, comércios, indústrias e propriedades rurais — do estudo de viabilidade ao monitoramento."
        breadcrumb={[{ name: "Energia Solar", path: "/energia-solar" }]}
        aside={<Constellation shape="sun" density={1300} label="Constelação de partículas em forma de sol" />}
        actions={
          <>
            <ButtonLink href="#simulador-solar" size="lg">
              Simular meu projeto solar
            </ButtonLink>
            <ButtonLink href="/orcamento?servico=solar" variant="ghost">
              Solicitar orçamento
            </ButtonLink>
          </>
        }
      />

      <Section>
        <Container>
          <SectionHeading eyebrow="Como funciona" title="Do sol à sua tomada, em cinco etapas." description="O caminho da energia em um sistema fotovoltaico conectado à rede (on-grid)." />
          <div className="mt-20">
            <EnergyFlow />
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeading eyebrow="Entenda" title="Tudo o que você precisa saber." />
          <dl className="mt-20 grid gap-x-10 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
            {topics.map(({ title, text }, index) => (
              <Reveal key={title} delay={index * 0.04} className="border-t border-white/10 pt-6">
                <dt className="text-2xl tracking-[-0.03em] text-white">{title}</dt>
                <dd className="mt-3 font-extralight text-mist">{text}</dd>
              </Reveal>
            ))}
          </dl>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeading eyebrow="Benefícios" title="Por que investir em energia solar?" />
          <div className="mt-20">
            <FeatureGrid items={solarBenefits} />
          </div>
        </Container>
      </Section>

      <Section id="segmentos">
        <Container>
          <SectionHeading eyebrow="Segmentos" title="Energia solar para cada necessidade." description="Cada perfil de consumo exige um projeto diferente." />
          <ol className="mt-20">
            {solarSegments.map((segment, index) => (
              <Reveal key={segment.id} as="li">
                <article className="grid gap-6 border-t border-white/10 py-10 lg:grid-cols-12 lg:gap-12">
                  <div className="lg:col-span-5">
                    <p className="label-caps text-ash">0{index + 1}</p>
                    <h3 className="text-title mt-3 text-white">{segment.title}</h3>
                  </div>
                  <div className="lg:col-span-7">
                    <p className="text-lead text-mist">{segment.description}</p>
                    <p className="mt-4 text-sm text-white">{segment.bullets.join(" · ")}</p>
                    <ButtonLink href={`/orcamento?servico=solar&imovel=${segment.id}`} variant="ghost" className="mt-4">
                      Solicitar orçamento
                    </ButtonLink>
                  </div>
                </article>
              </Reveal>
            ))}
          </ol>
        </Container>
      </Section>

      <SolarSimulatorSection />
      <FaqSection items={faqItems.filter((item) => item.category === "solar")} title="Dúvidas sobre energia solar." />
      <CtaBanner title="Pronto para economizar com energia solar?" primary={{ label: "Solicitar orçamento solar", href: "/orcamento?servico=solar" }} />
      <ServiceJsonLd name="Projeto e instalação de energia solar fotovoltaica" description={DESCRIPTION} path="/energia-solar" />
    </>
  );
}
