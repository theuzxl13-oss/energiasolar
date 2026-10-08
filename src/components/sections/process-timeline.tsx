import { customerJourney } from "@/data/process";
import { Container, Section, SectionHeading } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/reveal";
import type { ProcessStep } from "@/types";

interface ProcessTimelineProps {
  steps?: ProcessStep[];
  eyebrow?: string;
  title?: React.ReactNode;
  description?: string;
  tone?: "muted" | "dark";
  id?: string;
}

/** Timeline tipográfica: cada etapa é uma linha com número monumental. */
export function ProcessTimeline({
  steps = customerJourney,
  eyebrow = "Como trabalhamos",
  title = "Do primeiro contato ao suporte contínuo.",
  description = "Um processo claro e transparente, com acompanhamento em todas as etapas.",
  id = "processo",
}: ProcessTimelineProps) {
  return (
    <Section id={id}>
      <Container>
        <SectionHeading eyebrow={eyebrow} title={title} description={description} />
        <ol className="mt-20 lg:mt-28">
          {steps.map((step, index) => (
            <Reveal key={step.step} as="li" delay={Math.min(index * 0.04, 0.2)}>
              <div className="group grid grid-cols-[4.5rem_1fr] items-baseline gap-x-6 border-t border-white/10 py-8 sm:grid-cols-[7rem_1fr_1fr] lg:grid-cols-12 lg:gap-x-12">
                <span className="text-4xl tracking-[-0.04em] text-ash transition-colors group-hover:text-brand-400 sm:text-5xl lg:col-span-2">
                  {String(step.step).padStart(2, "0")}
                </span>
                <h3 className="text-2xl tracking-[-0.02em] text-white sm:text-3xl lg:col-span-5">{step.title}</h3>
                <p className="col-start-2 mt-2 font-extralight text-mist sm:col-start-3 sm:mt-0 lg:col-span-5">{step.description}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
