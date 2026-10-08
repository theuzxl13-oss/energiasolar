import { Suspense } from "react";
import { Clock, FileText, ShieldCheck, Sparkles } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/config/site";
import { Container, Section } from "@/components/ui/primitives";
import { PageHero } from "@/components/sections/page-hero";
import { QuoteForm } from "@/components/forms/quote-form";
import { QuoteFormFromUrl } from "@/components/forms/quote-form-from-url";

export const metadata = buildMetadata({
  title: "Solicitar Orçamento — Energia Solar, Carregadores e Eletropostos",
  description: "Solicite um orçamento sem compromisso para energia solar, carregador de carro elétrico, wallbox, condomínio, frota ou eletroposto.",
  path: "/orcamento",
});

const reasons = [
  { icon: Sparkles, title: "Sem compromisso", text: "Análise inicial gratuita da sua necessidade." },
  { icon: FileText, title: "Proposta clara", text: "Técnica e comercial, com premissas explicadas." },
  { icon: ShieldCheck, title: "Dados protegidos", text: "Usados apenas para o seu atendimento." },
  { icon: Clock, title: "Retorno rápido", text: "Contato da equipe em horário comercial." },
];

export default function OrcamentoPage() {
  return (
    <>
      <PageHero
        eyebrow="Orçamento sem compromisso"
        title="Solicite seu orçamento."
        description="Preencha o formulário e receba uma proposta personalizada para energia solar, carregadores ou eletropostos."
        breadcrumb={[{ name: "Orçamento", path: "/orcamento" }]}
      />
      <Section className="pt-0 sm:pt-0 lg:pt-0">
        <Container className="grid gap-20 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <Suspense fallback={<QuoteForm />}>
              <QuoteFormFromUrl />
            </Suspense>
          </div>
          <aside className="lg:col-span-4 lg:col-start-9">
            <ul>
              {reasons.map(({ icon: IconComponent, title, text }) => (
                <li key={title} className="flex gap-4 border-t border-white/10 py-6">
                  <IconComponent className="mt-1 size-5 shrink-0 text-brand-400" strokeWidth={1.5} aria-hidden="true" />
                  <div>
                    <p className="text-lg text-white">{title}</p>
                    <p className="mt-1 text-sm font-extralight text-mist">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-white/10 pt-6 text-sm font-extralight text-mist">
              <p className="label-caps text-spark">Prefere falar agora?</p>
              <p className="mt-3">
                Telefone: <a href={`tel:${siteConfig.contact.phoneHref}`} className="text-white hover:text-brand-300">{siteConfig.contact.phoneDisplay}</a>
              </p>
              <p className="mt-1">
                E-mail: <a href={`mailto:${siteConfig.contact.email}`} className="break-all text-white hover:text-brand-300">{siteConfig.contact.email}</a>
              </p>
            </div>
          </aside>
        </Container>
      </Section>
    </>
  );
}
