"use client";

import Link from "next/link";
import { useSolutions } from "@/hooks/use-site-content";
import { Container, Section, SectionHeading } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";

/** Soluções em linhas tipográficas: número + título à esquerda, conteúdo à direita. */
export function SolutionsSection() {
  const { items: solutions } = useSolutions();
  return (
    <Section id="solucoes">
      <Container>
        <SectionHeading
          eyebrow="Nossas soluções"
          title="Gerar, armazenar e usar energia limpa."
          description="Da geração solar à recarga do seu veículo elétrico: engenharia, instalação e suporte em um só lugar."
        />

        <ol className="mt-20 lg:mt-28">
          {solutions.map((solution, index) => (
            <Reveal key={solution.id} as="li">
              <article className="grid gap-8 border-t border-white/10 py-12 lg:grid-cols-12 lg:gap-12 lg:py-16">
                <div className="lg:col-span-6">
                  <p className="label-caps text-ash">
                    {String(index + 1).padStart(2, "0")}
                    {solution.eyebrow && ` — ${solution.eyebrow}`}
                  </p>
                  <h3 className="text-title mt-4 text-white">
                    {solution.href ? (
                      <Link href={solution.href} className="transition-colors hover:text-brand-300">
                        {solution.title}
                      </Link>
                    ) : (
                      solution.title
                    )}
                  </h3>
                </div>
                <div className="lg:col-span-6">
                  <p className="text-lead text-mist">{solution.description}</p>
                  {solution.tags.length > 0 && (
                    <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white">
                      {solution.tags.map((tag) => (
                        <li key={tag.label} className="flex items-center gap-2">
                          <span className="size-1 rounded-full bg-brand-400" aria-hidden="true" />
                          {tag.label}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-8 flex flex-wrap gap-x-8">
                    {solution.cta.label && solution.cta.href && (
                      <ButtonLink href={solution.cta.href} variant="ghost" className="text-white">
                        {solution.cta.label}
                      </ButtonLink>
                    )}
                    {solution.href && (
                      <ButtonLink href={solution.href} variant="ghost">
                        Saiba mais
                      </ButtonLink>
                    )}
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
