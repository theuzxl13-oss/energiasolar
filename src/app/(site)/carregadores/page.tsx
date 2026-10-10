import { buildMetadata } from "@/lib/seo";
import { chargerExamples, chargingCategories } from "@/data/solutions";
import { Container, Section, SectionHeading } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { PageHero } from "@/components/sections/page-hero";
import { ChargerSimulatorSection } from "@/components/sections/simulators-section";
import { FaqSection } from "@/components/sections/faq-section";
import { CtaBanner } from "@/components/sections/cta-banner";
import { ServiceJsonLd } from "@/components/seo/json-ld";
import { Constellation } from "@/components/illustrations/constellation";

const DESCRIPTION =
  "Instalação de carregadores para carro elétrico: wallbox residencial, carregadores AC e DC para empresas, condomínios, estacionamentos e frotas, com infraestrutura elétrica completa.";

export const metadata = buildMetadata({
  title: "Carregadores para Veículos Elétricos e Instalação de Wallbox",
  description: DESCRIPTION,
  path: "/carregadores",
  keywords: ["carregador para condomínio", "carregador DC", "carregador AC", "recarga de veículos elétricos"],
});

const comparison = [
  { label: "Tipo de corrente", ac: "Alternada (AC) — conversão feita no carro", dc: "Contínua (DC) — conversão feita no carregador" },
  { label: "Potência típica", ac: "7,4 a 22 kW", dc: "40 a 150 kW ou mais" },
  { label: "Tempo de recarga", ac: "Algumas horas (ideal para pernoite)", dc: "Minutos a cerca de 1 hora" },
  { label: "Aplicação", ac: "Residências, condomínios, empresas", dc: "Eletropostos, rodovias, frotas" },
  { label: "Infraestrutura", ac: "Circuito dedicado, geralmente sem grandes obras", dc: "Pode exigir adequação de entrada ou transformador" },
];

export default function CarregadoresPage() {
  return (
    <>
      <PageHero
        eyebrow="Carregadores para veículos elétricos"
        title="Recarga onde você precisar."
        description="Wallbox residencial, carregadores AC e DC e toda a infraestrutura elétrica para recarregar com segurança em casa, na empresa, no condomínio ou na frota."
        breadcrumb={[{ name: "Carregadores", path: "/carregadores" }]}
        aside={<Constellation shape="plug" density={1200} label="Constelação de partículas em forma de conector de recarga" />}
        actions={
          <>
            <ButtonLink href="/orcamento?servico=carregador" size="lg">
              Solicitar projeto de carregador
            </ButtonLink>
            <ButtonLink href="#simulador-carregador" variant="ghost">
              Simular carregador ideal
            </ButtonLink>
          </>
        }
      />

      <Section>
        <Container>
          <SectionHeading
            eyebrow="Soluções de recarga"
            title="Uma solução para cada tipo de uso."
            description="As diferenças entre os principais cenários de recarga e qual atende melhor à sua necessidade."
          />
          <ol className="mt-20">
            {chargingCategories.map((category, index) => (
              <Reveal key={category.id} as="li">
                <article id={category.id} className="grid gap-6 border-t border-white/10 py-12 lg:grid-cols-12 lg:gap-12">
                  <div className="lg:col-span-5">
                    <p className="label-caps text-ash">
                      0{index + 1} · {category.current} · {category.power}
                    </p>
                    <h3 className="text-title mt-3 text-white">{category.title}</h3>
                    <p className="label-caps mt-3 text-brand-400">{category.subtitle}</p>
                  </div>
                  <div className="lg:col-span-7">
                    <p className="text-lead text-mist">{category.description}</p>
                    <p className="mt-4 text-sm text-white">{category.features.join(" · ")}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </ol>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeading eyebrow="Equipamentos" title="Exemplos de carregadores." description="Modelos e marcas são definidos no projeto, conforme a aplicação e a infraestrutura disponível." />
          <ul className="mt-20 grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
            {chargerExamples.map((example, index) => (
              <Reveal key={example.name} as="li" delay={index * 0.06} className="border-t border-white/10 pt-6">
                <p className="label-caps text-ash">{example.type}</p>
                <h3 className="mt-4 text-2xl tracking-[-0.03em] text-white">{example.name}</h3>
                <p className="mt-2 text-4xl tracking-[-0.04em] text-brand-300">{example.power}</p>
                <p className="mt-3 text-sm font-extralight text-mist">{example.use}</p>
              </Reveal>
            ))}
          </ul>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeading eyebrow="Comparativo" title="Carregamento AC × DC." description="Diferenças essenciais para escolher a tecnologia certa." />
          <div className="mt-16 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <caption className="sr-only">Comparativo entre carregamento AC e DC</caption>
              <thead>
                <tr className="label-caps text-spark">
                  <th scope="col" className="py-4 pr-6 font-semibold">Característica</th>
                  <th scope="col" className="py-4 pr-6 font-semibold">Carregamento AC</th>
                  <th scope="col" className="py-4 font-semibold">Carregamento DC</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.label} className="border-t border-white/10">
                    <th scope="row" className="py-5 pr-6 align-top font-normal text-white">{row.label}</th>
                    <td className="py-5 pr-6 align-top font-extralight text-mist">{row.ac}</td>
                    <td className="py-5 align-top font-extralight text-mist">{row.dc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </Section>

      <ChargerSimulatorSection />
      <FaqSection category="carregadores" title="Dúvidas sobre carregadores." />
      <CtaBanner
        title="Vamos instalar o seu carregador?"
        description="Avaliamos sua instalação elétrica e indicamos a solução de recarga mais segura e eficiente."
        primary={{ label: "Solicitar avaliação técnica", href: "/orcamento?servico=carregador" }}
      />
      <ServiceJsonLd name="Instalação de carregadores para veículos elétricos" description={DESCRIPTION} path="/carregadores" />
    </>
  );
}
