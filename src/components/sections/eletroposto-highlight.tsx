import { eletropostoApplications, eletropostoServices } from "@/data/solutions";
import { Container, Eyebrow, Section } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { Constellation } from "@/components/illustrations/constellation";

export function EletropostoHighlight() {
  return (
    <Section id="eletropostos">
      <Container className="grid items-center gap-16 lg:grid-cols-12 lg:gap-12">
        <div className="relative order-2 aspect-square w-full lg:order-1 lg:col-span-6">
          <Constellation shape="plug" density={1100} ambient={60} label="Constelação de partículas em forma de conector de recarga veicular" />
        </div>

        <div className="order-1 lg:order-2 lg:col-span-6">
          <Eyebrow>Área especial · Eletropostos</Eyebrow>
          <h2 className="text-headline mt-6 text-white">Transforme seu espaço em um ponto de recarga.</h2>
          <p className="text-lead mt-8 max-w-md text-mist">
            Realizamos toda a implantação de eletropostos — do estudo técnico à operação — com infraestrutura preparada para expansão futura.
          </p>

          <ul className="mt-10 grid grid-cols-2 gap-x-8 border-t border-white/10 pt-8 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            {eletropostoServices.map((service, index) => (
              <Reveal key={service.title} as="li" delay={index * 0.03} className="py-2 text-sm text-white">
                <span className="mr-2 text-ash">0{index + 1}</span>
                {service.title}
              </Reveal>
            ))}
          </ul>

          <p className="label-caps mt-10 text-ash">Aplicações</p>
          <p className="mt-3 text-sm leading-relaxed font-extralight text-mist">{eletropostoApplications.map((item) => item.label).join(" · ")}</p>

          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3">
            <ButtonLink href="/orcamento?servico=eletroposto" size="lg">
              Quero instalar um eletroposto
            </ButtonLink>
            <ButtonLink href="/eletropostos" variant="ghost">
              Como funciona
            </ButtonLink>
          </div>
        </div>
      </Container>
    </Section>
  );
}
