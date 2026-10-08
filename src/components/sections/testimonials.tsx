import { getTestimonials } from "@/services/reviews";
import { Container, DemoBadge, Section, SectionHeading } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/reveal";

export async function TestimonialsSection() {
  const { testimonials, source } = await getTestimonials();
  const isDemo = source === "demo";

  return (
    <Section id="depoimentos">
      <Container>
        <SectionHeading
          eyebrow={isDemo ? "Depoimentos demonstrativos" : "Avaliações"}
          title="O que nossos clientes dizem."
          description={
            isDemo
              ? "Área preparada para avaliações reais (Google ou depoimentos autorizados). Os textos abaixo são apenas ilustrativos."
              : "Avaliações de clientes atendidos pela nossa equipe."
          }
        />
        <ul className="mt-20 grid gap-x-10 gap-y-14 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Reveal key={testimonial.id} as="li" delay={index * 0.08}>
              <figure className="flex h-full flex-col border-t border-white/10 pt-8">
                <p className="text-spark" aria-label={`${testimonial.rating} de 5 estrelas`}>
                  {"★".repeat(testimonial.rating)}
                  <span className="text-white/20">{"★".repeat(5 - testimonial.rating)}</span>
                </p>
                <blockquote className="mt-6 flex-1 text-xl leading-snug font-extralight text-white">“{testimonial.content}”</blockquote>
                <figcaption className="mt-8">
                  <span className="block text-white">{testimonial.author}</span>
                  <span className="label-caps mt-1 block text-brand-400">{testimonial.role}</span>
                  {testimonial.source === "demo" && <DemoBadge label="Depoimento demonstrativo" className="mt-4" />}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
