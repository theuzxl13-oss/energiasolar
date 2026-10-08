import { faqItems } from "@/data/faq";
import type { FaqItem } from "@/types";
import { Container, Eyebrow, Section } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { Accordion } from "@/components/ui/accordion";
import { FaqJsonLd } from "@/components/seo/json-ld";

interface FaqSectionProps {
  items?: FaqItem[];
  title?: string;
  tone?: "light" | "muted";
}

export function FaqSection({ items = faqItems, title = "Perguntas frequentes." }: FaqSectionProps) {
  return (
    <Section id="faq">
      <Container className="grid gap-14 lg:grid-cols-12 lg:gap-12">
        <div className="lg:sticky lg:top-28 lg:col-span-5 lg:self-start">
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="text-headline mt-6 text-white">{title}</h2>
          <p className="text-lead mt-8 max-w-sm text-mist">Respostas objetivas para as dúvidas mais comuns. Para o seu caso, fale com um especialista.</p>
          <ButtonLink href="/contato" variant="ghost" className="mt-6">
            Ainda tem dúvidas? Fale conosco
          </ButtonLink>
        </div>
        <div className="lg:col-span-7">
          <Accordion items={items.map((item) => ({ id: item.id, title: item.question, content: item.answer }))} />
        </div>
      </Container>
      <FaqJsonLd items={items} />
    </Section>
  );
}
