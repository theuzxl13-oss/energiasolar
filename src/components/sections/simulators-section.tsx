import { Container, Section, SectionHeading } from "@/components/ui/primitives";
import { SolarSimulator } from "@/components/simulators/solar-simulator";
import { ChargerSimulator } from "@/components/simulators/charger-simulator";

export function SolarSimulatorSection(_props: { tone?: "light" | "muted" }) {
  return (
    <Section id="simulador-solar">
      <Container>
        <SectionHeading
          eyebrow="Simulador solar"
          title="Quanto você pode economizar com o sol?"
          description="Informe o valor médio da sua conta e receba uma estimativa da economia, potência do sistema e quantidade de painéis."
        />
        <div className="mt-16 lg:mt-24">
          <SolarSimulator />
        </div>
      </Container>
    </Section>
  );
}

export function ChargerSimulatorSection(_props: { tone?: "light" | "muted" }) {
  return (
    <Section id="simulador-carregador">
      <Container>
        <SectionHeading
          eyebrow="Simulador de carregador"
          title="O carregador ideal para o seu veículo."
          description="Residência, condomínio, empresa ou frota: indicamos a solução de recarga mais adequada para começar."
        />
        <div className="mt-16 lg:mt-24">
          <ChargerSimulator />
        </div>
      </Container>
    </Section>
  );
}
